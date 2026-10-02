const express = require("express");
const rateLimit = require("express-rate-limit");
const passport = require("../config/passport");
const {
  login,
  logout,
  signup,
  register,
  getMe,
  changePassword,
  updateMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Tighter limiter specifically for password-reset requests - each one sends
// an email, so this also doubles as anti-spam protection.
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many reset requests - please wait a few minutes" },
});

// passport.authenticate('local', ...) with a custom callback (rather than
// the default { session: true } shorthand) so we can: (a) return the exact
// status code/message our LocalStrategy's done(null, false, info) attached
// (423 for lockout, 403 for deactivated, 401 otherwise), and (b) control
// exactly when req.login() fires. req.login() is what actually calls
// serializeUser() and writes the session - it does NOT happen automatically
// just because the strategy succeeded.
const authenticateLocal = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      res.status(info?.status || 401);
      return next(new Error(info?.message || "Invalid email or password"));
    }
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      next(); // hand off to the login controller to shape the response
    });
  })(req, res, next);
};

router.post("/login", authenticateLocal, login);
router.post("/logout", logout);
router.post("/signup", signup);
router.post("/register", protect, authorize("admin"), register);
router.post("/forgot-password", resetLimiter, forgotPassword);
router.put("/reset-password/:token", resetLimiter, resetPassword);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

module.exports = router;