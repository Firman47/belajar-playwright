import { test, expect } from "@playwright/test";
import { RegisterPage } from "./pages/RegisterPage";
import { assertToastMismatch } from "./helpers/bug-assertions";

test.describe("Register Module", () => {
  /**
   * REG-001: Daftar dengan data valid
   * Expected: Akun berhasil dibuat, redirect ke halaman login
   */
  test("[REG-001] Daftar dengan data valid — redirect ke halaman login", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const uniqueUser = RegisterPage.generateUniqueUser();

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan data valid", async () => {
      await registerPage.fillRegistrationForm(uniqueUser);
    });

    await test.step("Klik Register dan tunggu response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toBe("Registration successful. Please log in.");
    });

    await test.step("Verifikasi success toast muncul (docs: success → toast)", async () => {
      await expect(registerPage.successNotification).toBeVisible({ timeout: 5000 });
      await expect(registerPage.toastDescription).toHaveText("Registration successful. Please log in.");
    });

    await test.step("Verifikasi redirect ke halaman login", async () => {
      await registerPage.waitForNavigationAfterRegister();
      expect(page.url()).toContain("/auth/login");
    });
  });

  /**
   * REG-002: Full Name kosong
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-002] Full Name kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form, Full Name dikosongkan", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.fullNameInput.fill("");
    });

    await test.step("Pasang listener untuk deteksi API call", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Full name is required' muncul (auto-wait)", async () => {
      await expect(registerPage.fullNameError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-003: Email sudah terdaftar
   * Expected: API mengembalikan 409, UI menampilkan pesan error sesuai API
   * BUG_APP: UI toast description = "Registration failed" (generic),
   * bukan "Email is already registered" dari API → API message ≠ UI message
   */
  test("[REG-003] Email sudah terdaftar — tampilkan pesan error spesifik", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = RegisterPage.generateUniqueUser();

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan email yang sudah terdaftar (firman@gmail.com)", async () => {
      await registerPage.fillRegistrationForm({
        ...user,
        email: "firman@gmail.com",
      });
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);

      // API mengembalikan 409
      expect(response.status).toBe(409);
      expect(response.body.status).toBe(false);
      expect(response.body.message).toBe("Email is already registered");

      // Verifikasi: UI menampilkan error toast
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });

      // BUG_APP: UI toast ≠ API message — assertion FAIL untuk dokumentasi bug
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await registerPage.toastDescription.textContent();
      const apiMsg = response.body.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "REG-003",
          "UI harus menampilkan pesan 'Email is already registered' dari API, bukan pesan generic");
      }
    });

    await test.step("Verifikasi tetap di halaman Register (tidak redirect)", async () => {
      expect(page.url()).toContain("/auth/register");
    });
  });

  /**
   * REG-004: Email kosong
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-004] Email kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form, Email dikosongkan", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.emailInput.fill("");
    });

    await test.step("Pasang listener untuk deteksi API call", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Email is required' muncul (auto-wait)", async () => {
      await expect(registerPage.emailError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-005: Format email tidak valid
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-005] Format email tidak valid — validasi muncul, request tidak terkirim", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan email invalid 'invalid-email'", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.emailInput.fill("invalid-email");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Please enter a valid email address' muncul (auto-wait)", async () => {
      await expect(registerPage.invalidEmailError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-006: Username kosong
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-006] Username kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form, Username dikosongkan", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.usernameInput.fill("");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Username is required' muncul (auto-wait)", async () => {
      await expect(registerPage.usernameError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-007: Username sudah terdaftar
   * Expected: API mengembalikan 409 dengan "Username is already taken", UI menampilkan error sesuai API
   * BUG_APP: UI toast description = "Registration failed" (generic),
   * bukan "Username is already taken" dari API → API message ≠ UI message
   */
  test("[REG-007] Username sudah terdaftar — tampilkan pesan error spesifik", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = RegisterPage.generateUniqueUser();

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan username yang sudah terdaftar (firman)", async () => {
      await registerPage.fillRegistrationForm({
        ...user,
        username: "firman",
      });
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);

      // API mengembalikan 409
      expect(response.status).toBe(409);
      expect(response.body.status).toBe(false);
      expect(response.body.message).toBe("Username is already taken");

      // Verifikasi: UI menampilkan error toast
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });

      // BUG_APP: UI toast ≠ API message — assertion FAIL untuk dokumentasi bug
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await registerPage.toastDescription.textContent();
      const apiMsg = response.body.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "REG-007",
          "UI harus menampilkan pesan 'Username is already taken' dari API, bukan pesan generic");
      }
    });

    await test.step("Verifikasi tetap di halaman Register (tidak redirect)", async () => {
      expect(page.url()).toContain("/auth/register");
    });
  });

  /**
   * REG-008: Format username tidak valid (terlalu pendek)
   * Expected: Validasi min-length muncul, request tidak terkirim
   */
  test("[REG-008] Format username tidak valid (min 4 karakter) — validasi muncul", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan username 'ab' (terlalu pendek)", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.usernameInput.fill("ab");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Username must be at least 4 characters' muncul (auto-wait)", async () => {
      await expect(registerPage.usernameMinLengthError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-009: Password kosong
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-009] Password kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form, Password dikosongkan", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.passwordInput.fill("");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Password is required' muncul (auto-wait)", async () => {
      await expect(registerPage.passwordError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-010: Password kurang dari minimum (8 karakter)
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-010] Password kurang dari 8 karakter — validasi muncul", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan password pendek 'short'", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.passwordInput.fill("short");
      await registerPage.confirmPasswordInput.fill("short");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Password must be at least 8 characters' muncul (auto-wait)", async () => {
      await expect(registerPage.passwordMinLengthError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-011: Password melebihi 300 karakter
   * Observasi: Password input tidak memiliki atribut maxlength.
   * Baik client-side (Zod) maupun server-side tidak memvalidasi max-length password.
   * Password 300 karakter diterima dan registrasi berhasil (200).
   */
  test("[REG-011] Password 300 karakter — lolos semua validasi, registrasi sukses", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan password 300 karakter", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.passwordInput.fill("a".repeat(300));
      await registerPage.confirmPasswordInput.fill("a".repeat(300));
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      // API menerima password 300 karakter dan registrasi sukses
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });

    await test.step("Verifikasi redirect ke halaman login", async () => {
      await registerPage.waitForNavigationAfterRegister();
      expect(page.url()).toContain("/auth/login");
    });
  });

  /**
   * REG-012: Konfirmasi password kosong
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-012] Konfirmasi password kosong — validasi muncul", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form, Confirm Password dikosongkan", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.confirmPasswordInput.fill("");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Please confirm your password' muncul (auto-wait)", async () => {
      await expect(registerPage.confirmPasswordError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-013: Konfirmasi password tidak sesuai
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-013] Konfirmasi password tidak sesuai — validasi muncul", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan password dan confirm password berbeda", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.passwordInput.fill("password123");
      await registerPage.confirmPasswordInput.fill("differentpassword");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Passwords do not match' muncul (auto-wait)", async () => {
      await expect(registerPage.passwordsDoNotMatchError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-014: Klik Daftar berkali-kali
   * Expected: Tidak membuat akun duplikat (requirement terpenuhi via server)
   * Observasi: Tombol tidak disabled saat loading, multiple requests terkirim
   * Tapi server berhasil mencegah duplikasi (hanya 1 akun terbuat)
   */
  test("[REG-014] Klik Register berkali-kali — tidak ada duplikasi akun (server handles idempotency)", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = RegisterPage.generateUniqueUser();
    const requests: string[] = [];
    const responses: { status: number; message: string }[] = [];

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan data valid", async () => {
      await registerPage.fillRegistrationForm(user);
    });

    await test.step("Pasang listener request & response", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          requests.push(req.url());
        }
      });
      page.on("response", async (res) => {
        if (res.url().includes("/auth/register") && res.request().method() === "POST") {
          const body = await res.json().catch(() => ({ message: "unknown" }));
          responses.push({ status: res.status(), message: body.message as string });
        }
      });
    });

    await test.step("Klik Register 5x cepat via Playwright dispatch", async () => {
      // Gunakan Playwright locator untuk trigger multiple clicks
      for (let i = 0; i < 5; i++) {
        await registerPage.registerButton.click({ force: true });
      }
      await page.waitForTimeout(3000);
    });

    await test.step("Analisis jumlah request dan response", async () => {
      // Verifikasi: tidak ada akun duplikat terbuat (hanya 1 sukses)
      const successResponses = responses.filter((r) => r.status === 200);
      expect(successResponses.length).toBe(1);

      // Jika ada lebih dari 1 request, sisanya harus conflict (409)
      if (requests.length > 1) {
        const conflictResponses = responses.filter((r) => r.status === 409);
        expect(conflictResponses.length).toBeGreaterThanOrEqual(1);
      }

      // Observasi: tombol tidak disabled saat loading (UX issue)
      // Tidak ada requirement yang menyebut button harus disabled saat loading
      // Test ini PASS pada requirement utama (idempotency terpenuhi)
    });
  });

  /**
   * REG-015: Phone Number kosong
   * Expected: Validasi muncul, request tidak terkirim
   */
  test("[REG-015] Phone Number kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form, Phone dikosongkan", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.phoneInput.fill("");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Phone number is required' muncul (auto-wait)", async () => {
      await expect(registerPage.phoneNumberError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-017: Username melebihi maksimum karakter (300 karakter)
   * Client-side: tidak ada validasi maxlength
   * Server-side: API 400
   * UI toast: "Registration failed" (generic)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-017] Username 300 karakter — validasi maxlength tidak ada", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;
    let responseBody: Record<string, unknown> | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan username 300 karakter", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.usernameInput.fill("a".repeat(300));
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      responseBody = response.body as Record<string, unknown>;
      expect(responseStatus).toBe(400);
      expect(responseBody?.status).toBe(false);
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ API validation message
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await registerPage.toastDescription.textContent();
      const apiMsg = responseBody?.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "REG-017",
          "UI harus menampilkan pesan validasi spesifik dari API untuk username 300 karakter, bukan pesan generic");
      }
    });
  });

  /**
   * REG-018: Full Name melebihi maksimum karakter (300 karakter)
   * Client-side: tidak ada validasi maxlength
   * Server-side: API 400 "Registration failed" (generic)
   * UI toast: "Registration failed" — API=UI konsisten
   */
  test("[REG-018] Full Name 300 karakter — API 400, UI toast konsisten", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;
    let responseBody: Record<string, unknown> | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan Full Name 300 karakter", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.fullNameInput.fill("A".repeat(300));
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      responseBody = response.body as Record<string, unknown>;
      expect(responseStatus).toBe(400);
      expect(responseBody?.status).toBe(false);
    });

    await test.step("Verifikasi UI toast konsisten dengan API message", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // Bandingkan UI toast dengan API response message
      await expect(registerPage.toastDescription).toHaveText(responseBody?.message as string);
    });
  });

  /**
   * REG-019: Email melebihi maksimum karakter (>254 karakter)
   * Client-side: tidak ada validasi maxlength
   * Server-side: API 400
   * UI toast: "Registration failed" (generic)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-019] Email 300 karakter — validasi maxlength tidak ada", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;
    let responseBody: Record<string, unknown> | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan email 300 karakter", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.emailInput.fill("a".repeat(290) + "@example.com");
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      responseBody = response.body as Record<string, unknown>;
      expect(responseStatus).toBe(400);
      expect(responseBody?.status).toBe(false);
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ API validation message
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await registerPage.toastDescription.textContent();
      const apiMsg = responseBody?.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "REG-019",
          "UI harus menampilkan pesan validasi spesifik dari API untuk email 300 karakter, bukan pesan generic");
      }
    });
  });
  test("[REG-021] Phone 300 karakter — API 400, UI toast konsisten", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;
    let responseBody: Record<string, unknown> | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan phone 300 digit", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.phoneInput.fill("1".repeat(300));
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      responseBody = response.body as Record<string, unknown>;
      // API dapat mengembalikan 429 (Too Many Requests) jika rate limit tercapai
      expect([400, 429]).toContain(responseStatus);
      if (responseStatus === 400) {
        expect(responseBody?.status).toBe(false);
      }
    });

    await test.step("Verifikasi UI toast konsisten dengan API message", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // Bandingkan UI toast dengan API response message
      if (responseBody?.message) {
        await expect(registerPage.toastDescription).toHaveText(responseBody.message as string);
      }
    });
  });

  /**
   * REG-022: Username mengandung karakter ilegal (@#$%)
   * Client-side: tidak ada validasi pattern
   * Server-side: API 400
   * UI toast: "Registration failed" (generic)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-022] Username karakter ilegal @#$% — validasi karakter tidak ada", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;
    let responseBody: Record<string, unknown> | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan username mengandung @#$%", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.usernameInput.fill("user@#$%");
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      responseBody = response.body as Record<string, unknown>;
      expect(responseStatus).toBe(400);
      expect(responseBody?.status).toBe(false);
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ API validation message
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await registerPage.toastDescription.textContent();
      const apiMsg = responseBody?.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "REG-022",
          "UI harus menampilkan pesan validasi spesifik dari API untuk username karakter ilegal, bukan pesan generic");
      }
    });
  });

  /**
   * REG-024: Email mengandung spasi
   * Client-side: validasi HTML5 type="email" muncul "Please enter a valid email address"
   * No API call terkirim
   * PASS
   */
  test("[REG-024] Email mengandung spasi — validasi client-side muncul, no API call", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan email mengandung spasi", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.emailInput.fill("test with space@example.com");
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi error 'Please enter a valid email address' muncul (auto-wait)", async () => {
      await expect(registerPage.invalidEmailError).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call terkirim", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  /**
   * REG-025: Username mengandung spasi
   * Client-side: tidak ada validasi
   * Server-side: API 400
   * UI toast: "Registration failed" (generic)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-025] Username mengandung spasi — validasi tidak ada", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;
    let responseBody: Record<string, unknown> | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan username mengandung spasi", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.usernameInput.fill("user name with spaces");
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      responseBody = response.body as Record<string, unknown>;
      expect(responseStatus).toBe(400);
      expect(responseBody?.status).toBe(false);
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ API validation message
      // Guard condition: jika toast ≠ API → assertToastMismatch throw error → test FAIL
      const toastText = await registerPage.toastDescription.textContent();
      const apiMsg = responseBody?.message as string;
      if (toastText !== apiMsg) {
        assertToastMismatch(toastText, apiMsg, "REG-025",
          "UI harus menampilkan pesan validasi spesifik dari API untuk username dengan spasi, bukan pesan generic");
      }
    });
  });

  /**
   * REG-026: API mengembalikan 500 Internal Server Error
   * Simulasi menggunakan page.route() untuk intercept request dan return 500
   * UI harus menampilkan error toast
   */
  test("[REG-026] API 500 Internal Server Error — UI tampilkan error toast", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Intercept API register untuk return 500", async () => {
      await page.route("**/auth/register", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: false, message: "Internal Server Error", data: null }),
        });
      });
    });

    await test.step("Isi form dengan data valid", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
    });

    await test.step("Klik Register dan verifikasi error toast muncul", async () => {
      // Route intercept langsung return 500 tanpa real API call
      await registerPage.clickRegister();
      // Tunggu toast error muncul (auto-wait)
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
    });
  });

  /**
   * REG-027: API timeout
   * Simulasi menggunakan page.route() untuk delay request > 20 detik
   * UI harus menampilkan error handling (timeout atau error toast)
   */
  test("[REG-027] API timeout — UI tampilkan error handling", async ({ page }) => {
    test.setTimeout(60000);
    const registerPage = new RegisterPage(page);

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Intercept API register untuk abort setelah delay", async () => {
      await page.route("**/auth/register", async (route) => {
        // Delay 15 detik untuk simulate timeout, lalu abort
        await new Promise((resolve) => setTimeout(resolve, 15000));
        await route.abort("timedout");
      });
    });

    await test.step("Isi form dengan data valid", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
    });

    await test.step("Klik Register dan verifikasi error toast muncul", async () => {
      await registerPage.clickRegister();
      // Tunggu hingga toast error muncul (abort setelah 15 detik delay)
      // Jika tidak muncul dalam 20 detik → BUG_APP (no timeout error handling)
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 20000 });
    });
  });

  /**
   * REG-028: Network error / offline
   * Simulasi menggunakan page.route() untuk abort request
   * UI harus menampilkan error handling untuk network error
   */
  test("[REG-028] Network error — UI tampilkan error handling", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Intercept API register untuk abort (network error)", async () => {
      await page.route("**/auth/register", async (route) => {
        await route.abort("internetdisconnected");
      });
    });

    await test.step("Isi form dengan data valid", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
    });

    await test.step("Klik Register dan verifikasi error toast muncul", async () => {
      await registerPage.clickRegister();
      // Jika toast tidak muncul → BUG_APP (no network error handling)
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
    });
  });

});

