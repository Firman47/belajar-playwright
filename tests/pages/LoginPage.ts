import { type Page, type Locator, expect } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole("textbox", { name: "Username" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.loginButton = page.getByRole("button", { name: "Login", exact: true });
  }

  async open() {
    await this.page.goto(BASE_URL);
    await this.page.getByRole("link", { name: "Login" }).click();
    await this.page.waitForLoadState("networkidle");
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  get usernameRequiredError() {
    return this.page.getByText("Username is required");
  }

  get toastError() {
    return this.page.getByText("common.toast.auth.login_failed").first();
  }

  async waitAndGetLoginResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse((resp) =>
      resp.url().includes("/e_commerce/v1/auth/login"),
    );
    return {
      status: response.status(),
      body: await response.json(),
    };
  }
}
