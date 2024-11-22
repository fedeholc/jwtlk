/**
 * Tested functions:
 * - auth.getNewAccessToken
 * - auth.getAccessToken
 * - auth.isTokenExpired
 * - auth.decodeTokenPayload
 * - auth.decodeUserFromToken
 * - auth.decodeTokenHeader
 * - auth.validateRegisterInputs
 * - auth.registerNewUser
 * - auth.addVisit
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { auth } from "./auth.js";
import { apiURL } from "./endpoints-front.js";

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store = {};
  return {
    /**
     * @param {string | number} key
     */
    getItem(key) {
      return store[key] || null;
    },
    /**
     * @param {string | number} key
     * @param {any} value
     */
    setItem(key, value) {
      store[key] = value;
    },
    clear() {
      store = {};
    },
  };
})();

// Assign localStorageMock to global.localStorage
// @ts-ignore
globalThis.localStorage = localStorageMock;

afterEach(() => {
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

/**
 * Tests for auth.getNewAccessToken
 */
describe("getNewAccessToken function", () => {
  it("should return the access token when the response is successful and contains accessToken", async () => {
    const mockAccessToken = "mockToken123";

    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: mockAccessToken }),
      })
    );

    // @ts-ignore
    const result = await auth.getNewAccessToken();
    expect(result).toBe(mockAccessToken);
  });

  it("should return null when the response does not contain accessToken", async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );

    // @ts-ignore
    const result = await auth.getNewAccessToken();
    expect(result).toBeNull();
  });

  it("should return null when fetch throws an error", async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error("Fetch failed")));

    const result = await auth.getNewAccessToken();
    expect(result).toBeNull();
  });

  it("should make fetch with 'credentials: include'", async () => {
    const mockAccessToken = "mockToken123";

    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ accessToken: mockAccessToken }),
      })
    );

    await auth.getNewAccessToken();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });
});

/**
 * Tests for auth.isTokenExpired
 */
describe("isTokenExpired function", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  /**
   * Helper function to generate a test token
   * @param {number} expirationTime
   */
  function generateToken(expirationTime) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ exp: expirationTime }));
    const signature = "fake-signature";
    return `${header}.${payload}.${signature}`;
  }

  it("should return true for a null token", () => {
    expect(auth.isTokenExpired(null)).toBe(true);
  });

  it("should return true for an undefined token", () => {
    expect(auth.isTokenExpired(undefined)).toBe(true);
  });

  it("should return true for an empty string token", () => {
    expect(auth.isTokenExpired("")).toBe(true);
  });

  it("should return true for an expired token", () => {
    const expiredToken = generateToken(Math.floor(Date.now() / 1000) - 3600); // Token expired 1 hour ago
    expect(auth.isTokenExpired(expiredToken)).toBe(true);
  });

  it("should return false for a valid token", () => {
    const validToken = generateToken(Math.floor(Date.now() / 1000) + 3600); // Token expires 1 hour from now
    expect(auth.isTokenExpired(validToken)).toBe(false);
  });

  it("should return true for a malformed token", () => {
    const malformedToken = "not.a.valid.token";
    expect(auth.isTokenExpired(malformedToken)).toBe(true);
  });

  it("should log an error for a malformed token", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const malformedToken = "not.a.valid.token";
    auth.isTokenExpired(malformedToken);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error decoding token: ",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});

/**
 * Tests for auth.getAccessToken
 */
describe("getAccessToken function", () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    vi.resetModules();
  });

  it("should return access token if it exists and is not expired", async () => {
    const mockToken = "mockToken";
    localStorage.setItem("accessToken", JSON.stringify(mockToken));
    vi.spyOn(auth, "isTokenExpired").mockReturnValue(true);
    vi.spyOn(auth, "getNewAccessToken").mockResolvedValue(mockToken);
    const result = await auth.getAccessToken();
    expect(result).toBe(mockToken);
    expect(auth.isTokenExpired).toHaveBeenCalledWith(mockToken);
  });

  it("should return new access token if the existing token is expired", async () => {
    const mockToken = "mockToken";
    const newToken = "newMockToken";
    localStorage.setItem("accessToken", JSON.stringify(mockToken));
    vi.spyOn(auth, "isTokenExpired").mockReturnValue(true);
    vi.spyOn(auth, "getNewAccessToken").mockResolvedValue(newToken);
    const result = await auth.getAccessToken();
    expect(result).toBe(newToken);
    expect(localStorage.getItem("accessToken")).toBe(JSON.stringify(newToken));
    expect(auth.isTokenExpired).toHaveBeenCalledWith(mockToken);
    expect(auth.getNewAccessToken).toHaveBeenCalled();
  });

  it("should return null if no new access token is received", async () => {
    const mockToken = "mockToken";
    localStorage.setItem("accessToken", JSON.stringify(mockToken));
    vi.spyOn(auth, "isTokenExpired").mockImplementation(() => true);
    vi.spyOn(auth, "getNewAccessToken").mockResolvedValue(null);
    const result = await auth.getAccessToken();
    expect(result).toBeNull();
    expect(localStorage.getItem("accessToken")).toBe(JSON.stringify(mockToken));
    expect(auth.getNewAccessToken).toHaveBeenCalled();
  });

  it("should return null if localStorage has no access token", async () => {
    vi.spyOn(auth, "getNewAccessToken").mockResolvedValue(null);
    const result = await auth.getAccessToken();
    expect(result).toBeNull();

    expect(auth.getNewAccessToken).toHaveBeenCalled();
  });

  it("should handle errors gracefully and return null", async () => {
    localStorage.setItem("accessToken", "{invalidJson");
    const result = await auth.getAccessToken();
    expect(result).toBeNull();
  });
});

/**
 * Tests for auth.decodeTokenPayload
 */
describe("decodeTokenPayload function", () => {
  it("should return null with an empty token", () => {
    expect(auth.decodeTokenPayload("")).toBeNull();
  });

  it("should return null with a non-string token", () => {
    // @ts-ignore
    expect(auth.decodeTokenPayload(123)).toBeNull();
  });

  it("should return null with a token that has an invalid Base64URL part", () => {
    const token = "invalid.base64.url";
    expect(auth.decodeTokenPayload(token)).toBeNull();
  });

  it("should return null with a token that has an invalid JSON payload", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-json-payload";
    expect(auth.decodeTokenPayload(token)).toBeNull();
  });

  it("should return the decoded user data with a valid JWT token", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const expectedUserData = {
      sub: "1234567890",
      name: "John Doe",
      iat: 1516239022,
    };
    expect(auth.decodeTokenPayload(token)).toEqual(expectedUserData);
  });

  it("should log an error message with an invalid JWT token", () => {
    const token = "invalid-token";
    vi.spyOn(console, "error");
    auth.decodeTokenPayload(token);
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

/**
 * Tests for auth.decodeUserFromToken
 */
describe("decodeUserFromToken function", () => {
  it("should return null if no access token is provided", () => {
    const result = auth.decodeUserFromToken(null);
    expect(result).toBeNull();
  });

  it("should return null if the access token is empty", () => {
    const result = auth.decodeUserFromToken("");
    expect(result).toBeNull();
  });

  it("should return null if the decoded token payload is missing the user data", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const result = auth.decodeUserFromToken(token);
    expect(result).toBeNull();
  });

  it("should return the decoded user data if the access token is valid", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJlbWFpbCI6ImZlZGVyaWNvaG9sY0BnbWFpbC5jb20ifSwicmVtZW1iZXJNZSI6dHJ1ZSwiaWF0IjoxNzMwNjMzNjAxLCJleHAiOjE3MzA2MzcyMDF9.RtXGQrJT1LqZCIVu8uTxLylAM0UBaTpjK4DVjMqeiw0";
    const expectedUserData = {
      id: 1,
      email: "federicoholc@gmail.com",
    };
    const result = auth.decodeUserFromToken(token);
    expect(result).toEqual(expectedUserData);
  });
});

/**
 * Tests for auth.decodeTokenHeader
 */
describe("decodeTokenHeader function", () => {
  beforeEach(() => {
    vi.spyOn(console, "error");
  });

  afterEach(() => {
    // @ts-ignore
    console.error.mockRestore();
  });

  it("should return the decoded header object with a valid JWT token", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const expectedHeader = { alg: "HS256", typ: "JWT" };
    expect(auth.decodeTokenHeader(token)).toEqual(expectedHeader);
  });

  it("should return null with an empty token", () => {
    const token = "";
    expect(auth.decodeTokenHeader(token)).toBeNull();
  });

  it("should return null with a non-string token", () => {
    const token = 123;
    // @ts-ignore
    expect(auth.decodeTokenHeader(token)).toBeNull();
  });

  it("should log an error message with an invalid JWT token", () => {
    const token = "invalid-token";
    auth.decodeTokenHeader(token);
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

/**
 * Tests for auth.validateRegisterInputs
 */
describe("validateRegisterInputs function", () => {
  it("should return error for empty input fields", () => {
    const email = { value: "" };
    const password = { value: "" };
    const confirmPassword = { value: "" };
    const result = auth.validateRegisterInputs(
      /**@type {HTMLInputElement}*/ (email),
      /**@type {HTMLInputElement}*/ (password),
      /**@type {HTMLInputElement}*/ (confirmPassword)
    );
    expect(result.error).toBe("Please fill in all fields.");
    expect(result.isValidInput).toBe(false);
  });

  it("should return error for password and confirm password mismatch", () => {
    const email = { value: "test@example.com" };
    const password = { value: "password" };
    const confirmPassword = { value: "wrongpassword" };
    const result = auth.validateRegisterInputs(
      /**@type {HTMLInputElement}*/ (email),
      /**@type {HTMLInputElement}*/ (password),
      /**@type {HTMLInputElement}*/ (confirmPassword)
    );
    expect(result.error).toBe("Passwords don't match.");
    expect(result.isValidInput).toBe(false);
  });

  it("should return error for invalid email address", () => {
    const email = { value: "invalid-email", validity: { valid: false } };
    const password = { value: "password" };
    const confirmPassword = { value: "password" };
    const result = auth.validateRegisterInputs(
      /**@type {HTMLInputElement}*/ (email),
      /**@type {HTMLInputElement}*/ (password),
      /**@type {HTMLInputElement}*/ (confirmPassword)
    );
    expect(result.error).toBe("Enter a valid email.");
    expect(result.isValidInput).toBe(false);
  });

  it("should return error for password length less than 3 characters", () => {
    const email = { value: "test@example.com", validity: { valid: true } };
    const password = { value: "ab" };
    const confirmPassword = { value: "ab" };
    const result = auth.validateRegisterInputs(
      /**@type {HTMLInputElement}*/ (email),
      /**@type {HTMLInputElement}*/ (password),
      /**@type {HTMLInputElement}*/ (confirmPassword)
    );
    expect(result.error).toBe("Password must be at least 3 characters long.");
    expect(result.isValidInput).toBe(false);
  });

  it("should return no error for valid input fields", () => {
    const email = { value: "test@example.com", validity: { valid: true } };
    const password = { value: "password123" };
    const confirmPassword = { value: "password123" };
    const result = auth.validateRegisterInputs(
      /**@type {HTMLInputElement}*/ (email),
      /**@type {HTMLInputElement}*/ (password),
      /**@type {HTMLInputElement}*/ (confirmPassword)
    );
    expect(result.error).toBe(null);
    expect(result.isValidInput).toBe(true);
  });
});

/**
 * Tests for auth.registerNewUser function
 */
describe("registerNewUser function", () => {
  const mockEmail = "test@example.com";
  const mockPassword = "password123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an error if email or password is missing", async () => {
    const result = await auth.registerNewUser("", mockPassword);
    expect(result).toEqual({
      accessToken: null,
      error: "Invalid email or password",
    });

    const result2 = await auth.registerNewUser(mockEmail, "");
    expect(result2).toEqual({
      accessToken: null,
      error: "Invalid email or password",
    });
  });

  it("should return access token if registration is successful", async () => {
    const mockAccessToken = "mockAccessToken123";
    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: mockAccessToken }),
      })
    );

    const result = await auth.registerNewUser(mockEmail, mockPassword);
    expect(result).toEqual({ accessToken: mockAccessToken, error: null });
  });

  it("should return an error if registration response is not ok", async () => {
    const mockError = "User already exists";
    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({ error: mockError }),
      })
    );
    const result = await auth.registerNewUser(mockEmail, mockPassword);
    expect(result).toEqual({
      accessToken: null,
      error: `Error signing up user: ${mockError}`,
    });
  });

  it("should return an error if no access token is received", async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );

    const result = await auth.registerNewUser(mockEmail, mockPassword);
    expect(result).toEqual({
      accessToken: null,
      error: `Error signing up user: undefined`,
    });
  });

  it("should handle fetch errors gracefully", async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(() => Promise.reject(new Error("Fetch failed")));

    const result = await auth.registerNewUser(mockEmail, mockPassword);
    expect(result).toEqual({
      accessToken: null,
      error: `Error signing up user: Error: Fetch failed`,
    });
  });
});

/**
 * Tests for auth.addVisit function
 */
describe("addVisit function", () => {
  const mockAccessToken = "mockAccessToken";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null if no access token is provided", async () => {
    const result = await auth.addVisit(null);
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith("No access token found.");
  });

  it("should return true if the visit is added successfully", async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );

    const result = await auth.addVisit(mockAccessToken);
    expect(result).toBe(true);
  });

  it("should return null if the response is not ok", async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () => Promise.resolve({}),
      })
    );

    const result = await auth.addVisit(mockAccessToken);
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      `Error adding visit. Response error. 400 Bad Request`
    );
  });

  it("should handle fetch errors gracefully", async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(() => Promise.reject(new Error("Fetch failed")));

    const result = await auth.addVisit(mockAccessToken);
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "Error adding visit: ",
      expect.any(Error)
    );
  });

  it("should make fetch with correct headers", async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    );

    await auth.addVisit(mockAccessToken);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiURL.ADD_VISIT,
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer " + mockAccessToken,
          "Content-Type": "application/json",
        },
      })
    );
  });
});
