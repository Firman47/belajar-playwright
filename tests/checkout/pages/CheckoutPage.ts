import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class CheckoutPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly shippingAddressSection: Locator;
  readonly addAddressButton: Locator;
  readonly changeAddressButton: Locator;
  readonly noAddressText: Locator;
  readonly shippingAddressNotSet: Locator;
  readonly itemsSection: Locator;
  readonly itemCountText: Locator;
  readonly transactionSummary: Locator;
  readonly logisticsSection: Locator;
  readonly paymentMethodSection: Locator;
  readonly bankTransferCombobox: Locator;
  readonly totalPriceText: Locator;
  readonly totalPaymentText: Locator;
  readonly payNowButton: Locator;
  readonly toastDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Checkout" });
    this.shippingAddressSection = page.getByRole("heading", { name: "Shipping Address" });
    this.addAddressButton = page.getByRole("button", { name: "Add Address" });
    this.changeAddressButton = page.getByRole("button", { name: "Change Address" });
    this.noAddressText = page.getByText("No address selected yet");
    this.shippingAddressNotSet = page.getByText("Shipping Address Not Set");
    this.itemsSection = page.getByRole("heading", { name: "Item" });
    this.itemCountText = page.getByText(/\d+\s*items/i);
    this.transactionSummary = page.getByRole("heading", { name: "Transaction Summary" });
    this.logisticsSection = page.getByText("Logistics");
    this.paymentMethodSection = page.getByText("Bank Transfer");
    this.bankTransferCombobox = page.getByRole("combobox", { name: "Bank Transfer" });
    this.totalPriceText = page.getByText("Total Price").locator("..");
    this.totalPaymentText = page.getByText("Total Payment").locator("..");
    this.payNowButton = page.getByRole("button", { name: "Pay Now" });
    this.toastDescription = page.locator('[data-slot="description"]');
  }

  async open() {
    await this.page.goto(`${BASE_URL}/checkout`);
    await this.page.waitForLoadState("networkidle");
  }

  async getItemCount(): Promise<string | null> {
    return await this.itemCountText.textContent();
  }

  async isPayNowDisabled(): Promise<boolean> {
    return await this.payNowButton.isDisabled();
  }
}
