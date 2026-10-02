const mongoose = require("mongoose");

const trackingRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    type: {
      type: String,
      enum: ["bonafide_certificate", "transfer_certificate", "admission_request", "document_verification"],
      required: true,
    },
    details: { type: String, trim: true },
    status: { type: String, enum: ["pending", "processing", "approved", "rejected"], default: "pending" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrackingRequest", trackingRequestSchema);
