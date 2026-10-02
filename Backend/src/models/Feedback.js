const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Free text, not tied to a User account - the public landing page form
    // doesn't require login (most parents browsing the marketing site
    // haven't necessarily activated a parent portal account).
    role: { type: String, enum: ["parent", "student", "alumni", "staff", "other"], default: "parent" },
    // Optional context shown alongside the quote on the landing page, e.g.
    // "Class VI" for a parent, or a graduation year for an alumnus.
    context: { type: String, trim: true, maxlength: 60 },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },

    // Moderation. Nothing is ever shown publicly until an admin approves it.
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    // Admin can lightly edit the submitted quote before publishing (typo
    // fixes, trimming length) without altering what the submitter wrote -
    // the original is preserved above, this is only used for display once set.
    editedMessage: { type: String, trim: true, maxlength: 1000 },
    featured: { type: Boolean, default: false }, // pin to the top of the carousel
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    // Basic anti-abuse metadata, not shown anywhere in the UI.
    ip: { type: String },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, featured: -1, createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
