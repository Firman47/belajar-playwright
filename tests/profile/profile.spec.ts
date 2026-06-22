import { test, expect, type Page } from "@playwright/test";
import { ProfilePage } from "./pages/ProfilePage";

async function login(page: Page) {
  await page.context().clearCookies();
  await page.goto("https://store.olpos.id/kurostoreid/auth/login");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "Username" }).fill("firman");
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/^https:\/\/store\.olpos\.id\/kurostoreid\/?$/);
}

test.describe("Profile Module", () => {
  test("[PRF-001] @smoke Profile setelah login — halaman tampil", async ({ page }) => {
    const profilePage = new ProfilePage(page);

    await test.step("Login terlebih dahulu", async () => {
      await login(page);
    });

    await test.step("Navigasi ke halaman Settings", async () => {
      await profilePage.open();
    });

    await test.step("Verifikasi halaman Profile / Settings tampil", async () => {
      await expect(profilePage.heading).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verifikasi menu-menu profile tersedia", async () => {
      await expect(profilePage.yourProfileButton).toBeVisible();
      await expect(profilePage.addressListButton).toBeVisible();
      await expect(profilePage.logoutButton).toBeVisible();
    });
  });
});
