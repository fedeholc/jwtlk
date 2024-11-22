import { dbSqlite3 } from "./db-sqlite.js";
import { DBInterface } from "./db-interface.js";
import { test, expect, beforeEach, afterEach } from "vitest";


//TODO: faltan los tests para los casos en los que debe fallar (ej, no se puede insertar un usuario con un email que ya existe, agregar un token repetido a la denylist -vacío-)

let db;

beforeEach(async () => {
  db = new dbSqlite3(":memory:");
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
  expect(user).toBeUndefined();
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
