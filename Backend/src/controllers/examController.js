const asyncHandler = require("express-async-handler");
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const Notice = require("../models/Notice");
const Notification = require("../models/Notification");
const { emitToUser } = require("../utils/realtime");

// @desc    List exams - students see their class's exams, teachers see exams
//          for subjects they teach, admin sees everything
// @route   GET /api/exams
const getExams = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (!student?.class) return res.json({ success: true, exams: [] });
    query.class = student.class;
  } else if (req.user.role === "teacher") {
    const subjects = await Subject.find({ teacher: req.user._id }, "_id");
    query.subject = { $in: subjects.map((s) => s._id) };
  }

  const { classId, upcoming } = req.query;
  if (classId) query.class = classId;
  if (upcoming === "true") query.date = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };

  const exams = await Exam.find(query)
    .populate("class", "name")
    .populate("subject", "name code")
    .populate("createdBy", "name")
    .sort({ date: 1 });

  res.json({ success: true, count: exams.length, exams });
});

// @desc    Schedule a new exam/test for a class+subject
// @route   POST /api/exams
// @access  Private/Teacher,Admin
const createExam = asyncHandler(async (req, res) => {
  const { name, examType, class: classId, subject, date, startTime, endTime, room, maxMarks, syllabus, notifyClass } = req.body;

  if (!name || !classId || !subject || !date) {
    res.status(400);
    throw new Error("Name, class, subject, and date are required");
  }

  const subjectDoc = await Subject.findById(subject);
  if (!subjectDoc) {
    res.status(404);
    throw new Error("Subject not found");
  }
  // A teacher may only schedule exams for subjects they actually teach -
  // otherwise any teacher account could set exams for another teacher's class.
  if (req.user.role === "teacher" && String(subjectDoc.teacher) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only schedule exams for subjects assigned to you");
  }

  const exam = await Exam.create({
    name,
    examType,
    class: classId,
    subject,
    date,
    startTime,
    endTime,
    room,
    maxMarks: maxMarks || 100,
    syllabus,
    createdBy: req.user._id,
  });

  const populated = await exam.populate([
    { path: "class", select: "name" },
    { path: "subject", select: "name code" },
  ]);

  // Notify every student in that class directly (separate from the optional
  // notice-board post below, so students always know even if the notice
  // board post is skipped).
  const students = await Student.find({ class: classId, user: { $exists: true } }, "user");
  for (const s of students) {
    const notification = await Notification.create({
      user: s.user,
      type: "notice",
      title: `Exam scheduled: ${name}`,
      message: `${populated.subject.name} on ${new Date(date).toLocaleDateString()}`,
      link: "/student/exams",
    });
    emitToUser(s.user, "notification:new", notification);
  }

  // Optionally also publish a notice-board entry so it shows on the colorful
  // notice board and calendar, not just the notification bell.
  if (notifyClass !== false) {
    await Notice.create({
      title: `${examType === "unit_test" ? "Test" : "Exam"}: ${name} — ${populated.subject.name}`,
      content: `${populated.class.name} · ${populated.subject.name}${startTime ? ` · ${startTime}${endTime ? "-" + endTime : ""}` : ""}${room ? ` · Room ${room}` : ""}${syllabus ? `\nSyllabus: ${syllabus}` : ""}`,
      category: "exam",
      eventDate: date,
      audience: "students",
      targetClasses: [classId],
      color: "violet",
      postedBy: req.user._id,
    });
  }

  res.status(201).json({ success: true, exam: populated });
});

// @desc    Update an exam (creator teacher, or admin)
// @route   PUT /api/exams/:id
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  if (req.user.role === "teacher" && String(exam.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only edit exams you created");
  }

  const fields = ["name", "examType", "date", "startTime", "endTime", "room", "maxMarks", "syllabus"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) exam[f] = req.body[f];
  });

  await exam.save();
  res.json({ success: true, exam });
});

// @desc    Delete an exam (creator teacher, or admin)
// @route   DELETE /api/exams/:id
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  if (req.user.role === "teacher" && String(exam.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only delete exams you created");
  }
  await exam.deleteOne();
  res.json({ success: true, message: "Exam removed" });
});

module.exports = { getExams, createExam, updateExam, deleteExam };
