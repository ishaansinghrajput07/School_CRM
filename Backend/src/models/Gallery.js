const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    category: {
      type: String,
      enum: ["campus", "events", "sports", "academics", "cultural", "activities"],
      default: "campus",
    },
    // Path under /uploads, e.g. "/uploads/gallery/172xxxx-123.jpg" - actual
    // file lives on disk (see middleware/upload.js), not base64 in Mongo,
    // since a gallery can grow to hundreds of images and that would bloat
    // every query that touches this collection.
    imageUrl: { type: String, required: true },
    caption: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // Marks the one photo (if any) shown in the homepage hero, in place of
    // the fallback report-card panel. Admin picks this explicitly rather
    // than it being "whatever was uploaded most recently."
    featured: { type: Boolean, default: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

gallerySchema.index({ category: 1, order: 1 });

module.exports = mongoose.model("Gallery", gallerySchema);