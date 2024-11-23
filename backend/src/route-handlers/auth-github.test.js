import { expect, test, describe, vi, beforeEach } from "vitest";
import request from "supertest";
import { apiEP, gitHubEP, apiURL } from "../endpoints.js";
import { handleAuthGitHub, handleAuthGitHubCallback } from "./auth-github.js";
import { configServer } from "../server.js";
import { genRefreshToken } from "../util-auth.js";
import { MockAgent, setGlobalDispatcher } from "undici";
import { db } from "../global-store.js";
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

const clientID = config.GITHUB_CLIENT_ID;

const redirectURI = apiURL.AUTH_GITHUB_CALLBACK;
const githubAuthURL = `${gitHubEP.AUTHORIZE}?client_id=${clientID}&scope=user:email&redirect_uri=${redirectURI}`;

const app = configServer();

app.get(apiEP.AUTH_GITHUB, handleAuthGitHub);
app.get(apiEP.AUTH_GITHUB_CALLBACK, handleAuthGitHubCallback);

describe("Auth Github EP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should return 200 and GH auth URL", async () => {
    const response = await request(app).get(apiEP.AUTH_GITHUB).send();
    expect(response.status).toBe(200);
    expect(response.body.ghauth).toEqual(githubAuthURL);
  });
});

describe("Auth Github Callback EP ", () => {
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
    const res = await request(app).get(apiEP.AUTH_GITHUB_CALLBACK).send();
    expect(res.status).toBe(500);
    expect(res.text).toBe("No authorization code received");
  });

  test("should redirect (302) and set a refresh token cookie", async () => {
    const githubMock = mockAgent.get("https://github.com");
    githubMock
      .intercept({
        path: "/login/oauth/access_token",
        method: "POST",
      })
      .reply(200, { access_token: "test-token" });

    const apiMock = mockAgent.get("https://api.github.com");
    apiMock
      .intercept({
        path: "/user",
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
      .get(apiEP.AUTH_GITHUB_CALLBACK)
      .query({ code: mockCode });

    expect(response.status).toBe(302);

    expect(response.headers["set-cookie"][0]).toContain(
      "refreshToken=test-refresh-token"
    );
  });
});
