const express = require("express");
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  submitProject,
  reviewSubmission,
} = require("../controllers/projectController");
const { protect, authorize } = require("../middleware/auth");
const { projectUpload } = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getProjects)
  .post(authorize("teacher", "admin"), createProject);

router
  .route("/:id")
  .get(getProject)
  .put(authorize("teacher", "admin"), updateProject)
  .delete(authorize("teacher", "admin"), deleteProject);

router.post("/:id/submit", authorize("student"), projectUpload.single("file"), submitProject);
router.put("/:id/review/:studentId", authorize("teacher", "admin"), reviewSubmission);

module.exports = router;
