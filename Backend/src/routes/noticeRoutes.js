const express = require("express");
const {
  getPublicNotices,
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  uploadNoticeImage,
} = require("../controllers/noticeController");
const { protect, authorize } = require("../middleware/auth");
const { noticeUpload } = require("../middleware/upload");

const router = express.Router();

// Public - no login required, this is homepage content
router.get("/public", getPublicNotices);

router.use(protect);

router.route("/").get(getNotices).post(authorize("admin", "teacher"), createNotice);
router.route("/:id").put(authorize("admin", "teacher"), updateNotice).delete(authorize("admin", "teacher"), deleteNotice);
router.put("/:id/image", authorize("admin", "teacher"), noticeUpload.single("image"), uploadNoticeImage);

module.exports = router;