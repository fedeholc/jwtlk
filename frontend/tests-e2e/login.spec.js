import { test, expect } from "@playwright/test";

test("Login with wrong email should display an error message", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:8080/");
  await expect(page.getByTestId("login-info")).not.toBeVisible();

  await page.getByPlaceholder("email").fill("blablabla");
  await page.getByPlaceholder("password").fill("bla");

  await page
    .getByRole("button", { name: "Login", exact: true })
    .click({ force: true });
  await expect(page.getByTestId("login-info")).toBeVisible();
});

test("Login with wrong password should display an error message", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:8080/");
  await expect(page.getByTestId("login-info")).not.toBeVisible();

  await page.getByPlaceholder("email").fill("fede@fede.com");
  await page.getByPlaceholder("password").fill("bla");
  await page
    .getByRole("button", { name: "Login", exact: true })
    .click({ force: true });

  await expect(page.getByTestId("login-info")).toBeVisible();
});

test("Login with empty credentials should display an error message", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:8080/");
  await expect(page.getByTestId("login-info")).not.toBeVisible();

  await page.getByPlaceholder("email").fill("");
  await page.getByPlaceholder("password").fill("");
  await page
    .getByRole("button", { name: "Login", exact: true })
    .click({ force: true });

  await expect(page.getByTestId("login-info")).toBeVisible();
});

test("Login with right credentials should display welcome screen", async ({
  page,
}) => {
  // Sign up a new user
  let randomString = Math.random().toString(36);

  await page.goto("http://127.0.0.1:8080/");
  await page.getByRole("button", { name: "Sign Up" }).click({ force: true });

  await page.locator("#su-email").fill(randomString + "@test.com");
  await page.locator("#su-password").fill("pass");
  await page.getByRole("textbox", { name: "Confirm Password" }).fill("pass");
  await page.locator("[data-signup-submit-button]").click({ force: true });

  await expect(page.getByText("User successfully registered.")).toBeVisible();

  // logout
  await page.getByRole("button", { name: "Logout" }).click({ force: true });
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  //login

  await page.getByPlaceholder("email").fill(randomString + "@test.com");

  await page.getByPlaceholder("password").fill("pass");
  await page
    .getByRole("button", { name: "Login", exact: true })
    .click({ force: true });

  await expect(page.getByTestId("user-data")).toBeVisible();
});

test("Login with github should redirect to github", async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/");
  await page
    .getByRole("button", { name: "Login with GitHub" })
    .click({ force: true });

  await expect(page.getByText("Sign in to GitHub to continue")).toBeVisible();
});

test("Login with google should redirect to google", async ({ page }) => {
  await page.goto("http://127.0.0.1:8080/");
  await page
    .getByRole("button", { name: "Login with Google" })
    .click({ force: true });

  await expect(page.getByText("Sign in with Google")).toBeVisible();
});
