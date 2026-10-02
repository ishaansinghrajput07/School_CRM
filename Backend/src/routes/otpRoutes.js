const express = require("express");
const rateLimit = require("express-rate-limit");
const { sendOtp, verifyOtp } = require("../controllers/otpController");

const router = express.Router();

// Stricter than the general auth limiter - OTP sends cost real money per message
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests - please wait a few minutes" },
});

router.post("/send", otpLimiter, sendOtp);
router.post("/verify", otpLimiter, verifyOtp);

module.exports = router;
