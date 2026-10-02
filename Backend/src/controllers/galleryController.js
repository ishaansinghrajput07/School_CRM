const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Gallery = require("../models/Gallery");
const { fileUrl } = require("../middleware/upload");

// @desc    Public: active gallery photos, optionally filtered by category -
//          powers the homepage gallery, no login required.
// @route   GET /api/gallery/public
const getPublicGallery = asyncHandler(async (req, res) => {
  const query = { isActive: true };
  if (req.query.category && req.query.category !== "all") query.category = req.query.category;
  const photos = await Gallery.find(query).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, photos });
});

// @desc    Admin: every photo regardless of active/inactive, for management
// @route   GET /api/gallery
// @access  Private/Admin
const getGallery = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.category && req.query.category !== "all") query.category = req.query.category;
  const photos = await Gallery.find(query).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, photos });
});

// @desc    Upload a new gallery photo
// @route   POST /api/gallery
// @access  Private/Admin
const createGalleryPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("An image file is required");
  }
  const { title, category, caption, order } = req.body;
  const photo = await Gallery.create({
    title,
    category: category || "campus",
    caption,
    order: order ? Number(order) : 0,
    imageUrl: fileUrl(req.file, "gallery"),
    uploadedBy: req.user._id,
  });
  res.status(201).json({ success: true, photo });
});

// @desc    Edit a photo's metadata (category/caption/order/active), or swap
//          the image file itself if a new one is uploaded
// @route   PUT /api/gallery/:id
// @access  Private/Admin
const updateGalleryPhoto = asyncHandler(async (req, res) => {
  const photo = await Gallery.findById(req.params.id);
  if (!photo) {
    res.status(404);
    throw new Error("Photo not found");
  }

  const { title, category, caption, order, isActive, featured } = req.body;
  if (title !== undefined) photo.title = title;
  if (category !== undefined) photo.category = category;
  if (caption !== undefined) photo.caption = caption;
  if (order !== undefined) photo.order = Number(order);
  if (isActive !== undefined) photo.isActive = isActive === "true" || isActive === true;
  if (featured !== undefined) {
    const isFeatured = featured === "true" || featured === true;
    // Only one photo can be the featured hero image at a time - turning
    // this one on turns every other one off, rather than requiring the
    // admin to remember to un-feature the old one first.
    if (isFeatured) await Gallery.updateMany({ _id: { $ne: photo._id } }, { featured: false });
    photo.featured = isFeatured;
  }

  if (req.file) {
    // Only attempt to delete the old file from local disk - if Cloudinary
    // is active, photo.imageUrl is a full https:// URL, not a local path,
    // and there's nothing on this server's disk to clean up.
    if (photo.imageUrl && !photo.imageUrl.startsWith("http")) {
      const oldPath = path.join(__dirname, "..", "..", photo.imageUrl);
      fs.unlink(oldPath, () => {}); // best-effort; a missing old file shouldn't block the update
    }
    photo.imageUrl = fileUrl(req.file, "gallery");
  }

  await photo.save();
  res.json({ success: true, photo });
});

const deleteGalleryPhoto = asyncHandler(async (req, res) => {
  const photo = await Gallery.findByIdAndDelete(req.params.id);
  if (!photo) {
    res.status(404);
    throw new Error("Photo not found");
  }
  if (photo.imageUrl && !photo.imageUrl.startsWith("http")) {
    const filePath = path.join(__dirname, "..", "..", photo.imageUrl);
    fs.unlink(filePath, () => {});
  }
  res.json({ success: true, message: "Photo removed" });
});

module.exports = { getPublicGallery, getGallery, createGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto };