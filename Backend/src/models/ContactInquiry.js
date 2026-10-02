const mongoose = require("mongoose");

const contactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    ip: { type: String },
  },
  { timestamps: true }
);

contactInquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ContactInquiry", contactInquirySchema);
