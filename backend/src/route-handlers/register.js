import {
  hashPassword,
  genAccessToken,
  genRefreshToken,
  isValidUserEmail,
} from "../util-auth.js";
import { refreshCookieOptions } from "../global-store.js";
import { config } from "../config.js";
import { db } from "../global-store.js";

// eslint-disable-next-line no-unused-vars
import * as types from "../types.js";

/**
 * @param {import('express').Request  } req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export async function handleRegister(req, res) {
  try {
    const { pass, email } = req.body;

    if (!pass || !email) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!isValidUserEmail(email)) {
      return res.status(400).json({ error: "Invalid email." });
    }

    let userInDb = await db.getUserByEmail(email);
    if (userInDb) {
      return res.status(409).json({ error: "User or email already exist." });
    }

    const id = await db.insertUser(email, hashPassword(pass));

    /** @type {types.UserPayload} */
    const user = { id: id, email: email };

    /** @type {types.TokenPayload} */
    const payload = { user: user, rememberMe: false };

    const accessToken = await genAccessToken(payload, config.ACCESS_SECRET_KEY);
    const refreshToken = await genRefreshToken(
      payload,
      config.REFRESH_SECRET_KEY
    );

    res.cookie("refreshToken", refreshToken, refreshCookieOptions.noRemember);

    return res.status(200).json({
      accessToken: accessToken,
    });
  } catch (error) {
    return res.status(500).json({ error: `Error registering user: ${error}` });
  }
}
