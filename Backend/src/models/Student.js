const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admissionNumber: { type: String, required: true, unique: true, trim: true },
    rollNumber: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    bloodGroup: { type: String, trim: true },
    // select: false - base64 photos are large (up to ~2.7MB once encoded).
    // Every query that returns a list of students (rosters, marks entry,
    // fee views, etc.) was silently including this on every row by
    // default, which is what made those pages slow. Now it's opt-in via
    // .select("+photo") wherever a page actually displays it (ID card,
    // profile) instead of opt-out everywhere else.
    photo: { type: String, default: "", select: false },
    idCard: {
      cardNumber: { type: String, unique: true, sparse: true },
      issuedDate: { type: Date },
      validTill: { type: Date },
    },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    section: { type: String, trim: true },
    // Fields captured during self-signup, beyond the core K-12 class model above
    phone: { type: String, trim: true },
    phoneVerified: { type: Boolean, default: false },
    address: { type: String, trim: true },
    branch: { type: String, trim: true },
    semester: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    passingYear: { type: String, trim: true },
    subjects: [{ type: String, trim: true }],
    admissionDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "inactive", "graduated", "transferred"], default: "active" },
    parent: {
      fatherName: String,
      motherName: String,
      email: String,
      phone: { type: String, required: true },
      phoneVerified: { type: Boolean, default: false },
      address: String,
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
  },
  { timestamps: true }
);

studentSchema.virtual("fullName").get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(" ");
});
studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

studentSchema.index({ firstName: "text", lastName: "text", admissionNumber: "text" });

module.exports = mongoose.model("Student", studentSchema);