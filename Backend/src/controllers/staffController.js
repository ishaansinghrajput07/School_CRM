const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../models/User");

const generateTempPassword = () => {
  const words = ["Falcon", "Ember", "Nova", "Cedar", "Quartz", "Harbor", "Delta", "Willow"];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = crypto.randomInt(1000, 9999);
  return `${word}${digits}!`;
};

// @desc    List staff (everyone on payroll: admins/office staff + teachers) -
//          used to populate the Salaries module. Deliberately includes
//          teachers too, since they draw a salary just like office staff.
// @route   GET /api/staff
// @access  Private/Admin
const getStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: { $in: ["admin", "teacher"] } }).sort({ name: 1 });
  res.json({ success: true, staff });
});

// @desc    List teacher accounts - used to populate Subject "faculty" assignment
// @route   GET /api/staff/teachers
// @access  Private/Admin
const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "teacher" }).sort({ name: 1 });
  res.json({ success: true, teachers });
});

// @desc    Create a teacher login
// @route   POST /api/staff/teachers
// @access  Private/Admin
const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, phone, dateOfJoining } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const tempPassword = generateTempPassword();
  const teacher = await User.create({
    name,
    email,
    password: tempPassword,
    role: "teacher",
    designation: "teacher",
    phone,
    dateOfJoining: dateOfJoining || new Date(),
  });

  res.status(201).json({
    success: true,
    teacher: { id: teacher._id, name: teacher.name, email: teacher.email },
    credentials: { email: teacher.email, tempPassword },
  });
});

// @desc    Add a new staff member (creates their login too) with date of joining.
//          Designation drives which portal they get: "teacher" -> a teacher
//          account (Teacher Portal only, and now selectable when assigning a
//          subject); anything else -> an office/admin account (Admin Portal).
//          Previously this ALWAYS created an admin account regardless of the
//          chosen designation, so picking "teacher" here silently handed out
//          full admin access and the person never appeared in the subject
//          "assign teacher" dropdown - both are fixed by this role mapping.
// @route   POST /api/staff
// @access  Private/Admin
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, designation, phone, dateOfJoining } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const role = designation === "teacher" ? "teacher" : "admin";

  const tempPassword = generateTempPassword();
  const staff = await User.create({
    name,
    email,
    password: tempPassword,
    role,
    designation: designation || "office_staff",
    phone,
    dateOfJoining: dateOfJoining || new Date(),
  });

  res.status(201).json({
    success: true,
    staff: { id: staff._id, name: staff.name, email: staff.email, designation: staff.designation, role: staff.role },
    credentials: { email: staff.email, tempPassword },
  });
});

// @desc    Update a staff member's profile (designation, phone, active status, date of joining).
//          If the designation is changed to/from "teacher", the account's
//          role (and therefore which portal they can log into) is kept in
//          sync automatically.
// @route   PUT /api/staff/:id
// @access  Private/Admin
const updateStaff = asyncHandler(async (req, res) => {
  const { name, designation, phone, dateOfJoining, isActive } = req.body;

  const updates = { name, phone, dateOfJoining, isActive };
  if (designation !== undefined) {
    updates.designation = designation;
    updates.role = designation === "teacher" ? "teacher" : "admin";
  }

  const staff = await User.findOneAndUpdate(
    { _id: req.params.id, role: { $in: ["admin", "teacher"] } },
    updates,
    { new: true, runValidators: true }
  );
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }
  res.json({ success: true, staff });
});

module.exports = { getStaff, createStaff, updateStaff, getTeachers, createTeacher };
