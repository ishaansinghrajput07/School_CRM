const express = require("express");
const { getStaff, createStaff, updateStaff, getTeachers, createTeacher } = require("../controllers/staffController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.route("/").get(getStaff).post(createStaff);
router.route("/teachers").get(getTeachers).post(createTeacher);
router.put("/:id", updateStaff);

module.exports = router;
