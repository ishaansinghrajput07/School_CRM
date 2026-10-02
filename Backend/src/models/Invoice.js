const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    fee: { type: mongoose.Schema.Types.ObjectId, ref: "Fee" },
    items: [
      {
        description: String,
        amount: Number,
      },
    ],
    totalAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["paid", "pending"], default: "pending" },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
