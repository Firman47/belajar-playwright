import { type Page, type Locator, type Response, type Request } from "@playwright/test";

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

  /** Click label "Remember me" to toggle checkbox state */
  async toggleRememberMe() {
    await this.page.getByText("Remember me").click();
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

  /** Client-side validation error: Username is required */
  get usernameRequiredError() {
    return this.page.getByText("Username is required");
  }

  /** Client-side validation error: Password is required */
  get passwordRequiredError() {
    return this.page.getByText("Password is required");
  }

  /** Error toast title — menampilkan "Login failed" */
  get errorNotification() {
    return this.page.locator('[data-slot="title"]').filter({ hasText: "Login failed" });
  }

  /** Toast description — berisi pesan error dari API (misal: "Invalid username or password") */
  get toastDescription() {
    return this.page.locator('[data-slot="description"]');
  }

  /** Success toast setelah login berhasil */
  get successNotification() {
    return this.page.getByRole("alert").filter({ hasText: /Login successful/i });
  }

  /** Get login button disabled state */
  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }

  /** Wait for login API response — returns status and body */
  async waitForLoginResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/e_commerce/v1/auth/login") &&
        resp.request().method() === "POST",
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  /** Wait for navigation away from login page (after successful login) */
  async waitForNavigationAfterLogin() {
    await this.page.waitForURL((url) => !url.pathname.includes("/auth/login"), { timeout: 15000 });
  }

  /**
   * Verifies no API call was made to login endpoint.
   * Call this AFTER triggering the submit action.
   */
  async hasNoLoginApiCall(): Promise<boolean> {
    let apiCallCount = 0;
    const handler = (req: Request) => {
      if (
        req.url().includes("/e_commerce/v1/auth/login") &&
        req.method() === "POST"
      ) {
        apiCallCount++;
      }
    };
    this.page.on("request", handler);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.page.off("request", handler);
    return apiCallCount === 0;
  }
}
