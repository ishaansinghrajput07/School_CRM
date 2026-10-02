const mongoose = require("mongoose");

const projectSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    fileUrl: { type: String },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "submitted", "in_review", "approved", "rejected"],
      default: "pending",
    },
    marks: { type: Number },
    feedback: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    deadline: { type: Date, required: true },
    maxMarks: { type: Number, default: 100 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submissions: [projectSubmissionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
