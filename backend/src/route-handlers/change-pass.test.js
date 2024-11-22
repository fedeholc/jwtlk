import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { apiEP } from "../endpoints.js";
import { configServer } from "../server.js";
import { handleChangePass } from "./change-pass.js";
import { db } from "../global-store.js";

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      getUserByEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  };
});

const app = configServer();

app.post(apiEP.CHANGE_PASS, handleChangePass);

describe("Change password", () => {
  it("Should return 400 if no code provided", async () => {
    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .send({ code: "" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Code is required" });
  });

  it("Should return 400 if no resetCookie provided", async () => {
    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .send({ code: "mockcode" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "The code is ivalid or it has expired.",
    });
  });

  it("Should return 400 if code does not match resetCookie", async () => {
    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .set("Cookie", "resetCookie=wrongcode")
      .send({ code: "mockcode" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "The entered code is incorrect" });
  });

  it("Should return 400 if no password provided", async () => {
    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .set("Cookie", "resetCookie=mockcode")
      .send({ code: "mockcode" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Password is required" });
  });

  it("Should return 400 if no email provided", async () => {
    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .set("Cookie", "resetCookie=mockcode")
      .send({ code: "mockcode", pass: "newpassword" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is required" });
  });

  it("Should return 404 if user not found", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue(null);

    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .set("Cookie", "resetCookie=mockcode")
      .send({ code: "mockcode", pass: "newpassword", email: "mockemail" });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "User not found" });
  });

  it("Should return 200 if password is successfully updated", async () => {
    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({ email: "mockemail" });
    // @ts-ignore
    db.updateUser.mockResolvedValue(true);

    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .set("Cookie", "resetCookie=mockcode")
      .send({ code: "mockcode", pass: "newpassword", email: "mockemail" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Password updated" });
  });

  it("Should return 500 on internal server error", async () => {
    // @ts-ignore
    db.getUserByEmail.mockRejectedValue(new Error("Internal server error"));
    const response = await request(app)
      .post(apiEP.CHANGE_PASS)
      .set("Cookie", "resetCookie=mockcode")
      .send({
        code: "mockcode",
        pass: "newpassword",
        email: "test@example.com",
      });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Internal server error" });
  });
});
