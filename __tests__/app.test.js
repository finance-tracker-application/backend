import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";

beforeAll(async () => {
  await mongoose.connect(process.env.testMONGOdb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Start the app and check if running", () => {
  it("should return 200 OK and a running message inside data", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toMatch(/application is running/i);
  });
});

describe("testing /fin-tracker/v1/auth/ endpoint", () => {
  it("Run POST , create a new user ", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send({
        name: "Test user",
        userName: "testuser123",
        email: `test${Date.now()}@example.com`,
        password: "TestPassword123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name", "Test user");
    expect(response.body.data).toHaveProperty("userName", "testuser123");
    expect(response.body.data).toHaveProperty("email");
    expect(response.body.data).toHaveProperty("_id");
  }, 10000);

  it("Run the login and generate the token", async () => {
    const response = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName: "testuser123",
        password: "TestPassword123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name");
    expect(response.body.data).toHaveProperty("token");
  }, 10000);
});
