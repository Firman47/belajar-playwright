# QA Test Report — Login Module (AUTH)

**Date:** 2026-06-17  
**Test File:** `tests/login.spec.ts`  
**Page Object:** `tests/pages/LoginPage.ts`  
**Specification:** `docs/testcases/AUTH_TEST_CASES.md`  
**Environment:** Production `https://store.olpos.id/kurostoreid`  
**API Base:** `https://be.olpos.id/e_commerce/v1/`

---

## Test Execution Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | 10 |
| **Passed** | 8 (80%) |
| **Failed (BUG_APP)** | 2 (20%) |
| **Failed (BUG_AUTOMATION)** | 0 |
| **Duration** | ~55s |

### Test Results

| ID | Description | Status | Classification |
|----|-------------|--------|----------------|
| AUTH-001 | Login dengan kredensial valid — redirect ke homepage | ✅ PASS | — |
| AUTH-002 | Password salah — API 401, UI toast mismatch | ❌ FAIL | **BUG_APP** |
| AUTH-003 | Username tidak terdaftar — API 401, UI toast mismatch | ❌ FAIL | **BUG_APP** |
| AUTH-004 | Username kosong — validasi muncul, request tidak terkirim | ✅ PASS | — |
| AUTH-005 | Password kosong — validasi muncul, request tidak terkirim | ✅ PASS | — |
| AUTH-006 | Semua field kosong — kedua validasi muncul, request tidak terkirim | ✅ PASS | — |
| AUTH-007 | Show/Hide password toggle — type input berubah | ✅ PASS | — |
| AUTH-008 | Link 'Forgot Password?' — navigasi ke forgot-password | ✅ PASS | — |
| AUTH-009 | Link 'Register' — navigasi ke register | ✅ PASS | — |
| AUTH-010 | Remember Me checkbox — bisa dicentang/uncentang | ✅ PASS | — |

---

## Bug Reports

### BUG-001: Login error toast menampilkan pesan generik (AUTH-002, AUTH-003)

| Field | Value |
|-------|-------|
| **ID** | BUG-001 |
| **Related Tests** | AUTH-002, AUTH-003 |
| **Classification** | BUG_APP |
| **Severity** | Medium |

**Deskripsi:**
Saat login gagal (password salah atau username tidak terdaftar), komponen toast menampilkan pesan generik `"Login failed"` di title dan description. Namun, API mengembalikan pesan spesifik `"Invalid username or password"`. Ini menyebabkan inkonsistensi antara API response dan UI feedback.

**Langkah Reproduksi:**

1. Buka halaman `/[store]/auth/login`
2. Isi username "firman" (valid) dan password "wrongpassword" (salah)
3. Klik "Login"
4. Perhatikan toast yang muncul

**Expected (API Contract):**
- Toast description menampilkan: `"Invalid username or password"`

**Actual (UI):**
- Toast title: `"Login failed"`
- Toast description: `"Login failed"`

**Response API:**
```json
{
  "status": false,
  "message": "Invalid username or password",
  "data": null
}
```

**Root Cause:**
Komponen toast tidak menggunakan `message` dari API response. Sebagai gantinya, aplikasi menggunakan pesan generik hard-coded `"Login failed"` untuk setiap error login.

**Bukti:**
- Playwright HTML Report: `test-results/` — AUTH-002 dan AUTH-003
- Assertion failure: `expect(toastDescription).toHaveText("Invalid username or password")` — Received: `"Login failed"`

**Screenshots & Video:**
Tersedia di Playwright HTML Report pada test AUTH-002 dan AUTH-003 (screenshot + video otomatis saat assertion failure).

**Recommendation:**
Gunakan `response.body.message` dari API response sebagai teks toast description, bukan string hard-coded `"Login failed"`.

---

## API Contract Verification

| Endpoint | Method | Tested | Status | Notes |
|----------|--------|--------|--------|-------|
| `POST /auth/login` | POST | ✅ | **PASS** | All contract scenarios verified |
| Valid credentials | — | ✅ | 200 `Login successful` | ✅ Correct |
| Wrong password | — | ✅ | 401 `Invalid username or password` | ✅ Correct |
| Nonexistent username | — | ✅ | 401 `Invalid username or password` | ✅ Correct |
| Empty fields (via API) | — | ✅ | 400 `Username and password are required` | ✅ Correct (tested via direct fetch) |

### Client-Side Validation

| Scenario | Validation | API Call | Status |
|----------|-----------|----------|--------|
| Username kosong | "Username is required" | ❌ No | ✅ PASS |
| Password kosong | "Password is required" | ❌ No | ✅ PASS |
| Semua field kosong | Both errors | ❌ No | ✅ PASS |

### UI Feature Verification

| Feature | Status | Notes |
|---------|--------|-------|
| Show/Hide password toggle | ✅ PASS | `password` → `text` → `password` |
| Forgot Password link | ✅ PASS | Redirects to `/auth/forgot-password` |
| Register link | ✅ PASS | Redirects to `/auth/register` |
| Remember Me checkbox | ✅ PASS | Toggle works via label click |
| Google Login button | ✅ Present | Located in iframe |

---

## Files Created/Modified

### New Files

| File | Description |
|------|-------------|
| `tests/login.spec.ts` | 10 test cases for Login module |
| `docs/testcases/AUTH_TEST_CASES.md` | Test case specifications for AUTH module |
| `docs/qa/LOGIN_QA_REPORT.md` | This QA report |

### Modified Files

| File | Changes |
|------|---------|
| `tests/pages/LoginPage.ts` | Added `toastDescription`, `successNotification`, `toggleRememberMe()`, `hasNoLoginApiCall()`, `waitForNavigationAfterLogin()` timeout fix |

---

## Overall Assessment

**Login module is functionally working** for all basic flows:
- ✅ Valid login → redirects to homepage
- ✅ Invalid credentials → API returns 401 as expected
- ✅ Client-side validation blocks empty fields
- ✅ UI features (show password, links, checkbox) work correctly

**Known Issue (BUG_APP):**
Toast notification uses generic `"Login failed"` instead of specific API error message `"Invalid username or password"`. This is the same pattern as the Register module (where toast shows `"Registration failed"` instead of specific API messages like `"Email is already registered"`). This should be addressed as a UI improvement to provide better user feedback.

**No regression detected** — all existing Register tests continue to pass/fail as expected.
