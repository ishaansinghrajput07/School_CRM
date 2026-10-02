const asyncHandler = require("express-async-handler");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const { sendAbsenceAlert } = require("../utils/sendEmail");
const { sendSms } = require("../utils/sendSms");
const { emitToUser } = require("../utils/realtime");
const { getTeacherClassIds } = require("../utils/teacherScope");

// @desc    Mark attendance for one or many students (bulk upsert)
// @route   POST /api/attendance/mark
// @access  Private/Admin,Teacher (teacher limited to their own classes)
const markAttendance = asyncHandler(async (req, res) => {
  const { records, date, markedBy } = req.body;
  // records: [{ student, class, status, remarks }]

  if (req.user.role === "teacher") {
    const allowed = await getTeacherClassIds(req.user._id);
    const outOfScope = records.some((r) => !allowed.has(String(r.class)));
    if (outOfScope) {
      res.status(403);
      throw new Error("You can only mark attendance for your own classes");
    }
  }

  const results = [];
  for (const rec of records) {
    const attendance = await Attendance.findOneAndUpdate(
      { student: rec.student, date: new Date(date) },
      { ...rec, date: new Date(date), markedBy: markedBy || req.user._id },
      { upsert: true, new: true, runValidators: true }
    );
    results.push(attendance);

    // Fire absence alert + in-app notification
    if (rec.status === "absent") {
      const student = await Student.findById(rec.student);
      const studentName = student?.fullName || `${student?.firstName || ""} ${student?.lastName || ""}`.trim();

      if (student?.parent?.email) {
        sendAbsenceAlert({
          parentEmail: student.parent.email,
          studentName,
          date,
          reason: rec.remarks, // e.g. "sick", "family emergency" - included in the email when provided
        })
          .then(() => Attendance.findByIdAndUpdate(attendance._id, { parentNotified: true }))
          .catch((err) => console.error("Absence email failed:", err.message));
      }

      if (student?.parent?.phone) {
        sendSms({
          to: student.parent.phone,
          body: `St. Thomas Convent: ${studentName} was marked absent on ${new Date(date).toLocaleDateString()}.${rec.remarks ? ` Reason: ${rec.remarks}.` : ""}`,
        }).catch((err) => console.error("Absence SMS failed:", err.message));
      }

      if (student?.user) {
        const notification = await Notification.create({
          user: student.user,
          type: "attendance_alert",
          title: "Absence recorded",
          message: `You were marked absent on ${new Date(date).toLocaleDateString()}${rec.remarks ? ` (${rec.remarks})` : ""}.`,
        });
        // Push it live to the student's dashboard/notification bell if they're online
        emitToUser(student.user, "notification:new", notification);
      }

      const parents = await User.find({ role: "parent", children: rec.student });
      for (const parent of parents) {
        const parentNotification = await Notification.create({
          user: parent._id,
          type: "attendance_alert",
          title: `${studentName || "Your child"} was marked absent`,
          message: `Absence recorded on ${new Date(date).toLocaleDateString()}${rec.remarks ? ` (${rec.remarks})` : ""}.`,
          link: "/parent",
        });
        emitToUser(parent._id, "notification:new", parentNotification);
      }
    }
  }

  res.json({ success: true, count: results.length, records: results });
});

// @desc    Get attendance report (by class/date range/student)
// @route   GET /api/attendance
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
  const { student, class: classId, from, to } = req.query;
  const query = {};
  if (student) query.student = student;
  if (classId) query.class = classId;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const records = await Attendance.find(query)
    .populate("student", "firstName lastName admissionNumber")
    .sort({ date: -1 });

  res.json({ success: true, count: records.length, records });
});

// @desc    Attendance percentage summary for one student - overall, plus
//          weekly/monthly/yearly windows, plus whether they currently meet
//          their class's minimum attendance % to sit exams.
// @route   GET /api/attendance/summary/:studentId
// @access  Private
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId, "class");
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  const records = await Attendance.find({ student: req.params.studentId });
  const isPresent = (r) => r.status === "present" || r.status === "late";
  const percentOf = (rows) => (rows.length ? Math.round((rows.filter(isPresent).length / rows.length) * 1000) / 10 : 0);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as week start
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // School "year" runs April-March in India, not the calendar year - a
  // September attendance page should still be looking at the same academic
  // year's April, not resetting on Jan 1.
  const academicYearStart = new Date(now.getFullYear() - (now.getMonth() < 3 ? 1 : 0), 3, 1);

  const weekly = records.filter((r) => r.date >= startOfWeek);
  const monthly = records.filter((r) => r.date >= startOfMonth);
  const yearly = records.filter((r) => r.date >= academicYearStart);

  const overallPercentage = percentOf(records);

  const classDoc = student.class ? await Class.findById(student.class, "minAttendancePercent name") : null;
  const requiredPercent = classDoc?.minAttendancePercent ?? 75;

  res.json({
    success: true,
    total: records.length,
    present: records.filter(isPresent).length,
    absent: records.filter((r) => r.status === "absent").length,
    percentage: overallPercentage,
    weekly: { total: weekly.length, present: weekly.filter(isPresent).length, percentage: percentOf(weekly) },
    monthly: { total: monthly.length, present: monthly.filter(isPresent).length, percentage: percentOf(monthly) },
    yearly: { total: yearly.length, present: yearly.filter(isPresent).length, percentage: percentOf(yearly) },
    examEligibility: {
      requiredPercent,
      eligible: overallPercentage >= requiredPercent,
      shortfall: Math.max(0, Math.round((requiredPercent - overallPercentage) * 10) / 10),
    },
  });
});

// @desc    Classes the logged-in teacher is allowed to mark attendance for
// @route   GET /api/attendance/my-classes
// @access  Private/Teacher
const getMyClasses = asyncHandler(async (req, res) => {
  const ids = await getTeacherClassIds(req.user._id);
  const classes = await Class.find({ _id: { $in: Array.from(ids) } }).sort({ order: 1 });
  res.json({ success: true, classes });
});

// @desc    Every student in a class with their attendance % and exam
//          eligibility against the class's threshold, in one call - the
//          class-wide view a class teacher needs before an exam ("who's
//          short on attendance right now").
// @route   GET /api/attendance/eligibility/:classId
// @access  Private/Admin,Teacher (teacher limited to their own classes)
const getClassEligibility = asyncHandler(async (req, res) => {
  if (req.user.role === "teacher") {
    const allowed = await getTeacherClassIds(req.user._id);
    if (!allowed.has(String(req.params.classId))) {
      res.status(403);
      throw new Error("You can only view attendance eligibility for your own classes");
    }
  }

  const classDoc = await Class.findById(req.params.classId, "minAttendancePercent name");
  if (!classDoc) {
    res.status(404);
    throw new Error("Class not found");
  }
  const requiredPercent = classDoc.minAttendancePercent ?? 75;

  const students = await Student.find({ class: req.params.classId }, "firstName lastName rollNumber admissionNumber").sort({ rollNumber: 1 });
  const records = await Attendance.find({ student: { $in: students.map((s) => s._id) } });

  const isPresent = (r) => r.status === "present" || r.status === "late";
  const byStudent = {};
  records.forEach((r) => {
    const sid = String(r.student);
    byStudent[sid] = byStudent[sid] || [];
    byStudent[sid].push(r);
  });

  const roster = students.map((s) => {
    const rows = byStudent[String(s._id)] || [];
    const percentage = rows.length ? Math.round((rows.filter(isPresent).length / rows.length) * 1000) / 10 : 0;
    return {
      student: { _id: s._id, firstName: s.firstName, lastName: s.lastName, rollNumber: s.rollNumber, admissionNumber: s.admissionNumber },
      total: rows.length,
      percentage,
      eligible: percentage >= requiredPercent,
    };
  });

  res.json({ success: true, requiredPercent, roster });
});

module.exports = { markAttendance, getAttendance, getAttendanceSummary, getMyClasses, getClassEligibility };