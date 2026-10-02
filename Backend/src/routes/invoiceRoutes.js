const express = require("express");
const { getInvoices, getInvoice, createInvoice, updateInvoiceStatus } = require("../controllers/invoiceController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.route("/").get(getInvoices).post(authorize("admin"), createInvoice);
router.route("/:id").get(getInvoice);
router.put("/:id/status", authorize("admin"), updateInvoiceStatus);

module.exports = router;
