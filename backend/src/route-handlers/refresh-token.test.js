import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { apiEP } from "../endpoints.js";
import { configServer } from "../server.js";
import { handleRefreshToken } from "./refresh-token.js";

import { db } from "../global-store.js";
import { jwtVerify } from "jose";
import { genAccessToken } from "../util-auth.js";

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      isDeniedToken: vi.fn(),
    },
  };
});

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));

vi.mock("../util-auth.js", () => ({
  genAccessToken: vi.fn(),
}));

const app = configServer();

app.post(apiEP.REFRESH, handleRefreshToken);

describe("Refresh Token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Should return 401 if no refresh token provided", async () => {
    const response = await request(app).post(apiEP.REFRESH).send();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "No refresh token." });
  });

  it("Should return 401 if refresh token is denied", async () => {
    // @ts-ignore
    db.isDeniedToken.mockResolvedValue(true);

    const response = await request(app)
      .post(apiEP.REFRESH)
      .set("Cookie", "refreshToken=mocktoken")
      .send();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Refresh token denied." });
  });

  it("Should return 401 if refresh token is invalid", async () => {
    // @ts-ignore
    db.isDeniedToken.mockResolvedValue(false);
    // @ts-ignore
    jwtVerify.mockRejectedValue(new Error("Invalid token"));

    const response = await request(app)
      .post(apiEP.REFRESH)
      .set("Cookie", "refreshToken=mocktoken")
      .send();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "Invalid refresh token. Error: Invalid token",
    });
  });

  it("Should return 200 and new access token if refresh token is valid", async () => {
    // @ts-ignore
    db.isDeniedToken.mockResolvedValue(false);
    // @ts-ignore
    jwtVerify.mockResolvedValue({ payload: { userId: 1 } });
    // @ts-ignore
    genAccessToken.mockResolvedValue("new-access-token");

    const response = await request(app)
      .post(apiEP.REFRESH)
      .set("Cookie", "refreshToken=mocktoken")
      .send();
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ accessToken: "new-access-token" });
  });
});
