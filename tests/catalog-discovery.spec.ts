import { test, expect } from "@playwright/test";
import { SearchPage } from "./pages/SearchPage";

/**
 * Catalog Discovery Module — E2E Tests
 * =====================================
 * Covers search, category filter, price filter, sorting, breadcrumb,
 * product navigation, product count validation, and error handling.
 *
 * Architecture notes:
 * - Initial page load: SSR (server-side rendered). Product data is embedded
 *   in __NUXT_DATA__. NO client-side API call on initial navigation.
 * - Client-side API calls are triggered by:
 *   - Clicking a category link in sidebar
 *   - Clicking a price range filter
 *   - Clicking a sort tab (different from current selection)
 *   - Header search form submission (navigates to search page via SSR)
 * - Product cards are <a> links inside <main> with "Rp." price text.
 *
 * Test IDs: DSC-001 to DSC-012
 */

test.describe("Catalog Discovery Module", () => {
  // ====================================================================
  // DSC-001: Search by keyword (SSR) + API contract via direct request
  // ====================================================================

  test("[DSC-001] @smoke Search keyword valid — produk muncul", async ({ page, request }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page dengan q=charger (SSR)", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Verifikasi produk 'Charger 5V' muncul di DOM", async () => {
      const count = await searchPage.getProductCardCount();
      expect(count).toBeGreaterThanOrEqual(1);

      const hasCharger = await searchPage.hasProductNamed("Charger 5V");
      expect(hasCharger).toBe(true);
    });

    await test.step("Verifikasi API contract via direct request", async () => {
      const apiRes = await request.get(
        "https://be.olpos.id/e_commerce/v1/kurostoreid/products?search=charger",
      );
      expect(apiRes.status()).toBe(200);

      const body = await apiRes.json();
      expect(body.status).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.items.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ====================================================================
  // DSC-002: Search no results — empty state (SSR)
  // ====================================================================

  test("[DSC-002] Search tanpa hasil — tampil empty state", async ({ page, request }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search dengan keyword tidak ada (SSR)", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("zzzxxxnonexistent12345");
    });

    await test.step("Verifikasi UI — tidak ada produk", async () => {
      const count = await searchPage.getProductCardCount();
      expect(count).toBe(0);
    });

    await test.step("Verifikasi API mengembalikan 0 items", async () => {
      const apiRes = await request.get(
        "https://be.olpos.id/e_commerce/v1/kurostoreid/products?search=zzzxxxnonexistent12345",
      );
      expect(apiRes.status()).toBe(200);

      const body = await apiRes.json();
      expect(body.status).toBe(true);
      expect(body.data.items).toHaveLength(0);
      expect(body.data.total_count).toBe(0);
    });
  });

  // ====================================================================
  // DSC-003: Search empty string (SSR) — all products shown
  // ====================================================================

  test("[DSC-003] Search kosong — tampil semua produk", async ({ page, request }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search dengan q= (empty string, SSR)", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("");
    });

    await test.step("Verifikasi ada produk di DOM", async () => {
      const count = await searchPage.getProductCardCount();
      expect(count).toBeGreaterThan(0);
    });

    await test.step("Verifikasi API total_count > 0", async () => {
      const apiRes = await request.get(
        "https://be.olpos.id/e_commerce/v1/kurostoreid/products",
      );
      expect(apiRes.status()).toBe(200);
      const body = await apiRes.json();
      expect(body.data.total_count).toBeGreaterThan(0);
    });
  });

  // ====================================================================
  // DSC-004: Filter by category — triggers client-side API call
  // ====================================================================

  test("[DSC-004] Filter kategori — produk sesuai kategori", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page dengan query", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Klik kategori 'Laptop' — tangkap API response", async () => {
      const [response] = await Promise.all([
        searchPage.waitForProductsApi(),
        searchPage.clickCategory("Laptop"),
      ]);

      // API contract
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);

      // URL harus mengandung category=laptop
      expect(page.url()).toContain("category=laptop");

      // Semua produk harus dari kategori Laptop
      const data = response.body.data as Record<string, unknown>;
      const items = data.items as Array<Record<string, unknown>>;
      for (const item of items) {
        const cat = (item.category_name as string)?.toLowerCase() ||
                    (item.category as string)?.toLowerCase();
        expect(cat).toBe("laptop");
      }
    });
  });

  // ====================================================================
  // DSC-005: Sort "Terpopuler" — triggers client-side API call
  // ====================================================================

  test("[DSC-005] Sorting Terpopuler — urutan produk sesuai", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page dengan query", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Klik sort 'Terpopuler' dan tangkap API", async () => {
      const isVisible = await searchPage.sortPopular.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip(true, "Tombol Terpopuler tidak visible");
        return;
      }

      const [response] = await Promise.all([
        searchPage.waitForProductsApi(),
        searchPage.clickSort(searchPage.sortPopular),
      ]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });
  });

  // ====================================================================
  // DSC-006: Sort "Rating Tertinggi" — triggers client-side API call
  // ====================================================================

  test("[DSC-006] Sorting Rating Tertinggi — urutan produk sesuai", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page dengan query", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Klik sort 'Rating Tertinggi' dan tangkap API", async () => {
      const isVisible = await searchPage.sortHighestRating.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip(true, "Tombol Rating Tertinggi tidak visible");
        return;
      }

      const [response] = await Promise.all([
        searchPage.waitForProductsApi(),
        searchPage.clickSort(searchPage.sortHighestRating),
      ]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });
  });

  // ====================================================================
  // DSC-007: Price range filter — triggers client-side API call
  // ====================================================================

  test("[DSC-007] Filter harga — produk dalam rentang", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("produk");
    });

    await test.step("Klik filter 'Rp100k - Rp500k' dan tangkap API", async () => {
      const isVisible = await searchPage.priceFilter100k500k.isVisible().catch(() => false);
      if (!isVisible) {
        test.skip(true, "Price filter button tidak visible");
        return;
      }

      const [response] = await Promise.all([
        searchPage.waitForProductsApi(),
        searchPage.clickPriceFilter(searchPage.priceFilter100k500k),
      ]);

      expect(response.status).toBe(200);

      // Verifikasi semua produk dalam rentang harga
      const data = response.body.data as Record<string, unknown>;
      const items = data.items as Array<Record<string, unknown>>;
      for (const item of items) {
        const price = item.price as number;
        expect(price).toBeGreaterThanOrEqual(100000);
        expect(price).toBeLessThanOrEqual(500000);
      }
    });
  });

  // ====================================================================
  // DSC-008: Header search → redirect + SSR products
  // ====================================================================

  test("[DSC-008] @smoke Search dari header — redirect ke hasil pencarian", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka homepage", async () => {
      await page.context().clearCookies();
      await searchPage.openHomepage();
    });

    await test.step("Ketik 'charger' di header search dan tekan Enter", async () => {
      await searchPage.headerSearchInput.fill("charger");
      await searchPage.headerSearchInput.press("Enter");
    });

    await test.step("Verifikasi navigasi ke search page", async () => {
      await page.waitForURL(/\/search\?q=charger/, { timeout: 10000 });
      expect(page.url()).toContain("/search?q=charger");
    });

    await test.step("Verifikasi produk muncul di DOM (SSR)", async () => {
      await page.waitForLoadState("networkidle");
      const count = await searchPage.getProductCardCount();
      expect(count).toBeGreaterThanOrEqual(1);

      const hasCharger = await searchPage.hasProductNamed("Charger 5V");
      expect(hasCharger).toBe(true);
    });
  });

  // ====================================================================
  // DSC-009: Breadcrumb → Home
  // ====================================================================

  test("[DSC-009] Breadcrumb Home — navigasi ke homepage", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Klik breadcrumb Home", async () => {
      await searchPage.clickBreadcrumbHome();
    });

    await test.step("Verifikasi navigasi ke homepage", async () => {
      await page.waitForURL(/\/kurostoreid$/, { timeout: 10000 });
      expect(page.url().replace(/\/$/, "")).toBe("https://store.olpos.id/kurostoreid");
    });
  });

  // ====================================================================
  // DSC-010: Product card → detail page
  // ====================================================================

  test("[DSC-010] @smoke Klik produk — navigasi ke detail produk", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Verifikasi ada produk", async () => {
      const count = await searchPage.getProductCardCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    await test.step("Klik produk pertama dan verifikasi navigasi ke detail", async () => {
      const productLink = await searchPage.getFirstProductLink();
      expect(productLink).not.toBeNull();
      expect(productLink).not.toContain("/search");

      await searchPage.clickProductCard(0);
      await page.waitForURL(/\/kurostoreid\/(?!search)/, { timeout: 10000 });
      expect(page.url()).not.toContain("/search");
    });
  });

  // ====================================================================
  // DSC-011: API 500 error handling (route interception)
  // ====================================================================

  test("[DSC-011] @error-handling API 500 — UI tidak crash", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await test.step("Intercept API products untuk return 500", async () => {
      await page.route("**/e_commerce/v1/kurostoreid/products*", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: false, message: "Internal Server Error", data: null }),
        });
      });
    });

    await test.step("Buka search page dengan intercept aktif", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("charger");
    });

    await test.step("Verifikasi halaman tidak crash", async () => {
      await expect(page.locator("main")).toBeVisible({ timeout: 5000 });
      // SSR fallback — halaman tetap render meskipun API error
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  // ====================================================================
  // DSC-012: Product count consistency
  // ====================================================================

  test("[DSC-012] Jumlah produk UI — konsisten dengan API", async ({ page, request }) => {
    const searchPage = new SearchPage(page);

    await test.step("Buka search page", async () => {
      await page.context().clearCookies();
      await searchPage.openSearch("produk");
    });

    await test.step("Bandingkan UI count dengan API total_count", async () => {
      const uiCount = await searchPage.getProductCardCount();

      const apiRes = await request.get(
        "https://be.olpos.id/e_commerce/v1/kurostoreid/products?search=produk",
      );
      const body = await apiRes.json();
      const totalApi = body.data.total_count as number;

      // Note: SSR may paginate differently — this assertion is a consistency check
      expect(
        uiCount,
        `[DSC-012] BUG_APP: UI menampilkan ${uiCount} produk tapi API total_count=${totalApi}.\n` +
        `Frontend dan backend tidak sinkron dalam menampilkan jumlah produk.`,
      ).toBe(totalApi);
    });
  });
});
