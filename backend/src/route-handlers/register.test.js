import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { apiEP } from "../endpoints.js";
import { configServer } from "../server.js";
import { handleRegister } from "./register.js";
import { db } from "../global-store.js";
import { hashPassword, genAccessToken, genRefreshToken, isValidUserEmail } from "../util-auth.js";

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      getUserByEmail: vi.fn(),
      insertUser: vi.fn(),
    },
  };
});

vi.mock("../util-auth.js", () => ({
  hashPassword: vi.fn(),
  genAccessToken: vi.fn(),
  genRefreshToken: vi.fn(),
  isValidUserEmail: vi.fn(),
}));

const app = configServer();

app.post(apiEP.REGISTER, handleRegister);

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should return 400 if no email or password provided", async () => {
    const response = await request(app).post(apiEP.REGISTER).send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "All fields are required." });
  });

  it("Should return 409 if user already exists", async () => {
    // @ts-ignore
    isValidUserEmail.mockReturnValue(true);
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({ email: "test@example.com" });

    const response = await request(app)
      .post(apiEP.REGISTER)
      .send({ email: "test@example.com", pass: "password" });
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "User or email already exist." });
  });

  it("Should return 200 and tokens if registration is successful", async () => {
    // @ts-ignore
    isValidUserEmail.mockReturnValue(true);
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(null);
    // @ts-ignore
    db.insertUser.mockResolvedValue(1);
    // @ts-ignore
    hashPassword.mockReturnValue("hashedpassword");
    // @ts-ignore
    genAccessToken.mockResolvedValue("access-token");
    // @ts-ignore
    genRefreshToken.mockResolvedValue("refresh-token");

    const response = await request(app)
      .post(apiEP.REGISTER)
      .send({ email: "test@example.com", pass: "password" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ accessToken: "access-token" });
    expect(response.headers["set-cookie"][0]).toContain(
      "refreshToken=refresh-token"
    );
  });

  it("Should return 500 on internal server error", async () => {
    // @ts-ignore
    isValidUserEmail.mockReturnValue(true);
    // @ts-ignore
    db.getUserByEmail.mockRejectedValue(new Error("Internal server error"));

    const response = await request(app)
      .post(apiEP.REGISTER)
      .send({ email: "test@example.com", pass: "password" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "Error registering user: Error: Internal server error",
    });
  });
});
