const asyncHandler = require("express-async-handler");
const Class = require("../models/Class");
const Student = require("../models/Student");

const getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find().populate("classTeacher", "name email").sort({ order: 1 });

  // Attach a live student count per class so the admin UI can show
  // "32 / 40 per section" style capacity indicators without a second round-trip.
  const counts = await Student.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: { class: "$class", section: "$section" }, count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach((c) => {
    const key = String(c._id.class);
    countMap[key] = countMap[key] || {};
    countMap[key][c._id.section || "unassigned"] = c.count;
  });

  const withCounts = classes.map((c) => {
    const obj = c.toObject();
    obj.studentCountsBySection = countMap[String(c._id)] || {};
    obj.totalStudents = Object.values(obj.studentCountsBySection).reduce((a, b) => a + b, 0);
    return obj;
  });

  res.json({ success: true, classes: withCounts });
});

const createClass = asyncHandler(async (req, res) => {
  const newClass = await Class.create(req.body);
  res.status(201).json({ success: true, class: newClass });
});

const updateClass = asyncHandler(async (req, res) => {
  const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!updated) {
    res.status(404);
    throw new Error("Class not found");
  }
  res.json({ success: true, class: updated });
});

// @desc    Set the minimum attendance % required for exam eligibility in
//          this class. Deliberately a separate, narrow endpoint (rather than
//          folding into the general updateClass above) so a class teacher
//          can be granted just this one control without also getting admin's
//          full class-editing rights (renaming, sections, capacity, etc).
// @route   PUT /api/classes/:id/attendance-policy
// @access  Private/Admin, or the class's own class teacher
const updateAttendancePolicy = asyncHandler(async (req, res) => {
  const { minAttendancePercent } = req.body;
  if (minAttendancePercent === undefined || minAttendancePercent < 0 || minAttendancePercent > 100) {
    res.status(400);
    throw new Error("minAttendancePercent must be a number between 0 and 100");
  }

  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found");
  }
  if (req.user.role === "teacher" && String(classDoc.classTeacher) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only this class's class teacher (or an admin) can change its attendance policy");
  }

  classDoc.minAttendancePercent = minAttendancePercent;
  await classDoc.save();
  res.json({ success: true, class: classDoc });
});

const deleteClass = asyncHandler(async (req, res) => {
  const deleted = await Class.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error("Class not found");
  }
  res.json({ success: true, message: "Class removed" });
});

// @desc    Assign a batch of students to a class/section
const assignStudents = asyncHandler(async (req, res) => {
  const { studentIds, section } = req.body;
  await Student.updateMany({ _id: { $in: studentIds } }, { class: req.params.id, section });

  // Soft warning only - never blocks the assignment. A section going over
  // its planning capacity is something an admin should know about, not
  // something the system should refuse to do (real schools do run classes
  // above the "ideal" number sometimes).
  let warning;
  const classDoc = await Class.findById(req.params.id);
  if (classDoc?.maxStudentsPerSection) {
    const currentCount = await Student.countDocuments({ class: req.params.id, section, status: "active" });
    if (currentCount > classDoc.maxStudentsPerSection) {
      warning = `${classDoc.name} - Section ${section} now has ${currentCount} students, above the planned capacity of ${classDoc.maxStudentsPerSection}.`;
    }
  }

  res.json({ success: true, message: `${studentIds.length} student(s) assigned`, warning });
});

module.exports = { getClasses, createClass, updateClass, updateAttendancePolicy, deleteClass, assignStudents };