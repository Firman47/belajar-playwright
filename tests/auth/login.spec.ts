import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { assertToastMismatch } from "../helpers/bug-assertions";

test.describe("Login Module", () => {
  /**
   * AUTH-001: Login dengan kredensial valid
   * Expected: API 200, redirect ke homepage
   */
  test("[AUTH-001] Login dengan kredensial valid — redirect ke homepage", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan kredensial valid", async () => {
      await loginPage.fillUsername("firman");
      await loginPage.fillPassword("password");
    });

    await test.step("Klik Login dan tunggu response API", async () => {
      const [response] = await Promise.all([
        loginPage.waitForLoginResponse(),
        loginPage.clickLogin(),
      ]);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toBe("Login successful");
    });

    await test.step("Verifikasi redirect ke homepage", async () => {
      await loginPage.waitForNavigationAfterLogin();
      // Terima baik dengan trailing slash maupun tanpa
      expect(page.url()).toMatch(/^https:\/\/store\.olpos\.id\/kurostoreid\/?$/);
    });
  });

  /**
   * AUTH-002: Password salah
   * Expected: API 401, toast "Login failed"
   * BUG_APP: UI toast "Login failed" ≠ API "Invalid username or password"
   */
  test("[AUTH-002] Password salah — tampilkan pesan error spesifik", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan password salah", async () => {
      await loginPage.fillUsername("firman");
      await loginPage.fillPassword("wrongpassword");
    });

    await test.step("Klik Login dan tangkap response API", async () => {
      const [response] = await Promise.all([
        loginPage.waitForLoginResponse(),
        loginPage.clickLogin(),
      ]);

      // API mengembalikan 401
      expect(response.status).toBe(401);
      expect(response.body.status).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");

      // Verifikasi: UI menampilkan error toast
      await expect(loginPage.errorNotification).toBeVisible({ timeout: 5000 });

      // BUG_APP: UI toast ≠ API message — assertion FAIL untuk dokumentasi bug
      // UI toast description = "Login failed" tapi API message = "Invalid username or password"
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await loginPage.toastDescription.textContent();
      const apiMsg = response.body.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "AUTH-002",
          "UI harus menampilkan pesan error spesifik dari API, bukan pesan generic");
      }
    });
  });

  /**
   * AUTH-003: Username tidak terdaftar
   * Expected: API 401, toast "Login failed"
   * BUG_APP: UI toast "Login failed" ≠ API "Invalid username or password"
   */
  test("[AUTH-003] Username tidak terdaftar — tampilkan pesan error spesifik", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan username tidak terdaftar", async () => {
      await loginPage.fillUsername("nonexistent_user_12345");
      await loginPage.fillPassword("password");
    });

    await test.step("Klik Login dan tangkap response API", async () => {
      const [response] = await Promise.all([
        loginPage.waitForLoginResponse(),
        loginPage.clickLogin(),
      ]);

      // API mengembalikan 401
      expect(response.status).toBe(401);
      expect(response.body.status).toBe(false);
      expect(response.body.message).toBe("Invalid username or password");

      // Verifikasi: UI menampilkan error toast
      await expect(loginPage.errorNotification).toBeVisible({ timeout: 5000 });

      // BUG_APP: UI toast ≠ API message — assertion FAIL untuk dokumentasi bug
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await loginPage.toastDescription.textContent();
      const apiMsg = response.body.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "AUTH-003",
          "UI harus menampilkan pesan error spesifik dari API, bukan pesan generic");
      }
    });
  });

  /**
   * AUTH-004: Username kosong
   * Expected: Validasi client-side muncul, request tidak terkirim
   */
  test("[AUTH-004] Username kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const loginPage = new LoginPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Isi password, Username dikosongkan", async () => {
      await loginPage.fillUsername("");
      await loginPage.fillPassword("password");
    });

    await test.step("Pasang listener untuk deteksi API call", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/login") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Login", async () => {
      await loginPage.clickLogin();
    });

    await test.step("Verifikasi error 'Username is required' muncul (auto-wait)", async () => {
      await expect(loginPage.usernameRequiredError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * AUTH-005: Password kosong
   * Expected: Validasi client-side muncul, request tidak terkirim
   */
  test("[AUTH-005] Password kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const loginPage = new LoginPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Isi username, Password dikosongkan", async () => {
      await loginPage.fillUsername("firman");
      await loginPage.fillPassword("");
    });

    await test.step("Pasang listener untuk deteksi API call", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/login") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Login", async () => {
      await loginPage.clickLogin();
    });

    await test.step("Verifikasi error 'Password is required' muncul (auto-wait)", async () => {
      await expect(loginPage.passwordRequiredError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * AUTH-006: Semua field kosong
   * Expected: Kedua validasi muncul, request tidak terkirim
   */
  test("[AUTH-006] Semua field kosong — kedua validasi muncul, request tidak terkirim", async ({ page }) => {
    const loginPage = new LoginPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Kosongkan semua field", async () => {
      await loginPage.fillUsername("");
      await loginPage.fillPassword("");
    });

    await test.step("Pasang listener untuk deteksi API call", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/login") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Login", async () => {
      await loginPage.clickLogin();
    });

    await test.step("Verifikasi kedua error muncul (auto-wait)", async () => {
      await expect(loginPage.usernameRequiredError).toBeVisible();
      await expect(loginPage.passwordRequiredError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * AUTH-007: Show/Hide password toggle
   * Expected: Type input berubah password → text → password
   */
  test("[AUTH-007] Show/Hide password toggle — type input berubah", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Isi password", async () => {
      await loginPage.fillPassword("secret123");
    });

    await test.step("Verifikasi type awal = password", async () => {
      const typeBefore = await loginPage.passwordInput.getAttribute("type");
      expect(typeBefore).toBe("password");
    });

    await test.step("Klik Show password", async () => {
      await loginPage.toggleShowPassword();
    });

    await test.step("Verifikasi type berubah menjadi text", async () => {
      const typeAfterShow = await loginPage.passwordInput.getAttribute("type");
      expect(typeAfterShow).toBe("text");
    });

    await test.step("Klik Hide password", async () => {
      // Setelah klik Show, button berubah dari "Show password" jadi "Hide password"
      const passwordToggle = page.getByRole("button", { name: /password/i });
      await passwordToggle.click();
    });

    await test.step("Verifikasi type kembali menjadi password", async () => {
      const typeAfterHide = await loginPage.passwordInput.getAttribute("type");
      expect(typeAfterHide).toBe("password");
    });
  });

  /**
   * AUTH-008: Link "Forgot Password?" navigasi
   * Expected: Navigasi ke halaman forgot password
   */
  test("[AUTH-008] Link 'Forgot Password?' — navigasi ke forgot-password", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Klik link 'Forgot Password?'", async () => {
      await loginPage.forgotPasswordLink.click();
    });

    await test.step("Verifikasi navigasi ke forgot-password", async () => {
      await page.waitForURL(/auth\/forgot-password/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/forgot-password");
    });
  });

  /**
   * AUTH-009: Link "Register" navigasi
   * Expected: Navigasi ke halaman register
   */
  test("[AUTH-009] Link 'Register' — navigasi ke register", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Klik link 'Register'", async () => {
      await loginPage.registerLink.click();
    });

    await test.step("Verifikasi navigasi ke register", async () => {
      await page.waitForURL(/auth\/register/, { timeout: 10000 });
      expect(page.url()).toContain("/auth/register");
    });
  });

  /**
   * AUTH-010: Remember Me checkbox
   * Expected: Checkbox bisa dicentang dan diuncentang
   */
  test("[AUTH-010] Remember Me checkbox — bisa dicentang/uncentang", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman Login (pastikan logout dulu)", async () => {
      await page.context().clearCookies();
      await loginPage.open();
      await expect(loginPage.heading).toBeVisible();
    });

    await test.step("Verifikasi checkbox tidak tercentang awalnya", async () => {
      const isChecked = await loginPage.rememberMeCheckbox.isChecked();
      expect(isChecked).toBe(false);
    });

    await test.step("Centang checkbox via label", async () => {
      await loginPage.toggleRememberMe();
    });

    await test.step("Verifikasi checkbox tercentang", async () => {
      const isChecked = await loginPage.rememberMeCheckbox.isChecked();
      expect(isChecked).toBe(true);
    });

    await test.step("Uncentang checkbox via label", async () => {
      await loginPage.toggleRememberMe();
    });

    await test.step("Verifikasi checkbox tidak tercentang", async () => {
      const isChecked = await loginPage.rememberMeCheckbox.isChecked();
      expect(isChecked).toBe(false);
    });
  });
});
