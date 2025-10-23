import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import requestFunction from "../utils/requestFunction.js";
import successResponse from "../utils/success-response.js";
import category from "../models/Category.js";
import mongoose from "mongoose";

const createCategory = catchAsyncFunction(async (request, response, next) => {
  //fetch body
  const { body } = request;
  const userId = request?.token?.id;

  //validation
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }
  // { "name": "Groceries", "type": "expense", "color": "#00AA88", "icon": "utensils" }
  // * `400` if `name` missing/blank or `type` not in `["income","expense"]`.
  if (!["income", "expense"].includes(body.type) || body.type == null) {
    return next(new AppError(400, `Type cannot be null`));
  }

  if (body.name == null) {
    return next(new AppError(400, `Name cannot be null`));
  }

  const fetchUser = await User.findOne({ _id: userId });

  if (!fetchUser) {
    return next(new AppError(400, `User not found`));
  }

  const { token, ...bodyPayload } = body;

  const categoryBody = {
    userId: fetchUser._id, // updated from userId to _id
    ...bodyPayload,
  };

  const newCategory = new category(categoryBody);
  await newCategory.save();

  return successResponse(201, newCategory, response);
});

const listCategories = catchAsyncFunction(async (request, response, next) => {
  const userId = request?.token?.id;

  //validation
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  const findUser = await User.findOne({ _id: userId });

  if (!findUser) {
    return next(new AppError(400, "User not found"));
  }

  const {
    page = 1,
    limit = 10,
    sort = "-name", // Default sort by name descending
    search,
    type,
    includeArchived,
  } = request.query;

  const filter = { userId: findUser._id };
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  if (type && !["income", "expense"].includes(type)) {
    return next(new AppError(400, `The type does not exist`));
  }

  if (type) {
    filter.type = type;
  }

  if (!includeArchived) {
    filter.archived = false;
  }

  // Add search filter (searches in description and tags)
  if (search) {
    filter.$or = [{ name: { $regex: search, $options: "i" } }];
  }

  // Build sort object
  const sortObj = requestFunction.sortObj(sort);

  const getAllCategory = await category
    .find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .exec();

  //count of the category for pagination
  const countCategory = await category.countDocuments(filter);
  return successResponse(
    200,
    {
      categories: getAllCategory,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: countCategory,
        pages: Math.ceil(countCategory / limitNum),
        hasNext: skip + limitNum < countCategory,
        hasPrev: page > 1,
      },
    },
    response
  );
});

const getCategory = catchAsyncFunction(async (request, response, next) => {
  const userId = request?.token?.id;
  const { id } = request.params;

  //validation
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  if (!id) {
    return next(new AppError(400, "Category ID is required"));
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError(400, "Invalid category ID format"));
  }

  const findUser = await User.findOne({ _id: userId });

  if (!findUser) {
    return next(new AppError(400, "User not found"));
  }

  const foundCategory = await category.findOne({
    _id: id,
    userId: findUser._id,
  });

  if (!foundCategory) {
    return next(new AppError(404, "Category not found"));
  }

  return successResponse(200, foundCategory, response);
});

const updateCategory = catchAsyncFunction(async (request, response, next) => {
  const userId = request?.token?.id;
  const { id } = request.params;
  const { body } = request;

  //validation
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  if (!id) {
    return next(new AppError(400, "Category ID is required"));
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError(400, "Invalid category ID format"));
  }

  const findUser = await User.findOne({ _id: userId });

  if (!findUser) {
    return next(new AppError(400, "User not found"));
  }

  // Check if category exists
  const existingCategory = await category.findOne({
    _id: id,
    userId: findUser._id,
  });

  if (!existingCategory) {
    return next(new AppError(404, "Category not found"));
  }

  // Validate type if provided
  if (body.type && !["income", "expense"].includes(body.type)) {
    return next(new AppError(400, "Type must be either 'income' or 'expense'"));
  }

  // Check for duplicate name if name is being updated
  if (body.name && body.name !== existingCategory.name) {
    const duplicateCategory = await category.findOne({
      userId: findUser._id,
      name: body.name,
      _id: { $ne: id },
    });

    if (duplicateCategory) {
      return next(new AppError(409, "Category with this name already exists"));
    }
  }

  // Update category
  const updatedCategory = await category.findByIdAndUpdate(
    id,
    { ...body },
    { new: true, runValidators: true }
  );

  return successResponse(200, updatedCategory, response);
});

const archiveCategory = catchAsyncFunction(async (request, response, next) => {
  const userId = request?.token?.id;
  const { id } = request.params;

  //validation
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  if (!id) {
    return next(new AppError(400, "Category ID is required"));
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError(400, "Invalid category ID format"));
  }

  const findUser = await User.findOne({ _id: userId });

  if (!findUser) {
    return next(new AppError(400, "User not found"));
  }

  // Check if category exists
  const existingCategory = await category.findOne({
    _id: id,
    userId: findUser._id,
  });

  if (!existingCategory) {
    return next(new AppError(404, "Category not found"));
  }

  // Archive the category
  await category.findByIdAndUpdate(id, { archived: true });

  return response.status(204).send();
});

export default {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  archiveCategory,
};
