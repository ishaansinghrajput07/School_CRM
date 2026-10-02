const express = require("express");
const {
  getMyExternalResults,
  getStudentExternalResults,
  createExternalResult,
  updateExternalResult,
  deleteExternalResult,
} = require("../controllers/externalResultController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/me", authorize("student"), getMyExternalResults);
router.get("/student/:studentId", getStudentExternalResults);
router.post("/", createExternalResult);
router.route("/:id").put(updateExternalResult).delete(deleteExternalResult);

module.exports = router;
