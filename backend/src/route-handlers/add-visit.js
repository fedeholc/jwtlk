import { db } from "../global-store.js";

/**
 * Handles the POST /add-visit route. Adds a visit to the database.
 * @param {import('express').Request } req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export default async function handleAddVisit(req, res) {
  try {
    let result = await db.addVisit(req.body.payload.user.id);
    if (result) {
      res.status(200).send({ success: true });
    } else {
      res.status(500).json("Error adding visit");
    }
  } catch (error) {
    console.error("Error adding visit", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
