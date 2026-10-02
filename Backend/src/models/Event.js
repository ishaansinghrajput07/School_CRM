const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: { type: String, enum: ["academic", "sports", "cultural", "workshop", "other"], default: "other" },
    date: { type: Date, required: true },
    startTime: { type: String, trim: true }, // free-text "10:00 AM" - display only
    endTime: { type: String, trim: true },
    location: { type: String, trim: true, maxlength: 200 },

    // null/undefined = unlimited seats
    capacity: { type: Number, min: 1 },
    // Denormalized counter, kept in sync atomically alongside EventRegistration
    // documents (see eventController) so "is this event full" is a cheap
    // read instead of a COUNT query on every page view.
    registeredCount: { type: Number, default: 0, min: 0 },
    registrationDeadline: { type: Date },

    // Same audience-targeting pattern as Notice, so an event can be
    // school-wide or scoped to specific classes/roles.
    audience: { type: String, enum: ["all", "students", "staff"], default: "all" },
    targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],

    coverImageUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1, isActive: 1 });

module.exports = mongoose.model("Event", eventSchema);
