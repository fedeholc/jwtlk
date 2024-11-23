// eslint-disable-next-line no-unused-vars
import * as types from "./types.js";
import { apiURL } from "./endpoints-front.js";

//- - - - - - - - - - - - - - - - - - - - - - - -
//- Authentication functions  - - - - - - - - - -
//- - - - - - - - - - - - - - - - - - - - - - - -

export const auth = {
  getAccessToken,
  getNewAccessToken,
  isTokenExpired,
  decodeUserFromToken,
  decodeTokenPayload,
  decodeTokenHeader,
  validateRegisterInputs,
  registerNewUser,
  addVisit,
};

/**
 * Check if a token is expired.
 * @param {string} token - The JSON Web Token to check.
 * @returns {boolean} - True if the token is expired, false otherwise.
 */
function isTokenExpired(token) {
  try {
    if (!token) return true;
    const decodedToken = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token: ", error);
    return true;
  }
}

/**
 * Retrieves an access token, if it exists and is not expired.
 * If the current access token is expired, it requests a new one and stores
 * it in local storage.
 * @returns {Promise<string | null>} - The access token if exists, or null if
 * not.
 */
async function getAccessToken() {
  try {
    let accessToken = JSON.parse(localStorage.getItem("accessToken"));

    if (accessToken && !this.isTokenExpired(accessToken)) {
      return accessToken;
    }

    let newAccessToken = await this.getNewAccessToken();
    if (newAccessToken) {
      localStorage.setItem("accessToken", JSON.stringify(newAccessToken));
      return newAccessToken;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting access token: ${error}`);
    return null;
  }
}

/**
 * Requests a new access token using the refresh token stored in the HTTP-only
 * cookie. If the response contains an access token, it is returned. Otherwise,
 * null is returned.
 * @returns {Promise<string | null>} - The new access token if the request is
 * successful, or null if not.
 */
async function getNewAccessToken() {
  try {
    const response = await fetch(apiURL.REFRESH, {
      method: "POST",
      credentials: "include", // to send the refresh token cookie
    });
    const data = await response.json();
    if (data.accessToken) {
      return data.accessToken;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching new access token: ${error}`);
    return null;
  }
}

/**
 * Decodes the user information from the provided access token.
 * @param {string} accessToken - The access token containing encoded user data.
 * @returns {types.UserPayload | null} - The decoded user data or null
 * if decoding fails.
 */
export function decodeUserFromToken(accessToken) {
  if (!accessToken) {
    console.error("No token found.");
    return null;
  }

  let decoded = decodeTokenPayload(accessToken);
  if (!decoded?.user) {
    console.error("No user data.");
    return null;
  }

  /** @type {types.UserPayload} */
  let user = decoded.user;
  return user;
}

/**
 * Decodes the payload of the provided token.
 * @param {string} token - The access token containing encoded user data.
 * @returns {types.TokenPayload | null} - The decoded token payload or null if
 * decoding fails.
 */
export function decodeTokenPayload(token) {
  if (!token) {
    console.error("No token found.");
    return null;
  }
  let jsonPayload = null;

  try {
    // Split the token to get the payload
    const base64Url = token.split(".")[1];

    // Decode from Base64URL to Base64 
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Decode from Base64 to JSON
    jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  } catch (error) {
    console.error("Error decoding token: ", error);
    return null;
  }

  /*
  To convert from base64 to JSON, we did the following. First, we converted from Base64 to a text string using atob(base64). This decodes the Base64 to its original binary representation. That binary text could include characters that are not standard ASCII (e.g. "Ç", "¡"), which could be misinterpreted when used. To avoid possible problems with those special characters, we need to:
  - Convert each character to its hexadecimal representation: this is done with c.charCodeAt(0).toString(16), where charCodeAt gets the Unicode code (in decimal format) of each character, and toString(16) converts it to hexadecimal format.
  - Ensure that the hexadecimal value always has two digits: ("00" + ...).slice(-2) adds an initial 0 in case the hexadecimal value is less than 16, ensuring it always has two digits.
  - Add the % prefix: this transforms each character into an escape sequence, like %20 for a space, that decodeURIComponent can interpret correctly.
  - Put it all together: .join("") reassembles the sequence into a string where each special character is represented with an escape code (%xx).
  Finally, decodeURIComponent can interpret these characters safely, decoding the string to a valid JSON representation.

  */

  return JSON.parse(jsonPayload);
}

/**
 * Decodes the header of the provided JWT token.
 * @param {string} token - The JSON Web Token to decode.
 * @returns {object | null} - The decoded header object or null if decoding fails.
 */
function decodeTokenHeader(token) {
  try {
    // Dividir el token en sus tres partes
    const header = token.split(".")[0];

    // Decodificar de Base64 URL a un string JSON
    const headerJson = atob(header.replace(/-/g, "+").replace(/_/g, "/"));

    // Parsear el JSON a un objeto JavaScript
    return JSON.parse(headerJson);
  } catch (error) {
    console.error("Token inválido", error);
    return null;
  }
}

/**
 * Validates the registration inputs for email, password, and confirm password
 * fields.
 * @param {HTMLInputElement} email - The input element for the email address.
 * @param {HTMLInputElement} password - The input element for the password.
 * @param {HTMLInputElement} confirmPassword - The input element for the
 * password confirmation.
 * @returns {{error: string | null, isValidInput: boolean}} - An object
 * containing an error message if validation fails, or null if inputs are
 * valid, and a boolean indicating if the input is valid.
 */
function validateRegisterInputs(email, password, confirmPassword) {
  if (
    email.value === "" ||
    password.value === "" ||
    confirmPassword.value === ""
  ) {
    return { error: "Please fill in all fields.", isValidInput: false };
  }
  if (password.value !== confirmPassword.value) {
    return { error: "Passwords don't match.", isValidInput: false };
  }
  if (!email.validity.valid) {
    return { error: "Enter a valid email.", isValidInput: false };
  }

  // This is just for demonstration purposes, in production you should use more
  // robust validation
  if (password.value.length < 3) {
    return {
      error: "Password must be at least 3 characters long.",
      isValidInput: false,
    };
  }
  return { error: null, isValidInput: true };
}

/**
 * Registers a new user with the backend API.
 * @param {string} email - The email address of the user to register.
 * @param {string} password - The password for the user to register.
 * @returns {Promise<{accessToken: string, error: string | null}>} - A promise
 * that resolves with an object containing the access token for the newly
 * registered user, or an error message if registration fails.
 */
async function registerNewUser(email, password) {
  if (!email || !password) {
    return {
      accessToken: null,
      error: "Invalid email or password",
    };
  }
  try {
    const response = await fetch(apiURL.REGISTER, {
      method: "POST",
      credentials: "include", //to receive the refresh token cookie
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        pass: password,
      }),
    });

    if (!response?.ok) {
      const data = await response.json();
      console.log(
        `Error signing up. Response error. ${response.status} ${response.statusText}`
      );
      return {
        accessToken: null,
        error: `Error signing up user: ${data.error}`,
      };
    }

    const data = await response.json();

    if (!data?.accessToken) {
      console.error(
        `Error signing up. No access token. ${response.status} ${response.statusText}`
      );

      return {
        accessToken: null,
        error: `Error signing up user: ${data.error}`,
      };
    }

    return { accessToken: data.accessToken, error: null };
  } catch (error) {
    console.error("Error signing up: ", error);
    return {
      accessToken: null,
      error: `Error signing up user: ${error}`,
    };
  }
}

/**
 * Adds a new visit to the database.
 * @param {string} accessToken - The user's access token
 * @throws {Error} If there is an error adding the visit
 */
async function addVisit(accessToken) {
  if (!accessToken) {
    console.error("No access token found.");
    return null;
  }

  try {
    const response = await fetch(apiURL.ADD_VISIT, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!response?.ok) {
      console.error(
        `Error adding visit. Response error. ${response?.status ?? "Unknown"} ${
          response?.statusText ?? "Unknown"
        }`
      );
      return null;
    }
    return true;
  } catch (error) {
    console.error("Error adding visit: ", error);
    return null;
  }
}
