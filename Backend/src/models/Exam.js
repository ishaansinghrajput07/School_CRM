const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Unit Test 2", "Half-Yearly Examination"
    examType: {
      type: String,
      enum: ["unit_test", "mid_term", "half_yearly", "annual", "final", "practical", "other"],
      default: "unit_test",
    },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, trim: true }, // "10:00"
    endTime: { type: String, trim: true }, // "12:00"
    room: { type: String, trim: true },
    maxMarks: { type: Number, default: 100 },
    syllabus: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

examSchema.index({ class: 1, date: 1 });

module.exports = mongoose.model("Exam", examSchema);
