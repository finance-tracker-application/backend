import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); //important to import env file variables valies

const port = process.env.PORT;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("🚀 Server is running with ES Modules!");
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
