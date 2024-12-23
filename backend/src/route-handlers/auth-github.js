export { handleAuthGitHub, handleAuthGitHubCallback };
import crypto from "node:crypto";
import { apiURL, gitHubEP } from "../endpoints.js";
import { hashPassword, genRefreshToken } from "../util-auth.js";
import { refreshCookieOptions } from "../global-store.js";
import { db } from "../global-store.js";
// eslint-disable-next-line no-unused-vars
import * as types from "../types.js";
import { config } from "../config.js";

const clientID = config.GITHUB_CLIENT_ID;
const clientSecret = config.GITHUB_CLIENT_SECRET;
const redirectURI = apiURL.AUTH_GITHUB_CALLBACK;

/**
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
function handleAuthGitHub(req, res) {
  const githubAuthURL = `${gitHubEP.AUTHORIZE}?client_id=${clientID}&scope=user:email&redirect_uri=${redirectURI}`;

  res.status(200).json({ ghauth: githubAuthURL });
}

/**
 * @param {import('express').Request & {query: {code: string}}} req - The
 * request object.
 * @param {import('express').Response} res - Express response object.
 */
async function handleAuthGitHubCallback(req, res) {
  try {
    const gitHubCode = req.query.code;
    if (!gitHubCode) {
      return res.status(500).send("No authorization code received");
    }

    // Request access token from GitHub
    const ghResponse = await fetch(gitHubEP.ACCESS_TOKEN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientID,
        client_secret: clientSecret,
        code: gitHubCode,
        redirect_uri: redirectURI,
      }),
    });

    if (!ghResponse.ok) {
      return res
        .status(500)
        .send(
          `Error obtaining access token from GitHub: ${ghResponse.statusText}`
        );
    }

    const { access_token: ghAccessToken } = await ghResponse.json();

    if (!ghAccessToken) {
      return res.status(500).send("No access token received from GitHub");
    }

    // Request GitHub user data
    const ghUserResponse = await fetch(gitHubEP.USER, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ghAccessToken}`,
      },
    });
    const ghUserData = await ghUserResponse.json();

    if (!ghUserResponse.ok || !ghUserData) {
      return res
        .status(500)
        .send(
          `Error obtaining user data from GitHub: ${ghUserResponse.statusText}`
        );
    }

    // if in GitHub settings the email is not set as public
    // it is not possible to access it to register in the application
    if (!ghUserData.email) {
      return res
        .status(500)
        .send(
          `Github did not provide an email address. Probably you have not set it as public in your github settings.`
        );
    }

    /**@type {types.UserPayload & {pass: string}} */
    let userInDB = await db.getUserByEmail(ghUserData.email);

    /**@type {types.UserPayload} */
    let tokenUser;

    if (!userInDB) {
      const id = await db.insertUser(
        ghUserData.email,
        // Generate a random password for the user
        hashPassword(crypto.randomBytes(8).toString("hex"))
      );
      tokenUser = { id: id, email: ghUserData.email };
    } else {
      tokenUser = { id: userInDB.id, email: userInDB.email };
    }

    const refreshToken = await genRefreshToken(
      { user: tokenUser, rememberMe: true },
      config.REFRESH_SECRET_KEY
    );

    res.cookie("refreshToken", refreshToken, refreshCookieOptions.remember);

    let returnTo = req.cookies.returnCookie;
    res.clearCookie("returnCookie");

    res.redirect(returnTo);
  } catch (error) {
    console.error("Error during GitHub authentication", error);
    res.status(500).send(error.message || "Authentication failed");
  }
}
