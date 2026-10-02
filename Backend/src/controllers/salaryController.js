const asyncHandler = require("express-async-handler");
const Salary = require("../models/Salary");

const getSalaries = asyncHandler(async (req, res) => {
  const { employee, month, status } = req.query;
  const query = {};
  if (employee) query.employee = employee;
  if (month) query.month = month;
  if (status) query.status = status;

  const salaries = await Salary.find(query).populate("employee", "name email designation dateOfJoining").sort({ month: -1 });
  res.json({ success: true, count: salaries.length, salaries });
});

// @desc    The logged-in teacher's own salary history - view only, always
//          scoped to req.user._id so a teacher can never see anyone else's
//          pay. Salary records themselves are still only ever created/edited
//          by admin (Admin -> Salaries).
// @route   GET /api/salaries/me
// @access  Private/Teacher
const getMySalary = asyncHandler(async (req, res) => {
  const salaries = await Salary.find({ employee: req.user._id }).sort({ month: -1 });
  res.json({ success: true, count: salaries.length, salaries });
});

const createSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.create(req.body);
  res.status(201).json({ success: true, salary });
});

const updateSalary = asyncHandler(async (req, res) => {
  const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!salary) {
    res.status(404);
    throw new Error("Salary record not found");
  }
  res.json({ success: true, salary });
});

const markSalaryPaid = asyncHandler(async (req, res) => {
  const salary = await Salary.findByIdAndUpdate(
    req.params.id,
    { status: "paid", paymentDate: new Date() },
    { new: true }
  );
  if (!salary) {
    res.status(404);
    throw new Error("Salary record not found");
  }
  res.json({ success: true, salary });
});

module.exports = { getSalaries, getMySalary, createSalary, updateSalary, markSalaryPaid };