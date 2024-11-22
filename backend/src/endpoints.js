export { dbURI, apiURL, apiBase, apiEP, gitHubEP, googleEP };
import { config } from "./config.js";

const ENV = config.NODE_ENV;

const dbURIs = {
  production: config.DB_PROD_URI,
  development: config.DB_DEV_URI,
  test: config.DB_TEST_URI,
};
const dbURI = dbURIs[ENV];

const apiBase = {
  development: `http://127.0.0.1:${config.PORT}`,
  test: `http://127.0.0.1:${config.PORT}`,
  production: "https://api.example.com",
};

const apiEP = {
  AUTH_GITHUB: "/auth/github",
  AUTH_GITHUB_CALLBACK: "/auth/github/callback",
  AUTH_GOOGLE: "/auth/google",
  AUTH_GOOGLE_CALLBACK: "/auth/google/callback",
  CHANGE_PASS: "/change-pass",
  DELETE_USER: "/delete",
  LOGIN: "/login",
  LOGOUT: "/logout",
  PROFILE: "/profile",
  REGISTER: "/register",
  REFRESH: "/refresh-token",
  RESET_PASS: "/reset-password",
  ROOT: "/",
  USER_INFO: "/user-info",
  ADD_VISIT: "/add-visit",
  GET_VISITS: "/get-visits",
};

const apiURL = {
  BASE: apiBase[ENV],
  AUTH_GITHUB: apiBase[ENV] + apiEP.AUTH_GITHUB,
  AUTH_GITHUB_CALLBACK: apiBase[ENV] + apiEP.AUTH_GITHUB_CALLBACK,
  AUTH_GOOGLE: apiBase[ENV] + apiEP.AUTH_GOOGLE,
  AUTH_GOOGLE_CALLBACK: apiBase[ENV] + apiEP.AUTH_GOOGLE_CALLBACK,
  CHANGE_PASS: apiBase[ENV] + apiEP.CHANGE_PASS,
  DELETE_USER: apiBase[ENV] + apiEP.DELETE_USER,
  LOGIN: apiBase[ENV] + apiEP.LOGIN,
  LOGOUT: apiBase[ENV] + apiEP.LOGOUT,
  PROFILE: apiBase[ENV] + apiEP.PROFILE,
  REGISTER: apiBase[ENV] + apiEP.REGISTER,
  REFRESH: apiBase[ENV] + apiEP.REFRESH,
  RESET_PASS: apiBase[ENV] + apiEP.RESET_PASS,
  ROOT: apiBase[ENV] + apiEP.ROOT,
  USER_INFO: apiBase[ENV] + apiEP.USER_INFO,
  ADD_VISIT: apiBase[ENV] + apiEP.ADD_VISIT,
  GET_VISITS: apiBase[ENV] + apiEP.GET_VISITS,
};

const gitHubEP = {
  AUTHORIZE: "https://github.com/login/oauth/authorize",
  ACCESS_TOKEN: "https://github.com/login/oauth/access_token",
  USER: "https://api.github.com/user",
};

const googleEP = {
  AUTHORIZE: "https://accounts.google.com/o/oauth2/auth",
  ACCESS_TOKEN: "https://oauth2.googleapis.com/token",
  USER: "https://www.googleapis.com/oauth2/v3/userinfo",
};
