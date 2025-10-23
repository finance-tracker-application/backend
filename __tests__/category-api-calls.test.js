// Direct API Calls Testing for Category Endpoints
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

describe("📞 Direct API Calls - Category CRUD Operations", () => {
  let authToken;
  let createdCategoryId;

  // Step 1: Setup - Create user and get auth token
  beforeAll(async () => {
    console.log("🔧 Setting up authentication...");

    // Create user
    const userResponse = await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send({
        name: "Category Tester",
        userName: "categorytester123",
        email: `category_${Date.now()}@example.com`,
        role: "user",
        password: "TestPassword123!",
      });

    console.log(
      "👤 User created:",
      userResponse.statusCode === 200 ? "✅ Success" : "❌ Failed"
    );

    // Login to get token
    const loginResponse = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName: "categorytester123",
        password: "TestPassword123!",
      });

    authToken = loginResponse.body.data.token;
    console.log(
      "🔐 Authentication token obtained:",
      authToken ? "✅ Success" : "❌ Failed"
    );
  });

  // Test 1: CREATE Category
  it("📝 CREATE - POST /fin-tracker/v1/categories", async () => {
    console.log("\n🚀 Testing CREATE Category...");

    const categoryData = {
      name: "Test Food Category",
      description: "Testing food category creation",
      type: "expense",
    };

    const response = await request(app)
      .post("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`)
      .send(categoryData);

    console.log("📤 Request sent:", {
      method: "POST",
      url: "/fin-tracker/v1/categories",
      data: categoryData,
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Check if creation was successful
    expect(response.statusCode).toBe(201);
    expect(response.body.data).toHaveProperty("_id");
    expect(response.body.data.name).toBe("Test Food Category");

    createdCategoryId = response.body.data._id;
    console.log("✅ CREATE Category: SUCCESS");
    console.log("🆔 Created Category ID:", createdCategoryId);
  });

  // Test 2: READ Category by ID
  it("📖 READ - GET /fin-tracker/v1/categories/:id", async () => {
    console.log("\n🚀 Testing READ Category...");

    const response = await request(app)
      .get(`/fin-tracker/v1/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    console.log("📤 Request sent:", {
      method: "GET",
      url: `/fin-tracker/v1/categories/${createdCategoryId}`,
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Check if read was successful
    expect(response.statusCode).toBe(200);
    expect(response.body.data._id).toBe(createdCategoryId);
    expect(response.body.data.name).toBe("Test Food Category");

    console.log("✅ READ Category: SUCCESS");
  });

  // Test 3: UPDATE Category
  it("✏️ UPDATE - PATCH /fin-tracker/v1/categories/:id", async () => {
    console.log("\n🚀 Testing UPDATE Category...");

    const updateData = {
      name: "Updated Test Food Category",
      description: "Updated description for testing",
    };

    const response = await request(app)
      .patch(`/fin-tracker/v1/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(updateData);

    console.log("📤 Request sent:", {
      method: "PATCH",
      url: `/fin-tracker/v1/categories/${createdCategoryId}`,
      data: updateData,
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Check if update was successful
    expect(response.statusCode).toBe(200);
    expect(response.body.data.name).toBe("Updated Test Food Category");
    expect(response.body.data.description).toBe(
      "Updated description for testing"
    );

    console.log("✅ UPDATE Category: SUCCESS");
  });

  // Test 4: READ All Categories
  it("📋 READ ALL - GET /fin-tracker/v1/categories", async () => {
    console.log("\n🚀 Testing READ ALL Categories...");

    const response = await request(app)
      .get("/fin-tracker/v1/categories")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("📤 Request sent:", {
      method: "GET",
      url: "/fin-tracker/v1/categories",
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Check if read all was successful
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toHaveProperty("categories");
    expect(response.body.data).toHaveProperty("pagination");

    console.log("✅ READ ALL Categories: SUCCESS");
    console.log("📊 Total categories:", response.body.data.pagination.total);
  });

  // Test 5: DELETE Category
  it("🗑️ DELETE - DELETE /fin-tracker/v1/categories/:id", async () => {
    console.log("\n🚀 Testing DELETE Category...");

    const response = await request(app)
      .delete(`/fin-tracker/v1/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    console.log("📤 Request sent:", {
      method: "DELETE",
      url: `/fin-tracker/v1/categories/${createdCategoryId}`,
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Check if delete was successful (accept both 200 and 204)
    expect([200, 204]).toContain(response.statusCode);

    console.log("✅ DELETE Category: SUCCESS");
  });

  // Test 6: Verify Deletion
  it("🔍 VERIFY DELETE - GET /fin-tracker/v1/categories/:id (should be archived)", async () => {
    console.log("\n🚀 Testing VERIFY DELETE...");

    const response = await request(app)
      .get(`/fin-tracker/v1/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${authToken}`);

    console.log("📤 Request sent:", {
      method: "GET",
      url: `/fin-tracker/v1/categories/${createdCategoryId}`,
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Check if category is archived (soft delete)
    if (response.statusCode === 200) {
      expect(response.body.data.archived).toBe(true);
      console.log(
        "✅ VERIFY DELETE: SUCCESS (Soft delete - category archived)"
      );
    } else {
      console.log(
        "✅ VERIFY DELETE: SUCCESS (Hard delete - category not found)"
      );
    }
  });

  // Test 7: Test Error Handling - Invalid Category ID
  it("❌ ERROR HANDLING - GET /fin-tracker/v1/categories/invalid-id", async () => {
    console.log("\n🚀 Testing ERROR HANDLING...");

    const response = await request(app)
      .get("/fin-tracker/v1/categories/invalid-id")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("📤 Request sent:", {
      method: "GET",
      url: "/fin-tracker/v1/categories/invalid-id",
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Should return 400 for invalid ID format
    expect(response.statusCode).toBe(400);
    console.log("✅ ERROR HANDLING: SUCCESS (Invalid ID rejected)");
  });

  // Test 8: Test Unauthorized Access
  it("🔒 SECURITY - GET /fin-tracker/v1/categories (without token)", async () => {
    console.log("\n🚀 Testing SECURITY...");

    const response = await request(app).get("/fin-tracker/v1/categories");

    console.log("📤 Request sent:", {
      method: "GET",
      url: "/fin-tracker/v1/categories",
      note: "No Authorization header",
    });

    console.log("📥 Response received:", {
      status: response.statusCode,
      body: response.body,
    });

    // Should return 401 for unauthorized access
    expect(response.statusCode).toBe(401);
    console.log("✅ SECURITY: SUCCESS (Unauthorized access blocked)");
  });
});
