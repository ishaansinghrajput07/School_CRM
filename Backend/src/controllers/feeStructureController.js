const asyncHandler = require("express-async-handler");
const FeeStructure = require("../models/FeeStructure");
const { applyNewStructureToExistingStudents } = require("../utils/applyFeeStructures");

// @desc    Public: fee structure by class - this is just published pricing
//          (like a fee-structure page on any school's website), no
//          student-identifying data at all, so no login required.
// @route   GET /api/fee-structures/public
const getPublicFeeStructures = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.class) query.class = req.query.class;
  const structures = await FeeStructure.find(query)
    .populate("class", "name order")
    .select("-createdBy")
    .sort({ "class.order": 1, semester: 1 });
  res.json({ success: true, feeStructures: structures });
});

// @desc    List fee structures, optionally filtered by class
// @route   GET /api/fee-structures
const getFeeStructures = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.class) query.class = req.query.class;

  const structures = await FeeStructure.find(query).populate("class", "name").sort({ createdAt: -1 });
  res.json({ success: true, feeStructures: structures });
});

// @desc    Define a fee for a class - immediately back-applies to every
//          student already in that class, and auto-applies going forward to
//          new signups and promotions into it.
// @route   POST /api/fee-structures
// @access  Private/Admin
const createFeeStructure = asyncHandler(async (req, res) => {
  const { class: classId, feeType, amount, semester, dueDate, academicYear } = req.body;
  if (!classId || !feeType || !amount || !dueDate) {
    res.status(400);
    throw new Error("class, feeType, amount, and dueDate are required");
  }

  const structure = await FeeStructure.create({
    class: classId,
    feeType,
    amount,
    semester: semester || undefined,
    dueDate,
    academicYear,
    createdBy: req.user._id,
  });

  const appliedFees = await applyNewStructureToExistingStudents(structure);

  res.status(201).json({ success: true, feeStructure: structure, appliedToExisting: appliedFees.length });
});

const updateFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!structure) {
    res.status(404);
    throw new Error("Fee structure not found");
  }
  res.json({ success: true, feeStructure: structure });
});

const deleteFeeStructure = asyncHandler(async (req, res) => {
  const structure = await FeeStructure.findByIdAndDelete(req.params.id);
  if (!structure) {
    res.status(404);
    throw new Error("Fee structure not found");
  }
  res.json({ success: true, message: "Fee structure removed" });
});

module.exports = { getPublicFeeStructures, getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure };