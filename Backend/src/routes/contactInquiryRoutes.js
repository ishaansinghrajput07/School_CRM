const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  submitContactInquiry,
  getContactInquiries,
  updateContactInquiry,
  deleteContactInquiry,
} = require("../controllers/contactInquiryController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many messages sent - please try again later" },
});

router.post("/", contactLimiter, submitContactInquiry);

router.use(protect, authorize("admin"));
router.get("/", getContactInquiries);
router.patch("/:id", updateContactInquiry);
router.delete("/:id", deleteContactInquiry);

module.exports = router;
