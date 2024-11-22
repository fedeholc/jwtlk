/* eslint-disable no-unused-vars */

/**
 * Databae interface to be implemented by the adapters.
 * @class
 * @abstract
 */
export class DBInterface {
  constructor() {
    if (new.target === DBInterface) {
      throw new TypeError("Cannot construct DBInterface instances directly");
    }
  }

  /**
   * @param {string} token
   * @param {number} expiration
   */
  addToDenyList(token, expiration) {
    throw new Error("The method 'addToDenyList()' must be implemented");
  }

  closeDbConnection() {
    throw new Error("The method 'closeDbConnection()' must be implemented");
  }

  createTables() {
    throw new Error("The method 'createTables()' must be implemented");
  }

  /**
   * @param {string} email
   */
  deleteUser(email) {
    throw new Error("The method 'deleteUser()' must be implemented");
  }

  /**
   * @param {string} email
   */
  getUserByEmail(email) {
    throw new Error("The method 'getUserByEmail()' must be implemented");
  }

  /**
   * @param {string} email
   * @param {string} pass
   */
  insertUser(email, pass) {
    throw new Error("The method 'insertUser()' must be implemented");
  }

  /**
   * @param {string} token
   */
  isDeniedToken(token) {
    throw new Error("The method 'isDeniedToken()' must be implemented");
  }

  /**
   * @param {string} email
   * @param {string} pass
   */
  updateUser(email, pass) {
    throw new Error("The method 'updateUser()' must be implemented");
  }
}
