import { test, expect } from "@playwright/test";
import { SearchPage } from "../pages/SearchPage";

/**
 * Smoke Test — Catalog Discovery Module
 * Critical path: search from header → products visible,
 * search page direct → SSR renders products, click product → detail.
 */
test.describe("Catalog Discovery Smoke", () => {
  test("[SMOKE] Search dari header — produk muncul, klik ke detail", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Search 'charger' dari header", async () => {
      await page.context().clearCookies();
      await searchPage.openHomepage();

      await searchPage.headerSearchInput.fill("charger");
      await searchPage.headerSearchInput.press("Enter");

      await page.waitForURL(/\/search\?q=charger/, { timeout: 10000 });
    });

    await test.step("Product grid menampilkan hasil (SSR)", async () => {
      await page.waitForLoadState("networkidle");
      const count = await searchPage.getProductCardCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    await test.step("Klik produk pertama → halaman detail", async () => {
      const productLink = await searchPage.getFirstProductLink();
      expect(productLink).not.toBeNull();

      await searchPage.clickProductCard(0);
      await page.waitForURL(/\/kurostoreid\/(?!search)/, { timeout: 10000 });
      expect(page.url()).not.toContain("/search");
    });
  });

  test("[SMOKE] Search page langsung dengan query — produk tampil", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page dengan ?q=charger (SSR)", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Verifikasi produk muncul di grid", async () => {
      const count = await searchPage.getProductCardCount();
      expect(count).toBeGreaterThan(0);
    });
  });
});
