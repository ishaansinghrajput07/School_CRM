const mongoose = require("mongoose");

// Holds board exam results (e.g. Class 10th / 12th board) that a student
// brings in from a *previous* school, rather than results produced inside
// this school's own semester system (see Mark.js for that). Common for
// transfer students who need their prior academic record on file.
// Always editable (by the owning student or an admin) since these records
// sometimes need correction after re-verification of a marksheet.
const externalResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    examType: { type: String, enum: ["10th_board", "12th_board", "other"], required: true },
    boardName: { type: String, required: true, trim: true }, // e.g. "CBSE", "ICSE", "State Board"
    schoolName: { type: String, required: true, trim: true }, // the previous/external school
    year: { type: Number, required: true },
    rollNumber: { type: String, trim: true },
    certificateNumber: { type: String, trim: true },
    subjects: [
      {
        name: { type: String, required: true, trim: true },
        maxMarks: { type: Number, default: 100 },
        marksObtained: { type: Number, required: true },
      },
    ],
    overallPercentage: { type: Number }, // computed, but stored for quick display
    overallGrade: { type: String, trim: true },
    remarks: { type: String, trim: true },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

externalResultSchema.pre("validate", function (next) {
  if (this.subjects?.length) {
    const totalMax = this.subjects.reduce((sum, s) => sum + (s.maxMarks || 0), 0);
    const totalObtained = this.subjects.reduce((sum, s) => sum + (s.marksObtained || 0), 0);
    this.overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 1000) / 10 : 0;
  }
  next();
});

module.exports = mongoose.model("ExternalResult", externalResultSchema);
