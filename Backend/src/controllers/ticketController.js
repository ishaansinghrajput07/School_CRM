const asyncHandler = require("express-async-handler");
const Ticket = require("../models/Ticket");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Student = require("../models/Student");
const Class = require("../models/Class");
const { emitToUser, emitToAdmins } = require("../utils/realtime");

// @desc    List tickets - admins see everything (optionally filtered), students see only their own
// @route   GET /api/tickets
const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, category, mine } = req.query;
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  // Students only ever see their own tickets, regardless of what they pass in
  if (req.user.role === "student" || mine === "true") query.raisedBy = req.user._id;
  // Teachers see tickets forwarded to them plus any they raised themselves -
  // not the full admin-wide list.
  else if (req.user.role === "teacher") query.$or = [{ assignedTo: req.user._id }, { raisedBy: req.user._id }];

  const tickets = await Ticket.find(query)
    .populate("raisedBy", "name email role")
    .populate("assignedTo", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: tickets.length, tickets });
});

// @desc    Get a single ticket with full reply thread
// @route   GET /api/tickets/:id
const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate("raisedBy", "name email role")
    .populate("assignedTo", "name")
    .populate("replies.repliedBy", "name role");

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  if (req.user.role === "student" && String(ticket.raisedBy._id) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to view this ticket");
  }
  if (
    req.user.role === "teacher" &&
    String(ticket.raisedBy._id) !== String(req.user._id) &&
    String(ticket.assignedTo?._id) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error("Not authorized to view this ticket");
  }
  res.json({ success: true, ticket });
});

// @desc    Who a ticket can be forwarded to. Admin office staff are always
//          listed (Principal, Accountant, Receptionist, Office Staff -
//          designation shown so a student can pick the right one). A student
//          additionally sees their own class teacher, since "ask my class
//          teacher" is usually the right first stop for most issues.
// @route   GET /api/tickets/staff/list
const getAssignableStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: "admin", isActive: true }).select("name designation");
  const options = staff.map((s) => ({
    _id: s._id,
    name: s.name,
    role: s.designation ? s.designation.replace("_", " ") : "Admin Office",
  }));

  if (req.user.role === "student") {
    const student = await Student.findOne({ user: req.user._id }, "class");
    if (student?.class) {
      const studentClass = await Class.findById(student.class).populate("classTeacher", "name isActive");
      if (studentClass?.classTeacher?.isActive) {
        options.unshift({ _id: studentClass.classTeacher._id, name: studentClass.classTeacher.name, role: "Your Class Teacher" });
      }
    }
  }

  res.json({ success: true, staff: options });
});

// @desc    Raise a new ticket
// @route   POST /api/tickets
const createTicket = asyncHandler(async (req, res) => {
  const { category, subject, description, priority, assignedTo } = req.body;

  if (!category || !subject || !description) {
    res.status(400);
    throw new Error("Category, subject, and description are required");
  }

  let validatedAssignee = null;
  if (assignedTo) {
    // Re-derive the same assignable set the picker was populated from,
    // server-side, rather than trusting the client's chosen id directly -
    // otherwise a student could route a ticket straight to any user account.
    const validIds = new Set((await User.find({ role: "admin", isActive: true }, "_id")).map((u) => String(u._id)));
    if (req.user.role === "student") {
      const student = await Student.findOne({ user: req.user._id }, "class");
      if (student?.class) {
        const studentClass = await Class.findById(student.class, "classTeacher");
        if (studentClass?.classTeacher) validIds.add(String(studentClass.classTeacher));
      }
    }
    if (validIds.has(String(assignedTo))) validatedAssignee = assignedTo;
  }

  const count = await Ticket.countDocuments();
  const ticketNumber = `TKT-${String(count + 1).padStart(6, "0")}`;

  const ticket = await Ticket.create({
    category,
    subject,
    description,
    priority: priority || "medium",
    ticketNumber,
    raisedBy: req.user._id,
    assignedTo: validatedAssignee,
  });

  const populated = await Ticket.findById(ticket._id).populate("raisedBy", "name email role").populate("assignedTo", "name");

  // Let every connected admin know a new ticket came in, live
  emitToAdmins("ticket:new", populated);
  // If it was forwarded straight to a specific person (e.g. the student's
  // class teacher, who may not be an admin and wouldn't get the admin
  // broadcast above), notify them directly too.
  if (validatedAssignee) {
    const notification = await Notification.create({
      user: validatedAssignee,
      type: "ticket_update",
      title: `New ticket forwarded to you: ${ticket.ticketNumber}`,
      message: subject,
      link: `/teacher/tickets/${ticket._id}`,
    });
    emitToUser(validatedAssignee, "notification:new", notification);
    emitToUser(validatedAssignee, "ticket:new", populated);
  }

  res.status(201).json({ success: true, ticket: populated });
});

// @desc    Reply to a ticket (either the student who raised it, or an admin)
// @route   POST /api/tickets/:id/reply
const replyTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400);
    throw new Error("Reply message cannot be empty");
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  if (req.user.role === "student" && String(ticket.raisedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Not authorized to reply to this ticket");
  }
  if (
    req.user.role === "teacher" &&
    String(ticket.raisedBy) !== String(req.user._id) &&
    String(ticket.assignedTo) !== String(req.user._id)
  ) {
    res.status(403);
    throw new Error("Not authorized to reply to this ticket");
  }

  ticket.replies.push({ message, repliedBy: req.user._id });
  // A staff reply on a brand-new ticket implicitly moves it out of "open"
  if (["admin", "teacher"].includes(req.user.role) && ticket.status === "open") {
    ticket.status = "in_progress";
  }
  await ticket.save();

  const populated = await Ticket.findById(ticket._id)
    .populate("raisedBy", "name email role")
    .populate("assignedTo", "name")
    .populate("replies.repliedBy", "name role");

  if (["admin", "teacher"].includes(req.user.role) && String(ticket.raisedBy) !== String(req.user._id)) {
    const notification = await Notification.create({
      user: ticket.raisedBy,
      type: "ticket_update",
      title: `Update on ticket ${ticket.ticketNumber}`,
      message: "The school office has replied to your ticket.",
      link: `/student/tickets/${ticket._id}`,
    });
    emitToUser(ticket.raisedBy, "notification:new", notification);
    emitToUser(ticket.raisedBy, "ticket:updated", populated);
  } else {
    // Student replied - let admins watching this ticket know
    emitToAdmins("ticket:updated", populated);
  }

  res.json({ success: true, ticket: populated });
});

// @desc    Update ticket status / priority / assignment (admin only)
// @route   PUT /api/tickets/:id/status
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, priority, assignedTo } = req.body;
  const update = {};
  if (status) update.status = status;
  if (priority) update.priority = priority;
  if (assignedTo !== undefined) update.assignedTo = assignedTo || null;

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate("raisedBy", "name email role")
    .populate("assignedTo", "name")
    .populate("replies.repliedBy", "name role");

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  if (status) {
    const notification = await Notification.create({
      user: ticket.raisedBy,
      type: "ticket_update",
      title: `Ticket ${ticket.ticketNumber} marked ${status.replace("_", " ")}`,
      message: `Your ticket "${ticket.subject}" is now ${status.replace("_", " ")}.`,
      link: `/student/tickets/${ticket._id}`,
    });
    emitToUser(ticket.raisedBy, "notification:new", notification);
  }
  emitToUser(ticket.raisedBy, "ticket:updated", ticket);
  emitToAdmins("ticket:updated", ticket);

  res.json({ success: true, ticket });
});

module.exports = { getTickets, getTicket, getAssignableStaff, createTicket, replyTicket, updateTicketStatus };