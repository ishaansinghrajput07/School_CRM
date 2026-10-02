const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, trim: true },
    purpose: { type: String, enum: ["signup_student_mobile", "signup_parent_mobile"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 }, // caps guesses per OTP
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired OTP docs - no cron job needed
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ mobile: 1, purpose: 1 });

module.exports = mongoose.model("Otp", otpSchema);
