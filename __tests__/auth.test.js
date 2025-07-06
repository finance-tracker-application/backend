import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGOdb || "mongodb://localhost:27017/fin_tracker_test"
    );
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  describe("POST /fin-tracker/v1/auth/signup", () => {
    it("should create a new user with valid data", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        userName: "testuser",
        password: "Password123",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/auth/signup")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("name", userData.name);
      expect(response.body.data).toHaveProperty("email", userData.email);
      expect(response.body.data).toHaveProperty("userName", userData.userName);
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("should return error for invalid email", async () => {
      const userData = {
        name: "Test User",
        email: "invalid-email",
        userName: "testuser",
        password: "Password123",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/auth/signup")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /fin-tracker/v1/auth/login", () => {
    it("should login with valid credentials", async () => {
      const loginData = {
        userName: "testuser",
        password: "Password123",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("refreshToken");
    });

    it("should return error for invalid credentials", async () => {
      const loginData = {
        userName: "testuser",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });
});
