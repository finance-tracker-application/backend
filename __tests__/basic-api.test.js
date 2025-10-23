// Basic API Tests - Testing core functionality
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Increase Jest timeout
jest.setTimeout(30000);

const testMONGOdb = `mongodb://127.0.0.1:27017/testfin-trackerDB`;

beforeAll(async () => {
  if (!testMONGOdb) {
    throw new Error("❌ Missing testMONGOdb environment variable");
  }
  await mongoose.connect(testMONGOdb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  // Clean up test data
  if (process.env.NODE_ENV === "test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();
});

describe("🏠 Basic API Tests", () => {
  it("should return 200 OK for root endpoint", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toMatch(/application is running/i);
  });

  it("should return 404 for non-existent routes", async () => {
    const response = await request(app).get(
      "/fin-tracker/v1/non-existent-route"
    );
    expect(response.statusCode).toBe(404);
  });
});

describe("🔐 Authentication Tests", () => {
  let authToken;
  let testUserId;
  const userName = "testuser123";
  const email = `test_${Date.now()}@example.com`;

  it("should create a new user successfully", async () => {
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(userData);

    console.log("Signup response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name", "Test User");
    expect(response.body.data).toHaveProperty("userName", userName);
    expect(response.body.data).toHaveProperty("email", email);
    expect(response.body.data).toHaveProperty("_id");

    testUserId = response.body.data._id;
  });

  it("should login successfully and return token", async () => {
    const loginData = {
      userName,
      password: "TestPassword123!",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send(loginData);

    console.log("Login response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data).toHaveProperty("name");

    authToken = response.body.data.token;
  });

  it("should return 401 for invalid credentials", async () => {
    const invalidLogin = {
      userName,
      password: "WrongPassword",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send(invalidLogin);

    expect(response.statusCode).toBe(401);
  });

  it("should logout successfully", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/logout")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
  });
});

describe("👤 User Profile Tests", () => {
  let authToken;
  const userName = `testuser_${Date.now()}`;
  const email = `test_${Date.now()}@example.com`;

  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app).post("/fin-tracker/v1/auth/signup").send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
  });

  it("should get user profile successfully", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/users/profile")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Profile response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name");
    expect(response.body.data).toHaveProperty("email");
  });

  it("should return 401 without token", async () => {
    const response = await request(app).get("/fin-tracker/v1/users/profile");

    expect(response.statusCode).toBe(401);
  });
});

describe("💰 Transaction Tests", () => {
  let authToken;
  const userName = `testuser_${Date.now()}`;
  const email = `test_${Date.now()}@example.com`;

  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app).post("/fin-tracker/v1/auth/signup").send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
  });

  it("should create a transaction successfully", async () => {
    const transactionData = {
      type: "expense",
      amount: 50.0,
      category: "Food",
      description: "Lunch at restaurant",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send(transactionData);

    console.log("Transaction response:", response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.type).toBe("expense");
    expect(response.body.data.amount).toBe(50.0);
  });

  it("should get all transactions successfully", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/transactions")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Get transactions response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe("📂 Category Tests", () => {
  let authToken;
  const userName = `testuser_${Date.now()}`;
  const email = `test_${Date.now()}@example.com`;

  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app).post("/fin-tracker/v1/auth/signup").send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
  });

  it("should create a category successfully", async () => {
    const categoryData = {
      name: "Food & Dining",
      description: "Expenses related to food and dining",
      type: "expense",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send(categoryData);

    console.log("Category response:", response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body.data.name).toBe("Food & Dining");
  });

  it("should get all categories successfully", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Get categories response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe("💼 Budget Tests", () => {
  let authToken;
  const userName = `testuser_${Date.now()}`;
  const email = `test_${Date.now()}@example.com`;

  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app).post("/fin-tracker/v1/auth/signup").send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
  });

  it("should get all budgets successfully", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/budgets")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Get budgets response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe("🔒 Security Tests", () => {
  it("should return 401 for protected routes without token", async () => {
    const protectedRoutes = [
      "/fin-tracker/v1/users/profile",
      "/fin-tracker/v1/transactions",
      "/fin-tracker/v1/categories",
      "/fin-tracker/v1/budgets",
    ];

    for (const route of protectedRoutes) {
      const response = await request(app).get(route);
      expect(response.statusCode).toBe(401);
    }
  });

  it("should return 401 for invalid token", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/users/profile")
      .set("Authorization", "Bearer invalid-token");

    expect(response.statusCode).toBe(401);
  });
});
