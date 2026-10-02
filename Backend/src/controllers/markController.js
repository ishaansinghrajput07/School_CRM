const asyncHandler = require("express-async-handler");
const Mark = require("../models/Mark");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendSms } = require("../utils/sendSms");
const { emitToUser } = require("../utils/realtime");

// Shared helper: loads the logged-in student's profile + class, and throws
// a friendly 403 if their class isn't opted in to self-reported results.
const requireSelfEntryEligible = async (userId) => {
  const student = await Student.findOne({ user: userId }).populate("class");
  if (!student) {
    const err = new Error("Student profile not found");
    err.statusCode = 404;
    throw err;
  }
  if (!student.class) {
    const err = new Error("You don't have a class assigned yet - ask the school office to set one");
    err.statusCode = 400;
    throw err;
  }
  if (!student.class.allowSelfResultEntry) {
    const err = new Error(
      `Students in ${student.class.name} cannot self-report results - ask your class teacher or admin to enter your marks.`
    );
    err.statusCode = 403;
    throw err;
  }
  return student;
};

// @desc    List subjects for the logged-in student's own class (so they know
//          what to fill in) plus their existing self/teacher-entered marks
//          for a given semester
// @route   GET /api/marks/me?semester=Semester%201
// @access  Private/Student
const getMyMarksRoster = asyncHandler(async (req, res) => {
  const student = await requireSelfEntryEligible(req.user._id);
  const { semester } = req.query;
  if (!semester) {
    res.status(400);
    throw new Error("semester is required");
  }

  const [subjects, marks] = await Promise.all([
    Subject.find({ class: student.class._id }),
    Mark.find({ student: student._id, semester }),
  ]);
  const marksBySubject = new Map(marks.map((m) => [String(m.subject), m]));

  const roster = subjects.map((s) => ({
    subject: { _id: s._id, name: s.name, code: s.code },
    mark: marksBySubject.get(String(s._id)) || null,
  }));

  res.json({
    success: true,
    class: { _id: student.class._id, name: student.class.name, semesterCount: student.class.semesterCount },
    roster,
  });
});

// @desc    Student self-entry: save/update their own marks for one subject +
//          semester. Only permitted for classes with allowSelfResultEntry.
// @route   POST /api/marks/me
// @access  Private/Student
const saveMyMark = asyncHandler(async (req, res) => {
  const student = await requireSelfEntryEligible(req.user._id);
  const { subject, semester, academicYear, internal, external, practical, maxInternal, maxExternal, maxPractical } = req.body;

  if (!subject || !semester) {
    res.status(400);
    throw new Error("subject and semester are required");
  }

  const subjectDoc = await Subject.findOne({ _id: subject, class: student.class._id });
  if (!subjectDoc) {
    res.status(404);
    throw new Error("That subject isn't part of your class");
  }

  const semesterNumber = parseInt(String(semester).replace(/\D/g, ""), 10);
  if (student.class.semesterCount && semesterNumber && semesterNumber > student.class.semesterCount) {
    res.status(400);
    throw new Error(`${student.class.name} only has ${student.class.semesterCount} semester(s) configured`);
  }

  const mark = await Mark.findOneAndUpdate(
    { student: student._id, subject, semester },
    {
      student: student._id,
      subject,
      class: student.class._id,
      semester,
      academicYear,
      internal: internal ?? 0,
      external: external ?? 0,
      practical: practical ?? 0,
      maxInternal: maxInternal ?? 30,
      maxExternal: maxExternal ?? 60,
      maxPractical: maxPractical ?? 10,
      enteredBy: req.user._id,
      selfEntered: true,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, mark });
});

// @desc    Class roster for one subject/semester, merged with any marks already entered
// @route   GET /api/marks?subject=&semester=
// @access  Private/Teacher,Admin
const getRoster = asyncHandler(async (req, res) => {
  const { subject, semester } = req.query;
  if (!subject || !semester) {
    res.status(400);
    throw new Error("subject and semester are required");
  }

  const subjectDoc = await Subject.findById(subject);
  if (!subjectDoc) {
    res.status(404);
    throw new Error("Subject not found");
  }
  if (req.user.role === "teacher" && String(subjectDoc.teacher) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only enter marks for subjects you teach");
  }

  const [students, marks] = await Promise.all([
    Student.find({ class: subjectDoc.class }).sort({ rollNumber: 1 }),
    Mark.find({ subject, semester }),
  ]);

  const marksByStudent = new Map(marks.map((m) => [String(m.student), m]));

  const roster = students.map((s) => ({
    student: { _id: s._id, firstName: s.firstName, lastName: s.lastName, rollNumber: s.rollNumber },
    mark: marksByStudent.get(String(s._id)) || null,
  }));

  res.json({ success: true, subject: subjectDoc, roster });
});

// @desc    Bulk upsert marks for a subject/semester (one row per student)
// @route   POST /api/marks/bulk
// @access  Private/Teacher,Admin
const bulkSaveMarks = asyncHandler(async (req, res) => {
  const { subject, semester, academicYear, entries } = req.body;
  if (!subject || !semester || !Array.isArray(entries)) {
    res.status(400);
    throw new Error("subject, semester, and entries[] are required");
  }

  const subjectDoc = await Subject.findById(subject);
  if (!subjectDoc) {
    res.status(404);
    throw new Error("Subject not found");
  }
  if (req.user.role === "teacher" && String(subjectDoc.teacher) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only enter marks for subjects you teach");
  }

  const saved = [];
  for (const e of entries) {
    const mark = await Mark.findOneAndUpdate(
      { student: e.student, subject, semester },
      {
        student: e.student,
        subject,
        class: subjectDoc.class,
        semester,
        academicYear,
        internal: e.internal ?? 0,
        external: e.external ?? 0,
        practical: e.practical ?? 0,
        maxInternal: e.maxInternal ?? 30,
        maxExternal: e.maxExternal ?? 60,
        maxPractical: e.maxPractical ?? 10,
        enteredBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    saved.push(mark);
  }

  // Let every affected student know their result was updated
  const students = await Student.find({ _id: { $in: entries.map((e) => e.student) } }, "user firstName parent.phone");
  for (const s of students) {
    if (!s.user) continue;
    const notification = await Notification.create({
      user: s.user,
      type: "result_published",
      title: `${subjectDoc.name} marks published`,
      message: `Your ${semester} marks for ${subjectDoc.name} are now available.`,
      link: "/student/results",
    });
    emitToUser(s.user, "notification:new", notification);
  }

  // SMS every parent phone on file - this reaches parents whether or not
  // they've set up a Parent Portal login (that account is optional; the
  // phone number on the student record is required at signup).
  const uniquePhones = [...new Set(students.map((s) => s.parent?.phone).filter(Boolean))];
  Promise.allSettled(
    uniquePhones.map((phone) =>
      sendSms({ to: phone, body: `St. Thomas Convent: New ${semester} marks published for ${subjectDoc.name}. Check the student portal for details.` })
    )
  ).then((results) => {
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed) console.error(`Result-published SMS: ${failed}/${uniquePhones.length} sends failed`);
  });

  const parents = await User.find({ role: "parent", children: { $in: entries.map((e) => e.student) } });
  for (const parent of parents) {
    const parentNotification = await Notification.create({
      user: parent._id,
      type: "result_published",
      title: `${subjectDoc.name} marks published`,
      message: `New ${semester} marks are available for your child.`,
      link: "/parent",
    });
    emitToUser(parent._id, "notification:new", parentNotification);
  }

  res.json({ success: true, count: saved.length, marks: saved });
});

module.exports = { getRoster, bulkSaveMarks, getMyMarksRoster, saveMyMark };
