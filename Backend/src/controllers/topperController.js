const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Topper = require("../models/Topper");
const { fileUrl } = require("../middleware/upload");

// @desc    Public: active toppers, most recent academic year first - powers
//          the homepage "Our Toppers" carousel, no login required.
// @route   GET /api/toppers/public
const getPublicToppers = asyncHandler(async (req, res) => {
  const toppers = await Topper.find({ isActive: true }).sort({ academicYear: -1, order: 1, createdAt: -1 });
  res.json({ success: true, toppers });
});

// @desc    Admin: every topper regardless of active/inactive, for management
// @route   GET /api/toppers
// @access  Private/Admin
const getToppers = asyncHandler(async (req, res) => {
  const toppers = await Topper.find().sort({ academicYear: -1, order: 1, createdAt: -1 });
  res.json({ success: true, toppers });
});

// @desc    Add a new topper. Photo is optional - the homepage card falls
//          back to a graduation-cap icon when photoUrl is empty.
// @route   POST /api/toppers
// @access  Private/Admin
const createTopper = asyncHandler(async (req, res) => {
  const { name, rank, grade, stream, academicYear, percentage, order } = req.body;

  if (!name || !rank || !grade || !academicYear) {
    res.status(400);
    throw new Error("name, rank, grade and academicYear are required");
  }

  const topper = await Topper.create({
    name,
    rank,
    grade,
    stream: stream || undefined,
    academicYear,
    percentage: percentage !== undefined && percentage !== "" ? Number(percentage) : undefined,
    order: order ? Number(order) : 0,
    photoUrl: req.file ? fileUrl(req.file, "toppers") : undefined,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, topper });
});

// @desc    Edit a topper's details, toggle isActive, or swap the photo
// @route   PUT /api/toppers/:id
// @access  Private/Admin
const updateTopper = asyncHandler(async (req, res) => {
  const topper = await Topper.findById(req.params.id);
  if (!topper) {
    res.status(404);
    throw new Error("Topper not found");
  }

  const { name, rank, grade, stream, academicYear, percentage, order, isActive } = req.body;
  if (name !== undefined) topper.name = name;
  if (rank !== undefined) topper.rank = rank;
  if (grade !== undefined) topper.grade = grade;
  if (stream !== undefined) topper.stream = stream;
  if (academicYear !== undefined) topper.academicYear = academicYear;
  if (percentage !== undefined) topper.percentage = percentage === "" ? undefined : Number(percentage);
  if (order !== undefined) topper.order = Number(order);
  if (isActive !== undefined) topper.isActive = isActive === "true" || isActive === true;

  if (req.file) {
    // Local-disk cleanup only - if Cloudinary is active, photoUrl is a full
    // https:// URL and there's nothing on this server's disk to remove.
    if (topper.photoUrl && !topper.photoUrl.startsWith("http")) {
      const oldPath = path.join(__dirname, "..", "..", topper.photoUrl);
      fs.unlink(oldPath, () => {}); // best-effort; a missing old file shouldn't block the update
    }
    topper.photoUrl = fileUrl(req.file, "toppers");
  }

  await topper.save();
  res.json({ success: true, topper });
});

// @desc    Remove a topper
// @route   DELETE /api/toppers/:id
// @access  Private/Admin
const deleteTopper = asyncHandler(async (req, res) => {
  const topper = await Topper.findByIdAndDelete(req.params.id);
  if (!topper) {
    res.status(404);
    throw new Error("Topper not found");
  }
  if (topper.photoUrl && !topper.photoUrl.startsWith("http")) {
    const filePath = path.join(__dirname, "..", "..", topper.photoUrl);
    fs.unlink(filePath, () => {});
  }
  res.json({ success: true, message: "Topper removed" });
});

module.exports = { getPublicToppers, getToppers, createTopper, updateTopper, deleteTopper };
