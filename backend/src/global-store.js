import { dbSqlite3 } from "./db/db-sqlite.js";
import { dbTurso } from "./db/db-turso.js";
import { dbURI } from "./endpoints.js";
import { config } from "./config.js";

// I use a conditional expression to instantiate the database adapter that
// will be used, because if instead of doing that I call a function that returns
// the configuration, a problem occurs: when importing db in other modules, the
// initialization function was not called and db is not defined. Another option
// would be to have a function to initialize the adapter and db, and call it
// before importing db:
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
export const resetCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: resetExpirationTime, //1m
};
