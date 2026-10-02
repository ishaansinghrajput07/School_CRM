const mongoose = require("mongoose");

const admissionApplicationSchema = new mongoose.Schema(
  {
    applicantName: { type: String, required: true, trim: true, maxlength: 100 },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },

    applyingForClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    previousSchool: { type: String, trim: true, maxlength: 150 },
    address: { type: String, trim: true, maxlength: 300, required: true },

    parentName: { type: String, required: true, trim: true, maxlength: 100 },
    parentMobile: { type: String, required: true, trim: true },
    parentMobileVerified: { type: Boolean, default: false },
    parentEmail: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true, maxlength: 1000 }, // anything the applicant wants to add

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    // Set by admin on approval. Deliberately NOT auto-created as a login -
    // the family still goes through the normal /signup flow using this
    // number, keeping "apply" and "create portal account" as separate steps.
    assignedAdmissionNumber: { type: String, trim: true },
    adminNotes: { type: String, trim: true, maxlength: 1000 }, // internal only, e.g. interview notes / rejection reason
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    // Set once the family actually completes /signup using this admission
    // number - closes the loop between "approved" and "has a portal account",
    // and means the same number can't be used to sign up a second time.
    enrolledStudent: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    enrolledAt: { type: Date },

    ip: { type: String },
  },
  { timestamps: true }
);

admissionApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("AdmissionApplication", admissionApplicationSchema);
