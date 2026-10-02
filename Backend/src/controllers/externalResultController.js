const asyncHandler = require("express-async-handler");
const ExternalResult = require("../models/ExternalResult");
const Student = require("../models/Student");

// Shared ownership guard: admin/teacher can act on anyone, a student may
// only act on their own record, a parent only on their linked children.
const assertCanAccessStudent = async (req, studentId) => {
  if (req.user.role === "admin" || req.user.role === "teacher") return;

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student || String(student._id) !== String(studentId)) {
      const err = new Error("You can only manage your own external results");
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  if (req.user.role === "parent") {
    if (!req.user.children.some((c) => String(c) === String(studentId))) {
      const err = new Error("You don't have access to this student");
      err.statusCode = 403;
      throw err;
    }
    return;
  }

  const err = new Error("Not authorized");
  err.statusCode = 403;
  throw err;
};

// @desc    Logged-in student's own external/board results
// @route   GET /api/external-results/me
// @access  Private/Student
const getMyExternalResults = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }
  const results = await ExternalResult.find({ student: student._id }).sort({ year: -1 });
  res.json({ success: true, results });
});

// @desc    Any student's external/board results (admin/teacher/parent view)
// @route   GET /api/external-results/student/:studentId
// @access  Private
const getStudentExternalResults = asyncHandler(async (req, res) => {
  await assertCanAccessStudent(req, req.params.studentId);
  const results = await ExternalResult.find({ student: req.params.studentId }).sort({ year: -1 });
  res.json({ success: true, results });
});

// @desc    Add an external/board result for a student (self, or admin/teacher on their behalf)
// @route   POST /api/external-results
// @access  Private
const createExternalResult = asyncHandler(async (req, res) => {
  const { student: studentId, examType, boardName, schoolName, year, rollNumber, certificateNumber, subjects, remarks } = req.body;

  let targetStudentId = studentId;
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      res.status(404);
      throw new Error("Student profile not found");
    }
    targetStudentId = student._id;
  }

  if (!targetStudentId) {
    res.status(400);
    throw new Error("student is required");
  }
  await assertCanAccessStudent(req, targetStudentId);

  if (!examType || !boardName || !schoolName || !year || !Array.isArray(subjects) || subjects.length === 0) {
    res.status(400);
    throw new Error("examType, boardName, schoolName, year, and at least one subject are required");
  }

  const result = await ExternalResult.create({
    student: targetStudentId,
    examType,
    boardName,
    schoolName,
    year,
    rollNumber,
    certificateNumber,
    subjects,
    remarks,
    enteredBy: req.user._id,
  });

  res.status(201).json({ success: true, result });
});

// @desc    Edit an external/board result - always editable by its owning
//          student or an admin, since marksheets sometimes need correction.
// @route   PUT /api/external-results/:id
// @access  Private
const updateExternalResult = asyncHandler(async (req, res) => {
  const existing = await ExternalResult.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("External result not found");
  }
  await assertCanAccessStudent(req, existing.student);

  const { examType, boardName, schoolName, year, rollNumber, certificateNumber, subjects, remarks } = req.body;
  if (examType !== undefined) existing.examType = examType;
  if (boardName !== undefined) existing.boardName = boardName;
  if (schoolName !== undefined) existing.schoolName = schoolName;
  if (year !== undefined) existing.year = year;
  if (rollNumber !== undefined) existing.rollNumber = rollNumber;
  if (certificateNumber !== undefined) existing.certificateNumber = certificateNumber;
  if (subjects !== undefined) existing.subjects = subjects;
  if (remarks !== undefined) existing.remarks = remarks;

  await existing.save();
  res.json({ success: true, result: existing });
});

// @desc    Delete an external/board result
// @route   DELETE /api/external-results/:id
// @access  Private
const deleteExternalResult = asyncHandler(async (req, res) => {
  const existing = await ExternalResult.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("External result not found");
  }
  await assertCanAccessStudent(req, existing.student);
  await existing.deleteOne();
  res.json({ success: true, message: "External result removed" });
});

module.exports = {
  getMyExternalResults,
  getStudentExternalResults,
  createExternalResult,
  updateExternalResult,
  deleteExternalResult,
};
