import { describe, it, expect, vi } from "vitest";
import request from "supertest"; //https://github.com/ladjs/supertest
import { apiEP } from "../endpoints.js";
import { configServer } from "../server.js";
import { handleResetPass } from "./reset-pass.js";
import { db } from "../global-store.js";

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      getUserByEmail: vi.fn(),
    },
  };
});

const app = configServer();

app.post(apiEP.RESET_PASS, handleResetPass);

describe("Reset password", () => {
  it("Should return 400 if no email provided", async () => {
    const response = await request(app)
      .post(apiEP.RESET_PASS)
      .send({ email: "" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is required." });
  });

  it("Should return 404 if user not found", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post(apiEP.RESET_PASS)
      .send({ email: "mockemail" });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "User not found." });
  });

  it("Should return 200 if user is found", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({ email: "mockemail" });

    const response = await request(app)
      .post(apiEP.RESET_PASS)
      .send({ email: "mockemail" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Email sent." });
  });

  it("Should send a cookie called resetCookie, with httpOnly and SameSite strict attributes", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({ email: "mockemail" });

    const response = await request(app)
      .post(apiEP.RESET_PASS)
      .send({ email: "mockemail" });
    expect(response.headers["set-cookie"][0]).toContain("resetCookie=");
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"][0]).toContain("SameSite=Strict");
  });

  it("should return 500 on internal server error", async () => {
    // @ts-ignore
    db.getUserByEmail.mockRejectedValue(new Error("Internal server error"));
    const response = await request(app)
      .post(apiEP.RESET_PASS)
      .send({ email: "test@example.com" });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });
});
