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
  const body = request.body;

  if (!userId) {
    return next(new AppError(401, "Access Denied: Invalid Token"));
  }

  const user = await User.findOne({ _id: userId });
  if (!user) {
    return next(new AppError(400, "User not found"));
  }

  if (!body?.name || typeof body.name !== "string") {
    return next(new AppError(400, "Budget name is required"));
  }

  if (!body?.period?.startDate || !body?.period?.endDate) {
    return next(
      new AppError(400, "Budget period with start and end dates is required")
    );
  }

  const startDate = new Date(body.period.startDate);
  const endDate = new Date(body.period.endDate);
  if (!(startDate < endDate)) {
    return next(new AppError(400, "End date must be after start date"));
  }

  if (!Array.isArray(body.categories) || body.categories.length === 0) {
    return next(new AppError(400, "At least one category is required"));
  }

  for (const cat of body.categories) {
    if (!cat.categoryId) {
      return next(new AppError(400, "CategoryId cannot be null"));
    }
    if (cat.allocatedAmount == null || Number(cat.allocatedAmount) <= 0) {
      return next(
        new AppError(
          400,
          "allocated amount is not a number and cannot be empty"
        )
      );
    }
  }

  const category = body.categories.map((cat) => {
    return cat.categoryId;
  });

  const uniqueCategoriesId = new Set(category);

  if (uniqueCategoriesId.size != category.length) {
    return next(new AppError(409, "duplicate Categoryid is not allowed"));
  }

  const checkValideCategories = await Category.find({
    _id: { $in: [uniqueCategoriesId] },
    userId,
    archived: false,
  });

  if (checkValideCategories.length !== uniqueCategoriesId.size) {
    return next(new AppError(409, "duplicate Categoryid is not allowed"));
  }

  const totalBudget = body.categories.reduce((sum, c) => {
    return sum + (Number(c.allocatedAmount) || 0);
  }, 0);

  const budget = new Budget({
    userId,
    name: body.name,
    type: body.type || "monthly",
    period: { startDate, endDate },
    categories: body.categories,
    totalBudget,
    currency: body.currency || "USD",
    status: "active",
    notifications: body.notifications,
    tags: body.tags,
    notes: body.notes,
  });

  await budget.save();

  return successResponse(201, budget, response);
});

// Get all budgets
const getBudgets = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;

  if (!userId) {
    return next(new AppError(401, "Access Denied: Invalid Token"));
  }

  const { page = 1, limit = 10, status, type } = req.query;

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = { userId };

  if (status !== undefined) {
    const allowedStatuses = ["active", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return next(new AppError(400, "Invalid status filter"));
    }
    filter.status = status;
  }

  if (type !== undefined) {
    const allowedTypes = ["monthly", "yearly", "custom"];
    if (!allowedTypes.includes(type)) {
      return next(new AppError(400, "Invalid type filter"));
    }
    filter.type = type;
  }

  const budgets = await Budget.find(filter)
    .sort({ "period.startDate": -1 })
    .skip(skip)
    .limit(parsedLimit);

  const total = await Budget.countDocuments(filter);

  return successResponse(
    200,
    {
      budgets,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    },
    res
  );
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

  const updates = req.body || {};

  // Validate period if provided
  if (updates.period) {
    const { startDate, endDate } = updates.period;
    if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
      return next(new AppError(400, "End date must be after start date"));
    }
  }

  // Validate type if provided
  if (updates.type) {
    const allowedTypes = ["monthly", "yearly", "custom"];
    if (!allowedTypes.includes(updates.type)) {
      return next(new AppError(400, "Invalid budget type"));
    }
  }

  // Validate categories if provided
  if (Array.isArray(updates.categories)) {
    const categoryIds = updates.categories.map((c) => c.categoryId?.toString());

    // Ensure all provided categories include categoryId
    if (!categoryIds.every((id) => Boolean(id))) {
      return next(new AppError(400, "Each category must include categoryId"));
    }

    // Check duplicates
    const uniqueIds = new Set(categoryIds);
    if (uniqueIds.size !== categoryIds.length) {
      return next(new AppError(422, "Duplicate categories are not allowed"));
    }

    // Verify all categories belong to user and are not archived
    const validCategories = await Category.find({
      _id: { $in: categoryIds },
      userId,
      archived: false,
    });

    if (validCategories.length !== categoryIds.length) {
      return next(
        new AppError(400, "One or more categories are invalid or archived")
      );
    }
  }

  // Apply allowed updates
  const allowedFields = [
    "name",
    "type",
    "period",
    "categories",
    "currency",
    "notifications",
    "tags",
    "notes",
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      budget[field] = updates[field];
    }
  }

  await budget.save();

  // Recompute spent amounts after possible period/category updates
  await budget.updateSpentAmounts();

  return successResponse(200, budget, res);
});

// Delete budget
const deleteBudget = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { id } = req.params;

  const budget = await Budget.findOne({ _id: id, userId });

  if (!budget) {
    return next(new AppError(404, "Budget not found"));
  }

  // Soft delete: mark as cancelled
  if (budget.status !== "cancelled") {
    budget.status = "cancelled";
    await budget.save();
  }

  return res.status(204).send();
});

const getBudgetAnalytics = catchAsyncFunction(async (req, res, next) => {
  const userId = req.token.id;
  const { budgetId } = req.params; // fetch the budgetId from the params
  // validation
  if (!userId) {
    return next(new AppError(401, `unauthorised the userId is not validated`));
  }

  const budget = await Budget.findOne({ userId: userId, _id: budgetId });

  if (!budget) {
    return next(new AppError(404, `Budget not found`));
  }

  await budget.updateSpentAmounts();

  const categoryBreakdown = budget.categories.map((cat) => ({
    categoryId: cat.categoryId,
    name: cat.name,
    allocatedAmount: cat.allocatedAmount,
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

  const recentTransactions = await Transaction.find({
    userId,
    type: "expense",
    status: "completed",
    date: { $gte: budget.period.startDate, $lte: budget.period.endDate },
  });

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

  if (!userId) {
    return next(
      new AppError(401, "User id is not present and the token is not validated")
    );
  }

  const { id } = req.params;

  if (!id) {
    return next(new AppError(400, "Budget id is not present "));
  }

  const { name, period } = req.body;

  const originalBudget = await Budget.findOne({ _id: id, userId });

  if (!originalBudget) {
    return next(new AppError(404, "Budget not found"));
  }

  const newBudget = new Budget({
    userId,
    name: name || `${originalBudget.name} copy`,
    period: period,
    categories: originalBudget.categories.map((cat) => {
      return {
        categoryId: cat.categoryId,
        allocatedAmount: cat.allocatedAmount,
        spentAmount: 0,
        color: cat.color,
      };
    }),
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
