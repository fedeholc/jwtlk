import { hashPassword } from "../util-auth.js";
import { db } from "../global-store.js";
import { jwtVerify } from "jose";
import { config } from "../config.js";

 
/**
 * @param {import('express').Request } req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export async function handleDeleteUser(req, res) {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({ error: "All fields are required." });
    }

    let userResponse = await db.getUserByEmail(email);
    if (!userResponse) {
      return res.status(404).json({ error: "User not found." });
    }

    if (hashPassword(pass) !== userResponse.pass) {
      return res.status(401).json({ error: "Invalid password." });
    }

    await db.deleteUser(email);

    // add refresh token to deny list
    const decoded = await jwtVerify(
      req.cookies.refreshToken,
      config.REFRESH_SECRET_KEY
    );

    db.addToDenyList(req.cookies.refreshToken, decoded.payload.exp * 1000);

    //logout user and clear cookies
    Object.keys(req.cookies).forEach((cookie) => {
      res.clearCookie(cookie);
    });

    return res.status(204).end();
  } catch (error) {
    return res.status(500).json({ error: `Error deleting user: ${error}` });
  }
}
