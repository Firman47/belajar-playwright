# Example Prompt — Login Module (AUTH-001 to AUTH-009)

> **Tujuan:** Contoh cara mem-prompt Playwright Engineer Agent untuk membuat atau memperbaiki test module Login
> **Referensi:** `docs/qa/PLAYWRIGHT_ENGINEER_AGENT.md`
> **Target:** `tests/pages/LoginPage.ts` + `tests/login.spec.ts`

---

## Cara Menggunakan Prompt Ini

Copy-paste template prompt di bawah ke chat agent, lalu:

1. **Ganti `[MODULE_NAME]`** — misal: `Login`, `Register`, `Forgot Password`
2. **Ganti `[PAGE_PATH]`** — misal: `/auth/login`
3. **Ganti `[ID_PREFIX]`** — misal: `AUTH`, `REG`, `FRG`
4. **Sesuaikan endpoint, test cases, dan data test** berdasarkan dokumentasi

---

## Template Prompt

````markdown
# Task: Generate/Improve [MODULE_NAME] Module Tests

## Context

Project: POS Sadigit Store E-commerce
Target URL: `https://store.olpos.id/kurostoreid`
API Base: `https://be.olpos.id/e_commerce/v1/`
Halaman: `[PAGE_PATH]`

## Documentation to Read First

Sebelum mengerjakan, baca dokumentasi berikut:
1. `docs/API_DOCUMENTATION.md` — API contracts, response shapes, error codes
2. `docs/WEBSITE_DOCUMENTATION.md` — UI structure, routing, component behavior for this page
3. `docs/qa/PLAYWRIGHT_ENGINEER_AGENT.md` — All agent rules
4. `docs/qa/BUG_REPORT_TEMPLATE.md` — Bug report format

## Existing Files

- `tests/pages/[ModuleName]Page.ts` — Page Object (fix if needed)
- `tests/[module-name].spec.ts` — Spec file (fix if needed — create if not exists)

## Requirements

### 1. Verify all locators in Page Object against the real DOM

Open `[PAGE_PATH]` in headed mode and verify:
- All `getByRole` selectors match the actual DOM
- All error message text matches actual Zod validation messages
- Toast/notification locators use correct Nuxt UI data attributes

### 2. Fix Page Object (`[ModuleName]Page.ts`) to follow agent rules

Add/improve:
- [ ] `waitFor[Action]Response()` — return `{ status, body }` using `waitForResponse`
- [ ] `waitForNavigationAfter[Action]()` — using `waitForURL` with regex
- [ ] `hasNo[Action]ApiCall()` — detect duplicate/sent requests using `request` event (NOT `waitForTimeout`)
- [ ] `toastDescription` locator — `page.locator('[data-slot="description"]')` for API message comparison
- [ ] `errorNotification` — using `page.locator('[data-slot="title"]').filter({ hasText: "..." })`
- [ ] Remove unused methods
- [ ] Replace CSS selectors with `getByRole`/`getByText` where possible
- [ ] Remove `waitForTimeout` — use event-driven waits
- [ ] Remove `waitForNavigation()` — use `waitForURL`
- [ ] Add static factory method for test data if needed

### 3. Generate/fix Spec File (`[module-name].spec.ts`)

Generate tests for ALL test cases from `docs/testcases/[MODULE]_TEST_CASES.md`.
If test case doc doesn't exist, create tests based on API documentation and website documentation.

#### Test Structure Rules

- Use `test.describe("[Module Name]", () => { ... })`
- Use `test.beforeEach` for page setup
- Use `test.step("description")` for logical grouping
- One `test` per test case
- Test ID format: `[ID-PREFIX-XXX]`

#### Test Types to Generate

**Positive Tests (Happy Path):**
- Form diisi dengan data valid → API 200 → assert response body → assert UI → assert redirect
- Gunakan data unik (`Date.now()`) untuk setiap test

**Negative Tests — Client-side Validation:**
- Field kosong, format invalid, min-length tidak terpenuhi
- Assert error message muncul (auto-wait)
- Assert **NO API call terkirim** (gunakan event listener `request`, bukan `waitForResponse`)
- Assert tetap di halaman yang sama (tidak redirect)

**Negative Tests — API Validation (request terkirim, API reject):**
- Data sudah terdaftar (duplicate), field terlalu panjang, karakter ilegal
- Tangkap API response (status + body)
- Assert HTTP status sesuai contract
- Assert `body.status === false`
- Assert UI toast visible
- Assert **UI toast message === API response message** (BANDINGKAN, jangan hardcode)
- Jika UI toast ≠ API message → **BUG_APP — test harus FAIL**
- Assert tetap di halaman (tidak redirect)

**Error Handling Tests:**
- API 500 — gunakan `page.route()` untuk intercept
- API timeout — gunakan `page.route()` + delay + abort
- Network error — gunakan `page.route()` + abort

#### BUG_APP Detection Pattern

```typescript
await test.step("Klik [Action] dan tangkap response API", async () => {
  const [response] = await Promise.all([
    pageObject.waitForResponse(),
    pageObject.clickAction(),
  ]);

  // Assert API contract
  expect(response.status).toBe(400);
  expect(response.body.status).toBe(false);

  // Assert UI toast visible
  await expect(pageObject.errorNotification).toBeVisible({ timeout: 5000 });

  // BUG_APP: Bandingkan UI toast dengan API message
  // Jika berbeda → test FAIL otomatis dengan screenshot + video
  await expect(pageObject.toastDescription).toHaveText(response.body.message);
});
```

#### Client-Side Validation Pattern

```typescript
let apiCallCount = 0;
page.on("request", (req) => {
  if (req.url().includes("/endpoint") && req.method() === "POST") apiCallCount++;
});

await test.step("Klik [Action]", async () => {
  await pageObject.clickAction();
});

await test.step("Verifikasi error muncul (auto-wait)", async () => {
  await expect(pageObject.someError).toBeVisible();
});

await test.step("Verifikasi tidak ada API call terkirim", async () => {
  expect(apiCallCount).toBe(0);
});
```

### 4. Run Tests

```bash
npx playwright test tests/[module-name].spec.ts --reporter=list
```

### 5. Classify All Failures

For each failure:
1. Collect evidence (screenshot, DOM snapshot, API response)
2. Classify: BUG_APP | BUG_AUTOMATION | BUG_DOCUMENTATION | BUG_TEST_CASE | UNCONFIRMED
3. If BUG_AUTOMATION → fix the test
4. If BUG_APP → keep the failure, create bug report
5. Report final summary: PASS count, FAIL count, classification breakdown

## Output Expected

1. Updated `tests/pages/[ModuleName]Page.ts` (if changes needed)
2. Updated `tests/[module-name].spec.ts` (generated/fixed tests)
3. Test run results with PASS/FAIL breakdown
4. Bug reports (if BUG_APP found)
5. Summary of all changes and classifications
````

---

## Concrete Example: Login Module

Prompt di atas jika diaplikasikan ke **Login Module** akan menghasilkan output seperti ini:

### 1. LoginPage.ts Improvements

File: `tests/pages/LoginPage.ts`

**Ditambahkan:**
- `get toastDescription()` — `page.locator('[data-slot="description"]')`
- `get errorNotification()` — `page.locator('[data-slot="title"]').filter({ hasText: /Login failed/i })`
- `async hasNoLoginApiCall(): Promise<boolean>` — menggunakan `request` event (mirip RegisterPage)
- `static generateValidUser()` — factory method

**Dihapus:**
- `get formElement()` — gunakan `getByRole` langsung di spec
- `get usernameInputElement()` — duplikat dari `usernameInput`
- `get passwordInputElement()` — duplikat dari `passwordInput`
- `get isLoginButtonDisabled(): Promise<boolean>` — ganti ke method `async isLoginButtonDisabled()`
- `submitWithKeyboard()` — tidak dipakai, hapus

**Diperbaiki:**
- `errorNotification` — dari `page.getByText("Login failed")` ke `page.locator('[data-slot="title"]').filter({ hasText: /Login failed/i })` agar bisa bedain toast title vs description

### 2. login.spec.ts — Test Cases Generated

| ID | Description | Type | Expected Status |
|----|-------------|------|-----------------|
| AUTH-001 | @smoke Login valid — redirect ke halaman utama | Positive | ✅ PASS |
| AUTH-002 | Username kosong — validasi client-side | Client val | ✅ PASS |
| AUTH-003 | Password kosong — validasi client-side | Client val | ✅ PASS |
| AUTH-004 | Username tidak terdaftar — API 401 | API error | ✅ PASS (toast == API) |
| AUTH-005 | Password salah — API 401 | API error | ❓ Tergantung UI toast vs API |
| AUTH-006 | Account suspended — API 403 | API error | ✅ PASS (toast == API) |
| AUTH-007 | Toggle show password | UX | ✅ PASS |
| AUTH-008 | Remember Me checkbox | UX | ✅ PASS |
| AUTH-009 | Navigasi ke Register & Forgot Password | Navigation | ✅ PASS |
| AUTH-010 | API 500 — error handling | Error handling | ✅ PASS (via route intercept) |
| AUTH-011 | Network error — error handling | Error handling | ✅ PASS (via route abort) |
| AUTH-012 | Login dengan Enter key | UX | ✅ PASS |

### 3. Example Test: AUTH-004 (API 401 — Expected PASS)

```typescript
test("[AUTH-004] Username tidak terdaftar — API 401, toast konsisten", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await test.step("Buka halaman Login", async () => {
    await loginPage.open();
    await expect(loginPage.heading).toBeVisible();
  });

  await test.step("Isi dengan username tidak terdaftar", async () => {
    await loginPage.fillUsername("nonexistent_user");
    await loginPage.fillPassword("password");
  });

  await test.step("Klik Login dan tangkap API response", async () => {
    const [response] = await Promise.all([
      loginPage.waitForLoginResponse(),
      loginPage.clickLogin(),
    ]);

    // API contract: 401 + status false
    expect(response.status).toBe(401);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("Invalid username or password");

    // Verifikasi UI toast
    await expect(loginPage.errorNotification).toBeVisible({ timeout: 5000 });

    // Bandingkan toast dengan API message
    // Jika API=UI → PASS
    // Jika API≠UI → BUG_APP, test FAIL
    await expect(loginPage.toastDescription).toHaveText(response.body.message as string);
  });
});
```

### 4. Example Test: AUTH-007 (Client-side validation — Expected PASS)

```typescript
test("[AUTH-002] Username kosong — validasi muncul, request tidak terkirim", async ({ page }) => {
  const loginPage = new LoginPage(page);
  let apiCallCount = 0;

  await test.step("Buka halaman Login", async () => {
    await loginPage.open();
    await expect(loginPage.heading).toBeVisible();
  });

  await test.step("Isi password saja, username kosong", async () => {
    await loginPage.fillUsername("");
    await loginPage.fillPassword("password123");
  });

  await test.step("Pasang listener API", async () => {
    page.on("request", (req) => {
      if (req.url().includes("/auth/login") && req.method() === "POST") apiCallCount++;
    });
  });

  await test.step("Klik Login", async () => {
    await loginPage.clickLogin();
  });

  await test.step("Verifikasi error 'Username is required' muncul", async () => {
    await expect(loginPage.usernameRequiredError).toBeVisible();
  });

  await test.step("Verifikasi tidak ada API call terkirim", async () => {
    expect(apiCallCount).toBe(0);
  });
});
```

---

## Tips Menulis Prompt yang Efektif

### ✅ DO
- **Spesifik** — sebutkan halaman, endpoint, file yang dimaksud
- **Sertakan konteks** — link ke dokumentasi, sebutkan modul
- **Berikan contoh output** — tabel test case, contoh kode
- **Sebutkan aturan main** — BUG_APP harus FAIL, client-side validation PASS
- **Minta langkah konkret** — "buat login.spec.ts", "fix LoginPage.ts"
- **Tentukan prioritas** — "prioritas: positive test dulu, baru negative"

### ❌ DON'T
- **Jangan ambigu** — "buat test untuk login" terlalu umum
- **Jangan lupa dokumentasi** — selalu baca docs dulu
- **Jangan asumsi** — "seharusnya button disabled" → cek dulu
- **Jangan minta BUG_APP tanpa bukti** — harus ada dasar requirement
- **Jangan minta test tanpa ID** — setiap test perlu ID unik

### Checklist Prompt

Sebelum mengirim prompt ke agent, pastikan:

- [ ] Nama modul jelas (Login, Register, dll)
- [ ] Halaman URL spesifik (`/auth/login`)
- [ ] Endpoint API spesifik (`/auth/login`)
- [ ] Referensi dokumentasi disebut
- [ ] File target disebut (Page Object, spec file)
- [ ] Prioritas/urutan jelas
- [ ] Aturan main disebut (BUG_APP, client-side val, dll)
- [ ] Output yang diharapkan jelas

---

## Quick Prompt Template (Short Version)

Untuk task sederhana (misal: fix satu test), gunakan versi pendek:

````markdown
Fix test [AUTH-XXX] in tests/login.spec.ts.

**Masalah:** [deskripsi singkat, misal: test gagal karena locator toast salah]

**Referensi:**
- docs/API_DOCUMENTATION.md — section 3.1 Login
- docs/qa/PLAYWRIGHT_ENGINEER_AGENT.md — section 7.2 Toast Assertion

**Aturan:**
1. Baca dokumentasi dulu sebelum ubah kode
2. Jangan invent bugs — cek DOM aktual
3. BUG_APP harus FAIL test — jangan skip atau soft assert
4. Toast harus dibandingkan dengan API response message

**Output:** Fix test + run + confirm PASS
````
