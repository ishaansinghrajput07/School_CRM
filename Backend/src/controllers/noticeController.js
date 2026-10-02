const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const Notice = require("../models/Notice");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const Class = require("../models/Class");
const { sendSms } = require("../utils/sendSms");
const { emitToUser } = require("../utils/realtime");
const { fileUrl } = require("../middleware/upload");

// Students/teachers only ever see notices meant for them; admins managing
// the notice board (isActive=false included, every audience) pass ?manage=true.
const getNotices = asyncHandler(async (req, res) => {
  const { category, activeOnly, manage } = req.query;
  const query = {};
  if (category) query.category = category;
  if (activeOnly === "true") query.isActive = true;

  const isManaging = manage === "true" && req.user.role === "admin";

  if (!isManaging) {
    query.isActive = { $ne: false };

    if (req.user.role === "student") {
      query.audience = { $in: ["all", "students"] };
      const student = await Student.findOne({ user: req.user._id }, "class");
      if (student?.class) {
        // Either an untargeted (school-wide) notice, or one that explicitly
        // includes this student's class.
        query.$or = [{ targetClasses: { $size: 0 } }, { targetClasses: student.class }];
      } else {
        query.targetClasses = { $size: 0 };
      }
    } else if (req.user.role === "teacher") {
      query.audience = { $in: ["all", "staff"] };
    }
    // admins viewing the board normally (manage != true) still see everything
  }

  const notices = await Notice.find(query).populate("postedBy", "name").populate("targetClasses", "name").sort({ createdAt: -1 });
  res.json({ success: true, count: notices.length, notices });
});

const createNotice = asyncHandler(async (req, res) => {
  let source = "school";
  let body = { ...req.body };

  if (req.user.role === "teacher") {
    // A teacher's notice is always "from the class teacher" and can only
    // reach classes they're actually the class teacher of - not just any
    // class they teach a subject in, and never school-wide/staff-wide.
    const ownClasses = await Class.find({ classTeacher: req.user._id }, "_id");
    const ownClassIds = new Set(ownClasses.map((c) => String(c._id)));
    if (ownClassIds.size === 0) {
      res.status(403);
      throw new Error("Only a class teacher can post a class notice - you're not set as class teacher of any class");
    }
    const requested = (body.targetClasses || []).map(String);
    const outOfScope = requested.some((id) => !ownClassIds.has(id));
    if (requested.length === 0 || outOfScope) {
      res.status(403);
      throw new Error("You can only post notices to classes you're the class teacher of");
    }
    source = "class_teacher";
    body.audience = "students";
  } else if (req.user.designation === "principal") {
    source = "principal";
  }

  const notice = await Notice.create({ ...body, postedBy: req.user._id, source });

  const dateStr = notice.eventDate ? new Date(notice.eventDate).toLocaleDateString() : null;
  const audienceLabel = notice.category === "holiday" ? "Holiday notice" : "Notice";
  const smsBody = `St. Thomas Convent Hr. Sec. School: ${audienceLabel} - "${notice.title}"${dateStr ? ` on ${dateStr}` : ""}.`;

  // Build the recipient set of student *user* ids based on audience + optional
  // class targeting, so a class-specific notice only reaches that class.
  if (notice.isActive && (notice.audience === "all" || notice.audience === "students")) {
    const studentQuery = notice.targetClasses?.length ? { class: { $in: notice.targetClasses } } : {};
    const students = await Student.find(studentQuery, "user parent.phone");

    // Holidays and emergencies are urgent enough to also SMS parents directly.
    if (notice.category === "holiday" || notice.category === "emergency") {
      const uniquePhones = [...new Set(students.map((s) => s.parent?.phone).filter(Boolean))];
      Promise.allSettled(uniquePhones.map((phone) => sendSms({ to: phone, body: smsBody }))).then((results) => {
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed) console.error(`Notice SMS: ${failed}/${uniquePhones.length} sends failed`);
      });
    }

    const studentUserIds = students.map((s) => s.user).filter(Boolean);
    if (studentUserIds.length) {
      Notification.insertMany(
        studentUserIds.map((userId) => ({
          user: userId,
          type: notice.category === "holiday" ? "holiday_notice" : "notice",
          title: notice.title,
          message: dateStr ? `${notice.category === "holiday" ? "Holiday" : "Event"} on ${dateStr}` : notice.content.slice(0, 120),
          link: "/student/notices",
        }))
      ).then((docs) => docs.forEach((doc) => emitToUser(doc.user, "notification:new", doc)));
    }
  }

  // Staff-facing notices (audience "all" or "staff") notify every teacher too.
  if (notice.isActive && (notice.audience === "all" || notice.audience === "staff")) {
    const User = require("../models/User");
    const teachers = await User.find({ role: "teacher" }, "_id");
    if (teachers.length) {
      Notification.insertMany(
        teachers.map((t) => ({
          user: t._id,
          type: "notice",
          title: notice.title,
          message: dateStr ? `On ${dateStr}` : notice.content.slice(0, 120),
          link: "/teacher/dashboard",
        }))
      ).then((docs) => docs.forEach((doc) => emitToUser(doc.user, "notification:new", doc)));
    }
  }

  res.status(201).json({ success: true, notice });
});

const updateNotice = asyncHandler(async (req, res) => {
  const existing = await Notice.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Notice not found");
  }
  if (req.user.role === "teacher" && String(existing.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only edit notices you posted yourself");
  }

  const body = { ...req.body };
  // These are locked once a teacher's notice exists - only admin can
  // re-audience a notice or change who it's attributed to.
  if (req.user.role === "teacher") {
    delete body.source;
    delete body.audience;
    delete body.postedBy;
  }

  const notice = await Notice.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  res.json({ success: true, notice });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const existing = await Notice.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Notice not found");
  }
  if (req.user.role === "teacher" && String(existing.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only delete notices you posted yourself");
  }
  await existing.deleteOne();
  res.json({ success: true, message: "Notice removed" });
});

// @desc    Public: recent school-wide notices/events for the homepage - no
//          login required. Deliberately narrower than the in-app feed:
//          excludes anything class-specific (targetClasses set) or a
//          class teacher's own notice, and excludes exam/emergency
//          categories, since those are for enrolled families, not visitors.
// @route   GET /api/notices/public
const getPublicNotices = asyncHandler(async (req, res) => {
  const notices = await Notice.find({
    isActive: true,
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
  })
    .sort({ eventDate: 1, createdAt: -1 })
    .limit(6);
  res.json({ success: true, notices });
});

// @desc    Attach/replace the image shown on a notice/event card (e.g. an
//          Annual Function poster). Kept as its own endpoint, separate from
//          create/update, so the existing JSON-based create/update flow
//          (which also handles SMS/notification fan-out) doesn't need to be
//          restructured around multipart form data.
// @route   PUT /api/notices/:id/image
// @access  Private/Admin,Teacher (teacher limited to their own notices)
const uploadNoticeImage = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) {
    res.status(404);
    throw new Error("Notice not found");
  }
  if (req.user.role === "teacher" && String(notice.postedBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can only edit notices you posted yourself");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("An image file is required");
  }

  if (notice.imageUrl && !notice.imageUrl.startsWith("http")) {
    fs.unlink(path.join(__dirname, "..", "..", notice.imageUrl), () => {});
  }
  notice.imageUrl = fileUrl(req.file, "notices");
  await notice.save();
  res.json({ success: true, notice });
});

module.exports = { getPublicNotices, getNotices, createNotice, updateNotice, deleteNotice, uploadNoticeImage };