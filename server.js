import http from "http";
import app from "./app.js";
import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config(); //important to import env file variables valies

const port = process.env.PORT || 9000;

const server = http.createServer(app);
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;
const dbUrl =
  `mongodb+srv://${dbUser}:${dbPass}` +
  `@cluster0.iew7zrf.mongodb.net/${dbName}` +
  `?retryWrites=true&w=majority&appName=Cluster0`;

mongoose
  .connect(dbUrl, {
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
