import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        // Income categories
        "salary",
        "freelance",
        "investment",
        "business",
        "other_income",
        // Expense categories
        "food",
        "transport",
        "entertainment",
        "shopping",
        "bills",
        "health",
        "education",
        "travel",
        "other_expense",
        // Transfer categories
        "bank_transfer",
        "cash_transfer",
        "investment_transfer",
      ],
    },
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
    },
    tags: [
      {
        type: String,
        maxlength: 20,
      },
    ],
    location: {
      type: String,
      maxlength: 100,
    },
    receipt: {
      url: String,
      filename: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: {
        type: Number,
        min: 1,
      },
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

// Indexes for better performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

// Virtual for formatted amount
transactionSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: this.currency,
  }).format(this.amount);
});

// Virtual for month and year
transactionSchema.virtual("month").get(function () {
  return this.date.getMonth() + 1;
});

transactionSchema.virtual("year").get(function () {
  return this.date.getFullYear();
});

// Pre-save middleware to handle recurring transactions
transactionSchema.pre("save", function (next) {
  if (this.isRecurring && this.isNew) {
    // Create future recurring transactions
    this.createRecurringTransactions();
  }
  next();
});

// Method to create recurring transactions
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
