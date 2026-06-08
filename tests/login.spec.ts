import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Login", () => {
  test("Login valid - berhasil login dan redirect", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login("firman", "password");

    await expect(page).not.toHaveURL(/auth\/login/, { timeout: 15000 });
  });

  test("Username kosong - muncul validasi username required", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.clickLogin();

    await expect(loginPage.usernameRequiredError).toBeVisible();
  });

  test("Password kosong - validasi mencegah form submit", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();

    let loginApiCalled = false;
    page.on("request", (req) => {
      if (req.url().includes("/e_commerce/v1/auth/login")) {
        loginApiCalled = true;
      }
    });

    await loginPage.fillUsername("firman");
    await loginPage.clickLogin();
    await page.waitForTimeout(1000);

    expect(loginApiCalled).toBe(false);
  });

  test("Username salah - API 401 dan UI toast muncul", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login("firmans", "password");

    const { status, body } = await loginPage.waitAndGetLoginResponse();
    expect(status).toBe(401);
    expect(body.message).toBe("Invalid username or password");

    await expect(loginPage.toastError).toBeVisible({ timeout: 10000 });

    await loginPage.toastError.screenshot({
      path: "evidence-login-toast.png",
    });

    // BUG: UI menampilkan localization key, bukan pesan dari API
    // API: "Invalid username or password"
    // UI:  "common.toast.auth.login_failed"
    await expect(loginPage.toastError).toHaveText(
      "Invalid username or password",
    );
  });

  test("Password salah - API 401 dan UI toast muncul", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login("firman", "password-salah");

    const { status, body } = await loginPage.waitAndGetLoginResponse();
    expect(status).toBe(401);
    expect(body.message).toBe("Invalid username or password");

    await expect(loginPage.toastError).toBeVisible({ timeout: 10000 });
  });
});
