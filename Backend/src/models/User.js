const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      default: "student",
    },
    // Admin sub-roles for finer-grained context (all share the "admin" role/permissions for now)
    designation: {
      type: String,
      enum: ["principal", "teacher", "accountant", "receptionist", "office_staff", null],
      default: null,
    },
    phone: { type: String, trim: true },
    // select: false - see the identical note on Student.photo. Staff/teacher
    // list pages were returning every user's base64 avatar on every load.
    avatar: { type: String, default: "", select: false },
    isActive: { type: Boolean, default: true },
    // Only populated when role === "student"
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }], // used when role is "parent"
    // Only meaningful for role === "admin" (staff) - shown in the Salaries module
    dateOfJoining: { type: Date },
    lastLogin: { type: Date },
    // Forgot-password flow: a random token is emailed to the user; only its
    // SHA-256 hash is stored so a DB leak alone can't be used to reset accounts.
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    // Brute-force protection: after too many wrong passwords in a row we
    // lock the account for a short cool-down period instead of letting
    // attempts continue indefinitely.
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generates a one-time reset token, stores only its hash + a 30-minute
// expiry on the user, and returns the *plain* token so it can be emailed.
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model("User", userSchema);