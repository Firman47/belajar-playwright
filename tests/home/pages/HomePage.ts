import { type Page, type Locator, type Response } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class HomePage {
  readonly page: Page;

  readonly headerSearchInput: Locator;
  readonly bannerSlides: Locator;
  readonly bannerTabs: Locator;
  readonly categoryLinks: Locator;
  readonly sortCombobox: Locator;
  readonly productCardLinks: Locator;
  readonly chatbotButton: Locator;
  readonly chatbotCloseButton: Locator;
  readonly openChatbotButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerSearchInput = page.getByPlaceholder("Search products, categories, etc.");
    this.bannerSlides = page.getByRole("tabpanel");
    this.bannerTabs = page.getByRole("tab", { name: /Go to slide/ });
    this.categoryLinks = page.locator("p").filter({ hasText: /^Category$/ }).locator("..").getByRole("link");
    this.sortCombobox = page.getByRole("combobox");
    this.productCardLinks = page.locator("main a").filter({ hasText: /Rp\.?\s*\d/ });
    this.openChatbotButton = page.getByRole("button", { name: "Open chatbot" });
    this.chatbotCloseButton = page.getByRole("button", { name: "Close chatbot" });
  }

  async open() {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState("networkidle");
  }

  async dismissChatbot() {
    const visible = await this.chatbotCloseButton.isVisible().catch(() => false);
    if (visible) {
      await this.chatbotCloseButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async search(query: string) {
    await this.headerSearchInput.fill(query);
    await this.headerSearchInput.press("Enter");
  }

  async getProductCardCount(): Promise<number> {
    return await this.productCardLinks.count();
  }

  async clickProductCard(index: number = 0) {
    const cards = await this.productCardLinks.all();
    if (cards.length > 0) {
      await cards[Math.min(index, cards.length - 1)].click();
    }
  }

  async getCategoryLinks(): Promise<{ text: string; href: string }[]> {
    const links = await this.categoryLinks.all();
    const result: { text: string; href: string }[] = [];
    for (const link of links) {
      const text = (await link.textContent())?.trim() || "";
      const href = (await link.getAttribute("href")) || "";
      if (text && text !== "See All") {
        result.push({ text, href });
      }
    }
    return result;
  }

  async clickCategory(name: string) {
    await this.categoryLinks.filter({ hasText: name }).first().click();
  }

  async getBannerCount(): Promise<number> {
    return await this.bannerSlides.count();
  }

  async selectSortOption(optionName: string) {
    await this.sortCombobox.click();
    await this.page.getByRole("option", { name: optionName, exact: true }).click();
  }

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
}
