import { type Page, type Locator, type Response } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";
const API_BASE = "https://be.olpos.id/e_commerce/v1/kurostoreid";

export class SearchPage {
  readonly page: Page;

  // Header search (visible on all pages)
  readonly headerSearchInput: Locator;

  // Product cards = <a> inside <main> whose text contains "Rp." + digits
  // Works on both homepage and search page
  readonly productCardLinks: Locator;

  // Search page breadcrumb
  readonly breadcrumbHome: Locator;

  // Sort tabs (search page)
  readonly sortNewest: Locator;
  readonly sortPopular: Locator;
  readonly sortHighestRating: Locator;
  readonly sortBiggestPromo: Locator;

  // Price range filters (search page)
  readonly priceFilter100k500k: Locator;
  readonly priceFilter500k1jt: Locator;
  readonly priceFilter1jt5jt: Locator;
  readonly priceFilter5jt10jt: Locator;
  readonly priceFilterAbove10jt: Locator;

  // Category sidebar (search page)
  readonly categorySidebar: Locator;

  // Product count on search page
  readonly productCountText: Locator;

  // Empty state
  readonly emptyState: Locator;

  // Toast / Notification
  readonly toastDescription: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.headerSearchInput = page.getByPlaceholder("Search products, categories, etc.");

    // Product cards — any <a> in <main> whose text has "Rp." + digits (price pattern)
    this.productCardLinks = page.locator("main a").filter({ hasText: /Rp\.?\s*\d/ });

    // Breadcrumb
    this.breadcrumbHome = page.getByRole("link", { name: "Home", exact: true });

    // Sort tabs
    this.sortNewest = page.getByRole("button", { name: "Terbaru" });
    this.sortPopular = page.getByRole("button", { name: "Terpopuler" });
    this.sortHighestRating = page.getByRole("button", { name: "Rating Tertinggi" });
    this.sortBiggestPromo = page.getByRole("button", { name: "Promo Terbesar" });

    // Price filters
    this.priceFilter100k500k = page.getByRole("button", { name: "Rp100k - Rp500k" });
    this.priceFilter500k1jt = page.getByRole("button", { name: "Rp500k - Rp1jt" });
    this.priceFilter1jt5jt = page.getByRole("button", { name: "Rp1jt - Rp5jt" });
    this.priceFilter5jt10jt = page.getByRole("button", { name: "Rp5jt - Rp10jt" });
    this.priceFilterAbove10jt = page.getByRole("button", { name: "> Rp10jt" });

    // Category sidebar
    this.categorySidebar = page.locator('nav[aria-label="Main"]');

    // Product count (search page shows like "1 products")
    this.productCountText = page.getByText(/\d+\s*(products|produk)/i);

    // Empty state
    this.emptyState = page.locator("main").getByText(/tidak ada produk|no products|belum ada produk|0 products|0 produk/i);

    // Toast
    this.toastDescription = page.locator('[data-slot="description"]');
  }

  // === NAVIGATION ===

  /** Navigate to search page (SSR — no client-side API call) */
  async openSearch(query: string = "") {
    const url = query ? `${BASE_URL}/search?q=${encodeURIComponent(query)}` : `${BASE_URL}/search`;
    await this.page.goto(url);
    await this.page.waitForLoadState("networkidle");
  }

  /** Navigate to homepage (SSR — no client-side API call for products) */
  async openHomepage() {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState("networkidle");
  }

  // === ACTIONS THAT TRIGGER CLIENT-SIDE API CALLS ===

  /** Click a category in sidebar — triggers API call */
  async clickCategory(categoryName: string) {
    await this.categorySidebar.getByRole("link", { name: categoryName, exact: true }).click();
  }

  /** Click a price filter button — triggers API call */
  async clickPriceFilter(button: Locator) {
    await button.click();
  }

  /** Click a sort tab — triggers API call if changing from current sort */
  async clickSort(sortButton: Locator) {
    await sortButton.click();
  }

  // === DOM ACTIONS ===

  async searchFromHeader(keyword: string) {
    await this.headerSearchInput.fill(keyword);
    await this.headerSearchInput.press("Enter");
  }

  async clickProductCard(index: number = 0) {
    const cards = await this.productCardLinks.all();
    if (cards.length > 0) {
      await cards[Math.min(index, cards.length - 1)].click();
    }
  }

  async clickBreadcrumbHome() {
    await this.breadcrumbHome.click();
  }

  // === API RESPONSE INTERCEPTOR ===

  /**
   * Wait for products API GET response.
   * Only works for CLIENT-SIDE triggered requests (category, price, sort).
   * Initial navigation is SSR — no API call is made in the browser.
   */
  async waitForProductsApi(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/e_commerce/v1") &&
        resp.url().includes("/products") &&
        resp.request().method() === "GET",
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  // === GETTERS ===

  async getProductCardCount(): Promise<number> {
    return await this.productCardLinks.count();
  }

  async getFirstProductLink(): Promise<string | null> {
    return await this.productCardLinks.first().getAttribute("href");
  }

  async getFirstProductName(): Promise<string> {
    return (await this.productCardLinks.first().textContent())?.trim() || "";
  }

  /** Check if a specific product name exists in the product grid */
  async hasProductNamed(name: string): Promise<boolean> {
    const cards = await this.productCardLinks.all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes(name)) return true;
    }
    return false;
  }
}
