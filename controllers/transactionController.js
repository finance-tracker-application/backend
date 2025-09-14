import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import successResponse from "../utils/success-response.js";
import category from "../models/Category.js";

const createTransaction = catchAsyncFunction(
  async (request, response, next) => {
    //validation
    const { body } = request;
    if (!body) {
      return next(new AppError(400, "body cannot be empty"));
    }

    const userId = request?.token?.id;
    if (!userId) {
      return next(new AppError(401, "unauthorized"));
    }

    //userid check

    const findUser = await User.findOne({ _id: userId })
      .select("_id name userName email role")
      .exec();

    if (!findUser) {
      return next(new AppError(401, "User is not present in db unauthorised"));
    }

    if (!["income", "expense"].includes(body.type)) {
      return next(new AppError(404, "Invalid Type"));
    }

    if (typeof body.amount !== "number" || body.amount <= 0) {
      return next(
        new AppError(404, "the amount is not a number or it is negative")
      );
    }

    if (!body.categoryId) {
      return next(
        new AppError(400, "Category is required and must be a string")
      );
    }

    const getCategory = await category.findOne({ _id: categoryId });

    if (!getCategory) {
      return next(new AppError(400, "Category is not found"));
    }

    // note validation (optional)
    if (body.note && body.note.length > 500) {
      return next(new AppError(400, "Note cannot exceed 500 characters"));
    }

    const newTransaction = new Transaction(body);
    await newTransaction.save();

    return response.status(201).json({
      status: "success",
      data: newTransaction,
    });
  }
);

// Get all transactions with filtering, pagination, and sorting
const getAllTransactions = catchAsyncFunction(
  async (request, response, next) => {
    const userId = request?.token?.id;
    if (!userId) {
      return next(new AppError(401, "Unauthorized"));
    }

    // Verify user exists
    const findUser = await User.findOne({ _id: userId })
      .select("_id name userName email role")
      .exec();

    if (!findUser) {
      return next(new AppError(401, "User not found"));
    }

    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      sort = "-date", // Default sort by date descending
      type,
      category,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      currency,
      search,
    } = request.query;

    // Build filter object
    const filter = { userId };

    // Add type filter
    if (type && ["income", "expense", "transfer"].includes(type)) {
      filter.type = type;
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add status filter
    if (status && ["pending", "completed", "cancelled"].includes(status)) {
      filter.status = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Add amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) {
        filter.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        filter.amount.$lte = parseFloat(maxAmount);
      }
    }

    // Add currency filter
    if (
      currency &&
      ["USD", "EUR", "GBP", "INR", "CAD", "AUD"].includes(currency)
    ) {
      filter.currency = currency;
    }

    // Add search filter (searches in description and tags)
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort object
    let sortObj = {};
    if (sort) {
      const sortFields = sort.split(",");
      sortFields.forEach((field) => {
        if (field.startsWith("-")) {
          sortObj[field.substring(1)] = -1;
        } else {
          sortObj[field] = 1;
        }
      });
    }

    // Execute query with pagination
    const transactions = await Transaction.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate("userId", "name userName email")
      .exec();

    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);
    console.log(total);

    // validation when no data found
    if (total <= 0) {
      return next(new AppError(400, `No data found and present`));
    }
    // Calculate summary statistics
    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
          totalTransfer: {
            $sum: {
              $cond: [{ $eq: ["$type", "transfer"] }, "$amount", 0],
            },
          },
          averageAmount: { $avg: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    // Prepare response
    const responseData = {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: skip + limitNum < total,
        hasPrev: page > 1,
      },
      summary: summary[0] || {
        totalIncome: 0,
        totalExpense: 0,
        totalTransfer: 0,
        averageAmount: 0,
        transactionCount: 0,
      },
      filters: {
        type,
        category,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        currency,
        search,
      },
    };

    return successResponse(200, responseData, response);
  }
);

// Get transaction by ID
const getTransactionById = catchAsyncFunction(
  async (request, response, next) => {
    const userId = request?.token?.id;
    const { id } = request.params;

    if (!userId) {
      return next(new AppError(401, "Unauthorized"));
    }

    const transaction = await Transaction.findOne({ _id: id, userId })
      .populate("userId", "name userName email")
      .exec();

    if (!transaction) {
      return next(new AppError(404, "Transaction not found"));
    }

    return successResponse(200, transaction, response);
  }
);

// Update transaction
const updateTransaction = catchAsyncFunction(
  async (request, response, next) => {
    const userId = request?.token?.id;
    const { id } = request.params;
    const updateData = request.body;

    if (!userId) {
      return next(new AppError(401, "Unauthorized"));
    }

    // Validate update data
    if (
      updateData.type &&
      !["income", "expense", "transfer"].includes(updateData.type)
    ) {
      return next(new AppError(400, "Invalid transaction type"));
    }

    if (
      updateData.amount &&
      (typeof updateData.amount !== "number" || updateData.amount <= 0)
    ) {
      return next(new AppError(400, "Amount must be a positive number"));
    }

    if (
      updateData.status &&
      !["pending", "completed", "cancelled"].includes(updateData.status)
    ) {
      return next(new AppError(400, "Invalid status"));
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate("userId", "name userName email")
      .exec();

    if (!transaction) {
      return next(new AppError(404, "Transaction not found"));
    }

    return successResponse(200, transaction, response);
  }
);

// Delete transaction
const deleteTransaction = catchAsyncFunction(
  async (request, response, next) => {
    const userId = request?.token?.id;
    const { id } = request.params;

    if (!userId) {
      return next(new AppError(401, "Unauthorized"));
    }

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId });

    if (!transaction) {
      return next(new AppError(404, "Transaction not found"));
    }

    return successResponse(
      200,
      { message: "Transaction deleted successfully" },
      response
    );
  }
);

export default {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
