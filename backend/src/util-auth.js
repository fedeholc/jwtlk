export { genAccessToken, genRefreshToken, hashPassword, isValidUserEmail };
import Joi from "joi";
import { SignJWT } from "jose";
import crypto from "node:crypto";
import { accessJWTExpiration, refreshJWTExpiration } from "./global-store.js";
// eslint-disable-next-line no-unused-vars
import * as types from "./types.js";

/**
 * Function to generate the access token
 * @param {types.TokenPayload} payload - Information to be included in the token
 * @param {Uint8Array} accessSecretKey - Secret key to sign the token
 * @returns {Promise<string>} - token
 */
async function genAccessToken(payload, accessSecretKey) {
  let expirationTime = accessJWTExpiration.noRemember;
  if (payload.rememberMe) {
    expirationTime = accessJWTExpiration.remember;
  }

  const newAccessToken = new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(accessSecretKey);
  return newAccessToken;
}

/**
 * Function to generate the refresh token
 * @param {types.TokenPayload} payload - Information to be included in the token
 * @param {Uint8Array} refreshSecretKey - Secret key to sign the token
 * @returns string - token
 */
async function genRefreshToken(payload, refreshSecretKey) {
  let expirationTime = refreshJWTExpiration.noRemember;
  if (payload.rememberMe) {
    expirationTime = refreshJWTExpiration.remember;
  }
  
  const newRefreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(refreshSecretKey);

    return newRefreshToken;
}

/**
 * Function to hash the password
 * @param {string} password
 * @returns {string} - hashed password
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Function to validate the user email address. Verifies if it is a valid email
 * and if it has a maximum of 254 characters. The option { tlds: { allow:
 * false } } allows any top-level domain (TLD).
 * @param {string} email - email to validate
 * @returns {boolean} - true if the username is valid, false otherwise
 */
function isValidUserEmail(email) {
  const schema = Joi.string()
    .email({ tlds: { allow: false } })
    .max(254);
  const { error } = schema.validate(email);
  return !error;
}
