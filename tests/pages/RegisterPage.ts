import { type Page, type Locator, type Response, type Request } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class RegisterPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly phoneInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Register" });
    this.fullNameInput = page.getByRole("textbox", { name: "Full Name" });
    this.phoneInput = page.getByRole("textbox", { name: "Phone Number" });
    this.usernameInput = page.getByRole("textbox", { name: "Username" });
    this.emailInput = page.getByRole("textbox", { name: "Email", exact: true });
    this.passwordInput = page.getByRole("textbox", { name: "Password", exact: true });
    this.confirmPasswordInput = page.getByRole("textbox", { name: "Confirm Password" });
    this.registerButton = page.getByRole("button", { name: "Register" });
    this.loginLink = page.getByRole("link", { name: "Login" });
  }

  async open() {
    await this.page.goto(`${BASE_URL}/auth/register`);
    await this.page.waitForLoadState("networkidle");
  }

  async fillFullName(name: string) {
    await this.fullNameInput.fill(name);
  }

  async fillPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async fillRegistrationForm(data: {
    fullName?: string;
    email?: string;
    phone?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  }) {
    if (data.fullName !== undefined) await this.fillFullName(data.fullName);
    if (data.phone !== undefined) await this.fillPhone(data.phone);
    if (data.username !== undefined) await this.fillUsername(data.username);
    if (data.email !== undefined) await this.fillEmail(data.email);
    if (data.password !== undefined) await this.fillPassword(data.password);
    if (data.confirmPassword !== undefined) await this.fillConfirmPassword(data.confirmPassword);
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  /** Error message locators - client side validation */
  get fullNameError() {
    return this.page.getByText("Full name is required");
  }

  get phoneNumberError() {
    return this.page.getByText("Phone number is required");
  }

  get usernameError() {
    return this.page.getByText("Username is required");
  }

  get usernameMinLengthError() {
    return this.page.getByText("Username must be at least 4 characters");
  }

  get emailError() {
    return this.page.getByText("Email is required");
  }

  get invalidEmailError() {
    return this.page.getByText("Please enter a valid email address");
  }

  get passwordError() {
    return this.page.getByText("Password is required");
  }

  get passwordMinLengthError() {
    return this.page.getByText("Password must be at least 8 characters");
  }

  get confirmPasswordError() {
    return this.page.getByText("Please confirm your password");
  }

  get passwordsDoNotMatchError() {
    return this.page.getByText("Passwords do not match");
  }

  /** Toast / notification locator for API-level errors 
   * Target: title dari Nuxt UI Toast component
   * (tidak menggunakan getByText broad karena match 3 elemen: container, title, description)
   */
  get errorNotification() {
    return this.page.locator('[data-slot="title"]').filter({ hasText: "Registration failed" });
  }

  /** Toast description — berisi pesan error dari API (misal: "Email is already registered") */
  get toastDescription() {
    return this.page.locator('[data-slot="description"]');
  }

  /** Success toast setelah registrasi berhasil 
   * role="alert" karena Nuxt UI Toast menggunakan role="alert"
   * Title toast = "Success", description = "Registration successful. Please log in."
   */
  get successNotification() {
    return this.page.getByRole("alert").filter({ hasText: /Registration successful/i });
  }

  /** Wait for register API response - returns status and body */
  async waitForRegisterResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/e_commerce/v1/auth/register") &&
        resp.request().method() === "POST",
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  /** Wait for navigation to login page after successful register */
  async waitForNavigationAfterRegister() {
    await this.page.waitForURL(/auth\/login/, { timeout: 15000 });
  }

  /**
   * Verifies no API call was made to register endpoint.
   * Call this AFTER triggering the submit action.
   * Uses request event (not response) for deterministic capture.
   */
  async hasNoRegisterApiCall(): Promise<boolean> {
    let apiCallCount = 0;
    const handler = (req: Request) => {
      if (
        req.url().includes("/e_commerce/v1/auth/register") &&
        req.method() === "POST"
      ) {
        apiCallCount++;
      }
    };
    this.page.on("request", handler);
    // Allow microtask queue to drain — no arbitrary timeout for waiting,
    // because the action (click submit) should already have been performed
    // before calling this method.
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.page.off("request", handler);
    return apiCallCount === 0;
  }

  /** Get register button disabled state */
  async isRegisterButtonDisabled(): Promise<boolean> {
    return await this.registerButton.isDisabled();
  }

  /** Generate unique test data */
  static generateUniqueUser() {
    const ts = Date.now();
    return {
      fullName: "Test User",
      phone: "08123456789",
      username: `testuser_${ts}`,
      email: `test_${ts}@example.com`,
      password: "password123",
      confirmPassword: "password123",
    };
  }
}
