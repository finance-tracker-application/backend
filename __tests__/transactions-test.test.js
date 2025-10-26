// Category Routes Testing
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

  //creating the cateegory data and setting the varaible
  const categoryData = {
    name: "Food & Dining",
    description: "Expenses related to food and dining",
    type: "expense",
  };

  const cResponse = await request(app)
    .post("/fin-tracker/v1/categories")
    .set("Authorization", `Bearer ${authToken}`)
    .send(categoryData);

  categoryId = cResponse.body.data._id;

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

describe(
  "Transaction Test Cases for create",
  () => {
    // Test 1: Create Category
    it("✅ POST /fin-tracker/v1/transactions - Create transaction", async () => {
      const transactionData = {
        type: "expense",
        amount: 45.99,
        categoryId: categoryId,
        note: `Test transaction ${Date.now()}`,
      };

      const response = await request(app)
        .post("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transactionData);

      console.log("Create transaction response:", response.body);
      expect(response.statusCode).toBe(201);
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data.type).toBe("expense");
      expect(response.body.data.amount).toBe(45.99);
    });
  },

  describe("POST /fin-tracker/v1/transactions - Create transaction - test validation", () => {
    it("POST /fin-tracker/v1/transactions - Create transaction - test validation", async () => {
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
  }),

  describe("GET /fin-tracker/v1/transactions - Get operations ", () => {
    it("GET /fin-tracker/v1/transactions - fetch all transaction", async () => {
      const response = await request(app)
        .get("/fin-tracker/v1/transactions")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBe(2);
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("GET /fin-tracker/v1/transactions - fetch with pagination2", async () => {
      const response = await request(app)
        .get(
          "/fin-tracker/v1/transactions?page=2&limit=10&sort=-data&type=expense"
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.transactions.length).toBe(0);
      expect(response.body.data).not.toHaveProperty("password");
    });

    it("Get /fin-tracker/v1/transactions - fetch one transaction transaction", async () => {
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
      expect(response.body.data).toHaveProperty("pagination");
    });
  })
);
