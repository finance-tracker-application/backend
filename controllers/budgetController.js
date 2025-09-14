import Budget from "../models/Budget.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import AppError from "../utils/AppError.js";
import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import successResponse from "../utils/success-response.js";

// Create a new budget
const createBudget = catchAsyncFunction(async (request, response, next) => {
  const userId = request.token.id;
  const { body } = request.body; // fetch the body

  // valide the the body
  if (!userId) {
    return next(new AppError(401, `user is not authorised`));
  }

  const findUser = await User.findOne({ _id: userId });

  if (!findUser) {
    return next(new AppError(400, `User not found`));
  }

  //   - `name` is required.
  // - `period.startDate < period.endDate`.
  // - `categories[]` contains no duplicate `categoryId`.
  // - Each `categoryId` exists, belongs to the user, and `archived=false`.

  if (!body.name) {
    return next(new AppError(400, `Name should not be null`));
  }

  if (
    body.period.startDate > body.period.endDate ||
    body.period.startDate == null ||
    body.period.endDate == null
  ) {
    return next(
      new AppError(
        400,
        `Start and end date is not valid or the period cannot be null`
      )
    );
  }

  if (body.categories.length <= 0) {
    return next(
      new AppError(400, `No category present and category cannot be empty`)
    );
  }

  const categoryId = body.categories.map((category) => {
    category.categoryId;
  });
  const findDuplicateCategory = await Category.find({
    _id: categoryId.categoryId,
  });

  if (findDuplicateCategory.length <= 0) {
    return next(new AppError(400, `Cateogry not found`));
  }

  const budget = new Budget({ ...body, userId: userId });
  await budget.save();

  return successResponse(201, budget, response);
});

// Get all budgets
const getBudgets = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;

  const budgets = await Budget.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Budget.countDocuments(filter);

  const response = {
    budgets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };

  return successResponse(200, response, res);
});

// Get budget by ID
const getBudgetById = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;

  const budget = await Budget.findOne({ _id: id, userId });

  if (!budget) {
    return next(new AppError(404, "Budget not found"));
  }

  // Update spent amounts
  await budget.updateSpentAmounts();

  return successResponse(200, budget, res);
});

// Update budget
const updateBudget = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;

  const budget = await Budget.findOne({ _id: id, userId });

  if (!budget) {
    return next(new AppError(404, "Budget not found"));
  }

  // Update budget
  Object.assign(budget, req.body);
  await budget.save();

  // Update spent amounts
  await budget.updateSpentAmounts();

  return successResponse(200, budget, res);
});

// Delete budget
const deleteBudget = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;

  const budget = await Budget.findOneAndDelete({ _id: id, userId });

  if (!budget) {
    return next(new AppError(404, "Budget not found"));
  }

  return successResponse(200, { message: "Budget deleted successfully" }, res);
});

// Get budget analytics
const getBudgetAnalytics = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { budgetId } = req.params;

  const budget = await Budget.findOne({ _id: budgetId, userId });

  if (!budget) {
    return next(new AppError(404, "Budget not found"));
  }

  // Update spent amounts
  await budget.updateSpentAmounts();

  // Get category-wise breakdown
  const categoryBreakdown = budget.categories.map((cat) => ({
    category: cat.category,
    allocated: cat.allocatedAmount,
    spent: cat.spentAmount,
    remaining: cat.allocatedAmount - cat.spentAmount,
    percentage:
      cat.allocatedAmount > 0
        ? (cat.spentAmount / cat.allocatedAmount) * 100
        : 0,
    status:
      cat.spentAmount > cat.allocatedAmount
        ? "exceeded"
        : (cat.spentAmount / cat.allocatedAmount) * 100 >= 90
        ? "critical"
        : (cat.spentAmount / cat.allocatedAmount) * 100 >= 75
        ? "warning"
        : "good",
  }));

  // Get recent transactions for this budget period
  const recentTransactions = await Transaction.find({
    userId,
    type: "expense",
    date: { $gte: budget.period.startDate, $lte: budget.period.endDate },
    status: "completed",
  })
    .sort({ date: -1 })
    .limit(10);

  const analytics = {
    budget: {
      id: budget._id,
      name: budget.name,
      type: budget.type,
      period: budget.period,
      totalBudget: budget.totalBudget,
      totalSpent: budget.totalSpent,
      remainingBudget: budget.remainingBudget,
      utilizationPercentage: budget.utilizationPercentage,
      status: budget.budgetStatus,
    },
    categoryBreakdown,
    recentTransactions,
    alerts: generateBudgetAlerts(budget, categoryBreakdown),
  };

  return successResponse(200, analytics, res);
});

// Get budget overview (all active budgets)
const getBudgetOverview = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;

  const activeBudgets = await Budget.find({ userId, status: "active" });

  // Update spent amounts for all budgets
  for (const budget of activeBudgets) {
    await budget.updateSpentAmounts();
  }

  const overview = {
    totalBudgets: activeBudgets.length,
    totalAllocated: activeBudgets.reduce((sum, b) => sum + b.totalBudget, 0),
    totalSpent: activeBudgets.reduce((sum, b) => sum + b.totalSpent, 0),
    totalRemaining: activeBudgets.reduce(
      (sum, b) => sum + b.remainingBudget,
      0
    ),
    averageUtilization:
      activeBudgets.length > 0
        ? activeBudgets.reduce((sum, b) => sum + b.utilizationPercentage, 0) /
          activeBudgets.length
        : 0,
    budgets: activeBudgets.map((budget) => ({
      id: budget._id,
      name: budget.name,
      type: budget.type,
      totalBudget: budget.totalBudget,
      totalSpent: budget.totalSpent,
      remainingBudget: budget.remainingBudget,
      utilizationPercentage: budget.utilizationPercentage,
      status: budget.budgetStatus,
      period: budget.period,
    })),
  };

  return successResponse(200, overview, res);
});

// Create budget from template
const createBudgetFromTemplate = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { template, period } = req.body;

  const templates = {
    monthly: {
      name: "Monthly Budget",
      type: "monthly",
      categories: [
        { category: "food", allocatedAmount: 300, color: "#EF4444" },
        { category: "transport", allocatedAmount: 150, color: "#3B82F6" },
        { category: "entertainment", allocatedAmount: 100, color: "#10B981" },
        { category: "shopping", allocatedAmount: 200, color: "#F59E0B" },
        { category: "bills", allocatedAmount: 500, color: "#8B5CF6" },
        { category: "health", allocatedAmount: 100, color: "#EC4899" },
        { category: "education", allocatedAmount: 150, color: "#06B6D4" },
        { category: "travel", allocatedAmount: 200, color: "#84CC16" },
        { category: "other_expense", allocatedAmount: 100, color: "#6B7280" },
      ],
    },
    yearly: {
      name: "Yearly Budget",
      type: "yearly",
      categories: [
        { category: "food", allocatedAmount: 3600, color: "#EF4444" },
        { category: "transport", allocatedAmount: 1800, color: "#3B82F6" },
        { category: "entertainment", allocatedAmount: 1200, color: "#10B981" },
        { category: "shopping", allocatedAmount: 2400, color: "#F59E0B" },
        { category: "bills", allocatedAmount: 6000, color: "#8B5CF6" },
        { category: "health", allocatedAmount: 1200, color: "#EC4899" },
        { category: "education", allocatedAmount: 1800, color: "#06B6D4" },
        { category: "travel", allocatedAmount: 2400, color: "#84CC16" },
        { category: "other_expense", allocatedAmount: 1200, color: "#6B7280" },
      ],
    },
  };

  if (!templates[template]) {
    return next(
      new AppError(
        400,
        "Invalid template. Available templates: monthly, yearly"
      )
    );
  }

  const budgetData = {
    userId,
    ...templates[template],
    period,
  };

  const budget = new Budget(budgetData);
  await budget.save();

  return successResponse(201, budget, res);
});

// Duplicate existing budget
const duplicateBudget = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;
  const { name, period } = req.body;

  const originalBudget = await Budget.findOne({ _id: id, userId });

  if (!originalBudget) {
    return next(new AppError(404, "Budget not found"));
  }

  const newBudget = new Budget({
    userId,
    name: name || `${originalBudget.name} (Copy)`,
    type: originalBudget.type,
    period: period || originalBudget.period,
    categories: originalBudget.categories.map((cat) => ({
      ...cat.toObject(),
      spentAmount: 0,
    })),
    currency: originalBudget.currency,
    notifications: originalBudget.notifications,
    tags: originalBudget.tags,
    notes: originalBudget.notes,
  });

  await newBudget.save();

  return successResponse(201, newBudget, res);
});

// Helper function to generate budget alerts
const generateBudgetAlerts = (budget, categoryBreakdown) => {
  const alerts = [];

  // Overall budget alerts
  if (budget.utilizationPercentage >= 100) {
    alerts.push({
      type: "critical",
      message: `Budget "${budget.name}" has been exceeded!`,
      category: "overall",
    });
  } else if (budget.utilizationPercentage >= 90) {
    alerts.push({
      type: "warning",
      message: `Budget "${
        budget.name
      }" is at ${budget.utilizationPercentage.toFixed(1)}% utilization`,
      category: "overall",
    });
  }

  // Category-specific alerts
  categoryBreakdown.forEach((cat) => {
    if (cat.status === "exceeded") {
      alerts.push({
        type: "critical",
        message: `Category "${cat.category}" has exceeded its budget`,
        category: cat.category,
      });
    } else if (cat.status === "critical") {
      alerts.push({
        type: "warning",
        message: `Category "${cat.category}" is at ${cat.percentage.toFixed(
          1
        )}% utilization`,
        category: cat.category,
      });
    }
  });

  return alerts;
};

export default {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics,
  getBudgetOverview,
  createBudgetFromTemplate,
  duplicateBudget,
};
