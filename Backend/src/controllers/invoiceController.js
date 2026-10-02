const asyncHandler = require("express-async-handler");
const Invoice = require("../models/Invoice");

const getInvoices = asyncHandler(async (req, res) => {
  const { student, status } = req.query;
  const query = {};
  if (student) query.student = student;
  if (status) query.status = status;

  const invoices = await Invoice.find(query).populate("student", "firstName lastName admissionNumber").sort({ createdAt: -1 });
  res.json({ success: true, count: invoices.length, invoices });
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("student");
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }
  res.json({ success: true, invoice });
});

const createInvoice = asyncHandler(async (req, res) => {
  const count = await Invoice.countDocuments();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  const invoice = await Invoice.create({ ...req.body, invoiceNumber, issuedBy: req.user._id });
  res.status(201).json({ success: true, invoice });
});

const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }
  res.json({ success: true, invoice });
});

module.exports = { getInvoices, getInvoice, createInvoice, updateInvoiceStatus };
