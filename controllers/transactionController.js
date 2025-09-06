import catchAsyncFunction from "../utils/catchAsyncFunction";
import Transaction from "../models/Transaction";
import User from "../models/User";

const createTransaction = catchAsyncFunction(
  async (request, response, next) => {
    //validation
    const { body } = request;
    if (!body) {
      return next(new AppError(400, "body cannot be empty"));
    }

    const userId = body?.token?._id;
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

    if (!body.category || typeof body.category !== "string") {
      return next(
        new AppError(400, "Category is required and must be a string")
      );
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

export default { createTransaction };
