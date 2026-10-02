const asyncHandler = require("express-async-handler");
const Fee = require("../models/Fee");
const Student = require("../models/Student");
const { getTeacherClassIds } = require("../utils/teacherScope");

// @desc    List fees, optionally filtered by student/status/class.
//          Teachers are limited to students in classes they're assigned to
//          (as class teacher or subject teacher) - they get full visibility
//          into their own classes' fee status, but nobody else's.
const getFees = asyncHandler(async (req, res) => {
  const { student, status, class: classId } = req.query;
  const query = {};
  if (student) query.student = student;
  if (status) query.status = status;

  if (req.user.role === "teacher") {
    const allowed = await getTeacherClassIds(req.user._id);
    if (allowed.size === 0) {
      return res.json({ success: true, count: 0, fees: [] });
    }
    if (classId && !allowed.has(String(classId))) {
      res.status(403);
      throw new Error("You can only view fees for your own classes");
    }
    const classIds = classId ? [classId] : Array.from(allowed);
    const students = await Student.find({ class: { $in: classIds } }, "_id");
    const studentIds = students.map((s) => s._id);
    query.student = student ? student : { $in: studentIds };
  } else if (classId) {
    const students = await Student.find({ class: classId }, "_id");
    query.student = { $in: students.map((s) => s._id) };
  }

  const fees = await Fee.find(query)
    .populate({ path: "student", select: "firstName lastName admissionNumber class section", populate: { path: "class", select: "name" } })
    .sort({ dueDate: 1 });
  res.json({ success: true, count: fees.length, fees });
});

const createFee = asyncHandler(async (req, res) => {
  const fee = await Fee.create(req.body);
  res.status(201).json({ success: true, fee });
});

const updateFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!fee) {
    res.status(404);
    throw new Error("Fee record not found");
  }
  res.json({ success: true, fee });
});

// @desc    Record a payment against a fee record
// @route   POST /api/fees/:id/pay
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, method, reference } = req.body;
  const fee = await Fee.findById(req.params.id);
  if (!fee) {
    res.status(404);
    throw new Error("Fee record not found");
  }

  fee.amountPaid += Number(amount);
  fee.paymentHistory.push({ amount, method, reference, recordedBy: req.user._id });
  await fee.save();

  res.json({ success: true, fee });
});

const deleteFee = asyncHandler(async (req, res) => {
  const fee = await Fee.findByIdAndDelete(req.params.id);
  if (!fee) {
    res.status(404);
    throw new Error("Fee record not found");
  }
  res.json({ success: true, message: "Fee record removed" });
});

module.exports = { getFees, createFee, updateFee, recordPayment, deleteFee };