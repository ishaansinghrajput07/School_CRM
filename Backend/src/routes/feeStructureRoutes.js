const express = require("express");
const {
  getPublicFeeStructures,
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} = require("../controllers/feeStructureController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public - published fee structure, no login required
router.get("/public", getPublicFeeStructures);

router.use(protect, authorize("admin"));

router.route("/").get(getFeeStructures).post(createFeeStructure);
router.route("/:id").put(updateFeeStructure).delete(deleteFeeStructure);

module.exports = router;