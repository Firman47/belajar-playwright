import { test, expect } from "@playwright/test";
import { CartPage } from "./pages/CartPage";

test.describe("Cart Module - Login First", () => {
  test("[CRT-001] @smoke Cart tanpa login — redirect ke login", async ({ page }) => {
    const cartPage = new CartPage(page);

    await test.step("Buka halaman Cart tanpa autentikasi", async () => {
      await page.context().clearCookies();
      await page.goto(CartPage.BASE_URL + "/cart");
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verifikasi redirect ke halaman login", async () => {
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/login");
    });
  });

  test("[CRT-002] Cart setelah login — menampilkan keranjang", async ({ page }) => {
    const cartPage = new CartPage(page);

    await test.step("Login via halaman login", async () => {
      await page.context().clearCookies();
      await page.goto("https://store.olpos.id/kurostoreid/auth/login");
      await page.waitForLoadState("networkidle");
      await page.getByRole("textbox", { name: "Username" }).fill("firman");
      await page.getByRole("textbox", { name: "Password" }).fill("password");
      await page.getByRole("button", { name: "Login" }).click();
      await page.waitForURL(/^https:\/\/store\.olpos\.id\/kurostoreid\/?$/);
    });

    await test.step("Navigasi ke halaman Cart", async () => {
      await cartPage.open();
    });

    await test.step("Verifikasi halaman Cart tampil", async () => {
      await expect(cartPage.heading).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verifikasi item keranjang atau empty state", async () => {
      const itemCount = await cartPage.getCartItemCount();
      if (itemCount > 0) {
        await expect(cartPage.checkoutButton).toBeVisible();
      } else {
        await expect(cartPage.emptyState).toBeVisible();
      }
    });
  });
});
