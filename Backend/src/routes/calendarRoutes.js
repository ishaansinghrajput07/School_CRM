const express = require("express");
const { getCalendarEvents } = require("../controllers/calendarController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getCalendarEvents);

module.exports = router;
