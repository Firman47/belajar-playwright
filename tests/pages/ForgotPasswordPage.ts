import { type Page, type Locator, type Response, type Request } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class ForgotPasswordPage {
  readonly page: Page;
  // Step 1: Email
  readonly emailInput: Locator;
  readonly sendOtpButton: Locator;
  readonly loginLink: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  // Step 2: OTP
  readonly otpInputs: Locator;
  readonly hiddenOtpInput: Locator;
  readonly resendOtpButton: Locator;
  readonly verifyOtpButton: Locator;
  readonly otpInstructionText: Locator;
  // Step 3: Reset Password
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetPasswordButton: Locator;
  // Toast / Notification
  readonly errorNotification: Locator;
  readonly successNotification: Locator;
  readonly toastDescription: Locator;
  // Validation errors
  readonly emailRequiredError: Locator;
  readonly newPasswordRequiredError: Locator;
  readonly confirmPasswordMismatchError: Locator;
  // Step 4: Success
  readonly successMessage: Locator;
  readonly backToLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Step 1
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.sendOtpButton = page.getByRole("button", { name: /send otp/i });
    this.loginLink = page.getByRole("link", { name: "Login" });
    this.heading = page.getByRole("heading", { name: "Forgot Password" });
    this.subtitle = page.getByText("Reset your account password");
    // Step 2
    this.otpInputs = page.locator('input[placeholder="•"]');
    this.hiddenOtpInput = page.locator('input[name="otp"]');
    this.resendOtpButton = page.getByRole("button", { name: /resend/i });
    this.verifyOtpButton = page.getByRole("button", { name: /verify otp/i });
    this.otpInstructionText = page.getByText(/enter the otp code sent to/i);
    // Step 3
    this.newPasswordInput = page.getByRole("textbox", { name: "New Password" });
    this.confirmPasswordInput = page.getByRole("textbox", { name: "Confirm Password" });
    this.resetPasswordButton = page.getByRole("button", { name: /reset password/i });
    // Toast / Notification
    this.errorNotification = page.locator('li[role="alert"][data-slot="base"]').first();
    this.successNotification = page.getByRole("alert").filter({ hasText: /success|sent/i });
    this.toastDescription = page.locator('[data-slot="description"]');
    // Validation errors
    this.emailRequiredError = page.getByText("Email is required");
    this.newPasswordRequiredError = page.getByText("New password is required");
    this.confirmPasswordMismatchError = page.getByText("Passwords do not match");
    // Step 4: Success
    this.successMessage = page.getByText(/berhasil|password.*direset|reset.*success/i);
    this.backToLoginButton = page.getByRole("link", { name: /back to login/i });
  }

  async open() {
    await this.page.goto(`${BASE_URL}/auth/forgot-password`);
    await this.page.waitForLoadState("networkidle");
  }

  // === Step 1: Email ===
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async clickSendOtp() {
    await this.sendOtpButton.click();
  }

  // === Step 2: OTP ===
  async fillOtp(otp: string) {
    // Fill hidden input directly (most reliable)
    await this.hiddenOtpInput.fill(otp);
    // OTP PIN component (UPinInput) has 6 slots with placeholder "•"
    // Fill visible inputs for UI reactivity — the component needs all slots
    // filled before allowing submission
    const inputs = await this.otpInputs.all();
    for (let i = 0; i < inputs.length; i++) {
      await inputs[i].fill(otp[i] || "0");
    }
  }

  async clickVerifyOtp() {
    await this.verifyOtpButton.click();
  }

  async clickResendOtp() {
    await this.resendOtpButton.click();
  }

  // === Step 3: Reset Password ===
  async fillNewPassword(password: string) {
    await this.newPasswordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async clickResetPassword() {
    await this.resetPasswordButton.click();
  }

  // === API Response Interceptors ===
  async waitForForgotPasswordResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/e_commerce/v1/auth/forgot-password") &&
        resp.request().method() === "POST",
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  async waitForVerifyOtpResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/e_commerce/v1/auth/verify-otp") &&
        resp.request().method() === "POST",
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  async waitForResetPasswordResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse(
      (resp: Response) =>
        resp.url().includes("/e_commerce/v1/auth/reset-password") &&
        resp.request().method() === "POST",
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  // === Navigation Waits ===
  async waitForStep2() {
    await this.otpInstructionText.waitFor({ state: "visible", timeout: 10000 });
  }

  async waitForStep3() {
    await this.newPasswordInput.waitFor({ state: "visible", timeout: 10000 });
  }

  async waitForNavigationToLogin() {
    await this.page.waitForURL(/auth\/login/, { timeout: 15000 });
  }

  // === Duplicate Request Detection ===
  async hasNoForgotPasswordApiCall(): Promise<boolean> {
    let apiCallCount = 0;
    const handler = (req: Request) => {
      if (
        req.url().includes("/e_commerce/v1/auth/forgot-password") &&
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

  async hasNoVerifyOtpApiCall(): Promise<boolean> {
    let apiCallCount = 0;
    const handler = (req: Request) => {
      if (
        req.url().includes("/e_commerce/v1/auth/verify-otp") &&
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

  // === Static Factory for Test Data ===
  static generateTestEmail() {
    return `test_${Date.now()}@example.com`;
  }

  static readonly MOCK_OTP = "11111";
  static readonly REGISTERED_EMAIL = "firman@gmail.com";
  static readonly UNREGISTERED_EMAIL = "unregistered@example.com";
}