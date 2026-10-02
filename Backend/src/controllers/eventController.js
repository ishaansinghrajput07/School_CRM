const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Student = require("../models/Student");
const { emitToEvent, emitToAdmins } = require("../utils/realtime");

// @desc    Upcoming events for the public landing page (no login, no
//          registration status - just what's coming up)
// @route   GET /api/events/public
// @access  Public
const getPublicEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ isActive: true, date: { $gte: new Date() } })
    .sort({ date: 1 })
    .limit(12)
    .select("title description category date startTime endTime location coverImageUrl");
  res.json({ success: true, events });
});

// @desc    Events visible to the logged-in user, with their registration
//          status and live seat count
// @route   GET /api/events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  const { manage, upcoming } = req.query;
  const isManaging = manage === "true" && req.user.role === "admin";

  const query = {};
  if (!isManaging) {
    query.isActive = true;
    if (req.user.role === "student") {
      query.audience = { $in: ["all", "students"] };
      const student = await Student.findOne({ user: req.user._id }, "class");
      if (student?.class) {
        query.$or = [{ targetClasses: { $size: 0 } }, { targetClasses: student.class }];
      } else {
        query.targetClasses = { $size: 0 };
      }
    } else if (req.user.role === "teacher") {
      query.audience = { $in: ["all", "staff"] };
    }
  }
  if (upcoming === "true") query.date = { $gte: new Date() };

  const events = await Event.find(query).sort({ date: 1 });

  // Attach "am I registered" without an N+1 - one query for all of this
  // user's registrations across the returned events.
  const myRegs = await EventRegistration.find({ user: req.user._id, event: { $in: events.map((e) => e._id) } }, "event");
  const registeredSet = new Set(myRegs.map((r) => String(r.event)));

  res.json({
    success: true,
    events: events.map((e) => ({ ...e.toObject(), isRegistered: registeredSet.has(String(e._id)) })),
  });
});

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, date, startTime, endTime, location, capacity, registrationDeadline, audience, targetClasses } = req.body;

  if (!title?.trim() || !date) {
    res.status(400);
    throw new Error("Title and date are required");
  }

  const event = await Event.create({
    title: title.trim(),
    description,
    category,
    date,
    startTime,
    endTime,
    location,
    capacity: capacity || undefined,
    registrationDeadline: registrationDeadline || undefined,
    audience,
    targetClasses,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, event });
});

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }

  const fields = ["title", "description", "category", "date", "startTime", "endTime", "location", "capacity", "registrationDeadline", "audience", "targetClasses", "isActive"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) event[f] = req.body[f] || undefined;
  });

  await event.save();
  emitToEvent(event._id, "event:updated", { eventId: event._id });
  res.json({ success: true, event });
});

// @desc    Delete an event (and its registrations)
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Event not found");
  }
  await EventRegistration.deleteMany({ event: event._id });
  await event.deleteOne();
  res.json({ success: true, message: "Event deleted" });
});

// @desc    List everyone registered for an event
// @route   GET /api/events/:id/registrants
// @access  Private/Admin
const getRegistrants = asyncHandler(async (req, res) => {
  const registrants = await EventRegistration.find({ event: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, registrants });
});

// @desc    Register the logged-in user for an event
// @route   POST /api/events/:id/register
// @access  Private (any authenticated role)
const registerForEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const event = await Event.findById(eventId);
  if (!event || !event.isActive) {
    res.status(404);
    throw new Error("Event not found");
  }
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    res.status(400);
    throw new Error("Registration for this event has closed");
  }
  if (new Date(event.date) < new Date()) {
    res.status(400);
    throw new Error("This event has already happened");
  }

  let classLabel;
  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id }).populate("class", "name");
    classLabel = student?.class?.name;
  }

  // A registration touches two documents (the counter on Event, and the
  // EventRegistration record itself) and must stay consistent even when
  // many students hit "Register" on a limited-capacity event at the same
  // moment - a transaction is what actually guarantees no overbooking
  // under concurrent load, rather than a check-then-write race.
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Atomic, capacity-guarded increment: only succeeds if there's still
      // room (or no capacity limit), so two simultaneous requests can't
      // both read "1 seat left" and both succeed.
      const updated = await Event.findOneAndUpdate(
        { _id: eventId, $or: [{ capacity: { $exists: false } }, { $expr: { $lt: ["$registeredCount", "$capacity"] } }] },
        { $inc: { registeredCount: 1 } },
        { new: true, session }
      );
      if (!updated) {
        const err = new Error("This event is full");
        err.statusCode = 400;
        throw err;
      }

      try {
        await EventRegistration.create(
          [{ event: eventId, user: req.user._id, name: req.user.name, role: req.user.role, classLabel }],
          { session }
        );
      } catch (err) {
        if (err.code === 11000) {
          const dupErr = new Error("You're already registered for this event");
          dupErr.statusCode = 400;
          throw dupErr;
        }
        throw err;
      }
    });
  } catch (err) {
    res.status(err.statusCode || 500);
    throw new Error(err.message || "Registration failed");
  } finally {
    session.endSession();
  }

  const fresh = await Event.findById(eventId, "registeredCount capacity");
  emitToEvent(eventId, "event:count", { eventId, registeredCount: fresh.registeredCount, capacity: fresh.capacity });
  emitToAdmins("event:registration", { eventId, title: event.title, name: req.user.name });

  res.status(201).json({ success: true, registeredCount: fresh.registeredCount });
});

// @desc    Cancel the logged-in user's own registration
// @route   DELETE /api/events/:id/register
// @access  Private
const cancelRegistration = asyncHandler(async (req, res) => {
  const eventId = req.params.id;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const reg = await EventRegistration.findOneAndDelete({ event: eventId, user: req.user._id }, { session });
      if (!reg) {
        const err = new Error("You're not registered for this event");
        err.statusCode = 400;
        throw err;
      }
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } }, { session });
    });
  } catch (err) {
    res.status(err.statusCode || 500);
    throw new Error(err.message || "Cancellation failed");
  } finally {
    session.endSession();
  }

  const fresh = await Event.findById(eventId, "registeredCount capacity");
  emitToEvent(eventId, "event:count", { eventId, registeredCount: fresh?.registeredCount ?? 0, capacity: fresh?.capacity });

  res.json({ success: true, registeredCount: fresh?.registeredCount ?? 0 });
});

module.exports = {
  getPublicEvents,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getRegistrants,
  registerForEvent,
  cancelRegistration,
};
