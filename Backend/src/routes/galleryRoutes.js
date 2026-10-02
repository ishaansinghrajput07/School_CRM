const express = require("express");
const {
  getPublicGallery,
  getGallery,
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
} = require("../controllers/galleryController");
const { protect, authorize } = require("../middleware/auth");
const { galleryUpload } = require("../middleware/upload");

const router = express.Router();

// Public - no login required, this is homepage content
router.get("/public", getPublicGallery);

router.use(protect, authorize("admin"));

router.route("/").get(getGallery).post(galleryUpload.single("image"), createGalleryPhoto);
router.route("/:id").put(galleryUpload.single("image"), updateGalleryPhoto).delete(deleteGalleryPhoto);

module.exports = router;