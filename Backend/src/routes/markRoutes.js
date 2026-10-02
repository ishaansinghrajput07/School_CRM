const express = require("express");
const { getRoster, bulkSaveMarks, getMyMarksRoster, saveMyMark } = require("../controllers/markController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Student self-entry (Grade 8+ only - enforced in the controller)
router.route("/me").get(authorize("student"), getMyMarksRoster).post(authorize("student"), saveMyMark);

// Teacher/admin marks entry for a class roster
router.get("/", authorize("teacher", "admin"), getRoster);
router.post("/bulk", authorize("teacher", "admin"), bulkSaveMarks);

module.exports = router;
