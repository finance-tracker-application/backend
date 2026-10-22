// Comprehensive Endpoint Testing
import request from "supertest";
import User from "../../models/User.js";
import sendEmail from "../../config/notification-config.js";
import { securityConfig } from "../../config/security.js";
import app from "../../app.js";

import {
  startTestDatabase,
  clearTestDatabase,
  stopTestDatabase,
} from "../helpers/database.js";

jest.mock("../../config/notification-config.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Increase Jest timeout
jest.setTimeout(120000);



beforeAll(async () => {
  await startTestDatabase();
});

beforeEach(async () => {
  await clearTestDatabase();

  for (const ip of ["127.0.0.1", "::ffff:127.0.0.1", "::1"]) {
    securityConfig.authLimiter.resetKey(ip);
    securityConfig.generalLimiter.resetKey(ip);
  }
  sendEmail.mockReset();
  sendEmail.mockResolvedValue(undefined);
});

afterAll(async () => {
  await stopTestDatabase();
});

describe(" Complete API Endpoint Testing", () => {
  let authToken;
  let testUserId;
  let testTransactionId;
  let testCategoryId;
  let testBudgetId;

  // Fresh fixtures for every scenario; no record comes from an earlier test.
  beforeEach(async () => {
    await User.create({ name: "Fixture User", userName: "endpoint_fixture", email: "endpoint-fixture@example.com", password: "TestPassword123!" });
    const login = await request(app).post("/fin-tracker/v1/auth/login")
      .send({ userName: "endpoint_fixture", password: "TestPassword123!" });
    expect(login.statusCode).toBe(200);
    authToken = login.body.data.token;

    const category = await request(app).post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Fixture Food", type: "expense" });
    expect(category.statusCode).toBe(201);
    testCategoryId = category.body.data._id;

    const transaction = await request(app).post("/fin-tracker/v1/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ type: "expense", amount: 25, categoryId: testCategoryId, note: "Fixture expense" });
    expect(transaction.statusCode).toBe(201);
    testTransactionId = transaction.body.data._id;

    const budget = await request(app).post("/fin-tracker/v1/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Fixture Budget", type: "monthly",
        period: { startDate: "2024-01-01", endDate: "2024-01-31" },
        categories: [{ categoryId: testCategoryId, allocatedAmount: 500 }], currency: "USD" });
    expect(budget.statusCode).toBe(201);
    testBudgetId = budget.body.data._id;
  });

  // Test 1: Root endpoint
  it(" GET / - Root endpoint should work", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toMatch(/application is running/i);
    console.log(" Root endpoint working");
  });

  // Test 2: User Registration
  it(" POST /fin-tracker/v1/auth/signup - User registration", async () => {
    const userData = {
      name: "Test User",
      userName: "testuser123",
      email: `test_${Date.now()}@example.com`,
      password: "TestPassword123!",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(userData);

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty("id");
    testUserId = response.body.data.id;
    console.log(" User registration working");
  });

  // Test 3: User Login
  it(" POST /fin-tracker/v1/auth/login - User login", async () => {
    const loginData = {
      userName: "endpoint_fixture",
      password: "TestPassword123!",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send(loginData);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("token");
    authToken = response.body.data.token;
    console.log(" User login working");
  });

  // Test 4: User Profile
  it(" GET /fin-tracker/v1/users/profile - Get user profile", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/users/profile")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("name");
    console.log(" Get user profile working");
  });

  // Test 5: Update User Profile
  it(" PUT /fin-tracker/v1/users/profile - Update user profile", async () => {
    const updateData = {
      name: "Updated Test User",
      email: `updated_${Date.now()}@example.com`,
    };

    const response = await request(app)
      .put("/fin-tracker/v1/users/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    console.log(" Update user profile working");
  });

  // Test 6: Create Transaction
  it(" POST /fin-tracker/v1/transactions - Create transaction", async () => {
    const transactionData = {
      type: "expense",
      amount: 50.0,
      categoryId: testCategoryId,
      note: "Lunch at restaurant",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send(transactionData);

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty("_id");
    testTransactionId = response.body.data._id;
    console.log(" Create transaction working");
  });

  // Test 7: Get All Transactions
  it(" GET /fin-tracker/v1/transactions - Get all transactions", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/transactions")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data.transactions)).toBe(true);
    console.log(" Get all transactions working");
  });

  // Test 8: Get Transaction by ID
  it(" GET /fin-tracker/v1/transactions/:id - Get transaction by ID", async () => {
    const response = await request(app)
      .get(`/fin-tracker/v1/transactions/${testTransactionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data._id).toBe(testTransactionId);
    console.log(" Get transaction by ID working");
  });

  // Test 9: Update Transaction
  it(" PUT /fin-tracker/v1/transactions/:id - Update transaction", async () => {
    const updateData = {
      type: "expense",
      amount: 60.0,
      categoryId: testCategoryId,
      note: "Updated lunch",
    };

    const response = await request(app)
      .put(`/fin-tracker/v1/transactions/${testTransactionId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    console.log(" Update transaction working");
  });

  // Test 10: Create Category
  it(" POST /fin-tracker/v1/categories - Create category", async () => {
    const categoryData = {
      name: "Food & Dining",
      description: "Expenses related to food and dining",
      type: "expense",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send(categoryData);

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty("_id");
    testCategoryId = response.body.data._id;
    console.log(" Create category working");
  });

  // Test 11: Get All Categories
  it(" GET /fin-tracker/v1/categories - Get all categories", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data.categories)).toBe(true);
    console.log(" Get all categories working");
  });

  // Test 12: Get Category by ID
  it(" GET /fin-tracker/v1/categories/:id - Get category by ID", async () => {
    const response = await request(app)
      .get(`/fin-tracker/v1/categories/${testCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data._id).toBe(testCategoryId);
    console.log(" Get category by ID working");
  });

  // Test 13: Update Category
  it(" PATCH /fin-tracker/v1/categories/:id - Update category", async () => {
    const updateData = {
      name: "Updated Food & Dining",
      description: "Updated description",
    };

    const response = await request(app)
      .patch(`/fin-tracker/v1/categories/${testCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    console.log(" Update category working");
  });

  // Test 14: Get All Budgets
  it(" GET /fin-tracker/v1/budgets - Get all budgets", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/budgets")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.data.budgets)).toBe(true);
    console.log(" Get all budgets working");
  });

  // Test 15: Create Budget
  it(" POST /fin-tracker/v1/budgets - Create budget", async () => {
    const budgetData = {
      name: "Monthly Food Budget",
      type: "monthly",
      period: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      categories: [
        {
          categoryId: testCategoryId,
          allocatedAmount: 500.0,
        },
      ],
      currency: "USD",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/budgets")
      .set("Authorization", `Bearer ${authToken}`)
      .send(budgetData);

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty("_id");
    testBudgetId = response.body.data._id;
    console.log(" Create budget working");
  });

  // Test 16: Get Budget by ID
  it(" GET /fin-tracker/v1/budgets/:id - Get budget by ID", async () => {
    const response = await request(app)
      .get(`/fin-tracker/v1/budgets/${testBudgetId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data._id).toBe(testBudgetId);
    console.log(" Get budget by ID working");
  });

  // Test 17: Update Budget
  it(" PATCH /fin-tracker/v1/budgets/:id - Update budget", async () => {
    const updateData = {
      name: "Updated Monthly Food Budget",
    };

    const response = await request(app)
      .patch(`/fin-tracker/v1/budgets/${testBudgetId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    console.log(" Update budget working");
  });

  // Test 18: Get Budget Analytics
  it(" GET /fin-tracker/v1/budgets/:budgetId/analytics - Get budget analytics", async () => {
    const response = await request(app)
      .get(`/fin-tracker/v1/budgets/${testBudgetId}/analytics`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    console.log(" Get budget analytics working");
  });

  // Test 19: Delete Transaction
  it(" DELETE /fin-tracker/v1/transactions/:id - Delete transaction", async () => {
    const response = await request(app)
      .delete(`/fin-tracker/v1/transactions/${testTransactionId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(204);
    console.log(" Delete transaction working");
  });

  // Test 20: Delete Category
  it(" DELETE /fin-tracker/v1/categories/:id - Delete category", async () => {
    const response = await request(app)
      .delete(`/fin-tracker/v1/categories/${testCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(204);
    console.log(" Delete category working");
  });

  // Test 21: Delete Budget
  it(" DELETE /fin-tracker/v1/budgets/:id - Delete budget", async () => {
    const response = await request(app)
      .delete(`/fin-tracker/v1/budgets/${testBudgetId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(204);
    console.log(" Delete budget working");
  });

  // Test 22: User Logout
  it(" POST /fin-tracker/v1/auth/logout - User logout", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/logout")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(200);
    console.log(" User logout working");
  });

  // Test 23: Security - Unauthorized Access
  it(" Security - Unauthorized access should return 401", async () => {
    const response = await request(app).get("/fin-tracker/v1/users/profile");

    expect(response.statusCode).toBe(401);
    console.log(" Security - Unauthorized access protection working");
  });

  // Test 24: Security - Invalid Token
  it(" Security - Invalid token should return 401", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/users/profile")
      .set("Authorization", "Bearer invalid-token");

    expect(response.statusCode).toBe(401);
    console.log(" Security - Invalid token protection working");
  });

  // Test 25: Error Handling - Non-existent Route
  it(" Error Handling - Non-existent route should return 404", async () => {
    const response = await request(app).get(
      "/fin-tracker/v1/non-existent-route",
    );

    expect(response.statusCode).toBe(404);
    console.log(" Error handling - 404 for non-existent routes working");
  });
});
