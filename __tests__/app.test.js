// __tests__/app.test.js
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js"; // IMPORTANT: app.js must export only the Express app, not app.listen()
import path from "path";
import dotenv from "dotenv";

// ✅ Load environment variables from .env in project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ✅ Increase Jest timeout (default 5s is too short in CI)
jest.setTimeout(20000);

let testUser;
let userName = `testuser2701`;
let email = `test_${Date.now()}@example.com`;

const testMONGOdb = `mongodb://localhost:27017/testfin-trackerDB`;
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
  // Drop only in test DB to avoid wiping real data
  if (process.env.NODE_ENV === "test") {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();
});

describe("Start the app and check if running", () => {
  it("should return 200 OK and a running message inside data", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toMatch(/application is running/i);
  });
});

describe("testing /fin-tracker/v1/auth endpoint", () => {
  beforeAll(() => {
    testUser = {
      name: "Test User",
      userName,
      email,
      role: "user",
      password: "Assasinscreed2!",
    };
  });

  it("Run POST, create a new user", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(testUser);

    //console.log("Signup response:", response.body);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name", "Test User");
    expect(response.body.data).toHaveProperty("userName", userName);
    expect(response.body.data).toHaveProperty("email", email);
    expect(response.body.data).toHaveProperty("_id");
  }, 10000);

  it("Run the login and generate the token", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName,
        password: "Assasinscreed2!",
      });

    //console.log("Login response:", response.body);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name");
    expect(response.body.data).toHaveProperty("token");
  }, 10000);
});
