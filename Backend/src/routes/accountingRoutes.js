const express = require("express");
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
} = require("../controllers/accountingController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("admin"));

router.route("/").get(getTransactions).post(createTransaction);
router.route("/:id").put(updateTransaction).delete(deleteTransaction);
router.get("/summary/overview", getSummary);

module.exports = router;
