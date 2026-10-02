const express = require("express");
const { getClasses, getPublicClasses, createClass, updateClass, updateAttendancePolicy, deleteClass, assignStudents } = require("../controllers/classController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public: the signup form needs class names before the applicant has an account
router.get("/public", getPublicClasses);

router.use(protect);

router.route("/").get(getClasses).post(authorize("admin"), createClass);
router.route("/:id").put(authorize("admin"), updateClass).delete(authorize("admin"), deleteClass);
router.put("/:id/attendance-policy", authorize("admin", "teacher"), updateAttendancePolicy);
router.post("/:id/assign-students", authorize("admin"), assignStudents);

module.exports = router;