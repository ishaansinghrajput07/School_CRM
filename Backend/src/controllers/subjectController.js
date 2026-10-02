const asyncHandler = require("express-async-handler");
const Subject = require("../models/Subject");

const getSubjects = asyncHandler(async (req, res) => {
  const { class: classId } = req.query;
  const query = classId ? { class: classId } : {};
  const subjects = await Subject.find(query).populate("class", "name").populate("teacher", "name");
  res.json({ success: true, subjects });
});

const createSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ success: true, subject });
});

const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  res.json({ success: true, subject });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }
  res.json({ success: true, message: "Subject removed" });
});

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
