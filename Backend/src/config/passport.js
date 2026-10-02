const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// This verify function is a direct port of the checks that used to live in
// authController.login() - same lockout counter, same bcrypt compare, same
// isActive gate. Passport just becomes the thing that CALLS this and decides
// what happens with the result (session vs. reject), the actual business
// logic is unchanged from before.
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() }).select(
          "+password +failedLoginAttempts +lockUntil +avatar"
        );

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (user.isLocked()) {
          const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
          return done(null, false, {
            status: 423,
            message: `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
          });
        }

        const passwordOk = await user.matchPassword(password);
        if (!passwordOk) {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
            user.failedLoginAttempts = 0;
          }
          await user.save({ validateBeforeSave: false });
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.isActive) {
          return done(null, false, {
            status: 403,
            message: "Account is deactivated. Contact the school administrator.",
          });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Runs once, right after a successful login/signup (via req.login()).
// Only the id is written into the session record - keeps
// each session small and avoids ever persisting password hashes there.
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// Runs on every subsequent request that carries a valid session cookie.
// Deliberately does NOT populate "student" here (unlike getMe) - this runs
// on every single authenticated request across the whole API, so keeping it
// to one lean query matters. Routes that need the populated student profile
// (e.g. GET /api/auth/me) still do that populate explicitly themselves.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(null, false);
    if (!user.isActive) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;