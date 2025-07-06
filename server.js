import http from "http";
import app from "./app.js";
import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config(); //important to import env file variables valies

const port = process.env.PORT || 9000;

const server = http.createServer(app);

mongoose
  .connect(process.env.MONGOdb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
