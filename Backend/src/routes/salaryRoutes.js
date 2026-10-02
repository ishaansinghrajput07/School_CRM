const express = require("express");
const { getSalaries, getMySalary, createSalary, updateSalary, markSalaryPaid } = require("../controllers/salaryController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Teacher/staff self-view - must come before the admin-only block below,
// and is deliberately its own route rather than a query-param toggle on
// GET / so a teacher can never accidentally widen the query to see others.
router.get("/me", authorize("teacher", "admin"), getMySalary);

router.use(authorize("admin"));

router.route("/").get(getSalaries).post(createSalary);
router.route("/:id").put(updateSalary);
router.put("/:id/pay", markSalaryPaid);

module.exports = router;