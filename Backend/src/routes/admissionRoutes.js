const express = require("express");
const rateLimit = require("express-rate-limit");
const { submitApplication, getApplications, updateApplication, deleteApplication } = require("../controllers/admissionController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many applications submitted - please try again later" },
});

router.post("/", applicationLimiter, submitApplication);

router.use(protect, authorize("admin"));
router.get("/", getApplications);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;
