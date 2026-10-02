const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, enum: ["holiday", "exam", "emergency", "event", "general"], default: "general" },
    eventDate: { type: Date }, // when the holiday/exam/event actually falls, for the Academic Calendar
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Who this notice is "from", for the student/teacher UI to group and
    // badge notices differently (Principal's Desk vs Class Teacher vs
    // general school office). Set automatically server-side from the
    // poster's role/designation at creation time - never client-supplied,
    // so it can't be spoofed.
    source: { type: String, enum: ["principal", "class_teacher", "school"], default: "school" },
    // "all" -> every student + staff member. "students" -> every student
    // (optionally narrowed further to specific classes via targetClasses).
    // "staff" -> teachers/admin only.
    audience: { type: String, enum: ["all", "students", "staff"], default: "all" },
    // When set (and audience is "students" or "all"), only students in these
    // classes see the notice - lets admins send a notice to one class only.
    targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    // Card accent color shown on the notice board, chosen by whoever posts it.
    color: {
      type: String,
      enum: ["teal", "amber", "rose", "violet", "sky", "emerald", "slate"],
      default: "teal",
    },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);