import { test, expect } from "@playwright/test";
import { CheckoutPage } from "./pages/CheckoutPage";

test.describe("Checkout Module", () => {
  test("[CHK-001] Checkout tanpa login — redirect ke login", async ({ page }) => {
    await test.step("Buka halaman Checkout tanpa autentikasi", async () => {
      await page.context().clearCookies();
      await page.goto("https://store.olpos.id/kurostoreid/checkout");
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verifikasi redirect ke halaman login", async () => {
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/login");
    });
  });

  test("[CHK-002] @smoke Checkout setelah login — halaman tampil", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page);

    await test.step("Login via halaman login", async () => {
      await page.context().clearCookies();
      await page.goto("https://store.olpos.id/kurostoreid/auth/login");
      await page.waitForLoadState("networkidle");
      await page.getByRole("textbox", { name: "Username" }).fill("firman");
      await page.getByRole("textbox", { name: "Password" }).fill("password");
      await page.getByRole("button", { name: "Login" }).click();
      await page.waitForURL(/^https:\/\/store\.olpos\.id\/kurostoreid\/?$/);
    });

    await test.step("Navigasi ke halaman Checkout", async () => {
      await checkoutPage.open();
    });

    await test.step("Verifikasi halaman Checkout tampil", async () => {
      await expect(checkoutPage.heading).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verifikasi elemen-elemen checkout", async () => {
      await expect(checkoutPage.transactionSummary).toBeVisible();
      await expect(checkoutPage.payNowButton).toBeVisible();
    });
  });
});
