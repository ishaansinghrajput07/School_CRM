const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Otp = require("../models/Otp");
const { sendSms } = require("../utils/sendSms");

const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

// @desc    Send a 6-digit OTP to a mobile number for a given purpose
// @route   POST /api/otp/send
// @access  Public (rate-limited)
const sendOtp = asyncHandler(async (req, res) => {
  const { mobile, purpose } = req.body;
  if (!mobile || !["signup_student_mobile", "signup_parent_mobile"].includes(purpose)) {
    res.status(400);
    throw new Error("A valid mobile number and purpose are required");
  }

  const code = String(crypto.randomInt(100000, 999999));

  // Replace any previous unverified OTP for this mobile+purpose
  await Otp.deleteMany({ mobile, purpose, verified: false });
  await Otp.create({
    mobile,
    purpose,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  await sendSms({
    to: mobile,
    body: `Your St. Thomas Convent verification code is ${code}. It expires in 5 minutes.`,
  });

  res.json({ success: true, message: "OTP sent", expiresInSeconds: 300 });
});

// @desc    Verify an OTP; on success, returns a short-lived token proving
//          this mobile+purpose was verified, to attach to the signup request
// @route   POST /api/otp/verify
// @access  Public (rate-limited)
const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, purpose, code } = req.body;
  if (!mobile || !purpose || !code) {
    res.status(400);
    throw new Error("mobile, purpose, and code are required");
  }

  const otp = await Otp.findOne({ mobile, purpose, verified: false }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) {
    res.status(400);
    throw new Error("OTP expired or not found - request a new one");
  }
  if (otp.attempts >= 5) {
    res.status(429);
    throw new Error("Too many incorrect attempts - request a new OTP");
  }

  if (otp.codeHash !== hashCode(code)) {
    otp.attempts += 1;
    await otp.save();
    res.status(400);
    throw new Error("Incorrect code");
  }

  otp.verified = true;
  await otp.save();

  // Short-lived proof-of-verification token, checked server-side at signup
  const verifyToken = jwt.sign({ mobile, purpose }, process.env.JWT_SECRET, { expiresIn: "15m" });

  res.json({ success: true, verifyToken });
});

module.exports = { sendOtp, verifyOtp };
