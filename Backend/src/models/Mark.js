const mongoose = require("mongoose");

const markSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    semester: { type: String, required: true, trim: true },
    academicYear: { type: String, trim: true },
    internal: { type: Number, default: 0 },
    external: { type: Number, default: 0 },
    practical: { type: Number, default: 0 },
    maxInternal: { type: Number, default: 30 },
    maxExternal: { type: Number, default: 60 },
    maxPractical: { type: Number, default: 10 },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // True when the student themselves entered this mark (only allowed for
    // classes with allowSelfResultEntry = true, i.e. Grade 8 and above).
    selfEntered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One mark record per student, per subject, per semester
markSchema.index({ student: 1, subject: 1, semester: 1 }, { unique: true });

markSchema.virtual("total").get(function () {
  return this.internal + this.external + this.practical;
});
markSchema.virtual("maxTotal").get(function () {
  return this.maxInternal + this.maxExternal + this.maxPractical;
});
markSchema.set("toJSON", { virtuals: true });
markSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Mark", markSchema);
