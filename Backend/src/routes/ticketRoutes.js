const express = require("express");
const {
  getTickets,
  getTicket,
  getAssignableStaff,
  createTicket,
  replyTicket,
  updateTicketStatus,
} = require("../controllers/ticketController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/staff/list", authorize("admin"), getAssignableStaff);
router.route("/").get(getTickets).post(createTicket);
router.route("/:id").get(getTicket);
router.post("/:id/reply", replyTicket);
router.put("/:id/status", authorize("admin"), updateTicketStatus);

module.exports = router;
