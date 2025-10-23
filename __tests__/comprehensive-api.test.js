// Comprehensive API Tests for all endpoints
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import path from "path";
import dotenv from "dotenv";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import Budget from "../models/Budget.js";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Increase Jest timeout
jest.setTimeout(30000);

let testUser;
let authToken;
let testUserId;
let testTransactionId;
let testCategoryId;
let testBudgetId;

const testMONGOdb = `mongodb://127.0.0.1:27017/testfin-trackerDB`;
const userName = `testuser${Date.now()}`;
const email = `test_${Date.now()}@example.com`;

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

beforeEach(async () => {
  // Clean up before each test
  await Transaction.deleteMany({});
  await Category.deleteMany({});
  await Budget.deleteMany({});
  await User.deleteMany({});
});

describe("🏠 Root Endpoint", () => {
  it("should return 200 OK and running message", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toMatch(/application is running/i);
  });
});

describe("🔐 Authentication Endpoints", () => {
  describe("POST /fin-tracker/v1/auth/signup", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        name: "Test User",
        userName: `testuser${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
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
      expect(response.body.data).toHaveProperty("userName", userData.userName);
      expect(response.body.data).toHaveProperty("email", userData.email);
      expect(response.body.data).toHaveProperty("_id");
      
      testUserId = response.body.data._id;
    });

    it("should return 400 for invalid signup data", async () => {
      const invalidData = {
        name: "",
        userName: "",
        email: "invalid-email",
        password: "123",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/auth/signup")
        .send(invalidData);

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /fin-tracker/v1/auth/login", () => {
    beforeEach(async () => {
      // Create a user for login tests
      const userData = {
        name: "Test User",
        userName,
        email,
        role: "user",
        password: "TestPassword123!",
      };

      await request(app)
        .post("/fin-tracker/v1/auth/signup")
        .send(userData);
    });

    it("should login successfully and return token", async () => {
      const loginData = {
        userName,
        password: "TestPassword123!",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/auth/login")
        .send(loginData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("name");
      
      authToken = response.body.data.token;
      testUserId = response.body.data._id;
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
  });

  describe("POST /fin-tracker/v1/auth/logout", () => {
    beforeEach(async () => {
      // Setup user and get token
      const userData = {
        name: "Test User",
        userName,
        email,
        role: "user",
        password: "TestPassword123!",
      };

      await request(app)
        .post("/fin-tracker/v1/auth/signup")
        .send(userData);

      const loginResponse = await request(app)
        .post("/fin-tracker/v1/auth/login")
        .send({
          userName,
          password: "TestPassword123!",
        });

      authToken = loginResponse.body.data.token;
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/fin-tracker/v1/auth/logout")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
    });
  });
});

describe("👤 User Management Endpoints", () => {
  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
    testUserId = loginResponse.body.data._id;
  });

  describe("GET /fin-tracker/v1/users/profile", () => {
    it("should get user profile successfully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/users/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("email");
    });

    it("should return 401 without token", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/users/profile");

      expect(response.statusCode).toBe(401);
    });
  });

  describe("PUT /fin-tracker/v1/users/profile", () => {
    it("should update user profile successfully", async () => {
      const updateData = {
        name: "Updated Test User",
        email: `updated_${Date.now()}@example.com`,
      };

      const response = await request(app)
        .put("/fin-tracker/v1/users/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.name).toBe("Updated Test User");
    });
  });

  describe("PUT /fin-tracker/v1/users/change-password", () => {
    it("should change password successfully", async () => {
      const passwordData = {
        currentPassword: "TestPassword123!",
        newPassword: "NewPassword123!",
      };

      const response = await request(app)
        .put("/fin-tracker/v1/users/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.statusCode).toBe(200);
    });
  });
});

describe("💰 Transaction Endpoints", () => {
  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
    testUserId = loginResponse.body.data._id;
  });

  describe("POST /fin-tracker/v1/transactions", () => {
    it("should create a transaction successfully", async () => {
      const transactionData = {
        type: "expense",
        amount: 50.00,
        category: "Food",
        description: "Lunch at restaurant",
        date: new Date().toISOString(),
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      console.log("Transaction response:", response.body);
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data.type).toBe("expense");
      expect(response.body.data.amount).toBe(50.00);
      
      testTransactionId = response.body.data._id;
    });

    it("should return 400 for invalid transaction data", async () => {
      const invalidData = {
        type: "invalid",
        amount: -10,
        category: "",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /fin-tracker/v1/transactions", () => {
    beforeEach(async () => {
      // Create a test transaction
      const transactionData = {
        type: "income",
        amount: 1000.00,
        category: "Salary",
        note: "Monthly salary",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      testTransactionId = response.body.data._id;
    });

    it("should get all transactions successfully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /fin-tracker/v1/transactions/:id", () => {
    beforeEach(async () => {
      // Create a test transaction
      const transactionData = {
        type: "expense",
        amount: 25.00,
        category: "Transport",
        note: "Bus fare",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      testTransactionId = response.body.data._id;
    });

    it("should get transaction by ID successfully", async () => {
      const response = await request(app)
        .get(`/fin-tracker/v1/transactions/${testTransactionId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data._id).toBe(testTransactionId);
    });
  });

  describe("PUT /fin-tracker/v1/transactions/:id", () => {
    beforeEach(async () => {
      // Create a test transaction
      const transactionData = {
        type: "expense",
        amount: 25.00,
        category: "Transport",
        note: "Bus fare",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      testTransactionId = response.body.data._id;
    });

    it("should update transaction successfully", async () => {
      const updateData = {
        type: "expense",
        amount: 30.00,
        category: "Transport",
        note: "Updated bus fare",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${testTransactionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.amount).toBe(30.00);
    });
  });

  describe("DELETE /fin-tracker/v1/transactions/:id", () => {
    beforeEach(async () => {
      // Create a test transaction
      const transactionData = {
        type: "expense",
        amount: 25.00,
        category: "Transport",
        note: "Bus fare",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      testTransactionId = response.body.data._id;
    });

    it("should delete transaction successfully", async () => {
      const response = await request(app)
        .delete(`/fin-tracker/v1/transactions/${testTransactionId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
    });
  });
});

describe("📂 Category Endpoints", () => {
  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
    testUserId = loginResponse.body.data._id;
  });

  describe("POST /fin-tracker/v1/categories", () => {
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

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe("Food & Dining");
      
      testCategoryId = response.body.data._id;
    });
  });

  describe("GET /fin-tracker/v1/categories", () => {
    beforeEach(async () => {
      // Create a test category
      const categoryData = {
        name: "Transportation",
        description: "Transport related expenses",
        type: "expense",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send(categoryData);

      testCategoryId = response.body.data._id;
    });

    it("should get all categories successfully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/categories")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /fin-tracker/v1/categories/:id", () => {
    beforeEach(async () => {
      // Create a test category
      const categoryData = {
        name: "Entertainment",
        description: "Entertainment expenses",
        type: "expense",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send(categoryData);

      testCategoryId = response.body.data._id;
    });

    it("should get category by ID successfully", async () => {
      const response = await request(app)
        .get(`/fin-tracker/v1/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data._id).toBe(testCategoryId);
    });
  });

  describe("PATCH /fin-tracker/v1/categories/:id", () => {
    beforeEach(async () => {
      // Create a test category
      const categoryData = {
        name: "Utilities",
        description: "Utility bills",
        type: "expense",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send(categoryData);

      testCategoryId = response.body.data._id;
    });

    it("should update category successfully", async () => {
      const updateData = {
        name: "Updated Utilities",
        description: "Updated utility bills",
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.name).toBe("Updated Utilities");
    });
  });

  describe("DELETE /fin-tracker/v1/categories/:id", () => {
    beforeEach(async () => {
      // Create a test category
      const categoryData = {
        name: "Shopping",
        description: "Shopping expenses",
        type: "expense",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/categories")
        .set("Authorization", `Bearer ${authToken}`)
        .send(categoryData);

      testCategoryId = response.body.data._id;
    });

    it("should delete category successfully", async () => {
      const response = await request(app)
        .delete(`/fin-tracker/v1/categories/${testCategoryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
    });
  });
});

describe("💼 Budget Endpoints", () => {
  beforeEach(async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
    testUserId = loginResponse.body.data._id;
  });

  describe("POST /fin-tracker/v1/budgets", () => {
    it("should create a budget successfully", async () => {
      const budgetData = {
        name: "Monthly Food Budget",
        type: "monthly",
        period: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        categories: [
          {
            categoryId: "food_category_id",
            allocatedAmount: 500.00
          }
        ],
        currency: "USD"
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      console.log("Budget response:", response.body);
      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe("Monthly Food Budget");
      
      testBudgetId = response.body.data._id;
    });
  });

  describe("GET /fin-tracker/v1/budgets", () => {
    beforeEach(async () => {
      // Create a test budget
      const budgetData = {
        name: "Transport Budget",
        amount: 200.00,
        category: "Transport",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      testBudgetId = response.body.data._id;
    });

    it("should get all budgets successfully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /fin-tracker/v1/budgets/:id", () => {
    beforeEach(async () => {
      // Create a test budget
      const budgetData = {
        name: "Entertainment Budget",
        amount: 150.00,
        category: "Entertainment",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      testBudgetId = response.body.data._id;
    });

    it("should get budget by ID successfully", async () => {
      const response = await request(app)
        .get(`/fin-tracker/v1/budgets/${testBudgetId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data._id).toBe(testBudgetId);
    });
  });

  describe("PATCH /fin-tracker/v1/budgets/:id", () => {
    beforeEach(async () => {
      // Create a test budget
      const budgetData = {
        name: "Shopping Budget",
        amount: 300.00,
        category: "Shopping",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      testBudgetId = response.body.data._id;
    });

    it("should update budget successfully", async () => {
      const updateData = {
        name: "Updated Shopping Budget",
        amount: 350.00,
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${testBudgetId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.name).toBe("Updated Shopping Budget");
      expect(response.body.data.amount).toBe(350.00);
    });
  });

  describe("DELETE /fin-tracker/v1/budgets/:id", () => {
    beforeEach(async () => {
      // Create a test budget
      const budgetData = {
        name: "Utilities Budget",
        amount: 100.00,
        category: "Utilities",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      testBudgetId = response.body.data._id;
    });

    it("should delete budget successfully", async () => {
      const response = await request(app)
        .delete(`/fin-tracker/v1/budgets/${testBudgetId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
    });
  });

  describe("GET /fin-tracker/v1/budgets/:budgetId/analytics", () => {
    beforeEach(async () => {
      // Create a test budget
      const budgetData = {
        name: "Analytics Budget",
        amount: 1000.00,
        category: "General",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      testBudgetId = response.body.data._id;
    });

    it("should get budget analytics successfully", async () => {
      const response = await request(app)
        .get(`/fin-tracker/v1/budgets/${testBudgetId}/analytics`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("data");
    });
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

describe("❌ Error Handling", () => {
  it("should return 404 for non-existent routes", async () => {
    const response = await request(app).get("/fin-tracker/v1/non-existent-route");
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 for non-existent resources", async () => {
    // Setup authenticated user
    const userData = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(userData);

    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "TestPassword123!",
      });

    const authToken = loginResponse.body.data.token;

    // Test with non-existent transaction ID
    const response = await request(app)
      .get("/fin-tracker/v1/transactions/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.statusCode).toBe(404);
  });
});
