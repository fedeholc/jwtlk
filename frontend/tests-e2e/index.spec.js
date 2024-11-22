import { test, expect } from "@playwright/test";
import { baseURL } from "../playwright-config.js";

test("home page should have main elements visible", async ({ page }) => {
  await page.goto(baseURL);
  await expect(
    page.getByRole("button", { name: "Login with GitHub" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Login with Google" })
  ).toBeVisible();
  await expect(page.getByPlaceholder("email")).toBeVisible();
  await expect(page.getByPlaceholder("password")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Login", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset Password" })
  ).toBeVisible();
});
