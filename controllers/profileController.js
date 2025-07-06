const profileController = catchAsyncFunction(
  async (request, response, next) => {
    const { userName } = request.body;
    const findUser = await User.findOne({ userName: userName }).exec();

    if (!findUser) {
      return next(new AppError(404, "User does not exist"));
    }

    const isMatch = await findUser.matchPassword(password);

    if (!isMatch) {
      return next(new AppError(401, "Username and Password invalid"));
    }
    findUser.password = undefined;
    request.body = findUser;

    next();
  }
);

export default {
  profileController,
};
