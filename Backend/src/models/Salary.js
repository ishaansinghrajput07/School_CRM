const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true }, // "2026-07"
    baseSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    netSalary: { type: Number },
    status: { type: String, enum: ["paid", "pending"], default: "pending" },
    paymentDate: { type: Date },
  },
  { timestamps: true }
);

salarySchema.index({ employee: 1, month: 1 }, { unique: true });

salarySchema.pre("save", function (next) {
  this.netSalary = this.baseSalary + this.bonus - this.deduction;
  next();
});

module.exports = mongoose.model("Salary", salarySchema);
