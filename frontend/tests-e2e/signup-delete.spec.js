import { test, expect } from "@playwright/test";

test("Signup user and then delete the account", async ({ page }) => {
  let randomString = Math.random().toString(36);

  await page.goto("/");

  await page.getByRole("button", { name: "Sign Up" }).click({ force: true });

  await page.locator("#su-email").fill(randomString + "@test.com");
  await page.locator("#su-email").press("Tab");
  await page.locator("#su-password").fill("pass");
  await page.locator("#su-password").press("Tab");
  await page.getByRole("textbox", { name: "Confirm Password" }).fill("pass");
  await page.locator("[data-signup-submit-button]").click({ force: true });

  await expect(page.getByText("User successfully registered.")).toBeVisible();
  await page
    .getByRole("button", { name: "Delete Account" })
    .click({ force: true });

  await page.getByRole("textbox", { name: "Password" }).fill("pass");
  await page
    .locator("[data-delete-dialog]")
    .getByRole("button", { name: "Delete Account" })
    .click({ force: true });

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});
