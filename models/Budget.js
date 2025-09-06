import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ["monthly", "yearly", "custom"],
      default: "monthly",
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    categories: [
      {
        category: {
          type: String,
          required: true,
          enum: [
            "food",
            "transport",
            "entertainment",
            "shopping",
            "bills",
            "health",
            "education",
            "travel",
            "other_expense",
          ],
        },
        allocatedAmount: {
          type: Number,
          required: true,
          min: 0,
        },
        spentAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
        color: {
          type: String,
          default: "#3B82F6",
        },
      },
    ],
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      threshold: {
        type: Number,
        default: 80, // Percentage
        min: 0,
        max: 100,
      },
      emailAlerts: {
        type: Boolean,
        default: true,
      },
      pushAlerts: {
        type: Boolean,
        default: true,
      },
    },
    tags: [
      {
        type: String,
        maxlength: 20,
      },
    ],
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
budgetSchema.index({ userId: 1, "period.startDate": -1 });
budgetSchema.index({ userId: 1, status: 1 });

// Virtual for total spent amount
budgetSchema.virtual("totalSpent").get(function () {
  return this.categories.reduce((total, cat) => total + cat.spentAmount, 0);
});

// Virtual for remaining budget
budgetSchema.virtual("remainingBudget").get(function () {
  return this.totalBudget - this.totalSpent;
});

// Virtual for budget utilization percentage
budgetSchema.virtual("utilizationPercentage").get(function () {
  return this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) * 100 : 0;
});

// Virtual for budget status
budgetSchema.virtual("budgetStatus").get(function () {
  const percentage = this.utilizationPercentage;
  if (percentage >= 100) return "exceeded";
  if (percentage >= 90) return "critical";
  if (percentage >= 75) return "warning";
  return "good";
});

// Method to update spent amounts based on transactions
budgetSchema.methods.updateSpentAmounts = async function () {
  const Transaction = mongoose.model("Transaction");

  const transactions = await Transaction.find({
    userId: this.userId,
    date: { $gte: this.period.startDate, $lte: this.period.endDate },
    type: "expense",
    status: "completed",
  });

  // Reset spent amounts
  this.categories.forEach((cat) => {
    cat.spentAmount = 0;
  });

  // Calculate spent amounts from transactions
  transactions.forEach((transaction) => {
    const category = this.categories.find(
      (cat) => cat.category === transaction.category
    );
    if (category) {
      category.spentAmount += transaction.amount;
    }
  });

  await this.save();
  return this;
};

// Method to check if budget is exceeded
budgetSchema.methods.isExceeded = function () {
  return this.totalSpent > this.totalBudget;
};

// Method to get category utilization
budgetSchema.methods.getCategoryUtilization = function (categoryName) {
  const category = this.categories.find((cat) => cat.category === categoryName);
  if (!category) return null;

  return {
    category: category.category,
    allocated: category.allocatedAmount,
    spent: category.spentAmount,
    remaining: category.allocatedAmount - category.spentAmount,
    percentage:
      category.allocatedAmount > 0
        ? (category.spentAmount / category.allocatedAmount) * 100
        : 0,
  };
};

// Pre-save middleware to validate budget
budgetSchema.pre("save", function (next) {
  // Ensure end date is after start date
  if (this.period.endDate <= this.period.startDate) {
    return next(new Error("End date must be after start date"));
  }

  // Calculate total budget from categories
  const calculatedTotal = this.categories.reduce(
    (total, cat) => total + cat.allocatedAmount,
    0
  );

  // Update total budget if not set or different
  if (!this.totalBudget || this.totalBudget !== calculatedTotal) {
    this.totalBudget = calculatedTotal;
  }

  next();
});

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
