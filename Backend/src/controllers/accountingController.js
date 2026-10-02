const asyncHandler = require("express-async-handler");
const Transaction = require("../models/Transaction");

const getTransactions = asyncHandler(async (req, res) => {
  const { type, category, from, to } = req.query;
  const query = {};
  if (type) query.type = type;
  if (category) query.category = category;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const transactions = await Transaction.find(query).sort({ date: -1 });
  res.json({ success: true, count: transactions.length, transactions });
});

const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.create({ ...req.body, recordedBy: req.user._id });
  res.status(201).json({ success: true, transaction });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }
  res.json({ success: true, transaction });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }
  res.json({ success: true, message: "Transaction removed" });
});

// @desc    Income vs expense summary, optionally grouped by month
const getSummary = asyncHandler(async (req, res) => {
  const [totals] = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        totalExpense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
      },
    },
  ]);

  const monthly = await Transaction.aggregate([
    {
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  const income = totals?.totalIncome || 0;
  const expense = totals?.totalExpense || 0;

  res.json({
    success: true,
    totalIncome: income,
    totalExpense: expense,
    netBalance: income - expense,
    monthly,
  });
});

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, getSummary };
