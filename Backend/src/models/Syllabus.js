const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    // Matches Class.semesterCount (usually 1 or 2) - lets a school publish
    // "Semester 1" and "Semester 2" syllabi separately for the same class.
    semester: { type: Number, required: true, min: 1, default: 1 },
    academicYear: { type: String, trim: true },
    subjects: [
      {
        name: { type: String, required: true, trim: true },
        topics: [{ type: String, trim: true }],
      },
    ],
    notes: { type: String, trim: true },
    // Optional - an uploaded PDF (full syllabus/prospectus doc) shown as a
    // download link alongside the subject/topic list, not instead of it.
    fileUrl: { type: String },
    fileName: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One syllabus document per class+semester+year - re-saving the same
// combination updates it in place instead of creating duplicates.
syllabusSchema.index({ class: 1, semester: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("Syllabus", syllabusSchema);