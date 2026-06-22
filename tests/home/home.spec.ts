import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("Home Module", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("[HOM-001] @smoke Banner carousel — menampilkan 3 slide", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
    });

    await test.step("Verifikasi banner memiliki 3 slide", async () => {
      const count = await homePage.getBannerCount();
      expect(count).toBe(3);
    });

    await test.step("Verifikasi tab navigasi banner tersedia", async () => {
      const tabCount = await homePage.bannerTabs.count();
      expect(tabCount).toBe(3);
    });
  });

  test("[HOM-002] @smoke Product grid — menampilkan produk", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
    });

    await test.step("Verifikasi minimal 1 produk tampil", async () => {
      const count = await homePage.getProductCardCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test("[HOM-003] Category sidebar — menampilkan kategori", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
    });

    await test.step("Verifikasi category links minimal 5", async () => {
      const categories = await homePage.getCategoryLinks();
      expect(categories.length).toBeGreaterThanOrEqual(5);
    });

    await test.step("Category links memiliki href yang valid", async () => {
      const categories = await homePage.getCategoryLinks();
      for (const cat of categories) {
        expect(cat.href).toBeTruthy();
        expect(cat.text).toBeTruthy();
      }
    });
  });

  test("[HOM-004] Klik produk — navigasi ke detail produk", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
    });

    await test.step("Verifikasi ada produk", async () => {
      const count = await homePage.getProductCardCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    await test.step("Klik produk pertama dan verifikasi navigasi ke detail", async () => {
      await homePage.clickProductCard(0);
      await page.waitForURL(/\/kurostoreid\/(?!search)/, { timeout: 10000 });
      expect(page.url()).not.toContain("/search");
    });
  });

  test("[HOM-005] Header search — navigasi ke search page", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
    });

    await test.step("Ketik 'charger' di header search dan tekan Enter", async () => {
      await homePage.search("charger");
    });

    await test.step("Verifikasi navigasi ke halaman search", async () => {
      await page.waitForURL(/\/search\?q=charger/, { timeout: 10000 });
      expect(page.url()).toContain("/search?q=charger");
    });
  });

  test("[HOM-006] Footer — menampilkan link navigasi", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
    });

    await test.step("Verifikasi footer link About Us", async () => {
      const link = page.getByRole("link", { name: "About Us" });
      await expect(link).toBeVisible();
      expect(await link.getAttribute("href")).toBe("/kurostoreid/about");
    });

    await test.step("Verifikasi footer link Privacy Policy", async () => {
      const link = page.getByRole("link", { name: "Privacy Policy" });
      await expect(link).toBeVisible();
      expect(await link.getAttribute("href")).toBe("/privacy");
    });

    await test.step("Verifikasi footer link Terms of Service", async () => {
      const link = page.getByRole("link", { name: "Terms of Service" });
      await expect(link).toBeVisible();
      expect(await link.getAttribute("href")).toBe("/terms");
    });
  });

  test("[HOM-007] Klik kategori sidebar — navigasi ke search dengan kategori", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
    });

    await test.step("Klik kategori 'Laptop'", async () => {
      await homePage.clickCategory("Laptop");
    });

    await test.step("Verifikasi navigasi ke halaman kategori", async () => {
      await page.waitForURL(/\/kurostoreid\/laptop/, { timeout: 10000 });
      expect(page.url()).toContain("/kurostoreid/laptop");
    });
  });

  test("[HOM-008] Sort combobox — tersedia dan bisa diubah", async ({ page }) => {
    const homePage = new HomePage(page);

    await test.step("Buka homepage", async () => {
      await homePage.open();
      await homePage.dismissChatbot();
    });

    await test.step("Verifikasi combobox sort tersedia", async () => {
      await expect(homePage.sortCombobox).toBeVisible();
      expect(await homePage.sortCombobox.textContent()).toContain("Terbaru");
    });

    await test.step("Pilih opsi 'Termurah' dan tangkap API response", async () => {
      const [response] = await Promise.all([
        homePage.waitForProductsApi(),
        homePage.selectSortOption("Termurah"),
      ]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });
  });
});
