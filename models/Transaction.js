// models/Transaction.js
import mongoose from "mongoose";
import Category from "./Category.js";
import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import AppError from "../utils/AppError.js";
import Budget from "./Budget.js";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: function () {
        return this.type !== "transfer"; // transfers can be uncategorized
      },
    },
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: false, // optional; only needed if user explicitly assigns
    },

    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, budgetId: 1 });

// Validation guard: category.type must match transaction.type
transactionSchema.pre("save", async function (next) {
  if (this.type !== "transfer" && this.categoryId) {
    const Category = mongoose.model("Category");
    const category = await Category.findById(this.categoryId);

    if (!category) {
      return next(new Error("Invalid categoryId"));
    }
    if (category.archived) {
      return next(new Error("Archived category cannot be used"));
    }
    if (category.type !== this.type) {
      return next(
        new Error(
          `Transaction type (${this.type}) must match category type (${category.type})`
        )
      );
    }
    if (!category.userId.equals(this.userId)) {
      return next(new Error("Category does not belong to this user"));
    }
  }
  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;

// ---------------- save middleware ----------------
transactionSchema.post(
  "save",
  catchAsyncFunction(async function (doc, next) {
    const fetchBudget = await Budget.findOne({ _id: doc.budgetId });

    if (!fetchBudget) {
      return next(new AppError(400, `Could not find the budget`));
    }

    const filteredCategory = fetchBudget.categories.find((cat) => {
      return cat.categoryId === doc.categoryId;
    });

    if (filteredCategory) {
      filteredCategory.spentAmount += doc.amount;
    }

    await fetchBudget.save();

    next();
  })
);

transactionSchema.post(
  "remove",
  catchAsyncFunction(async function (doc, next) {
    const fetchBudget = await Budget.findOne({ _id: doc.budgetId });

    if (!fetchBudget) {
      return next(new AppError(400, `Could not find the budget`));
    }

    const filteredCategory = fetchBudget.categories.find((cat) => {
      return cat.categoryId === doc.categoryId;
    });

    if (filteredCategory) {
      filteredCategory.spentAmount -= doc.amount;
    }

    await fetchBudget.save();

    next();
  })
);
