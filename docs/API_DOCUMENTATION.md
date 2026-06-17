# POS Sadigit Store — API Documentation

> **Purpose:** Reference for frontend developers and backend engineers during real API integration.
> All endpoints described here are currently served by the **local Nuxt mock server** (`server/api/v1/`).
> When integrating the real backend, replace `NUXT_PUBLIC_API_BASE` in `.env` and ensure the real server mirrors these contracts.

---

## Table of Contents

1. [Base URL & Configuration](#1-base-url--configuration)
2. [Standard Response Envelope](#2-standard-response-envelope)
3. [Authentication](#3-authentication)
   - [Login](#31-login)
   - [Google Login](#32-google-login)
   - [Register](#33-register)
   - [Logout](#34-logout)
   - [Forgot Password](#35-forgot-password)
   - [Verify OTP](#36-verify-otp)
   - [Reset Password](#37-reset-password)
4. [Store Profile (`/store/:slug`)](#4-store-profile-storeslug)
5. [Current User (`/me`)](#5-current-user-me)
   - [Get Profile](#51-get-profile)
   - [Update Profile](#52-update-profile)
   - [Change Password](#53-change-password)
6. [Banners](#6-banners)
7. [Categories](#7-categories)
8. [Products](#8-products)
   - [List Products](#81-list-products)
   - [Product Detail](#82-product-detail)
   - [Related Products](#83-related-products)
9. [Cart](#9-cart)
   - [Get Cart](#91-get-cart)
   - [Add to Cart](#92-add-to-cart)
   - [Update Cart Item](#93-update-cart-item)
   - [Remove Cart Item](#94-remove-cart-item)
10. [Address](#10-address)
    - [List Addresses](#101-list-addresses)
    - [Create Address](#102-create-address)
    - [Update Address](#103-update-address)
    - [Delete Address](#104-delete-address)
11. [Regions](#11-regions)
    - [Provinces](#111-provinces)
    - [Cities](#112-cities)
    - [Districts](#113-districts)
    - [Subdistricts](#114-subdistricts)
12. [Payment Methods](#12-payment-methods)
13. [Expedition (Courier)](#13-expedition-courier)
14. [Checkout](#14-checkout)
15. [Orders](#15-orders)
    - [Order List](#151-order-list)
    - [Order Detail](#152-order-detail)
    - [Order Tracking](#153-order-tracking)
    - [Upload Transfer Proof](#154-upload-transfer-proof)
    - [Submit Product Review](#155-submit-product-review-per-order-item)
    - [Finish Order](#156-finish-order-customer-confirmation)
16. [Payment](#16-payment)
    - [Get Payment Info](#161-get-payment-info)
    - [Confirm Payment](#162-confirm-payment)
    - [Check QRIS Payment Status](#163-check-qris-payment-status)
    - [Cancel QRIS Payment](#164-cancel-qris-payment)
17. [Voucher](#17-voucher)
    - [List Vouchers](#171-list-vouchers)
    - [Validate Voucher](#172-validate-voucher)
18. [Chat Bot](#18-chat-bot)
    - [Create Session](#181-create-session)
    - [Get Chat History](#182-get-chat-history)
    - [Send Message (Text/Image)](#183-send-message-textimage)
    - [Send Message Stream (SSE)](#184-send-message-stream-sse-token-by-token)
19. [Data Models](#19-data-models)
20. [Error Reference](#20-error-reference)
21. [Mock Test Credentials](#21-mock-test-credentials)

---

## 1. Base URL & Configuration

| Environment              | Value                                           |
| ------------------------ | ----------------------------------------------- |
| **Local (mock)**         | `http://localhost:3000` — API at `/api/v1`      |
| **Staging / Production** | Configured via `NUXT_PUBLIC_API_BASE` in `.env` |

**`.env` switch:**

```dotenv
# Local mock (default for development)
NUXT_PUBLIC_API_BASE=/api/v1

# Real backend
# NUXT_PUBLIC_API_BASE=https://api.sadigit.co.id/v1
```

All request examples below use `{{BASE_URL}}` as a placeholder for the value of `NUXT_PUBLIC_API_BASE`.

### Store-Scoped Routing (`:slug_toko`)

Sebagian besar endpoint (kecuali Auth, Profile User, dan Address) berada di bawah namespace toko menggunakan **slug toko** sebagai path prefix:

```
{{BASE_URL}}/:slug_toko/<resource>/...
```

Contoh:

```
GET  {{BASE_URL}}/sadigit-store/banner
GET  {{BASE_URL}}/sadigit-store/products
POST {{BASE_URL}}/sadigit-store/checkout
```

> **Tujuan:** Memudahkan backend melakukan routing spesifik ke data toko tertentu tanpa perlu header/lookup tambahan.
> **Excluded endpoints:** Auth (`/auth/*`), Current User (`/me`, `/me/*`), Address (`/address/*`), dan Store Profile (`/store/:slug`) tetap di root tanpa prefix slug toko.

---

## 2. Standard Response Envelope

Every endpoint returns the same JSON wrapper:

```jsonc
{
  "status": true,          // boolean — true = success, false = error
  "message": "Operation successful", // human-readable message
  "data": {} | null        // payload object, null on error or empty responses
}
```

### HTTP Status Policy (Contract for Backend)

This project uses **semantic HTTP status codes** for errors while keeping the response envelope consistent.

- `2xx` for successful requests (`status: true`)
- `4xx` for client/request/business-state errors (`status: false`)
- `5xx` for server/internal errors (`status: false`)

Common status mapping:

| HTTP Status | Meaning                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `400`       | Invalid request payload / failed validation                              |
| `401`       | Unauthenticated (missing/invalid session)                                |
| `403`       | Authenticated but not allowed                                            |
| `404`       | Resource not found                                                       |
| `409`       | Business-state conflict (e.g. invalid order state transition)            |
| `410`       | Resource/window expired and no longer available                          |
| `422`       | Semantically invalid data (optional, if backend differentiates from 400) |
| `500`       | Unexpected server error                                                  |

**Success example:**

```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_001",
      "full_name": "John Doe",
      "username": "john_doe",
      "email": "john@example.com",
      "phone_number": "081234567890",
      "role": "customer",
      "is_active": true,
      "registered_at": "2025-01-20T00:00:00Z",
      "last_login_at": "2026-02-23T10:00:00Z"
    }
  }
}
```

**Error example:**

```json
{
  "status": false,
  "message": "Invalid email or password",
  "data": null
}
```

> **Note for BE:** The real API must preserve this exact envelope shape on **all** status codes. The frontend `useApi` composable reads `data.status`, `data.message`, and `data.data`.

---

## 3. Authentication

Session is managed via **HTTP cookies** set by the server. The frontend sends requests with `credentials: 'include'`.

| Cookie                    | HttpOnly | MaxAge  | Purpose                                          |
| ------------------------- | -------- | ------- | ------------------------------------------------ |
| `access_token_ecommerce`  | `false`  | 30 days | Used in `validateSession()` to identify the user |
| `refresh_token_ecommerce` | `true`   | 30 days | Reserved for token refresh (not yet implemented) |

> **⚠️ CRITICAL:** Cookie names are `access_token_ecommerce` / `refresh_token_ecommerce` (NOT `access_token` / `refresh_token`). The `useApi` composable and `validateSession()` both use these exact names. If the real backend uses different cookie names, update both the frontend composable and this doc.

---

### 3.1 Login

```
POST {{BASE_URL}}/auth/login
```

**Request Body:**

```json
{
  "username": "john_doe",
  "password": "password123"
}
```

| Field      | Type     | Required | Notes                                                   |
| ---------- | -------- | -------- | ------------------------------------------------------- |
| `username` | `string` | ✅       | Case-insensitive match (supports username **or** email) |
| `password` | `string` | ✅       | Plain text (BE should hash in production)               |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_001",
      "full_name": "John Doe",
      "username": "john_doe",
      "email": "john@example.com",
      "phone_number": "081234567890",
      "role": "customer",
      "is_active": true,
      "registered_at": "2025-01-20T00:00:00Z",
      "last_login_at": "2026-02-23T10:00:00Z"
    }
  }
}
```

Sets cookies: `access_token_ecommerce` (30d) + `refresh_token_ecommerce` (30d)

**Failure Responses:**
| Condition | HTTP | `message` |
|---|---|---|
| Missing fields | `400` | `Username and password are required` |
| Wrong credentials | `401` | `Invalid username or password` |
| Suspended account | `403` | `Account is suspended` |

---

### 3.2 Google Login

```
POST {{BASE_URL}}/auth/google
```

Used by frontend Google Sign-In flow (`nuxt-google-auth`) after receiving Google ID token.

**Request Body:**

```json
{
  "credential": "<GOOGLE_ID_TOKEN_JWT>"
}
```

| Field        | Type     | Required | Notes                                       |
| ------------ | -------- | -------- | ------------------------------------------- |
| `credential` | `string` | ✅       | Google ID token (JWT), verified server-side |

**Behavior:**

- Server verifies credential signature with Google's JWKs.
- Server validates `issuer` and `audience` (`NUXT_PUBLIC_GOOGLE_CLIENT_ID`).
- If user with token email exists → login and set session cookies.
- If not exists → auto-register as `customer`, then login.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "id": "user_001",
      "full_name": "John Doe",
      "username": "john_doe",
      "email": "john@gmail.com",
      "phone_number": "",
      "role": "customer",
      "is_active": true,
      "registered_at": "2025-01-20T00:00:00Z",
      "last_login_at": "2026-02-23T10:00:00Z"
    }
  }
}
```

**Failure Responses:**

| Condition                           | `message`                            |
| ----------------------------------- | ------------------------------------ |
| Missing credential                  | `Google credential is required`      |
| Invalid credential signature/claims | `Invalid Google credential`          |
| Missing email in verified claims    | `Google email is required`           |
| Missing backend Google config       | `Google client ID is not configured` |
| Suspended account                   | `Account is suspended`               |

**Security Notes:**

- Frontend must send raw Google ID token (`credential`) from `GoogleLoginButton` success callback.
- Backend must verify token with Google public keys and check token `aud` against `NUXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Do **not** trust `email/name/sub` sent directly from frontend without token verification.

---

### 3.3 Register

```
POST {{BASE_URL}}/auth/register
```

**Request Body:**

```json
{
  "full_name": "Budi Santoso",
  "phone_number": "08123456789",
  "username": "budi123",
  "email": "budi@example.com",
  "password": "secretpass"
}
```

| Field          | Type     | Required |
| -------------- | -------- | -------- |
| `full_name`    | `string` | ✅       |
| `phone_number` | `string` | ✅       |
| `username`     | `string` | ✅       |
| `email`        | `string` | ✅       |
| `password`     | `string` | ✅       |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Registration successful. Please log in.",
  "data": null
}
```

**Failure Responses:**
| Condition | HTTP | `message` |
|---|---|---|
| Missing any field | `400` | `All fields are required` |
| Email already used | `409` | `Email is already registered` |
| Username already taken | `409` | `Username is already taken` |

---

### 3.4 Logout

```
POST {{BASE_URL}}/auth/logout
```

No request body required. Clears both `access_token` and `refresh_token` cookies.

**Response `200`:**

```json
{
  "status": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### 3.5 Forgot Password

```
POST {{BASE_URL}}/auth/forgot-password
```

Step 1 of the password-reset flow. Checks that the email is registered, then sends an OTP to the user's email address.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

| Field   | Type     | Required |
| ------- | -------- | -------- |
| `email` | `string` | ✅       |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "OTP has been sent to your email",
  "data": null
}
```

**Failure Responses:**
| Condition | HTTP | `message` |
|---|---|---|
| Missing email | `400` | `Email is required` |
| Email not registered | `404` | `Email tidak terdaftar` |

> **Mock note:** No real email is sent. The OTP is always `11111`. See [§21 Mock Test Credentials](#21-mock-test-credentials).

---

### 3.6 Verify OTP

```
POST {{BASE_URL}}/auth/verify-otp
```

Step 2 of the password-reset flow. Validates the OTP entered by the user. On success, marks the email as verified for one password-reset attempt, **invalidates the OTP** so it cannot be reused, and generates a `reset_token` for the next step.

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "11111"
}
```

| Field   | Type     | Required |
| ------- | -------- | -------- |
| `email` | `string` | ✅       |
| `otp`   | `string` | ✅       |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "OTP verified successfully",
  "data": {
    "reset_token": "aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
  }
}
```

> **Important:** The `reset_token` must be used in the next step (§3.7 Reset Password). It is single-use and expires after successful password reset.

**Failure Responses:**
| Condition | `message` |
|---|---|
| Missing fields | `Email and OTP are required` |
| Wrong or expired OTP | `Invalid or expired OTP` |

---

### 3.7 Reset Password

```
POST {{BASE_URL}}/auth/reset-password
```

Step 3 of the password-reset flow. Updates the user's password. Requires the `reset_token` obtained from [§3.6 Verify OTP](#36-verify-otp) — the token is consumed on success.

**Request Body:**

```json
{
  "reset_token": "aBcDeFgHiJkLmNoPqRsTuVwXyZ123456",
  "new_password": "newpassword123"
}
```

| Field          | Type     | Required | Notes                |
| -------------- | -------- | -------- | -------------------- |
| `reset_token`  | `string` | ✅       | From verify-otp step |
| `new_password` | `string` | ✅       | Minimum 8 characters |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Password has been reset successfully",
  "data": null
}
```

**Failure Responses:**
| Condition | `message` |
|---|---|
| Missing fields | `Reset token and new password are required` |
| Invalid or expired reset_token | `Invalid or expired reset token` |
| Email not found | `User not found` |

> **BE Note:** `confirm_password` matching is validated **client-side only** — the server only receives `new_password`. The confirmation field never reaches the API.

## 4. Store Profile (`/store/:slug`)

```
GET {{BASE_URL}}/store/:slug
```

No auth required. Used by `app/pages/[store].vue` to hydrate store-level state once.

**Path Parameter:**

| Param  | Type     | Required | Description                  |
| ------ | -------- | -------- | ---------------------------- |
| `slug` | `string` | ✅       | Store slug from route prefix |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Store profile fetched successfully",
  "data": {
    "slug": "sadigit-store",
    "name": "Toko Sadigit",
    "logo_url": null,
    "favicon_url": null,
    "about": "Toko Sadigit adalah toko online terpercaya dengan layanan produk teknologi dan kebutuhan digital harian.",
    "address": "Jl. Bunga Sakura Raya No. 127A, Jakarta Selatan, DKI Jakarta 12345",
    "phone_number": "0812-3456-7890",
    "operating_hours": {
      "monday": { "open": "08.00", "close": "20.00" },
      "tuesday": { "open": "08.00", "close": "20.00" },
      "wednesday": { "open": "08.00", "close": "20.00" },
      "thursday": { "open": "08.00", "close": "20.00" },
      "friday": { "open": "08.00", "close": "20.00" },
      "saturday": { "open": "08.00", "close": "20.00" },
      "sunday": { "open": "09.00", "close": "18.00" }
    },
    "bank_accounts": [
      {
        "bank_name": "BCA",
        "account_number": "1234567890"
      },
      {
        "bank_name": "Mandiri",
        "account_number": "9876543210123"
      }
    ],
    "config": {
      "theme": "default",
      "schema": ["SIMASKO"]
    },
    "social_links": {
      "facebook": "#",
      "instagram": "#",
      "youtube": "#",
      "whatsapp": "#",
      "tiktok": "#",
      "twitter": "#"
    },
    "contact_center": [{ "name": "Customer Service", "phone": "6281234567890" }],
    "bank_accounts": [
      {
        "bank_name": "BCA",
        "account_number": "1234567890"
      },
      {
        "bank_name": "Mandiri",
        "account_number": "9876543210123"
      }
    ],
    "config": {
      "theme": "default",
      "schema": ["SIMASKO"]
    }
  }
}
```

> **Notes:**
>
> - `operating_hours` is a structured **object** (one entry per day), not an HTML string. Frontend uses `formatOperatingHours()` util (`app/types/store-profile.ts`) to render it as readable text.
> - `social_links` includes `facebook`, `instagram`, `youtube`, `whatsapp`, **`tiktok`**, and **`twitter`** (6 fields).
> - `contact_center` is an optional array of contact persons (available on `default` and `medical` profiles).
> - `bank_account_type` field (e.g. `BCA`, `MANDIRI`) is used by checkout for payment routing when `total > 10_000_000`.

---

## 5. Current User (`/me`)

All `/me` endpoints require a valid `access_token_ecommerce` cookie.

---

### 5.1 Get Profile

```
GET {{BASE_URL}}/me
```

**Success Response `200`:**

```json
{
  "status": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "user_001",
      "full_name": "John Doe",
      "username": "john_doe",
      "email": "john@example.com",
      "phone_number": "081234567890",
      "auth_provider": "local",
      "role": "customer",
      "is_active": true,
      "registered_at": "2025-01-20T00:00:00Z",
      "last_login_at": "2026-02-23T10:00:00Z"
    }
  }
}
```

`auth_provider` values:

- `local` = akun login email/username + password
- `google` = akun login via Google OAuth

**`role` values:** `"customer"` | `"reseller"` | `"dealer"`

**Failure:** `401 Unauthorized`

---

### 5.2 Update Profile

```
PUT {{BASE_URL}}/me
```

**Request Body** (all fields optional, only provided fields are updated):

```json
{
  "full_name": "John Updated",
  "phone_number": "089876543210",
  "email": "new@example.com"
}
```

| Field          | Type     | Notes          |
| -------------- | -------- | -------------- |
| `full_name`    | `string` | —              |
| `phone_number` | `string` | —              |
| `email`        | `string` | Must be unique |

> **Note:** `username` is **not** updatable via this endpoint (only `full_name`, `email`, and `phone_number` are accepted by the backend).

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "user_001",
      "full_name": "John Updated",
      "username": "john_doe",
      "email": "new@example.com",
      "phone_number": "089876543210",
      "auth_provider": "local",
      "role": "customer",
      "is_active": true,
      "registered_at": "2025-01-20T00:00:00Z",
      "last_login_at": "2026-02-23T10:00:00Z"
    }
  }
}
```

**Failure Responses:**

| Condition          | HTTP  | `message`                                    |
| ------------------ | ----- | -------------------------------------------- |
| Unauthenticated    | `401` | `Unauthorized`                               |
| User not found     | `404` | `User not found`                             |
| Email already used | `409` | `Email is already in use by another account` |

---

### 5.3 Change Password

```
PUT {{BASE_URL}}/me/password
```

**Request Body:**

```json
{
  "old_password": "currentpass",
  "new_password": "newpass123",
  "confirm_password": "newpass123"
}
```

| Field              | Type     | Required                     |
| ------------------ | -------- | ---------------------------- |
| `old_password`     | `string` | ✅                           |
| `new_password`     | `string` | ✅ Minimum 8 characters      |
| `confirm_password` | `string` | ✅ Must match `new_password` |

> **Note:** `confirm_password` validation is performed **server-side**. All three fields are required.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Failure Responses:**

| Condition              | HTTP  | `message`                                    |
| ---------------------- | ----- | -------------------------------------------- |
| Unauthenticated        | `401` | `Unauthorized`                               |
| Missing fields         | `400` | `All password fields are required`           |
| Wrong current password | `400` | `Current password is incorrect`              |
| Mismatch confirmation  | `400` | `New password and confirmation do not match` |
| Too short              | `400` | `New password must be at least 8 characters` |

---

> **Endpoint scoping note:** Mulai dari section ini, seluruh endpoint berada di bawah namespace toko dengan prefix `/:slug_toko/`.
> Endpoint yang **tidak** menggunakan prefix slug toko:
>
> - **Auth** (`/auth/*`) — §3
> - **Store Profile** (`/store/:slug`) — §4
> - **Current User** (`/me`, `/me/*`) — §5
> - **Address** (`/address`, `/address/*`) — §10
> - **Regions** (`/regions/*`) — §11

---

## 6. Banners

```
GET {{BASE_URL}}/:slug_toko/banner
```

No auth required.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Banners fetched successfully",
  "data": {
    "banners": [
      {
        "id": "banner_001",
        "link": "#",
        "image": "https://picsum.photos/640/640?random=159",
        "is_active": true
      }
    ]
  }
}
```

> Only banners with `is_active: true` are returned.

---

## 7. Categories

```
GET {{BASE_URL}}/:slug_toko/categories
```

No auth required. Returns all parent categories with their children nested.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Categories fetched successfully",
  "data": {
    "categories": [
      {
        "id": "cat_001",
        "name": "Laptop",
        "slug": "laptop",
        "parent_id": null,
        "children": [
          { "id": "cat_101", "name": "Laptop Acer", "slug": "acer", "parent_id": "cat_001" },
          { "id": "cat_102", "name": "Laptop Asus", "slug": "asus", "parent_id": "cat_001" }
        ]
      }
    ]
  }
}
```

---

## 8. Products

### 8.1 List Products

```
GET {{BASE_URL}}/:slug_toko/products
```

No auth required.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Query Parameters:**

| Param         | Type     | Default  | Description                                      |
| ------------- | -------- | -------- | ------------------------------------------------ |
| `search`      | `string` | —        | Full-text search on title, brand, category       |
| `category`    | `string` | —        | Category **slug** (matches parent or child slug) |
| `subcategory` | `string` | —        | Subcategory slug (exact match within category)   |
| `sort`        | `string` | `newest` | See sort values below                            |
| `price_min`   | `number` | —        | Minimum price in IDR                             |
| `price_max`   | `number` | —        | Maximum price in IDR                             |
| `cursor`      | `string` | —        | Cursor for pagination (from `next_cursor`)       |
| `limit`       | `number` | `20`     | Items per page (max 100)                         |

**`sort` values (as sent to backend):**
| Value | Behavior |
|---|---|
| `newest` | Sort by `created_at` descending |
| `price_asc` | Sort ascending by price |
| `price_desc` | Sort descending by price |
| `best_seller` | Sort descending by `sold_count` |

> **Frontend note:** The `useProducts` composable maps legacy filter values (`price_low_to_high` → `price_asc`, `price_high_to_low` → `price_desc`, `most_popular` → `best_seller`). Price range filters are converted to `price_min`/`price_max` query params. Cursor-based pagination replaces page-based.

**IMPORTANT: Backend Response Structure**

The products list endpoint returns a **cursor-based** DTO different from the old page-based format:

```json
{
  "status": true,
  "message": "Products fetched successfully",
  "data": {
    "items": [...],
    "total_count": 42,
    "next_cursor": "prod_020"
  }
}
```

Each product in `items[]` uses the **ProductEcommerceDTO** shape (all fields use `snake_case`):

| DTO Field                     | Type           | Nullable | Frontend maps to      | Description                  |
| ----------------------------- | -------------- | -------- | --------------------- | ---------------------------- |
| `id`                          | `string`       | ✅ Never | `id`                  | Unique ID                    |
| `title` / `name`              | `string`       | ✅ Never | `title`               | Product title (duplicate)    |
| `slug`                        | `string`       | ✅ Never | `slug`                | URL slug                     |
| `sku`                         | `string`       | ✅ Never | —                     | SKU                          |
| `store_slug` / `store_id`     | `string`       | ✅ Never | —                     | Store identifier             |
| `barcode`                     | `string`       | ⚠️ Null  | —                     | Barcode                      |
| `price` / `general_price`     | `number`       | ✅ Never | `price`               | Base price (duplicate)       |
| `stock`                       | `number`       | ✅ Never | `stock`               | Available stock              |
| `weight`                      | `number`       | ⚠️ Null  | —                     | Weight in grams              |
| `minimum_buy`                 | `number`       | ✅ Never | `minimum_buy`         | Minimum purchase qty         |
| `is_new`                      | `boolean`      | ✅ Never | `is_new`              | New product flag             |
| `is_best_seller`              | `boolean`      | ✅ Never | `is_best_seller`      | Best seller flag             |
| `is_active`                   | `boolean`      | ✅ Never | —                     | Active status                |
| `category`                    | `string`       | ⚠️ Null  | `category`            | Category name                |
| `category_name`               | `string`       | ⚠️ Null  | —                     | Mirror of `category`         |
| `brand` / `brand_name`        | `string`       | ⚠️ Null  | `brand`               | Brand name (duplicate)       |
| `variant_name`                | `string`       | ⚠️ Null  | —                     | Variant name                 |
| `image`                       | `string`       | ⚠️ Null  | —                     | Primary image URL (backward) |
| `images[].photo_url`          | `string`       | ✅ Never | `image`               | Image URL (primary first)    |
| `discounts[].discount_value`  | `number`       | ✅ Never | `discount_percentage` | Active discount %            |
| `discount_percentage`         | `number`       | ⚠️ Null  | —                     | Backward compat              |
| `sales_stats.sold_count`      | `number`       | ✅ Never | `sold_count`          | Units sold                   |
| `sales_stats.last_sold_at`    | `string`       | ⚠️ Null  | —                     | Last sold timestamp          |
| `review_summary.rating_avg`   | `number`       | ⚠️ Null  | `rating`              | Average rating               |
| `review_summary.review_count` | `number`       | ✅ Never | `review_count`        | Total reviews                |
| `sold_count`                  | `number`       | ✅ Never | —                     | Backward compat              |
| `rating`                      | `number`       | ⚠️ Null  | —                     | Backward compat              |
| `review_count`                | `number`       | ✅ Never | —                     | Backward compat              |
| `created_at`                  | `string` (ISO) | ✅ Never | —                     | Creation timestamp           |
| `updated_at`                  | `string` (ISO) | ✅ Never | —                     | Last update timestamp        |

> **Catatan:** `sales_stats` dan `review_summary` sebagai **entire object** bisa `null` (⚠️). Frontend sudah handle dengan optional chaining (`?.`).
> Frontend `useProducts` composable maps DTO ini ke `ProductCard` via `mapRawProductToCard()`.

---

### 8.2 Product Detail

```
GET {{BASE_URL}}/:slug_toko/products/:slug
```

No auth required.

**Path Parameters:**
| Param | Type | Required | Description |
| ----------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `slug` | `string` | ✅ | Product's URL slug |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Product fetched successfully",
  "data": {
    "product": {
      "id": "prod_002",
      "title": "ASUS VivoBook 15 X1504ZA Intel Core i5-1235U RAM 8GB SSD 512GB 15.6\" FHD Win 11",
      "name": "ASUS VivoBook 15 X1504ZA Intel Core i5-1235U RAM 8GB SSD 512GB 15.6\" FHD Win 11",
      "slug": "asus-vivobook-15-x1504za-i5-8gb",
      "sku": "234252636374",
      "store_slug": "sadigit",
      "store_id": "store_001",
      "description": "Processor:<br />Intel Core i5-1235U 1.3 GHz (12MB Cache, up to 4.4 GHz, 10 cores)<br /><br />• Memory: 8GB DDR4 3200MHz (1 slot upgradable)<br />• Storage: 512GB M.2 NVMe SSD<br />• Display: 15.6-inch, FHD (1920x1080), TN, 60Hz<br />• Battery: 42Whr",
      "category_slug": "asus",
      "category": "Laptop Asus",
      "category_name": "Laptop Asus",
      "sub_category": null,
      "sub_category_name": null,
      "brand": "Asus",
      "brand_name": "Asus",
      "variant_name": null,
      "general_price": 7500000,
      "price": 7500000,
      "stock": 85,
      "weight": 2100,
      "width": null,
      "length": null,
      "height": null,
      "is_active": true,
      "is_new": false,
      "is_best_seller": false,
      "minimum_buy": 1,
      "barcode": null,
      "image": "https://picsum.photos/468/468?random=21",
      "images": [
        {
          "id": "img_prod_002_0",
          "photo_url": "https://picsum.photos/468/468?random=21",
          "is_primary": true
        },
        {
          "id": "img_prod_002_1",
          "photo_url": "https://picsum.photos/468/468?random=22",
          "is_primary": false
        },
        {
          "id": "img_prod_002_2",
          "photo_url": "https://picsum.photos/468/468?random=23",
          "is_primary": false
        }
      ],
      "discounts": [],
      "sales_stats": { "sold_count": 92, "last_sold_at": null },
      "review_summary": { "rating_avg": 4.6, "review_count": 14 },
      "discount_percentage": null,
      "rating": 4.6,
      "sold_count": 92,
      "created_at": "2025-09-15T00:00:00Z",
      "updated_at": "2025-09-15T00:00:00Z",
      "variants": [
        {
          "id": "b7c2a0e4-6a7a-4b8a-9b1c-7e6c2f4b0c11",
          "label": "8GB DDR5",
          "value": "8gb",
          "group": "ram",
          "price": 7500000,
          "options": [
            {
              "id": "2c1f5bb3-3ef7-4a1b-9b34-1c6d7c5a2a10",
              "label": "256GB SSD",
              "value": "256gb",
              "group": "kapasitas",
              "price": 7500000
            },
            {
              "id": "f1a8b32a-6b2e-4b70-a7d4-9b2a1c4d7e3f",
              "label": "512GB SSD",
              "value": "512gb",
              "group": "kapasitas",
              "price": 8750000
            }
          ]
        },
        {
          "id": "e9b7c2d1-8b2c-4b4a-9a1a-1e3b7f4c9d2a",
          "label": "16GB DDR5",
          "value": "16gb",
          "group": "ram",
          "price": 10500000,
          "options": [
            {
              "id": "3d7a9f12-4c1b-4f1b-8c22-9d1a3e5f7b90",
              "label": "512GB SSD",
              "value": "512gb",
              "group": "kapasitas",
              "price": 10500000
            },
            {
              "id": "8c1d2f3a-5b6e-4f7a-9c10-2b3a4d5e6f70",
              "label": "1TB SSD",
              "value": "1tb",
              "group": "kapasitas",
              "price": 12000000
            }
          ]
        }
      ],
      "parent_category": { "name": "Laptop", "slug": "laptop" },
      "reviews": [
        {
          "id": "review_017",
          "user_id": "user_001",
          "user_name": "John Doe",
          "order_id": "TRX-F88421039-552781",
          "rating": 5,
          "review": "Sudah dipakai beberapa minggu, tetap stabil. Recommended untuk mahasiswa dan pekerja kantor.",
          "variant_label": "8GB DDR5, 512GB SSD",
          "created_at": "2026-04-27T18:47:00.000Z",
          "updated_at": "2026-04-27T18:47:00.000Z"
        },
        {
          "id": "review_016",
          "user_id": "user_003",
          "user_name": "Siti Dealer",
          "order_id": "TRX-M48290517-164290",
          "rating": 2,
          "review": "Unit saya sempat ada dead pixel kecil, tapi seller responsif bantu proses penanganan.",
          "variant_label": "8GB DDR5, 512GB SSD",
          "created_at": "2026-04-27T10:03:00.000Z",
          "updated_at": "2026-04-27T10:03:00.000Z"
        },
        {
          "id": "review_015",
          "user_id": "user_002",
          "user_name": "Budi Santoso",
          "order_id": "TRX-M48290517-164290",
          "rating": 4,
          "review": "Baterai cukup untuk kerja 5-6 jam, charger ringan. Overall puas dengan pembelian ini.",
          "variant_label": "8GB DDR5, 512GB SSD",
          "created_at": "2026-04-26T15:22:00.000Z",
          "updated_at": "2026-04-26T15:22:00.000Z"
        },
        {
          "id": "review_014",
          "user_id": "user_001",
          "user_name": "John Doe",
          "order_id": "TRX-F99017352-331204",
          "rating": 5,
          "review": "Packaging aman banget, unit mulus tanpa lecet. Langsung siap pakai dari box.",
          "variant_label": "16GB DDR5, 512GB SSD",
          "created_at": "2026-04-26T07:18:00.000Z",
          "updated_at": "2026-04-26T07:18:00.000Z"
        }
      ],
      "review_count": 14
    }
  }
}
```

> **Variant structure:** `variants` is an array of `VariantOption[]` or `null`. Each option has `id` (UUID), `label`, `value`, `group` (string — e.g. `"ram"`, `"warna"`, `"ukuran"`, `"kapasitas"`), optional `price` override, and optional `options` for sub-variants (level 2, same interface). Products with no variants return `variants: null`.
>
> **Variant pricing:** `product.price` is always the **lowest variant price** (shown on cards as "Mulai dari Rp X"). When the user selects a variant, use `variant.price` as the actual price. Products with no variants (`variants: null`) use `product.price` directly.
>
> **Variant selection format:** In cart/order items, the `variant` field stores the selected option UUID. Format: `"optionUuid"` (level 1) or `"optionUuid/subOptionUuid"` (level 2). The `variant_label` is resolved server-side and contains human-readable labels like `"8GB DDR5, 512GB SSD"`.
>
> **Consistency note:** The `product` object in detail response shares all base fields from `ProductEcommerceDTO` (same as list items), plus extra fields: `variants`, `parent_category`, `reviews`, `review_count`, `description`. All fields use `snake_case`. `weight` is always a **number** in grams.
>
> **⚠️ Nullable fields:** Perhatikan bahwa `category`, `brand`, `description`, `weight`, `barcode`, `sales_stats`, `review_summary`, `parent_category`, `discount_percentage`, `rating` bisa bernilai `null`. Frontend sudah handle dengan default values dan optional chaining.
>
> **Derived fields:** `image` diambil dari `images[0].photo_url` (null jika `images` kosong). `review_count` diambil dari `review_summary.review_count`.

**Failure:** `404` if slug not found or product is inactive.

---

### 8.3 Related Products

```
GET {{BASE_URL}}/:slug_toko/products/:slug/related
```

No auth required. Returns up to 12 products from the same category tree.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Related products fetched successfully",
  "data": {
    "items": [
      {
        "id": "prod_016",
        "title": "Intel Core i5-14400F Processor 10 Cores 16 Threads LGA1700",
        "name": "Intel Core i5-14400F Processor 10 Cores 16 Threads LGA1700",
        "slug": "intel-core-i5-14400f-lga1700",
        "sku": "678797818929",
        "store_slug": "sadigit",
        "description": null,
        "barcode": null,
        "price": 3199000,
        "stock": 85,
        "weight": 200,
        "width": null,
        "length": null,
        "height": null,
        "is_active": true,
        "is_new": true,
        "is_best_seller": true,
        "minimum_buy": 1,
        "category": "Processor",
        "sub_category": null,
        "brand": "Intel",
        "brand_name": "Intel",
        "variant_name": null,
        "image": "https://picsum.photos/468/468?random=161",
        "images": [
          {
            "id": "img_prod_016_0",
            "photo_url": "https://picsum.photos/468/468?random=161",
            "is_primary": true
          },
          {
            "id": "img_prod_016_1",
            "photo_url": "https://picsum.photos/468/468?random=162",
            "is_primary": false
          }
        ],
        "discounts": [],
        "sales_stats": { "sold_count": 210, "last_sold_at": null },
        "review_summary": { "rating_avg": 4.8, "review_count": 0 },
        "discount_percentage": null,
        "rating": 4.8,
        "sold_count": 210,
        "created_at": "2025-12-01T00:00:00Z",
        "updated_at": "2025-12-01T00:00:00Z"
      }
    ]
  }
}
```

> **Note:** Related products use the exact same `ProductEcommerceDTO` shape as the list endpoint (`items[]`), so frontend can use `mapRawProductToCard()` directly.

---

## 9. Cart

All cart endpoints require authentication (`access_token` cookie).

---

### 9.1 Get Cart

```
GET {{BASE_URL}}/:slug_toko/cart
```

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Cart fetched successfully",
  "data": {
    "items": [
      {
        "id": "cart_001",
        "product_id": "prod_001",
        "quantity": 1,
        "variant": "e9b7c2d1-8b2c-4b4a-9a1a-1e3b7f4c9d2a/3d7a9f12-4c1b-4f1b-8c22-9d1a3e5f7b90",
        "variant_label": "16GB DDR5, 512GB SSD",
        "unit_price": 15340000,
        "added_at": "2026-02-20T10:00:00Z",
        "store": {
          "id": "store_001",
          "slug": "olpos",
          "name": "OLPOS Store"
        },
        "product": {
          "id": "prod_001",
          "title": "ACER ASPIRE 14 A14-51M Intel Core i7-150U RAM 16GB DDR5 SSD 512GB NVMe Backlight Keyboard Win 11 Steel Grey",
          "slug": "acer-aspire-14-a14-51m-i7-16gb-512gb",
          "price": 12999000,
          "discount_percentage": 10,
          "rating": 4.8,
          "sold_count": 138,
          "is_new": false,
          "is_best_seller": true,
          "stock": 120,
          "image": "https://picsum.photos/468/468?random=11"
        }
      },
      {
        "id": "cart_002",
        "product_id": "prod_005",
        "quantity": 2,
        "variant": "",
        "variant_label": "",
        "unit_price": 1350000,
        "added_at": "2026-02-21T14:00:00Z",
        "product": {
          "id": "prod_005",
          "title": "Logitech MX Master 3S Wireless Mouse - Bluetooth & USB Receiver",
          "slug": "logitech-mx-master-3s-wireless",
          "price": 1350000,
          "discount_percentage": 5,
          "rating": 4.9,
          "sold_count": 560,
          "is_new": false,
          "is_best_seller": true,
          "stock": 200,
          "image": "https://picsum.photos/468/468?random=51"
        }
      }
    ],
    "subtotal": 18040000,
    "total_items": 2
  }
}
```

> `unit_price` = resolved price for the selected variant (`variant.price` if available, otherwise `product.price`). Always use `unit_price` for line-item calculations. `product.price` inside the `product` object is the base/lowest price for display only.

---

### 9.2 Add to Cart

```
POST {{BASE_URL}}/:slug_toko/cart
```

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Request Body:**

```json
{
  "product_id": "prod_001",
  "quantity": 2,
  "variant": "e9b7c2d1-8b2c-4b4a-9a1a-1e3b7f4c9d2a/3d7a9f12-4c1b-4f1b-8c22-9d1a3e5f7b90"
}
```

| Field        | Type     | Required | Notes                                      |
| ------------ | -------- | -------- | ------------------------------------------ |
| `product_id` | `string` | ✅       | —                                          |
| `quantity`   | `number` | —        | Defaults to `1`                            |
| `variant`    | `string` | —        | Defaults to first variant option ID (UUID) |

> If the exact same `product_id` + `variant` combination already exists in the cart, the quantities are **merged** (incremented) instead of creating a new entry.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Product added to cart",
  "data": {
    "cart_item_id": "cart_001",
    "quantity": 2
  }
}
```

---

### 9.3 Update Cart Item

```
PUT {{BASE_URL}}/:slug_toko/cart/:id
```

**Path Parameters:**
| Param | Type | Required | Description |
| ----------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `id` | `string` | ✅ | Cart item ID |

**Request Body:**

```json
{
  "quantity": 3
}
```

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Cart item updated",
  "data": {
    "id": "cart_001",
    "quantity": 3
  }
}
```

**Failure:** `404` if cart item not found or belongs to another user.

---

### 9.4 Remove Cart Item

```
DELETE {{BASE_URL}}/:slug_toko/cart/:id
```

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Cart item removed",
  "data": null
}
```

---

## 10. Address

All address endpoints require authentication.

---

### 10.1 List Addresses

```
GET {{BASE_URL}}/address
```

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Addresses fetched successfully",
  "data": {
    "addresses": [
      {
        "id": "addr_001",
        "user_id": "user_001",
        "full_name": "John Doe",
        "phone_number": "081234567890",
        "address": "Jl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Ruko Harmoni Sentosa, Kel. Mekar Asri, Kec. Cempaka Timur",
        "map_address": "Jl. Bunga Sakura Raya No. 127A",
        "latitude": -6.2412,
        "longitude": 106.8045,
        "province_id": 31,
        "province_name": "Daerah Khusus Ibukota Jakarta",
        "city_id": 3174,
        "city_name": "Jakarta Selatan",
        "district_id": 3174070,
        "district_name": "Cempaka Timur",
        "village_id": 3174070001,
        "village_name": "Mekar Asri",
        "country": "Indonesia",
        "postal_code": "12345",
        "note": "Rumah pagar hitam, dekat minimarket.",
        "is_primary": true
      },
      {
        "id": "addr_002",
        "user_id": "user_001",
        "full_name": "John Doe",
        "phone_number": "081234567890",
        "address": "Jl. Merdeka No. 45, Kel. Sukaluyu, Kec. Cibeunying Kaler",
        "map_address": "Jl. Merdeka No. 45",
        "latitude": -6.8906,
        "longitude": 107.6107,
        "province_id": 32,
        "province_name": "Jawa Barat",
        "city_id": 3273,
        "city_name": "Kota Bandung",
        "district_id": 3273090,
        "district_name": "Cibeunying Kaler",
        "village_id": 3273090003,
        "village_name": "Sukaluyu",
        "country": "Indonesia",
        "postal_code": "40123",
        "note": "Masuk gang samping toko fotokopi.",
        "is_primary": false
      }
    ]
  }
}
```

---

### 10.2 Create Address

```
POST {{BASE_URL}}/address
```

**Request Body:**

```json
{
  "full_name": "John Doe",
  "phone_number": "081234567890",
  "address": "Perum Kelapa Gading Permai, Block C5 No.22",
  "map_address": "Jalan Tebet Dalam II E, RW 01, Tebet Barat, Tebet, Jakarta Selatan, Daerah Khusus Ibukota Jakarta, Jawa, 12810, Indonesia",
  "latitude": -6.228188,
  "longitude": 106.84847,
  "province_id": 32,
  "province_name": "Jawa Barat",
  "city_id": 3273,
  "city_name": "Kota Bandung",
  "district_id": 3273091,
  "district_name": "Coblong",
  "village_id": 3273091002,
  "village_name": "Dago",
  "country": "Indonesia",
  "postal_code": "12810",
  "note": "Kedua dari ujung",
  "is_primary": false
}
```

| Field           | Type      | Required | Notes                                          |
| --------------- | --------- | -------- | ---------------------------------------------- |
| `full_name`     | `string`  | ✅       | Nama lengkap penerima                          |
| `phone_number`  | `string`  | ✅       | Nomor telepon penerima                         |
| `address`       | `string`  | ✅       | Alamat lengkap                                 |
| `map_address`   | `string`  | —        | Alamat peta / pin string                       |
| `latitude`      | `number`  | —        | Koordinat latitude                             |
| `longitude`     | `number`  | —        | Koordinat longitude                            |
| `province_id`   | `number`  | ✅       | ID provinsi (dari region API `code`)           |
| `province_name` | `string`  | ✅       | Nama provinsi                                  |
| `city_id`       | `number`  | ✅       | ID kota/kabupaten (dari region API `code`)     |
| `city_name`     | `string`  | ✅       | Nama kota/kabupaten                            |
| `district_id`   | `number`  | ✅       | ID kecamatan (dari region API `code`)          |
| `district_name` | `string`  | ✅       | Nama kecamatan                                 |
| `village_id`    | `number`  | ✅       | ID kelurahan/desa (dari region API `code`)     |
| `village_name`  | `string`  | ✅       | Nama kelurahan/desa                            |
| `country`       | `string`  | —        | Negara                                         |
| `postal_code`   | `string`  | —        | Kode pos                                       |
| `note`          | `string`  | —        | Catatan alamat                                 |
| `is_primary`    | `boolean` | —        | Jika `true`, alamat lain di-unset dari primary |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Address created successfully",
  "data": {
    "address": {
      "id": "addr_1776344503205_0dcab77c",
      "user_id": "user_001",
      "full_name": "John Doe",
      "phone_number": "081234567890",
      "address": "Perum Kelapa Gading Permai, Block C5 No.22",
      "map_address": "Jalan Tebet Dalam II E, RW 01, Tebet Barat, Tebet, Jakarta Selatan, Daerah Khusus Ibukota Jakarta, Jawa, 12810, Indonesia",
      "latitude": -6.228188,
      "longitude": 106.84847,
      "province_id": 32,
      "province_name": "Jawa Barat",
      "city_id": 3273,
      "city_name": "Kota Bandung",
      "district_id": 3273091,
      "district_name": "Coblong",
      "village_id": 3273091002,
      "village_name": "Dago",
      "country": "Indonesia",
      "postal_code": "12810",
      "note": "Kedua dari ujung",
      "is_primary": false
    }
  }
}
```

---

### 10.3 Update Address

```
PUT {{BASE_URL}}/address/:id
```

All fields are optional — only the provided fields are updated.

**Path Parameter:** `id` — address ID.

**Request Body (partial update, example):**

```json
{
  "full_name": "John Updated",
  "phone_number": "089876543210",
  "address": "Jl. Merdeka No. 10",
  "map_address": "-6.1755, 106.8275",
  "latitude": -6.1755,
  "longitude": 106.8275,
  "province_id": 31,
  "province_name": "DKI Jakarta",
  "city_id": 3171,
  "city_name": "Kota Jakarta Pusat",
  "district_id": 3171070,
  "district_name": "Gambir",
  "village_id": 3171070003,
  "village_name": "Cideng",
  "country": "Indonesia",
  "postal_code": "10110",
  "note": "Rumah pojok",
  "is_primary": true
}
```

| Field           | Type      | Required | Notes                                                        |
| --------------- | --------- | -------- | ------------------------------------------------------------ |
| `full_name`     | `string`  | —        | Nama lengkap penerima                                        |
| `phone_number`  | `string`  | —        | Nomor telepon penerima                                       |
| `address`       | `string`  | —        | Alamat jalan                                                 |
| `map_address`   | `string`  | —        | Alamat peta / pin string                                     |
| `latitude`      | `number`  | —        | Koordinat latitude                                           |
| `longitude`     | `number`  | —        | Koordinat longitude                                          |
| `province_id`   | `number`  | —        | ID provinsi                                                  |
| `province_name` | `string`  | —        | Nama provinsi                                                |
| `city_id`       | `number`  | —        | ID kota/kabupaten                                            |
| `city_name`     | `string`  | —        | Nama kota/kabupaten                                          |
| `district_id`   | `number`  | —        | ID kecamatan                                                 |
| `district_name` | `string`  | —        | Nama kecamatan                                               |
| `village_id`    | `number`  | —        | ID kelurahan/desa                                            |
| `village_name`  | `string`  | —        | Nama kelurahan/desa                                          |
| `country`       | `string`  | —        | Negara                                                       |
| `postal_code`   | `string`  | —        | Kode pos                                                     |
| `note`          | `string`  | —        | Catatan alamat/patokan                                       |
| `is_primary`    | `boolean` | —        | Jika `true`, alamat lain harus dinonaktifkan sebagai primary |

> **BE alignment note:** endpoint contract for update is `PUT /address/:id` with partial update semantics and response envelope unchanged (`status`, `message`, `data.address`).

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Address updated successfully",
  "data": {
    "address": {
      "id": "addr_001",
      "user_id": "user_001",
      "full_name": "John Doe",
      "phone_number": "081234567890",
      "address": "Jl. Merdeka No. 10",
      "map_address": "-6.1755, 106.8275",
      "latitude": -6.1755,
      "longitude": 106.8275,
      "province_id": 31,
      "province_name": "DKI Jakarta",
      "city_id": 3171,
      "city_name": "Kota Jakarta Pusat",
      "district_id": 3171070,
      "district_name": "Gambir",
      "village_id": 3171070003,
      "village_name": "Cideng",
      "country": "Indonesia",
      "postal_code": "10110",
      "note": "Rumah pojok",
      "is_primary": true
    }
  }
}
```

---

### 10.4 Delete Address

```
DELETE {{BASE_URL}}/address/:id
```

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Address deleted successfully",
  "data": null
}
```

---

## 11. Regions

> **Data Source:** All region data is fetched from **RajaOngkir API** via Nuxt server proxy with 24-hour caching.
>
> **Authentication:** All `/regions/*` endpoints require authentication (`access_token` cookie). Returns `401 Unauthorized` if unauthenticated.

---

### 11.1 Provinces

```
GET {{BASE_URL}}/regions/provinces
```

Fetches all provinces from RajaOngkir. Cached for 24 hours.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Provinces fetched successfully",
  "data": {
    "provinces": [
      { "code": "11", "name": "Aceh" },
      { "code": "12", "name": "Sumatera Utara" },
      { "code": "31", "name": "DKI Jakarta" }
    ]
  }
}
```

---

### 11.2 Cities

```
GET {{BASE_URL}}/regions/cities?province_code=31
```

Fetches cities within a specific province from RajaOngkir. Cached for 24 hours.

**Query Parameter:**

| Param           | Type     | Required | Description              |
| --------------- | -------- | -------- | ------------------------ |
| `province_code` | `string` | ✅       | Filter by province code. |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Cities fetched successfully",
  "data": {
    "cities": [
      { "code": "3101", "province_code": "31", "name": "Jakarta Selatan", "zip_code": "0" },
      { "code": "3102", "province_code": "31", "name": "Jakarta Pusat", "zip_code": "0" }
    ]
  }
}
```

---

### 11.3 Districts

```
GET {{BASE_URL}}/regions/districts?city_code=3171
```

Fetches districts (kecamatan) within a specific city from RajaOngkir. Cached for 24 hours.

**Query Parameter:**

| Param       | Type     | Required | Description          |
| ----------- | -------- | -------- | -------------------- |
| `city_code` | `string` | ✅       | Filter by city code. |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Districts fetched successfully",
  "data": {
    "districts": [{ "code": "317101", "city_code": "3171", "name": "Tebet", "zip_code": "12820" }]
  }
}
```

---

### 11.4 Subdistricts

```
GET {{BASE_URL}}/regions/subdistricts?district_code=317101
```

Fetches subdistricts (kelurahan/desa) within a specific district from RajaOngkir. Cached for 24 hours.

> **Note:** Previously named "Villages". Renamed to "Subdistricts" to align with RajaOngkir terminology.

**Query Parameter:**

| Param           | Type     | Required | Description              |
| --------------- | -------- | -------- | ------------------------ |
| `district_code` | `string` | ✅       | Filter by district code. |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Subdistricts fetched successfully",
  "data": {
    "subdistricts": [
      {
        "code": "3171011001",
        "district_code": "317101",
        "name": "Menteng Dalam",
        "zip_code": "12830"
      }
    ]
  }
}
```

---

## 12. Payment Methods

```
GET {{BASE_URL}}/:slug_toko/payment-method
```

Requires authentication. Returns available payment methods configured for the store (QRIS, BANK_TRANSFER).

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Payment method configs retrieved successfully",
  "data": [
    {
      "id": "spmc_store_001_pm_qris",
      "payment_method": {
        "id": "pm_qris",
        "name": "QRIS",
        "icon": null,
        "type": "SELLING",
        "order": 1
      },
      "is_active": true
    },
    {
      "id": "spmc_store_001_pm_bank_transfer",
      "payment_method": {
        "id": "pm_bank_transfer",
        "name": "BANK_TRANSFER",
        "icon": null,
        "type": "SELLING",
        "order": 2
      },
      "is_active": true
    }
  ]
}
```

> **Note:** Payment methods are auto-seeded on first request for any store. The actual payment method for checkout is determined by order total (>10M → BANK_TRANSFER, ≤10M → QRIS).

**Failure Responses:**

| Condition          | HTTP  | `message`                |
| ------------------ | ----- | ------------------------ |
| Unauthenticated    | `401` | `Unauthorized`           |
| Missing store slug | `400` | `Store slug is required` |
| Store not found    | `404` | `Store not found`        |

---

## 13. Expedition (Courier)

```
POST {{BASE_URL}}/:slug_toko/ekspedisi
```

Requires authentication. Calculates shipping costs for cart items based on total weight and destination address.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Request Body:**

```json
{
  "address_id": "addr_001",
  "cart_item_ids": ["cart_001", "cart_002"]
}
```

| Field           | Type       | Required | Description                                            |
| --------------- | ---------- | -------- | ------------------------------------------------------ |
| `address_id`    | `string`   | ✅       | Destination address ID (must belong to user)           |
| `cart_item_ids` | `string[]` | —        | Filter specific cart items; omit to use all cart items |

**Example Request:**

```
POST {{BASE_URL}}/sadigit-store/ekspedisi
{
  "address_id": "addr_001"
}
```

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Query Parameter:**

| Param        | Type     | Required | Description                                                                                                    |
| ------------ | -------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `address_id` | `string` | ✅       | Address ID owned by authenticated user. Shipping options/cost are calculated against this destination address. |

**Example Request:**

```
GET {{BASE_URL}}/:slug_toko/ekspedisi?address_id=addr_001
```

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Expeditions fetched successfully",
  "data": {
    "address_id": "addr_001",
    "expeditions": [
      {
        "id": "eksp_001",
        "name": "JNE",
        "value": "jne",
        "cost": 15000,
        "is_active": true
      },
      {
        "id": "eksp_002",
        "name": "J&T Express",
        "value": "jnt",
        "cost": 12000,
        "is_active": true
      }
    ]
  }
}
```

**Failure Responses:**

| Condition                                  | HTTP  | `message`                |
| ------------------------------------------ | ----- | ------------------------ |
| Unauthenticated                            | `401` | `Unauthorized`           |
| Missing `address_id`                       | `400` | `address_id is required` |
| `address_id` not found / not owned by user | `404` | `Address not found`      |

> **BE Note:** `cost` in mock is still a flat rate. In production, shipping cost should be calculated dynamically based on merchant origin and destination from `address_id`.

---

## 14. Checkout

```
POST {{BASE_URL}}/:slug_toko/checkout
```

Requires authentication. Creates a new order from the user's cart, clears the checked-out items, and returns payment details.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Request Body:**

```json
{
  "expedition": "jnt",
  "address_id": "addr_001",
  "voucher_id": "vcr_001",
  "bank_account_number": "1234567890",
  "bank_account_type": "BCA",
  "cart_item_ids": ["cart_001", "cart_002"]
}
```

| Field                 | Type       | Required | Notes                                                                                                              |
| --------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `expedition`          | `string`   | ✅       | Must match an active expedition `value`                                                                            |
| `address_id`          | `string`   | —        | If omitted, uses the user's primary address                                                                        |
| `voucher_id`          | `string`   | —        | Optional voucher ID to apply discount                                                                              |
| `bank_account_number` | `string`   | —        | Required when final `total > 10000000` (bank transfer only). Selected from store profile bank accounts             |
| `bank_account_type`   | `string`   | —        | Required when final `total > 10000000`. Bank type (e.g. `BCA`, `MANDIRI`). Auto-derived from selected bank account |
| `cart_item_ids`       | `string[]` | —        | If omitted, all cart items are checked out                                                                         |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Order created successfully",
  "data": {
    "order_id": "TRX-E25175385-536645",
    "payment_method": "bank_transfer",
    "payment_bank_account": {
      "bank_name": "BCA",
      "account_number": "1234567890"
    },
    "subtotal": 33380000,
    "discount_total": 100000,
    "total": 33292000,
    "payment_expired_at": "2026-04-16T12:18:30.711Z",
    "qris_billing": {
      "invoice_number": "TRX-E25175385-536645",
      "qr_code": "QRIS-PAYMENT-TRX-E25175385-536645-SAMPLE-DATA",
      "qris_expires_at": "2026-04-16T12:18:30.711Z"
    }
  }
}
```

**Side Effects:**

- Creates a new order with `status: "pending_payment"`.
- Removes checked-out items from the cart.
- `payment_expired_at` is **10 minutes** from creation.
- Payment method is selected automatically:
  - `total <= 10.000.000` => `payment_method: "qris"`
  - `total > 10.000.000` => `payment_method: "bank_transfer"` (QRIS disabled)

**Failure Responses:**
| Condition | HTTP | `message` |
|---|---|---|
| Unauthenticated | `401` | `Unauthorized` |
| Existing non-expired pending payment order | `409` | `You have an unfinished payment. Please complete it before creating a new order.` |
| `expedition` missing | `400` | `Expedition is required` |
| Invalid expedition value | `400` | `Invalid expedition selected` |
| `address_id` not found | `404` | `Address not found` |
| No primary address & no `address_id` | `400` | `No address found. Please add a delivery address.` |
| Cart empty (or filtered items empty) | `400` | `Cart is empty` |
| `voucher_id` invalid/inactive | `404` | `Voucher not found or inactive` |
| `voucher_id` below minimum transaction | `400` | `Minimum transaction is 150000` |
| `total > 10000000` and `bank_account_number` or `bank_account_type` missing | `400` | `Bank account number and type are required for transactions above 10000000` |

---

## 15. Orders

All order endpoints require authentication.

---

### 15.1 Order List

```
GET {{BASE_URL}}/:slug_toko/orders
```

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Query Parameters:**

| Param    | Type     | Default | Description                               |
| -------- | -------- | ------- | ----------------------------------------- |
| `status` | `string` | —       | Filter by order status (see values below) |
| `search` | `string` | —       | Search by order ID or product title       |
| `page`   | `number` | `1`     | Page number                               |
| `limit`  | `number` | `10`    | Items per page (max 50)                   |

**`status` values:** `pending_payment` | `processing` | `shipped` | `delivered` | `finished` | `cancelled`

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Orders fetched successfully",
  "data": {
    "orders": [
      {
        "id": "TRX-E25175385-536645",
        "user_id": "user_001",
        "status": "pending_payment",
        "payment_method": "bank_transfer",
        "payment_bank_account": {
          "bank_name": "BCA",
          "account_number": "1234567890"
        },
        "qris_billing": null,
        "items": [
          {
            "product_id": "prod_001",
            "product_title": "ACER ASPIRE 14 A14-51M Intel Core i7-150U RAM 16GB DDR5 SSD 512GB NVMe Backlight Keyboard Win 11 Steel Grey",
            "product_image": "https://picsum.photos/468/468?random=11",
            "price": 15340000,
            "discount_percentage": 10,
            "rating": 4.8,
            "sold_count": 138,
            "is_new": false,
            "is_best_seller": true,
            "quantity": 2,
            "variant": "e9b7c2d1-8b2c-4b4a-9a1a-1e3b7f4c9d2a/3d7a9f12-4c1b-4f1b-8c22-9d1a3e5f7b90",
            "variant_label": "16GB DDR5, 512GB SSD",
            "user_review": null
          },
          {
            "product_id": "prod_005",
            "product_title": "Logitech MX Master 3S Wireless Mouse - Bluetooth & USB Receiver",
            "product_image": "https://picsum.photos/468/468?random=51",
            "price": 1350000,
            "discount_percentage": 5,
            "rating": 4.9,
            "sold_count": 560,
            "is_new": false,
            "is_best_seller": true,
            "quantity": 2,
            "variant": "",
            "variant_label": "",
            "user_review": null
          }
        ],
        "address": "John Doe · 081234567890\nJl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Ruko Harmoni Sentosa, Kel. Mekar Asri, Kec. Cempaka Timur, Mekar Asri, Cempaka Timur, Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12345, Indonesia · Patokan: Rumah pagar hitam, dekat minimarket.",
        "expedition": "jnt",
        "subtotal": 33380000,
        "discount_total": 100000,
        "voucher_id": "vcr_001",
        "voucher_code": "HEMAT10",
        "voucher_name": "Diskon 10% Maks 100rb",
        "total": 33292000,
        "qris_billing": {
          "invoice_number": "TRX-E25175385-536645",
          "qr_code": "QRIS-PAYMENT-TRX-E25175385-536645-SAMPLE-DATA",
          "qris_expires_at": "2026-04-16T12:18:30.711Z"
        },
        "payment_expired_at": "2026-04-16T12:18:30.711Z",
        "tracking": null,
        "created_at": "2026-04-16T12:08:30.711Z"
      },
      {
        "id": "TRX-B61260120-720713",
        "user_id": "user_001",
        "status": "pending_payment",
        "items": [
          {
            "product_id": "prod_001",
            "product_title": "ACER ASPIRE 14 A14-51M Intel Core i7-150U RAM 16GB DDR5 SSD 512GB NVMe",
            "product_image": "https://picsum.photos/468/468?random=11",
            "price": 15340000,
            "quantity": 1,
            "variant": "e9b7c2d1-8b2c-4b4a-9a1a-1e3b7f4c9d2a/3d7a9f12-4c1b-4f1b-8c22-9d1a3e5f7b90",
            "discount_percentage": 10,
            "rating": 4.8,
            "sold_count": 138,
            "is_new": false,
            "is_best_seller": true,
            "variant_label": "16GB DDR5, 512GB SSD",
            "user_review": null
          }
        ],
        "address": "Jl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Kota Jakarta Selatan, DKI Jakarta 12345",
        "expedition": "jne",
        "subtotal": 15340000,
        "total": 15355000,
        "payment_expired_at": "2026-04-16T12:06:57.812Z",
        "tracking": null,
        "created_at": "2026-04-16T11:51:57.812Z",
        "discount_total": 0,
        "voucher_id": null,
        "voucher_code": null,
        "voucher_name": null
      },
      {
        "id": "TRX-F99017352-331204",
        "user_id": "user_001",
        "status": "finished",
        "items": [
          {
            "product_id": "prod_002",
            "product_title": "ASUS VivoBook 15 X1504ZA Intel Core i5-1235U RAM 8GB SSD 512GB",
            "product_image": "https://picsum.photos/468/468?random=21",
            "price": 10500000,
            "quantity": 1,
            "variant": "e9b7c2d1-8b2c-4b4a-9a1a-1e3b7f4c9d2a/3d7a9f12-4c1b-4f1b-8c22-9d1a3e5f7b90",
            "discount_percentage": null,
            "rating": 4.6,
            "sold_count": 92,
            "is_new": false,
            "is_best_seller": false,
            "variant_label": "16GB DDR5, 512GB SSD",
            "user_review": {
              "id": "review_006",
              "user_id": "user_001",
              "order_id": "TRX-F99017352-331204",
              "product_id": "prod_002",
              "rating": 4,
              "review": "Upgrade RAM 16GB terasa banget. Layar oke, speaker cukup. Minus sedikit di battery saat dipakai render.",
              "created_at": "2026-04-20T14:40:00.000Z",
              "updated_at": "2026-04-20T14:40:00.000Z"
            }
          },
          {
            "product_id": "prod_006",
            "product_title": "SteelSeries Apex 5 Hybrid Mechanical Gaming Keyboard RGB",
            "product_image": "https://picsum.photos/468/468?random=61",
            "price": 1599000,
            "quantity": 1,
            "variant": "",
            "discount_percentage": null,
            "rating": 4.8,
            "sold_count": 146,
            "is_new": false,
            "is_best_seller": true,
            "variant_label": "",
            "user_review": null
          }
        ],
        "address": "Jl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Kota Jakarta Selatan, DKI Jakarta 12345",
        "expedition": "sicepat",
        "subtotal": 12099000,
        "total": 12110000,
        "payment_expired_at": null,
        "tracking": {
          "resi": "SCJKT77889900",
          "courier": "SiCepat",
          "service_code": "BEST",
          "estimation": "1 - 2 Hari",
          "shipped_date": "25 Mar 2026",
          "seller": {
            "name": "Toko Sadigit",
            "location": "Jakarta Selatan"
          },
          "buyer": {
            "name": "John Doe",
            "location": "Jakarta Selatan"
          },
          "steps": [
            {
              "title": "Pesanan selesai diterima pembeli",
              "courier": "Kurir: SiCepat",
              "date": "Jumat, 27 Mar 2026, 12:45 WIB"
            }
          ]
        },
        "created_at": "2026-03-24T09:40:00Z",
        "discount_total": 0,
        "voucher_id": null,
        "voucher_code": null,
        "voucher_name": null
      },
      {
        "id": "TRX-F88421039-552781",
        "user_id": "user_001",
        "status": "finished",
        "items": [
          {
            "product_id": "prod_002",
            "product_title": "ASUS VivoBook 15 X1504ZA Intel Core i5-1235U RAM 8GB SSD 512GB",
            "product_image": "https://picsum.photos/468/468?random=21",
            "price": 8750000,
            "quantity": 1,
            "variant": "b7c2a0e4-6a7a-4b8a-9b1c-7e6c2f4b0c11/f1a8b32a-6b2e-4b70-a7d4-9b2a1c4d7e3f",
            "discount_percentage": null,
            "rating": 4.6,
            "sold_count": 92,
            "is_new": false,
            "is_best_seller": false,
            "variant_label": "8GB DDR5, 512GB SSD",
            "user_review": {
              "id": "review_005",
              "user_id": "user_001",
              "order_id": "TRX-F88421039-552781",
              "product_id": "prod_002",
              "rating": 5,
              "review": "Speknya sesuai, bodi rapi, keyboard enak dipakai. Cocok untuk kerja kantor dan kuliah.",
              "created_at": "2026-04-18T10:02:00.000Z",
              "updated_at": "2026-04-18T10:02:00.000Z"
            }
          }
        ],
        "address": "Jl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Kota Jakarta Selatan, DKI Jakarta 12345",
        "expedition": "jne",
        "subtotal": 8750000,
        "total": 8765000,
        "payment_expired_at": null,
        "tracking": {
          "resi": "JNEJKT22334455",
          "courier": "JNE",
          "service_code": "REG",
          "estimation": "2 - 3 Hari",
          "shipped_date": "10 Mar 2026",
          "seller": {
            "name": "Toko Sadigit",
            "location": "Jakarta Selatan"
          },
          "buyer": {
            "name": "John Doe",
            "location": "Jakarta Selatan"
          },
          "steps": [
            {
              "title": "Pesanan selesai diterima pembeli",
              "courier": "Kurir: JNE",
              "date": "Kamis, 12 Mar 2026, 15:12 WIB"
            }
          ]
        },
        "created_at": "2026-03-09T11:30:00Z",
        "discount_total": 0,
        "voucher_id": null,
        "voucher_code": null,
        "voucher_name": null
      },
      {
        "id": "TRX-S55219073-118420",
        "user_id": "user_001",
        "status": "shipped",
        "items": [
          {
            "product_id": "prod_003",
            "product_title": "HP Pavilion 14 Ryzen 7 7730U RAM 16GB SSD 1TB",
            "product_image": "https://picsum.photos/468/468?random=31",
            "price": 11990000,
            "quantity": 1,
            "variant": "",
            "discount_percentage": 15,
            "rating": 4.9,
            "sold_count": 214,
            "is_new": false,
            "is_best_seller": true,
            "variant_label": "",
            "user_review": null
          },
          {
            "product_id": "prod_011",
            "product_title": "Bantal Leher Memory Foam Ergonomis - Abu Abu",
            "product_image": "https://picsum.photos/468/468?random=111",
            "price": 129000,
            "quantity": 2,
            "variant": "",
            "discount_percentage": null,
            "rating": 4.8,
            "sold_count": 64,
            "is_new": true,
            "is_best_seller": false,
            "variant_label": "",
            "user_review": null
          }
        ],
        "address": "Jl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Kota Jakarta Selatan, DKI Jakarta 12345",
        "expedition": "jnt",
        "subtotal": 12248000,
        "total": 12260000,
        "payment_expired_at": null,
        "tracking": {
          "resi": "JNTJKT99887766",
          "courier": "J&T Express",
          "service_code": "EZ",
          "estimation": "20 - 22 Feb",
          "shipped_date": "19 Feb 2026",
          "seller": {
            "name": "Toko Sadigit",
            "location": "Jakarta Selatan"
          },
          "buyer": {
            "name": "John Doe",
            "location": "Jakarta Selatan"
          },
          "steps": [
            {
              "title": "Paket diterima oleh kurir pickup",
              "courier": "Kurir: J&T Express",
              "date": "Kamis, 19 Feb 2026, 11:40 WIB"
            },
            {
              "title": "Paket diproses di Hub Jakarta Selatan",
              "courier": "Kurir: J&T Express",
              "date": "Kamis, 19 Feb 2026, 18:25 WIB"
            }
          ]
        },
        "created_at": "2026-02-18T10:15:00Z",
        "discount_total": 0,
        "voucher_id": null,
        "voucher_code": null,
        "voucher_name": null
      }
    ],
    "pagination": {
      "total": 9,
      "page": 1,
      "limit": 5,
      "total_pages": 2
    }
  }
}
```

`user_review` is `null` when the authenticated user has not reviewed that order item yet.

---

### 15.2 Order Detail

```
GET {{BASE_URL}}/:slug_toko/orders/:id
```

**Path Parameters:**
| Param | Type | Required | Description |
| ----------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `id` | `string` | ✅ | Order ID |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Order fetched successfully",
  "data": {
    "order": {
      "id": "TRX-H73915084-903611",
      "user_id": "user_001",
      "status": "delivered",
      "items": [
        {
          "product_id": "prod_009",
          "product_title": "Bingkai Foto Akrilik 4x6 Custom Cetak Foto - Hadiah Anniversary",
          "product_image": "https://picsum.photos/468/468?random=91",
          "price": 85000,
          "quantity": 3,
          "variant": "",
          "discount_percentage": 20,
          "rating": 4.7,
          "sold_count": 980,
          "is_new": false,
          "is_best_seller": true,
          "variant_label": "",
          "user_review": {
            "id": "review_001",
            "user_id": "user_001",
            "order_id": "TRX-H73915084-903611",
            "product_id": "prod_009",
            "rating": 5,
            "review": "Produk sesuai deskripsi, hasil cetak rapi, dan packaging aman. Pengiriman juga cepat. Recommended!",
            "created_at": "2026-04-14T08:00:00.000Z",
            "updated_at": "2026-04-14T08:00:00.000Z"
          }
        },
        {
          "product_id": "prod_014",
          "product_title": "Bingkai Foto Akrilik 5x7 Custom Cetak Foto Couple - Kado Ulang Tahun",
          "product_image": "https://picsum.photos/468/468?random=141",
          "price": 110000,
          "quantity": 1,
          "variant": "",
          "discount_percentage": 18,
          "rating": 4.8,
          "sold_count": 521,
          "is_new": false,
          "is_best_seller": true,
          "variant_label": "",
          "user_review": {
            "id": "review_002",
            "user_id": "user_001",
            "order_id": "TRX-H73915084-903611",
            "product_id": "prod_014",
            "rating": 4,
            "review": "Frame bagus, hasil print tajam, cuma pengiriman agak lama 1 hari dari estimasi.",
            "created_at": "2026-04-14T08:15:00.000Z",
            "updated_at": "2026-04-14T08:15:00.000Z"
          }
        },
        {
          "product_id": "prod_013",
          "product_title": "Hadiah Anniversary Couple Engraved Tumbler Set Custom Nama - Stainless Steel",
          "product_image": "https://picsum.photos/468/468?random=131",
          "price": 175000,
          "quantity": 2,
          "variant": "",
          "discount_percentage": null,
          "rating": 4.6,
          "sold_count": 188,
          "is_new": false,
          "is_best_seller": true,
          "variant_label": "",
          "user_review": null
        },
        {
          "product_id": "prod_012",
          "product_title": "Anker USB-C Hub 7-in-1 - 4K HDMI, 100W PD, USB 3.0, SD/TF Card Reader",
          "product_image": "https://picsum.photos/468/468?random=121",
          "price": 450000,
          "quantity": 1,
          "variant": "",
          "discount_percentage": 10,
          "rating": 4.7,
          "sold_count": 430,
          "is_new": false,
          "is_best_seller": true,
          "variant_label": "",
          "user_review": null
        },
        {
          "product_id": "prod_010",
          "product_title": "Set Sprei Bedcover King Size 180x200 Katun Premium - Motif Bunga",
          "product_image": "https://picsum.photos/468/468?random=101",
          "price": 420000,
          "quantity": 1,
          "variant": "",
          "discount_percentage": 12,
          "rating": 4.5,
          "sold_count": 305,
          "is_new": false,
          "is_best_seller": true,
          "variant_label": "",
          "user_review": null
        }
      ],
      "address": "Jl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Kota Jakarta Selatan, DKI Jakarta 12345",
      "expedition": "sicepat",
      "subtotal": 1585000,
      "total": 1596000,
      "payment_expired_at": null,
      "tracking": {
        "resi": "SCJKT001234567",
        "courier": "SiCepat",
        "service_code": "HALU",
        "estimation": "15 - 17 Jan",
        "shipped_date": "14 Jan 2026",
        "seller": {
          "name": "Toko Sadigit",
          "location": "Jakarta Selatan"
        },
        "buyer": {
          "name": "John Doe",
          "location": "Jakarta Selatan"
        },
        "steps": [
          {
            "title": "Paket telah tiba dan diterima oleh penerima",
            "courier": "Kurir: SiCepat",
            "date": "Sabtu, 17 Jan 2026, 13:45 WIB"
          },
          {
            "title": "Paket sedang dalam pengiriman terakhir menuju alamat penerima",
            "courier": "Kurir: SiCepat - Andi",
            "date": "Sabtu, 17 Jan 2026, 09:10 WIB"
          },
          {
            "title": "Paket tiba di Hub SiCepat Jakarta Selatan",
            "courier": "Kurir: SiCepat",
            "date": "Jumat, 16 Jan 2026, 21:30 WIB"
          },
          {
            "title": "Paket berangkat dari Hub Jakarta Pusat",
            "courier": "Kurir: SiCepat",
            "date": "Kamis, 15 Jan 2026, 18:00 WIB"
          },
          {
            "title": "Paket diterima dan diproses di Hub SiCepat Jakarta",
            "courier": "Kurir: SiCepat",
            "date": "Rabu, 14 Jan 2026, 10:00 WIB"
          }
        ]
      },
      "created_at": "2026-01-12T10:00:00Z",
      "discount_total": 0,
      "voucher_id": null,
      "voucher_code": null,
      "voucher_name": null,
      "qris_billing": {
        "invoice_number": "TRX-E25175385-536645",
        "qr_code": "QRIS-PAYMENT-TRX-E25175385-536645-SAMPLE-DATA",
        "qris_expires_at": "2026-04-16T12:18:30.711Z"
      },
      "bukti_transfer": null
    }
  }
}
```

> **Note:** `bukti_transfer` is a URL string to the uploaded transfer proof image/PDF. It is `null` if no proof has been uploaded yet. This field is only applicable for orders with `payment_method: "bank_transfer"`.

**Failure Responses:**

| Condition                           | HTTP  | `message`         |
| ----------------------------------- | ----- | ----------------- |
| Unauthenticated                     | `401` | `Unauthorized`    |
| Order not found / not owned by user | `404` | `Order not found` |

---

### 15.3 Order Tracking

```
GET {{BASE_URL}}/:slug_toko/orders/:id/tracking
```

**Path Parameters:**
| Param | Type | Required | Description |
| ----------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `id` | `string` | ✅ | Order ID |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Tracking information fetched successfully",
  "data": {
    "tracking": {
      "resi": "SCJKT001234567",
      "courier": "SiCepat",
      "service_code": "HALU",
      "estimation": "15 - 17 Jan",
      "shipped_date": "14 Jan 2026",
      "seller": {
        "name": "Toko Sadigit",
        "location": "Jakarta Selatan"
      },
      "buyer": {
        "name": "John Doe",
        "location": "Jakarta Selatan"
      },
      "steps": [
        {
          "title": "Paket telah tiba dan diterima oleh penerima",
          "courier": "Kurir: SiCepat",
          "date": "Sabtu, 17 Jan 2026, 13:45 WIB"
        },
        {
          "title": "Paket sedang dalam pengiriman terakhir menuju alamat penerima",
          "courier": "Kurir: SiCepat - Andi",
          "date": "Sabtu, 17 Jan 2026, 09:10 WIB"
        },
        {
          "title": "Paket tiba di Hub SiCepat Jakarta Selatan",
          "courier": "Kurir: SiCepat",
          "date": "Jumat, 16 Jan 2026, 21:30 WIB"
        },
        {
          "title": "Paket berangkat dari Hub Jakarta Pusat",
          "courier": "Kurir: SiCepat",
          "date": "Kamis, 15 Jan 2026, 18:00 WIB"
        },
        {
          "title": "Paket diterima dan diproses di Hub SiCepat Jakarta",
          "courier": "Kurir: SiCepat",
          "date": "Rabu, 14 Jan 2026, 10:00 WIB"
        }
      ]
    }
  }
}
```

**Failure:**

- `404` if order not found.
- `409` + message `Tracking information is not yet available for this order` if `tracking` is `null` (e.g. order is still `pending_payment` or `processing`).

---

### 15.4 Upload Transfer Proof

```
POST {{BASE_URL}}/:slug_toko/orders/:id/upload-transfer-proof
```

Requires authentication. Allows customers to upload a transfer proof image/PDF for bank transfer orders.

**Path Parameters:**
| Param | Type | Required | Description |
| ----------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `id` | `string` | ✅ | Order ID |

**Request Body:**

Multipart form data with a single `file` field.

**File Validation:**
| Rule | Value |
| ----------- | ---------------------------------------------------------- |
| Max size | 5 MB |
| Allowed types | `image/jpeg`, `image/png`, `image/jpg`, `image/webp`, `application/pdf` |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Transfer proof uploaded successfully",
  "data": {
    "bukti_transfer": "https://cdn.example.com/proof/12345.jpg"
  }
}
```

> **Note:** The uploaded proof URL is stored and can be retrieved via the [Order Detail](#142-order-detail) endpoint (`bukti_transfer` field).

**Failure Responses:**

| Condition                  | HTTP  | `message`                                                 |
| -------------------------- | ----- | --------------------------------------------------------- |
| Unauthenticated            | `401` | `Unauthorized`                                            |
| Order not found            | `404` | `Order not found`                                         |
| File too large (>5MB)      | `400` | `File size exceeds maximum limit of 5MB`                  |
| Invalid file type          | `400` | `Invalid file type. Allowed: ...`                         |
| Order is not bank transfer | `409` | `Transfer proof only applicable for bank transfer orders` |

---

### 15.5 Submit Product Review (Per Order Item)

```
POST {{BASE_URL}}/:slug_toko/orders/:id/review
```

Requires authentication.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

Used by the transaction detail page to submit a review/rating for a product that belongs to a specific order.

> **BE alignment note:** This mock endpoint persists review records by `user + order + product`. Re-submitting for the same key updates existing review (idempotent update behavior).

**Request Body:**

```json
{
  "product_id": "prod_009",
  "rating": 5,
  "review": "Produk sesuai deskripsi, kualitas sangat bagus dan pengiriman cepat."
}
```

**Validation Rules:**

- `product_id` is required and must exist in the target order.
- `rating` is required and must be between `1` and `5`.
- `review` is required and max `500` characters.
- Review can only be submitted for orders with status `delivered` or `finished`.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Review submitted successfully",
  "data": {
    "order_id": "order_003",
    "product_id": "prod_009",
    "rating": 5,
    "review": "Produk sesuai deskripsi, kualitas sangat bagus dan pengiriman cepat.",
    "product_rating": 4.8,
    "product_sold_count": 522,
    "reviewed_at": "2026-04-14T08:00:00.000Z"
  }
}
```

**Failure:**

- `401` if unauthenticated.
- `404` if order not found (or not owned by current user).
- `400` for invalid payload, non-delivered/non-finished order, or product not in order.

---

### 15.6 Finish Order (Customer Confirmation)

```
POST {{BASE_URL}}/:slug_toko/orders/:id/finish
```

Requires authentication.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

Marks order as `finished` after the customer confirms item receipt.

> **Business flow:**
>
> - `delivered` = shipment delivered by courier/logistics
> - `finished` = customer confirms order completion

**Validation Rules:**

- Order must belong to authenticated user.
- Only orders with status `delivered` can be updated to `finished`.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Order marked as finished successfully",
  "data": {
    "order_id": "order_003",
    "status": "finished"
  }
}
```

**Failure:**

- `401` if unauthenticated.
- `404` if order not found (or not owned by current user).
- `409` if order is not in `delivered` status.

> **BE alignment note:** Keep this endpoint idempotent-friendly for production (repeat call after already `finished` should return a safe response).

**Persistence behavior:**

- First submit creates a review record.
- Subsequent submits for the same `user + order + product` update `rating`, `review`, and `updated_at`.
- Mock DB is seeded with an initial review example (`order_003` + `prod_009` for `user_001`) so frontend can immediately render a persisted review state.

---

## 16. Payment

---

### 16.1 Get Payment Info

```
GET {{BASE_URL}}/:slug_toko/payment/:order_id
```

Requires authentication. Use this to render dynamic payment page (QRIS or bank transfer).

**Path Parameters:**
| Param | Type | Required | Description |
| ----------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `order_id` | `string` | ✅ | Order ID |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Payment information fetched successfully",
  "data": {
    "order_id": "TRX-E25175385-536645",
    "status": "pending_payment",
    "items": [
      {
        "product_id": "prod_001",
        "product_title": "ACER ASPIRE 14 A14-51M Intel Core i7-150U RAM 16GB DDR5 SSD 512GB NVMe Backlight Keyboard Win 11 Steel Grey",
        "product_image": "https://picsum.photos/468/468?random=11",
        "price": 15340000,
        "discount_percentage": 10,
        "rating": 4.8,
        "sold_count": 138,
        "is_new": false,
        "is_best_seller": true,
        "quantity": 2,
        "variant": "e9b7c2d1-8b2c-4b4a-9a1a-1e3b7f4c9d2a/3d7a9f12-4c1b-4f1b-8c22-9d1a3e5f7b90",
        "variant_label": "16GB DDR5, 512GB SSD"
      },
      {
        "product_id": "prod_005",
        "product_title": "Logitech MX Master 3S Wireless Mouse - Bluetooth & USB Receiver",
        "product_image": "https://picsum.photos/468/468?random=51",
        "price": 1350000,
        "discount_percentage": 5,
        "rating": 4.9,
        "sold_count": 560,
        "is_new": false,
        "is_best_seller": true,
        "quantity": 2,
        "variant": "",
        "variant_label": ""
      }
    ],
    "address": "John Doe · 081234567890\nJl. Bunga Sakura Raya No. 127A, Blok C Lt. 2, Ruko Harmoni Sentosa, Kel. Mekar Asri, Kec. Cempaka Timur, Mekar Asri, Cempaka Timur, Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12345, Indonesia · Patokan: Rumah pagar hitam, dekat minimarket.",
    "expedition": {
      "name": "J&T Express",
      "cost": 12000
    },
    "subtotal": 33380000,
    "discount_total": 100000,
    "voucher_id": "vcr_001",
    "voucher_code": "HEMAT10",
    "voucher_name": "Diskon 10% Maks 100rb",
    "total": 33292000,
    "payment_method": "bank_transfer",
    "payment_bank_account": {
      "bank_name": "BCA",
      "account_number": "1234567890"
    },
    "qris_billing": null,
    "payment_expired_at": "2026-04-16T12:18:30.711Z",
    "created_at": "2026-04-16T12:08:30.711Z"
  }
}
```

`payment_bank_account` is `null` for QRIS orders and populated for `bank_transfer` orders.

**Failure:**

- `409` if order is not `pending_payment`.
- `410` + `"Payment window has expired. Order has been cancelled."` if `payment_expired_at` has passed (order status is set to `cancelled`).

---

### 16.2 Confirm Payment

```
POST {{BASE_URL}}/:slug_toko/payment/:order_id
```

Requires authentication. Simulates a payment callback — marks order as `processing`.

**Path Parameters:**
| Param | Type | Required | Description |
| ----------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `order_id` | `string` | ✅ | Order ID |

> **BE Note:** In production this endpoint is called by the **payment gateway webhook**, not by the frontend. The frontend should poll `GET /payment/:order_id` or use a WebSocket to detect status change.

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Payment confirmed successfully",
  "data": {
    "order_id": "order_001",
    "status": "processing"
  }
}
```

**Failure Responses:**

| Condition                                       | HTTP  | `message`                               |
| ----------------------------------------------- | ----- | --------------------------------------- |
| Unauthenticated                                 | `401` | `Unauthorized`                          |
| Order not found / not owned by user             | `404` | `Order not found`                       |
| Order already processed (not `pending_payment`) | `409` | `This order has already been processed` |
| Payment expired                                 | `410` | `Payment window has expired`            |

---

### 16.3 Check QRIS Payment Status

```
GET {{BASE_URL}}/:slug_toko/payment/qris/:invoice_number/check
```

Requires authentication. Poll this endpoint to check the current status of a QRIS payment.

**Path Parameters:**
| Param | Type | Required | Description |
| ----------------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `invoice_number` | `string` | ✅ | Order ID / Invoice number |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Payment status retrieved",
  "data": {
    "status": "pending"
  }
}
```

`status` values:

- `"pending"` — Payment not yet completed
- `"paid"` — Payment successfully received
- `"expired"` — Payment window has expired

**Frontend Polling Behavior:**

The frontend automatically polls this endpoint when the user is on the payment detail page with a QRIS payment method:

- **Polling interval:** Every 5 seconds
- **Stop conditions:**
  - Status is `"paid"` → redirect to payment success page
  - Status is `"expired"` → handle expiration (return items to cart)
  - User navigates away from the page → polling stops immediately
- **Scope:** Only active on the `/checkout/payment` page when `payment_method === "qris"`

**Failure Responses:**

| Condition                   | HTTP  | `message`         |
| --------------------------- | ----- | ----------------- |
| Unauthenticated             | `401` | `Unauthorized`    |
| Order not found / not owned | `404` | `Order not found` |

---

### 16.4 Cancel QRIS Payment

```
POST {{BASE_URL}}/:slug_toko/payment/qris/:invoice_number/cancel
```

Requires authentication. Cancels a pending QRIS payment and updates the order status to `cancelled`.

**Path Parameters:**
| Param | Type | Required | Description |
| ----------------- | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `invoice_number` | `string` | ✅ | Order ID / Invoice number |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Payment cancelled successfully",
  "data": null
}
```

**Failure Responses:**

| Condition                   | HTTP  | `message`         |
| --------------------------- | ----- | ----------------- |
| Unauthenticated             | `401` | `Unauthorized`    |
| Order not found / not owned | `404` | `Order not found` |

---

## 17. Voucher

Voucher endpoints are used in cart/checkout flow to preview and validate discounts before creating order.

---

### 17.1 List Vouchers

```
GET {{BASE_URL}}/:slug_toko/voucher
```

No auth required. Returns active vouchers.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Vouchers fetched successfully",
  "data": {
    "vouchers": [
      {
        "id": "vcr_001",
        "code": "HEMAT10",
        "name": "Diskon 10% Maks 100rb",
        "discount_type": "percentage",
        "discount_value": 10,
        "min_transaction": 150000,
        "max_discount": 100000,
        "is_active": true
      }
    ]
  }
}
```

---

### 17.2 Validate Voucher

```
POST {{BASE_URL}}/:slug_toko/voucher/validate
```

Requires authentication. Validates selected voucher against current cart subtotal.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Request Body:**

```json
{
  "voucher_id": "vcr_001",
  "cart_item_ids": ["cart_001", "cart_002"]
}
```

| Field           | Type       | Required | Notes                            |
| --------------- | ---------- | -------- | -------------------------------- |
| `voucher_id`    | `string`   | ✅       | Voucher identifier               |
| `cart_item_ids` | `string[]` | —        | Optional partial-cart validation |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Voucher validated successfully",
  "data": {
    "voucher": {
      "id": "vcr_001",
      "code": "HEMAT10",
      "name": "Diskon 10% Maks 100rb",
      "discount_type": "percentage",
      "discount_value": 10,
      "min_transaction": 150000,
      "max_discount": 100000,
      "is_active": true
    },
    "subtotal": 450000,
    "discount_total": 45000,
    "final_total": 405000,
    "is_valid": true
  }
}
```

**Failure Responses:**

| Condition                 | HTTP  | `message`                       |
| ------------------------- | ----- | ------------------------------- |
| Unauthenticated           | `401` | `Unauthorized`                  |
| Missing `voucher_id`      | `400` | `voucher_id is required`        |
| Invalid/inactive voucher  | `404` | `Voucher not found or inactive` |
| Below minimum transaction | `200` | `Minimum transaction is 150000` |

---

## 18. Chat Bot

Chat bot is mock-based and now supports product-aware answers from in-memory catalog (`db.products`) for:

- Product recommendations by budget/price
- Stock information for specific products/keywords
- Cheapest, premium, and most popular products
- Category and keyword-based product discovery
- Text messages and image attachments (base64/data URL)
- Session-based history

---

### 18.1 Create Session

```
POST {{BASE_URL}}/:slug_toko/chat/session
```

Creates a new chat session ID.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Chat session created successfully",
  "data": {
    "session": {
      "id": "chat_1744530000000_ab12cd",
      "created_at": "2026-04-13T10:00:00.000Z",
      "updated_at": "2026-04-13T10:00:00.000Z"
    }
  }
}
```

---

### 18.2 Get Chat History

```
GET {{BASE_URL}}/:slug_toko/chat/:session_id
```

Returns all messages in the session.

**Path Parameters:**
| Param | Type | Required | Description |
| ------------ | -------- | -------- | ----------------------------------- |
| `slug_toko` | `string` | ✅ | Store slug (e.g. `sadigit-store`) |
| `session_id` | `string` | ✅ | Chat session ID |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Chat history fetched successfully",
  "data": {
    "session": {
      "id": "chat_1744530000000_ab12cd",
      "created_at": "2026-04-13T10:00:00.000Z",
      "updated_at": "2026-04-13T10:02:00.000Z"
    },
    "messages": []
  }
}
```

**Failure:**

- `404` with `Chat session not found`

---

### 18.3 Send Message (Text/Image)

```
POST {{BASE_URL}}/:slug_toko/chat/message
```

Sends user message and returns both saved user message and assistant reply.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`). The assistant response is generated from rules that read active products in `db.products`.

**Request Body:**

```json
{
  "session_id": "chat_1744530000000_ab12cd",
  "text": "Apakah produk ini ready?",
  "attachments": [
    {
      "type": "image",
      "name": "produk.jpg",
      "mime_type": "image/jpeg",
      "size": 123456,
      "data_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD"
    }
  ]
}
```

| Field         | Type     | Required | Notes                     |
| ------------- | -------- | -------- | ------------------------- |
| `session_id`  | `string` | ✅       | Chat session ID           |
| `text`        | `string` | —        | Required if no attachment |
| `attachments` | `array`  | —        | Required if `text` empty  |

**Success Response `200`:**

```json
{
  "status": true,
  "message": "Message sent successfully",
  "data": {
    "user_message": {
      "id": "msg_user_1744530001000",
      "role": "user",
      "text": "Apakah produk ini ready?",
      "attachments": [],
      "created_at": "2026-04-13T10:00:01.000Z"
    },
    "assistant_message": {
      "id": "msg_bot_1744530001001",
      "role": "assistant",
      "text": "Ketersediaan stok tampil langsung di halaman detail produk pada bagian “Stok”.",
      "created_at": "2026-04-13T10:00:01.000Z"
    }
  }
}
```

**Failure Responses:**

| Condition               | `message`                              |
| ----------------------- | -------------------------------------- |
| Missing `session_id`    | `session_id is required`               |
| Empty text and no image | `text or image attachment is required` |
| Invalid session         | `Chat session not found`               |

**Supported Product Intents (current behavior):**

- Budget recommendation: e.g. `rekomendasi laptop di bawah 10 juta`
- Stock lookup: e.g. `cek stok iPhone`, `stok keychron`
- Cheapest products: `produk termurah`
- Premium products: `produk termahal` / `produk premium`
- Popular products: `produk terlaris` / `produk populer`
- Category/keyword search: e.g. `rekomendasi laptop acer`, `produk webcam`

Notes:

- If a budget number is provided with units (`jt/juta`, `rb/ribu/k`), assistant converts it to IDR.
- Responses include compact product lines with price and optional stock/rating context.

**BE alignment note:**

- Keep message contract stable for frontend integration:
  - Request: `{ session_id, text?, attachments? }`
  - Response: `{ user_message, assistant_message }`
- Preserve message schema fields: `id`, `role`, `text`, `attachments?`, `created_at`
- For production AI replacement, backend can swap the rule-engine implementation while keeping the same response envelope and message schema.

---

### 18.4 Send Message Stream (SSE, Token-by-Token)

```
POST {{BASE_URL}}/:slug_toko/chat/message-stream
```

Streams assistant response in real-time using Server-Sent Events (SSE). Request body contract is identical to `POST /chat/message`.

> **Path Parameter:** `slug_toko` — Store slug (e.g. `sadigit-store`).

**Request Body:**

```json
{
  "session_id": "chat_1744530000000_ab12cd",
  "text": "Rekomendasi laptop di bawah 10 juta",
  "attachments": []
}
```

**Headers (Response):**

- `Content-Type: text/event-stream; charset=utf-8`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`

**SSE Event Sequence:**

1. `ack` (contains saved `user_message`)
2. one or more `token` events (incremental assistant text chunks)
3. `done` (contains final saved `assistant_message`)

**Example SSE frames:**

```text
event: ack
data: {"user_message":{"id":"msg_user_1744530001000","role":"user","text":"Rekomendasi laptop di bawah 10 juta","attachments":[],"created_at":"2026-04-13T10:00:01.000Z"}}

event: token
data: {"token":"Rekomendasi "}

event: token
data: {"token":"terbaik "}

event: done
data: {"assistant_message":{"id":"msg_bot_1744530001001","role":"assistant","text":"Rekomendasi terbaik di bawah 10 juta: ASUS Vivobook 14 dan Lenovo IdeaPad Slim 3.","created_at":"2026-04-13T10:00:02.000Z"}}
```

**Failure Responses:**

| Condition               | HTTP  | `message`                              |
| ----------------------- | ----- | -------------------------------------- |
| Missing `session_id`    | `400` | `session_id is required`               |
| Empty text and no image | `400` | `text or image attachment is required` |
| Invalid session         | `404` | `Chat session not found`               |

**BE alignment note:**

- Keep `POST /:slug_toko/chat/message` and `POST /:slug_toko/chat/message-stream` request body and message schema identical.
- Persist both `user_message` and final `assistant_message` in chat history for both endpoints.
- SSE endpoint should remain append-only event stream with strict event names: `ack`, `token`, `done`.

**Frontend fallback strategy:**

- Preferred path: call `POST /:slug_toko/chat/message-stream` for token-by-token realtime UI.
- Fallback path: if SSE fails (network/proxy/runtime constraints), client should automatically call `POST /:slug_toko/chat/message` with the same payload to keep chat usable.

---

## 19. Data Models

### User

```typescript
{
  id: string // e.g. "user_001"
  full_name: string
  username: string
  email: string
  phone_number: string
  role: 'customer' | 'reseller' | 'dealer'
  is_active: boolean
  registered_at: string // ISO 8601
  last_login_at: string | null // ISO 8601
  // password is NEVER returned in any response
}
```

### Store Profile

```typescript
{
  slug: string
  name: string
  logo_url: string | null
  favicon_url: string | null
  about: string
  address: string
  phone_number: string
  operating_hours: string // may contain HTML
  bank_accounts: {
    bank_name: string
    account_number: string
  }[]
  config: {
    theme: string // default: "default"
    schema: string[] // module identifiers, e.g. ["SIMASKO"]
  }
  social_links: {
    facebook?: string
    instagram?: string
    youtube?: string
    whatsapp?: string
  }
}
```

`bank_accounts` is used as an alternative payment option for high-value transactions (e.g. when order total is above Rp10.000.000).

### Voucher

```typescript
{
  id: string
  code: string
  name: string
  discount_type: 'PERCENTAGE' | 'FIXED'
  discount_value: number
  min_transaction: number
  max_discount: number | null
  is_active: boolean
}
```

### ChatMessage

```typescript
{
  id: string
  role: 'user' | 'assistant'
  text: string
  attachments?: {
    type: 'image'
    name: string
    mime_type: string
    size: number
    data_url: string
  }[]
  created_at: string
}
```

### Product (full)

```typescript
{
  id: string
  title: string
  slug: string
  category_id: string
  category: string              // display name
  category_slug: string | null  // only in detail response
  parent_category: { name: string; slug: string } | null  // only in detail
  brand: string
  price: number                 // IDR, no decimals
  stock: number
  sku: string
  minimum_buy: number
  weight: string                // e.g. "3.5 kg"
  images: string[]              // array of URLs
  variants: {
    id: string
    label: string
    value: string
    group: string                 // group name: "ram" | "warna" | "ukuran" | "kapasitas"
    price?: number
    options?: { id: string; label: string; value: string; group: string; price?: number }[]
  }[] | null
  description: string           // may contain HTML
  is_active: boolean
  created_at: string            // ISO 8601
}
```

### Product (list item / card)

```typescript
{
  id: string
  title: string
  slug: string
  category: string
  brand: string
  price: number
  stock: number
  image: string | null // first image only
}
```

### Order

```typescript
{
  id: string
  user_id: string
  status: "pending_payment" | "processing" | "shipped" | "delivered" | "finished" | "cancelled"
  items: OrderItem[]
  address: string               // formatted full address string
  expedition: string            // courier value e.g. "jne"
  subtotal: number              // sum of items
  total: number                 // subtotal + shipping cost
  payment_method: "qris" | "bank_transfer"
  payment_bank_account: {
    bank_name: string
    account_number: string
  } | null
  qris_billing: {
    invoice_number: string
    qr_code: string
    qris_expires_at: string
  } | null     // QRIS billing info (null for bank transfer)
  payment_expired_at: string | null  // ISO 8601, null if paid
  tracking: Tracking | null
  created_at: string            // ISO 8601
}
```

### Tracking

```typescript
{
  resi: string
  courier: string // display name e.g. "J&T Express"
  service_code: string
  estimation: string // e.g. "10 - 13 Feb"
  shipped_date: string // e.g. "3 Feb 2026"
  seller: {
    name: string
    location: string
  }
  buyer: {
    name: string
    location: string
  }
  steps: {
    title: string // event description
    courier: string // courier + driver name
    date: string // formatted date + time string
  }
  ;[]
}
```

---

## 20. Error Reference

| HTTP Status | When It Occurs                                                                   |
| ----------- | -------------------------------------------------------------------------------- |
| `200`       | Successful read/write operation                                                  |
| `201`       | Successful create operation (optional; `200` is also acceptable if standardized) |
| `400`       | Invalid payload, malformed params, failed validation                             |
| `401`       | Missing or invalid `access_token` cookie on protected endpoints                  |
| `403`       | User is authenticated but blocked from action (e.g. suspended account)           |
| `404`       | Resource not found (product, order, cart item, address, chat session)            |
| `409`       | Business-state conflict (e.g. order state does not allow requested action)       |
| `410`       | Expired payment/session/resource window                                          |
| `422`       | Semantic validation failure (optional; if used by backend)                       |
| `500`       | Unexpected server error                                                          |

> Backend must always return the standard envelope `{ status, message, data }`, including on `4xx/5xx` responses.

---

## 21. Mock Test Credentials

Use these accounts to test the local mock server:

| Role     | Email              | Password      | Notes                                                                    |
| -------- | ------------------ | ------------- | ------------------------------------------------------------------------ |
| Customer | `john@example.com` | `password123` | Has pre-seeded cart, orders (pending/shipped/delivered), and 2 addresses |
| Reseller | `budi@example.com` | `password123` | Clean account                                                            |
| Dealer   | `siti@example.com` | `password123` | Clean account                                                            |

**Forgot Password (mock OTP):**

All registered emails receive OTP **`11111`** (no real email is sent). The verification token is single-use — re-request a new OTP if you need to test the flow again.

**Pre-seeded data for `john@example.com`:**

- Cart: 2 items (Acer Aspire + Logitech Mouse)
- Orders:
  - `order_001` — `pending_payment` (with active 10-min countdown)
  - `order_002` — `shipped` (includes full tracking info)
  - `order_003` — `delivered` (includes full tracking info)
- Addresses: 2 (Jakarta Selatan as primary, Bandung as secondary)

---

## Integration Checklist (for BE)

When replacing the mock with the real backend, verify:

- [ ] All response envelopes use `{ status, message, data }` shape
- [ ] `access_token` cookie is set with `httpOnly: false`, `SameSite: Lax`, correct `path: /`
- [ ] `refresh_token` cookie is set with `httpOnly: true`
- [ ] `POST /auth/login` accepts username **or** email in `username` field
- [ ] `POST /auth/google` exists and sets the same auth cookies as username/password login
- [ ] `POST /auth/google` verifies `credential` (Google ID token) server-side using Google JWKs
- [ ] `POST /auth/google` validates `aud` equals `NUXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] All store-scoped endpoints use `/{slug_toko}/...` prefix pattern (see §1)
- [ ] `GET /store/:slug` returns store profile used by frontend branding and SEO/meta
- [ ] `GET /me` returns `401` (not redirect) when unauthenticated
- [ ] `GET /:slug_toko/products` supports all `sort` values and `category` slug filtering
- [ ] Product variants include `price` field; `product.price` = lowest variant price (for "Mulai dari" card display)
- [ ] Cart items return `unit_price` (resolved variant price) as a top-level field, separate from `product.price`
- [ ] `POST /:slug_toko/checkout` atomically creates order + clears cart
- [ ] `payment_expired_at` is enforced server-side (order auto-cancelled on expiry)
- [ ] `GET /:slug_toko/orders/:id/tracking` returns `409` (not 404) when tracking is unavailable
- [ ] `POST /:slug_toko/payment/:order_id` is protected (should only be called by payment gateway, not end-user)
- [ ] `GET /:slug_toko/voucher` returns active vouchers with discount constraints
- [ ] `POST /:slug_toko/voucher/validate` validates voucher against cart subtotal and returns `{ discount_total, final_total }`
- [ ] `GET /:slug_toko/ekspedisi` requires `address_id` and validates address ownership before returning courier options/cost
- [ ] `POST /:slug_toko/checkout` supports `voucher_id` and persists voucher summary in order/payment responses
- [ ] `POST /:slug_toko/chat/session` creates a session ID used by frontend chatbot widget
- [ ] `GET /:slug_toko/chat/:session_id` returns chat history for the session
- [ ] `POST /:slug_toko/chat/message` accepts text and/or image attachments with consistent message schema
- [ ] `GET /:slug_toko/banner` returns active banners
- [ ] `GET /:slug_toko/categories` returns categories tree
- [ ] Password is **hashed** (bcrypt/argon2) — never stored plain text like the mock
- [ ] Email verification flow (if required) is added on top of `/auth/register`
- [ ] `POST /auth/forgot-password` sends a real OTP/token via email (TTL recommended: 5–10 min)
- [ ] `POST /auth/verify-otp` is rate-limited and the OTP is single-use
- [ ] `POST /auth/reset-password` checks that the verification token is still valid and clears it after use
