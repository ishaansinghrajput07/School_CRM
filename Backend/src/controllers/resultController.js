const asyncHandler = require("express-async-handler");
const Mark = require("../models/Mark");
const Student = require("../models/Student");
const { gradeForPercentage } = require("../utils/grading");
const { getTeacherClassIds } = require("../utils/teacherScope");

// Pure grouping function - no DB access, so it can be reused for both a
// single student (one Mark query) and a whole class (one Mark query total,
// grouped in memory) without ever running per-student queries.
const groupMarksIntoResult = (marks) => {
  const bySemester = new Map();
  for (const m of marks) {
    if (!bySemester.has(m.semester)) bySemester.set(m.semester, []);
    const total = m.internal + m.external + m.practical;
    const maxTotal = m.maxInternal + m.maxExternal + m.maxPractical;
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const { grade, point } = gradeForPercentage(percentage);
    bySemester.get(m.semester).push({
      subject: m.subject,
      internal: m.internal,
      external: m.external,
      practical: m.practical,
      total,
      maxTotal,
      percentage: Math.round(percentage * 10) / 10,
      grade,
      gradePoint: point,
    });
  }

  const semesters = Array.from(bySemester.entries()).map(([semester, subjects]) => {
    const sgpa = subjects.reduce((sum, s) => sum + s.gradePoint, 0) / subjects.length;
    return { semester, subjects, sgpa: Math.round(sgpa * 100) / 100 };
  });

  const cgpa = semesters.length
    ? Math.round((semesters.reduce((sum, s) => sum + s.sgpa, 0) / semesters.length) * 100) / 100
    : 0;

  return { semesters, cgpa };
};

// Groups raw Mark documents into a per-semester result summary with subject
// grades, SGPA per semester, and a cumulative CGPA across all semesters.
const buildResult = async (studentId) => {
  const marks = await Mark.find({ student: studentId }).populate("subject", "name code").sort({ semester: 1 });
  return groupMarksIntoResult(marks);
};

// @desc    Logged-in student's own results
// @route   GET /api/results/me
// @access  Private/Student
const getMyResults = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }
  const result = await buildResult(student._id);
  const REQUIRED_MINIMUM = 3;
  res.json({
    success: true,
    ...result,
    requiredMinimum: REQUIRED_MINIMUM,
    meetsMinimum: result.semesters.length >= REQUIRED_MINIMUM,
  });
});

// @desc    Any student's results (teacher/admin view)
// @route   GET /api/results/:studentId
// @access  Private/Teacher,Admin
const getStudentResults = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }
  if (req.user.role === "teacher") {
    const allowed = await getTeacherClassIds(req.user._id);
    if (!allowed.has(String(student.class))) {
      res.status(403);
      throw new Error("You can only view results for students in your own classes");
    }
  }
  const result = await buildResult(student._id);
  res.json({ success: true, student: { name: `${student.firstName} ${student.lastName || ""}`.trim(), rollNumber: student.rollNumber }, ...result });
});

// @desc    Every student in a class with their CGPA/semester count, in ONE
//          request - avoids the N-requests-for-N-students problem entirely.
//          Two DB queries total, regardless of class size.
// @route   GET /api/results/class/:classId
// @access  Private/Teacher,Admin
const getClassResults = asyncHandler(async (req, res) => {
  if (req.user.role === "teacher") {
    const allowed = await getTeacherClassIds(req.user._id);
    if (!allowed.has(String(req.params.classId))) {
      res.status(403);
      throw new Error("You can only view results for your own classes");
    }
  }
  const students = await Student.find({ class: req.params.classId }, "firstName lastName rollNumber admissionNumber").sort({ rollNumber: 1 });
  if (students.length === 0) {
    return res.json({ success: true, results: [] });
  }

  const studentIds = students.map((s) => s._id);
  const allMarks = await Mark.find({ student: { $in: studentIds } }).populate("subject", "name code").sort({ semester: 1 });

  const marksByStudent = new Map();
  for (const m of allMarks) {
    const key = String(m.student);
    if (!marksByStudent.has(key)) marksByStudent.set(key, []);
    marksByStudent.get(key).push(m);
  }

  const results = students.map((s) => {
    const { semesters, cgpa } = groupMarksIntoResult(marksByStudent.get(String(s._id)) || []);
    return {
      student: {
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        rollNumber: s.rollNumber,
        admissionNumber: s.admissionNumber,
      },
      cgpa,
      semesterCount: semesters.length,
    };
  });

  res.json({ success: true, results });
});

module.exports = { getMyResults, getStudentResults, getClassResults, buildResult };