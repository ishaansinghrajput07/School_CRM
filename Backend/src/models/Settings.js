const mongoose = require("mongoose");

// Deliberately a singleton - there is only ever one row in this collection,
// fetched/updated by a fixed key rather than an _id the client has to know.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "school", unique: true },
    schoolName: { type: String, default: "St. Thomas Convent Hr. Sec. School Indore" },
    tagline: { type: String, default: "Excellence in Education" },
    schoolStartTime: { type: String, default: "08:00" },
    schoolEndTime: { type: String, default: "14:00" },
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    address: { type: String, default: "Indore, Madhya Pradesh" },
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
