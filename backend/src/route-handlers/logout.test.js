import { handleLogOut } from "./logout";
import { jwtVerify } from "jose";
import { db } from "../global-store.js";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { config } from "../config";
import request from "supertest";
import { configServer } from "../server.js";
import { apiEP } from "../endpoints.js";

vi.mock("jose");
vi.mock("../global-store.js");
vi.mock("../config");

const app = configServer();
app.post(apiEP.LOGOUT, handleLogOut);

describe("handleLogOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear cookies and respond with 200 on successful logout", async () => {
    const decoded = { payload: { exp: 12345 } };
    // @ts-ignore
    jwtVerify.mockResolvedValue(decoded);

    const response = await request(app)
      .post(apiEP.LOGOUT)
      .set("Cookie", "refreshToken=testRefreshToken");

    expect(jwtVerify).toHaveBeenCalledWith(
      "testRefreshToken",
      config.REFRESH_SECRET_KEY
    );
    expect(db.addToDenyList).toHaveBeenCalledWith("testRefreshToken", 12345000);
    expect(response.status).toBe(200);
    expect(response.text).toBe("ok");
  });

  it("should respond with 500 on error", async () => {
    // @ts-ignore
    jwtVerify.mockRejectedValue(new Error("Invalid token"));

    const response = await request(app)
      .post(apiEP.LOGOUT)
      .set("Cookie", "refreshToken=testRefreshToken");

    expect(jwtVerify).toHaveBeenCalledWith(
      "testRefreshToken",
      config.REFRESH_SECRET_KEY
    );
    expect(response.status).toBe(500);
    expect(response.text).toBe("Error during logout");
  });
});
