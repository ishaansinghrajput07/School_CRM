const asyncHandler = require("express-async-handler");
const Project = require("../models/Project");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Notification = require("../models/Notification");
const { emitToUser } = require("../utils/realtime");
const { fileUrl: sharedFileUrl } = require("../middleware/upload");

const fileUrl = (file) => sharedFileUrl(file, "projects");

// @desc    List projects - teachers see what they created, students see
//          projects for their class with their own submission attached
// @route   GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === "teacher") {
    query.createdBy = req.user._id;
  } else if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.json({ success: true, projects: [] });
    query.class = student.class;
  }

  const projects = await Project.find(query)
    .populate("subject", "name code")
    .populate("class", "name")
    .populate("createdBy", "name")
    .sort({ deadline: 1 });

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    const shaped = projects.map((p) => {
      const mine = p.submissions.find((s) => String(s.student) === String(student._id));
      const obj = p.toObject();
      obj.submissions = undefined;
      obj.mySubmission = mine || null;
      return obj;
    });
    return res.json({ success: true, projects: shaped });
  }

  res.json({ success: true, projects });
});

// @desc    Single project with full roster (teacher/admin) or own status (student)
// @route   GET /api/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("subject", "name code")
    .populate("class", "name")
    .populate("createdBy", "name")
    .populate("submissions.student", "firstName lastName rollNumber admissionNumber");

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    const mine = project.submissions.find((s) => String(s.student._id) === String(student._id));
    const obj = project.toObject();
    obj.submissions = undefined;
    obj.mySubmission = mine || null;
    return res.json({ success: true, project: obj });
  }

  res.json({ success: true, project });
});

// @desc    Create a project for one of the teacher's subjects
// @route   POST /api/projects
// @access  Private/Teacher,Admin
const createProject = asyncHandler(async (req, res) => {
  const { subject, title, description, deadline, maxMarks } = req.body;

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

  const project = await Project.create({
    subject,
    class: subjectDoc.class,
    title,
    description,
    deadline,
    maxMarks: maxMarks || 100,
    createdBy: req.user._id,
    submissions: roster.map((s) => ({ student: s._id, status: "pending" })),
  });

  const students = await Student.find({ class: subjectDoc.class, user: { $exists: true } }, "user");
  for (const s of students) {
    const notification = await Notification.create({
      user: s.user,
      type: "project_new",
      title: `New project: ${title}`,
      message: `${subjectDoc.name} — due ${new Date(deadline).toLocaleDateString()}`,
      link: "/student/projects",
    });
    emitToUser(s.user, "notification:new", notification);
  }

  res.status(201).json({ success: true, project });
});

// @desc    Update project details (owning teacher, or admin)
// @route   PUT /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  if (req.user.role === "teacher" && String(project.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only edit projects you created");
  }

  const { title, description, deadline, maxMarks } = req.body;
  if (title) project.title = title;
  if (description !== undefined) project.description = description;
  if (deadline) project.deadline = deadline;
  if (maxMarks) project.maxMarks = maxMarks;

  await project.save();
  res.json({ success: true, project });
});

// @desc    Delete a project (owning teacher, or admin)
// @route   DELETE /api/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  if (req.user.role === "teacher" && String(project.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only delete projects you created");
  }
  await project.deleteOne();
  res.json({ success: true, message: "Project removed" });
});

// @desc    Student uploads or updates their project submission
// @route   POST /api/projects/:id/submit
// @access  Private/Student
const submitProject = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("A PDF or ZIP file is required");
  }

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const student = await Student.findOne({ user: req.user._id });
  if (!student) {
    res.status(404);
    throw new Error("Student profile not found");
  }

  let submission = project.submissions.find((s) => String(s.student) === String(student._id));
  if (!submission) {
    project.submissions.push({ student: student._id });
    submission = project.submissions[project.submissions.length - 1];
  }

  submission.fileUrl = fileUrl(req.file);
  submission.submittedAt = new Date();
  submission.status = "submitted";

  await project.save();

  const notification = await Notification.create({
    user: project.createdBy,
    type: "project_new",
    title: `Project submitted: ${project.title}`,
    message: `${student.firstName} ${student.lastName || ""} uploaded their project.`.trim(),
    link: "/teacher/projects",
  });
  emitToUser(project.createdBy, "notification:new", notification);

  res.json({ success: true, submission });
});

// @desc    Teacher reviews one student's project (approve/reject + feedback + marks)
// @route   PUT /api/projects/:id/review/:studentId
// @access  Private/Teacher,Admin
const reviewSubmission = asyncHandler(async (req, res) => {
  const { status, marks, feedback } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  if (req.user.role === "teacher" && String(project.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only review projects you created");
  }

  const submission = project.submissions.find((s) => String(s.student) === String(req.params.studentId));
  if (!submission) {
    res.status(404);
    throw new Error("Submission not found for this student");
  }

  if (status) submission.status = status;
  if (marks !== undefined) submission.marks = marks;
  if (feedback !== undefined) submission.feedback = feedback;

  await project.save();

  const student = await Student.findById(req.params.studentId);
  if (student?.user) {
    const notification = await Notification.create({
      user: student.user,
      type: "project_reviewed",
      title: `Project ${submission.status}: ${project.title}`,
      message: feedback ? `Feedback: ${feedback}` : `Status updated to ${submission.status}`,
      link: "/student/projects",
    });
    emitToUser(student.user, "notification:new", notification);
  }

  res.json({ success: true, submission });
});

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  submitProject,
  reviewSubmission,
};