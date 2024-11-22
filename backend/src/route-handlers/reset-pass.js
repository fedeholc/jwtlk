import nodemailer from "nodemailer";
import crypto from "node:crypto";
import { resetCookieOptions } from "../global-store.js";
import { config } from "../config.js";
import { db } from "../global-store.js";

/**
 * @param {import('express').Request  } req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
export async function handleResetPass(req, res) {
  try {
    if (!req.body.email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await db.getUserByEmail(req.body.email);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    let resetCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const mailOptions = {
      from: config.GMAIL_USER,
      to: user.email,
      subject: "Reset your password",
      text: `Your reset code is: ${resetCode}`,
    };
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.GMAIL_USER,
        pass: config.GMAIL_PASS,
      },
    });
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending email: ", error);
        return res.status(500).json({ error: "Failed to send email." });
      }
    });

    res.cookie("resetCookie", resetCode, resetCookieOptions);

    return res.status(200).json({ message: "Email sent." });
  } catch (error) {
    console.error("Error in handleResetPass", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
