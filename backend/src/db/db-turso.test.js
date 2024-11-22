import { dbTurso } from "./db-turso.js";
import { DBInterface } from "./db-interface.js";
import { test, expect, beforeEach, afterEach } from "vitest";

let db;

beforeEach(async () => {
  db = new dbTurso(":memory:", "authToken");
  await db.createTables();
});

afterEach(async () => {
  await db.closeDbConnection();
});

test("should implement all methods from DBInterface", () => {
  const methods = Object.getOwnPropertyNames(DBInterface.prototype).filter(
    (method) => method !== "constructor"
  );

  methods.forEach((method) => {
    expect(typeof db[method]).toBe("function");
  });
});

test("should insert and retrieve a user by email", async () => {
  const email = "test@example.com";
  const pass = "password123";
  const userId = await db.insertUser(email, pass);
  expect(userId).toBeGreaterThan(0);

  const user = await db.getUserByEmail(email);
  expect(user).toEqual({ id: userId, email, pass });
});

test("should update user password", async () => {
  const email = "test@example.com";
  const pass = "password123";
  await db.insertUser(email, pass);

  const newPass = "newpassword456";
  const result = await db.updateUser(email, newPass);
  expect(result).toBe(true);

  const user = await db.getUserByEmail(email);
  expect(user.pass).toBe(newPass);
});

test("should delete a user", async () => {
  const email = "test@example.com";
  const pass = "password123";
  await db.insertUser(email, pass);

  const result = await db.deleteUser(email);
  expect(result).toBe(true);

  const user = await db.getUserByEmail(email);
  expect(user).toBeNull();
});

test("should add and check denied token", async () => {
  const token = "token123";
  const expiration = Date.now() + 10000;
  const result = await db.addToDenyList(token, expiration);
  expect(result).toBe(true);

  const isDenied = await db.isDeniedToken(token);
  expect(isDenied).toBe(true);
});

test("should add and retrieve visit history", async () => {
  const email = "test@example.com";
  const pass = "password123";
  const userId = await db.insertUser(email, pass);

  const result = await db.addVisit(userId);
  expect(result).toBe(true);

  const visits = await db.getVisits(userId);
  expect(visits.length).toBe(1);
  expect(visits[0].user_id).toBe(userId);
});
