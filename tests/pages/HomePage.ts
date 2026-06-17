import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly checkServiceInput: Locator;
  readonly checkStatusButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder("Search products, categories, etc.");
    this.checkServiceInput = page.getByPlaceholder("Example: SRV-2026-00123");
    this.checkStatusButton = page.getByRole("button", { name: /check status/i });
  }

  async open() {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState("networkidle");
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press("Enter");
  }

  async fillServiceCode(code: string) {
    await this.checkServiceInput.fill(code);
  }

  async clickCheckStatus() {
    await this.checkStatusButton.click();
  }
}
