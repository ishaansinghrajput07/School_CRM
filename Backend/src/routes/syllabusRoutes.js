const express = require("express");
const { getPublicSyllabus, getSyllabi, upsertSyllabus, deleteSyllabus } = require("../controllers/syllabusController");
const { protect, authorize } = require("../middleware/auth");
const { syllabusUpload } = require("../middleware/upload");

const router = express.Router();

// Public - no login required, this is homepage content
router.get("/public", getPublicSyllabus);

router.use(protect, authorize("admin"));

router.route("/").get(getSyllabi).post(syllabusUpload.single("file"), upsertSyllabus);
router.delete("/:id", deleteSyllabus);

module.exports = router;