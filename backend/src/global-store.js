import { dbSqlite3 } from "./db/db-sqlite.js";
import { dbTurso } from "./db/db-turso.js";
import { dbURI } from "./endpoints.js";
import { config } from "./config.js";

// Acá estoy usando una expresión condicional para instanciar el adaptador de
// base de datos que se va a usar, porque si en lugar de hacer eso llamo a una
// función que me devuelva la configuración, se produce un problema: al
// importar db en otros módulos, la función de inicialización no fue llamada y
// db no está definido. Otra posibilidad sería tener una función para
// inicializar el adaptador y db, y llamarla antes de hacer el import de db:
// import { initializeDB, setDB } from "./global-store.js";
// initializeDB();
// setDB();
// import { db } from "./global-store.js";

let dbAdapters = {
  sqlite3: config?.DB_ADAPTER === "sqlite3" ? new dbSqlite3(dbURI) : null,
  turso:
    config?.TURSO_DATABASE_URL && config?.TURSO_AUTH_TOKEN
      ? new dbTurso(config?.TURSO_DATABASE_URL, config?.TURSO_AUTH_TOKEN)
      : null,
};

/**@type {dbSqlite3 | dbTurso} */
export const db = dbAdapters[config.DB_ADAPTER];

/* export const db = new dbTurso(
  config.TURSO_DATABASE_URL,
  config.TURSO_AUTH_TOKEN
); */

export const accessJWTExpiration = {
  remember: "1h",
  noRemember: "10m",
};

export const refreshJWTExpiration = {
  remember: "30d",
  noRemember: "1h",
};

export const resetExpirationTime = 15 * 60 * 1000; //15m

/** @type {{remember: import('express').CookieOptions, noRemember: import('express').CookieOptions}} */
export const refreshCookieOptions = {
  remember: {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, //30d
  },
  noRemember: {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, //1h,
  },
};

/** @type {import('express').CookieOptions} */
export const returnCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 5 * 60 * 1000, //5m
};

/** @type {import('express').CookieOptions} */
export const resetCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: resetExpirationTime, //1m
};
