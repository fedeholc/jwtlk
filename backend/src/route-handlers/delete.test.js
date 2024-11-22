import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { apiEP } from "../endpoints.js";
import { configServer } from "../server.js";
import { handleDeleteUser } from "./delete.js";
import { db } from "../global-store.js";
import { jwtVerify } from "jose";
import { hashPassword } from "../util-auth.js";

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      getUserByEmail: vi.fn(),
      deleteUser: vi.fn(),
      addToDenyList: vi.fn(),
    },
  };
});

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));
vi.mock("../util-auth.js", () => ({
  hashPassword: vi.fn(),
}));

const app = configServer();

app.delete(apiEP.DELETE_USER, handleDeleteUser);

describe("Delete user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should return 400 if email or password is missing", async () => {
    const response = await request(app).delete(apiEP.DELETE_USER).send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All fields are required." });
  });

  it("Should return 404 if user is not found", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(null);

    const response = await request(app)
      .delete(apiEP.DELETE_USER)
      .send({ email: "mockemail", pass: "mockpass" });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "User not found." });
  });

  it("Should return 401 if password is incorrect", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({
      email: "mockemail",
      pass: "wrongpass",
    });

    const response = await request(app)
      .delete(apiEP.DELETE_USER)
      .send({ email: "mockemail", pass: "mockpass" });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid password." });
  });

  it("Should return 500 if there is an error deleting the user", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({
      email: "mockemail",
      pass: "mockpass",
    });

    // @ts-ignore
    hashPassword.mockReturnValue("mockpass");

    // @ts-ignore
    db.deleteUser.mockImplementation(() => {
      throw new Error();
    });

    const response = await request(app)
      .delete(apiEP.DELETE_USER)
      .send({ email: "mockemail", pass: "mockpass" });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Error deleting user: Error" });
  });

  it("Should return 204 if user is successfully deleted", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({
      email: "mockemail",
      pass: "mockpass",
    });
    // @ts-ignore
    db.deleteUser.mockResolvedValue(true);
    // @ts-ignore
    jwtVerify.mockResolvedValue({ payload: { exp: 1234567890 } });

    const response = await request(app)
      .delete(apiEP.DELETE_USER)
      .set("Cookie", "refreshToken=test-refresh-token")
      .send({ email: "mockemail", pass: "mockpass" });

    expect(response.status).toBe(204);
    expect(db.addToDenyList).toHaveBeenCalledWith(
      "test-refresh-token",
      1234567890 * 1000
    );
  });

  it("Should return 500 on internal server error", async () => {
    // @ts-ignore
    db.getUserByEmail.mockRejectedValue(new Error("Internal server error"));

    const response = await request(app)
      .delete(apiEP.DELETE_USER)
      .send({ email: "mockemail", pass: "mockpass" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error deleting user: Error: Internal server error",
    });
  });
});
