const express = require("express");
const { getMyResults, getStudentResults, getClassResults } = require("../controllers/resultController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/me", authorize("student"), getMyResults);
router.get("/class/:classId", authorize("teacher", "admin"), getClassResults);
router.get("/:studentId", authorize("teacher", "admin"), getStudentResults);

module.exports = router;
