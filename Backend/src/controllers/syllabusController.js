const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Syllabus = require("../models/Syllabus");
const { fileUrl: sharedFileUrl } = require("../middleware/upload");

const fileUrl = (file) => sharedFileUrl(file, "syllabus");

// @desc    Public: syllabus for one class (or every class if none given) -
//          powers the homepage's Academics section, no login required.
// @route   GET /api/syllabus/public
const getPublicSyllabus = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.class) query.class = req.query.class;
  const syllabi = await Syllabus.find(query).populate("class", "name order").sort({ "class.order": 1, semester: 1 });
  res.json({ success: true, syllabi });
});

// @desc    Admin: same data, unfiltered by public-safety concerns (there
//          isn't any sensitive data here, but kept separate so the admin
//          screen can list every syllabus regardless of query shape).
// @route   GET /api/syllabus
// @access  Private/Admin
const getSyllabi = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.class) query.class = req.query.class;
  const syllabi = await Syllabus.find(query).populate("class", "name").sort({ createdAt: -1 });
  res.json({ success: true, syllabi });
});

// @desc    Create or replace the syllabus for a class+semester+year in one
//          call - avoids the admin having to know whether one already
//          exists before deciding whether to POST or PUT.
// @route   POST /api/syllabus
// @access  Private/Admin
const upsertSyllabus = asyncHandler(async (req, res) => {
  const { class: classId, semester, academicYear, notes } = req.body;
  // Sent as a real array in a plain JSON request, but as a JSON *string* in
  // a multipart request (a file upload can only carry the rest of the
  // fields as plain text fields) - so parse it either way.
  const subjects = typeof req.body.subjects === "string" ? JSON.parse(req.body.subjects) : req.body.subjects;

  if (!classId || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
    res.status(400);
    throw new Error("class and at least one subject with topics are required");
  }

  const filter = { class: classId, semester: semester || 1, academicYear: academicYear || "" };
  const update = { subjects, notes, updatedBy: req.user._id };

  if (req.file) {
    // Replacing an existing PDF - remove the old one from disk so
    // uploads/syllabus doesn't accumulate orphaned files over time.
    const existing = await Syllabus.findOne(filter);
    if (existing?.fileUrl && !existing.fileUrl.startsWith("http")) {
      fs.unlink(path.join(__dirname, "..", "..", existing.fileUrl), () => {});
    }
    update.fileUrl = fileUrl(req.file);
    update.fileName = req.file.originalname;
  }

  const syllabus = await Syllabus.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });

  res.status(201).json({ success: true, syllabus });
});

const deleteSyllabus = asyncHandler(async (req, res) => {
  const syllabus = await Syllabus.findByIdAndDelete(req.params.id);
  if (!syllabus) {
    res.status(404);
    throw new Error("Syllabus not found");
  }
  res.json({ success: true, message: "Syllabus removed" });
});

module.exports = { getPublicSyllabus, getSyllabi, upsertSyllabus, deleteSyllabus };