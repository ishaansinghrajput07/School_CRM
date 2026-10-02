const express = require("express");
const { getExams, createExam, updateExam, deleteExam } = require("../controllers/examController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(getExams).post(authorize("teacher", "admin"), createExam);
router.route("/:id").put(authorize("teacher", "admin"), updateExam).delete(authorize("teacher", "admin"), deleteExam);

module.exports = router;
