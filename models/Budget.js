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
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
    categories: [
      {
        categoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        allocatedAmount: { type: Number, required: true, min: 0 },
        spentAmount: { type: Number, default: 0, min: 0 },
        color: { type: String, default: "#3B82F6" },
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
      enabled: { type: Boolean, default: true },
      threshold: { type: Number, default: 80, min: 0, max: 100 },
      emailAlerts: { type: Boolean, default: true },
      pushAlerts: { type: Boolean, default: true },
    },
    tags: [{ type: String, maxlength: 20 }],
    notes: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------- Virtuals ----------------
budgetSchema.virtual("totalSpent").get(function () {
  return this.categories.reduce((sum, b) => {
    return sum + b.spentAmount;
  }, 0);
});

budgetSchema.virtual("remainingBudget").get(function () {
  return this.totalBudget - this.totalSpent;
});

budgetSchema.virtual("utilizationBudget").get(function () {
  return this.totalBudget > 0 ? (this.totalSpent / this.totalBudget) * 100 : 0;
});

budgetSchema.virtual("budgetStatus").get(function () {
  const percentage = this.utilizationBudget;
  if (percentage >= 100) return "exceeded";
  if (percentage >= 90) return "critical";
  if (percentage >= 75) return "warning";
  return "good";
});

// ---------------- Methods ----------------
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

  // Sum spent amounts by categoryId
  transactions.forEach((transaction) => {
    const category = this.categories.find(
      (cat) => cat.categoryId.toString() === transaction.categoryId.toString()
    );
    if (category) {
      category.spentAmount += transaction.amount;
    }
  });

  await this.save();
  return this;
};

budgetSchema.methods.isExceeded = function () {
  return this.totalSpent > this.totalBudget;
};

budgetSchema.methods.getCategoryUtilization = function (categoryId) {
  const category = this.categories.find(
    (cat) => cat.categoryId.toString() === categoryId.toString()
  );
  if (!category) return null;

  return {
    categoryId: category.categoryId,
    allocated: category.allocatedAmount,
    spent: category.spentAmount,
    remaining: category.allocatedAmount - category.spentAmount,
    percentage:
      category.allocatedAmount > 0
        ? (category.spentAmount / category.allocatedAmount) * 100
        : 0,
  };
};

// ---------------- Pre-save middleware ----------------
budgetSchema.pre("save", function (next) {
  if (this.period.endDate <= this.period.startDate) {
    return next(new Error("End date must be after start date"));
  }

  const calculatedTotal = this.categories.reduce(
    (total, cat) => total + cat.allocatedAmount,
    0
  );

  if (!this.totalBudget || this.totalBudget !== calculatedTotal) {
    this.totalBudget = calculatedTotal;
  }

  next();
});

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
