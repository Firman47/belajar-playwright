import { test, expect } from "@playwright/test";
import { RegisterPage } from "./pages/RegisterPage";

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
  test("[REG-003] Email sudah terdaftar — API 409, UI mismatch toast description (BUG_APP)", async ({ page }) => {
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
      await expect(registerPage.toastDescription).toHaveText(response.body.message as string);
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
  test("[REG-007] Username sudah terdaftar — API 409, UI mismatch toast description (BUG_APP)", async ({ page }) => {
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
      await expect(registerPage.toastDescription).toHaveText(response.body.message as string);
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
   * REG-011: Password melebihi maksimum
   * Expected: Validasi max-length muncul, request tidak terkirim
   * Bug: Aplikasi tidak memiliki validasi max-length → test FAIL
   */
  test("[REG-011] Password melebihi maksimum — harus ada validasi max-length (BUG_APP)", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let apiCallCount = 0;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Verifikasi password input memiliki atribut maxlength", async () => {
      // Requirement: password harus memiliki batas maksimum karakter
      const maxLength = await registerPage.passwordInput.getAttribute("maxlength");
      expect(maxLength).not.toBeNull();
      const maxVal = parseInt(maxLength || "999", 10);
      expect(maxVal).toBeLessThanOrEqual(255);
    });

    await test.step("Pasang listener API", async () => {
      page.on("request", (req) => {
        if (req.url().includes("/auth/register") && req.method() === "POST") {
          apiCallCount++;
        }
      });
    });

    await test.step("Isi form dengan password 300 karakter", async () => {
      await registerPage.fillRegistrationForm(RegisterPage.generateUniqueUser());
      await registerPage.passwordInput.fill("a".repeat(300));
      await registerPage.confirmPasswordInput.fill("a".repeat(300));
    });

    await test.step("Klik Register", async () => {
      await registerPage.clickRegister();
    });

    await test.step("Verifikasi tidak ada API call terkirim (validasi harus block)", async () => {
      // Jika validasi max-length ada, browser akan truncate input
      // dan/atau validasi client-side akan mencegah submit
      expect(apiCallCount).toBe(0);
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

    await test.step("Klik Register 5x cepat via JavaScript dispatch", async () => {
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) {
          for (let i = 0; i < 5; i++) {
            (btn as HTMLButtonElement).click();
          }
        }
      });
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
   * REG-016: Format nomor telepon tidak valid (non-numeric)
   * Expected: Harus ada validasi format nomor telepon (client-side) ATAU API reject
   * BUG_APP: Tidak ada validasi — API menerima string non-numeric sebagai phone, return 200
   */
  test("[REG-016] Phone non-numeric — harus ada validasi format, tapi lolos (BUG_APP)", async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan phone non-numeric 'abc'", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.phoneInput.fill("abc");
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);

      // BUG_APP: API seharusnya reject phone non-numeric, tapi return 200
      // Assertion FAIL karena assert 400 tapi API return 200
      expect(response.status).toBe(400);
    });
  });

  /**
   * REG-017: Username melebihi maksimum karakter (300 karakter)
   * Client-side: tidak ada validasi maxlength (BUG_APP)
   * Server-side: API 400 "Username must be 3-64 characters..."
   * UI toast: "Registration failed" (generic, bukan API message)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-017] Username 300 karakter — API 400, UI toast generic (BUG_APP)", async ({ page }) => {
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
    });

    await test.step("Verifikasi API mengembalikan validation error spesifik", async () => {
      expect(responseBody?.status).toBe(false);
      expect(responseBody?.message).toBe("Validation failed");
      const data = responseBody?.data as Array<Record<string, unknown>> | undefined;
      expect(data).toBeDefined();
      expect(data?.[0]?.constraints).toBeDefined();
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ nested API validation message
      await expect(registerPage.toastDescription).toHaveText(responseBody?.message as string);
    });
  });

  /**
   * REG-018: Full Name melebihi maksimum karakter (300 karakter)
   * Client-side: tidak ada validasi maxlength
   * Server-side: API 400 "Registration failed" (generic)
   * UI toast: "Registration failed" — API=UI konsisten (PASS untuk konsistensi)
   * Catatan: tidak ada specific field-level error message
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

    await test.step("Verifikasi UI toast muncul dengan pesan yang konsisten dengan API", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // API message = "Registration failed", UI toast = "Registration failed" → konsisten
      await expect(registerPage.toastDescription).toHaveText("Registration failed");
    });
  });

  /**
   * REG-019: Email melebihi maksimum karakter (>254 karakter)
   * Client-side: tidak ada validasi maxlength
   * Server-side: API 400 "email must be an email"
   * UI toast: "Registration failed" (generic)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-019] Email 300 karakter — API 400, UI toast generic (BUG_APP)", async ({ page }) => {
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
      expect(responseBody?.message).toBe("Validation failed");
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ API "email must be an email"
      await expect(registerPage.toastDescription).toHaveText(responseBody?.message as string);
    });
  });

  /**
   * REG-020: Phone Number terlalu pendek (1 digit)
   * Client-side: tidak ada validasi min-length
   * Server-side: API 200 SUCCESS — seharusnya reject
   * BUG_APP: Tidak ada validasi minimal digit nomor telepon
   */
  test("[REG-020] Phone 1 digit — API 200 SUCCESS, tidak ada validasi (BUG_APP)", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan phone 1 digit '1'", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.phoneInput.fill("1");
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      // BUG_APP: API seharusnya reject phone 1 digit, tapi return 200
      expect(responseStatus).not.toBe(200);
    });
  });

  /**
   * REG-021: Phone Number terlalu panjang (300 karakter)
   * Client-side: tidak ada validasi maxlength
   * Server-side: API 400 generic "Registration failed"
   * UI toast: "Registration failed" — API=UI konsisten
   */
  test("[REG-021] Phone 300 karakter — API 400, UI toast konsisten", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;

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
      // API dapat mengembalikan 429 (Too Many Requests) jika rate limit tercapai
      expect([400, 429]).toContain(responseStatus);
      if (responseStatus === 400) {
        expect((response.body as Record<string, unknown>).status).toBe(false);
      }
    });

    await test.step("Verifikasi UI toast muncul", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      await expect(registerPage.toastDescription).toHaveText("Registration failed");
    });
  });

  /**
   * REG-022: Username mengandung karakter ilegal (@#$%)
   * Client-side: tidak ada validasi pattern
   * Server-side: API 400 "Username must be 3-64 characters and can only contain letters, numbers, dots, underscores, and hyphens"
   * UI toast: "Registration failed" (generic)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-022] Username karakter ilegal @#$% — API 400, UI toast generic (BUG_APP)", async ({ page }) => {
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
      expect(responseBody?.message).toBe("Validation failed");
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ API "Validation failed"
      await expect(registerPage.toastDescription).toHaveText(responseBody?.message as string);
    });
  });

  /**
   * REG-023: Phone Number mengandung huruf atau simbol (08abc12345)
   * Sama dengan REG-016, beda input value
   * Client-side: tidak ada validasi format
   * Server-side: API 200 SUCCESS — seharusnya reject
   * BUG_APP: Tidak ada validasi format nomor telepon
   */
  test("[REG-023] Phone mengandung huruf 08abc12345 — API 200 SUCCESS (BUG_APP)", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan phone mengandung huruf '08abc12345'", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.phoneInput.fill("08abc12345");
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      // BUG_APP: API seharusnya reject phone dengan huruf, tapi return 200
      expect(responseStatus).not.toBe(200);
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
   * Server-side: API 400 "Username must be 3-64 characters..."
   * UI toast: "Registration failed" (generic)
   * BUG_APP: UI tidak menampilkan specific validation error dari API
   */
  test("[REG-025] Username mengandung spasi — API 400, UI toast generic (BUG_APP)", async ({ page }) => {
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
      expect(responseBody?.message).toBe("Validation failed");
    });

    await test.step("Verifikasi UI toast ≠ API message (BUG_APP harus FAIL)", async () => {
      await expect(registerPage.errorNotification).toBeVisible({ timeout: 5000 });
      // BUG_APP: UI toast "Registration failed" ≠ API "Validation failed"
      await expect(registerPage.toastDescription).toHaveText(responseBody?.message as string);
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

  /**
   * REG-029: Input XSS pada Full Name
   * Input: <script>alert("xss")</script>
   * Client-side: tidak ada sanitasi
   * Server-side: API 200 SUCCESS — input disimpan tanpa sanitasi
   * BUG_APP: Tidak ada sanitasi XSS
   */
  test("[REG-029] XSS pada Full Name — API 200, tidak ada sanitasi (BUG_APP)", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan XSS payload di Full Name", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.fullNameInput.fill('<script>alert("xss")</script>');
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      // BUG_APP: API seharusnya reject atau sanitasi XSS, tapi return 200
      expect(responseStatus).not.toBe(200);
    });
  });

  /**
   * REG-030: Input SQL Injection pada Full Name
   * Input: Robert'; DROP TABLE users; --
   * Client-side: tidak ada sanitasi
   * Server-side: API 200 SUCCESS — input disimpan tanpa sanitasi
   * BUG_APP: Tidak ada sanitasi SQL Injection
   */
  test("[REG-030] SQL Injection pada Full Name — API 200, tidak ada sanitasi (BUG_APP)", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    let responseStatus: number | null = null;

    await test.step("Buka halaman Register", async () => {
      await registerPage.open();
      await expect(registerPage.heading).toBeVisible();
    });

    await test.step("Isi form dengan SQL Injection payload di Full Name", async () => {
      const user = RegisterPage.generateUniqueUser();
      await registerPage.fillRegistrationForm(user);
      await registerPage.fullNameInput.fill("Robert'; DROP TABLE users; --");
    });

    await test.step("Klik Register dan tangkap response API", async () => {
      const [response] = await Promise.all([
        registerPage.waitForRegisterResponse(),
        registerPage.clickRegister(),
      ]);
      responseStatus = response.status;
      // BUG_APP: API seharusnya reject atau sanitasi SQL injection, tapi return 200
      expect(responseStatus).not.toBe(200);
    });
  });
});

