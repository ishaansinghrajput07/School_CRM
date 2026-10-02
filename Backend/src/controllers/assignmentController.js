const asyncHandler = require("express-async-handler");
const Assignment = require("../models/Assignment");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Notification = require("../models/Notification");
const { emitToUser } = require("../utils/realtime");
const { fileUrl: sharedFileUrl } = require("../middleware/upload");

const fileUrl = (file) => sharedFileUrl(file, "assignments");

// @desc    List assignments - teachers see what they created, students see
//          assignments for their class with their own submission attached
// @route   GET /api/assignments
const getAssignments = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === "teacher") {
    query.createdBy = req.user._id;
  } else if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json({ success: true, assignments: [] });
    query.class = student.class;
  }
  // admin: no filter, sees everything

  const assignments = await Assignment.find(query)
    .populate("subject", "name code")
    .populate("class", "name")
    .populate("createdBy", "name")
    .sort({ deadline: 1 });

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    const shaped = assignments.map((a) => {
      const mine = a.submissions.find((s) => String(s.student) === String(student._id));
      const obj = a.toObject();
      obj.submissions = undefined;
      obj.mySubmission = mine || null;
      return obj;
    });
    return res.json({ success: true, assignments: shaped });
  }

  res.json({ success: true, assignments });
});

// @desc    Single assignment with full submission roster (teacher/admin) or own status (student)
// @route   GET /api/assignments/:id
const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("subject", "name code")
    .populate("class", "name")
    .populate("createdBy", "name")
    .populate("submissions.student", "firstName lastName rollNumber admissionNumber");

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    const mine = assignment.submissions.find((s) => String(s.student._id) === String(student._id));
    const obj = assignment.toObject();
    obj.submissions = undefined;
    obj.mySubmission = mine || null;
    return res.json({ success: true, assignment: obj });
  }

  res.json({ success: true, assignment });
});

// @desc    Create an assignment for one of the teacher's subjects, seeding a
//          pending submission slot for every student in that class
// @route   POST /api/assignments
// @access  Private/Teacher,Admin
const createAssignment = asyncHandler(async (req, res) => {
  const { subject, title, description, instructions, deadline, maxMarks } = req.body;

  if (!subject || !title || !deadline) {
    res.status(400);
    throw new Error("Subject, title, and deadline are required");
  }

  const subjectDoc = await Subject.findById(subject);
  if (!subjectDoc) {
    res.status(404);
    throw new Error("Subject not found");
  }

  const roster = await Student.find({ class: subjectDoc.class }, "_id");

  const assignment = await Assignment.create({
    subject,
    class: subjectDoc.class,
    title,
    description,
    instructions,
    deadline,
    maxMarks: maxMarks || 100,
    attachmentUrl: fileUrl(req.file),
    createdBy: req.user._id,
    submissions: roster.map((s) => ({ student: s._id, status: "pending" })),
  });

  // Notify every student in the class
  const students = await Student.find({ class: subjectDoc.class, user: { $exists: true } }, "user");
  for (const s of students) {
    const notification = await Notification.create({
      user: s.user,
      type: "assignment_new",
      title: `New assignment: ${title}`,
      message: `${subjectDoc.name} — due ${new Date(deadline).toLocaleDateString()}`,
      link: "/student/assignments",
    });
    emitToUser(s.user, "notification:new", notification);
  }

  res.status(201).json({ success: true, assignment });
});

// @desc    Update assignment details (teacher who owns it, or admin)
// @route   PUT /api/assignments/:id
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (req.user.role === "teacher" && String(assignment.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only edit assignments you created");
  }

  const { title, description, instructions, deadline, maxMarks } = req.body;
  if (title) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (instructions !== undefined) assignment.instructions = instructions;
  if (deadline) assignment.deadline = deadline;
  if (maxMarks) assignment.maxMarks = maxMarks;
  if (req.file) assignment.attachmentUrl = fileUrl(req.file);

  await assignment.save();
  res.json({ success: true, assignment });
});

// @desc    Delete an assignment (teacher who owns it, or admin)
// @route   DELETE /api/assignments/:id
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (req.user.role === "teacher" && String(assignment.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only delete assignments you created");
  }
  await assignment.deleteOne();
  res.json({ success: true, message: "Assignment removed" });
});

// @desc    Student submits (or re-submits) their file for an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
const submitAssignment = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("A PDF or ZIP file is required");
  }

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }

  let submission = assignment.submissions.find((s) => String(s.student) === String(student._id));
  if (!submission) {
    assignment.submissions.push({ student: student._id });
    submission = assignment.submissions[assignment.submissions.length - 1];
  }

  submission.fileUrl = fileUrl(req.file);
  submission.submittedAt = new Date();
  submission.status = new Date() > assignment.deadline ? "late" : "submitted";

  await assignment.save();

  const notification = await Notification.create({
    user: assignment.createdBy,
    type: "assignment_new",
    title: `Submission received: ${assignment.title}`,
    message: `${student.firstName} ${student.lastName || ""} submitted their work.`.trim(),
    link: "/teacher/assignments",
  });
  emitToUser(assignment.createdBy, "notification:new", notification);

  res.json({ success: true, submission });
});

// @desc    Teacher grades one student's submission
// @route   PUT /api/assignments/:id/grade/:studentId
// @access  Private/Teacher,Admin
const gradeSubmission = asyncHandler(async (req, res) => {
  const { status, marks, remarks } = req.body;

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }
  if (req.user.role === "teacher" && String(assignment.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only grade assignments you created");
  }

  const submission = assignment.submissions.find((s) => String(s.student) === String(req.params.studentId));
  if (!submission) {
    res.status(404);
    throw new Error("Submission not found for this student");
  }

  if (status) submission.status = status;
  if (marks !== undefined) submission.marks = marks;
  if (remarks !== undefined) submission.remarks = remarks;

  await assignment.save();

  const student = await Student.findById(req.params.studentId);
  if (student?.user) {
    const notification = await Notification.create({
      user: student.user,
      type: "assignment_graded",
      title: `Graded: ${assignment.title}`,
      message: `Status: ${submission.status}${marks !== undefined ? ` · ${marks}/${assignment.maxMarks}` : ""}`,
      link: "/student/assignments",
    });
    emitToUser(student.user, "notification:new", notification);
  }

  res.json({ success: true, submission });
});

module.exports = {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
};