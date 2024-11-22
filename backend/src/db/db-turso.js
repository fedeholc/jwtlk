import { createClient } from "@libsql/client";
import { DBInterface } from "./db-interface.js";

/**
 * @extends {DBInterface}
 */
export class dbTurso extends DBInterface {
  /**
   * @param {string} dbURI - Database URI
   * @param {string} authToken - Turso auth token
   */
  constructor(dbURI, authToken) {
    super();
    this.db = null;
    this.dbURI = dbURI;
    this.authToken = authToken;
    this.#init();
  }

  /**
   * Initialize the database
   */
  #init() {
    this.db = this.#getDbInstance(this.dbURI, this.authToken);
    console.log("DB turso", this.db, this.dbURI);
  }

  /**
   * Get the database instance
   * @param {string} dbURI - Database URI
   * @param {string} authToken - Auth token
   * @returns {import('@libsql/client').Client} - Database instance
   */
  #getDbInstance(dbURI, authToken) {
    if (this.db) {
      return this.db; // Returns the instance if it already exists
    }
    let tursoDb = createClient({ url: dbURI, authToken: authToken });
    return tursoDb;
  }

  /**
   * Insert a user into the database
   * @param {string} email - User email
   * @param {string} pass - User password
   * @returns {Promise<number>} - User ID
   */
  async insertUser(email, pass) {
    if (!email || !pass) {
      throw new Error("Email and pass are required");
    }
    try {
      const result = await this.db.execute({
        sql: "INSERT INTO user (email, pass) VALUES (?,?)",
        args: [email, pass],
      });
      return Number(result.lastInsertRowid);
    } catch (error) {
      console.error(error);
      throw error;
    }
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
   * @returns {Promise<User| null>} - User object or null if not found
   */
  async getUserByEmail(email) {
    if (!email) {
      throw new Error("Email is required");
    }
    try {
      const result = await this.db.execute({
        sql: "SELECT * FROM user WHERE email = ?",
        args: [email],
      });
      if (!result.rows.length) {
        return null;
      }

      let user = /** @type {User} user */ (
        /** @type {unknown} */ (result.rows[0])
      );
      return user;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Delete a user from the database
   * @param {string} email - User email
   * @returns {Promise<boolean>} - True if the user was deleted
   */
  async deleteUser(email) {
    if (!email) {
      throw new Error("Email is required");
    }
    try {
      const result = await this.db.execute({
        sql: "DELETE FROM user WHERE email = ?",
        args: [email],
      });

      return result.rowsAffected > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Update the user password
   * @param {string} email
   * @param {string} pass
   * @returns {Promise<boolean>} - True if the user was updated
   */
  async updateUser(email, pass) {
    if (!email || !pass) {
      throw new Error("Email and pass are required");
    }
    try {
      const result = await this.db.execute({
        sql: "UPDATE user SET pass = ? WHERE email = ?",
        args: [pass, email],
      });
      return result.rowsAffected > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Close the connection with the database
   * @returns {boolean} - True if the connection was closed successfully
   */
  closeDbConnection() {
    try {
      this.db.close();
      console.log("Database connection closed");
      return true;
    } catch (error) {
      console.error("Error closing the database:", error.message);
      throw error;
    }
  }

  /**
   * Adds a new visit to the database
   * @param {number} userId - The user ID to add the visit to
   * @returns {Promise<boolean>} - True if the visit was added successfully
   */
  async addVisit(userId) {
    if (!userId) {
      throw new Error("UserId is required");
    }
    try {
      const result = await this.db.execute({
        sql: "INSERT INTO history (date, user_id) VALUES (?,?)",
        args: [Date.now().toString(), userId],
      });
      return result.rowsAffected > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Gets all visits history of a user
   * @param {number} userId - The user ID
   * @returns {Promise<import("@libsql/client").Row[]>} - The visits history
   */
  async getVisits(userId) {
    if (!userId) {
      throw new Error("UserId is required");
    }
    try {
      const result = await this.db.execute({
        sql: "SELECT * FROM history WHERE user_id = ?",
        args: [userId],
      });
      return result.rows;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Add a token and the expiration date to in the denied list so that once the
   * expiration date has passed the token can be deleted from the list (as it
   * is no longer valid)
   * @param {string} token - Token to add
   * @param {number} expiration - Token expiration
   * @returns {Promise<boolean>} - True if the token was added, false otherwise
   */
  async addToDenyList(token, expiration) {
    if (!token) {
      throw new Error("Token is required");
    }
    if (!expiration) {
      console.error("Expiration is required");
      return null;
    }
    try {
      const result = await this.db.execute({
        sql: "INSERT INTO denylist (token, expiration) VALUES (?,?)",
        args: [token, expiration],
      });
      return result.rowsAffected > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
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
    try {
      const result = await this.db.execute({
        sql: "SELECT * FROM denylist WHERE token = ?",
        args: [token],
      });
      return result.rows.length > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Create the tables in the database
   */
  async createTables() {
    try {
      console.log("this.db turso", this.db);
      this.db.execute({
        sql: `CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            pass TEXT NOT NULL
          )`,
        args: [],
      });

      this.db.execute({
        sql: `CREATE TABLE IF NOT EXISTS history (
            date TEXT NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES user(id)
          )`,
        args: [],
      });

      this.db.execute({
        sql: `CREATE TABLE IF NOT EXISTS denylist (
            token TEXT PRIMARY KEY,
            expiration INTEGER
          )`,
        args: [],
      });
    } catch (error) {
      console.error("Error creating tables", error);
      throw error;
    }
  }
}
