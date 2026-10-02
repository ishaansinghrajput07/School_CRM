const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    feeType: { type: String, required: true, trim: true }, // e.g. Tuition, Transport, Library
    amount: { type: Number, required: true, min: 0 },
    // Optional - most fee types (Tuition, Transport) recur every semester;
    // some (a one-time Admission fee) don't apply to a specific semester at
    // all, hence optional rather than required.
    semester: { type: Number, min: 1 },
    dueDate: { type: Date, required: true },
    academicYear: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

feeStructureSchema.index({ class: 1, feeType: 1, academicYear: 1 });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);