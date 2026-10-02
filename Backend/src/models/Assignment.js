const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    fileUrl: { type: String },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "submitted", "late", "approved", "rejected"],
      default: "pending",
    },
    marks: { type: Number },
    remarks: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    instructions: { type: String, trim: true },
    attachmentUrl: { type: String }, // teacher-provided PDF, optional
    deadline: { type: Date, required: true },
    maxMarks: { type: Number, default: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissions: [submissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
