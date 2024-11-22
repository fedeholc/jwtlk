import { test, expect } from "@playwright/test";
test("Session persistance after login, going to another page and return", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:8080/");
  await expect(page.getByTestId("login-info")).not.toBeVisible();

  await page.getByPlaceholder("email").fill("testlogin@testlogin.com");

  await page.getByPlaceholder("password").fill("testlogin");
  await page
    .getByRole("button", { name: "Login", exact: true })
    .click({ force: true });

  await expect(page.getByTestId("welcome")).toBeVisible();
  await page.goto("http://playwright.dev/");
  await page.goto("http://127.0.0.1:8080/");
  await expect(page.getByTestId("welcome")).toBeVisible();
});
