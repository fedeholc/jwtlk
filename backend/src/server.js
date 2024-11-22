import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";

export function configServer() {
  const app = express();

  app.use(express.json()); // It is used to parse the data coming from the request body to JSON and can be accessed with req

  app.use(cookieParser()); // It is used to parse the cookies that come in the request (in a single string) and can be accessed with req.cookies

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests without origin (e.g., local files)
        if (!origin) {
          return callback(null, true);
        }
        if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
          return callback(null, true);
        } else {
          return callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true, // Allow cookies
    })
  );

  return app;
}
