# Forgot Password (FRG) — Test Case Specifications

**Module:** Forgot Password  
**Route:** `/[store]/auth/forgot-password`  
**API Endpoints:** `POST /auth/forgot-password`, `POST /auth/verify-otp`, `POST /auth/reset-password`  
**Test File:** `tests/forgot-password.spec.ts`  
**Page Object:** `tests/pages/ForgotPasswordPage.ts`

---

## Test Cases

### Step 1: Request OTP (Send Email)

#### FRG-001: Email terdaftar — API 200, navigasi ke Step 2 (OTP)

| Item | Value |
|------|-------|
| **Description** | Kirim OTP menggunakan email yang sudah terdaftar |
| **Input** | `email: "firman@gmail.com"` |
| **Expected API** | `200` `{ status: true, message: "OTP has been sent to your email", data: null }` |
| **Expected UI** | Navigasi ke Step 2 (OTP input), teks instruksi OTP muncul |
| **Classification** | Positive — Step 1 |

#### FRG-002: Email kosong — validasi muncul, request tidak terkirim

| Item | Value |
|------|-------|
| **Description** | Submit form dengan email kosong |
| **Input** | `email: ""` |
| **Expected API** | Tidak ada API call terkirim |
| **Expected UI** | Validasi client-side "Email is required" muncul |
| **Classification** | Negative — Client-side Validation |

#### FRG-003: Email tidak terdaftar — API 404, tampilkan pesan error spesifik

| Item | Value |
|------|-------|
| **Description** | Kirim OTP menggunakan email yang tidak terdaftar |
| **Input** | `email: "unregistered@example.com"` |
| **Expected API** | `404` `{ status: false, message: "Email tidak terdaftar", data: null }` |
| **Expected UI** | Toast error muncul dengan deskripsi sesuai API message |
| **BUG_APP** | Toast description mungkin ≠ API message (generic vs specific) |
| **Classification** | Negative — API Validation |

#### FRG-004: Login link — navigasi ke halaman login

| Item | Value |
|------|-------|
| **Description** | Klik link "Login" dari halaman forgot password |
| **Expected** | Navigasi ke `/[store]/auth/login` |
| **Classification** | Navigation |

#### FRG-005: API 500 Internal Server Error — forgot-password error toast

| Item | Value |
|------|-------|
| **Description** | Simulasi API 500 pada endpoint forgot-password |
| **Mock** | `page.route()` return 500 |
| **Expected UI** | Error toast muncul |
| **Classification** | Error Handling |

---

### Step 2: Verify OTP

#### FRG-006: OTP valid — API 200, navigasi ke Step 3 (Reset Password)

| Item | Value |
|------|-------|
| **Description** | Verifikasi OTP menggunakan kode OTP mock (11111) |
| **Input** | `email: "firman@gmail.com"`, `otp: "11111"` |
| **Expected API** | `200` `{ status: true, message: "OTP verified successfully", data: { reset_token: "..." } }` |
| **Expected UI** | Navigasi ke Step 3 (New Password + Confirm Password input) |
| **Classification** | Positive — Step 2 |

#### FRG-007: OTP invalid — API error, tampilkan pesan error spesifik

| Item | Value |
|------|-------|
| **Description** | Verifikasi OTP dengan kode yang salah |
| **Input** | `email: "firman@gmail.com"`, `otp: "00000"` |
| **Expected API** | Error `{ status: false, message: "Invalid or expired OTP" }` |
| **Expected UI** | Toast error muncul dengan deskripsi sesuai API message |
| **BUG_APP** | Toast description mungkin ≠ API message |
| **Classification** | Negative — API Validation |

#### FRG-008: Resend OTP — API call forgot-password lagi, timer reset

| Item | Value |
|------|-------|
| **Description** | Klik "Resend OTP" setelah berada di Step 2 |
| **Expected API** | Endpoint forgot-password dipanggil lagi, API 200 |
| **Expected UI** | Tetap di Step 2, timer resend ter-reset |
| **Classification** | Positive — Step 2 |

#### FRG-009: API 500 Internal Server Error — verify-otp error toast

| Item | Value |
|------|-------|
| **Description** | Simulasi API 500 pada endpoint verify-otp |
| **Mock** | `page.route()` return 500 |
| **Expected UI** | Error toast muncul |
| **Classification** | Error Handling |

---

### Step 3: Reset Password

#### FRG-010: Password valid & confirm match — API 200, navigasi ke success

| Item | Value |
|------|-------|
| **Description** | Reset password dengan password baru dan konfirmasi yang match |
| **Input** | `new_password: "newpassword123"`, `confirm: "newpassword123"` |
| **Expected API** | `200` `{ status: true, message: "Password has been reset successfully", data: null }` |
| **Expected UI** | Navigasi ke Step 4 (Success page), success message muncul |
| **Classification** | Positive — Step 3 |

#### FRG-011: New password kosong — validasi muncul, request tidak terkirim

| Item | Value |
|------|-------|
| **Description** | Submit form dengan new password kosong |
| **Input** | `new_password: ""`, `confirm: "somepassword"` |
| **Expected API** | Tidak ada API call reset-password terkirim |
| **Expected UI** | Validasi client-side "Password is required" muncul |
| **Classification** | Negative — Client-side Validation |

#### FRG-012: Confirm password tidak match — validasi muncul, request tidak terkirim

| Item | Value |
|------|-------|
| **Description** | Submit form dengan password dan konfirmasi berbeda |
| **Input** | `new_password: "newpassword123"`, `confirm: "differentpassword456"` |
| **Expected API** | Tidak ada API call reset-password terkirim |
| **Expected UI** | Validasi client-side "Passwords do not match" muncul |
| **Classification** | Negative — Client-side Validation |

#### FRG-013: API 500 Internal Server Error — reset-password error toast

| Item | Value |
|------|-------|
| **Description** | Simulasi API 500 pada endpoint reset-password |
| **Mock** | `page.route()` return 500 |
| **Expected UI** | Error toast muncul |
| **Classification** | Error Handling |

---

### Step 4: Success & Post-Reset

#### FRG-014: Success page — Kembali ke Login navigasi ke login

| Item | Value |
|------|-------|
| **Description** | Setelah reset password sukses, klik "Kembali ke Login" |
| **Expected** | Navigasi ke `/[store]/auth/login` |
| **Classification** | Navigation |

#### FRG-015: Complete E2E forgot password flow — email → OTP → reset → success

| Item | Value |
|------|-------|
| **Description** | Full end-to-end flow: kirim OTP → verifikasi OTP → reset password → sukses → login dengan password baru |
| **Input** | `email: "firman@gmail.com"`, `otp: "11111"`, `new_password: "password_reset_999"` |
| **Expected API** | Semua endpoint return 200 dengan message sesuai contract |
| **Expected UI** | Step 1 → Step 2 → Step 3 → Step 4 (success), bisa login dengan password baru |
| **Note** | Test ini mengubah password user "firman". Jalankan secara terisolasi. |
| **Classification** | Positive — Complete E2E |

---

## API Contract Reference

### POST /auth/forgot-password

| Condition | HTTP | `message` |
|-----------|------|-----------|
| Success (email found) | `200` | `OTP has been sent to your email` |
| Missing email | `400` | `Email is required` |
| Email not registered | `404` | `Email tidak terdaftar` |

### POST /auth/verify-otp

| Condition | HTTP | `message` |
|-----------|------|-----------|
| OTP valid | `200` | `OTP verified successfully` (returns `data.reset_token`) |
| Missing fields | — | `Email and OTP are required` |
| Wrong/expired OTP | — | `Invalid or expired OTP` |

### POST /auth/reset-password

| Condition | HTTP | `message` |
|-----------|------|-----------|
| Reset success | `200` | `Password has been reset successfully` |
| Missing fields | — | `Reset token and new password are required` |
| Invalid/expired token | — | `Invalid or expired reset token` |
| User not found | — | `User not found` |

### Standard Response Envelope

```json
{
  "status": true | false,
  "message": "string",
  "data": {} | null
}
```

---

## Mock Test Data

| Data | Value |
|------|-------|
| Registered Email | `firman@gmail.com` |
| Unregistered Email | `unregistered@example.com` |
| Valid OTP | `11111` |
| Invalid OTP | `00000` |

---

## Bug Summary (Expected)

| ID | Bug | Status |
|----|-----|--------|
| FRG-003 | UI toast vs API message mismatch for unregistered email | **BUG_APP** — Open |
| FRG-007 | UI toast vs API message mismatch for invalid OTP | **BUG_APP** — Open |
