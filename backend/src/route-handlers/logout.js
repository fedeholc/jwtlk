import { jwtVerify } from "jose";
import { config } from "../config.js";
import { db } from "../global-store.js";

/**
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export async function handleLogOut(req, res) {
  try {
    const decoded = await jwtVerify(
      req.cookies.refreshToken,
      config.REFRESH_SECRET_KEY
    );
   
    // We add the expiration date to the denied list so that once the 
    // expiration date has passed the token can be deleted from the list
    // (as it is no longer valid)
    // the expiration date is multiplied by 1000 to convert it to milliseconds
    db.addToDenyList(req.cookies.refreshToken, decoded.payload.exp * 1000);

    Object.keys(req.cookies).forEach((cookie) => {
      res.clearCookie(cookie);
    });

    res.status(200).send("ok");
  } catch (error) {
    console.error("Error during logout", error);
    res.status(500).send("Error during logout");
  }
}
