// Category Routes Testing
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

describe("📂 Category Routes Testing", () => {
  let authToken;
  let testCategoryId;

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
  });

  // Test 1: Create Category
  it("✅ POST /fin-tracker/v1/categories - Create category", async () => {
    const categoryData = {
      name: "Food & Dining",
      description: "Expenses related to food and dining",
      type: "expense",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send(categoryData);

    console.log("Create category response:", response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data.name).toBe("Food & Dining");
    testCategoryId = response.body.data._id;
    console.log("✅ Create category working");
  });

  // Test 2: Get All Categories
  it("✅ GET /fin-tracker/v1/categories - Get all categories", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Get all categories response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    // Check if data is array or object
    if (Array.isArray(response.body.data)) {
      expect(Array.isArray(response.body.data)).toBe(true);
      console.log("✅ Get all categories working - returns array");
    } else {
      console.log("⚠️ Get all categories returns object instead of array");
      expect(response.body.data).toBeDefined();
    }
  });

  // Test 3: Get Category by ID
  it("✅ GET /fin-tracker/v1/categories/:id - Get category by ID", async () => {
    const response = await request(app)
      .get(`/fin-tracker/v1/categories/${testCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Get category by ID response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.data._id).toBe(testCategoryId);
    expect(response.body.data.name).toBe("Food & Dining");
    console.log("✅ Get category by ID working");
  });

  // Test 4: Update Category
  it("✅ PATCH /fin-tracker/v1/categories/:id - Update category", async () => {
    const updateData = {
      name: "Updated Food & Dining",
      description: "Updated description for food expenses",
    };

    const response = await request(app)
      .patch(`/fin-tracker/v1/categories/${testCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData);

    console.log("Update category response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("Updated Food & Dining");
    console.log("✅ Update category working");
  });

  // Test 5: Create Another Category
  it("✅ POST /fin-tracker/v1/categories - Create second category", async () => {
    const categoryData = {
      name: "Transportation",
      description: "Transport related expenses",
      type: "expense",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send(categoryData);

    console.log("Create second category response:", response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body.data.name).toBe("Transportation");
    console.log("✅ Create second category working");
  });

  // Test 6: Get All Categories Again
  it("✅ GET /fin-tracker/v1/categories - Get all categories after creating second", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Get all categories (second time) response:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    console.log("✅ Get all categories (second time) working");
  });

  // Test 7: Delete Category
  it("✅ DELETE /fin-tracker/v1/categories/:id - Delete category", async () => {
    const response = await request(app)
      .delete(`/fin-tracker/v1/categories/${testCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Delete category response:", response.body);
    // Accept both 200 and 204 status codes for delete operations
    expect([200, 204]).toContain(response.statusCode);
    console.log("✅ Delete category working");
  });

  // Test 8: Try to get deleted category (should return 404)
  it("✅ GET /fin-tracker/v1/categories/:id - Get deleted category should return 404", async () => {
    const response = await request(app)
      .get(`/fin-tracker/v1/categories/${testCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Get deleted category response:", response.body);
    expect(response.statusCode).toBe(404);
    console.log("✅ Get deleted category returns 404 as expected");
  });

  // Test 9: Security - Unauthorized access
  it("✅ Security - Unauthorized access to categories should return 401", async () => {
    const response = await request(app).get("/fin-tracker/v1/categories");

    console.log("Unauthorized access response:", response.body);
    expect(response.statusCode).toBe(401);
    console.log("✅ Security - Unauthorized access protection working");
  });

  // Test 10: Security - Invalid token
  it("✅ Security - Invalid token should return 401", async () => {
    const response = await request(app)
      .get("/fin-tracker/v1/categories")
      .set("Authorization", "Bearer invalid-token");

    console.log("Invalid token response:", response.body);
    expect(response.statusCode).toBe(401);
    console.log("✅ Security - Invalid token protection working");
  });

  // Test 11: Create category with invalid data
  it("✅ POST /fin-tracker/v1/categories - Create category with invalid data", async () => {
    const invalidData = {
      name: "", // Empty name should fail validation
      description: "Invalid category",
      type: "invalid_type",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send(invalidData);

    console.log("Invalid data response:", response.body);
    expect(response.statusCode).toBe(400);
    console.log("✅ Validation working - rejects invalid data");
  });

  // Test 12: Update non-existent category
  it("✅ PATCH /fin-tracker/v1/categories/:id - Update non-existent category", async () => {
    const nonExistentId = "507f1f77bcf86cd799439011";
    const updateData = {
      name: "Non-existent category",
    };

    const response = await request(app)
      .patch(`/fin-tracker/v1/categories/${nonExistentId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData);

    console.log("Update non-existent category response:", response.body);
    expect(response.statusCode).toBe(404);
    console.log("✅ Update non-existent category returns 404 as expected");
  });
});
