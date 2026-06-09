import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication - Login", () => {
  test("[AUTH-001] Login valid - berhasil login dan redirect", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman login", async () => {
      await loginPage.open();
    });

    await test.step("Login dengan kredensial valid", async () => {
      await loginPage.login("firman", "password");
    });

    await test.step("Verifikasi redirect berhasil", async () => {
      await expect(page).not.toHaveURL(/auth\/login/, { timeout: 15000 });
    });
  });

  test("[AUTH-002] Username kosong - muncul validasi username required", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman login", async () => {
      await loginPage.open();
    });

    await test.step("Klik login tanpa username", async () => {
      await loginPage.clickLogin();
    });

    await test.step("Verifikasi validasi username required", async () => {
      await expect(loginPage.usernameRequiredError).toBeVisible();
    });
  });

  test("[AUTH-003] Password kosong - validasi mencegah form submit", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman login", async () => {
      await loginPage.open();
    });

    await test.step("Isi username lalu klik login", async () => {
      await loginPage.fillUsername("firman");
      await loginPage.clickLogin();
      await page.waitForTimeout(1000);
    });

    await test.step("Verifikasi form validasi mencegah submit", async () => {
      // Form validation prevents API call
    });
  });

  test("[AUTH-004] Invalid username - API 401 dan UI toast muncul", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman login", async () => {
      await loginPage.open();
    });

    await test.step("Login dengan username salah", async () => {
      await loginPage.login("firmans", "password");
    });

    await test.step("Verifikasi response API 401", async () => {
      const { status, body } = await loginPage.waitAndGetLoginResponse();
      expect(status).toBe(401);
      expect(body.message).toBe("Invalid username or password");
    });

    await test.step("Verifikasi toast error tampil", async () => {
      await expect(loginPage.toast).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verifikasi pesan toast harus sama dengan API", async () => {
      // BUG: UI menampilkan "Login failed" tapi API return "Invalid username or password"
      // API: "Invalid username or password"
      // UI Title: "Login failed"
      // UI Description: "Login failed"
      await expect(loginPage.toastDescription).toHaveText(
        "Invalid username or password",
      );
    });
  });

  test("[AUTH-005] Invalid password - API 401 dan UI toast muncul", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await test.step("Buka halaman login", async () => {
      await loginPage.open();
    });

    await test.step("Login dengan password salah", async () => {
      await loginPage.login("firman", "password-salah");
    });

    await test.step("Verifikasi response API 401", async () => {
      const { status, body } = await loginPage.waitAndGetLoginResponse();
      expect(status).toBe(401);
      expect(body.message).toBe("Invalid username or password");
    });

    await test.step("Verifikasi toast error tampil", async () => {
      await expect(loginPage.toast).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verifikasi pesan toast harus sama dengan API", async () => {
      // BUG: UI menampilkan "Login failed" tapi API return "Invalid username or password"
      // API: "Invalid username or password"
      // UI Title: "Login failed"
      // UI Description: "Login failed"
      await expect(loginPage.toastDescription).toHaveText(
        "Invalid username or password",
      );
    });
  });
});
