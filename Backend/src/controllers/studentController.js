const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Student = require("../models/Student");
const User = require("../models/User");
const Class = require("../models/Class");
const Mark = require("../models/Mark");
const { applyFeeStructuresToStudent } = require("../utils/applyFeeStructures");
const { emitToUser } = require("../utils/realtime");

// Generates a readable one-time password like "Sh4rp-Kite92" so it's easy to
// hand to a parent/student without looking like line noise.
const generateTempPassword = () => {
  const words = ["Falcon", "Ember", "Nova", "Cedar", "Quartz", "Harbor", "Delta", "Willow"];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = crypto.randomInt(1000, 9999);
  return `${word}${digits}!`;
};

// @desc    List / search / filter students
// @route   GET /api/students
// @access  Private/Admin
const getStudents = asyncHandler(async (req, res) => {
  const { search, class: classId, section, status, page = 1, limit = 20 } = req.query;
  const query = {};

  if (search) query.$text = { $search: search };
  if (classId) query.class = classId;
  if (section) query.section = section;
  if (status) query.status = status;

  // photo is a base64 data URI (student photos can be up to ~2.7MB once
  // base64-encoded) - including it on every row of every list request (this
  // endpoint powers admin/teacher rosters, attendance marking, fee/results
  // views, etc.) meant a 40-student class list could be 50-100+ MB of JSON
  // for a page that never even renders it. It's still fetched individually
  // via GET /api/students/:id (ID card, profile) where it's actually shown.
  const students = await Student.find(query)
    .select("-photo")
    .populate("class", "name")
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Student.countDocuments(query);

  res.json({ success: true, count: students.length, total, page: Number(page), students });
});

// @desc    Get single student profile
// @route   GET /api/students/:id
// @access  Private (admin/teacher: any student. student: only their own
//          profile. parent: only their own linked children.)
const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .select("+photo")
    .populate({
      path: "class",
      select: "name sections classTeacher semesterCount allowSelfResultEntry",
      populate: { path: "classTeacher", select: "name email phone" },
    });
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  // Server-side ownership check - never rely on the client to scope this.
  if (req.user.role === "student" && String(student.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only view your own profile");
  }
  if (req.user.role === "parent" && !req.user.children.some((c) => String(c) === String(student._id))) {
    res.status(403);
    throw new Error("You don't have access to this student");
  }

  res.json({ success: true, student });
});

// @desc    Logged-in student's own profile (convenience alias for getStudent
//          that doesn't require knowing your own Student _id up front)
// @route   GET /api/students/me
// @access  Private/Student
const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .select("+photo")
    .populate({
      path: "class",
      select: "name sections classTeacher semesterCount allowSelfResultEntry",
      populate: { path: "classTeacher", select: "name email phone" },
    });
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }
  res.json({ success: true, student });
});

// @desc    Student self-service profile update - deliberately limited to
//          personal/contact fields. Academic fields (class, roll number,
//          admission number, status, subjects, etc.) stay admin-only so a
//          student can't quietly reassign themselves to another class.
//          Parent name/address are now student-editable too - only
//          emergencyContact and photo were before; office staff can still
//          override these from the admin Students screen if needed.
// @route   PUT /api/students/me
// @access  Private/Student
const updateMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }

  const { photo, phone, address, emergencyContact, parent } = req.body;
  if (photo !== undefined) student.photo = photo;
  if (phone !== undefined) student.phone = phone;
  if (address !== undefined) student.address = address;
  if (emergencyContact !== undefined) {
    student.emergencyContact = { ...(student.emergencyContact?.toObject?.() || student.emergencyContact), ...emergencyContact };
  }
  if (parent !== undefined) {
    // Only allow the specific sub-fields a student should be able to touch;
    // parent.phone stays out of this since that's the verified login/OTP
    // contact number and changing it here would desync from phoneVerified.
    const { fatherName, motherName, address: parentAddress } = parent;
    const existingParent = student.parent?.toObject?.() || student.parent || {};
    student.parent = {
      ...existingParent,
      ...(fatherName !== undefined && { fatherName }),
      ...(motherName !== undefined && { motherName }),
      ...(parentAddress !== undefined && { address: parentAddress }),
    };
  }

  await student.save();
  res.json({ success: true, student });
});

// @desc    Create student - also provisions a login account and an ID card
//          as soon as the student is registered, per school policy.
// @route   POST /api/students
// @access  Private/Admin
const createStudent = asyncHandler(async (req, res) => {
  const { createLogin = true, loginEmail, ...studentBody } = req.body;

  // 0. Auto-generate a unique student ID (admission number) when the admin
  //    doesn't type one in - every student must have one, so we never leave
  //    this to chance.
  if (!studentBody.admissionNumber) {
    let candidate;
    let exists = true;
    while (exists) {
      candidate = `STU-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
      exists = await Student.exists({ admissionNumber: candidate });
    }
    studentBody.admissionNumber = candidate;
  }

  // 1. Generate the ID card up front so it's issued at registration time, not later.
  const cardNumber = `ID-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
  const issuedDate = new Date();
  const validTill = new Date(issuedDate);
  validTill.setFullYear(validTill.getFullYear() + 1); // school ID cards renew yearly

  const student = await Student.create({
    ...studentBody,
    idCard: { cardNumber, issuedDate, validTill },
  });

  if (studentBody.class) await applyFeeStructuresToStudent(student._id, studentBody.class);

  // 2. Optionally create the login account in the same request, so admins don't
  //    have to remember a second step. Requires an email (student's own or parent's).
  let credentials = null;
  const email = loginEmail || studentBody.parent?.email;

  if (createLogin && email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (!existing) {
      const tempPassword = generateTempPassword();
      const user = await User.create({
        name: `${student.firstName} ${student.lastName || ""}`.trim(),
        email,
        password: tempPassword,
        role: "student",
        student: student._id,
      });
      student.user = user._id;
      await student.save();
      credentials = { email: user.email, tempPassword };
    }
  }

  const populated = await Student.findById(student._id).populate("class", "name");
  res.status(201).json({ success: true, student: populated, credentials });
});

// @desc    Get a student's ID card
// @route   GET /api/students/:id/id-card
// @access  Private
const getIdCard = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).select("+photo").populate("class", "name");
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  if (req.user.role === "student" && String(student.user) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only view your own ID card");
  }
  if (req.user.role === "parent" && !req.user.children.some((c) => String(c) === String(student._id))) {
    res.status(403);
    throw new Error("You don't have access to this student");
  }
  if (!student.idCard?.cardNumber) {
    res.status(404);
    throw new Error("No ID card has been issued for this student yet");
  }
  res.json({ success: true, student });
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  res.json({ success: true, student });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  res.json({ success: true, message: "Student removed" });
});

// @desc    Create (or extend) a parent login for a student. If the email
//          already belongs to a parent account, this student is added to
//          their existing children list instead of erroring.
// @route   POST /api/students/:id/parent-account
// @access  Private/Admin
const createParentAccount = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role !== "parent") {
      res.status(400);
      throw new Error("This email already belongs to a non-parent account");
    }
    if (!existing.children.some((c) => String(c) === String(student._id))) {
      existing.children.push(student._id);
      await existing.save();
    }
    return res.json({
      success: true,
      parent: { id: existing._id, name: existing.name, email: existing.email },
      message: "Linked to existing parent account",
    });
  }

  const tempPassword = generateTempPassword();
  const parent = await User.create({
    name,
    email,
    password: tempPassword,
    role: "parent",
    children: [student._id],
  });

  res.status(201).json({
    success: true,
    parent: { id: parent._id, name: parent.name, email: parent.email },
    credentials: { email: parent.email, tempPassword },
  });
});

// @desc    Promote a student to the next class in sequence. Blocked unless
//          they have enough recorded results:
//            - Grade 5 and below (incl. Nursery/LKG/UKG): at least 3 semester
//              results on file (interpreted as "results for semesters 1-3")
//            - Above Grade 5: at least the most recently completed semester's
//              result must be on file
//          On success, auto-applies the new class's fee structures.
// @route   POST /api/students/:id/promote
// @access  Private/Admin
const promoteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate("class");
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  if (!student.class) {
    res.status(400);
    throw new Error("This student has no class assigned - set one before promoting");
  }

  const targetClass = await Class.findOne({ order: student.class.order + 1 });
  if (!targetClass) {
    res.status(400);
    throw new Error(`${student.class.name} is the highest class - nothing to promote to`);
  }

  const grade5 = await Class.findOne({ name: "Grade 5" });
  const requiresThreeResults = grade5 ? student.class.order <= grade5.order : true;
  const requiredCount = requiresThreeResults ? 3 : 1;

  const semesters = await Mark.distinct("semester", { student: student._id });

  if (semesters.length < requiredCount) {
    res.status(400);
    throw new Error(
      requiresThreeResults
        ? `This student needs at least 3 recorded semester results to be promoted out of ${student.class.name} (has ${semesters.length}).`
        : `This student's most recent semester result must be recorded before promotion (has ${semesters.length} result(s) on file).`
    );
  }

  student.class = targetClass._id;
  student.section = targetClass.sections?.includes(student.section) ? student.section : undefined;
  await student.save();

  const newFees = await applyFeeStructuresToStudent(student._id, targetClass._id);

  const populated = await Student.findById(student._id).populate("class", "name");
  res.json({
    success: true,
    student: populated,
    feesApplied: newFees.length,
    message: `Promoted to ${targetClass.name}${newFees.length ? ` - ${newFees.length} fee(s) applied` : ""}`,
  });
});

module.exports = {
  getStudents,
  getStudent,
  getMyProfile,
  updateMyProfile,
  createStudent,
  updateStudent,
  deleteStudent,
  getIdCard,
  createParentAccount,
  promoteStudent,
};