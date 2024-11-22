import { describe, it, expect } from "vitest";
import {
  genAccessToken,
  genRefreshToken,
  hashPassword,
  isValidUserEmail,
} from "./util-auth.js";
import crypto from "node:crypto";

describe("genAccessToken", () => {
  it("should generate a valid access token", async () => {
    const payload = { user: { id: 1, email: "123" }, rememberMe: true };
    const accessSecretKey = crypto.randomBytes(32);
    const token = await genAccessToken(payload, accessSecretKey);
    expect(token).toBeTypeOf("string");
  });
});

describe("genRefreshToken", () => {
  it("should generate a valid refresh token", async () => {
    const payload = { user: { id: 1, email: "123" }, rememberMe: false };
    const refreshSecretKey = crypto.randomBytes(32);
    const token = await genRefreshToken(payload, refreshSecretKey);
    expect(token).toBeTypeOf("string");
  });
});

describe("hashPassword", () => {
  it("should hash the password correctly", () => {
    const password = "myPassword";
    const hashedPassword = hashPassword(password);
    const expectedHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    expect(hashedPassword).toBe(expectedHash);
  });
});

describe("isValidUserEmail", () => {
  it("should return true for a valid email", () => {
    const email = "test@example.com";
    const result = isValidUserEmail(email);
    expect(result).toBe(true);
  });

  it("should return false for an invalid email", () => {
    const email = "invalid-email";
    const result = isValidUserEmail(email);
    expect(result).toBe(false);
  });

  it("should return false for an email longer than 254 characters", () => {
    const email = "a".repeat(245) + "@example.com";
    const result = isValidUserEmail(email);
    expect(result).toBe(false);
  });
});
