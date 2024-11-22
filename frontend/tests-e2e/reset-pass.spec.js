import { test, expect } from "@playwright/test";

test("Reset password dialog and buttons", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("login-info")).not.toBeVisible();

  await page.getByTestId("reset-button").click({ force: true });
  await expect(page.getByTestId("send-info")).not.toBeVisible();
  await expect(page.getByTestId("change-info")).not.toBeVisible();
  await page.getByTestId("send-button").click({ force: true });
  await expect(page.getByTestId("send-info")).toBeVisible();
  await page.getByTestId("change-button").click({ force: true });
  await expect(page.getByTestId("change-info")).toBeVisible();
});
