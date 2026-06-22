import { type Page, type Locator, type Response } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class ProductDetailPage {
  readonly page: Page;

  readonly breadcrumb: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly mainImage: Locator;
  readonly addToCartButton: Locator;
  readonly quantityInput: Locator;
  readonly subtotal: Locator;
  readonly stockInfo: Locator;
  readonly specificationSection: Locator;
  readonly reviewsSection: Locator;
  readonly relatedProductsSection: Locator;
  readonly otherProductsViewAll: Locator;

  constructor(page: Page) {
    this.page = page;

    this.breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    this.productTitle = page.locator("main h1").first();
    this.productPrice = page.locator("h1").first().locator("..").locator('p:has-text("Rp.")').first();
    this.mainImage = page.locator('[aria-roledescription="carousel"] img').first();
    this.addToCartButton = page.getByRole("button", { name: /add to cart/i }).first();
    this.quantityInput = page.locator('input[role="spinbutton"]').first();
    this.subtotal = page.locator('p:has-text("Subtotal") + p');
    this.stockInfo = page.getByText(/^Stock:/i);
    this.specificationSection = page.locator('button:has-text("Specification and Description")');
    this.reviewsSection = page.getByText("No reviews yet");
    this.relatedProductsSection = page.locator('h3:has-text("Other products")').locator("..").locator("..");
    this.otherProductsViewAll = page.getByRole("link", { name: /view all/i });
  }

  async open(slug: string = "charger-5v") {
    await this.page.goto(`${BASE_URL}/${slug}`);
    await this.page.waitForLoadState("networkidle");
  }

  async getProductTitle(): Promise<string> {
    return (await this.productTitle.textContent())?.trim() || "";
  }

  async getProductPrice(): Promise<string> {
    return (await this.productPrice.textContent())?.trim() || "";
  }

  async clickAddToCart() {
    await this.addToCartButton.click();
  }

  async waitForAddToCartResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/e_commerce/v1") &&
        resp.url().includes("/cart") &&
        resp.request().method() === "POST",
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }
}
