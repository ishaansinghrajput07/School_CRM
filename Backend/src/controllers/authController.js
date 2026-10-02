const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/Student");
const AdmissionApplication = require("../models/AdmissionApplication");
const { applyFeeStructuresToStudent } = require("../utils/applyFeeStructures");
const { sendEmail } = require("../utils/sendEmail");

// @desc    Login admin or student
// @route   POST /api/auth/login
// @access  Public
// NOTE: credential verification itself (lockout counter, bcrypt compare,
// isActive check) now happens inside the passport-local Strategy in
// config/passport.js - passport.authenticate('local', ...) runs BEFORE this
// handler in the route chain (see routes/authRoutes.js) and only calls next()
// with req.user already set. By the time this function runs, req.login()
// has already been called too, so req.session.passport.user is written and
// the session is persisted. This handler's only job is shaping the
// JSON response - re-populate "student" here since deserializeUser
// deliberately keeps req.user lean (see the comment there).
const login = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+avatar").populate("student");

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      avatar: user.avatar,
      student: user.student || null,
    },
  });
});

// @desc    Log out the current session
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res, next) => {
  // req.logout() (Passport 0.6+) clears req.user and the passport data
  // inside req.session - it needs a callback because it can touch the store.
  req.logout((err) => {
    if (err) return next(err);
    // Also destroy the whole session record, not just the
    // passport portion of it - otherwise an empty session row lingers.
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie(process.env.SESSION_COOKIE_NAME || "sid");
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
};

// @desc    Register a new user (admin-only: creates staff or student logins)
// @route   POST /api/auth/register
// @access  Private/Admin
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, designation, studentId } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
    designation: role === "admin" ? designation : null,
    student: role === "student" ? studentId : undefined,
  });

  if (role === "student" && studentId) {
    await Student.findByIdAndUpdate(studentId, { user: user._id });
  }

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Student self-signup - creates the Student profile + login in one step,
//          auto-generates a digital ID card number, and logs the student in immediately
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    email,
    password,
    confirmPassword,
    mobile,
    parentMobile,
    mobileVerifyToken,
    parentMobileVerifyToken,
    dob,
    gender,
    address,
    classId,
    section,
    branch,
    semester,
    rollNumber,
    admissionNumber,
    academicYear,
    passingYear,
    subjects,
  } = req.body;

  const required = { fullName, email, password, mobile, parentMobile, admissionNumber };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    res.status(400);
    throw new Error(`Missing required field(s): ${missing.join(", ")}`);
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Password and confirm password do not match");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  // Both mobile numbers must carry a valid, freshly-issued OTP verification
  // token (see /api/otp/verify) - proves the applicant actually controls
  // these numbers before we create student + digital ID.
  //
  // Verification itself is OPTIONAL, not required, to submit: if a token
  // wasn't provided at all, we just skip the check rather than blocking
  // signup on it. But if one WAS provided, it must actually be valid -
  // there's no point half-trusting a token that's expired or forged.
  const checkVerified = (token, expectedMobile, expectedPurpose, label) => {
    if (!token) return;
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.status(400);
      throw new Error(`${label} verification has expired - verify again, or leave it unverified`);
    }
    if (payload.mobile !== expectedMobile || payload.purpose !== expectedPurpose) {
      res.status(400);
      throw new Error(`${label} verification does not match the number provided`);
    }
  };
  checkVerified(mobileVerifyToken, mobile, "signup_student_mobile", "Mobile number");
  checkVerified(parentMobileVerifyToken, parentMobile, "signup_parent_mobile", "Parent mobile number");

  const [existingEmail, existingAdmission, application] = await Promise.all([
    User.findOne({ email: email.toLowerCase() }),
    Student.findOne({ admissionNumber }),
    AdmissionApplication.findOne({ assignedAdmissionNumber: admissionNumber, status: "approved" }),
  ]);
  if (existingEmail) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }
  if (existingAdmission) {
    res.status(400);
    throw new Error("This admission number is already registered");
  }
  // The admission number must correspond to an application the school has
  // actually approved - this is what stops anyone from typing in a made-up
  // number and creating a portal account without ever having applied.
  if (!application) {
    res.status(400);
    throw new Error("This admission number wasn't found. If you believe this is a mistake, please contact the school office.");
  }
  if (application.enrolledStudent) {
    res.status(400);
    throw new Error("An account has already been created for this admission number.");
  }

  // Digital Student ID: unique per year, generated server-side (not user-editable)
  const cardNumber = `STU-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const [firstName, ...rest] = fullName.trim().split(" ");

  const student = await Student.create({
    admissionNumber,
    rollNumber,
    firstName,
    lastName: rest.join(" "),
    dob: dob || undefined,
    gender: gender || undefined,
    phone: mobile,
    phoneVerified: Boolean(mobileVerifyToken),
    address,
    class: classId || undefined,
    section,
    branch,
    semester,
    academicYear,
    passingYear,
    subjects: Array.isArray(subjects) ? subjects : String(subjects || "").split(",").map((s) => s.trim()).filter(Boolean),
    parent: { phone: parentMobile, phoneVerified: Boolean(parentMobileVerifyToken) },
    idCard: {
      cardNumber,
      issuedDate: new Date(),
      validTill: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  const user = await User.create({
    name: fullName,
    email,
    password,
    role: "student",
    student: student._id,
  });

  student.user = user._id;
  await student.save();

  application.enrolledStudent = student._id;
  application.enrolledAt = new Date();
  await application.save();

  user.lastLogin = new Date();
  await user.save();

  if (classId) await applyFeeStructuresToStudent(student._id, classId);

  const populated = await Student.findById(student._id);

  // Auto-login, same as a normal /login success: req.login() is Passport's
  // manual hook for "treat this user as authenticated" - it triggers
  // serializeUser() and writes req.session.passport.user, which
  // express-session then persists it before the response is sent.
  req.login(user, (err) => {
    if (err) return next(err);
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        student: populated,
      },
    });
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+avatar").populate("student");
  res.json({ success: true, user });
});

// @desc    Change own password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
});

// @desc    Update own basic profile info (avatar, phone) - available to
//          every role. Deliberately does NOT allow changing email/role/etc.
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { avatar, phone, name } = req.body;
  const user = await User.findById(req.user._id).select("+avatar");
  if (avatar !== undefined) user.avatar = avatar;
  if (phone !== undefined) user.phone = phone;
  if (name !== undefined && name.trim()) user.name = name.trim();
  await user.save();

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      avatar: user.avatar,
      phone: user.phone,
    },
  });
});

// @desc    Request a password reset email (works for admin/teacher/student/parent)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return the same response whether or not the account exists -
  // otherwise this endpoint becomes a way to check which emails are registered.
  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a password reset link has been sent.",
  };

  if (!user) {
    res.json(genericResponse);
    return;
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // CLIENT_URL may be a comma-separated list (see server.js) - use the first
  // entry as the canonical frontend URL for building the reset link.
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/+$/, "");
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  try {
    const info = await sendEmail({
      to: user.email,
      subject: "Password Reset - St. Thomas Convent Hr. Sec. School Indore",
      html: `
        <p>Dear ${user.name},</p>
        <p>We received a request to reset your School ERP password. This link expires in 30 minutes:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can safely ignore this email - your password will remain unchanged.</p>
        <p>Thank you,<br/>St. Thomas Convent Hr. Sec. School Indore</p>
      `,
    });

    // sendEmail() doesn't throw when SMTP isn't configured - it resolves with
    // { skipped: true } and just logs a one-line warning (same pattern as the
    // OTP flow's SMS fallback). Without this, the token would be created and
    // the person would see the generic "reset link sent" success message
    // with genuinely no way to ever get the actual link. Printing it here
    // makes local/dev testing possible before SMTP is set up.
    if (info?.skipped) {
      console.warn("==============================================================");
      console.warn(`SMTP not configured - password reset link for ${user.email}:`);
      console.warn(resetUrl);
      console.warn("Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to actually email this instead.");
      console.warn("==============================================================");
    }
  } catch (err) {
    // Roll back the token so a broken mail server doesn't leave a dangling,
    // unreachable reset link active on the account.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Failed to send password reset email:", err.message);
  }

  res.json(genericResponse);
});

// @desc    Reset password using the token emailed by forgotPassword
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) {
    res.status(400);
    throw new Error("This reset link is invalid or has expired. Please request a new one.");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  res.json({ success: true, message: "Password reset successfully. You can now log in." });
});

module.exports = { login, logout, signup, register, getMe, changePassword, updateMe, forgotPassword, resetPassword };