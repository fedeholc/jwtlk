/**
 * This script generates secret keys for the access and refresh tokens.
 * The keys are generated randomly and printed to the console in two formats:
 * - Uint8Array: suitable for use in the application
 * - Base64: suitable for use in the .env file
 *
 * Run this script with Node.js to generate the keys.
 * Example: `node create-keys.js > keys.txt`
 */
import crypto from "node:crypto";
import { Buffer } from "node:buffer";

function generateBase64Key() {
  const key = new Uint8Array(crypto.randomBytes(32)); 
  const base64Key = Buffer.from(key).toString("base64"); 
  return { key, base64Key };
}

// Generate the access token secret
const { key: accessSecretKey, base64Key: accessBase64Key } =
  generateBase64Key();
console.log("ACCESS TOKEN");
console.log("Secret key in Uint8Array format:", accessSecretKey);
console.log("Secret key in Base64 format (for the .env file):");
console.log("ACCESS_SECRET_KEY=" + accessBase64Key);
console.log("\n");

// Generate the refresh token secret
const { key: refreshSecretKey, base64Key: refreshBase64Key } =
  generateBase64Key();
console.log("REFRESH TOKEN");
console.log("Secret key in Uint8Array format:", refreshSecretKey);
console.log("Secret key in Base64 format (for the .env file):");
console.log("REFRESH_SECRET_KEY=" + refreshBase64Key);
