export { extractToken, verifyAccessToken };

import { jwtVerify } from "jose";
import * as types from "./types.js";
/**
 *
 * @param {import('express').Request & {token?: string}} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - The next function
 */
function extractToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      req.token = authHeader.split(" ")[1].trim();
      if (!req.token || req.token.trim() === "") {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Internal Server Error: ${error.message}` });
  }
}

/**
 * Middleware to verify the token
 * @param {Uint8Array} accessSecretKey
 * @returns {import('express').RequestHandler}
 */
function verifyAccessToken(accessSecretKey) {
  /**
   * @param {import('express').Request & {token?: string} & {payload: {}}} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - The next function
   */
  async function verify(req, res, next) {
    const token = req.token;
    if (!token) {
      return res.status(401).json({ error: "Token not found." });
    }
    try {
      let response = await jwtVerify(token, accessSecretKey);
      req.body.payload = /** @type {types.TokenPayload} */ (response.payload);
      next();
    } catch (error) {
      return res.status(401).json({ error: `Invalid Token: ${error}` }); //
    }
  }

  return verify;
}
