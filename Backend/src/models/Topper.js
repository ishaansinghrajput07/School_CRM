const mongoose = require("mongoose");

const topperSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Free text on purpose ("School Topper", "Gold Medalist", "1st Rank") -
    // schools describe this inconsistently and a rigid enum would fight
    // the admin form more than it would help.
    rank: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true }, // e.g. "Class X"
    stream: { type: String, trim: true }, // e.g. "Science" - optional, only relevant for Class XI/XII
    academicYear: { type: String, required: true, trim: true }, // e.g. "2025-26"
    percentage: { type: Number, min: 0, max: 100 },
    // Path under /uploads (local disk) or a full Cloudinary https:// URL -
    // same convention as Gallery.imageUrl, see middleware/upload.js.
    photoUrl: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

topperSchema.index({ academicYear: 1, order: 1 });

module.exports = mongoose.model("Topper", topperSchema);
