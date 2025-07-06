import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import AppError from "../utils/AppError.js";
import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import successResponse from "../utils/success-response.js";

// Create a new transaction
const createTransaction = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const transactionData = { ...req.body, userId };

  const transaction = new Transaction(transactionData);
  await transaction.save();

  // Update related budgets if transaction is an expense
  if (transaction.type === "expense") {
    await updateBudgetsForTransaction(userId, transaction);
  }

  return successResponse(201, transaction, response);
});

// Get all transactions with filtering and pagination
const getTransactions = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const {
    page = 1,
    limit = 20,
    type,
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    tags,
    sortBy = "date",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = { userId };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = parseFloat(minAmount);
    if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
  }
  if (tags) {
    filter.tags = { $in: tags.split(",") };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const transactions = await Transaction.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate("userId", "name email");

  const total = await Transaction.countDocuments(filter);

  const response = {
    transactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };

  return successResponse(200, response, res);
});

// Get transaction by ID
const getTransactionById = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;

  const transaction = await Transaction.findOne({ _id: id, userId }).populate(
    "userId",
    "name email"
  );

  if (!transaction) {
    return next(new AppError(404, "Transaction not found"));
  }

  return successResponse(200, transaction, res);
});

// Update transaction
const updateTransaction = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;

  const transaction = await Transaction.findOne({ _id: id, userId });

  if (!transaction) {
    return next(new AppError(404, "Transaction not found"));
  }

  // Update transaction
  Object.assign(transaction, req.body);
  await transaction.save();

  // Update related budgets if transaction is an expense
  if (transaction.type === "expense") {
    await updateBudgetsForTransaction(userId, transaction);
  }

  return successResponse(200, transaction, res);
});

// Delete transaction
const deleteTransaction = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;

  const transaction = await Transaction.findOneAndDelete({ _id: id, userId });

  if (!transaction) {
    return next(new AppError(404, "Transaction not found"));
  }

  // Update related budgets
  if (transaction.type === "expense") {
    await updateBudgetsForTransaction(userId, transaction);
  }

  return successResponse(
    200,
    { message: "Transaction deleted successfully" },
    res
  );
});

// Get transaction analytics
const getTransactionAnalytics = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { startDate, endDate, groupBy = "month" } = req.query;

  const filter = { userId };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  // Get basic statistics
  const stats = await Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
        },
        totalTransfer: {
          $sum: { $cond: [{ $eq: ["$type", "transfer"] }, "$amount", 0] },
        },
        transactionCount: { $sum: 1 },
        averageAmount: { $avg: "$amount" },
      },
    },
  ]);

  // Get category breakdown
  const categoryBreakdown = await Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        avgAmount: { $avg: "$amount" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Get monthly trends
  const monthlyTrends = await Transaction.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Get top spending categories
  const topSpendingCategories = await Transaction.aggregate([
    { $match: { ...filter, type: "expense" } },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);

  const analytics = {
    summary: stats[0] || {
      totalIncome: 0,
      totalExpense: 0,
      totalTransfer: 0,
      transactionCount: 0,
      averageAmount: 0,
    },
    categoryBreakdown,
    monthlyTrends,
    topSpendingCategories,
    netSavings: (stats[0]?.totalIncome || 0) - (stats[0]?.totalExpense || 0),
  };

  return successResponse(200, analytics, res);
});

// Bulk import transactions
const bulkImportTransactions = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return next(new AppError(400, "Invalid transactions data"));
  }

  const transactionData = transactions.map((t) => ({ ...t, userId }));
  const createdTransactions = await Transaction.insertMany(transactionData);

  // Update budgets for all expense transactions
  const expenseTransactions = createdTransactions.filter(
    (t) => t.type === "expense"
  );
  for (const transaction of expenseTransactions) {
    await updateBudgetsForTransaction(userId, transaction);
  }

  return successResponse(
    201,
    {
      message: `${createdTransactions.length} transactions imported successfully`,
      count: createdTransactions.length,
    },
    res
  );
});

// Export transactions
const exportTransactions = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { format = "json", startDate, endDate } = req.query;

  const filter = { userId };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const transactions = await Transaction.find(filter).sort({ date: -1 });

  if (format === "csv") {
    // Convert to CSV format
    const csvData = transactions.map((t) => ({
      Date: t.date.toISOString().split("T")[0],
      Type: t.type,
      Category: t.category,
      Amount: t.amount,
      Currency: t.currency,
      Description: t.description,
      Tags: t.tags.join(", "),
      Location: t.location || "",
      Status: t.status,
    }));

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=transactions.csv"
    );

    // Convert to CSV string
    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    return res.send(csvString);
  }

  return successResponse(200, transactions, res);
});

// Helper function to update budgets
const updateBudgetsForTransaction = async (userId, transaction) => {
  const budgets = await Budget.find({
    userId,
    status: "active",
    "period.startDate": { $lte: transaction.date },
    "period.endDate": { $gte: transaction.date },
  });

  for (const budget of budgets) {
    await budget.updateSpentAmounts();
  }
};

export default {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionAnalytics,
  bulkImportTransactions,
  exportTransactions,
};
