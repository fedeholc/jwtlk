/**
 * @param {HTMLElement | Document} element
 */
export default function getDomElementsRefs(element) {
  const domElementsRefs = {
    // - Login section
    login: {
      /** @type {HTMLElement} */
      section: element.querySelector("[data-login-section]"),
      githubButton: element.querySelector("[data-login-github-button]"),
      googleButton: element.querySelector("[data-login-google-button]"),
      info: element.querySelector("[data-login-info]"),
      passButton: element.querySelector("[data-login-pass-button]"),
      signupButton: element.querySelector("[data-login-signup-button]"),
      resetButton: element.querySelector("[data-login-reset-button]"),
    },
    // - User section
    user: {
      /** @type {HTMLElement} */
      section: element.querySelector("[data-user-section]"),
      display: element.querySelector("[data-user-display]"),
      id: element.querySelector("[data-user-id]"),
      email: element.querySelector("[data-user-email]"),
      deleteButton: element.querySelector("[data-user-delete-button]"),
      logoutButton: element.querySelector("[data-user-logout-button]"),
      historyButton: element.querySelector("[data-user-history-button]"),
      /** @type {HTMLElement} */
      history: element.querySelector("[data-user-history]"),
    },
    // - Signup dialog
    signup: {
      /** @type {HTMLDialogElement} */
      dialog: element.querySelector("[data-signup-dialog]"),
      closeButton: element.querySelector("[data-signup-close-button]"),
      info: element.querySelector("[data-signup-info]"),
      submitButton: element.querySelector("[data-signup-submit-button]"),
    },
    // - Delete dialog
    delete: {
      /** @type {HTMLDialogElement} */
      dialog: element.querySelector("[data-delete-dialog]"),
      closeButton: element.querySelector("[data-delete-close-button]"),
      /** @type {HTMLElement} */
      info: element.querySelector("[data-delete-info]"),
      user: element.querySelector("[data-delete-user]"),
      submitButton: element.querySelector("[data-delete-submit-button]"),
    },
    // - Reset dialog
    reset: {
      /** @type {HTMLDialogElement} */
      dialog: element.querySelector("[data-reset-dialog]"),
      closeButton: element.querySelector("[data-reset-close-button]"),
      /** @type {HTMLElement} */
      codeInfo: element.querySelector("[data-reset-code-info]"),
      sendButton: element.querySelector("[data-reset-send-button]"),
      changeButton: element.querySelector("[data-reset-change-button]"),
      /** @type {HTMLElement} */
      changeInfo: element.querySelector("[data-reset-change-info]"),
    },
  };

  return domElementsRefs;
}
