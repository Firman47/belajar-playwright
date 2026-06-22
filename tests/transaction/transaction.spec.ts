import { test, expect } from "@playwright/test";
import { TransactionPage } from "./pages/TransactionPage";

test.describe("Transaction / Order History Module", () => {
  test("[TRX-001] Order history tanpa login — redirect ke login", async ({ page }) => {
    await test.step("Buka halaman Order History tanpa autentikasi", async () => {
      await page.context().clearCookies();
      await page.goto("https://store.olpos.id/kurostoreid/checkout/history");
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verifikasi redirect ke halaman login", async () => {
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/login");
    });
  });

  test("[TRX-002] @smoke Order history setelah login — halaman tampil", async ({ page }) => {
    const transactionPage = new TransactionPage(page);

    await test.step("Login via halaman login", async () => {
      await page.context().clearCookies();
      await page.goto("https://store.olpos.id/kurostoreid/auth/login");
      await page.waitForLoadState("networkidle");
      await page.getByRole("textbox", { name: "Username" }).fill("firman");
      await page.getByRole("textbox", { name: "Password" }).fill("password");
      await page.getByRole("button", { name: "Login" }).click();
      await page.waitForURL(/^https:\/\/store\.olpos\.id\/kurostoreid\/?$/);
    });

    await test.step("Navigasi ke halaman Transaction History", async () => {
      await transactionPage.open();
    });

    await test.step("Verifikasi halaman Transaction History tampil", async () => {
      await expect(transactionPage.heading).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verifikasi filter dan search tersedia", async () => {
      await expect(transactionPage.filterAll).toBeVisible();
      await expect(transactionPage.searchInput).toBeVisible();
    });
  });
});
