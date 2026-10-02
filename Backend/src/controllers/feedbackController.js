const asyncHandler = require("express-async-handler");
const Feedback = require("../models/Feedback");
const { emitToAdmins } = require("../utils/realtime");

// @desc    Submit feedback (public - no login required)
// @route   POST /api/feedback
// @access  Public
const submitFeedback = asyncHandler(async (req, res) => {
  const { name, role, context, rating, message } = req.body;

  if (
    typeof name !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !message.trim() ||
    rating === undefined ||
    rating === null ||
    rating === ""
  ) {
    res.status(400);
    throw new Error("Name, rating and message are required");
  }
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    res.status(400);
    throw new Error("Rating must be a whole number between 1 and 5");
  }
  if (message.trim().length > 1000) {
    res.status(400);
    throw new Error("Message is too long (max 1000 characters)");
  }
  if (role !== undefined && !["parent", "student", "alumni", "staff", "other"].includes(role)) {
    res.status(400);
    throw new Error("Please select a valid feedback role");
  }
  if (context !== undefined && (typeof context !== "string" || context.trim().length > 60)) {
    res.status(400);
    throw new Error("Context must be 60 characters or fewer");
  }

  const feedback = await Feedback.create({
    name: name.trim().slice(0, 100),
    role: role || "parent",
    context: context?.trim(),
    rating: numericRating,
    message: message.trim(),
    ip: req.ip,
  });

  // Let any admin currently looking at the dashboard know a new one came in,
  // without them needing to refresh or poll.
  emitToAdmins("feedback:new", {
    id: feedback._id,
    name: feedback.name,
    rating: feedback.rating,
    createdAt: feedback.createdAt,
  });

  res.status(201).json({
    success: true,
    message: "Thank you for your feedback! It has been saved and is awaiting review.",
    feedback: {
      id: feedback._id,
      name: feedback.name,
      role: feedback.role,
      context: feedback.context,
      rating: feedback.rating,
      message: feedback.message,
      status: feedback.status,
      createdAt: feedback.createdAt,
    },
  });
});

// @desc    Approved feedback for the public testimonials carousel
// @route   GET /api/feedback/public
// @access  Public
const getPublicFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ status: "approved" })
    .sort({ featured: -1, reviewedAt: -1 })
    .limit(20)
    .select("name role context rating message editedMessage createdAt");

  res.json({
    success: true,
    feedback: feedback.map((f) => ({
      id: f._id,
      name: f.name,
      role: f.role,
      context: f.context,
      rating: f.rating,
      // Show the admin-edited version if one was set, otherwise the original
      message: f.editedMessage || f.message,
      createdAt: f.createdAt,
    })),
  });
});

// @desc    List all feedback for moderation (any status)
// @route   GET /api/feedback
// @access  Private/Admin
const getFeedback = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) query.status = status;

  const feedback = await Feedback.find(query).sort({ createdAt: -1 }).populate("reviewedBy", "name");
  res.json({ success: true, feedback });
});

// @desc    Approve, reject, edit or feature a piece of feedback
// @route   PATCH /api/feedback/:id
// @access  Private/Admin
const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }

  const { status, editedMessage, featured } = req.body;

  if (status !== undefined) {
    if (!["pending", "approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }
    feedback.status = status;
    feedback.reviewedBy = req.user._id;
    feedback.reviewedAt = new Date();
  }
  if (editedMessage !== undefined) {
    feedback.editedMessage = editedMessage.trim().slice(0, 1000) || undefined;
  }
  if (featured !== undefined) {
    feedback.featured = Boolean(featured);
  }

  await feedback.save();
  res.json({ success: true, feedback });
});

// @desc    Delete a piece of feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndDelete(req.params.id);
  if (!feedback) {
    res.status(404);
    throw new Error("Feedback not found");
  }
  res.json({ success: true, message: "Feedback deleted" });
});

module.exports = { submitFeedback, getPublicFeedback, getFeedback, updateFeedback, deleteFeedback };
