const express = require("express");
const { markAttendance, getAttendance, getAttendanceSummary, getMyClasses, getClassEligibility } = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/mark", authorize("admin", "teacher"), markAttendance);
router.get("/my-classes", authorize("teacher"), getMyClasses);
router.get("/eligibility/:classId", authorize("admin", "teacher"), getClassEligibility);
router.get("/", getAttendance);
router.get("/summary/:studentId", getAttendanceSummary);

module.exports = router;