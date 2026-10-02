const express = require("express");
const {
  getPublicToppers,
  getToppers,
  createTopper,
  updateTopper,
  deleteTopper,
} = require("../controllers/topperController");
const { protect, authorize } = require("../middleware/auth");
const { topperUpload } = require("../middleware/upload");

const router = express.Router();

// Public - no login required, this is homepage content
router.get("/public", getPublicToppers);

router.use(protect, authorize("admin"));

router.route("/").get(getToppers).post(topperUpload.single("photo"), createTopper);
router.route("/:id").put(topperUpload.single("photo"), updateTopper).delete(deleteTopper);

module.exports = router;
