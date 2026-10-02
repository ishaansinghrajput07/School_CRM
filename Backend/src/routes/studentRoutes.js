const express = require("express");
const {
  getStudents,
  getStudent,
  getMyProfile,
  updateMyProfile,
  createStudent,
  updateStudent,
  deleteStudent,
  getIdCard,
  createParentAccount,
  promoteStudent,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(authorize("admin", "teacher"), getStudents).post(authorize("admin"), createStudent);

// IMPORTANT: /me must be registered before /:id, otherwise Express matches
// "me" as an :id param and it never reaches this handler.
router.route("/me").get(authorize("student"), getMyProfile).put(authorize("student"), updateMyProfile);

router
  .route("/:id")
  // Ownership is enforced inside the controller (student: own profile only,
  // parent: own children only, admin/teacher: any student).
  .get(getStudent)
  .put(authorize("admin"), updateStudent)
  .delete(authorize("admin"), deleteStudent);
router.get("/:id/id-card", getIdCard);
router.post("/:id/parent-account", authorize("admin"), createParentAccount);
router.post("/:id/promote", authorize("admin"), promoteStudent);

module.exports = router;
