const asyncHandler = require("express-async-handler");
const ContactInquiry = require("../models/ContactInquiry");
const { emitToAdmins } = require("../utils/realtime");

const submitContactInquiry = asyncHandler(async (req, res) => {
  const { name, phone, email, message } = req.body;
  if (
    typeof name !== "string" ||
    typeof phone !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !phone.trim() ||
    !email.trim() ||
    !message.trim()
  ) {
    res.status(400);
    throw new Error("Name, phone, email and message are required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }
  if (message.trim().length > 2000) {
    res.status(400);
    throw new Error("Message is too long (maximum 2000 characters)");
  }

  const inquiry = await ContactInquiry.create({
    name: name.trim().slice(0, 100),
    phone: phone.trim().slice(0, 30),
    email: email.trim().toLowerCase().slice(0, 254),
    message: message.trim(),
    ip: req.ip,
  });

  emitToAdmins("contact-inquiry:new", {
    id: inquiry._id,
    name: inquiry.name,
    createdAt: inquiry.createdAt,
  });

  res.status(201).json({ success: true, message: "Your message was sent. Our office will get back to you soon." });
});

const getContactInquiries = asyncHandler(async (req, res) => {
  const query = {};
  if (["pending", "resolved"].includes(req.query.status)) query.status = req.query.status;
  const inquiries = await ContactInquiry.find(query).sort({ createdAt: -1 }).select("-ip");
  res.json({ success: true, inquiries });
});

const updateContactInquiry = asyncHandler(async (req, res) => {
  if (!["pending", "resolved"].includes(req.body.status)) {
    res.status(400);
    throw new Error("Status must be pending or resolved");
  }
  const inquiry = await ContactInquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).select("-ip");
  if (!inquiry) {
    res.status(404);
    throw new Error("Contact inquiry not found");
  }
  res.json({ success: true, inquiry });
});

const deleteContactInquiry = asyncHandler(async (req, res) => {
  const inquiry = await ContactInquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error("Contact inquiry not found");
  }
  res.json({ success: true, message: "Contact inquiry deleted" });
});

module.exports = { submitContactInquiry, getContactInquiries, updateContactInquiry, deleteContactInquiry };
