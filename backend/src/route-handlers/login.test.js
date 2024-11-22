import { expect, test, describe, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { hashPassword, genAccessToken, genRefreshToken } from "../util-auth.js";
import { handleLogin } from "./login.js";
import { db } from "../global-store.js";
import { apiEP } from "../endpoints.js";
import { config } from "../config.js";

vi.mock("../util-auth", () => ({
  hashPassword: vi.fn(),
  genAccessToken: vi.fn(),
  genRefreshToken: vi.fn(),
}));

vi.mock("../global-store", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    // @ts-ignore
    ...actual,

    db: {
      getUserByEmail: vi.fn(),
    },
  };
});

vi.mock("../config.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    //@ts-ignore
    ...actual,
    ACCESS_SECRET_KEY: vi.fn(),
    REFRESH_SECRET_KEY: vi.fn()
  };
});

const app = express();
app.use(express.json());

app.post(apiEP.LOGIN, handleLogin);

describe("Login Endpoint (mocked)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return 200 and token for valid credentials", async () => {
    const mockUser = {
      id: 1,
      email: "test@example.com",
      pass: "hashedpassword",
    };

    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(mockUser);
    // @ts-ignore
    hashPassword.mockReturnValue("hashedpassword");
    // @ts-ignore
    genAccessToken.mockResolvedValue("mocked-token");
    // @ts-ignore
    genRefreshToken.mockResolvedValue("mocked-token");

    const response = await request(app).post("/login").send({
      pass: "password123",
      email: "test@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      accessToken: "mocked-token",
    });
    expect(db.getUserByEmail).toHaveBeenCalledWith("test@example.com");
    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(genAccessToken).toHaveBeenCalledWith(
      {
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      },
      config.ACCESS_SECRET_KEY
    );
    expect(genRefreshToken).toHaveBeenCalledWith(
      {
        user: {
          id: mockUser.id,
          email: mockUser.email,
        },
      },
      config.REFRESH_SECRET_KEY
    );
  });

  test("should return 401 for invalid username", async () => {
    const mockUser = {
      user: "correctuser",
      pass: "hashedpassword",
    };

    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(mockUser);
    // @ts-ignore
    hashPassword.mockReturnValue("hashedpassword");

    const response = await request(app).post("/login").send({
      user: "wronguser",
      pass: "password123",
      email: "test@example.com",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials" });
  });

  test("should return 401 for invalid password", async () => {
    const mockUser = {
      user: "testuser",
      pass: "correcthashedpassword",
    };

    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(mockUser);
    // @ts-ignore
    hashPassword.mockReturnValue("wronghashedpassword");

    const response = await request(app).post("/login").send({
      user: "testuser",
      pass: "wrongpassword",
      email: "test@example.com",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials" });
  });

  test("should handle case when user is not found", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(null);

    const response = await request(app).post("/login").send({
      user: "nonexistentuser",
      pass: "password123",
      email: "nonexistent@example.com",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid credentials" });
  });
});
