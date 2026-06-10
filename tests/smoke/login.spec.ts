import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test("[SMOKE] Login page dapat dibuka", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();

  await expect(loginPage.loginButton).toBeVisible();
});