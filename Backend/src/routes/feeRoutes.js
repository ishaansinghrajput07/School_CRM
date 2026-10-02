const express = require("express");
const { getFees, createFee, updateFee, recordPayment, deleteFee } = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(getFees).post(authorize("admin"), createFee);
router.route("/:id").put(authorize("admin"), updateFee).delete(authorize("admin"), deleteFee);
router.post("/:id/pay", authorize("admin"), recordPayment);

module.exports = router;
