# Login (AUTH) — Test Case Specifications

**Module:** Login  
**Route:** `/[store]/auth/login`  
**API Endpoint:** `POST /auth/login`  
**Test File:** `tests/login.spec.ts`  
**Page Object:** `tests/pages/LoginPage.ts`

---

## Test Cases

### AUTH-001: Login dengan kredensial valid

| Item | Value |
|------|-------|
| **Description** | Login menggunakan username dan password yang valid |
| **Input** | `username: "firman"`, `password: "password"` |
| **Expected API** | `200` `{ status: true, message: "Login successful", data: { user: {...} } }` |
| **Expected UI** | Redirect ke halaman utama `/[store]` |
| **Classification** | Positive |

### AUTH-002: Password salah

| Item | Value |
|------|-------|
| **Description** | Login dengan username valid tetapi password salah |
| **Input** | `username: "firman"`, `password: "wrongpassword"` |
| **Expected API** | `401` `{ status: false, message: "Invalid username or password", data: null }` |
| **Expected UI** | Toast error muncul dengan deskripsi sesuai API message |
| **BUG_APP** | Toast description = "Login failed" (generic) ≠ API "Invalid username or password" |
| **Classification** | Negative |

### AUTH-003: Username tidak terdaftar

| Item | Value |
|------|-------|
| **Description** | Login dengan username yang tidak terdaftar |
| **Input** | `username: "nonexistent_user"`, `password: "password"` |
| **Expected API** | `401` `{ status: false, message: "Invalid username or password", data: null }` |
| **Expected UI** | Toast error muncul dengan deskripsi sesuai API message |
| **BUG_APP** | Toast description ≠ API message (generic vs specific) |
| **Classification** | Negative |

### AUTH-004: Username kosong

| Item | Value |
|------|-------|
| **Description** | Submit form dengan username kosong |
| **Input** | `username: ""`, `password: "password"` |
| **Expected API** | Tidak ada API call terkirim |
| **Expected UI** | Validasi client-side "Username is required" muncul |
| **Classification** | Negative — Client-side Validation |

### AUTH-005: Password kosong

| Item | Value |
|------|-------|
| **Description** | Submit form dengan password kosong |
| **Input** | `username: "firman"`, `password: ""` |
| **Expected API** | Tidak ada API call terkirim |
| **Expected UI** | Validasi client-side "Password is required" muncul |
| **Classification** | Negative — Client-side Validation |

### AUTH-006: Semua field kosong

| Item | Value |
|------|-------|
| **Description** | Submit form dengan username dan password kosong |
| **Input** | `username: ""`, `password: ""` |
| **Expected API** | Tidak ada API call terkirim |
| **Expected UI** | Kedua validasi muncul: "Username is required" dan "Password is required" |
| **Classification** | Negative — Client-side Validation |

### AUTH-007: Show/Hide password toggle

| Item | Value |
|------|-------|
| **Description** | Klik tombol show/hide password |
| **Input** | Klik "Show password" lalu "Hide password" |
| **Expected** | Type input berubah: `password` → `text` (show) → `password` (hide) |
| **Classification** | UI Feature |

### AUTH-008: Link "Forgot Password?" navigasi

| Item | Value |
|------|-------|
| **Description** | Klik link "Forgot Password?" |
| **Expected** | Navigasi ke `/[store]/auth/forgot-password` |
| **Classification** | Navigation |

### AUTH-009: Link "Register" navigasi

| Item | Value |
|------|-------|
| **Description** | Klik link "Register" |
| **Expected** | Navigasi ke `/[store]/auth/register` |
| **Classification** | Navigation |

### AUTH-010: Remember Me checkbox

| Item | Value |
|------|-------|
| **Description** | Centang dan uncentang checkbox "Remember me" |
| **Expected** | Checkbox berubah state: unchecked → checked → unchecked |
| **Classification** | UI Feature |

---

## Bug Summary

| ID | Bug | Status |
|----|-----|--------|
| AUTH-002 | UI toast "Login failed" ≠ API "Invalid username or password" | **BUG_APP** — Open |
| AUTH-003 | UI toast "Login failed" ≠ API "Invalid username or password" | **BUG_APP** — Open |

**Root Cause:** Komponen toast menampilkan pesan generik "Login failed" di title dan description, bukan meneruskan `message` dari API response (`"Invalid username or password"`).

---

## API Contract Reference

| Condition | HTTP | `message` |
|-----------|------|-----------|
| Success | `200` | `Login successful` |
| Missing fields | `400` | `Username and password are required` |
| Wrong credentials | `401` | `Invalid username or password` |
| Suspended account | `403` | `Account is suspended` |

**Response Envelope:**
```json
{
  "status": true | false,
  "message": "string",
  "data": {} | null
}
```
