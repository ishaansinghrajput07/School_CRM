const asyncHandler = require("express-async-handler");
const Settings = require("../models/Settings");

// @desc    Get school settings (name, timing, working days) - every logged-in
//          role needs to read this (e.g. to show school hours on dashboards)
// @route   GET /api/settings
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: "school" });
  if (!settings) {
    settings = await Settings.create({ key: "school" });
  }
  res.json({ success: true, settings });
});

// @desc    Update school settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  const allowed = ["schoolName", "tagline", "schoolStartTime", "schoolEndTime", "workingDays", "address", "contactPhone", "contactEmail"];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const settings = await Settings.findOneAndUpdate({ key: "school" }, updates, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  res.json({ success: true, settings });
});

module.exports = { getSettings, updateSettings };
