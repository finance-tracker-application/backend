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

describe("Transaction Test Cases for create", () => {
  let authToken;
  let transactionId;
  let categoryId;
  let testTransactionId;

  // Setup authenticated user
  beforeAll(async () => {
    // Create user
    const userData = {
      name: "Test User",
      userName: "testuser123",
      email: `test_${Date.now()}@example.com`,
      role: "user",
      password: "TestPassword123!",
    };

    await request(app).post("/fin-tracker/v1/auth/signup").send(userData);

    // Login to get token
    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName: "testuser123",
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
    console.log("🔐 Authentication setup complete");

    //create a category and pass the category id to call the create transactions

    const categoryData = {
      name: "Food & Dining",
      description: "Expenses related to food and dining",
      type: "expense",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send(categoryData);

    console.log(
      "Category create response:\n",
      JSON.stringify(response.body, null, 2)
    );

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toMatchObject({
      name: "Food & Dining",
      description: "Expenses related to food and dining",
      type: "expense",
    });
    expect(response.body.data).toHaveProperty("_id");

    if (response.status >= 400) {
      console.log("Category creation failed:", response.status, response.body);
    }

    categoryId = response.body.data._id;
    console.log("categoryId", categoryId);
  });

  // Test 1: Create Category
  it("✅ POST /fin-tracker/v1/transactions - Create transaction", async () => {
    const transactionData = {
      type: "expense",
      amount: 45.99,
      categoryId: categoryId,
      note: `Test transaction ${Date.now()}`,
    };
    console.log("transactionData", transactionData);
    const response = await request(app)
      .post("/fin-tracker/v1/transactions")
      .set("Authorization", `Bearer ${authToken}`)
      .send(transactionData);

    console.log("Create transaction response:", response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data.type).toBe("expense");
    expect(response.body.data.amount).toBe(45.99);
    testTransactionId = response.body.data._id;
    console.log("✅ Create transsaction working");
  });
});
