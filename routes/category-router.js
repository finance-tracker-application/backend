import express from "express";
import categoryController from "../controllers/categoryController.js";
import { validateTransaction } from "../middleware/validationMiddleware.js";
import authUtils from "../utils/authUtils.js";

const categoryRouter = express.Router();

// authenticating the JWT token before calling the API
categoryRouter.use(authUtils.verifyJWTToken);

categoryRouter
  .route("/")
  .post(categoryController.createCategory)
  .get(categoryController.getCategory);

export default categoryRouter;
