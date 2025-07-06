import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  limit: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
});

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
