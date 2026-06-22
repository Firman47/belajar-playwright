import { test, expect } from "@playwright/test";
import { PcBuilderPage } from "./pages/PcBuilderPage";

test.describe("PC Builder Module", () => {
  test("[PCB-001] PC Builder tanpa login — redirect ke login", async ({ page }) => {
    await test.step("Buka halaman PC Builder tanpa autentikasi", async () => {
      await page.context().clearCookies();
      await page.goto("https://store.olpos.id/kurostoreid/simasko/rakit-komputer");
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verifikasi redirect ke halaman login", async () => {
      await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/login");
    });
  });

  test("[PCB-002] @smoke PC Builder setelah login — halaman tampil", async ({ page }) => {
    const pcBuilderPage = new PcBuilderPage(page);

    await test.step("Login via halaman login", async () => {
      await page.context().clearCookies();
      await page.goto("https://store.olpos.id/kurostoreid/auth/login");
      await page.waitForLoadState("networkidle");
      await page.getByRole("textbox", { name: "Username" }).fill("firman");
      await page.getByRole("textbox", { name: "Password" }).fill("password");
      await page.getByRole("button", { name: "Login" }).click();
      await page.waitForURL(/^https:\/\/store\.olpos\.id\/kurostoreid\/?$/);
    });

    await test.step("Navigasi ke halaman PC Builder", async () => {
      await pcBuilderPage.open();
    });

    await test.step("Verifikasi halaman PC Builder tampil", async () => {
      await expect(pcBuilderPage.heading).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verifikasi komponen-komponen builder tersedia", async () => {
      await expect(pcBuilderPage.processorSection).toBeVisible();
      await expect(pcBuilderPage.motherboardSection).toBeVisible();
      await expect(pcBuilderPage.addAllToCartButton).toBeVisible();
      await expect(pcBuilderPage.resetAllButton).toBeVisible();
    });
  });
});
