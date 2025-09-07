// tests/app.test.js
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js"; // IMPORTANT: app.js must export only the Express app, not app.listen()
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

let testUser;
let userName = `testuser2701`;
let email = `test_${Date.now()}@example.com`;

beforeAll(async () => {
  // connect to test database
  if (!process.env.testMONGOdb) {
    throw new Error("❌ Missing testMONGOdb environment variable");
  }
  await mongoose.connect(process.env.testMONGOdb);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase(); // clear test data (optional)
  await mongoose.connection.close();
});

describe("Start the app and check if running", () => {
  it("should return 200 OK and a running message inside data", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toMatch(/application is running/i);
  });
});

describe("testing /fin-tracker/v1/auth endpoint", () => {
  beforeAll(() => {
    testUser = {
      name: "test email",
      userName: userName,
      email: email,
      role: "user",
      password: "Assasinscreed2!",
    };
  });

  it("Run POST, create a new user", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(testUser);
    console.log("Signup response status:", response);

    console.log("Signup response:", response.body); // debug if failing

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name", "test email");
    expect(response.body.data).toHaveProperty("userName", userName);
    expect(response.body.data).toHaveProperty("email", email);
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data).toHaveProperty("refreshToken");
  }, 10000);

  it("Run the login and generate the token", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName: userName,
        password: "Assasinscreed2!",
      });

    console.log("Login response:", response.body); // debug if failing

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name");
    expect(response.body.data).toHaveProperty("token");
  }, 10000);
});
