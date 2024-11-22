import { genAccessToken } from "../util-auth.js";
import { db } from "../global-store.js";
import { jwtVerify } from "jose";
// eslint-disable-next-line no-unused-vars
import * as types from "../types.js";
import { config } from "../config.js";

/**
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export async function handleRefreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token." });
  }

  let isDenied = await db.isDeniedToken(refreshToken);
  if (isDenied) {
    return res.status(401).json({ error: "Refresh token denied." });
  }

  try {
    let response = await jwtVerify(refreshToken, config.REFRESH_SECRET_KEY);
    if (!response) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = await genAccessToken(
      /**@type {types.TokenPayload} */ (response.payload),
      config.ACCESS_SECRET_KEY
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ error: `Invalid refresh token. ${error}` });
  }
}
