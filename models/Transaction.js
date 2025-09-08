// models/Transaction.js
import mongoose from "mongoose";
import Category from "./Category.js";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
      index: true,
    },

    // ✅ Reference real Category (optional for transfers)
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: function () {
        return this.type !== "transfer";
      },
      index: true,
    },

    // (Optional) denormalized snapshot to avoid populate on common reads
    categoryName: { type: String },
    categoryType: { type: String, enum: ["income", "expense"] },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD"],
    },

    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    tags: [{ type: String, maxlength: 20 }],
    location: { type: String, maxlength: 100 },

    receipt: {
      url: String,
      filename: String,
    },

    isRecurring: { type: Boolean, default: false },

    recurringPattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: { type: Number, min: 1 },
      endDate: Date,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },

    metadata: {
      source: String, // "manual", "bank_import", "receipt_scan"
      originalAmount: Number,
      exchangeRate: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// -------- Indexes --------
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });

// -------- Virtuals --------
transactionSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: this.currency,
  }).format(this.amount);
});

transactionSchema.virtual("month").get(function () {
  return this.date.getMonth() + 1;
});

transactionSchema.virtual("year").get(function () {
  return this.date.getFullYear();
});

// -------- Validation: ensure category is valid for this user & type --------
transactionSchema.pre("validate", async function validateCategory(next) {
  try {
    // Transfers can omit category
    if (this.type === "transfer" || !this.categoryId) return next();

    // Category must exist, belong to same user, and not be archived
    const cat = await Category.findOne({
      _id: this.categoryId,
      userId: this.userId,
      archived: { $ne: true },
    })
      .select("name type")
      .lean();

    if (!cat) {
      const err = new mongoose.Error.ValidationError();
      err.addError(
        "categoryId",
        new mongoose.Error.ValidatorError({
          message: "Category not found for this user",
        })
      );
      return next(err);
    }

    // Category type must match txn type (income/expense)
    if (cat.type !== this.type) {
      const err = new mongoose.Error.ValidationError();
      err.addError(
        "type",
        new mongoose.Error.ValidatorError({
          message: `Category type '${cat.type}' does not match transaction type '${this.type}'`,
        })
      );
      return next(err);
    }

    // Write denormalized snapshot for faster reads
    this.categoryName = cat.name;
    this.categoryType = cat.type;

    return next();
  } catch (e) {
    return next(e);
  }
});

// -------- Recurring logic (unchanged) --------
transactionSchema.pre("save", function (next) {
  if (this.isRecurring && this.isNew) {
    // Create future recurring transactions
    this.createRecurringTransactions();
  }
  next();
});

transactionSchema.methods.createRecurringTransactions = async function () {
  if (!this.recurringPattern || !this.recurringPattern.endDate) return;

  const { frequency, interval, endDate } = this.recurringPattern;
  let currentDate = new Date(this.date);
  const end = new Date(endDate);

  while (currentDate < end) {
    switch (frequency) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7 * interval);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case "yearly":
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      default:
        return;
    }

    if (currentDate <= end) {
      const newTransaction = new this.constructor({
        ...this.toObject(),
        _id: undefined,
        date: new Date(currentDate),
        isRecurring: false,
        recurringPattern: undefined,
      });
      await newTransaction.save();
    }
  }
};

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
