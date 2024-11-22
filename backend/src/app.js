import { extractToken, verifyAccessToken } from "./middleware.js";
import {
  handleAuthGitHub,
  handleAuthGitHubCallback,
} from "./route-handlers/auth-github.js";
import {
  handleAuthGoogle,
  handleAuthGoogleCallback,
} from "./route-handlers/auth-google.js";
import { handleLogOut } from "./route-handlers/logout.js";
import { handleRegister } from "./route-handlers/register.js";
import { apiEP } from "./endpoints.js";
import { configServer } from "./server.js";
import { handleDeleteUser } from "./route-handlers/delete.js";
import { handleResetPass } from "./route-handlers/reset-pass.js";
import { handleChangePass } from "./route-handlers/change-pass.js";
import { db } from "./global-store.js";
import { handleLogin } from "./route-handlers/login.js";
import { handleRefreshToken } from "./route-handlers/refresh-token.js";
import handleAddVisit from "./route-handlers/add-visit.js";
import handleGetVisits from "./route-handlers/get-visits.js";

import { config } from "./config.js";

db.createTables();

export const app = configServer();

app.get(apiEP.AUTH_GITHUB, handleAuthGitHub);
app.get(apiEP.AUTH_GITHUB_CALLBACK, handleAuthGitHubCallback);
app.get(apiEP.AUTH_GOOGLE, handleAuthGoogle);
app.get(apiEP.AUTH_GOOGLE_CALLBACK, handleAuthGoogleCallback);

app.post(apiEP.REGISTER, handleRegister);
app.post(apiEP.LOGIN, handleLogin);
app.get(apiEP.LOGOUT, handleLogOut);
app.delete(apiEP.DELETE_USER, handleDeleteUser);
app.post(apiEP.REFRESH, handleRefreshToken);

app.post(apiEP.RESET_PASS, handleResetPass);
app.post(apiEP.CHANGE_PASS, handleChangePass);

app.post(
  apiEP.ADD_VISIT,
  extractToken,
  verifyAccessToken(config.ACCESS_SECRET_KEY),
  handleAddVisit
);

app.get(
  apiEP.GET_VISITS,
  extractToken,
  verifyAccessToken(config.ACCESS_SECRET_KEY),
  handleGetVisits
);

app.get("*", (req, res) => {
  res.status(404).send("404 - Oops! Page not found");
});

app.listen(config.PORT, () =>
  console.log(`Server running on port ${config.PORT}`)
);
