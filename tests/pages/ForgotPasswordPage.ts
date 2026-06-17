import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendOtpButton: Locator;
  readonly loginLink: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.sendOtpButton = page.getByRole("button", { name: /send/i });
    this.loginLink = page.getByRole("link", { name: "Login" });
    this.heading = page.getByRole("heading", { name: "Forgot Password" });
  }

  async open() {
    await this.page.goto(`${BASE_URL}/auth/forgot-password`);
    await this.page.waitForLoadState("networkidle");
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async clickSendOtp() {
    await this.sendOtpButton.click();
  }

  get emailRequiredError() {
    return this.page.getByText("Email is required");
  }
}
