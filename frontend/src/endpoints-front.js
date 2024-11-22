export { apiURL, apiEP, ENV as env, apiBase };
const apiPort = 1234;
const apiBase = {
  development: `http://127.0.0.1:${apiPort}`,
  production: "https://api.example.com",
};

let ENV;

if (
  typeof window !== "undefined" &&
  window &&
  (window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost")
) {
  ENV = "development";
} else {
  ENV = "production";
}

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
  REFRESH: "/refresh-token",
  REGISTER: "/register",
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
