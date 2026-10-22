import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../../app.js";
import User from "../../models/User.js";
import sendEmail from "../../config/notification-config.js";
import { securityConfig } from "../../config/security.js";

import {
  startTestDatabase,
  clearTestDatabase,
  stopTestDatabase,
} from "../helpers/database.js";

// Your existing Babel/Jest setup supports this mock.
jest.mock("../../config/notification-config.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.setTimeout(120000);

const SIGNUP_URL = "/fin-tracker/v1/auth/signup";

let mongo;

// A fresh object for each test.
const validSignup = () => ({
  name: "Alice Smith",
  email: "alice@example.com",
  userName: "alice",
  password: "StrongPassword123!",
});

beforeAll(async () => {
  await startTestDatabase();

  // Wait for unique indexes before testing database writes.
  await User.init();
});

beforeEach(async () => {
  await clearTestDatabase();

  // Each scenario starts with a fresh local-client allowance. Keep the real
  // limiter mounted; requests in earlier tests must not throttle later tests.
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

describe("POST /auth/signup", () => {
  it("creates a regular user and returns only safe fields", async () => {
    const input = validSignup();

    const response = await request(app).post(SIGNUP_URL).send(input);

    expect(response.status).toBe(201);

    // Exact keys: unexpected internal fields make this fail.
    expect(response.body.data).toEqual({
      id: expect.any(String),
      name: input.name,
      email: input.email,
      userName: input.userName,
      role: "user",
    });

    const storedUser = await User.findOne({
      email: input.email,
    });

    expect(storedUser).not.toBeNull();
    expect(storedUser.role).toBe("user");

    // Verify that the stored password is hashed correctly.
    expect(storedUser.password).not.toBe(input.password);
    expect(await bcrypt.compare(input.password, storedUser.password)).toBe(
      true,
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["role", "admin"],
    ["_id", "507f1f77bcf86cd799439011"],
    ["userId", "507f1f77bcf86cd799439011"],
    ["createdAt", "2026-01-01T00:00:00Z"],
    ["unexpectedField", "hello"],
  ])("rejects the unapproved field %s", async (field, value) => {
    const response = await request(app)
      .post(SIGNUP_URL)
      .send({
        ...validSignup(),
        [field]: value,
      });

    expect(response.status).toBe(400);

    // Check the side effect, not just the response.
    expect(await User.countDocuments({})).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a missing password", async () => {
    const input = validSignup();
    delete input.password;

    const response = await request(app).post(SIGNUP_URL).send(input);

    expect(response.status).toBe(400);
    expect(await User.countDocuments({})).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["missing body", undefined],
    ["empty object", {}],
    ["array", []],
    ["null", null],
    ["string", "hello"],
  ])("rejects %s without side effects", async (_label, body) => {
    const pending = request(app).post(SIGNUP_URL);
    const response =
      body === undefined
        ? await pending
        : await pending
            .set("Content-Type", "application/json")
            .send(JSON.stringify(body));

    expect(response.status).toBe(400);
    expect(await User.countDocuments({})).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a field with the wrong type", async () => {
    const response = await request(app)
      .post(SIGNUP_URL)
      .send({
        ...validSignup(),
        name: { value: "Alice" },
      });

    expect(response.status).toBe(400);
    expect(await User.countDocuments({})).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("saves the normalized input from validation", async () => {
    const response = await request(app)
      .post(SIGNUP_URL)
      .send({
        ...validSignup(),
        name: "  Alice Smith  ",
        email: "  ALICE@EXAMPLE.COM  ",
        userName: "  alice  ",
      });

    expect(response.status).toBe(201);

    const storedUser = await User.findOne({
      userName: "alice",
    });

    expect(storedUser).not.toBeNull();
    expect(storedUser.name).toBe("Alice Smith");
    expect(storedUser.email).toBe("alice@example.com");
  });
});
