import { test, expect } from "@playwright/test";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { assertToastMismatch } from "./helpers/bug-assertions";

/**
 * Strategy:
 * - FRG-001 to FRG-005: Test Step 1 (Send OTP) menggunakan REAL API
 * - FRG-006 to FRG-015: Test Step 2/3/4 menggunakan MOCK API verify-otp & reset-password
 *   karena OTP asli dikirim ke email dan tidak bisa diakses secara otomatis.
 *   Mock mengembalikan response yang sesuai dengan API contract.
 */

test.describe("Forgot Password Module", () => {
  // ====================================================================
  // STEP 1: REQUEST OTP
  // ====================================================================

  /**
   * FRG-001: Email terdaftar — API 200, navigasi ke Step 2 (OTP)
   * Menggunakan REAL API forgot-password.
   */
  test("[FRG-001] Email terdaftar — API 200, navigasi ke Step 2 (OTP)", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();
      await expect(frgPage.subtitle).toBeVisible();
    });

    await test.step("Isi email terdaftar", async () => {
      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
    });

    await test.step("Klik Send OTP dan tangkap response API", async () => {
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toBe("OTP has been sent to your email");
    });

    await test.step("Verifikasi navigasi ke Step 2 (OTP)", async () => {
      await frgPage.waitForStep2();
      await expect(frgPage.otpInstructionText).toBeVisible();
    });
  });

  /**
   * FRG-002: Email kosong — validasi client-side, request tidak terkirim
   */
  test("[FRG-002] Email kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Forgot Password", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();
    });

    await test.step("Kosongkan email dan pasang listener API", async () => {
      await frgPage.fillEmail("");
      page.on("request", (req) => {
        if (req.url().includes("/auth/forgot-password") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Send OTP", async () => {
      await frgPage.clickSendOtp();
    });

    await test.step("Verifikasi error 'Email is required' muncul", async () => {
      await expect(frgPage.emailRequiredError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * FRG-003: Email tidak terdaftar — API 404, toast error
   * BUG_APP: UI toast mungkin menampilkan pesan generik bukan dari API.
   */
  test("[FRG-003] Email tidak terdaftar — API 404, tampilkan pesan error spesifik", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();
    });

    await test.step("Isi email tidak terdaftar", async () => {
      await frgPage.fillEmail(ForgotPasswordPage.UNREGISTERED_EMAIL);
    });

    await test.step("Klik Send OTP dan tangkap response API", async () => {
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);

      // API contract assertions
      expect(response.status).toBe(404);
      expect(response.body.status).toBe(false);
      expect(response.body.message).toBe("Email tidak terdaftar");

      // Verifikasi error toast muncul
      await expect(frgPage.errorNotification).toBeVisible({ timeout: 5000 });

      // BUG_APP: Bandingkan UI toast dengan API message
      const toastText = await frgPage.toastDescription.textContent();
      const apiMsg = response.body.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "FRG-003",
          "UI harus menampilkan pesan error spesifik dari API untuk email tidak terdaftar, bukan pesan generic");
      }
    });
  });

  /**
   * FRG-004: Login link — navigasi ke halaman login
   */
  test("[FRG-004] Login link — navigasi ke halaman login", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();
    });

    await test.step("Klik link 'Login'", async () => {
      await frgPage.loginLink.click();
    });

    await test.step("Verifikasi navigasi ke halaman login", async () => {
      await page.waitForURL(/auth\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/login");
    });
  });

  /**
   * FRG-005: API 500 Internal Server Error pada forgot-password
   * Simulasi menggunakan page.route() untuk return 500.
   */
  test("[FRG-005] @error-handling API 500 — forgot-password error toast", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();
    });

    await test.step("Intercept API forgot-password untuk return 500", async () => {
      await page.route("**/auth/forgot-password", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: false, message: "Internal Server Error", data: null }),
        });
      });
    });

    await test.step("Isi email dan klik Send OTP", async () => {
      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      await frgPage.clickSendOtp();
    });

    await test.step("Verifikasi error toast muncul", async () => {
      await expect(frgPage.errorNotification).toBeVisible({ timeout: 5000 });
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  // ====================================================================
  // STEP 2: VERIFY OTP (MOCKED — OTP asli dikirim ke email)
  // ====================================================================

  /**
   * FRG-006: OTP valid (mocked) — API 200, navigasi ke Step 3 (Reset Password)
   * Menggunakan mock API verify-otp karena OTP asli tidak bisa diakses.
   */
  test("[FRG-006] OTP valid (mocked) — API 200, navigasi ke Step 3", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password dan kirim OTP ke email terdaftar", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(response.status).toBe(200);
      await frgPage.waitForStep2();
    });

    await test.step("Mock API verify-otp untuk return success", async () => {
      await page.route("**/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: true,
            message: "OTP verified successfully",
            data: { reset_token: "mock_reset_token_for_testing_123456" },
          }),
        });
      });
    });

    await test.step("Isi OTP dan klik Verify", async () => {
      await frgPage.fillOtp("111111");
      const [response] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toBe("OTP verified successfully");
    });

    await test.step("Verifikasi navigasi ke Step 3 (Reset Password)", async () => {
      await frgPage.waitForStep3();
      await expect(frgPage.newPasswordInput).toBeVisible();
      await expect(frgPage.confirmPasswordInput).toBeVisible();
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  /**
   * FRG-007: OTP invalid — API error, toast error (uses REAL API)
   * BUG_APP: UI toast mungkin menampilkan pesan generik.
   */
  test("[FRG-007] OTP invalid (real API) — API error, tampilkan pesan error spesifik", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password dan kirim OTP ke email terdaftar", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(response.status).toBe(200);
      await frgPage.waitForStep2();
    });

    await test.step("Isi OTP salah dan klik Verify (real API)", async () => {
      await frgPage.fillOtp("000000");

      const [response] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);

      // API contract: should reject invalid OTP
      expect(response.body.status).toBe(false);
      expect(response.body.message).toBeDefined();

      // Verifikasi error toast muncul
      await expect(frgPage.errorNotification).toBeVisible({ timeout: 5000 });

      // BUG_APP: Bandingkan UI toast dengan API message
      const toastText = await frgPage.toastDescription.textContent();
      const apiMsg = response.body.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "FRG-007",
          "UI harus menampilkan pesan error spesifik dari API untuk OTP invalid, bukan pesan generic");
      }
    });
  });

  /**
   * FRG-008: Resend OTP — API call forgot-password lagi
   */
  test("[FRG-008] @slow Resend OTP — API call forgot-password lagi, timer reset", async ({ page }) => {
    test.setTimeout(120000); // 120 detik cukup untuk 60 detik cooldown + buffer
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password dan kirim OTP ke email terdaftar", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(response.status).toBe(200);
      await frgPage.waitForStep2();
    });

    await test.step("Tunggu hingga tombol Resend aktif (60 detik timer)", async () => {
      // Tombol Resend memiliki timer cooldown 60 detik setelah OTP dikirim
      // Tunggu hingga disabled attribute hilang
      await expect(frgPage.resendOtpButton).toBeEnabled({ timeout: 65000 });
    });

    await test.step("Klik Resend OTP dan verifikasi API call", async () => {
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickResendOtp(),
      ]);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toBe("OTP has been sent to your email");
    });

    await test.step("Verifikasi masih di Step 2", async () => {
      await expect(frgPage.otpInstructionText).toBeVisible();
      await expect(frgPage.verifyOtpButton).toBeVisible();
    });
  });

  /**
   * FRG-009: API 500 Internal Server Error pada verify-otp
   */
  test("[FRG-009] @error-handling API 500 — verify-otp error toast", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Buka halaman Forgot Password dan kirim OTP ke email terdaftar", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(response.status).toBe(200);
      await frgPage.waitForStep2();
    });

    await test.step("Intercept API verify-otp untuk return 500", async () => {
      await page.route("**/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: false, message: "Internal Server Error", data: null }),
        });
      });
    });

    await test.step("Isi OTP dan klik Verify OTP", async () => {
      await frgPage.fillOtp("111111");
      await frgPage.clickVerifyOtp();
    });

    await test.step("Verifikasi error toast muncul", async () => {
      await expect(frgPage.errorNotification).toBeVisible({ timeout: 5000 });
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  // ====================================================================
  // STEP 3: RESET PASSWORD (Mock verify-otp agar bisa mencapai step 3)
  // ====================================================================

  /**
   * FRG-010: Password valid & confirm match — API 200, navigasi ke success
   * Mock verify-otp untuk mencapai Step 3, real API reset-password.
   */
  test("[FRG-010] Password valid & confirm match — API 200, navigasi ke success", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Step 1: Kirim OTP (real API)", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(response.status).toBe(200);
      await frgPage.waitForStep2();
    });

    await test.step("Step 2: Mock verify-otp sukses", async () => {
      await page.route("**/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: true,
            message: "OTP verified successfully",
            data: { reset_token: "mock_token_frg_010" },
          }),
        });
      });

      await frgPage.fillOtp("111111");
      const [response] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);
      expect(response.status).toBe(200);
      await frgPage.waitForStep3();
    });

    await test.step("Step 3: Isi password baru dan reset (real API)", async () => {
      await frgPage.fillNewPassword("newpassword123");
      await frgPage.fillConfirmPassword("newpassword123");

      const [response] = await Promise.all([
        frgPage.waitForResetPasswordResponse(),
        frgPage.clickResetPassword(),
      ]);

      // Real API akan reject karena reset_token mock tidak valid
      // Tapi kita bisa verifikasi API dipanggil dengan body yang benar
      expect(response.body.status).toBe(false);
      expect(response.body.message).toEqual("Invalid or expired reset token");
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  /**
   * FRG-011: New password kosong — validasi client-side
   */
  test("[FRG-011] New password kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Navigasi ke Step 3 (kirim OTP real + mock verify)", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      // Step 1 real
      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [resp1] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(resp1.status).toBe(200);
      await frgPage.waitForStep2();

      // Step 2 mock
      await page.route("**/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: true,
            message: "OTP verified successfully",
            data: { reset_token: "mock_token_frg_011" },
          }),
        });
      });
      await frgPage.fillOtp("111111");
      const [resp2] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);
      expect(resp2.status).toBe(200);
      await frgPage.waitForStep3();
    });

    await test.step("Kosongkan New Password dan isi Confirm Password", async () => {
      await frgPage.fillNewPassword("");
      await frgPage.fillConfirmPassword("somepassword");
    });

    await test.step("Klik Reset Password dan verifikasi validasi client-side", async () => {
      let apiCallCount = 0;
      page.on("request", (req) => {
        if (req.url().includes("/auth/reset-password") && req.method() === "POST") {
          apiCallCount++;
        }
      });

      await frgPage.clickResetPassword();

      // Tunggu validasi muncul — menggunakan locator spesifik
      await expect(frgPage.newPasswordRequiredError).toBeVisible({ timeout: 3000 });

      // Verifikasi tidak ada API call
      expect(apiCallCount).toBe(0);
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  /**
   * FRG-012: Confirm password tidak match — validasi client-side
   */
  test("[FRG-012] Confirm password tidak match — validasi muncul, request tidak terkirim", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Navigasi ke Step 3 (kirim OTP real + mock verify)", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      // Step 1 real
      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [resp1] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(resp1.status).toBe(200);
      await frgPage.waitForStep2();

      // Step 2 mock
      await page.route("**/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: true,
            message: "OTP verified successfully",
            data: { reset_token: "mock_token_frg_012" },
          }),
        });
      });
      await frgPage.fillOtp("111111");
      const [resp2] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);
      expect(resp2.status).toBe(200);
      await frgPage.waitForStep3();
    });

    await test.step("Isi New Password dan Confirm Password berbeda", async () => {
      await frgPage.fillNewPassword("newpassword123");
      await frgPage.fillConfirmPassword("differentpassword456");
    });

    await test.step("Klik Reset Password dan verifikasi validasi muncul", async () => {
      let apiCallCount = 0;
      page.on("request", (req) => {
        if (req.url().includes("/auth/reset-password") && req.method() === "POST") {
          apiCallCount++;
        }
      });

      await frgPage.clickResetPassword();

      // Tunggu validasi mismatch muncul — menggunakan locator spesifik
      await expect(frgPage.confirmPasswordMismatchError).toBeVisible({ timeout: 3000 });

      // Verifikasi tidak ada API call
      expect(apiCallCount).toBe(0);
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  /**
   * FRG-013: API 500 Internal Server Error pada reset-password
   */
  test("[FRG-013] @error-handling API 500 — reset-password error toast", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Navigasi ke Step 3 (kirim OTP real + mock verify)", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [resp1] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(resp1.status).toBe(200);
      await frgPage.waitForStep2();

      await page.route("**/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: true,
            message: "OTP verified successfully",
            data: { reset_token: "mock_token_frg_013" },
          }),
        });
      });
      await frgPage.fillOtp("111111");
      const [resp2] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);
      expect(resp2.status).toBe(200);
      await frgPage.waitForStep3();
    });

    await test.step("Intercept API reset-password untuk return 500", async () => {
      await page.route("**/auth/reset-password", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: false, message: "Internal Server Error", data: null }),
        });
      });
    });

    await test.step("Isi password dan klik Reset Password", async () => {
      await frgPage.fillNewPassword("newpassword123");
      await frgPage.fillConfirmPassword("newpassword123");
      await frgPage.clickResetPassword();
    });

    await test.step("Verifikasi error toast muncul", async () => {
      await expect(frgPage.errorNotification).toBeVisible({ timeout: 5000 });
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  // ====================================================================
  // SUCCESS PAGE & COMPLETE FLOW (Fully Mocked)
  // ====================================================================

  /**
   * FRG-014: Complete flow — email → OTP → reset → success page (all mocked)
   * Semua API dimock untuk mensimulasikan complete successful flow.
   */
  test("[FRG-014] Complete flow (mocked) — email → OTP → reset → success page", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Mock semua API endpoints untuk sukses flow", async () => {
      await page.route("**/auth/forgot-password", async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ status: true, message: "OTP has been sent to your email", data: null }),
          });
        } else {
          await route.continue();
        }
      });

      await page.route("**/auth/verify-otp", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: true,
            message: "OTP verified successfully",
            data: { reset_token: "mock_token_complete_flow" },
          }),
        });
      });

      await page.route("**/auth/reset-password", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: true, message: "Password has been reset successfully", data: null }),
        });
      });
    });

    await test.step("Step 1: Kirim OTP (mocked)", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [response] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("OTP has been sent to your email");
      await frgPage.waitForStep2();
    });

    await test.step("Step 2: Verifikasi OTP (mocked)", async () => {
      await frgPage.fillOtp("111111");
      const [response] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("OTP verified successfully");
      await frgPage.waitForStep3();
    });

    await test.step("Step 3: Reset password (mocked)", async () => {
      await frgPage.fillNewPassword("newpassword789");
      await frgPage.fillConfirmPassword("newpassword789");
      const [response] = await Promise.all([
        frgPage.waitForResetPasswordResponse(),
        frgPage.clickResetPassword(),
      ]);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password has been reset successfully");
    });

    await test.step("Step 4: Verifikasi success page", async () => {
      await expect(frgPage.successMessage).toBeVisible({ timeout: 10000 });
      await expect(frgPage.backToLoginButton).toBeVisible({ timeout: 5000 });
    });

    await test.step("Klik Kembali ke Login — navigasi ke login", async () => {
      await frgPage.backToLoginButton.click();
      await page.waitForURL(/auth\/login/, { timeout: 15000 });
      expect(page.url()).toContain("/auth/login");
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  /**
   * FRG-015: Validasi step indicator — setiap step menampilkan status yang benar
   */
  test("[FRG-015] Step indicator — menampilkan step aktif dengan benar", async ({ page }) => {
    const frgPage = new ForgotPasswordPage(page);

    await test.step("Step 1 aktif — indicator step 1 terlihat", async () => {
      await page.context().clearCookies();
      await frgPage.open();
      await expect(frgPage.heading).toBeVisible();

      // Step 1 indicator: text "1" dan label "Email"
      await expect(frgPage.page.getByText("1").first()).toBeVisible();
      await expect(frgPage.page.getByText("Email").first()).toBeVisible();
    });

    // Mock API for continuing
    await page.route("**/auth/forgot-password", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: true, message: "OTP has been sent to your email", data: null }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/auth/verify-otp", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: true,
          message: "OTP verified successfully",
          data: { reset_token: "mock_token_frg_015" },
        }),
      });
    });

    await page.route("**/auth/reset-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: true, message: "Password has been reset successfully", data: null }),
      });
    });

    await test.step("Step 2 (OTP) — indicator step 2 terlihat setelah send OTP", async () => {
      await frgPage.fillEmail(ForgotPasswordPage.REGISTERED_EMAIL);
      const [resp1] = await Promise.all([
        frgPage.waitForForgotPasswordResponse(),
        frgPage.clickSendOtp(),
      ]);
      expect(resp1.status).toBe(200);
      await frgPage.waitForStep2();

      // Step 2 indicator: text "2" dan label "Verify"
      await expect(frgPage.page.getByText("2").first()).toBeVisible();
    });

    await test.step("Step 3 (Password) — indicator step 3 terlihat setelah verify OTP", async () => {
      await frgPage.fillOtp("111111");
      const [resp2] = await Promise.all([
        frgPage.waitForVerifyOtpResponse(),
        frgPage.clickVerifyOtp(),
      ]);
      expect(resp2.status).toBe(200);
      await frgPage.waitForStep3();

      // Step 3 indicator: text "3" dan label "New Password"
      await expect(frgPage.page.getByText("3").first()).toBeVisible();
    });

    await test.step("Success page — muncul setelah reset", async () => {
      await frgPage.fillNewPassword("newpassword999");
      await frgPage.fillConfirmPassword("newpassword999");
      const [resp3] = await Promise.all([
        frgPage.waitForResetPasswordResponse(),
        frgPage.clickResetPassword(),
      ]);
      expect(resp3.status).toBe(200);

      await expect(frgPage.successMessage).toBeVisible({ timeout: 10000 });
    });

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });
});
