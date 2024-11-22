import { test, expect } from "@playwright/test";
test("Show user visit history", async ({ page }) => {
  // Sign up a new user
  let randomString = Math.random().toString(36);
  await page.goto("/");

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

  // test the visit history
  await expect(page.getByTestId("welcome")).toBeVisible();
  await expect(page.getByTestId("user-history")).not.toBeVisible();
  await page.goto("http://playwright.dev/");
  await page.goto("/");

  await expect(page.getByTestId("user-history")).not.toBeVisible();
  await page.getByTestId("button-history").click({ force: true });
  await expect(page.getByTestId("user-history")).toBeVisible();
});
