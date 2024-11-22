import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";

export function configServer() {
  const app = express();

  app.use(express.json()); //sirve para hacer que los datos que vienen en el body de la request sean parseados a JSON y se puedan acceder con req.body

  app.use(cookieParser()); //sirve para parsear las cookies que vienen en la request (en un solo string) y se pueden acceder con req.cookies

  app.use(
    cors({
      origin: function (origin, callback) {
        // Permitir solicitudes sin origen (por ejemplo, archivos locales)
        if (!origin) {
          return callback(null, true);
        }
        if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
          return callback(null, true);
        } else {
          return callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true, // Permite enviar cookies y credenciales
    })
  );

  return app;
}
