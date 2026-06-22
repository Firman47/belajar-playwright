import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class CartPage {
  static readonly BASE_URL = BASE_URL;

  readonly page: Page;
  readonly heading: Locator;
  readonly selectAllCheckbox: Locator;
  readonly cartItems: Locator;
  readonly itemCountText: Locator;
  readonly voucherSection: Locator;
  readonly voucherSelectButton: Locator;
  readonly orderSummary: Locator;
  readonly subtotalText: Locator;
  readonly shippingText: Locator;
  readonly totalText: Locator;
  readonly checkoutButton: Locator;
  readonly stickyCheckoutButton: Locator;
  readonly stickyItemCount: Locator;
  readonly stickyTotal: Locator;
  readonly toastDescription: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Shopping Cart" });
    this.selectAllCheckbox = page.getByRole("checkbox", { name: "Select all items" });
    this.cartItems = page.locator("main").locator("> div > div > div").filter({ has: page.locator("checkbox") });
    this.itemCountText = page.getByText(/\d+\s*items/i);
    this.voucherSection = page.getByText("Use Promo Voucher");
    this.voucherSelectButton = page.getByRole("button", { name: "Select" });
    this.orderSummary = page.getByRole("heading", { name: "Order Summary" });
    this.subtotalText = page.getByText("Subtotal").locator("..");
    this.shippingText = page.getByText("Shipping").locator("..");
    this.totalText = page.getByText("Total").locator("..");
    this.checkoutButton = page.getByRole("button", { name: /Checkout/i });
    this.stickyCheckoutButton = page.locator("main").getByRole("button", { name: "Checkout" });
    this.stickyItemCount = page.getByText(/\d+\s*item\s*dipilih/i);
    this.stickyTotal = page.locator("main").getByText(/Rp\./);
    this.toastDescription = page.locator('[data-slot="description"]');
    this.emptyState = page.locator("main").getByText(/keranjang.*kosong|belanja.*sekarang/i);
  }

  async open() {
    await this.page.goto(`${BASE_URL}/cart`);
    await this.page.waitForLoadState("networkidle");
  }

  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async gotoCheckout() {
    await this.checkoutButton.click();
  }

  async selectItem(index: number) {
    const checkboxes = await this.cartItems.locator("checkbox").all();
    if (checkboxes.length > index) {
      await checkboxes[index].check();
    }
  }

  async getTotalPrice(): Promise<string | null> {
    return await this.totalText.textContent();
  }
}
