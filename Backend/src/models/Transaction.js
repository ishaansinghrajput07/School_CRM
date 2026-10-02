const mongoose = require("mongoose");

// Unified ledger for the Accounting module (income + expenses)
const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    category: {
      type: String,
      required: true,
      trim: true,
      // Income: Student Fees, Admission Fees, Donations, Other Income
      // Expense: Salary, Electricity, Water, Internet, Maintenance, Stationery
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
