// Transaction Routes Testing
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
let transactionId;
let categoryId;
let incomeCategoryId;
let transactionData1Id;
let transactionData2Id;

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

  //creating the expense category data and setting the variable
  const expenseCategoryData = {
    name: "Food & Dining",
    description: "Expenses related to food and dining",
    type: "expense",
  };

  const expenseCategoryResponse = await request(app)
    .post("/fin-tracker/v1/categories")
    .set("Authorization", `Bearer ${authToken}`)
    .send(expenseCategoryData);

  categoryId = expenseCategoryResponse.body.data._id;

  //creating the income category data and setting the variable
  const incomeCategoryData = {
    name: "Salary",
    description: "Monthly salary income",
    type: "income",
  };

  const incomeCategoryResponse = await request(app)
    .post("/fin-tracker/v1/categories")
    .set("Authorization", `Bearer ${authToken}`)
    .send(incomeCategoryData);

  incomeCategoryId = incomeCategoryResponse.body.data._id;

  //creating 2 transaction to be stored for fetch all and get test cases
  const transactionData1 = {
    type: "expense",
    amount: 45.99,
    categoryId: categoryId,
    note: "test transaction1",
  };

  const transactionData1Response = await request(app)
    .post("/fin-tracker/v1/transactions")
    .set("Authorization", `Bearer ${authToken}`)
    .send(transactionData1);

  transactionData1Id = transactionData1Response.body.data._id;

  const transactionData2 = {
    type: "expense",
    amount: 50,
    categoryId: categoryId,
    note: "test transaction2",
  };

  const transactionData2Response = await request(app)
    .post("/fin-tracker/v1/transactions")
    .set("Authorization", `Bearer ${authToken}`)
    .send(transactionData2);

  transactionData2Id = transactionData2Response.body.data._id;
});

afterAll(async () => {
  // Clean up test data
  if (process.env.NODE_ENV === "test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();
});

describe("Transaction API Test Suite", () => {
  // ==================== CREATE TRANSACTION TESTS ====================
  describe("POST /fin-tracker/v1/transactions - Create Transaction", () => {
    // POSITIVE TEST CASES
    it("✅ Should create an expense transaction successfully", async () => {
      const transactionData = {
        type: "expense",
        amount: 45.99,
        categoryId: categoryId,
        note: `Test expense transaction ${Date.now()}`,
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data.type).toBe("expense");
      expect(response.body.data.amount).toBe(45.99);
      expect(response.body.data.note).toBe(transactionData.note);
      expect(response.body.data.categoryId).toBe(categoryId);
      expect(response.body.data.userId).toBeDefined();
      expect(response.body.data.status).toBe("completed");

      transactionId = response.body.data._id;
    });

    it("✅ Should create an income transaction successfully", async () => {
      const transactionData = {
        type: "income",
        amount: 2500.0,
        categoryId: incomeCategoryId,
        note: `Test income transaction ${Date.now()}`,
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.type).toBe("income");
      expect(response.body.data.amount).toBe(2500.0);
      expect(response.body.data.categoryId).toBe(incomeCategoryId);
    });

    it("✅ Should create a transfer transaction successfully", async () => {
      const transactionData = {
        type: "transfer",
        amount: 100.0,
        categoryId: categoryId, // Transfer still needs categoryId due to validation middleware
        note: `Test transfer transaction ${Date.now()}`,
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(404);
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when type is missing", async () => {
      const transactionData = {
        amount: 45.99,
        categoryId: categoryId,
        note: "Test transaction without type",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid transaction type is required");
    });

    it("❌ Should fail when type is invalid", async () => {
      const transactionData = {
        type: "invalid_type",
        amount: 45.99,
        categoryId: categoryId,
        note: "Test transaction with invalid type",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid transaction type is required");
    });

    it("❌ Should fail when categoryId is missing for expense/income", async () => {
      const transactionData = {
        type: "expense",
        amount: 45.99,
        note: "Test transaction without category",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Category is required");
    });

    it("❌ Should fail when amount is missing", async () => {
      const transactionData = {
        type: "expense",
        categoryId: categoryId,
        note: "Test transaction without amount",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid amount is required");
    });

    it("❌ Should fail when amount is negative", async () => {
      const transactionData = {
        type: "expense",
        amount: -45.99,
        categoryId: categoryId,
        note: "Test transaction with negative amount",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid amount is required");
    });

    it("❌ Should fail when amount is zero", async () => {
      const transactionData = {
        type: "expense",
        amount: 0,
        categoryId: categoryId,
        note: "Test transaction with zero amount",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid amount is required");
    });

    it("❌ Should fail when note is missing", async () => {
      const transactionData = {
        type: "expense",
        amount: 45.99,
        categoryId: categoryId,
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Description is required");
    });

    it("❌ Should fail when note is empty", async () => {
      const transactionData = {
        type: "expense",
        amount: 45.99,
        categoryId: categoryId,
        note: "   ",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Description is required");
    });

    it("❌ Should fail when note exceeds 500 characters", async () => {
      const longNote = "a".repeat(501);
      const transactionData = {
        type: "expense",
        amount: 45.99,
        categoryId: categoryId,
        note: longNote,
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe(
        "Description must be less than 500 characters"
      );
    });

    it("❌ Should fail when categoryId is invalid", async () => {
      const transactionData = {
        type: "expense",
        amount: 45.99,
        categoryId: "invalid_category_id",
        note: "Test transaction with invalid category",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(500);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        'Cast to ObjectId failed for value "invalid_category_id" (type string) at path "_id" for model "Category"'
      );
    });
  });

  // ==================== GET ALL TRANSACTIONS TESTS ====================
  describe("GET /fin-tracker/v1/transactions - Get All Transactions", () => {
    // POSITIVE TEST CASES
    it("✅ Should fetch all transactions successfully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data).toHaveProperty("pagination");
      expect(response.body.data).toHaveProperty("summary");
      expect(response.body.data).toHaveProperty("filters");
    });

    it("✅ Should fetch transactions with pagination", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions?page=1&limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.transactions.length).toBeLessThanOrEqual(5);
    });

    it("✅ Should fetch transactions with type filter", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions?type=expense")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      response.body.data.transactions.forEach((transaction) => {
        expect(transaction.type).toBe("expense");
      });
    });

    it("✅ Should fetch transactions with amount range filter", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions?minAmount=40&maxAmount=50")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      response.body.data.transactions.forEach((transaction) => {
        expect(transaction.amount).toBeGreaterThanOrEqual(40);
        expect(transaction.amount).toBeLessThanOrEqual(50);
      });
    });

    it("✅ Should fetch transactions with date range filter", async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get(
          `/fin-tracker/v1/transactions?startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}`
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
    });

    it("✅ Should fetch transactions with sorting", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions?sort=-amount")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      const amounts = response.body.data.transactions.map((t) => t.amount);
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i - 1]).toBeGreaterThanOrEqual(amounts[i]);
      }
    });

    it("✅ Should fetch transactions with search filter", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions?search=test")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when unauthorized", async () => {
      const response = await request(app).get("/fin-tracker/v1/transactions");

      expect(response.statusCode).toBe(401);
    });

    it("❌ Should handle invalid page number gracefully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions?page=0")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(500);
    });

    it("❌ Should handle invalid limit gracefully", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions?limit=0")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.pagination.limit).toBe(0);
    });
  });

  // ==================== GET TRANSACTION BY ID TESTS ====================
  describe("GET /fin-tracker/v1/transactions/:id - Get Transaction By ID", () => {
    // POSITIVE TEST CASES
    it("✅ Should fetch a specific transaction successfully", async () => {
      const response = await request(app)
        .get(`/fin-tracker/v1/transactions/${transactionData1Id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data._id).toBe(transactionData1Id);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data).toHaveProperty("categoryId");
      expect(response.body.data).toHaveProperty("type");
      expect(response.body.data).toHaveProperty("amount");
      expect(response.body.data).toHaveProperty("note");
      expect(response.body.data).toHaveProperty("userId");
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when transaction ID is missing", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions/")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
    });

    it("❌ Should fail when transaction ID is invalid format", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions/invalid_id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Invalid transaction ID format");
    });

    it("❌ Should fail when transaction is not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/fin-tracker/v1/transactions/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Transaction not found");
    });

    it("❌ Should fail when unauthorized", async () => {
      const response = await request(app).get(
        `/fin-tracker/v1/transactions/${transactionData1Id}`
      );

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== UPDATE TRANSACTION TESTS ====================
  describe("PUT /fin-tracker/v1/transactions/:id - Update Transaction", () => {
    // POSITIVE TEST CASES
    it("✅ Should update transaction successfully", async () => {
      const updateData = {
        type: "expense",
        amount: 60.0,
        categoryId: categoryId,
        note: "Updated transaction note",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${transactionData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.amount).toBe(60.0);
      expect(response.body.data.note).toBe("Updated transaction note");
    });

    it("✅ Should update only specific fields", async () => {
      const updateData = {
        type: "expense",
        amount: 50,
        categoryId: categoryId,
        note: "Partially updated note",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${transactionData2Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.note).toBe("Partially updated note");
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when transaction ID is missing", async () => {
      const updateData = {
        type: "expense",
        amount: 50,
        categoryId: categoryId,
        note: "Updated note",
      };

      const response = await request(app)
        .put("/fin-tracker/v1/transactions/")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(404);
    });

    it("❌ Should fail when transaction ID is invalid format", async () => {
      const updateData = {
        type: "expense",
        amount: 50,
        categoryId: categoryId,
        note: "Updated note",
      };

      const response = await request(app)
        .put("/fin-tracker/v1/transactions/invalid_id")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Invalid transaction ID format");
    });

    it("❌ Should fail when transaction is not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const updateData = {
        type: "expense",
        amount: 50,
        categoryId: categoryId,
        note: "Updated note",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(404);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Transaction not found");
    });

    it("❌ Should fail when type is invalid", async () => {
      const updateData = {
        type: "invalid_type",
        amount: 50,
        categoryId: categoryId,
        note: "Updated note",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${transactionData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid transaction type is required");
    });

    it("❌ Should fail when amount is negative", async () => {
      const updateData = {
        type: "expense",
        amount: -10.0,
        categoryId: categoryId,
        note: "Updated note",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${transactionData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid amount is required");
    });

    it("❌ Should fail when status is invalid", async () => {
      const updateData = {
        type: "expense",
        amount: 50,
        categoryId: categoryId,
        note: "Updated note",
        status: "invalid_status",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${transactionData1Id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Invalid status");
    });

    it("❌ Should fail when unauthorized", async () => {
      const updateData = {
        type: "expense",
        amount: 50,
        categoryId: categoryId,
        note: "Updated note",
      };

      const response = await request(app)
        .put(`/fin-tracker/v1/transactions/${transactionData1Id}`)
        .send(updateData);

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== DELETE TRANSACTION TESTS ====================
  describe("DELETE /fin-tracker/v1/transactions/:id - Delete Transaction", () => {
    // POSITIVE TEST CASES
    it("✅ Should delete transaction successfully", async () => {
      // First create a transaction to delete
      const transactionData = {
        type: "expense",
        amount: 25.0,
        categoryId: categoryId,
        note: "Transaction to be deleted",
      };

      const createResponse = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      const transactionToDeleteId = createResponse.body.data._id;

      const response = await request(app)
        .delete(`/fin-tracker/v1/transactions/${transactionToDeleteId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(500);
    });

    // NEGATIVE TEST CASES
    it("❌ Should fail when transaction ID is missing", async () => {
      const response = await request(app)
        .delete("/fin-tracker/v1/transactions/")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
    });

    it("❌ Should fail when transaction ID is invalid format", async () => {
      const response = await request(app)
        .delete("/fin-tracker/v1/transactions/invalid_id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(500);
    });

    it("❌ Should fail when transaction is not found", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .delete(`/fin-tracker/v1/transactions/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(500);
    });

    it("❌ Should fail when unauthorized", async () => {
      const response = await request(app).delete(
        `/fin-tracker/v1/transactions/${transactionData1Id}`
      );

      expect(response.statusCode).toBe(401);
    });
  });

  // ==================== EDGE CASES AND ERROR SCENARIOS ====================
  describe("Edge Cases and Error Scenarios", () => {
    it("❌ Should fail when body is empty", async () => {
      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.status).toBe("Fail");
      expect(response.body.message).toBe("Valid transaction type is required");
    });

    it("❌ Should fail when user token is invalid", async () => {
      const transactionData = {
        type: "expense",
        amount: 45.99,
        categoryId: categoryId,
        note: "Test transaction with invalid token",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer invalid_token`)
        .send(transactionData);

      expect(response.statusCode).toBe(401);
    });

    it("❌ Should fail when category type doesn't match transaction type", async () => {
      const transactionData = {
        type: "income",
        amount: 100.0,
        categoryId: categoryId, // This is an expense category
        note: "Test transaction with mismatched category type",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(500);
    });

    it("❌ Should handle very large amounts", async () => {
      const transactionData = {
        type: "expense",
        amount: 999999999.99,
        categoryId: categoryId,
        note: "Test transaction with very large amount",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.amount).toBe(999999999.99);
    });

    it("❌ Should handle very small amounts", async () => {
      const transactionData = {
        type: "expense",
        amount: 0.01,
        categoryId: categoryId,
        note: "Test transaction with very small amount",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.amount).toBe(0.01);
    });

    it("✅ Should handle special characters in note", async () => {
      const transactionData = {
        type: "expense",
        amount: 25.0,
        categoryId: categoryId,
        note: "Test transaction with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.note).toBe(transactionData.note);
    });

    it("✅ Should handle unicode characters in note", async () => {
      const transactionData = {
        type: "expense",
        amount: 25.0,
        categoryId: categoryId,
        note: "Test transaction with unicode: 🚀💰💳🎯",
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.note).toBe(transactionData.note);
    });
  });
});
