const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Denormalized at registration time purely for fast admin list rendering
    // (avoids populating User+Student on every registrant list fetch).
    name: { type: String, required: true },
    role: { type: String, required: true },
    classLabel: { type: String }, // e.g. "Class VI - A", only set for students
  },
  { timestamps: true }
);

// A user can only hold one registration per event - re-registering after
// cancelling is fine since cancellation deletes this document entirely.
eventRegistrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
