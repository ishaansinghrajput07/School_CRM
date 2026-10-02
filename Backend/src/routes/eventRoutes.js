const express = require("express");
const {
  getPublicEvents,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getRegistrants,
  registerForEvent,
  cancelRegistration,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/public", getPublicEvents);

router.use(protect);

router.get("/", getEvents);
router.post("/", authorize("admin"), createEvent);
router.put("/:id", authorize("admin"), updateEvent);
router.delete("/:id", authorize("admin"), deleteEvent);
router.get("/:id/registrants", authorize("admin"), getRegistrants);
router.post("/:id/register", registerForEvent);
router.delete("/:id/register", cancelRegistration);

module.exports = router;
