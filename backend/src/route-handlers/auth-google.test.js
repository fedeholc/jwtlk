import { expect, test, describe, vi, beforeEach } from "vitest";
import request from "supertest";
import { apiEP, googleEP, apiURL } from "../endpoints.js";
import { configServer } from "../server.js";
import { genRefreshToken } from "../util-auth.js";
import { MockAgent, setGlobalDispatcher } from "undici";
import { db } from "../global-store.js";
import { handleAuthGoogle, handleAuthGoogleCallback } from "./auth-google.js";
import { config } from "../config.js";

vi.mock("../util-auth", () => ({
  hashPassword: vi.fn(),
  genAccessToken: vi.fn(),
  genRefreshToken: vi.fn(),
}));

vi.mock("../global-store.js", async (importOriginal) => {
  /**@type {Object} */
  const actual = await importOriginal();
  return {
    ...actual,
    db: {
      getUserByEmail: vi.fn(),
      insertUser: vi.fn(),
    },
    refreshSecretKey: "test-refresh-secret",
    accessSecretKey: "test-access-secret",
  };
});

const clientID = config.GOOGLE_CLIENT_ID;

const redirectURI = apiURL.AUTH_GOOGLE_CALLBACK;
const googleAuthURL = `${googleEP.AUTHORIZE}?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&scope=email profile`;

const app = configServer();

app.get(apiEP.AUTH_GOOGLE, handleAuthGoogle);
app.get(apiEP.AUTH_GOOGLE_CALLBACK, handleAuthGoogleCallback);

describe("Auth google EP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return 200 and GG auth URL", async () => {
    const response = await request(app).get(apiEP.AUTH_GOOGLE).send();
    expect(response.status).toBe(200);
    expect(response.body.gauth).toEqual(googleAuthURL);
  });
});

describe("Auth google Callback EP", () => {
  let mockAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAgent = new MockAgent();
    mockAgent.disableNetConnect();
    setGlobalDispatcher(mockAgent);
  });

  const mockCode = "test-code";
  const mockEmail = "test@example.com";

  test("should return 500 if no code is provided", async () => {
    const res = await request(app).get(apiEP.AUTH_GOOGLE_CALLBACK).send();
    expect(res.status).toBe(500);
    expect(res.text).toBe("No authorization code received");
  });

  test("should redirect (302) and set a refresh token cookie", async () => {
    const githubMock = mockAgent.get("https://oauth2.googleapis.com");
    githubMock
      .intercept({
        path: "/token",
        method: "POST",
      })
      .reply(200, { access_token: "test-token" });

    const apiMock = mockAgent.get("https://www.googleapis.com");
    apiMock
      .intercept({
        path: "/oauth2/v3/userinfo?access_token=test-token",
        method: "GET",
      })
      .reply(200, { email: mockEmail });

    // @ts-ignore
    db.getUserByEmail.mockResolvedValue({ id: 1, email: mockEmail });
    // @ts-ignore
    db.insertUser.mockResolvedValue(1);
    // @ts-ignore
    genRefreshToken.mockReturnValue("test-refresh-token");

    let response = await request(app)
      .get(apiEP.AUTH_GOOGLE_CALLBACK)
      .query({ code: mockCode });

    expect(response.status).toBe(302);

    expect(response.headers["set-cookie"][0]).toContain(
      "refreshToken=test-refresh-token"
    );
  });
});
