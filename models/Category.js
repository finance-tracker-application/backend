// models/Category.js
import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    color: String,
    icon: String,
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Each user cannot have duplicate category names
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

const category = mongoose.model("Category", CategorySchema);

export default category;
