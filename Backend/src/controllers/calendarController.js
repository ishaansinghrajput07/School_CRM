const asyncHandler = require("express-async-handler");
const Notice = require("../models/Notice");
const Assignment = require("../models/Assignment");
const Project = require("../models/Project");
const Student = require("../models/Student");

// @desc    Unified academic calendar - holidays/exams/events from Notices,
//          plus assignment and project deadlines, scoped to the caller's role
// @route   GET /api/calendar
// @access  Private
const getCalendarEvents = asyncHandler(async (req, res) => {
  const events = [];

  const notices = await Notice.find({
    category: { $in: ["holiday", "exam", "event"] },
    eventDate: { $exists: true, $ne: null },
    isActive: true,
  });
  for (const n of notices) {
    events.push({
      date: n.eventDate,
      type: n.category, // "holiday" | "exam" | "event"
      title: n.title,
      id: `notice-${n._id}`,
    });
  }

  let assignmentQuery = {};
  let projectQuery = {};

  if (req.user.role === "teacher") {
    assignmentQuery = { createdBy: req.user._id };
    projectQuery = { createdBy: req.user._id };
  } else if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id });
    if (student) {
      assignmentQuery = { class: student.class };
      projectQuery = { class: student.class };
    } else {
      assignmentQuery = { _id: null };
      projectQuery = { _id: null };
    }
  }
  // admin: no filter, sees everything

  const [assignments, projects] = await Promise.all([
    Assignment.find(assignmentQuery, "title deadline subject").populate("subject", "name"),
    Project.find(projectQuery, "title deadline subject").populate("subject", "name"),
  ]);

  for (const a of assignments) {
    events.push({ date: a.deadline, type: "assignment", title: `${a.title} (${a.subject?.name || "—"})`, id: `assignment-${a._id}` });
  }
  for (const p of projects) {
    events.push({ date: p.deadline, type: "project", title: `${p.title} (${p.subject?.name || "—"})`, id: `project-${p._id}` });
  }

  res.json({ success: true, events });
});

module.exports = { getCalendarEvents };
