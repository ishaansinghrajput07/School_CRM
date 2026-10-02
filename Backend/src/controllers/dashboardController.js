const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Fee = require("../models/Fee");
const Salary = require("../models/Salary");
const Ticket = require("../models/Ticket");
const Notice = require("../models/Notice");
const Transaction = require("../models/Transaction");
const Assignment = require("../models/Assignment");
const Project = require("../models/Project");

// @desc    Admin dashboard stats + chart data
// @route   GET /api/dashboard/admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalStudents, todaysAttendance, pendingFeesAgg, monthIncomeAgg, monthExpenseAgg, salaryPending, openTickets, activeNotices, newAdmissions] =
    await Promise.all([
      Student.countDocuments({ status: "active" }),
      Attendance.find({ date: { $gte: today, $lt: tomorrow } }),
      Fee.aggregate([
        { $match: { status: { $in: ["pending", "partial"] } } },
        { $group: { _id: null, total: { $sum: { $subtract: [{ $add: ["$amount", "$fine"] }, "$amountPaid"] } } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "income", date: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "expense", date: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Salary.countDocuments({ status: "pending" }),
      Ticket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Notice.countDocuments({ isActive: true }),
      Student.countDocuments({ admissionDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } }),
    ]);

  const present = todaysAttendance.filter((a) => a.status === "present" || a.status === "late").length;
  const absent = todaysAttendance.filter((a) => a.status === "absent").length;

  // Last 6 months attendance %, fee collection trend
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyAttendance = await Attendance.aggregate([
    { $match: { date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        present: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyIncomeExpense = await Transaction.aggregate([
    { $match: { date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  const studentGrowth = await Student.aggregate([
    { $match: { admissionDate: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$admissionDate" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Assignment/project completion - "completed" means the student did
  // something (submitted/late/approved/rejected), not left at "pending"
  const [assignments, projects] = await Promise.all([Assignment.find({}, "submissions"), Project.find({}, "submissions")]);
  const completionRate = (docs) => {
    const all = docs.flatMap((d) => d.submissions);
    if (all.length === 0) return 0;
    const done = all.filter((s) => s.status !== "pending").length;
    return Math.round((done / all.length) * 1000) / 10;
  };
  const assignmentCompletion = completionRate(assignments);
  const projectCompletion = completionRate(projects);

  // Branch-wise attendance % (falls back gracefully if branch isn't set on older records)
  const branchAttendance = await Attendance.aggregate([
    { $lookup: { from: "students", localField: "student", foreignField: "_id", as: "s" } },
    { $unwind: "$s" },
    {
      $group: {
        _id: { $ifNull: ["$s.branch", "Unassigned"] },
        present: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $project: { branch: "$_id", percentage: { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 1] }, _id: 0 } },
    { $sort: { branch: 1 } },
  ]);

  res.json({
    success: true,
    cards: {
      totalStudents,
      presentStudents: present,
      absentStudents: absent,
      attendancePercentage: todaysAttendance.length ? Math.round((present / todaysAttendance.length) * 1000) / 10 : 0,
      pendingFees: pendingFeesAgg[0]?.total || 0,
      monthlyIncome: monthIncomeAgg[0]?.total || 0,
      monthlyExpenses: monthExpenseAgg[0]?.total || 0,
      salaryPending,
      openTickets,
      newAdmissions,
      activeNotices,
      assignmentCompletion,
      projectCompletion,
    },
    charts: {
      monthlyAttendance,
      monthlyIncomeExpense,
      studentGrowth,
      branchAttendance,
    },
  });
});

// @desc    Student dashboard summary
// @route   GET /api/dashboard/student/:studentId
const getStudentDashboard = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === "student" && String(req.user.student?._id || req.user.student) !== String(studentId)) {
    res.status(403);
    throw new Error("You can only view your own dashboard");
  }
  if (req.user.role === "parent" && !req.user.children.some((c) => String(c) === String(studentId))) {
    res.status(403);
    throw new Error("You don't have access to this student");
  }

  const studentDoc = await Student.findById(studentId, "class");
  const noticeQuery = {
    isActive: true,
    audience: { $in: ["all", "students"] },
    ...(studentDoc?.class
      ? { $or: [{ targetClasses: { $size: 0 } }, { targetClasses: studentDoc.class }] }
      : { targetClasses: { $size: 0 } }),
  };

  const [attendanceRecords, fees, latestNotice, openTickets] = await Promise.all([
    Attendance.find({ student: studentId }),
    Fee.find({ student: studentId }),
    Notice.findOne(noticeQuery).sort({ createdAt: -1 }),
    Ticket.countDocuments({ raisedBy: req.user._id, status: { $in: ["open", "in_progress"] } }),
  ]);

  const present = attendanceRecords.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePercentage = attendanceRecords.length
    ? Math.round((present / attendanceRecords.length) * 1000) / 10
    : 0;

  const pendingFees = fees
    .filter((f) => f.status !== "paid")
    .reduce((sum, f) => sum + (f.amount + f.fine - f.amountPaid), 0);

  res.json({
    success: true,
    cards: {
      attendancePercentage,
      pendingFees,
      latestNotice,
      openTickets,
    },
  });
});

module.exports = { getAdminDashboard, getStudentDashboard };
