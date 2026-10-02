const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Notice = require("../models/Notice");
const { buildResult } = require("./resultController");

// @desc    List the students linked to the logged-in parent account
// @route   GET /api/parent/children
// @access  Private/Parent
const getChildren = asyncHandler(async (req, res) => {
  const children = await Student.find({ _id: { $in: req.user.children } }).populate("class", "name");
  res.json({ success: true, children });
});

// @desc    Read-only snapshot for one child: attendance %, results, recent notices
// @route   GET /api/parent/children/:studentId/overview
// @access  Private/Parent
const getChildOverview = asyncHandler(async (req, res) => {
  const owns = req.user.children.some((c) => String(c) === String(req.params.studentId));
  if (!owns) {
    res.status(403);
    throw new Error("You don't have access to this student");
  }

  const student = await Student.findById(req.params.studentId).populate("class", "name");
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  const [attendanceRecords, result, notices] = await Promise.all([
    Attendance.find({ student: student._id }),
    buildResult(student._id),
    Notice.find({ isActive: true, audience: { $in: ["all", "students"] } }).sort({ createdAt: -1 }).limit(10),
  ]);

  const present = attendanceRecords.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePercentage = attendanceRecords.length
    ? Math.round((present / attendanceRecords.length) * 1000) / 10
    : 0;

  res.json({
    success: true,
    student,
    attendance: {
      percentage: attendancePercentage,
      present,
      absent: attendanceRecords.filter((a) => a.status === "absent").length,
      total: attendanceRecords.length,
    },
    result,
    notices,
  });
});

module.exports = { getChildren, getChildOverview };
