// Application integration tests
import request from "supertest";
import app from "../../app.js";
import User from "../../models/User.js";
import sendEmail from "../../config/notification-config.js";
import { securityConfig } from "../../config/security.js";

import {
  startTestDatabase,
  clearTestDatabase,
  stopTestDatabase,
} from "../helpers/database.js";

jest.mock("../../config/notification-config.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

//  Increase Jest timeout (default 5s is too short in CI)
jest.setTimeout(120000);

const buildUserData = () => ({
  name: "Test User",
  userName: "testuser2701",
  email: "app-test@example.com",
  password: "Assasinscreed2!",
});

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

describe("Start the app and check if running", () => {
  it("should return 200 OK and a running message inside data", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toMatch(/application is running/i);
  });
});

describe("testing /fin-tracker/v1/auth endpoint", () => {
  it("Run POST, create a new user", async () => {
    const testUser = buildUserData();
    const response = await request(app)
      .post("/fin-tracker/v1/auth/signup")
      .send(testUser);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name", "Test User");
    expect(response.body.data).toHaveProperty("userName", testUser.userName);
    expect(response.body.data).toHaveProperty("email", testUser.email);
    expect(response.body.data).toHaveProperty("id");
  }, 10000);

  it("Run the login and generate the token", async () => {
    const testUser = buildUserData();
    // This test owns its account; it does not depend on the signup test.
    await User.create(testUser);

    const response = await request(app)
      .post("/fin-tracker/v1/auth/login")
      .send({
        userName: testUser.userName,
        password: testUser.password,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("dateTime");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("name");
    expect(response.body.data.token).toEqual(expect.any(String));
  }, 10000);
});
