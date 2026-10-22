import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo;
let ownedDatabase;

export async function startTestDatabase() {
  // check if th env is test
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Test database helper can only run in test mode");
  }

  if (mongo || mongoose.connection.readyState !== 0) {
    throw new Error(
      "A database connection is already established and running ",
    );
  }

  try {
    mongo = await MongoMemoryServer.create();

    await mongoose.connect(mongo.getUri(), {
      dbName: "test",
    });

    // Remember the exact database created by this helper.
    ownedDatabase = mongoose.connection.db;

    // Wait for indexes on models imported by the test suite.
    await Promise.all(
      Object.values(mongoose.models).map((model) => model.init()),
    );
  } catch (error) {
    await stopTestDatabase();
    throw error;
  }
}

export async function stopTestDatabase() {
  // Never disconnect an unrelated connection if setup was not started.
  if (!mongo) {
    return;
  }

  try {
    await mongoose.disconnect();
  } finally {
    try {
      await mongo.stop();
    } finally {
      mongo = undefined;
      ownedDatabase = undefined;
    }
  }
}

export async function clearTestDatabase() {
  const connection = mongoose.connection;

  // Refuse to delete documents from an unrelated connection.
  if (
    connection.readyState !== 1 ||
    !ownedDatabase ||
    connection.db !== ownedDatabase
  ) {
    throw new Error(
      "Refusing cleanup: disposable test database is not connected",
    );
  }

  // Remove documents while preserving collections and indexes.
  for (const collection of Object.values(connection.collections)) {
    await collection.deleteMany({});
  }
}
