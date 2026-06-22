import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class TransactionPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subheading: Locator;
  readonly searchInput: Locator;
  readonly filterAll: Locator;
  readonly filterPending: Locator;
  readonly filterProcessing: Locator;
  readonly filterShipped: Locator;
  readonly filterCompleted: Locator;
  readonly filterCancelled: Locator;
  readonly orderList: Locator;
  readonly orderCards: Locator;
  readonly emptyStateTitle: Locator;
  readonly emptyStateDescription: Locator;
  readonly startShoppingLink: Locator;
  readonly toastDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Transaction History" });
    this.subheading = page.getByText("View and manage all your orders");
    this.searchInput = page.getByRole("textbox", { name: "Search product" });
    this.filterAll = page.getByRole("button", { name: "All" });
    this.filterPending = page.getByRole("button", { name: "Pending" });
    this.filterProcessing = page.getByRole("button", { name: "Processing" });
    this.filterShipped = page.getByRole("button", { name: "Shipped" });
    this.filterCompleted = page.getByRole("button", { name: "Completed" });
    this.filterCancelled = page.getByRole("button", { name: "Cancelled" });
    this.orderCards = page.locator("main").locator("[class*='order'], [class*='card'], [class*='transaction']");
    this.emptyStateTitle = page.getByText("No orders yet");
    this.emptyStateDescription = page.getByText("Your first order awaits");
    this.startShoppingLink = page.getByRole("link", { name: "Start Shopping" });
    this.toastDescription = page.locator('[data-slot="description"]');
  }

  async open() {
    await this.page.goto(`${BASE_URL}/checkout/history`);
    await this.page.waitForLoadState("networkidle");
  }

  async getOrderCount(): Promise<number> {
    return await this.orderCards.count();
  }

  async searchOrder(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press("Enter");
  }

  async clickFilter(filterName: string) {
    const filterMap: Record<string, Locator> = {
      all: this.filterAll,
      pending: this.filterPending,
      processing: this.filterProcessing,
      shipped: this.filterShipped,
      completed: this.filterCompleted,
      cancelled: this.filterCancelled,
    };
    const filter = filterMap[filterName.toLowerCase()];
    if (filter) {
      await filter.click();
    }
  }
}
