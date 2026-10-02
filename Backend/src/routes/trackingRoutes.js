const express = require("express");
const { getRequests, createRequest, updateRequestStatus } = require("../controllers/trackingController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(getRequests).post(createRequest);
router.put("/:id/status", authorize("admin"), updateRequestStatus);

module.exports = router;
