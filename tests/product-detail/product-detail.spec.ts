import { test, expect } from "@playwright/test";
import { ProductDetailPage } from "./pages/ProductDetailPage";

test.describe("Product Detail Module", () => {
  test("[PDT-001] @smoke Halaman produk — menampilkan informasi produk", async ({ page }) => {
    const productPage = new ProductDetailPage(page);

    await test.step("Buka halaman detail produk", async () => {
      await page.context().clearCookies();
      await productPage.open();
    });

    await test.step("Verifikasi breadcrumb terlihat", async () => {
      await expect(productPage.breadcrumb).toBeVisible();
    });

    await test.step("Verifikasi judul produk sesuai", async () => {
      const title = await productPage.getProductTitle();
      expect(title).toBe("Charger 5V");
    });

    await test.step("Verifikasi harga produk sesuai", async () => {
      const price = await productPage.getProductPrice();
      expect(price).toContain("Rp.");
      expect(price).toContain("50.000");
    });
  });

  test("[PDT-002] Breadcrumb — navigasi ke Home", async ({ page }) => {
    const productPage = new ProductDetailPage(page);

    await test.step("Buka halaman detail produk", async () => {
      await page.context().clearCookies();
      await productPage.open();
    });

    await test.step("Klik breadcrumb Home", async () => {
      await productPage.breadcrumb.getByRole("link", { name: "Home", exact: true }).click();
    });

    await test.step("Verifikasi navigasi ke homepage", async () => {
      await page.waitForURL(/\/kurostoreid$/, { timeout: 10000 });
      expect(page.url().replace(/\/$/, "")).toBe("https://store.olpos.id/kurostoreid");
    });
  });

  test("[PDT-003] Add to Cart tanpa login — muncul modal/login", async ({ page }) => {
    const productPage = new ProductDetailPage(page);

    await test.step("Buka halaman detail produk dengan session bersih", async () => {
      await page.context().clearCookies();
      await productPage.open();
    });

    await test.step("Klik Add to Cart", async () => {
      await productPage.clickAddToCart();
    });

    await test.step("Verifikasi redirect ke halaman login", async () => {
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/login");
      expect(page.url()).toContain("redirect=");
    });
  });

  test("[PDT-004] Spesifikasi section — bisa dibuka/tutup", async ({ page }) => {
    const productPage = new ProductDetailPage(page);

    await test.step("Set viewport mobile dan buka halaman detail", async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.context().clearCookies();
      await productPage.open();
    });

    await test.step("Verifikasi section spesifikasi terlihat", async () => {
      await expect(productPage.specificationSection).toBeVisible();
    });

    await test.step("Klik section specification untuk tutup", async () => {
      await productPage.specificationSection.click();
      await page.waitForTimeout(400);
    });

    await test.step("Klik section specification untuk buka kembali", async () => {
      await productPage.specificationSection.click();
      await page.waitForTimeout(400);
      await expect(productPage.specificationSection).toBeVisible();
    });
  });

  test("[PDT-005] Buyer Reviews — menampilkan empty state", async ({ page }) => {
    const productPage = new ProductDetailPage(page);

    await test.step("Buka halaman detail produk", async () => {
      await page.context().clearCookies();
      await productPage.open();
    });

    await test.step("Verifikasi teks 'No reviews yet' muncul", async () => {
      await expect(productPage.reviewsSection).toBeVisible();
    });
  });

  test("[PDT-006] Other products — menampilkan produk terkait", async ({ page }) => {
    const productPage = new ProductDetailPage(page);

    await test.step("Buka halaman detail produk", async () => {
      await page.context().clearCookies();
      await productPage.open();
    });

    await test.step("Verifikasi section Other products memiliki minimal 1 produk", async () => {
      await expect(productPage.relatedProductsSection).toBeVisible();
      const productCards = productPage.relatedProductsSection.locator("div.grid a");
      const count = await productCards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    await test.step("Klik 'View all' dan verifikasi navigasi ke homepage", async () => {
      await productPage.otherProductsViewAll.click();
      await page.waitForURL(/\/kurostoreid$/, { timeout: 10000 });
      expect(page.url().replace(/\/$/, "")).toBe("https://store.olpos.id/kurostoreid");
    });
  });
});
