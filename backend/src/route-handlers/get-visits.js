import { db } from "../global-store.js";

/**
 * @param {import('express').Request } req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export default async function handleGetVisits(req, res) {
  try {
    const visits = await db.getVisits(req.body.payload.user.id);
    res.status(200).send(visits);
  } catch (error) {
    console.error("Error getting visits", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
