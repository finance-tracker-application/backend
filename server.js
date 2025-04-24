import http from "http";
import app from "./app.js";
import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config(); //important to import env file variables valies

const port = process.env.PORT || 9000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
