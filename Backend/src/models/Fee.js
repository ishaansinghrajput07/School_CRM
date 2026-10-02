const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    feeType: { type: String, required: true, trim: true }, // e.g. Tuition, Transport, Library
    amount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, required: true },
    fine: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
    paymentHistory: [
      {
        amount: Number,
        paidOn: { type: Date, default: Date.now },
        method: { type: String, enum: ["cash", "card", "bank_transfer", "online", "cheque"], default: "cash" },
        reference: String,
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

feeSchema.pre("save", function (next) {
  if (this.amountPaid <= 0) this.status = "pending";
  else if (this.amountPaid >= this.amount + this.fine) this.status = "paid";
  else this.status = "partial";
  next();
});

module.exports = mongoose.model("Fee", feeSchema);
