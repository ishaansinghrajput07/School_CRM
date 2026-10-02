const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true }, // e.g. "Nursery", "Grade 8"
    // Sort key so the class list always reads Nursery -> LKG -> UKG -> Grade 1...Grade 12,
    // never alphabetically (which would put "Grade 10" before "Grade 2").
    order: { type: Number, required: true },
    sections: [{ type: String, trim: true }], // e.g. ["A", "B"]
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Admin-controlled: how many semesters/terms this class is divided into.
    // Drives the semester dropdown for marks entry, student self-entry, and
    // the "at least N results" checks elsewhere in the app.
    semesterCount: { type: Number, default: 2, min: 1, max: 12 },
    // Optional soft cap on students per section (e.g. 40). Purely a
    // planning/warning limit, not a hard technical limit - MongoDB itself
    // has no meaningful per-collection row limit for a school's scale of
    // data (a single class of even a few hundred students is trivial), so
    // this exists to help admins catch overcrowding, not to protect the DB.
    maxStudentsPerSection: { type: Number, default: 40, min: 1 },
    // Below this class level, results must be entered by a teacher/admin.
    // At/above it, students are allowed to self-report their own marks.
    allowSelfResultEntry: { type: Boolean, default: false },
    // Minimum attendance % a student needs to be exam-eligible in this
    // class. Admin sets the school default at class creation; the class
    // teacher can also adjust it for their own class from there on
    // (Teacher -> My Classes -> Attendance Policy) - both are allowed to
    // change it, whichever is more current wins since there's only one value.
    minAttendancePercent: { type: Number, default: 75, min: 0, max: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);