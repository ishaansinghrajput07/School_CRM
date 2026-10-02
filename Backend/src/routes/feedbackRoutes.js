const express = require("express");
const rateLimit = require("express-rate-limit");
const { submitFeedback, getPublicFeedback, getFeedback, updateFeedback, deleteFeedback } = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Anyone can submit feedback without logging in, but cap it hard - this is
// a public, unauthenticated write endpoint and an easy spam target otherwise.
const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions - please try again later" },
});

router.get("/public", getPublicFeedback);
router.post("/", feedbackLimiter, submitFeedback);

router.use(protect, authorize("admin"));
router.get("/", getFeedback);
router.patch("/:id", updateFeedback);
router.delete("/:id", deleteFeedback);

module.exports = router;
