import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly showPasswordButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly googleSignInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole("textbox", { name: "Username" });
    this.passwordInput = page.getByRole("textbox", { name: "Password", exact: true });
    this.loginButton = page.getByRole("button", { name: "Login", exact: true });
    this.showPasswordButton = page.getByRole("button", { name: "Show password" });
    this.rememberMeCheckbox = page.getByRole("checkbox", { name: "Remember me" });
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot Password?" });
    this.registerLink = page.getByRole("link", { name: "Register" });
    this.heading = page.getByRole("heading", { name: "Login" });
    this.subtitle = page.getByText("Sign in to your account");
    this.googleSignInButton = page.frameLocator("iframe[title*='Google']").getByRole("button");
  }

  async open() {
    await this.page.goto(`${BASE_URL}/auth/login`);
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

  async submitWithKeyboard() {
    await this.passwordInput.press("Enter");
  }

  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
  }

  async loginAndSubmit(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submitWithKeyboard();
  }

  async toggleShowPassword() {
    await this.showPasswordButton.click();
  }

  get formElement() {
    return this.page.locator("form");
  }

  get usernameInputElement() {
    return this.page.locator('input[name="username"]');
  }

  get passwordInputElement() {
    return this.page.locator('input[name="password"]');
  }

  get usernameRequiredError() {
    return this.page.getByText("Username is required");
  }

  get passwordRequiredError() {
    return this.page.getByText("Password is required");
  }

  get errorNotification() {
    return this.page.getByText("Login failed");
  }

  get isLoginButtonDisabled(): Promise<boolean> {
    return this.loginButton.isDisabled();
  }

  async waitForLoginResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse((resp) =>
      resp.url().includes("/e_commerce/v1/auth/login"),
    );
    return {
      status: response.status(),
      body: await response.json(),
    };
  }

  async waitForNavigationAfterLogin() {
    await this.page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15000 });
  }
}
