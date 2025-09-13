import catchAsyncFunction from "../utils/catchAsyncFunction.js";
import Transaction from "../models/Category.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import successResponse from "../utils/success-response.js";
import category from "../models/Category.js";

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
    userId: fetchUser.userId,
    ...bodyPayload,
  };

  const newCategory = new category(categoryBody);
  await newCategory.save();

  return response.status(201).json({
    status: "success",
    data: newCategory,
  });
});

const getCategory = catchAsyncFunction(async (request, response, next) => {
  const userId = request?.token?.id;

  //validation
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  const {
    page = 1,
    limit = 10,
    sort = "-name", // Default sort by name descending
    search,
    type,
    includeArchived,
  } = request.query;

  const filter = { userId };
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  if (!["income", "expense"].includes(type)) {
    return next(new AppError(400, `The type does not exist`));
  }

  filter.type = type;

  if (includeArchived) {
    return next(new AppError(400, `Hidden category wont be shown`));
  }

  filter.archived = includeArchived;

  // Add search filter (searches in description and tags)
  if (search) {
    filter.$or = [{ name: { $regex: search, $options: "i" } }];
  }

  // Build sort object
  let sortObj = {};
  if (sort) {
    const sortFields = sort.split(",");
    sortFields.forEach((sortField) => {
      if (sortField.startsWith("-")) {
        sortObj[sortField.substring(1)] = -1;
      } else {
        sortObj[sortField] = 1;
      }
    });
  }

  const getAllCategory = await category
    .find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .exec();

  //count of the category for pagination
  const countCategory = await category.countDocuments({ filter });

  return response.status(201).json({
    status: "success",
    data: { total: countCategory, ...getAllCategory },
  });
});

export default {
  createCategory,
  getCategory,
};
