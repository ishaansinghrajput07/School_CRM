// Session-based auth guard (Passport LocalStrategy + express-session).
// Replaces the old JWT-decode version - req.user is now populated by
// passport.deserializeUser() (see config/passport.js) on every request that
// carries a valid session cookie, BEFORE this middleware ever runs.
const protect = (req, res, next) => {
  // req.isAuthenticated() is added to every request by passport.session()
  // (in server.js). It's true only if: a session cookie was sent, that
  // session exists, and deserializeUser successfully resolved it
  // to a real, active user.
  if (!req.isAuthenticated() || !req.user) {
    res.status(401);
    return next(new Error("Not authorized, please log in"));
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role '${req.user?.role}' is not permitted to access this resource`));
    }
    next();
  };
};

module.exports = { protect, authorize };