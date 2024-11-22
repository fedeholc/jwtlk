import sqlite3 from "sqlite3";
import { DBInterface } from "./db-interface.js";

/**
 * @extends {DBInterface}
 */
export class dbSqlite3 extends DBInterface {
  /**
   * @param {string} dbURI - Database URI
   */
  constructor(dbURI) {
    super();

    /** @type {string} */
    this.dbURI = dbURI;

    /** @type {sqlite3.Database} */
    this.db = null;

    this.#init();
  }

  /**
   * Get the database instance
   * @param {string} dbURI - Database URI
   * @returns {sqlite3.Database} - Database instance
   */
  #getDbInstance(dbURI) {
    if (this.db) {
      return this.db; // Returns the instance if it already exists
    }
    try {
      let instance = new sqlite3.Database(dbURI);
      return instance;
    } catch (error) {
      console.error("Error creating database", error);
      throw error;
    }
  }

  #init() {
    this.db = this.#getDbInstance(this.dbURI);
  }

  /**
   * Adds a token and the expiration date to in the denied list so that once the
   * expiration date has passed the token can be deleted from the list (as it
   * is no longer valid)
   * @param {string} token - Token to add
   * @param {number} expiration - Token expiration
   * @returns {Promise<boolean>} - True if the token was added, false otherwise
   */
  async addToDenyList(token, expiration) {

    if (!token || !expiration) {
      throw new Error("Token and expiration are required");
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        "SELECT token FROM denylist WHERE token = ?",
        token,
        (error, row) => {
          if (error) {
            console.error("Error checking denied list", error);
            reject(error);
          }
          if (row) {
            resolve(true);
          }
        }
      );

      this.db.run(
        "INSERT INTO denylist (token, expiration) VALUES (?, ?)",
        [token, expiration],
        (error) => {
          if (error) {
            console.error("Error adding token to denylist", error);
            reject(error);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Closes the connection with the database
   * @returns {Promise<boolean>} - True if the connection was closed
   * successfully.
   */
  async closeDbConnection() {
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) {
          console.error("Error closing the database:", error.message);
          reject(error);
        } else {
          console.log("Database connection closed");
          resolve(true);
        }
      });
    });
  }

  /**
   * Adds a new visit record to the history for a given user.
   * @param {number} userId - The ID of the user for whom the visit is being
   * recorded.
   * @returns {Promise<boolean>} - Resolves to true if the visit was added
   * successfully, otherwise rejects with an error.
   */
  async addVisit(userId) {
    if (!userId) {
      throw new Error("UserId is required");
    }
    return new Promise((resolve, reject) => {
      let dateTime = Date.now().toString();

      this.db.run(
        "INSERT INTO history (date, user_id) VALUES (?, ?)",
        [dateTime, userId],
        (error) => {
          if (error) {
            console.error("Error adding visit", error);
            reject(error);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Get all visits history of a user
   * @param {number} userId - The user ID
   * @returns {Promise<{date: string, user_id: number}[]>} - The visits history
   */
  async getVisits(userId) {
    if (!userId) {
      throw new Error("UserId is required");
    }
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM history WHERE user_id = ?",
        [userId],
        (error, rows) => {
          if (error) {
            console.error("Error getting visits", error);
            reject(error);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * Create the tables in the database
   * @returns {Promise<boolean>} - True if the tables were created, false
   * otherwise
   */
  async createTables() {
    console.log("this.db", this.db);
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(
          `CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            pass TEXT NOT NULL
          )`,
          (error) => {
            if (error) {
              console.error("Error creating 'user' table:", error.message);
              reject(error);
              return;
            } else {
              console.log("'user' table created");
            }
          }
        );

        this.db.run(
          `CREATE TABLE IF NOT EXISTS history (
              date TEXT NOT NULL,
              user_id INTEGER,
              FOREIGN KEY (user_id) REFERENCES user(id)
          )`,
          (error) => {
            if (error) {
              console.error("Error creating 'history' table:", error.message);
              reject(error);
              return;
            } else {
              console.log("'history' table created");
            }
          }
        );

        this.db.run(
          `CREATE TABLE IF NOT EXISTS denylist (
            token TEXT PRIMARY KEY,
            expiration INTEGER
          )`,
          (error) => {
            if (error) {
              console.error("Error creating 'denylist' table:", error.message);
              reject(error);
            } else {
              console.log("'denylist' table created");
              resolve(true);
            }
          }
        );
      });
    });
  }

  /**
   * Delete a user from the database
   * @param {string} email - User email
   * @returns {Promise<boolean>} - True if the user was deleted successfully.
   */
  async deleteUser(email) {
    if (!email) {
      throw new Error("Email is required");
    }
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM user WHERE email = ?", email, (error) => {
        if (error) {
          console.error("Error deleting user", error);
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * @typedef {object} User
   * @property {number} id
   * @property {string} email
   * @property {string} pass
   */

  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<User | null >} - User object or null if not found
   */
  async getUserByEmail(email) {
    if (!email) {
      throw new Error("Email is required");
    }
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM user WHERE email = ?", email, (error, row) => {
        if (error) {
          console.error("Error getting user by email: ", error);
          reject(error);
        }
        resolve(row);
      });
    });
  }

  /**
   * Insert a user into the database
   * @param {string} email - User email
   * @param {string} pass - User password
   * @returns {Promise<number>} - User ID or error
   */
  async insertUser(email, pass) {
    if (!email || !pass) {
      throw new Error("Email and pass are required");
    }

    // The promise callback has to be an arrow function so that this.lastID
    // points to the object with the database and not to the callback
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO user (email, pass) VALUES (?, ?)",
        [email, pass],
        function (error) {
          if (error) {
            console.error("Error inserting user", error);
            reject(error);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Check if a token is in the denylist
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} - True if the token is in the denylist, false
   * otherwise
   */
  async isDeniedToken(token) {
    if (!token) {
      throw new Error("Token is required");
    }
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT token FROM denylist WHERE token = ?",
        [token],
        (error, row) => {
          if (error) {
            console.error("Error getting denied token", error);
            reject(error);
          }
          if (row) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      );
    });
  }

  /**
   * Update the user password
   * @param {string} email - User email
   * @param {string} pass - User password
   * @returns {Promise<boolean> } - True if the user was updated successfully.
   */
  async updateUser(email, pass) {
    if (!email || !pass) {
      throw new Error("Email and password are required");
    }
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE user SET pass = ? WHERE email = ?",
        [pass, email],
        (error) => {
          if (error) {
            console.error("Error updating user", error);
            reject(error);
          } else {
            resolve(true);
          }
        }
      );
    });
  }
}
