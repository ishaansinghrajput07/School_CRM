const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const AdmissionApplication = require("../models/AdmissionApplication");
const { emitToAdmins } = require("../utils/realtime");
const { sendEmail } = require("../utils/sendEmail");

// Same CLIENT_URL parsing pattern as authController's password-reset link.
const getClientUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/+$/, "");

const sendDecisionEmail = async (application, status) => {
  if (!application.parentEmail) return; // nothing to notify - email is optional on the form

  if (status === "approved") {
    await sendEmail({
      to: application.parentEmail,
      subject: `Admission approved - ${application.applicantName}`,
      html: `
        <p>Dear ${application.parentName},</p>
        <p>We're pleased to let you know that <strong>${application.applicantName}</strong>'s admission application has been <strong>approved</strong>.</p>
        <p>Admission number: <strong>${application.assignedAdmissionNumber}</strong></p>
        <p>To finish setting up your child's student portal account, visit
          <a href="${getClientUrl()}/signup">${getClientUrl()}/signup</a> and use this admission number
          during signup.</p>
        <p>Congratulations, and welcome to the school!</p>
      `,
    });
  } else if (status === "rejected") {
    await sendEmail({
      to: application.parentEmail,
      subject: `Update on admission application - ${application.applicantName}`,
      html: `
        <p>Dear ${application.parentName},</p>
        <p>Thank you for your interest in enrolling <strong>${application.applicantName}</strong>. After review,
          we're unable to offer admission at this time.</p>
        ${application.adminNotes ? `<p>${application.adminNotes}</p>` : ""}
        <p>Please feel free to contact the school office if you have any questions.</p>
      `,
    });
  }
};

// @desc    Submit an admission application (public, no login - this is for
//          prospective students who don't have an account yet)
// @route   POST /api/admissions
// @access  Public
const submitApplication = asyncHandler(async (req, res) => {
  const {
    applicantName,
    dob,
    gender,
    applyingForClass,
    previousSchool,
    address,
    parentName,
    parentMobile,
    parentEmail,
    notes,
    parentMobileVerifyToken,
  } = req.body;

  if (!applicantName?.trim() || !dob || !gender || !applyingForClass || !address?.trim() || !parentName?.trim() || !parentMobile?.trim()) {
    res.status(400);
    throw new Error("Please fill in every required field");
  }

  // Same verify-token pattern as student signup - proves this mobile number
  // actually received and entered the OTP. Optional, not required: if no
  // token is provided we just skip the check rather than blocking the
  // application, but a provided token must still be genuinely valid.
  let parentMobileVerified = false;
  if (parentMobileVerifyToken) {
    try {
      const payload = jwt.verify(parentMobileVerifyToken, process.env.JWT_SECRET);
      if (payload.mobile !== parentMobile || payload.purpose !== "admission_parent_mobile") {
        res.status(400);
        throw new Error("Parent mobile verification does not match the number provided");
      }
      parentMobileVerified = true;
    } catch (err) {
      if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        res.status(400);
        throw new Error("Parent mobile verification has expired - verify again, or leave it unverified");
      }
      throw err;
    }
  }

  const application = await AdmissionApplication.create({
    applicantName: applicantName.trim(),
    dob,
    gender,
    applyingForClass,
    previousSchool: previousSchool?.trim(),
    address: address.trim(),
    parentName: parentName.trim(),
    parentMobile: parentMobile.trim(),
    parentMobileVerified,
    parentEmail: parentEmail?.trim(),
    notes: notes?.trim(),
    ip: req.ip,
  });

  emitToAdmins("admission:new", {
    id: application._id,
    applicantName: application.applicantName,
    parentName: application.parentName,
    createdAt: application.createdAt,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted! Our admissions team will review it and contact you.",
    referenceId: application._id,
  });
});

// @desc    List admission applications for review
// @route   GET /api/admissions
// @access  Private/Admin
const getApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) query.status = status;

  const applications = await AdmissionApplication.find(query).sort({ createdAt: -1 }).populate("applyingForClass", "name").populate("reviewedBy", "name");
  res.json({ success: true, applications });
});

// @desc    Approve/reject/annotate an application
// @route   PATCH /api/admissions/:id
// @access  Private/Admin
const updateApplication = asyncHandler(async (req, res) => {
  const application = await AdmissionApplication.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }

  const { status, assignedAdmissionNumber, adminNotes } = req.body;

  if (status !== undefined) {
    if (!["pending", "approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }
    if (status === "approved" && !assignedAdmissionNumber?.trim() && !application.assignedAdmissionNumber) {
      res.status(400);
      throw new Error("Assign an admission number before approving");
    }
    application.status = status;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
  }
  if (assignedAdmissionNumber !== undefined) application.assignedAdmissionNumber = assignedAdmissionNumber.trim() || undefined;
  if (adminNotes !== undefined) application.adminNotes = adminNotes.trim() || undefined;

  await application.save();

  if (status === "approved" || status === "rejected") {
    // Best-effort - a family shouldn't lose their approval because an email
    // provider hiccupped. Log it, but the approval itself already succeeded.
    sendDecisionEmail(application, status).catch((err) => console.error("Admission decision email failed:", err.message));
  }

  res.json({ success: true, application });
});

// @desc    Delete an application
// @route   DELETE /api/admissions/:id
// @access  Private/Admin
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await AdmissionApplication.findByIdAndDelete(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error("Application not found");
  }
  res.json({ success: true, message: "Application deleted" });
});

module.exports = { submitApplication, getApplications, updateApplication, deleteApplication };
