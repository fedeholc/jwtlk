import { test, expect } from "@playwright/test";

test("Logout", async ({ page }) => {
  // Sign up a new user
  let randomString = Math.random().toString(36);

  await page.goto("/");

  await page.getByRole("button", { name: "Sign Up" }).click({ force: true });

  await page.locator("#su-email").fill(randomString + "@test.com");
  await page.locator("#su-password").fill("pass");
  await page.getByRole("textbox", { name: "Confirm Password" }).fill("pass");
  await page.locator("[data-signup-submit-button]").click({ force: true });

  await expect(page.getByText("User successfully registered.")).toBeVisible();

  // Test the logout functionality
  await expect(page.getByTestId("welcome")).toBeVisible();
  await page.getByRole("button", { name: "Logout" }).click({ force: true });
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  // This is needed to avoid the generation of two same tokens (because iat is measured in seconds)
  await page.waitForTimeout(1000);

  // Login and delete the generated account
  await page.getByPlaceholder("email").fill(randomString + "@test.com");

  await page.getByPlaceholder("password").fill("pass");
  await page
    .getByRole("button", { name: "Login", exact: true })
    .click({ force: true });

  await expect(page.getByTestId("user-data")).toBeVisible();

  await page
    .getByRole("button", { name: "Delete Account" })
    .click({ force: true });

  await page.getByRole("textbox", { name: "Password" }).fill("pass");
  await page
    .locator("[data-delete-dialog]")
    .getByRole("button", { name: "Delete Account" })
    .click({ force: true });

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  //
});
