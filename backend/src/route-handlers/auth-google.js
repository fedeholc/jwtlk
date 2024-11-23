import crypto from "node:crypto";
import { apiURL, googleEP } from "../endpoints.js";
import { hashPassword, genRefreshToken } from "../util-auth.js";
import { refreshCookieOptions } from "../global-store.js";
// eslint-disable-next-line no-unused-vars
import * as types from "../types.js";
import { config } from "../config.js";
import { db } from "../global-store.js";

const clientID = config.GOOGLE_CLIENT_ID;
const clientSecret = config.GOOGLE_CLIENT_SECRET;
const redirectURI = apiURL.AUTH_GOOGLE_CALLBACK;

/**
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export function handleAuthGoogle(req, res) {
  const googleAuthURL = `${googleEP.AUTHORIZE}?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&scope=email profile`;
  res.status(200).json({ gauth: googleAuthURL });
}

/**
 * @param {import('express').Request & {query: {code: string}}} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export async function handleAuthGoogleCallback(req, res) {
  try {
    const googleCode = req.query.code;

    if (!googleCode) {
      return res.status(500).send("No authorization code received");
    }

    // Request access token from Google
    const gResponse = await fetch(googleEP.ACCESS_TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        code: googleCode,
        redirect_uri: redirectURI,
        grant_type: "authorization_code",
      }),
    });

    if (!gResponse.ok) {
      return res
        .status(500)
        .send(
          `Error obtaining access token from Google: ${gResponse.statusText}`
        );
    }

    const { access_token: gAccessToken } = await gResponse.json();
    if (!gAccessToken) {
      return res.status(500).send("No access token received from Google");
    }

    // Request Google user data
    const gUserResponse = await fetch(
      `${googleEP.USER}?access_token=${gAccessToken}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${gAccessToken}`,
        },
      }
    );

    const gUserData = await gUserResponse.json();
    if (!gUserResponse.ok || !gUserData || !gUserData.email) {
      return res
        .status(500)
        .send(
          `Error obtaining user data from Google: ${gUserResponse.statusText}`
        );
    }

    /**@type {types.UserPayload & {pass: string}} */
    let userInDB = await db.getUserByEmail(gUserData.email);

    /**@type {types.UserPayload} */
    let tokenUser;

    if (!userInDB) {
      const id = await db.insertUser(
        gUserData.email,
        // Generate a random password for the user
        hashPassword(crypto.randomBytes(8).toString("hex"))
      );
      tokenUser = { id: id, email: gUserData.email };
    } else {
      tokenUser = userInDB;
    }

    const refreshToken = await genRefreshToken(
      { user: tokenUser, rememberMe: true },
      config.REFRESH_SECRET_KEY
    );

    res.cookie("refreshToken", refreshToken, refreshCookieOptions.remember);

    let returnTo = req.cookies.returnCookie;

    res.redirect(returnTo);
  } catch (error) {
    console.error("Error during Google authentication", error);
    res.status(500).send(error.message || "Authentication failed");
  }
}
