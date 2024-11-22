import { hashPassword, genAccessToken, genRefreshToken } from "../util-auth.js";
import { refreshCookieOptions } from "../global-store.js";
import { config } from "../config.js";
import { db } from "../global-store.js";

/**
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export async function handleLogin(req, res) {
  try {
    const { pass, email, rememberMe } = req.body;
    const userInDB = await db.getUserByEmail(email);
    if (
      userInDB &&
      email === userInDB.email &&
      hashPassword(pass) === userInDB.pass
    ) {
      const accessToken = await genAccessToken(
        {
          user: { id: userInDB.id, email: userInDB.email },
          rememberMe: rememberMe,
        },
        config.ACCESS_SECRET_KEY
      );

      //A new refresh token is generated every time a user logs in.
      //If the user already had a refresh token, they would have been logged in
      // automatically
      const refreshToken = await genRefreshToken(
        {
          user: { id: userInDB.id, email: userInDB.email },
          rememberMe: rememberMe,
        },
        config.REFRESH_SECRET_KEY
      );

      let cookieOptions = rememberMe
        ? refreshCookieOptions.remember
        : refreshCookieOptions.noRemember;

      res.cookie("refreshToken", refreshToken, cookieOptions);

      return res.status(200).json({
        accessToken: accessToken,
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ error: `Error logging in user: ${error}` });
  }
}
