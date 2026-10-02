const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "attendance_alert",
        "fee_reminder",
        "holiday_notice",
        "notice",
        "notice",
        "ticket_update",
        "salary_update",
        "announcement",
        "assignment_new",
        "assignment_graded",
        "project_new",
        "project_reviewed",
        "result_published",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String }, // optional deep-link e.g. /admin/tickets/123
  },
  { timestamps: true }
);

// Covers the notification bell's query exactly: filter by user, sort by
// createdAt descending. Without this, that query - which fires on every
// single page load for every logged-in user - does a full collection scan
// as the table grows, which gets slower over the life of the app even
// though nothing about the code changed.
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);