const asyncHandler = require("express-async-handler");
const TrackingRequest = require("../models/TrackingRequest");

const getRequests = asyncHandler(async (req, res) => {
  const { status, student } = req.query;
  const query = {};
  if (status) query.status = status;
  if (student) query.student = student;

  const requests = await TrackingRequest.find(query)
    .populate("student", "firstName lastName admissionNumber")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: requests.length, requests });
});

const createRequest = asyncHandler(async (req, res) => {
  const count = await TrackingRequest.countDocuments();
  const requestNumber = `REQ-${String(count + 1).padStart(6, "0")}`;
  const request = await TrackingRequest.create({ ...req.body, requestNumber });
  res.status(201).json({ success: true, request });
});

const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const request = await TrackingRequest.findByIdAndUpdate(
    req.params.id,
    { status, remarks, processedBy: req.user._id },
    { new: true }
  );
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  res.json({ success: true, request });
});

module.exports = { getRequests, createRequest, updateRequestStatus };
