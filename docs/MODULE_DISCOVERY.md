# Module Discovery — kuroStoreID

**Last Updated:** 2026-06-17  
**Target URL:** `https://store.olpos.id/kurostoreid`  
**API Base:** `https://be.olpos.id/e_commerce/v1/`  
**Tech Stack:** Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4

---

## Table of Contents

1. [Global Components](#1-global-components)
   - [Header / Navbar](#11-header--navbar)
   - [Footer](#12-footer)
   - [Chatbot Widget](#13-chatbot-widget)
2. [Public Pages](#2-public-pages)
   - [Homepage (/)](#21-homepage)
   - [Login (/auth/login)](#22-login)
   - [Register (/auth/register)](#23-register)
   - [Forgot Password (/auth/forgot-password)](#24-forgot-password)
   - [About Us (/about)](#25-about-us)
3. [Authenticated Pages](#3-authenticated-pages)
   - [Cart (/cart)](#31-cart)
   - [Checkout (/checkout)](#32-checkout)
   - [Transaction History (/checkout/history)](#33-transaction-history)
   - [Settings (/setting)](#34-settings)
4. [Feature Modules](#4-feature-modules)
   - [PC Builder — Simasko (/simasko/rakit-komputer)](#41-pc-builder--simasko)
   - [Search & Product Listing (/search)](#42-search--product-listing)
   - [Product Detail (/{product-slug})](#43-product-detail)
   - [Service Status Widget](#44-service-status-widget)
5. [API Endpoints](#5-api-endpoints)
6. [Unimplemented Pages](#6-unimplemented-pages)
7. [Testable Modules Summary](#7-testable-modules-summary)

---

## 1. Global Components

### 1.1 Header / Navbar

**Present on:** All pages  
**Route:** N/A (fixed component)

**Elements (left to right):**

| Element                  | Type                   | Action                                                    |
| ------------------------ | ---------------------- | --------------------------------------------------------- |
| Logo "kuroStoreID"       | Link (`<img>`)         | Navigate to `/kurostoreid`                                |
| Category button          | Button (dropdown)      | Opens category popup                                      |
| Search textbox           | Input (text)           | Search — placeholder: "Search products, categories, etc." |
| Language "EN"            | Button                 | Toggle language                                           |
| Cart icon                | Link                   | `/kurostoreid/cart` (with item count badge)               |
| Transaction History icon | Link                   | `/kurostoreid/checkout/history`                           |
| User avatar "F"          | Button (dropdown menu) | Opens user menu                                           |

**User Dropdown Menu (when authenticated):**

| Item                 | Action                                                     |
| -------------------- | ---------------------------------------------------------- |
| "Hello, {username}!" | Disabled (info only)                                       |
| Build PC             | Navigate to `/kurostoreid/simasko/rakit-komputer`          |
| Check Service Status | (scrolls to / opens service status widget?)                |
| Transaction History  | Navigate to `/kurostoreid/checkout/history`                |
| Settings             | Navigate to `/kurostoreid/setting`                         |
| Logout               | POST `/auth/logout`, redirect to `/kurostoreid/auth/login` |

**Notable observations:**

- Cart badge shows item count (e.g., "3")
- User menu uses `reka-dropdown-menu-trigger` component
- Language selector "EN" present but no other language option visible in UI

---

### 1.2 Footer

**Present on:** All pages  
**Route:** N/A (fixed component)

**Sections:**

| Section       | Content                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| **Brand**     | Logo, Store name "kuroStoreID", description "12312323232 123123232"                       |
| **Belanja**   | About Us (`/kurostoreid/about`), Privacy Policy (`/privacy`), Terms of Service (`/terms`) |
| **Contact**   | Phone: 6285318158201, Operating Hours: Senin - Minggu: 08:00 - 17:00                      |
| **Address**   | "12"                                                                                      |
| **Copyright** | © 2026 OLPOS. All rights reserved.                                                        |

**Notable observations:**

- Privacy Policy (`/privacy`) and Terms of Service (`/terms`) redirect to search page (not implemented yet)
- "Powered by OLPOS" links to `https://olpos.id`

---

### 1.3 Chatbot Widget

**Present on:** All pages  
**Type:** Floating action button (bottom-right)  
**Label:** "Open chatbot"

---

## 2. Public Pages

### 2.1 Homepage

**Route:** `/kurostoreid`  
**Title:** `kuroStoreID | kuroStoreID`  
**Auth:** Public (no login required)

**Sections (top to bottom):**

#### Hero Banner Carousel

- 3 banner slides with navigation dots
- Each banner has an image + "Lihat Detail" overlay link
- Source: `GET /e_commerce/v1/{store}/banner`

#### Check Service Status Widget

- Heading: "Check Service Status" with "Baru" badge
- Description: "Track your device repair progress quickly and transparently."
- Input: Service Code (placeholder: "Example: SRV-2026-00123")
- Paste from clipboard button
- Note: "After submitting, you will be redirected to the official service tracking page."
- Button: "Check Status Now" (disabled until input filled)

#### Build PC Widget

- Heading: "Build PC"
- Description: "Design your ideal PC for your needs and budget with confidence."
- Feature bullets:
  - Get balanced and compatible component recommendations.
  - Choose setups for work, gaming, or creative workloads.
  - Continue to the builder page for detailed configuration.
- Link: "Start Building" → `/kurostoreid/simasko/rakit-komputer`

#### All Products Section

- Heading: "All Products"
- Subtitle: "Temukan produk terbaik untuk Anda"
- Sort combobox (default: "Terbaru")
- **Category sidebar** (16 categories, see below)
- Product grid with image, name, price, "Keranjang" button
- Data source: `GET /e_commerce/v1/{store}/products?sort=newest`

**Categories (16):**

| Category      | Slug            |
| ------------- | --------------- |
| Casing        | `casing`        |
| CPU Cooler    | `cpu-cooler`    |
| Graphic Card  | `graphic-card`  |
| Keyboard      | `keyboard`      |
| Laptop        | `laptop`        |
| Laptop Gaming | `laptop-gaming` |
| ma            | `ma`            |
| Monitor       | `monitor`       |
| Motherboard   | `motherboard`   |
| mouse         | `mouse`         |
| Power Supply  | `power-supply`  |
| Processor     | `processor`     |
| RAM           | `ram`           |
| Storage       | `storage`       |
| VGA           | `vga`           |

**Category hierarchy:**

- `Laptop` > `12` (subcategory)
- `mouse` > `mouse gaming` (subcategory)

---

### 2.2 Login

**Route:** `/kurostoreid/auth/login`  
**Title:** `kuroStoreID | kuroStoreID`  
**Auth:** Public (redirects to home if already logged in)

**Elements:**

| Element                           | Type                    | Details                                         |
| --------------------------------- | ----------------------- | ----------------------------------------------- |
| Logo                              | Image                   | Above form                                      |
| "Login"                           | Heading (h1)            | Main title                                      |
| "Welcome back to kuroStoreID"     | Paragraph               | Subtitle                                        |
| Username                          | Textbox                 | Required                                        |
| Password                          | Textbox (type=password) | With show/hide toggle eye icon                  |
| "Login"                           | Button (submit)         | Primary action                                  |
| "Forgot Password?"                | Link                    | Navigate to `/kurostoreid/auth/forgot-password` |
| "Don't have an account? Register" | Link                    | Navigate to `/kurostoreid/auth/register`        |

**API:** `POST /e_commerce/v1/auth/login`  
**Body:** `{ username, password }`  
**Auth:** No (JWT returned on success)

---

### 2.3 Register

**Route:** `/kurostoreid/auth/register`  
**Title:** `kuroStoreID | kuroStoreID`  
**Auth:** Public

**Elements:**

| Element                          | Type                    | Details                               |
| -------------------------------- | ----------------------- | ------------------------------------- |
| Logo                             | Image                   | Above form                            |
| "Register"                       | Heading (h1)            | Main title                            |
| "Create your new account"        | Paragraph               | Subtitle                              |
| Full Name                        | Textbox                 | Left column                           |
| Phone Number                     | Textbox                 | Left column                           |
| Username                         | Textbox                 | Left column                           |
| Email                            | Textbox                 | Right column                          |
| Password                         | Textbox (type=password) | Right column, with toggle             |
| Confirm Password                 | Textbox (type=password) | Right column, with toggle             |
| "Register"                       | Button (submit)         | Primary action                        |
| "Already have an account? Login" | Link                    | Navigate to `/kurostoreid/auth/login` |

**Form layout:** 2-column grid (left: identity fields, right: email + password fields)

**API:** `POST /e_commerce/v1/auth/register`  
**Body:** `{ full_name, phone_number, username, email, password }`  
**Auth:** No

---

### 2.4 Forgot Password

**Route:** `/kurostoreid/auth/forgot-password`  
**Title:** `Forgot Password`  
**Auth:** Public

**Elements:**

| Element                       | Type            | Details                                                   |
| ----------------------------- | --------------- | --------------------------------------------------------- |
| Logo                          | Image           | Above form                                                |
| "Forgot Password"             | Heading (h1)    | Main title                                                |
| "Reset your account password" | Paragraph       | Subtitle                                                  |
| Step indicator                | 3-step wizard   | (1) Email, (2) Verify, (3) New Password — current: Step 1 |
| Email                         | Textbox         | Placeholder: "Enter your registered email"                |
| "Send OTP"                    | Button (submit) | Step 1 action                                             |
| "Login"                       | Link            | Navigate to `/kurostoreid/auth/login`                     |

**API endpoints for this flow:**

- `POST /auth/forgot-password` (body: `{ email }`)
- `POST /auth/verify-otp` (body: `{ email, otp }`)
- `POST /auth/reset-password` (body: `{ reset_token, new_password }`)

---

### 2.5 About Us

**Route:** `/kurostoreid/about`  
**Title:** `Tentang kuroStoreID | kuroStoreID`  
**Auth:** Public

**Sections:**

| Section         | Content                                                           |
| --------------- | ----------------------------------------------------------------- |
| Brand           | Logo + "kuroStoreID" heading                                      |
| Social Links    | Facebook, Instagram, YouTube (all "#"), WhatsApp, Bagikan (Share) |
| "About Us"      | Content from store profile (HTML)                                 |
| Address         | "12"                                                              |
| Contact         | "6285318158201"                                                   |
| Operating Hours | "Senin - Minggu: 08:00 - 17:00"                                   |

**Data source:** `GET /e_commerce/v1/store/{slug}` (from store profile)

---

## 3. Authenticated Pages

### 3.1 Cart

**Route:** `/kurostoreid/cart`  
**Title:** `Shopping Cart`  
**Auth:** Required

**Elements:**

| Section                 | Details                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| "Shopping Cart" heading | With item count (e.g., "3 items")                                                    |
| Select all checkbox     | Checked by default                                                                   |
| Cart item list          | Per item: checkbox, image/placeholder, name, price, quantity controls, delete button |
| Quantity controls       | Decrement (disabled at 1) / increment buttons with spinbutton showing value          |
| Use Promo Voucher       | Card with "Select" button                                                            |
| Order Summary           | Subtotal, Shipping ("Calculated at checkout"), Total                                 |
| "Checkout (N)" button   | Primary action, shows item count                                                     |
| Accepted payment        | Payment method icons                                                                 |

**Cart items example:**

- prudk 1jt — Rp. 1.000.000 (qty: 1)
- produk 5jt — Rp. 5.000.000 (qty: 1)
- produk 7jt — Rp. 7.000.000 (qty: 1)

**API:** `GET /e_commerce/v1/{store}/cart`

---

### 3.2 Checkout

**Route:** `/kurostoreid/checkout`  
**Title:** `Checkout`  
**Auth:** Required

**Elements:**

| Section             | Details                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Alert**           | "Shipping Address Not Set" — "You haven't added a shipping address yet." with "Add Address" button |
| Shipping Address    | "Change Address" button, "No address selected yet"                                                 |
| Item list           | Product with quantity prefix (e.g., "(1x) - prudk 1jt"), price                                     |
| Transaction Summary | Logistics (disabled until address selected), Bank Transfer (combobox), Total Price, Total Payment  |
| Payment method      | Auto-switch to bank transfer for > Rp10.000.000                                                    |
| "Pay Now" button    | Disabled until address added                                                                       |

**Note:** Total transaction > Rp10.000.000 automatically switches to bank transfer.

**API endpoints used:**

- `GET /e_commerce/v1/{store}/cart` — get cart items
- Cart/POST methods (for checkout processing)

---

### 3.3 Transaction History

**Route:** `/kurostoreid/checkout/history`  
**Title:** `Transaction History`  
**Auth:** Required

**Elements:**

| Element                       | Details                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| "Transaction History" heading | With subtitle "View and manage all your orders"                             |
| Search input                  | Placeholder: "Search product"                                               |
| Filter tabs                   | All, Pending, Processing, Shipped, Completed, Cancelled                     |
| Empty state                   | "No orders yet" + "Your first order awaits" + "Start Shopping" link to home |

**API:** `GET /e_commerce/v1/{store}/orders?status={status}&limit=N`

---

### 3.4 Settings

**Route:** `/kurostoreid/setting`  
**Title:** `Pengaturan Akun`  
**Auth:** Required

**Elements:**

| Section         | Details                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| User info card  | Avatar "F", Name "firman raza", Email "firmansrf47@gmail.com", Phone "0816161784747", Edit button |
| Your Profile    | Arrow → (currently redirects to search, sub-page not implemented)                                 |
| Change Password | Arrow → (currently redirects to search, sub-page not implemented)                                 |
| Address List    | Arrow → (currently redirects to search, sub-page not implemented)                                 |
| Language        | "Language: EN" — arrow →                                                                          |
| "Logout" button | Red/danger button                                                                                 |

**NOTES:**

- Settings sub-pages (`/setting/profile`, `/setting/change-password`, `/setting/address`) are NOT implemented — they redirect to the search page with category parameters
- These may be modals/dialogs instead of separate routes in the future

---

## 4. Feature Modules

### 4.1 PC Builder — Simasko

**Route:** `/kurostoreid/simasko/rakit-komputer`  
**Title:** `Build PC`  
**Auth:** Required

**Description:** "Simasko Builder" — Choose multiple different components, set quantity per item, checkout in one transaction.

**Component Categories:**

| Category           | Required    | Multi Product    |
| ------------------ | ----------- | ---------------- |
| Processor (CPU)    | ✅ Required | ❌               |
| Motherboard        | ✅ Required | ❌               |
| RAM                | ✅ Required | ✅ Multi Product |
| Storage (SSD/HDD)  | ✅ Required | ✅ Multi Product |
| Power Supply (PSU) | ✅ Required | ❌               |
| Casing             | ✅ Required | ❌               |
| Graphic Card (VGA) | ❌ Optional | ❌               |
| CPU Cooler         | ❌ Optional | ✅ Multi Product |
| Monitor            | ❌ Optional | ✅ Multi Product |
| Keyboard           | ❌ Optional | ✅ Multi Product |
| Mouse              | ❌ Optional | ✅ Multi Product |

**Features:**

| Feature                | Details                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Progress bar           | 0/6 required components                                                                                 |
| Selected Items counter | Shows total selected                                                                                    |
| Power Estimation       | Shows estimated wattage                                                                                 |
| Build Summary sidebar  | Estimated Total, Compatibility Analysis (Beta), "Required components are not available in catalog" list |
| "Add All to Cart"      | Disabled until all required components selected                                                         |
| "Reset All"            | Resets all selections                                                                                   |
| Back button            | Navigate back                                                                                           |

**Compatibility Analysis (Beta):**

- Shows "Belum cukup data kompatibilitas" when no components selected
- "Pilih komponen utama untuk analisis lebih akurat"

---

### 4.2 Search & Product Listing

**Route:** `/kurostoreid/search?q={query}&category={slug}`  
**Title:** `Pencarian: "{query}" - kuroStoreID | kuroStoreID`  
**Auth:** Public

**Elements:**

| Section             | Details                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Breadcrumb          | Home > Pencarian: "{query}"                                                                               |
| Sort tabs           | Terbaru (newest), Terpopuler (popular), Rating Tertinggi (highest rating), Promo Terbesar (biggest promo) |
| Price range filters | Rp100k-Rp500k, Rp500k-Rp1jt, Rp1jt-Rp5jt, Rp5jt-Rp10jt, >Rp10jt                                           |
| Result count        | "N products"                                                                                              |
| Category sidebar    | Same 16 categories as homepage                                                                            |
| Product grid        | Image, name, price, "Keranjang" button                                                                    |

**API:** `GET /e_commerce/v1/{store}/products?sort={sort}&category={category}&q={query}`

**Route pattern for categories:**

- `/kurostoreid/{category-slug}` → redirects to `/kurostoreid/search?category={slug}`

---

### 4.3 Product Detail

**Route:** `/kurostoreid/{product-slug}`  
**Title:** `{Product Name} - kuroStoreID | kuroStoreID`  
**Auth:** Public (add to cart requires auth)

**Elements:**

| Section                         | Details                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| Breadcrumb                      | Home > Product Name                                              |
| Product image                   | Main image with thumbnail gallery                                |
| Product info                    | Name (h1), Price, SKU, Category, Min purchase, Weight            |
| Stock                           | Stock count display (e.g., "Stock: 0" for out of stock)          |
| Order quantity                  | Quantity selector with increment/decrement (disabled if stock=0) |
| Subtotal                        | Dynamic based on qty                                             |
| "Add to Cart" button            | Primary action (may be disabled if stock=0)                      |
| "Specification and Description" | Accordion/section with expandable content                        |
| Buyer Reviews                   | "No reviews yet" + "Be the first buyer to review this product."  |
| "Other products"                | Grid of related products (image, name, price, Keranjang button)  |

---

### 4.4 Service Status Widget

**Location:** Homepage (scroll section)  
**Route:** `/kurostoreid`  
**Auth:** Public

**Elements:**

| Element      | Details                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| Heading      | "Check Service Status" with "Baru" badge                                          |
| Description  | "Track your device repair progress quickly and transparently."                    |
| Input        | Service Code (placeholder: "Example: SRV-2026-00123")                             |
| Paste button | Paste from clipboard                                                              |
| Note         | "After submitting, you will be redirected to the official service tracking page." |
| Button       | "Check Status Now" (disabled until code entered)                                  |

---

## 5. API Endpoints

### Store & Product Endpoints

| Method | Endpoint                                                  | Auth | Description                                                                              |
| ------ | --------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| GET    | `/e_commerce/v1/store/{slug}`                             | No   | Store profile (name, logo, about, address, contact, bank accounts, config, social links) |
| GET    | `/e_commerce/v1/{store_slug}/banner`                      | No   | Hero banners                                                                             |
| GET    | `/e_commerce/v1/{store_slug}/categories`                  | No   | Product categories (tree structure)                                                      |
| GET    | `/e_commerce/v1/{store_slug}/products?sort=&category=&q=` | No   | Product listing/search                                                                   |
| GET    | `/e_commerce/v1/{store_slug}/cart`                        | Yes  | Get cart                                                                                 |
| GET    | `/e_commerce/v1/{store_slug}/orders?status=&limit=`       | Yes  | Orders list                                                                              |

### Auth Endpoints

| Method | Endpoint                              | Auth | Body                                                     |
| ------ | ------------------------------------- | ---- | -------------------------------------------------------- |
| POST   | `/e_commerce/v1/auth/login`           | No   | `{ username, password }`                                 |
| POST   | `/e_commerce/v1/auth/register`        | No   | `{ full_name, phone_number, username, email, password }` |
| POST   | `/e_commerce/v1/auth/forgot-password` | No   | `{ email }`                                              |
| POST   | `/e_commerce/v1/auth/verify-otp`      | No   | `{ email, otp }`                                         |
| POST   | `/e_commerce/v1/auth/reset-password`  | No   | `{ reset_token, new_password }`                          |
| POST   | `/e_commerce/v1/auth/logout`          | Yes  | —                                                        |
| POST   | `/e_commerce/v1/auth/google`          | No   | `{ credential }`                                         |

### Standard Response Envelope

```json
{
  "status": true,
  "message": "Operation successful",
  "data": {} | null
}
```

### Store Profile Data Shape

```json
{
  "slug": "kurostoreid",
  "name": "kuroStoreID",
  "logo_url": "...",
  "favicon_url": "...",
  "about": "<p>...</p>",
  "address": "12",
  "phone_number": "6285318158201",
  "operating_hours": { "monday": { "open": "08:00", "close": "17:00" }, ... },
  "bank_accounts": [
    { "bank_name": "BCA", "account_number": "06060606", "account_type": "BUSINESS", "account_holder": "Budi" },
    { "bank_name": "MANDIRI", "account_number": "01939890032", "account_type": "PERSONAL", "account_holder": "BAGUS MAULANA" }
  ],
  "config": { "theme": "warm", "schema": ["SIMASKO"] },
  "social_links": { "facebook": "#", "instagram": "#", "youtube": "#", "whatsapp": "#", "tiktok": "#", "twitter": "#" },
  "contact_center": []
}
```

---

## 6. Unimplemented Pages

The following routes exist in the UI (links visible) but redirect to the search page — content not yet implemented:

| Route                                  | Visible In                   | Redirects To                                           |
| -------------------------------------- | ---------------------------- | ------------------------------------------------------ |
| `/kurostoreid/privacy`                 | Footer ("Privacy Policy")    | `/search?category=privacy`                             |
| `/kurostoreid/terms`                   | Footer ("Terms of Service")  | `/search?category=terms`                               |
| `/kurostoreid/setting/profile`         | Settings ("Your Profile")    | `/search?category=setting&subcategory=profile`         |
| `/kurostoreid/setting/change-password` | Settings ("Change Password") | `/search?category=setting&subcategory=change-password` |
| `/kurostoreid/setting/address`         | Settings ("Address List")    | `/search?category=setting&subcategory=address`         |

---

## 7. Testable Modules Summary

| Priority | Module              | Page                      | Key Test Areas                                                                              |
| -------- | ------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| **P0**   | Login               | `/auth/login`             | Valid login, invalid credentials, empty fields, forgot password link, register link         |
| **P0**   | Register            | `/auth/register`          | Valid registration, duplicate email/username, empty fields, password mismatch               |
| **P0**   | Homepage            | `/`                       | Banner display, category listing, product listing, service status widget, PC builder widget |
| **P1**   | Cart                | `/cart`                   | Add/remove items, quantity change, promo voucher, checkout navigation                       |
| **P1**   | Checkout            | `/checkout`               | Address selection, payment method, item summary, place order                                |
| **P1**   | PC Builder          | `/simasko/rakit-komputer` | Component selection, progress tracking, compatibility analysis, add to cart                 |
| **P1**   | Product Detail      | `/{slug}`                 | Product info, stock display, add to cart, reviews, related products                         |
| **P1**   | Search              | `/search`                 | Search by keyword, category filter, sort, price filter                                      |
| **P2**   | Transaction History | `/checkout/history`       | Order list, status filters, empty state                                                     |
| **P2**   | Settings            | `/setting`                | Profile display, logout                                                                     |
| **P2**   | Forgot Password     | `/auth/forgot-password`   | Email input, send OTP, step wizard                                                          |
| **P2**   | About Us            | `/about`                  | Store info, social links, contact                                                           |
| **P3**   | Footer links        | Footer                    | Navigation to About, Privacy, Terms                                                         |
| **P3**   | Language            | Header                    | Language toggle                                                                             |

Final Recommended Structure

tests/
├── auth/ # P0 — Login, Register, Forgot Password, Logout
│ ├── login.spec.ts
│ ├── register.spec.ts
│ ├── forgot-password.spec.ts
│ ├── logout.spec.ts
│ └── pages/
│ ├── LoginPage.ts
│ ├── RegisterPage.ts
│ └── ForgotPasswordPage.ts
│
├── catalog/ # P0 — Search, Category, Sort, Price Filter, Breadcrumb
│ ├── search.spec.ts
│ ├── filter.spec.ts
│ └── pages/
│ └── SearchPage.ts
│
├── product-detail/ # P0 — Product Info, Stock, QTY, Add to Cart, Reviews
│ ├── detail.spec.ts
│ ├── add-to-cart.spec.ts
│ └── pages/
│ └── ProductDetailPage.ts
│
├── home/ # P1 — Banner, Navigation, Language, Service Status, Footer
│ ├── homepage.spec.ts
│ └── pages/
│ └── HomePage.ts
│
├── cart/ # P1 — Item List, Quantity, Select, Voucher, Checkout Button
│ ├── cart.spec.ts
│ └── pages/
│ └── CartPage.ts
│
├── checkout/ # P1 — Address, Shipping, Payment, Place Order
│ ├── checkout.spec.ts
│ ├── payment.spec.ts
│ └── pages/
│ ├── CheckoutPage.ts
│ └── PaymentPage.ts
│
├── transaction/ # P1 — Order List, Status Filter, Order Detail, Review
│ ├── order-history.spec.ts
│ ├── order-detail.spec.ts
│ └── pages/
│ └── TransactionPage.ts
│
├── profile/ # P2 — User Info, Edit Profile, Change Password, Address
│ ├── profile.spec.ts
│ └── pages/
│ └── ProfilePage.ts
│
├── pc-builder/ # P2 — Component Selection, Compatibility, Add All to Cart
│ ├── pc-builder.spec.ts
│ └── pages/
│ └── PcBuilderPage.ts
│
├── chatbot/ # P3 — Chat Session, Send Message, History
│ ├── chatbot.spec.ts
│ └── pages/
│ └── ChatbotPage.ts
│
└── smoke/ # P0 — Critical Path (CI/CD Gate)
├── auth.spec.ts
├── catalog.spec.ts
├── cart.spec.ts
└── checkout.spec.ts
