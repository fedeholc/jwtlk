import { apiURL } from "./endpoints-front.js";
import { cleanInputs, vibrate } from "./util.js";
import { auth } from "./auth.js";
import getDomElementsRefs from "./domElements.js";
// eslint-disable-next-line no-unused-vars
import * as types from "./types.js";

// - - - - - - - - - - - - - - - - - - -
// - Global variables
// - - - - - - - - - - - - - - - - - - -

/** @type {types.UserPayload | null} */
let userData;

let DE;

//- - - - - - - - - - - - - - - - - - -
//- MAIN
//- - - - - - - - - - - - - - - - - - -

document.addEventListener("DOMContentLoaded", main);

async function main() {
  DE = getDomElementsRefs(document);
  setEventListeners();

  let accessToken = await auth.getAccessToken();

  if (accessToken) {
    userData = auth.decodeUserFromToken(accessToken);

    auth.addVisit(accessToken);
  }
  renderUI();
}

//- - - - - - - - - - - - - - - - - - - - - - - -
//- UI functions
//- - - - - - - - - - - - - - - - - - - - - - - -

function renderUI() {
  cleanInputs(document);
  if (userData) {
    //logged in UI
    DE.user.id.textContent = `Id: ${userData.id}`;
    DE.user.email.textContent = `Email: ${userData.email}`;
    DE.login.section.style.display = "none";
    DE.user.section.style.display = "flex";
  } else {
    //logged out UI
    DE.user.id.textContent = `Id: -`;
    DE.user.email.textContent = `Email: -`;
    DE.login.section.style.display = "flex";
    DE.user.section.style.display = "none";
  }
}

/**
 * Function to show error messages and vibrate elements.
 * @param {string} message
 */
function showLoginError(message) {
  DE.login.info.textContent = message;
  vibrate(DE.login.info);
  vibrate(DE.login.passButton);
}

//- - - - - - - - - - - - - - - - - - - - - - - -
//- Handler functions - - - - - - - - - - - - - -
//- - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Handler for the login form submission.
 * @param {Event} event the event to handle
 */
async function handleLogin(event) {
  event.preventDefault();

  /** @type {HTMLInputElement} */
  let inputEmail = document.querySelector("#email");
  /** @type {HTMLInputElement} */
  let inputPassword = document.querySelector("#password");
  /** @type {HTMLInputElement} */
  let inputRememberMe = document.querySelector("#remember-me");

  if (
    !inputEmail.validity.valid ||
    !inputPassword.validity.valid ||
    inputEmail.value === "" ||
    inputPassword.value === ""
  ) {
    showLoginError(`Enter a valid email and password.`);
    return;
  }

  try {
    let response = await fetch(apiURL.LOGIN, {
      method: "POST",
      credentials: "include", //to receive the cookie with the refresh token
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: inputEmail.value,
        pass: inputPassword.value,
        rememberMe: inputRememberMe.checked,
      }),
    });

    if (!response.ok) {
      showLoginError(`Your email or password is incorrect. Try again.`);
      return;
    }

    let data = await response.json();
    userData = auth.decodeUserFromToken(data.accessToken);
    localStorage.setItem("accessToken", JSON.stringify(data.accessToken));
    renderUI();
    return;
  } catch (error) {
    console.error("Login failed:", error);
    showLoginError("Error: login failed.");
  }
}

/**
 * Function to handle the login with GitHub button. Redirects the user to the
 * GitHub authorization page and sets the returnTo parameter in the query string
 * to the current URL, so that after authorization the user is redirected back
 * to this page.
 *
 * @param {Event} event The event that triggered this function.
 * @see https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
 */
async function handleLoginGH(event) {
  event.preventDefault();
  let returnTo = window.location.href;
  try {
    let response = await fetch(apiURL.AUTH_GITHUB + `?returnTo=${returnTo}`, {
      method: "GET",
      credentials: "include", //to send the returnTo cookie
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response?.ok) {
      console.log(
        `Error logging in with GitHub. ${response.status} ${response.statusText}`
      );
      return;
    }
    let data = await response.json();
    window.location.href = data.ghauth;
  } catch (error) {
    showLoginError("Error: login failed.");
    console.error("Login failed:", error);
  }
}

/**
 * Function to handle the login with Google button. Redirects the user to the
 * Google authorization page and sets the returnTo parameter in the query string
 * to the current URL, so that after authorization the user is redirected back
 * to this page.
 *
 * @param {Event} event The event that triggered this function.
 */
async function handleLoginGG(event) {
  try {
    event.preventDefault();
    let returnTo = window.location.href;
    let response = await fetch(apiURL.AUTH_GOOGLE + `?returnTo=${returnTo}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log(
        `Error logging in with Google. ${response.status} ${response.statusText}`
      );
      return;
    }

    let data = await response.json();
    window.location.href = data.gauth;
  } catch (error) {
    showLoginError("Error: login failed.");

    console.error("Login failed:", error);
  }
}

/**
 * Handler for the logout button.
 * Sends a GET request to the logout endpoint and removes the accessToken from
 * localStorage.
 * After a successful logout, it renders the UI again.
 */
async function handleLogOut() {
  try {
    let response = await fetch(apiURL.LOGOUT, {
      method: "GET",
      credentials: "include", //to send the refresh token to be invalidated
    });
    if (!response.ok) {
      console.log(
        `Error logging out. ${response.status} ${response.statusText}`
      );
      return;
    }

    localStorage.removeItem("accessToken");
    userData = null;
    renderUI();
    return;
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

/**
 * Handler for the signup form submission.
 * Validates the input fields, sends a POST request to the register endpoint
 * and stores the accessToken in localStorage.
 * After a successful signup, it renders the UI again and shows a success
 * message. If there was an error, it shows an error message.
 * @param {Event} event the event to handle
 */
async function handleSignUp(event) {
  event.preventDefault();

  /**@type {HTMLInputElement} */
  let inputEmail = document.querySelector("#su-email");

  /**@type {HTMLInputElement} */
  let inputPassword = document.querySelector("#su-password");

  /**@type {HTMLInputElement} */
  let inputConfirmPassword = document.querySelector("#su-confirm-password");

  const { isValidInput, error: validateInputError } =
    auth.validateRegisterInputs(
      inputEmail,
      inputPassword,
      inputConfirmPassword
    );

  if (!isValidInput || validateInputError) {
    DE.signup.info.textContent = validateInputError ?? "Error signing up.";
    vibrate(DE.signup.info);
    vibrate(DE.signup.submitButton);
    return;
  }

  try {
    const { accessToken, error } = await auth.registerNewUser(
      inputEmail.value,
      inputPassword.value
    );

    if (!accessToken || error) {
      DE.signup.info.textContent = error ?? "Error signing up.";
      vibrate(DE.signup.info);
      vibrate(DE.signup.submitButton);
      return;
    }

    userData = auth.decodeUserFromToken(accessToken);
    localStorage.setItem("accessToken", JSON.stringify(accessToken));

    DE.user.display.textContent = `User successfully registered.`;
    DE.user.id.textContent = `Id: ${userData.id}`;
    DE.user.email.textContent = `Email: ${userData.email}`;

    renderUI();

    // depending on the kind of app, here you may change the UI or
    // redirect to another page, eg:
    // window.location.href = "/profile";

    DE.signup.dialog.close();
  } catch (error) {
    console.error("Error signing up:", error);
  }
}

/**
 * Handles the submission of the delete user form.
 * It prevents the default form submission, fetches the delete user endpoint and
 * shows a success message if the user is successfully deleted.
 * If there is an error, it shows an error message.
 * @param {Event} event the event to handle
 */
async function handleDeleteUser(event) {
  event.preventDefault();

  let email = userData.email;
  let inputPassword = /** @type {HTMLInputElement} */ (
    document.getElementById("delete-password")
  );

  try {
    let response = await fetch(apiURL.DELETE_USER, {
      method: "DELETE",
      credentials: "include", //send the refresh token to be invalidated
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, pass: inputPassword.value }),
    });

    if (!response.ok) {
      let data = await response.json();
      DE.delete.info.textContent = `Error deleting user: ${data.error}`;
      vibrate(DE.delete.info);
      vibrate(DE.delete.submitButton);
      return;
    }

    DE.delete.info.textContent = `User successfully deleted.`;
    DE.delete.info.style.color = "green";
    DE.delete.info.style.fontWeight = "bold";

    userData = null;
    localStorage.removeItem("accessToken");

    // show the error message for 2 seconds and then close the dialog
    setTimeout(() => {
      DE.delete.dialog.close();
      renderUI();
    }, 2000);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

/**
 * Handles the submission of the change password form.
 * It prevents the default form submission, fetches the change password endpoint
 * and shows a success message if the password is successfully changed.
 * If there is an error, it shows an error message.
 * @param {Event} event the event to handle
 */
async function handleChangePass(event) {
  event.preventDefault();

  let inputCode = /** @type {HTMLInputElement} */ (
    document.querySelector("#reset-code")
  );
  let inputPassword = /** @type {HTMLInputElement} */ (
    document.querySelector("#reset-password")
  );
  let inputConfirmPass = /** @type {HTMLInputElement} */ (
    document.querySelector("#reset-confirm-password")
  );
  let inputEmail = /** @type {HTMLInputElement} */ (
    document.querySelector("#reset-email")
  );

  if (!inputCode.validity.valid) {
    DE.reset.changeInfo.textContent = `Enter a code with six characters.`;
    vibrate(DE.reset.changeInfo);
    vibrate(DE.reset.changeButton);
    return;
  }

  if (
    inputPassword.value === "" ||
    inputConfirmPass.value === "" ||
    inputEmail.value === ""
  ) {
    DE.reset.changeInfo.textContent = `Please fill in all fields.`;
    vibrate(DE.reset.changeInfo);
    vibrate(DE.reset.changeButton);
    return;
  }

  if (inputPassword.value !== inputConfirmPass.value) {
    DE.reset.changeInfo.textContent = `Passwords don't match.`;
    vibrate(DE.reset.changeInfo);
    vibrate(DE.reset.changeButton);
    return;
  }

  try {
    let response = await fetch(apiURL.CHANGE_PASS, {
      method: "POST",
      credentials: "include", //send the cookie with the reset code
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: inputEmail.value,
        pass: inputPassword.value,
        code: inputCode.value,
      }),
    });

    if (!response.ok) {
      let data = await response.json();
      DE.reset.changeInfo.textContent = `Error changing password. ${data.error}`;
      vibrate(DE.reset.changeInfo);
      vibrate(DE.reset.changeButton);
      return;
    }

    DE.reset.changeInfo.style.color = "green";
    DE.reset.changeInfo.style.fontWeight = "bold";
    DE.reset.changeInfo.textContent = `Password successfully changed.`;

    setTimeout(() => {
      DE.reset.dialog.close();
      return;
    }, 2000);
  } catch (error) {
    console.error("Error changing password: ", error);
    DE.reset.changeInfo.textContent = `Error changing password. Try again later.`;
    vibrate(DE.reset.changeInfo);
    vibrate(DE.reset.changeButton);
  }
}

/**
 * Handles the event when the user clicks the button to send a verification
 * code to the email entered in the reset password form.
 * @param {Event} e - The event object of the click event.
 */
async function handleSendCode(e) {
  e.preventDefault();

  let inEmail = /** @type {HTMLInputElement} */ (
    document.querySelector("#reset-email")
  );

  if (!inEmail.validity.valid) {
    DE.reset.codeInfo.textContent = `Enter a valid email.`;
    vibrate(DE.reset.codeInfo);
    vibrate(DE.reset.sendButton);
    return;
  }
  try {
    let response = await fetch(apiURL.RESET_PASS, {
      method: "POST",
      credentials: "include", // to receive the reset code cookie
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: inEmail.value }),
    });

    if (!response.ok) {
      let data = await response.json();
      DE.reset.codeInfo.textContent = `Error sending code. ${data.error}`;
      vibrate(DE.reset.codeInfo);
      vibrate(DE.reset.sendButton);
      return;
    }

    DE.reset.codeInfo.textContent = `The secuirity code was sent to your email. 
      Check your inbox.`;
    DE.reset.codeInfo.style.color = "green";
    DE.reset.codeInfo.style.fontWeight = "bold";
    vibrate(DE.reset.codeInfo);
    vibrate(DE.reset.sendButton);
    return;
  } catch (error) {
    console.error("Error sending code: ", error);
    DE.reset.codeInfo.textContent = `Error sending code. Try again later.`;
    vibrate(DE.reset.codeInfo);
    vibrate(DE.reset.sendButton);
  }
}

/**
 * Handles the event when the user clicks the button to show their visit
 * history.
 */
async function handleShowVisits() {
  if (!userData) {
    // Nunca debería entrar acá si no está logueado el usuario.
    alert("User not logged in.");
    renderUI();
    return;
  }

  try {
    //This is done to get the token before checking if it has expired and in
    //that case refresh the token.
    let accessToken = await auth.getAccessToken();
    let response = await fetch(apiURL.GET_VISITS, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });

    if (!response.ok) {
      console.log(
        `Error getting visits. ${response.status} ${response.statusText}`
      );
      return;
    }

    let data = await response.json();

    if (!data) {
      DE.user.history.textContent = "No visits found.";
      DE.user.history.style.display = "block";

      return;
    }
    if (data.length === 0) {
      DE.user.history.textContent = "No visits found.";
      DE.user.history.style.display = "block";

      return;
    }
    if (data.length > 0) {
      DE.user.history.textContent = "Historial de visitas:\n\n";
      DE.user.history.style.display = "block";
      data.forEach((/** @type {{ date: string; }} */ visit) => {
        let date = new Date(parseInt(visit.date));
        DE.user.history.textContent += `${date.toLocaleString()}\n`;
      });
    }
  } catch (error) {
    console.error("Error getting visits: ", error);
  }
}

//- - - - - - - - - - - - - - - - - - - - - - - -
//- Event listeners - - - - - - - - - - - - - - -
//- - - - - - - - - - - - - - - - - - - - - - - -

function setEventListeners() {
  DE.login.githubButton.addEventListener("click", handleLoginGH);
  DE.login.googleButton.addEventListener("click", handleLoginGG);
  DE.login.passButton.addEventListener("click", handleLogin);
  DE.login.signupButton.addEventListener("click", (e) => {
    e.preventDefault();
    DE.signup.dialog.showModal();
  });
  DE.login.resetButton.addEventListener("click", async () => {
    DE.reset.dialog.showModal();
  });

  DE.reset.sendButton.addEventListener("click", handleSendCode);
  DE.reset.changeButton.addEventListener("click", handleChangePass);
  DE.reset.closeButton.addEventListener("click", () => {
    DE.reset.dialog.close();
    cleanInputs(DE.reset.dialog);
    DE.reset.codeInfo.textContent = "";
    DE.reset.changeInfo.textContent = "";
  });

  DE.signup.submitButton.addEventListener("click", handleSignUp);
  DE.signup.closeButton.addEventListener("click", () => {
    DE.signup.dialog.close();
    cleanInputs(DE.signup.dialog);
    DE.signup.info.textContent = "";
  });

  DE.user.logoutButton.addEventListener("click", handleLogOut);
  DE.user.deleteButton.addEventListener("click", () => {
    DE.delete.user.textContent = `User: ${userData.email}`;

    DE.delete.dialog.showModal();
  });

  DE.user.historyButton.addEventListener("click", handleShowVisits);

  DE.delete.submitButton.addEventListener("click", handleDeleteUser);

  DE.delete.closeButton.addEventListener("click", () => {
    DE.delete.dialog.close();
    cleanInputs(DE.delete.dialog);
    DE.delete.info.textContent = "";
  });

  window.addEventListener("click", (event) => {
    if (event.target === DE.signup.dialog) {
      DE.signup.dialog.close();
      cleanInputs(DE.signup.dialog);
      DE.signup.info.textContent = "";
    }
    if (event.target === DE.delete.dialog) {
      DE.delete.dialog.close();
      cleanInputs(DE.delete.dialog);
      DE.delete.info.textContent = "";
    }
    if (event.target === DE.reset.dialog) {
      DE.reset.dialog.close();
      cleanInputs(DE.reset.dialog);
      DE.reset.codeInfo.textContent = "";
      DE.reset.changeInfo.textContent = "";
    }
  });
}
