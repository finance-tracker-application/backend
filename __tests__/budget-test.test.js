// Budget Routes Testing
process.env.NODE_ENV = "test";
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

let authToken;
let budgetId;
let categoryId1;
let categoryId2;
let categoryId3;
let budgetData1Id;
let budgetData2Id;

beforeAll(async () => {
  if (!testMONGOdb) {
    throw new Error("❌ Missing testMONGOdb environment variable");
  }
  await mongoose.connect(testMONGOdb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const userData = {
    name: "Test User",
    userName: "testuser123",
    email: `test_${Date.now()}@example.com`,
    role: "user",
    password: "TestPassword123!",
  };

  await request(app).post("/fin-tracker/v1/auth/signup").send(userData);

  //making api call to set authToken
  const userResponse = await request(app)
    .post("/fin-tracker/v1/auth/login")
    .send(userData);
  authToken = userResponse.body.data.token;

  //creating expense categories for budget testing
  const categoryData1 = {
    name: "Food & Dining",
    description: "Expenses related to food and dining",
    type: "expense",
  };

  const categoryResponse1 = await request(app)
    .post("/fin-tracker/v1/categories")
    .set("Authorization", `Bearer ${authToken}`)
    .send(categoryData1);

  categoryId1 = categoryResponse1.body.data._id;

  const categoryData2 = {
    name: "Transportation",
    description: "Transportation expenses",
    type: "expense",
  };

  const categoryResponse2 = await request(app)
    .post("/fin-tracker/v1/categories")
    .set("Authorization", `Bearer ${authToken}`)
    .send(categoryData2);

  categoryId2 = categoryResponse2.body.data._id;

  const categoryData3 = {
    name: "Entertainment",
    description: "Entertainment expenses",
    type: "expense",
  };

  const categoryResponse3 = await request(app)
    .post("/fin-tracker/v1/categories")
    .set("Authorization", `Bearer ${authToken}`)
    .send(categoryData3);

  categoryId3 = categoryResponse3.body.data._id;

  //creating 2 budgets to be stored for fetch all and get test cases
  const budgetData1 = {
    name: "Monthly Budget 2024",
    type: "monthly",
    period: {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    },
    categories: [
      {
        categoryId: categoryId1,
        allocatedAmount: 500,
        color: "#EF4444",
      },
      {
        categoryId: categoryId2,
        allocatedAmount: 200,
        color: "#3B82F6",
      },
    ],
    currency: "USD",
    notes: "Test budget 1",
  };

  const budgetResponse1 = await request(app)
    .post("/fin-tracker/v1/budgets")
    .set("Authorization", `Bearer ${authToken}`)
    .send(budgetData1);

  if (budgetResponse1.statusCode !== 201) {
    console.log("Budget creation failed:", budgetResponse1.body);
    throw new Error(
      `Budget creation failed: ${JSON.stringify(budgetResponse1.body)}`
    );
  }

  budgetData1Id = budgetResponse1.body.data._id;

  const budgetData2 = {
    name: "Yearly Budget 2024",
    type: "yearly",
    period: {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
    categories: [
      {
        categoryId: categoryId1,
        allocatedAmount: 6000,
        color: "#EF4444",
      },
      {
        categoryId: categoryId3,
        allocatedAmount: 1200,
        color: "#10B981",
      },
    ],
    currency: "USD",
    notes: "Test budget 2",
  };

  const budgetResponse2 = await request(app)
    .post("/fin-tracker/v1/budgets")
    .set("Authorization", `Bearer ${authToken}`)
    .send(budgetData2);

  if (budgetResponse2.statusCode !== 201) {
    console.log("Budget creation failed:", budgetResponse2.body);
    throw new Error(
      `Budget creation failed: ${JSON.stringify(budgetResponse2.body)}`
    );
  }

  budgetData2Id = budgetResponse2.body.data._id;
});

afterAll(async () => {
  // Clean up test data
  if (process.env.NODE_ENV === "test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();
});

describe("Budget API Test Suite", () => {
  // ==================== CREATE BUDGET TESTS ====================
  describe("POST /fin-tracker/v1/budgets - Create Budget", () => {
    // POSITIVE TEST CASES
    it("✅ Should create a monthly budget successfully", async () => {
      const budgetData = {
        name: "Test Monthly Budget",
        type: "monthly",
        period: {
          startDate: new Date("2024-02-01"),
          endDate: new Date("2024-02-29"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 400,
            color: "#EF4444",
          },
          {
            categoryId: categoryId2,
            allocatedAmount: 150,
            color: "#3B82F6",
          },
        ],
        currency: "USD",
        notes: "Test monthly budget",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data.name).toBe("Test Monthly Budget");
      expect(response.body.data.type).toBe("monthly");
      expect(response.body.data.currency).toBe("USD");
      expect(response.body.data.status).toBe("active");
      expect(response.body.data.categories).toHaveLength(2);
      expect(response.body.data.totalBudget).toBe(550);

      budgetId = response.body.data._id;
    });

    it("✅ Should create a yearly budget successfully", async () => {
      const budgetData = {
        name: "Test Yearly Budget",
        type: "yearly",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 5000,
            color: "#EF4444",
          },
          {
            categoryId: categoryId3,
            allocatedAmount: 2000,
            color: "#10B981",
          },
        ],
        currency: "EUR",
        notes: "Test yearly budget",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe("Test Yearly Budget");
      expect(response.body.data.type).toBe("yearly");
      expect(response.body.data.currency).toBe("EUR");
      expect(response.body.data.totalBudget).toBe(7000);
    });

    it("✅ Should create a custom budget successfully", async () => {
      const budgetData = {
        name: "Test Custom Budget",
        type: "custom",
        period: {
          startDate: new Date("2024-03-01"),
          endDate: new Date("2024-06-30"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 1000,
            color: "#EF4444",
          },
        ],
        currency: "GBP",
        notifications: {
          enabled: true,
          threshold: 85,
          emailAlerts: true,
          pushAlerts: false,
        },
        tags: ["quarterly", "savings"],
        notes: "Test custom budget for Q2",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe("Test Custom Budget");
      expect(response.body.data.type).toBe("custom");
      expect(response.body.data.currency).toBe("GBP");
      expect(response.body.data.notifications.enabled).toBe(true);
      expect(response.body.data.notifications.threshold).toBe(85);
      expect(response.body.data.tags).toContain("quarterly");
      expect(response.body.data.tags).toContain("savings");
    });

    it("✅ Should create budget with minimum required fields", async () => {
      const budgetData = {
        name: "Minimal Budget",
        period: {
          startDate: new Date("2024-04-01"),
          endDate: new Date("2024-04-30"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 300,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe("Minimal Budget");
      expect(response.body.data.type).toBe("monthly"); // default
      expect(response.body.data.currency).toBe("USD"); // default
      expect(response.body.data.status).toBe("active"); // default
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when name is missing", async () => {
      const budgetData = {
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Budget name is required");
    });

    it("❌ Should fail when name is not a string", async () => {
      const budgetData = {
        name: 123,
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(500);
      expect(response.body.status).toBe("error");
    });

    it("❌ Should fail when period is missing", async () => {
      const budgetData = {
        name: "Test Budget",
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Budget period with start and end dates is required"
      );
    });

    it("❌ Should fail when startDate is missing", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Budget period with start and end dates is required"
      );
    });

    it("❌ Should fail when endDate is missing", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Budget period with start and end dates is required"
      );
    });

    it("❌ Should fail when endDate is not after startDate", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-31"),
          endDate: new Date("2024-01-01"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("End date must be after start date");
    });

    it("❌ Should fail when categories array is missing", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("At least one category is required");
    });

    it("❌ Should fail when categories array is empty", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("At least one category is required");
    });

    it("❌ Should fail when categoryId is missing", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Each category must include categoryId and allocated amount"
      );
    });

    it("❌ Should fail when allocatedAmount is missing", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Each category must include categoryId and allocated amount"
      );
    });

    it("❌ Should fail when allocatedAmount is zero", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 0,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Allocated amount must be greater than 0"
      );
    });

    it("❌ Should fail when allocatedAmount is negative", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: -100,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Allocated amount must be greater than 0"
      );
    });

    it("❌ Should fail when duplicate categoryId is provided", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
          {
            categoryId: categoryId1, // duplicate
            allocatedAmount: 300,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(409);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("duplicate Categoryid is not allowed");
    });

    it("❌ Should fail when invalid categoryId is provided", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: "invalid_category_id",
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(500);
      expect(response.body.status).toBe("error");
    });

    it("❌ Should fail when unauthorized", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .send(budgetData);

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== GET ALL BUDGETS TESTS ====================
  describe("GET /fin-tracker/v1/budgets - Get All Budgets", () => {
    // POSITIVE TEST CASES
    it("✅ Should fetch all budgets successfully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.budgets)).toBe(true);
      expect(response.body.data.budgets.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data).toHaveProperty("pagination");
      expect(response.body.data.pagination).toHaveProperty("page");
      expect(response.body.data.pagination).toHaveProperty("limit");
      expect(response.body.data.pagination).toHaveProperty("total");
      expect(response.body.data.pagination).toHaveProperty("pages");
    });

    it("✅ Should fetch budgets with pagination", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets?page=1&limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.budgets.length).toBeLessThanOrEqual(5);
    });

    it("✅ Should fetch budgets with status filter", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets?status=active")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      response.body.data.budgets.forEach((budget) => {
        expect(budget.status).toBe("active");
      });
    });

    it("✅ Should fetch budgets with type filter", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets?type=monthly")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      response.body.data.budgets.forEach((budget) => {
        expect(budget.type).toBe("monthly");
      });
    });

    it("✅ Should fetch budgets with multiple filters", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets?status=active&type=monthly")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      response.body.data.budgets.forEach((budget) => {
        expect(budget.status).toBe("active");
        expect(budget.type).toBe("monthly");
      });
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when unauthorized", async () => {
      const response = await request(app).get("/fin-tracker/v1/budgets");

      expect(response.statusCode).toBe(401);
    });

    it("❌ Should fail with invalid status filter", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets?status=invalid_status")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Invalid status filter");
    });

    it("❌ Should fail with invalid type filter", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets?type=invalid_type")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Invalid type filter");
    });
  });

  // ==================== GET BUDGET BY ID TESTS ====================
  describe("GET /fin-tracker/v1/budgets/:id - Get Budget By ID", () => {
    // POSITIVE TEST CASES
    it("✅ Should fetch a specific budget successfully", async () => {
      const response = await request(app)
        .get(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data._id).toBe(budgetData1Id);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data).toHaveProperty("name");
      expect(response.body.data).toHaveProperty("type");
      expect(response.body.data).toHaveProperty("period");
      expect(response.body.data).toHaveProperty("categories");
      expect(response.body.data).toHaveProperty("totalBudget");
      expect(response.body.data).toHaveProperty("status");
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when budget ID is missing", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets/")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.budgets)).toBe(true);
    });

    it("❌ Should fail when budget ID is invalid format", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets/invalid_id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(500);
    });

    it("❌ Should fail when budget is not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/fin-tracker/v1/budgets/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Budget not found");
    });

    it("❌ Should fail when unauthorized", async () => {
      const response = await request(app).get(
        `/fin-tracker/v1/budgets/${budgetData1Id}`
      );

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== UPDATE BUDGET TESTS ====================
  describe("PATCH /fin-tracker/v1/budgets/:id - Update Budget", () => {
    // POSITIVE TEST CASES
    it("✅ Should update budget successfully", async () => {
      const updateData = {
        name: "Updated Budget Name",
        notes: "Updated budget notes",
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.name).toBe("Updated Budget Name");
      expect(response.body.data.notes).toBe("Updated budget notes");
    });

    it("✅ Should update budget period successfully", async () => {
      const updateData = {
        period: {
          startDate: new Date("2024-02-01"),
          endDate: new Date("2024-02-29"),
        },
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(new Date(response.body.data.period.startDate)).toEqual(
        new Date("2024-02-01")
      );
      expect(new Date(response.body.data.period.endDate)).toEqual(
        new Date("2024-02-29")
      );
    });

    it("✅ Should update budget categories successfully", async () => {
      const updateData = {
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 600,
            color: "#FF0000",
          },
          {
            categoryId: categoryId2,
            allocatedAmount: 250,
            color: "#00FF00",
          },
        ],
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.categories).toHaveLength(2);
      expect(response.body.data.totalBudget).toBe(850);
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when budget ID is missing", async () => {
      const updateData = {
        name: "Updated Name",
      };

      const response = await request(app)
        .patch("/fin-tracker/v1/budgets/")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(404);
    });

    it("❌ Should fail when budget is not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const updateData = {
        name: "Updated Name",
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Budget not found");
    });

    it("❌ Should fail when period endDate is not after startDate", async () => {
      const updateData = {
        period: {
          startDate: new Date("2024-03-31"),
          endDate: new Date("2024-03-01"),
        },
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("End date must be after start date");
    });

    it("❌ Should fail when type is invalid", async () => {
      const updateData = {
        type: "invalid_type",
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Invalid budget type");
    });

    it("❌ Should fail when duplicate categories are provided", async () => {
      const updateData = {
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
          {
            categoryId: categoryId1, // duplicate
            allocatedAmount: 300,
          },
        ],
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(422);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Duplicate categories are not allowed"
      );
    });

    it("❌ Should fail when unauthorized", async () => {
      const updateData = {
        name: "Updated Name",
      };

      const response = await request(app)
        .patch(`/fin-tracker/v1/budgets/${budgetData1Id}`)
        .send(updateData);

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== DELETE BUDGET TESTS ====================
  describe("DELETE /fin-tracker/v1/budgets/:id - Delete Budget", () => {
    // POSITIVE TEST CASES
    it("✅ Should delete budget successfully", async () => {
      // First create a budget to delete
      const budgetData = {
        name: "Budget to Delete",
        period: {
          startDate: new Date("2024-05-01"),
          endDate: new Date("2024-05-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 300,
          },
        ],
      };

      const createResponse = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      const budgetToDeleteId = createResponse.body.data._id;

      const response = await request(app)
        .delete(`/fin-tracker/v1/budgets/${budgetToDeleteId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(204);
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when budget ID is missing", async () => {
      const response = await request(app)
        .delete("/fin-tracker/v1/budgets/")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
    });

    it("❌ Should fail when budget is not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .delete(`/fin-tracker/v1/budgets/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Budget not found");
    });

    it("❌ Should fail when unauthorized", async () => {
      const response = await request(app).delete(
        `/fin-tracker/v1/budgets/${budgetData1Id}`
      );

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== BUDGET ANALYTICS TESTS ====================
  describe("GET /fin-tracker/v1/budgets/:budgetId/analytics - Get Budget Analytics", () => {
    // POSITIVE TEST CASES
    it("✅ Should fetch budget analytics successfully", async () => {
      const response = await request(app)
        .get(`/fin-tracker/v1/budgets/${budgetData1Id}/analytics`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty("budget");
      expect(response.body.data).toHaveProperty("categoryBreakdown");
      expect(response.body.data).toHaveProperty("recentTransactions");
      expect(response.body.data).toHaveProperty("alerts");
      expect(response.body.data.budget).toHaveProperty("id");
      expect(response.body.data.budget).toHaveProperty("name");
      expect(response.body.data.budget).toHaveProperty("totalBudget");
      expect(response.body.data.budget).toHaveProperty("totalSpent");
      expect(response.body.data.budget).toHaveProperty("remainingBudget");
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when budget ID is missing", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/budgets//analytics")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
    });

    it("❌ Should fail when budget is not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/fin-tracker/v1/budgets/${fakeId}/analytics`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Budget not found");
    });

    it("❌ Should fail when unauthorized", async () => {
      const response = await request(app).get(
        `/fin-tracker/v1/budgets/${budgetData1Id}/analytics`
      );

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== EDGE CASES AND ERROR SCENARIOS ====================
  describe("Edge Cases and Error Scenarios", () => {
    it("❌ Should fail when body is empty", async () => {
      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Budget name is required");
    });

    it("❌ Should fail when user token is invalid", async () => {
      const budgetData = {
        name: "Test Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer invalid_token`)
        .send(budgetData);

      expect(response.statusCode).toBe(401);
    });

    it("✅ Should handle very large allocated amounts", async () => {
      const budgetData = {
        name: "Large Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 999999999,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.totalBudget).toBe(999999999);
    });

    it("✅ Should handle very small allocated amounts", async () => {
      const budgetData = {
        name: "Small Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 0.01,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.totalBudget).toBe(0.01);
    });

    it("✅ Should handle special characters in budget name", async () => {
      const budgetData = {
        name: "Budget with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe(budgetData.name);
    });

    it("✅ Should handle unicode characters in budget name", async () => {
      const budgetData = {
        name: "Budget with unicode: 🚀💰💳🎯",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe(budgetData.name);
    });

    it("✅ Should handle long budget names", async () => {
      const longName = "a".repeat(100);
      const budgetData = {
        name: longName,
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.name).toBe(longName);
    });

    it("❌ Should fail when budget name exceeds maximum length", async () => {
      const longName = "a".repeat(101); // exceeds maxlength of 100
      const budgetData = {
        name: longName,
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
    });

    it("✅ Should handle multiple currencies", async () => {
      const currencies = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];

      for (const currency of currencies) {
        const budgetData = {
          name: `Budget in ${currency}`,
          period: {
            startDate: new Date("2024-01-01"),
            endDate: new Date("2024-01-31"),
          },
          categories: [
            {
              categoryId: categoryId1,
              allocatedAmount: 500,
            },
          ],
          currency: currency,
        };

        const response = await request(app)
          .post("/fin-tracker/v1/budgets")
          .set("Authorization", `Bearer ${authToken}`)
          .send(budgetData);

        expect(response.statusCode).toBe(201);
        expect(response.body.data.currency).toBe(currency);
      }
    });

    it("❌ Should fail with invalid currency", async () => {
      const budgetData = {
        name: "Invalid Currency Budget",
        period: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        categories: [
          {
            categoryId: categoryId1,
            allocatedAmount: 500,
          },
        ],
        currency: "INVALID",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/budgets")
        .set("Authorization", `Bearer ${authToken}`)
        .send(budgetData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
    });
  });
});
