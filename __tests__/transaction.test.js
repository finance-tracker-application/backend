// tests/transaction.test.js
import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

beforeAll(async () => {
  await mongoose.connect(process.env.testMONGOdb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Transaction.deleteMany({});
  await User.deleteMany({});
});

// helper to create a user and return {_id}
async function makeUser(overrides = {}) {
  const doc = await User.create({
    name: "Txn Tester",
    userName: `txn_user_${Date.now()}`,
    email: `txn_${Date.now()}@example.com`,
    role: "user",
    password: "Secret123!",
    ...overrides,
  });
  return doc;
}

describe("POST /fin-tracker/v1/transactions", () => {
  it("returns 401 when token is missing", async () => {
    const res = await request(app).post("/fin-tracker/v1/transactions").send({
      type: "expense",
      amount: 25,
      category: "Food",
    });
    expect(res.statusCode).toBe(401);
    expect(String(res.body.message).toLowerCase()).toContain("unauthor");
  }, 10000);

  it("returns 401 when user in token not found", async () => {
    const ghostId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: ghostId },
        type: "expense",
        amount: 25,
        category: "Food",
        // your controller currently does new Transaction(body), so include userId
        userId: ghostId,
      });
    expect(res.statusCode).toBe(401);
  }, 10000);

  it("returns 404 for invalid type", async () => {
    const user = await makeUser();
    const res = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: user._id.toString() },
        type: "transfer", // invalid
        amount: 10,
        category: "Food",
        userId: user._id.toString(),
      });
    expect(res.statusCode).toBe(404);
    expect(String(res.body.message).toLowerCase()).toContain("invalid type");
  }, 10000);

  it("returns 404 when amount is not positive", async () => {
    const user = await makeUser();
    const res = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: user._id.toString() },
        type: "expense",
        amount: 0, // invalid
        category: "Food",
        userId: user._id.toString(),
      });
    expect(res.statusCode).toBe(404);
    expect(String(res.body.message).toLowerCase()).toMatch(
      /amount|number|negative/
    );
  }, 10000);

  it("returns 400 when category is missing or not a string", async () => {
    const user = await makeUser();

    const r1 = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: user._id.toString() },
        type: "expense",
        amount: 12.5,
        userId: user._id.toString(),
      });
    expect(r1.statusCode).toBe(400);
    expect(String(r1.body.message).toLowerCase()).toContain("category");

    const r2 = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: user._id.toString() },
        type: "expense",
        amount: 12.5,
        category: 123,
        userId: user._id.toString(),
      });
    expect(r2.statusCode).toBe(400);
    expect(String(r2.body.message).toLowerCase()).toContain("string");
  }, 10000);

  it("returns 400 when note exceeds 500 characters", async () => {
    const user = await makeUser();
    const longNote = "a".repeat(501);
    const res = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: user._id.toString() },
        type: "income",
        amount: 100,
        category: "Salary",
        note: longNote,
        userId: user._id.toString(),
      });
    expect(res.statusCode).toBe(400);
    expect(String(res.body.message).toLowerCase()).toContain("note");
  }, 10000);

  it("creates a transaction (201) and returns it", async () => {
    const user = await makeUser();
    const res = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: user._id.toString() },
        type: "income",
        amount: 99.99,
        category: "Salary",
        note: "Sep salary",
        userId: user._id.toString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      type: "income",
      amount: 99.99,
      category: "Salary",
      note: "Sep salary",
    });

    const created = await Transaction.findById(res.body.data._id).lean();
    expect(created).toBeTruthy();
    expect(created.userId.toString()).toBe(user._id.toString());
    expect(new Date(created.date).toISOString()).toBe(
      "2025-09-06T10:30:00.000Z"
    );
  }, 10000);

  it("defaults date when not provided", async () => {
    const user = await makeUser();
    const res = await request(app)
      .post("/fin-tracker/v1/transactions")
      .send({
        token: { _id: user._id.toString() },
        type: "expense",
        amount: 12.34,
        category: "Food",
        userId: user._id.toString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.date).toBeTruthy();
  }, 10000);
});
