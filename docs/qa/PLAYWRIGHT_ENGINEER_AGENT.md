# Playwright Engineer Agent — Complete Rules

> **Maintainer:** QA Team
> **Last Updated:** 2026-06-17
> **Project:** POS Sadigit Store E-commerce (store.olpos.id/kurostoreid)
> **Stack:** Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4 + Playwright 1.60+ + TypeScript

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Documentation Rules](#2-documentation-rules)
3. [Testing Philosophy](#3-testing-philosophy)
4. [Failure Classification](#4-failure-classification)
5. [Investigation Workflow](#5-investigation-workflow)
6. [API Testing Rules](#6-api-testing-rules)
7. [UI Testing Rules](#7-ui-testing-rules)
8. [Hooks & Fixtures Pattern](#8-hooks--fixtures-pattern)
9. [Test Data Management](#9-test-data-management)
10. [Environment & Configuration](#10-environment--configuration)
11. [Route Interception & Mocking](#11-route-interception--mocking)
12. [Console & Error Monitoring](#12-console--error-monitoring)
13. [Parallel Execution & Isolation](#13-parallel-execution--isolation)
14. [Tagging & Filtering](#14-tagging--filtering)
15. [Retry & Flakiness Management](#15-retry--flakiness-management)
16. [API Testing Without Browser](#16-api-testing-without-browser)
17. [Cookie / LocalStorage Injection](#17-cookie--localstorage-injection)
18. [Data Cleanup Patterns](#18-data-cleanup-patterns)
19. [TDD Cycle for E2E](#19-tdd-cycle-for-e2e)
20. [Playwright Coding Rules](#20-playwright-coding-rules)
21. [Page Object Model Structure](#21-page-object-model-structure)
22. [Spec File Pattern](#22-spec-file-pattern)
23. [Wait Strategy Rules](#23-wait-strategy-rules)
24. [Error Message Guidelines](#24-error-message-guidelines)
25. [Refactoring Rules](#25-refactoring-rules)
26. [Bug Reporting Rules](#26-bug-reporting-rules)
27. [Output Format](#27-output-format)
28. [Quick Reference](#28-quick-reference)

---

## 1. Project Overview

| Item | Value |
|---|---|
| **App** | POS Sadigit Store E-commerce (Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4) |
| **Test Runner** | Playwright 1.60+ |
| **Language** | TypeScript |
| **Target URL** | `https://store.olpos.id/kurostoreid` |
| **API Base** | `https://be.olpos.id/e_commerce/v1/` |
| **Package Manager** | pnpm |
| **Config** | `playwright.config.ts` — Chromium only, fullyParallel, HTML+JSON+JUnit reporters, screenshot/video on failure, trace on-first-retry |
| **Report** | `npx playwright show-report` |
| **Trace** | `npx playwright show-trace test-results/<file>.zip` |

### Commands

```bash
npx playwright test                        # all tests
npx playwright test tests/<file>.spec.ts   # single file
npx playwright test --headed               # visible browser
npx playwright test --ui                   # UI mode
npx playwright test --grep @smoke          # run tagged tests
npx playwright test --project=chromium     # specific project
```

### Directory Structure

```
.
├── tests/
│   ├── login.spec.ts              # AUTH-001 to AUTH-009
│   ├── register.spec.ts           # REG-001 to REG-028
│   ├── forgot-password.spec.ts    # FRG-001 to FRG-003
│   ├── home.spec.ts               # SRC-001, SRC-002, SVC-001, SVC-002
│   ├── smoke/
│   │   └── login.spec.ts          # SMOKE
│   └── pages/
│       ├── LoginPage.ts
│       ├── RegisterPage.ts
│       ├── ForgotPasswordPage.ts
│       └── HomePage.ts
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── WEBSITE_DOCUMENTATION.md
│   ├── testcases/
│   │   ├── AUTH_TEST_CASES.md
│   │   └── REGISTER_TEST_CASES.md
│   └── qa/
│       ├── BUG_REPORT_TEMPLATE.md
│       └── PLAYWRIGHT_ENGINEER_AGENT.md
├── playwright.config.ts
└── package.json
```

---

## 2. Documentation Rules

1. **Read first** — Before creating, modifying, or running any test, read the relevant documentation.
2. **Source of truth** — Documentation is the primary reference. Do not work based on assumptions.
3. **Mandatory reads** every new work session:
   - `docs/API_DOCUMENTATION.md` — API contracts, response shapes, error codes
   - `docs/WEBSITE_DOCUMENTATION.md` — UI structure, routing, component behavior
   - `docs/testcases/AUTH_TEST_CASES.md` — Login test case specifications
   - `docs/testcases/REGISTER_TEST_CASES.md` — Register test case specifications
   - `docs/qa/BUG_REPORT_TEMPLATE.md` — Bug report format
4. If there is a discrepancy between documentation and observed behavior, document it as `BUG_DOCUMENTATION`.
5. **Always verify locators against the real DOM** before writing assertions. Use Playwright's codegen or manual headed inspection.

---

## 3. Testing Philosophy

1. **No assumptions** — Never assume a bug without evidence.
2. **Evidence-based** — Every decision must be supported by UI evidence (screenshot, DOM snapshot) or API evidence (response status, response body).
3. **Timeout ≠ Bug** — Network delay, server slowdown, or CI environment can cause timeout. Never assume timeout = app bug.
4. **Assertion failure ≠ BUG_AUTOMATION** — Assertion failure can be caused by two things:
   - **BUG_AUTOMATION**: Wrong locator, incorrect wait strategy, bad test data → fix the test.
   - **BUG_APP**: Assertion intentionally designed to detect a requirement violation → test FAIL is the expected outcome. Document as bug.
   - Always investigate the root cause before determining classification.
5. **Client-side validation first** — If required validation appears and no API request is sent → result is **PASS** (not a bug).
6. **BUG_APP must be visible in report** — Every BUG_APP MUST produce an assertion failure visible in the Playwright HTML Report. BUG_APP must NOT be recorded as comments, console.log, or console.warn.
7. **Observations are NOT bugs** — A preference, a "should have", or a "I think it should" without a documented requirement is an observation, not a bug.
8. **One assertion per concern** — Each assertion should test exactly one thing. Avoid chaining multiple concerns in one `expect`.

---

## 4. Failure Classification

Every failure MUST be classified into exactly one category:

| Classification | Definition | Action |
|---|---|---|
| `BUG_APP` | App does not behave according to specification/documentation. Evidence from UI or API shows incorrect behavior. | Create bug report, attach evidence. Test MUST FAIL. |
| `BUG_AUTOMATION` | Test script is wrong — locator incorrect, wait strategy wrong, assertion wrong, or test logic wrong. | Fix the test script. |
| `BUG_DOCUMENTATION` | Documentation does not match actual app or API behavior. | Update documentation or report to documentation team. |
| `BUG_TEST_CASE` | Test case specification is wrong — expected result incorrect, steps incomplete, or test case is obsolete. | Update test case specification in `docs/testcases/`. |
| `UNCONFIRMED` | Failure detected but insufficient evidence to determine classification. | Investigate further. Collect additional evidence. |

---

## 5. Investigation Workflow

```
Failure detected
  ↓
Collect evidence:
  - Screenshot / DOM snapshot
  - API request & response (status + body)
  - Console error logs
  - Test steps replay
  ↓
Analyze root cause:
  - Is the locator correct? (check DOM)
  - Is the wait strategy appropriate? (network, visibility, URL)
  - Is the test data valid? (unique, not expired)
  - Does the API response match the contract?
  - Does the UI match the website documentation?
  ↓
Determine classification (one of 5 above)
  ↓
If BUG_APP:
  1. Write assertion based on the violated requirement
  2. Assertion MUST cause test FAIL if requirement is not met
  3. Failure message must clearly explain the bug found
  4. Test remains FAIL (do NOT skip, do NOT soft-assert)
  5. Create bug report with assertion failure evidence from report
If BUG_AUTOMATION → fix the test
If BUG_DOCUMENTATION → update docs or report
If BUG_TEST_CASE → update test case spec
If UNCONFIRMED → continue investigation
```

---

## 6. API Testing Rules

### 6.1 Standard Response Envelope

All endpoints return:

```json
{
  "status": true,
  "message": "Operation successful",
  "data": {} | null
}
```

### 6.2 Auth Endpoints

| Endpoint | Method | Auth | Request Body |
|---|---|---|---|
| `/auth/login` | POST | No | `{ username, password }` |
| `/auth/register` | POST | No | `{ full_name, phone_number, username, email, password }` |
| `/auth/forgot-password` | POST | No | `{ email }` |
| `/auth/verify-otp` | POST | No | `{ email, otp }` |
| `/auth/reset-password` | POST | No | `{ reset_token, new_password }` |
| `/auth/logout` | POST | Yes | — |
| `/auth/google` | POST | No | `{ credential }` |

### 6.3 Mock Test Credentials

- Username: `firman` / Password: `password`
- OTP: `11111` (for all mock emails)
- Registered email: `firman@gmail.com`
- Registered username: `firman`

### 6.4 HTTP Status Code Mapping

| HTTP | Meaning | Example |
|---|---|---|
| 200 | Success | Login berhasil, register berhasil |
| 400 | Invalid request | Missing fields, validation error |
| 401 | Unauthenticated | Wrong credentials |
| 403 | Forbidden | Account suspended |
| 404 | Not found | Email not registered |
| 409 | Conflict | Email/username already taken |
| 410 | Gone | Payment expired |
| 422 | Unprocessable | Semantically invalid data |
| 429 | Rate limited | Too many requests |
| 500 | Server error | Unexpected error |

### 6.5 waitForResponse Rules

1. Always use `page.waitForResponse()` with a **specific URL filter** — never use overly broad wildcards.
2. Always capture both `status` and `body` (JSON) from the response.
3. For endpoints called once, use the Promise.all pattern:

```typescript
const [response] = await Promise.all([
  page.waitForResponse((resp) => resp.url().includes("/auth/login")),
  page.getByRole("button", { name: "Login" }).click(),
]);
```

4. For endpoints that may be called multiple times, use an event listener `page.on("response")` with accumulation.

### 6.6 Assertion Rules for API

1. Assert `response.status()` matches the expected HTTP code.
2. Assert `body.status` (boolean) matches the documentation.
3. Assert `body.message` if the documentation specifies it (e.g., "Invalid username or password").
4. **DO NOT** assert fields that are not guaranteed by the API contract (e.g., `data[].constraints` structure).
5. **DO NOT** hard-code expected toast text — always compare against `response.body.message`.

---

## 7. UI Testing Rules

### 7.1 Client-Side Validation

1. If required validation appears in the UI and **no API request was sent** → result is **PASS**.
2. Client-side validation is a valid first-layer security mechanism.
3. Verify no API request was sent using an event listener:

```typescript
let requestSent = false;
page.on("request", (req) => {
  if (req.url().includes("/auth/register") && req.method() === "POST") requestSent = true;
});
await registerPage.clickRegister();
await page.waitForTimeout(100); // microtask drain
expect(requestSent).toBe(false);
```

### 7.2 Toast / Notification Assertion

1. Toast/notifications are only checked if documented in the test case.
2. If documentation does not mention a toast, do NOT assert it.
3. Use specific locators: `page.getByRole("alert")` or `page.locator('[data-slot="description"]')` — never generic CSS like `.toast`.
4. **MANDATORY**: Compare toast content with API response message. Never hardcode expected text without API verification.
   - If API returns `"Email is already registered"` but toast shows `"Registration failed"` → this is **BUG_APP**.
   - Assertion MUST compare toast with API message, not with a hardcoded string.
5. For negative tests, always capture the API response and use `response.body.message` as reference:

```typescript
const { status, body } = await page.waitForResponse(resp => resp.url().includes("/auth/register"));
// BUG_APP: compare UI toast with API message
// If different, test must FAIL
await expect(page.getByRole("alert")).toHaveText(body.message);
```

### 7.3 Locator Priority

1. `getByRole` — for interactive elements (button, link, textbox, heading, checkbox)
2. `getByText` — for error messages, static text, notifications
3. `getByPlaceholder` — for inputs with placeholder
4. `getByLabel` — for form fields with label
5. `locator('css')` — only if selectors above are not possible

**Never use:**
- `page.locator("body")` or broad selectors for text assertion
- `document.querySelector` in `page.evaluate()` — always use Playwright locators
- `page.locator(".toast")` — too generic

---

## 8. Hooks & Fixtures Pattern

### 8.1 beforeEach / afterEach

Use hooks for setup and teardown common across tests in a describe block:

```typescript
test.describe("Login Module", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup jika perlu (misal: clear cookies setelah login)
    await page.context().clearCookies();
  });

  test("[AUTH-001] Login valid", async () => {
    // ... test code, loginPage sudah siap
  });
});
```

### 8.2 Custom Fixtures

Untuk state yang reusable (misal: authenticated session), buat fixture kustom:

```typescript
// tests/fixtures.ts
import { test as base } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

type MyFixtures = {
  authenticatedPage: LoginPage;
};

export const test = base.extend<MyFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.loginAndSubmit("firman", "password");
    const [response] = await Promise.all([
      loginPage.waitForLoginResponse(),
      loginPage.clickLogin(),
    ]);
    // Pastikan login berhasil
    if (response.status !== 200) throw new Error("Login failed in fixture");
    await loginPage.waitForNavigationAfterLogin();
    await use(loginPage);
  },
});

export { expect } from "@playwright/test";
```

Gunakan di spec file:

```typescript
import { test, expect } from "./fixtures";

test("test with authenticated session", async ({ authenticatedPage, page }) => {
  // Halaman sudah login
  await page.goto("https://store.olpos.id/kurostoreid");
  // ... test logic
});
```

### 8.3 Worker-Scoped Fixtures

Untuk data yang dibagi antar test dalam worker yang sama:

```typescript
const test = base.extend<{}, { workerUser: string }>({
  workerUser: [async ({}, use) => {
    const user = `worker_${Date.now()}`;
    await use(user);
  }, { scope: "worker" }],
});
```

---

## 9. Test Data Management

### 9.1 Static Factory Method

Gunakan static method pada Page Object untuk generate data test unik:

```typescript
export class RegisterPage {
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
```

### 9.2 Test Data Fixtures

Untuk data yang lebih kompleks, buat file fixture terpisah:

```typescript
// tests/data/test-users.ts
export const VALID_USER = {
  username: "firman",
  password: "password",
};

export const INVALID_USERS = [
  { username: "", password: "password", expectedError: "Username is required" },
  { username: "firman", password: "", expectedError: "Password is required" },
  { username: "nonexistent", password: "wrong", expectedHttpStatus: 401 },
];
```

### 9.3 Unique Data Rules

1. **Always use unique data** for positive tests (registration, creation).
2. Use `Date.now()` or `crypto.randomUUID()` for uniqueness.
3. For negative tests (duplicate, conflict), use the **pre-registered data** from mock credentials.
4. Never reuse the same unique data across parallel tests — use `Date.now()` per test.

---

## 10. Environment & Configuration

### 10.1 playwrigt.config.ts

```typescript
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],
  use: {
    baseURL: "https://store.olpos.id",  // base URL tanpa path suffix
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  outputDir: "test-results/",
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

### 10.2 Environment Variables

```typescript
// playwright.config.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env") });

// Access in tests
const API_BASE = process.env.API_BASE || "https://be.olpos.id/e_commerce/v1";
const TEST_USER = process.env.TEST_USER || "firman";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "password";
```

### 10.3 Base URL Convention

- **Application URL**: Use `baseURL` in config + relative path in tests
- **API Base URL**: Define as constant in Page Object or env variable
- **Never hardcode** full URLs in multiple places — use a single constant per Page Object

```typescript
// In page object
const BASE_URL = "https://store.olpos.id/kurostoreid";
const API_BASE = "https://be.olpos.id/e_commerce/v1";

// open() method with explicit URL
async open() {
  await this.page.goto(`${BASE_URL}/auth/login`);
  await this.page.waitForLoadState("networkidle");
}
```

---

## 11. Route Interception & Mocking

### 11.1 Simulate API Error

```typescript
await page.route("**/auth/register", async (route) => {
  await route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ status: false, message: "Internal Server Error", data: null }),
  });
});
```

### 11.2 Simulate Network Error

```typescript
await page.route("**/auth/register", async (route) => {
  await route.abort("internetdisconnected");
});
```

### 11.3 Simulate Timeout

```typescript
await page.route("**/auth/register", async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 15000));
  await route.abort("timedout");
});
```

### 11.4 Simulate Slow Response

```typescript
await page.route("**/auth/login", async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: true, message: "Login successful", data: {} }),
  });
});
```

### 11.5 Intercept and Modify Response

```typescript
await page.route("**/auth/login", async (route) => {
  const response = await route.fetch();
  const body = await response.json();
  body.message = "Modified message for testing";
  await route.fulfill({ response, body: JSON.stringify(body) });
});
```

### 11.6 Cleanup Interception

Always clean up route interception after test if it might affect other tests:

```typescript
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "wait" });
});
```

---

## 12. Console & Error Monitoring

### 12.1 Listen for Page Errors

```typescript
test("monitor console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  // ... test actions ...

  expect(errors).toHaveLength(0); // No unhandled errors
});
```

### 12.2 Listen for Console Warnings/Errors

```typescript
test("monitor console warnings", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "warning" || msg.type() === "error") {
      warnings.push(msg.text());
    }
  });

  // ... test actions ...

  // Soft assert — bisa jadi warning tidak kritis
  expect.soft(warnings).toHaveLength(0);
});
```

### 12.3 Best Practices

1. Always clean up listeners in `afterEach` or use `page.off()`.
2. Don't fail tests on console errors unless documented as a requirement.
3. Use console monitoring for investigation, not as primary assertion.
4. When a test fails suspiciously, check console errors first — they often reveal the root cause.

---

## 13. Parallel Execution & Isolation

### 13.1 Config

```typescript
// playwright.config.ts
fullyParallel: true,    // run all tests in parallel across all files
workers: process.env.CI ? 1 : undefined,  // 1 worker on CI, auto locally
```

### 13.2 Test Isolation Rules

1. **Each test must be independent** — no shared state between tests.
2. **Each test creates its own data** — use `Date.now()` for unique usernames/emails.
3. **Do not rely on test execution order** — `test.describe.serial` only when absolutely necessary.
4. **Clean up after yourself** — use `afterEach` for cleanup, but prefer side-effect-free tests.
5. **Browser contexts are isolated** by default — each `page` in Playwright is a new context.

### 13.3 Worker Safety

```typescript
// Workers run in separate processes — safe by default
// BUT: avoid writing to the same file, DB, or shared state
// Use unique suffixes per test:
const uniqueUser = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
```

---

## 14. Tagging & Filtering

### 14.1 Tag Tests

Gunakan `@tag` di judul test untuk grouping dan filtering:

```typescript
test("[AUTH-001] @smoke @regression Login valid — redirect ke halaman utama", async () => { ... });
test("[AUTH-002] @regression Login dengan username kosong — validasi muncul", async () => { ... });
test("[REG-026] @error-handling API 500 — UI tampilkan error toast", async () => { ... });
```

### 14.2 Define Tags Convention

| Tag | Purpose |
|---|---|
| `@smoke` | Critical path — dijalankan di setiap deployment |
| `@regression` | Full regression suite |
| `@error-handling` | Tests for error scenarios (API 500, timeout, network error) |
| `@slow` | Tests that take > 30s |
| `@flaky` | Known flaky tests — prioritize for fixing |
| `@wip` | Work in progress — not ready for CI |

### 14.3 Run by Tag

```bash
npx playwright test --grep @smoke
npx playwright test --grep-invert @slow
npx playwright test --grep "@smoke|@regression"
```

### 14.4 Skip by Tag Condition

```typescript
test.skip(({ project }) => project.name !== "chromium", "Chromium only");
test.skip(process.env.CI === undefined, "Only runs on CI");
test.skip(true, "Skipped until bug ABC-123 is fixed");
```

---

## 15. Retry & Flakiness Management

### 15.1 Config Retry

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,  // Retry twice on CI only
```

### 15.2 Per-Test Retry

```typescript
test("[AUTH-005] @flaky Retry up to 3 times", async () => {
  test.setTimeout(60000);
  // ... test that occasionally flakes ...
});

// Override retries
test.describe.configure({ retries: 3 });
```

### 15.3 Flakiness Detection Patterns

Common causes of flakiness:

| Cause | Solution |
|---|---|
| Race condition (click before ready) | Use `expect(locator).toBeEnabled()` or `toBeVisible()` first |
| API response timing | Use `Promise.all` with `waitForResponse` — not fixed timeout |
| Element detached from DOM | Use `locator.waitFor({ state: "attached" })` |
| Animation not finished | Use `expect(locator).toBeVisible()` with built-in auto-wait |
| Test data collision | Use `Date.now()` + `Math.random()` for uniqueness |
| Browser context leak | Ensure `afterEach` cleanup or use isolated contexts |

### 15.4 When a Test is Flaky

1. Run the test 10+ times to confirm flakiness: `npx playwright test --repeat-each=10 tests/flaky.spec.ts`
2. Investigate root cause — don't just add retries.
3. If the flakiness is from the app (intermittent API failure), document as BUG_APP.
4. If the flakiness is from the test (timing, data collision), fix the test.
5. Only use retry as a temporary measure while investigating.

---

## 16. API Testing Without Browser

### 16.1 Using request Context

For pre-condition setup (creating test data) without UI:

```typescript
import { test, expect } from "@playwright/test";

test("create user via API, then verify UI", async ({ request }) => {
  // Setup: create user via API
  const createResponse = await request.post(
    "https://be.olpos.id/e_commerce/v1/auth/register",
    {
      data: {
        full_name: "Test User",
        phone_number: "08123456789",
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: "password123",
      },
    }
  );
  expect(createResponse.ok()).toBe(true);

  // Then: verify user can login via UI
  // ... UI test logic ...
});
```

### 16.2 Preserving Cookies Between API and UI

```typescript
// Login via API, get cookies, inject into browser
test("API login + UI verification", async ({ page, request }) => {
  // Login via API
  const loginRes = await request.post(
    "https://be.olpos.id/e_commerce/v1/auth/login",
    { data: { username: "firman", password: "password" } }
  );
  expect(loginRes.ok()).toBe(true);

  // Get cookies from API response
  const headers = loginRes.headers();
  const cookies = headers["set-cookie"];

  // Add cookies to browser context
  if (cookies) {
    const parsed = cookies.split(";").map(c => c.trim());
    await page.context().addCookies([
      { name: "access_token_ecommerce", value: parsed[0].split("=")[1], domain: ".olpos.id", path: "/" },
    ]);
  }

  // Now navigate — should already be authenticated
  await page.goto("https://store.olpos.id/kurostoreid");
  // ... verify logged-in state ...
});
```

---

## 17. Cookie / LocalStorage Injection

### 17.1 Inject Auth State via Cookies

```typescript
await page.context().addCookies([
  {
    name: "access_token_ecommerce",
    value: "mock_token_value",
    domain: ".olpos.id",
    path: "/",
  },
]);
```

### 17.2 Inject via addInitScript

```typescript
await page.addInitScript(() => {
  localStorage.setItem("store_slug", "kurostoreid");
});
```

### 17.3 Persist Auth State with StorageState

```typescript
// global-setup.ts — run once before all tests
import { chromium } from "@playwright/test";

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://store.olpos.id/kurostoreid/auth/login");
  await page.getByRole("textbox", { name: "Username" }).fill("firman");
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL(/^(?!.*\/auth\/login)/);
  await page.context().storageState({ path: "auth.json" });
  await browser.close();
}

export default globalSetup;

// playwright.config.ts
globalSetup: "./tests/global-setup.ts";

// Use in test
test.use({ storageState: "auth.json" });
```

### 17.4 When to Inject vs When to Login via UI

| Method | When |
|---|---|
| Login via UI | For auth flow tests (AUTH-001, AUTH-002, etc.) |
| Inject cookies | For tests that need auth as pre-condition (cart, checkout, profile) |
| StorageState | For test suites that need consistent auth state across many files |

---

## 18. Data Cleanup Patterns

### 18.1 Cleanup via API in afterAll

```typescript
test.describe("Register Module", () => {
  const createdUsers: string[] = [];

  test.afterAll(async ({ request }) => {
    // Cleanup: delete users created during tests
    for (const userId of createdUsers) {
      await request.delete(`https://be.olpos.id/e_commerce/v1/admin/users/${userId}`);
    }
  });

  test("[REG-001] Register valid", async () => {
    // ... test logic ...
    // Jika sukses, catat user ID untuk cleanup
    // createdUsers.push(userId);
  });
});
```

### 18.2 Self-Cleaning Test Data

Gunakan data unik yang tidak perlu dibersihkan (tidak mengganggu test lain):

```typescript
// Username dan email dengan timestamp — tidak akan bentrok
const user = {
  username: `cleanup_${Date.now()}`,
  email: `cleanup_${Date.now()}@example.com`,
};

// Tidak perlu cleanup karena tidak ada test lain yang menggunakan data ini
```

### 18.3 Register Module — No Cleanup Needed

Untuk Register module, karena setiap test menggunakan data unik (`Date.now()`), tidak ada bentrok data. Negative tests menggunakan data pre-registered (`firman`, `firman@gmail.com`) yang sudah ada di mock server dan tidak bisa dihapus — jadi tidak perlu cleanup.

---

## 19. TDD Cycle for E2E

### 19.1 Red-Green-Refactor for E2E

```
RED:   Write a failing E2E test based on the requirement
         ↓
GREEN: Make the test pass (app must implement the feature)
         ↓
REFACTOR: Clean up test code and app code
```

### 19.2 Example

```typescript
// RED — Test fails because the feature doesn't exist yet
test("[AUTH-001] Login dengan kredensial valid", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.loginAndSubmit("firman", "password");
  const response = await loginPage.waitForLoginResponse();
  expect(response.status).toBe(200); // FAILS — no login endpoint yet
});

// After app implements login → GREEN
// Then refactor test to be more robust
```

### 19.3 When NOT to use TDD

- Exploratory testing (finding bugs, not verifying requirements)
- Testing error scenarios that are already implemented
- Refactoring existing tests

---

## 20. Playwright Coding Rules

### 20.1 General

- Use TypeScript for all test files and Page Objects.
- Use `test.step()` for logical grouping in spec files.
- Use `test.describe()` for module grouping.
- Keep Page Objects lean — only locators, actions, getters, and wait methods.
- One file per Page Object, one file per spec module.

### 20.2 Imports

```typescript
// Page Object
import { type Page, type Locator, type Response, type Request } from "@playwright/test";

// Spec file
import { test, expect } from "@playwright/test";
import { XxxPage } from "./pages/XxxPage";
import { VALID_USER } from "./data/test-users";
```

### 20.3 Test ID Naming Convention

| Prefix | Module | File |
|---|---|---|
| `AUTH-XXX` | Login | `tests/login.spec.ts` |
| `REG-XXX` | Register | `tests/register.spec.ts` |
| `FRG-XXX` | Forgot Password | `tests/forgot-password.spec.ts` |
| `SRC-XXX` | Search | `tests/home.spec.ts` |
| `SVC-XXX` | Service Status | `tests/home.spec.ts` |
| `SMOKE` | Smoke | `tests/smoke/login.spec.ts` |

### 20.4 Test Title Format

```
[MODULE-XXX] Description — key expected behavior
```

Examples:
- `[AUTH-001] Login valid — redirect ke halaman utama`
- `[REG-003] Email sudah terdaftar — API 409, UI mismatch toast (BUG_APP)`
- `[REG-011] Password 300 karakter — lolos semua validasi, registrasi sukses`

If the test is a deliberate BUG_APP detector, append `(BUG_APP)` to the description.

---

## 21. Page Object Model Structure

```typescript
import { type Page, type Locator, type Response, type Request } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class XxxPage {
  readonly page: Page;
  // Public locators (readonly)
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "..." });
    this.submitButton = page.getByRole("button", { name: "..." });
  }

  async open() {
    await this.page.goto(`${BASE_URL}/path`);
    await this.page.waitForLoadState("networkidle");
  }

  // Action methods — satu method per aksi
  async fillXxx(value: string) {
    await this.xxxInput.fill(value);
  }

  async clickXxx() {
    await this.xxxButton.click();
  }

  // Getter properties untuk error locators
  get xxxError() {
    return this.page.getByText("...");
  }

  // Toast / notification locators
  get errorNotification() {
    return this.page.locator('[data-slot="title"]').filter({ hasText: "..." });
  }

  get toastDescription() {
    return this.page.locator('[data-slot="description"]');
  }

  // Response interceptor
  async waitForXxxResponse(): Promise<{ status: number; body: Record<string, unknown> }> {
    const response = await this.page.waitForResponse((resp: Response) =>
      resp.url().includes("/endpoint") && resp.request().method() === "POST"
    );
    return {
      status: response.status(),
      body: (await response.json()) as Record<string, unknown>,
    };
  }

  // Navigation wait
  async waitForNavigationAfterXxx() {
    await this.page.waitForURL(/pattern/, { timeout: 15000 });
  }

  // Duplicate API call detection
  async hasNoApiCall(): Promise<boolean> {
    let apiCallCount = 0;
    const handler = (req: Request) => {
      if (req.url().includes("/endpoint") && req.method() === "POST") {
        apiCallCount++;
      }
    };
    this.page.on("request", handler);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.page.off("request", handler);
    return apiCallCount === 0;
  }

  // Static factory for unique test data
  static generateUniqueData() {
    const ts = Date.now();
    return { ... };
  }
}
```

### 21.1 Page Object Rules

1. **No assertions in Page Objects** — assertions belong in spec files only.
2. **Return raw data** from interceptors, not assertions.
3. **Getter properties** for locators, not methods (e.g., `get errorMessage()` not `getErrorMessage()`).
4. **Action methods** should be simple wrappers — one method = one action.
5. **Static factory methods** for test data generation.
6. **No `waitForTimeout`** in Page Objects — use event-driven waits.

---

## 22. Spec File Pattern

```typescript
import { test, expect } from "@playwright/test";
import { XxxPage } from "./pages/XxxPage";

test.describe("Module Name", () => {
  let xxxPage: XxxPage;

  test.beforeEach(async ({ page }) => {
    xxxPage = new XxxPage(page);
    await xxxPage.open();
    await expect(xxxPage.heading).toBeVisible();
  });

  test("[ID-XXX] Description — expected behavior", async ({ page }) => {
    await test.step("Aksi 1", async () => {
      await xxxPage.action1();
    });

    await test.step("Verifikasi API", async () => {
      const response = await xxxPage.waitForResponse();
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });

    await test.step("Verifikasi UI", async () => {
      await expect(xxxPage.someElement).toBeVisible();
      // Untuk BUG_APP: bandingkan dengan API message
      await expect(xxxPage.toastDescription).toHaveText(response.body.message);
    });
  });

  test("[ID-YYY] Negative test — validasi client-side", async ({ page }) => {
    let apiCallCount = 0;
    page.on("request", (req) => {
      if (req.url().includes("/endpoint")) apiCallCount++;
    });

    await test.step("Aksi", async () => {
      await xxxPage.action2();
    });

    await test.step("Verifikasi error muncul", async () => {
      await expect(xxxPage.errorMessage).toBeVisible();
    });

    await test.step("Verifikasi tidak ada API call", async () => {
      expect(apiCallCount).toBe(0);
    });
  });

  test("[ID-ZZZ] Bug APP — requirement dilanggar", async ({ page }) => {
    await test.step("Aksi", async () => {
      // ...
    });

    await test.step("Tangkap response API", async () => {
      const [response] = await Promise.all([
        xxxPage.waitForResponse(),
        xxxPage.clickSubmit(),
      ]);

      // Assert API contract
      expect(response.status).toBe(400);

      // BUG_APP: UI toast ≠ API message — TEST MUST FAIL
      await expect(xxxPage.toastDescription).toHaveText(response.body.message);
    });
  });
});
```

### 22.1 Spec File Rules

1. **One `test.describe` per file** — match module name.
2. **One `test` per test case** — exactly one scenario.
3. **Use `test.step()`** for logical grouping — every action + verification pair.
4. **All assertions inside `test.step`** — never outside.
5. **Never use `test.skip` to hide a BUG_APP** — the test must FAIL to be visible.
6. **Never use `expect.soft` for BUG_APP** — must be hard failure.
7. **Keep test IDs for traceability** — even with gaps from deleted tests.

---

## 23. Wait Strategy Rules

1. **Navigation:** `page.waitForLoadState("networkidle")` after `page.goto()`.
2. **URL change:** `page.waitForURL(/pattern/, { timeout })` — always include explicit timeout.
3. **API response:** `page.waitForResponse(filter)` — filter with specific URL.
4. **Element visibility:** `expect(locator).toBeVisible()` — built-in auto-wait.
5. **Element enabled:** `expect(locator).toBeEnabled()` — waits until enabled.
6. **Avoid:** `page.waitForTimeout()` — except for microtask drain (max 100ms) or observation.
7. **Avoid:** `page.waitForNavigation()` — deprecated. Use `waitForURL` or Promise.all.
8. **Avoid:** `page.waitForSelector()` — use `expect(locator).toBeVisible()` instead.

### 23.1 Priority of Wait Strategies

1. `waitForResponse` — best for API-driven UIs
2. `waitForURL` — best for navigation
3. `toBeVisible`/`toBeEnabled` — best for element state
4. `waitForLoadState` — only after `goto`
5. `waitForTimeout` — last resort, max 100ms

---

## 24. Error Message Guidelines

### 24.1 Assertion Error Messages

Error messages should clearly explain what went wrong and why:

```
expect(toastDescription).toHaveText("Email is already registered") failed

Expected: "Email is already registered"
Received: "Registration failed"

BUG_APP: UI toast menampilkan pesan generik, bukan spesifik dari API.
API mengembalikan "Email is already registered", UI menampilkan "Registration failed".
Test ini FAIL karena UI tidak konsisten dengan API.
```

### 24.2 Test Title as First Line of Defense

Judul test harus sudah menjelaskan expected behavior:

```
[REG-003] Email sudah terdaftar — API 409, UI mismatch toast description (BUG_APP)
```

Dari judul saja sudah jelas:
- ID: REG-003
- Skenario: Email sudah terdaftar
- Expected API: 409
- Bug: UI toast mismatch
- Klasifikasi: BUG_APP

### 24.3 Stack Trace Tips

- Screenshot otomatis dari Playwright adalah bukti utama.
- Error message harus mengandung expected vs actual.
- Jika BUG_APP, error message harus menyebut "BUG_APP".
- Jika BUG_AUTOMATION, error message harus menyebut "BUG_AUTOMATION: fix needed".

---

## 25. Refactoring Rules

1. **Audit existing tests** before fixing — read the entire test file, understand intent.
2. **Remove duplicate tests** — if two tests test the same thing, keep the more comprehensive one.
3. **Fix wrong assertions** — align assertions with API documentation and UI docs.
4. **Fix locators** — replace CSS selectors with `getByRole`/`getByText` when possible.
5. **Fix wait strategies** — replace `waitForTimeout` with functional waits (`waitForResponse`, `waitForURL`, `toBeVisible`).
6. **Run tests after refactoring** — verify no regression.
7. **Document changes** — note what was changed and why.
8. **One refactoring per commit** — isolate changes for clear history.
9. **Do NOT weaken BUG_APP assertions** — if a test is deliberately failing to detect a bug, keep the failure.

---

## 26. Bug Reporting Rules

### 26.1 When to Create a Bug

Only if there is:
- **UI evidence** — screenshot or DOM snapshot shows behavior inconsistent with documentation.
- **API evidence** — response status or body does not match API contract.
- **UI vs Documentation mismatch** — UI displays something different from specification.
- **API vs Documentation mismatch** — API returns something different from contract.

### 26.2 When NOT to Create a Bug

- **Timeout** — never assume timeout = app bug. Investigate environment, network, or wait strategy.
- **Assertion failure (BUG_AUTOMATION)** — if caused by wrong locator, wait strategy, or bad test data.
- **Assertion failure (BUG_APP)** — if the assertion is intentionally detecting a requirement violation and the app truly violates it, this is evidence of a bug. Do NOT remove or weaken the assertion.
- **Client-side validation blocking** — validation appears, no API call sent → correct behavior (PASS).
- **Flaky test** — test that sometimes passes, sometimes fails → not an app bug.

### 26.3 Bug Report Format

Use template at `docs/qa/BUG_REPORT_TEMPLATE.md`:

```
# Bug Report

**ID Test:** [MODULE-XXX]

**Judul:** Ringkasan singkat bug

**Klasifikasi:** BUG_APP | BUG_AUTOMATION | BUG_DOCUMENTATION | BUG_TEST_CASE | UNCONFIRMED

**Langkah Reproduksi:**
1. Langkah pertama
2. Langkah kedua
3. Langkah ketiga

**Expected:**
Apa yang seharusnya terjadi

**Actual:**
Apa yang sebenarnya terjadi

**Response API:**
```json
{
  "status": 401,
  "body": {
    "message": "Invalid username or password"
  }
}
```

**Bukti:**
- Link ke Playwright HTML Report
- Screenshot (dari report otomatis)

**Status:**
Open / Fixed / Retest
```

### 26.4 BUG_APP MUST FAIL Test (Rule Enforced)

**FORBIDDEN:**

| Practice | Example | Consequence |
|---|---|---|
| Comment only | `// BUG_APP: button not disabled` | Bug invisible in report |
| console.log only | `console.log("BUG_APP: API 200 instead of 400")` | Bug invisible in report |
| console.warn only | `console.warn("Toast text mismatch")` | Bug invisible in report |
| Observation only | `// observed: different toast text` | No assertion, bug undetected |
| Soft assert | `expect.soft(...)` then continue PASS | Bug doesn't cause failure |
| Skip test | `test.skip(...)` after finding bug | Bug invisible |

**REQUIRED:**
1. Write assertion based on requirement or expected behavior.
2. Assertion must represent the business rule being tested.
3. If the app does not meet the requirement, assertion must fail.
4. Test must be FAILED.
5. Failure must be visible in Playwright HTML Report.
6. Failure message must explain the bug found.

---

## 27. Output Format

### 27.1 Test Result Summary

```
## Test Results: [Module]

| ID | Description | Status | Classification |
|----|-------------|--------|----------------|
| AUTH-001 | Login valid | ✅ PASS | — |
| AUTH-004 | Username tidak terdaftar | ❌ FAIL | BUG_AUTOMATION |

### Failure Details

**AUTH-004 — Username tidak terdaftar**
- **Classification:** BUG_AUTOMATION
- **Root Cause:** Locator `usernameInput` using `getByRole("textbox", { name: "Username" })`
  but DOM uses `placeholder="Masukkan username"` not label.
- **Fix:** Replace locator with `page.getByPlaceholder("Masukkan username")`.
- **Evidence:** DOM snapshot confirms no `aria-label` on input element.
```

### 27.2 Investigation Report

```
## Investigation: [ID-XXX]

**Observation:** [what happened]

**Evidence:**
- API Response: `{ status: 401, message: "Invalid username or password" }`
- UI: Toast notification appears with text "Login failed"

**Analysis:**
1. API returns 401 per contract → API behavior correct
2. UI shows toast per test case → UI behavior correct
3. Test fails because toast locator is wrong → BUG_AUTOMATION

**Classification:** BUG_AUTOMATION
**Recommendation:** Fix toast locator from `page.locator(".toast")` to `page.getByText("Login failed")`
```

### 27.3 Session Summary (per work session)

```
## Session Summary: [Date]

### Objective
[What we aimed to accomplish]

### Changes Made
| File | Change | Reason |
|------|--------|--------|
| `tests/pages/XxxPage.ts` | Fixed locator | DOM mismatch |

### Test Results
| Status | Count | Details |
|--------|-------|---------|
| ✅ PASS | N | All passing tests |
| 🔴 FAIL | M | All BUG_APP detections |

### Key Observations
- [Discovery 1]
- [Discovery 2]

### Next Steps
1. [Action 1]
2. [Action 2]
```

---

## 28. Quick Reference

### Common Assertions

```typescript
// Element visibility
await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
await expect(page.getByText("Username is required")).toBeVisible();

// API response
const { status, body } = await page.waitForResponse(/* filter */);
expect(status).toBe(200);
expect(body.status).toBe(true);

// URL assertion
await page.waitForURL(/auth\/login/, { timeout: 10000 });
expect(page.url()).toContain("/auth/login");

// Input type assertion
const type = await input.getAttribute("type");
expect(type).toBe("password");

// Checkbox state
const isChecked = await checkbox.isChecked();
expect(isChecked).toBe(true);

// Button disabled state
const isDisabled = await button.isDisabled();
expect(isDisabled).toBe(true);

// Request counting (duplicate request detection)
expect(apiCallCount).toBeLessThanOrEqual(1);

// Multiple HTTP status (e.g., 400 or 429)
expect([400, 429]).toContain(response.status);

// BUG_APP: UI toast vs API message mismatch → MUST FAIL
await expect(registerPage.toastDescription).toHaveText(response.body.message);

// BUG_APP: API should reject invalid input → MUST FAIL
expect(response.status).toBe(400);

// BUG_APP: API should NOT accept dangerous payload → MUST FAIL
expect(res.status).not.toBe(200);
```

### Common locators for this project

```typescript
// Auth inputs (label-based)
page.getByRole("textbox", { name: "Username" })
page.getByRole("textbox", { name: "Password", exact: true })
page.getByRole("textbox", { name: "Email", exact: true })
page.getByRole("textbox", { name: "Full Name" })
page.getByRole("textbox", { name: "Phone Number" })
page.getByRole("textbox", { name: "Confirm Password" })

// Buttons
page.getByRole("button", { name: "Login", exact: true })
page.getByRole("button", { name: "Register" })

// Links
page.getByRole("link", { name: "Forgot Password?" })
page.getByRole("link", { name: "Register" })
page.getByRole("link", { name: "Login" })

// Form errors (getByText)
page.getByText("Username is required")
page.getByText("Password is required")
page.getByText("Full name is required")
page.getByText("Email is required")
page.getByText("Phone number is required")
page.getByText("Username must be at least 4 characters")
page.getByText("Please enter a valid email address")
page.getByText("Password must be at least 8 characters")
page.getByText("Please confirm your password")
page.getByText("Passwords do not match")

// Toast / notification
page.locator('[data-slot="title"]').filter({ hasText: "Registration failed" })
page.locator('[data-slot="description"]')
page.getByRole("alert").filter({ hasText: /Registration successful/i })
```

### Quick Decision Flow

```
Apakah saya punya bukti (UI/API)?
  ↓ YA → Apakah bukti melanggar dokumentasi?
           ↓ YA → BUG_APP (assertion FAIL)
           ↓ TIDAK → Apakah ini observasi?
                      ↓ YA → Catat sebagai OBSERVATION, bukan bug
                      ↓ TIDAK → PASS
  ↓ TIDAK → Apakah saya punya asumsi?
            ↓ YA → Bukan bug — cari bukti dulu
            ↓ TIDAK → UNCONFIRMED
```
