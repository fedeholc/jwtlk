import process from "process";
import { styleText } from "node:util";
import { Buffer } from "node:buffer";

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: (process.env.PORT && parseInt(process.env.PORT)) || 1234,
  ALLOWED_ORIGINS: getAllowedOrigins(),
  ACCESS_SECRET_KEY: getAccessKey(),
  REFRESH_SECRET_KEY: getRefreshKey(),
  DB_ADAPTER: getDbAdapter(),
  DB_DEV_URI: process.env.DB_DEV_URI || "mydb-dev.sqlite",
  DB_PROD_URI: process.env.DB_PROD_URI || "mydb-prod.sqlite",
  DB_TEST_URI: process.env.DB_TEST_URI || "mydb-test.sqlite",
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASS: process.env.GMAIL_PASS,
};

checkNodeEnv();
checkPort();
checkGoogleAuth();
checkGitHubAuth();
checkGmail();
checkDB();

//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//- Functions to check the environment variables and  - - - - -
//- set the initial configuration.  - - - - - - - - - - - - - -
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function checkNodeEnv() {
  if (!process.env.NODE_ENV) {
    console.log(
      styleText("yellow", `>> NODE_ENV not found in .env. Using default.`)
    );
  }
  console.log(styleText("green", `>> NODE_ENV: ${config.NODE_ENV}`));
}

function checkPort() {
  if (!process.env.PORT) {
    console.log(
      styleText("yellow", `>> PORT not found in .env. Using default.`)
    );
  }
  console.log(styleText("green", `>> PORT: ${config.PORT}`));
}

function checkGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log(
      styleText(
        "yellow",
        `>> GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in .env. Authentication with Google will not work.`
      )
    );
  } else {
    console.log(
      styleText("green", `>> GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET found.`)
    );
  }
}

function checkGitHubAuth() {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.log(
      styleText(
        "yellow",
        `>> GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not found in .env. Authentication with GitHub will not work.`
      )
    );
  } else {
    console.log(
      styleText("green", `>> GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET found.`)
    );
  }
}

function checkGmail() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log(
      styleText(
        "yellow",
        `>> GMAIL_USER or GMAIL_PASS not found in .env. Sending emails will not work.`
      )
    );
  } else {
    console.log(styleText("green", `>> GMAIL_USER and GMAIL_PASS found.`));
  }
}

function checkDB() {
  if (config.DB_ADAPTER === "sqlite3") {
    if (!process.env.DB_DEV_URI) {
      console.log(
        styleText("yellow", `>> DB_DEV_URI not found in .env. Using default.`)
      );
    }
    console.log(styleText("green", `>> DB_DEV_URI: ${config.DB_DEV_URI}`));

    if (!process.env.DB_PROD_URI) {
      console.log(
        styleText("yellow", `>> DB_PROD_URI not found in .env. Using default.`)
      );
    }
    console.log(styleText("green", `>> DB_PROD_URI: ${config.DB_PROD_URI}`));

    if (!process.env.DB_TEST_URI) {
      console.log(
        styleText("yellow", `>> DB_TEST_URI not found in .env. Using default.`)
      );
    }
    console.log(styleText("green", `>> DB_TEST_URI: ${config.DB_TEST_URI}`));
  }

  if (config.DB_ADAPTER === "turso") {
    if (!process.env.TURSO_DATABASE_URL) {
      console.log(
        styleText(
          ["red", "bgWhite"],
          `>> TURSO_DATABASE_URL not found in .env. You must provide it to use Turso as your DB_ADAPTER.`
        )
      );
      process.exit(1);
    }

    if (!process.env.TURSO_AUTH_TOKEN) {
      console.log(
        styleText(
          ["red", "bgWhite"],
          `>> TURSO_AUTH_TOKEN not found in .env. You must provide it to use Turso as your DB_ADAPTER.`
        )
      );
      process.exit(1);
    }
  }
}

function getDbAdapter() {
  if (!process.env.DB_ADAPTER) {
    console.log(
      styleText("yellow", `>> DB_ADAPTER not found in .env. Using default.`)
    );
    console.log(styleText("green", `>> DB_ADAPTER: sqlite3`));
    return "sqlite3";
  }
  if (process.env.DB_ADAPTER === "sqlite3") {
    console.log(styleText("green", `>> DB_ADAPTER: sqlite3`));
    return "sqlite3";
  }
  if (process.env.DB_ADAPTER === "turso") {
    console.log(styleText("green", `>> DB_ADAPTER: turso`));
    return "turso";
  }

  console.log(
    styleText(
      ["red", "bgWhite"],
      `>> El DB_ADAPTER ${process.env.DB_ADAPTER} no es válido. Utilice 'sqlite3' o 'turso'.`
    )
  );
  process.exit(1);
}

function getAllowedOrigins() {
  if (!process.env.ALLOWED_ORIGINS) {
    console.log(
      styleText(
        "yellow",
        `>> ALLOWED_ORIGINS not found in .env. Using default.`
      )
    );
    return ["http://127.0.0.1:8080", "http://localhost:8080"];
  }
  const origins = process.env.ALLOWED_ORIGINS.split(",");
  console.log(styleText("green", `>> ALLOWED_ORIGINS: ${origins}`));
  return origins;
}

/**
 * Retrieves the access secret key from the environment variables or uses
 * a default key.
 * @returns {Uint8Array} The access secret key as a Uint8Array.
 */
function getAccessKey() {
  const defaultAccessSecretKey = new Uint8Array([
    67, 244, 60, 38, 250, 245, 166, 210, 23, 32, 189, 99, 84, 215, 248, 171, 39,
    248, 170, 104, 87, 33, 21, 59, 58, 199, 43, 138, 105, 46, 38, 22,
  ]);

  /** @type {Uint8Array} */
  let accessSecretKey;

  if (process.env.ACCESS_SECRET_KEY) {
    try {
      // Decode the key in Base64 from the .env file
      const decodedKey = Buffer.from(process.env.ACCESS_SECRET_KEY, "base64");
      accessSecretKey = new Uint8Array(decodedKey);

      // Validate that the key has the expected length (32 bytes)
      if (accessSecretKey.length !== 32) {
        throw new Error("Access secret key is not 32 bytes long.");
      }

      console.log(styleText("green", ">> Using .env Access Secret Key."));
      return accessSecretKey;
    } catch (error) {
      console.error("Invalid Access secret key in .env:", error.message);
      console.log(styleText("yellow", ">> Using default Access Secret Key."));
      return defaultAccessSecretKey;
    }
  } else {
    console.log(styleText("yellow", ">> No Access secret key."));
    console.log(styleText("yellow", ">> Using default Access Secret Key."));
    return defaultAccessSecretKey;
  }
}

/**
 * Retrieves the refresh secret key from the environment variables.
 * If the key is not found or is invalid, a default key is used.
 *
 * @returns {Uint8Array} The refresh secret key as a Uint8Array.
 */
function getRefreshKey() {
  const defaultRefreshSecretKey = new Uint8Array([
    204, 226, 162, 31, 67, 182, 253, 137, 221, 158, 67, 73, 91, 95, 223, 177,
    82, 185, 96, 159, 136, 117, 213, 17, 196, 109, 140, 255, 31, 83, 160, 166,
  ]);

  /** @type {Uint8Array} */
  let refreshSecretKey;

  if (process.env.REFRESH_SECRET_KEY) {
    try {
      // Decode the key in Base64 from the .env file
      const decodedKey = Buffer.from(process.env.REFRESH_SECRET_KEY, "base64");
      refreshSecretKey = new Uint8Array(decodedKey);

      // Validate that the key has the expected length (32 bytes)
      if (refreshSecretKey.length !== 32) {
        throw new Error("Refresh secret key is not 32 bytes long.");
      }

      console.log(styleText("green", ">> Using .env Refresh Secret Key."));
      return refreshSecretKey;
    } catch (error) {
      console.error("Invalid Refresh secret key in .env:", error.message);
      console.log(styleText("yellow", ">> Using default Refresh Secret Key."));
      return defaultRefreshSecretKey;
    }
  } else {
    console.log(styleText("yellow", ">> No Refresh secret key."));
    console.log(styleText("yellow", ">> Using default Refresh Secret Key."));
    return defaultRefreshSecretKey;
  }
}
