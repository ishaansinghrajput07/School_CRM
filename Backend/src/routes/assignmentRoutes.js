const express = require("express");
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
} = require("../controllers/assignmentController");
const { protect, authorize } = require("../middleware/auth");
const { assignmentUpload } = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getAssignments)
  .post(authorize("teacher", "admin"), assignmentUpload.single("attachment"), createAssignment);

router
  .route("/:id")
  .get(getAssignment)
  .put(authorize("teacher", "admin"), assignmentUpload.single("attachment"), updateAssignment)
  .delete(authorize("teacher", "admin"), deleteAssignment);

router.post("/:id/submit", authorize("student"), assignmentUpload.single("file"), submitAssignment);
router.put("/:id/grade/:studentId", authorize("teacher", "admin"), gradeSubmission);

module.exports = router;
