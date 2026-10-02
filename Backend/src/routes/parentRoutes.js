const express = require("express");
const { getChildren, getChildOverview } = require("../controllers/parentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("parent"));

router.get("/children", getChildren);
router.get("/children/:studentId/overview", getChildOverview);

module.exports = router;
