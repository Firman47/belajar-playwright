# Dokumentasi Website — POS Sadigit Store Ecommerce

**Ditujukan untuk:** UI/UX Designer  
**Tujuan:** Memahami struktur, fitur, flow, state, dan interaksi setiap halaman untuk mendesain ulang website  
**Versi:** 0.0.6  
**Stack:** Nuxt 4.2.1 · Pinia 3 · Nuxt UI v4.2.1 · Tailwind CSS v4 · TypeScript

**Update v0.0.6:**
- ✅ CategoryMobileFilter Toolbar — Hapus back button & title duplikat, ganti dengan info label dinamis
- ✅ Hierarchical Category Tree — Ganti flat radio group dengan `<UTree>` dari Nuxt UI (expandable parent + subcategory)
- ✅ UTree State Sync — `v-model:expanded` + `selectedTreeItem` sync saat buka filter dengan kategori aktif
- ✅ Race Condition Fix — Gunakan `onSelect` callback (synchronous) daripada `watch(v-model)`
- ✅ Slug-to-TreeItem Map — Lookup O(1) untuk sync selection state tanpa recursive search
- ✅ Subcategory Support — Extract slug mendukung `?subcategory=` dan `?category=` params
- ✅ Translations — Tambah `filter.all_categories`, `filter.filter_and_sort`, `filter.searching_for`, `filter.filters_active`

**Update v0.0.5:**
- ✅ Settings Page Guest State — Halaman setting bisa diakses tanpa login
- ✅ Guest UI — Icon, title, description, login button, register link
- ✅ Conditional Rendering — `v-if="isAuthenticated"` untuk authenticated content
- ✅ Hapus `requiresAuth` — Setting page sekarang publik

**Update v0.0.4:**
- ✅ Responsive Category Breadcrumb & Filters — Mobile stacked layout, desktop inline
- ✅ Breadcrumb Truncate — `min-w-0 overflow-hidden` agar tidak overflow di mobile
- ✅ Product Count Responsive — Desktop inline, mobile baris terpisah

**Update v0.0.3:**
- ✅ Query Params Preservation — Search & filter saling mempertahankan state
- ✅ Search Badge di Category Page — Menampilkan keyword aktif
- ✅ Header Search dengan Enter — Navigate ke search page dengan preserve params

**Update v0.0.2:**
- ✅ Mobile Bottom Navigation (AppBottomNav)
- ✅ Context-Aware Mobile Header (useMobileHeaderContext)
- ✅ Categories Grid Page (/categories) — Mobile only
- ✅ User Profile Card & Logout Section di Settings

---

## Daftar Isi

1. [Arsitektur & Teknologi](#1-arsitektur--teknologi)
2. [Routing & Navigasi Global](#2-routing--navigasi-global)
3. [Layout](#3-layout)
4. [Halaman & Fitur](#4-halaman--fitur)
   - 4.1 Landing Page (`/`)
   - 4.2 Store Home (`/[store]`)
   - 4.3 Search & Category Page (`/[store]/search`)
   - 4.3a Categories Page (`/[store]/categories`) ⭐ NEW
   - 4.4 Product Detail (`/[store]/[slug]`)
   - 4.5 Cart (`/[store]/cart`)
   - 4.6 Checkout (`/[store]/checkout`)
   - 4.7 Payment (`/[store]/checkout/payment`)
   - 4.8 Payment Success (`/[store]/checkout/payment/success`)
   - 4.9 Order History (`/[store]/checkout/history`)
   - 4.10 Order Detail (`/[store]/checkout/history/[id]`)
   - 4.11 Login (`/[store]/auth/login`)
   - 4.12 Register (`/[store]/auth/register`)
   - 4.13 Forgot Password (`/[store]/auth/forgot-password`)
   - 4.14 Settings (`/[store]/setting`)
   - 4.15 PC Builder (`/[store]/simasko/rakit-komputer`)
   - 4.16 About (`/[store]/about`)
   - 4.17 404 (`/404`)
   - 4.18 ChatBot (Global Overlay)
5. [Komponen Global](#5-komponen-global)
6. [Sistem Pembayaran](#6-sistem-pembayaran)
7. [Theme System](#7-theme-system)
8. [API Endpoints](#8-api-endpoints)

---

## 1. Arsitektur & Teknologi

### Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Nuxt | 4.2.1 | Framework utama (Vue 3 + SSR) |
| Nuxt UI | 4.2.1 | Komponen UI siap pakai (125+) |
| Tailwind CSS | v4 | Utility CSS framework |
| Pinia | 3.0.4 | State management (1 store: auth) |
| TypeScript | - | Type safety |
| VueUse | 13.9 | Utility composables |
| Zod | 4.1 | Form validation schemas |
| `useMobileHeaderContext` | - | Mobile header context detection (route-based) |
| Leaflet | 1.9.4 | Map picker untuk alamat |
| date-fns | 4.1 | Date formatting |
| i18n | - | Multi-language (ID/EN) |
| Nuxt Image | - | Image optimization |
| Google Auth | - | Google OAuth login |

### Struktur Folder

```
pos-sadigit-store-ecommerce/
├── app/                          # Source code utama
│   ├── app.vue                   # Root component (UApp + NuxtLayout)
│   ├── app.config.ts             # Nuxt UI color config
│   ├── error.vue                 # Error page
│   ├── assets/css/main.css       # Tailwind + theme overrides
│   ├── components/               # Komponen Vue
│   │   ├── app/                  # Komponen global (Header, Footer, ChatBot, dll)
│   │   ├── auth/                 # Auth komponen (Login)
│   │   ├── home/                 # BannerSection
│   │   ├── product/              # Item, ItemSmall
│   │   ├── setting/              # Address, AddressForm, AddressMapPicker, AddressList
│   │   ├── transaction/          # Tracking
│   │   └── Modal/                # Confirm
│   ├── composables/              # 22 composables (business logic)
│   ├── layouts/                  # default.vue, auth.vue
│   ├── middleware/                # auth.ts
│   ├── pages/                    # 19 halaman
│   ├── plugins/                  # auth.ts (fetch user on init)
│   ├── stores/                   # auth.ts (Pinia)
│   ├── types/                    # 13 file type definitions
│   └── utils/                    # api-endpoints, currency, date, validation, dll
├── server/api/v1/                # Nitro API routes (mock server)
├── i18n/locales/                 # id.json, en.json
└── docs/                         # Dokumentasi
```

### Pola Arsitektur

- **Multi-tenant:** Semua route store-specific di bawah `/[store]` dynamic slug
- **Composable-first:** Business logic di composables, bukan di Pinia (kecuali auth)
- **Single Pinia store:** Hanya `auth` store — sisanya `useState` + composables
- **In-memory mock server:** Server Nitro dengan data in-memory (42 produk, 3 user, 8 order)
- **API wrapper:** `useApi.ts` — custom wrapper di atas `useFetch`/`$fetch`

---

## 2. Routing & Navigasi Global

### 2.1 Daftar Route

| # | Route | File | Layout | Auth | Deskripsi |
|---|-------|------|--------|------|-----------|
| 1 | `/` | `pages/index.vue` | - | Public | Redirect ke store slug |
| 2 | `/404` | `pages/404.vue` | default | Public | Halaman tidak ditemukan |
| 3 | `/[store]` | `pages/[store].vue` | - | Public | Wrapper (load store profile) |
| 4 | `/[store]` | `pages/[store]/index.vue` | default | Public | Landing page toko |
| 5 | `/[store]/search` | `pages/[store]/search/index.vue` | default | Public | **Search & Category** — query: `?q=`, `?category=`, `?subcategory=` |
| 6 | `/[store]/[slug]` | `pages/[store]/[slug].vue` | default | Public | **Product detail** — auto-detect product vs redirect to search |
| 6a | `/[store]/product/[slug]` | `pages/[store]/product/[slug].vue` | default | Public | **Redirect 301** → `/[store]/[slug]` (backward compat) |
| 6b | `/[store]/[...category]` | `pages/[store]/[...category]/index.vue` | default | Public | **Redirect 301** → `/[store]/search?category=...` (backward compat) |
| 6a | `/[store]/categories` | `pages/[store]/categories/index.vue` | default | Public | **Mobile only** — Category grid page |
| 7 | `/[store]/cart` | `pages/[store]/cart/index.vue` | default | **requiresAuth** | Keranjang |
| 8 | `/[store]/checkout` | `pages/[store]/checkout/index.vue` | default | **requiresAuth** | Checkout |
| 9 | `/[store]/checkout/payment` | `pages/[store]/checkout/payment/index.vue` | default | **requiresAuth** | Pembayaran |
| 10 | `/[store]/checkout/payment/success` | `pages/[store]/checkout/payment/success.vue` | default | **requiresAuth** | Sukses bayar |
| 11 | `/[store]/checkout/history` | `pages/[store]/checkout/history/index.vue` | default | **requiresAuth** | Riwayat order |
| 12 | `/[store]/checkout/history/[id]` | `pages/[store]/checkout/history/[id].vue` | default | **requiresAuth** | Detail order |
| 13 | `/[store]/auth/login` | `pages/[store]/auth/login.vue` | auth | **guestOnly** | Login |
| 14 | `/[store]/auth/register` | `pages/[store]/auth/register.vue` | auth | **guestOnly** | Register |
| 15 | `/[store]/auth/forgot-password` | `pages/[store]/auth/forgot-password.vue` | auth | **guestOnly** | Lupa password |
| 16 | `/[store]/setting` | `pages/[store]/setting/index.vue` | default | **requiresAuth** | Pengaturan |
| 17 | `/[store]/simasko/rakit-komputer` | `pages/[store]/simasko/rakit-komputer/index.vue` | default | **requiresAuth** | PC Builder |
| 18 | `/[store]/about` | `pages/[store]/about/index.vue` | default | Public | Tentang toko |

### 2.2 Auth Middleware Behavior

```
Middleware: middleware/auth.ts

Route dengan `requiresAuth: true`:
  User belum login → redirect ke /[store]/auth/login
  User sudah login → lanjut

Route dengan `guestOnly: true`:
  User sudah login → redirect ke /[store]/
  User belum login → lanjut

Flow login success:
  Login → fetchUser() → requestCartRefresh() → navigateTo(redirectTo)
    ↓ redirectTo default: /[store]/
```

### 2.3 Header Navigation (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]  [Category▼]  │         [Search...]          │  [PC] [ID▼]  │
│                        │                              │ [🛒 N] [📄 N] │
│                        │                              │ [👤▼] [Login] │
└─────────────────────────────────────────────────────────────────────┘
```

| Area | Komponen | Perilaku |
|------|----------|----------|
| Logo | `NuxtImg` / `IconsEcommerceLogo` → `/[store]` | Klik → home |
| Category | `UPopover` + `UNavigationMenu` | Hover/klik → buka popover kategori tree |
| Search | `UInput` + `UPopover` | Focus → API search (400ms debounce) → tampilkan produk + kategori |
| PC Builder | `UButton` (hanya jika schema contains 'SIMASKO') | Klik → `/[store]/simasko/rakit-komputer` |
| Locale | `UDropdownMenu` | Klik → pilih ID / EN |
| Cart | `UChip` + `UButton` (hanya jika login) | Klik → `/[store]/cart`; badge = item count |
| Orders | `UChip` + `UButton` (hanya jika login) | Klik → `/[store]/checkout/history`; badge = pending count |
| User | `UDropdownMenu` + `UAvatar` (jika login) | Klik → buka dropdown menu |
| Login | `UButton` (jika belum login) | Klik → `/[store]/auth/login` |

### 2.4 Header Navigation (Mobile)

Header mobile sekarang **context-aware** — menampilkan konten berbeda tergantung halaman aktif:

| Context | Left | Center | Right |
|---------|------|--------|-------|
| **Home** | Logo | - | Search toggle, Cart |
| **Product Detail** | ← Back | Product name (truncated) | Cart |
| **Cart** | ← Back | "Keranjang (N)" | - |
| **Checkout** | ← Back | "Checkout" | - |
| **History** | ← Back | "Riwayat Transaksi" | - |
| **Settings** | ← Back | "Pengaturan" | - |
| **Categories** | ← Back | "Kategori" | - |
| **Auth pages** | Logo only | - | - |

**Custom toggle button:** Search icon yang membuka drawer dengan search + categories (menggunakan `<template #toggle>` dari UHeader).

```
┌──────────────────────────────────────┐
│ [←] [Page Title]          [🛒] [🔍] │
└──────────────────────────────────────┘
```

**Komponen:** `useMobileHeaderContext()` composable mengatur context berdasarkan route.

### 2.5 Bottom Navigation (Mobile)

Bottom navigation muncul hanya di mobile (`lg:hidden`) dan disembunyikan di auth pages.

```
┌──────────────────────────────────────────┐
│ [🏠]  [⊞]  [📄 N]  [🖥️]  [👤]          │
│ Home  Kategori  Orders  Rakit PC  Profil│
└──────────────────────────────────────────┘
```

| Item | Icon | Route | Badge | Visible |
|------|------|-------|-------|---------|
| Home | `i-lucide-home` | `/[store]` | - | Always |
| Categories | `i-lucide-grid-3x3` | `/[store]/categories` | - | Always |
| Orders | `i-lucide-receipt-text` | `/[store]/checkout/history` | Pending count | If authenticated |
| PC Builder | `i-lucide-pc-case` | `/[store]/simasko/rakit-komputer` | - | If schema contains 'SIMASKO' + authenticated |
| Profile | `i-lucide-user-round` | `/[store]/setting` | - | If authenticated |

**Features:**
- Active state highlight (text-primary-600)
- Order badge (pending payment count)
- Theme-specific styling (3 theme variants)
- **Hidden di auth pages** — tidak mengganggu login/register flow

**Komponen:** `AppBottomNav.vue` (gateway) → `themes/*/app/BottomNav.vue`

### 2.6 User Dropdown Menu

```
┌──────────────────────────────┐
│ 👋 Halo, {Nama User}         │
│──────────────────────────────│
│ 🖥️ PC Builder (if SIMASKO in schema)  │ → /simasko/rakit-komputer
│ 🔧 Service Status           │ → Buka modal dialog
│ 📄 Riwayat Pesanan          │ → /checkout/history
│──────────────────────────────│
│ ⚙️ Pengaturan               │ → /setting
│──────────────────────────────│
│ 🚪 Keluar                   │ → Confirm → logout
└──────────────────────────────┘
```

### 2.7 Footer Navigation

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│ │ [Logo]      │  │ Kontak          │  │ Navigasi          │  │
│ │ Deskripsi   │  │ 📍 Alamat       │  │ Tentang Kami      │  │
│ │ [FB][IG][YT]│  │ 📞 Telepon      │  │ Kebijakan Privasi │  │
│ └─────────────┘  │ 🕐 Jam Oper.    │  │ Ketentuan Layanan │  │
│                  └────────────────┘  └──────────────────┘  │
│ ─────────────────────────────────────────────────────────── │
│ Copyright © 2026        [🌙/☀️]       Powered by POS        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Layout

### 3.1 Default Layout

```
┌────────────────────────────┐
│  HEADER (fixed, z-999)     │  bg-white, border-bottom
│  mt-18 (mobile) / mt-20   │
│  (desktop)                 │
├────────────────────────────┤
│                            │
│  MAIN CONTENT (slot)       │  flex-1, bg-white
│                            │
├────────────────────────────┤
│  FOOTER                    │
└────────────────────────────┘
```

**Nuxt UI Components:** `<main>` semantic element

### 3.2 Auth Layout

```
┌────────────────────────────┐
│  [🌐 ID/EN] (top-right)    │  UButton ghost
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │  Gradient bg
│  │   [STORE LOGO]       │  │  Centered
│  │                      │  │
│  │   ┌──────────────┐   │  │  UCard container
│  │   │   SLOT       │   │  │  (login/register/forgot-pw)
│  │   └──────────────┘   │  │
│  └──────────────────────┘  │
│                            │
│  FOOTER                    │
└────────────────────────────┘
```

**Nuxt UI Components:** UButton

---

## 4. Halaman & Fitur

---

### 4.1 Landing Page (`/`)

**Route:** `/`  
**Layout:** None (redirect only)  
**Auth:** Public  

#### 1. Deskripsi
Halaman entry point aplikasi. Tidak menampilkan UI — hanya logic redirect berdasarkan store slug yang tersimpan.

#### 2. Struktur Layout
```
(Template kosong — hanya logic di script setup)
```

#### 3. Daftar Fitur

| # | Fitur | Perilaku |
|---|-------|----------|
| 1 | Redirect ke store | Baca `store_slug` dari cookie → priority 1 |
| 2 | Fallback localStorage | Jika tidak ada cookie, baca dari localStorage |
| 3 | Dev fallback | Dev mode → redirect ke `/sadigit-store` |
| 4 | 404 fallback | Jika tidak ada store → `/404` |

#### 4. Flow

```
User buka /
    ↓
Cek cookie 'store_slug'
    ↓ (ada)           (tidak ada)
    ↓                    ↓
navigateTo('/{slug}')   Cek localStorage
                            ↓ (ada)       (tidak ada)
                            ↓                ↓
                        navigateTo        Cek dev mode
                            ↓ (dev)         (prod)
                            ↓                ↓
                        /sadigit-store    /404
```

#### 5. Navigasi
- Tidak ada (semua redirect)

#### 6. Data yang Ditampilkan
- Tidak ada

#### 7. Nuxt UI Components
- None

---

### 4.2 Store Home (`/[store]`)

**Route:** `/[store]`  
**Layout:** default  
**Auth:** Public  

#### 1. Deskripsi
Halaman utama toko. Menampilkan banner promosi, fitur Simasko (jika diaktifkan oleh store), dan katalog produk dengan infinite scroll.

#### 2. Struktur Layout

```
┌──────────────────────────────────────────────────────────┐
│ [HEADER]                                                  │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────┐        │
│  │           BANNER CAROUSEL                    │        │
│  │   [Image ← ○ ○ ○ →] autoplay 10s, loop     │        │
│  └──────────────────────────────────────────────┘        │
│                                                           │
│  ┌────── [SIMASKO ONLY] ──────┐ ┌──── [SIMASKO ONLY] ─┐ │
│  │ 🔧 Service Status Checker  │ │ ⚡ PC Builder       │ │
│  │ [___] [📋] [→]             │ │ ✅ Fitur 1           │ │
│  └────────────────────────────┘ │ ✅ Fitur 2           │ │
│                                  │ [Mulai Rakit]        │ │
│                                  └──────────────────────┘ │
│                                                           │
│  [All Products]                      [Filter: Terbaru ▼] │
│                                                           │
│  ┌──────────┐  ┌────┬────┬────┬────┬────┐               │
│  │Category  │  │ P1 │ P2 │ P3 │ P4 │ P5 │               │
│  │Sidebar   │  ├────┼────┼────┼────┼────┤               │
│  │(sticky)  │  │ P6 │ P7 │ P8 │ P9 │P10 │               │
│  │desktop   │  └────┴────┴────┴────┴────┘               │
│  │only      │     ↕ Infinite Scroll Load More            │
│  └──────────┘                                            │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ [FOOTER]                                                  │
└──────────────────────────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Letak | Perilaku | State |
|---|-------|----------|-------|----------|-------|
| 1 | Banner Carousel | `HomeBannerSection` (`UCarousel`, `USkeleton`) | Paling atas | Auto-play 10s, loop, wheel gesture, dots. Klik → link tujuan | **Loading:** USkeleton; **Normal:** slides; **Empty:** skeleton terus |
| 2 | Simasko Service Check | `UCard` + `UAlert` + `UFormField` + `UInput` + `UButton` | Baris 2, kiri (jika schema includes 'SIMASKO') | Input service code → paste dari clipboard → submit → redirect external | **Normal:** form; **Error:** toast |
| 3 | PC Builder Promo | `UCard` + `UAvatar` + `UBadge` + `UButton` | Baris 2, kanan (jika schema includes 'SIMASKO') | Klik CTA → `/[store]/simasko/rakit-komputer` | **Normal:** card dengan 3 bullet points |
| 4 | Product Sort Filter | `USelect` | Atas product grid | Pilih opsi → fetch ulang products | **Normal:** dropdown options |
| 5 | Category Sidebar | `UCard` + `UNavigationMenu` (vertical, highlight) | Kiri grid, desktop only (`hidden md:block`), sticky | Klik → navigasi ke kategori | **Normal:** category tree; **Loading:** - |
| 6 | Product Grid | Grid of `ProductItem` (2/4/5 cols) | Tengah | Tampilkan produk dalam grid | **Loading:** spinner di sentinel; **Normal:** cards; **Empty:** icon + "Tidak ada produk" |
| 7 | Infinite Scroll | `IntersectionObserver` (sentinel div) | Bawah grid | Scroll sentinel visible → `loadMoreProducts()` | **Loading:** spinner; **End:** stop; **Error:** toast |

#### 4. State-setiap Fitur

| Fitur | Loading | Empty | Error | Normal |
|-------|---------|-------|-------|--------|
| Banner | USkeleton (height 104px/296px) | Skeleton terus | Skeleton terus | Carousel slides |
| Service Check | - | - | Toast | Form input |
| PC Builder | - | - | - | Card promo |
| Product Filter | - | - | - | USelect |
| Category Sidebar | - | - | - | Tree menu |
| Product Grid | Spinner | Icon `package-open` + "Tidak ada" | Toast | Product cards |
| Infinite Scroll | Spinner sentinel | - | - | Auto-load |

#### 5. Flow / Interaksi User

```
User scroll ke bawah
    ↓
IntersectionObserver trigger → loadingMore = true
    ↓
fetchProducts({ page: nextPage, append: true })
    ↓ success → append products to grid, loadingMore = false
    ↓ end → stop observer
    ↓ error → toast, loadingMore = false

User pilih filter
    ↓
getProducts({ sort: 'price_low_to_high' }) → replace grid
    ↓
Reset infinite scroll observer
```

#### 6. Navigasi

| Dari | Tujuan | Trigger |
|------|--------|---------|
| Banner | `banner.link` (internal/external) | Klik gambar |
| Category sidebar | `/[store]/search?category=:slug` atau `/[store]/search?category=:slug&subcategory=:child` | Klik item |
| Product card | `/[store]/:slug` | Klik card |
| PC Builder CTA | `/[store]/simasko/rakit-komputer` | Klik button |
| Service submit | External URL `{baseUrl}/{code}` | Klik submit |
| Header search | `/[store]/search?q=:query` (preserve query params) | Enter / Lihat semua hasil |
| Header cart | `/[store]/cart` | Klik icon |
| Header login | `/[store]/auth/login` | Klik button |

#### 7. Data yang Ditampilkan

| Data | Source API | Field |
|------|-----------|-------|
| Banners | `GET /banner` | `{ image, link }` |
| Categories | `GET /categories` | `{ id, name, slug, children: [{ name, slug }] }` |
| Products | `GET /products` | `{ id, title, slug, price, discount_percentage, rating, sold_count, image, category, brand, is_new, is_best_seller, stock }` |
| Store Profile | `GET /store/:slug` | `{ name, logo_url, config: { schema, theme } }` |

#### 8. Nuxt UI Components Used

`HomeBannerSection`, `UCard`, `UAvatar`, `UBadge`, `UIcon`, `UAlert`, `UFormField`, `UInput`, `UButton`, `USelect`, `UNavigationMenu`, `ProductItem`

#### 9. Catatan untuk Designer

- **Simasko section hanya muncul jika** `storeProfile.config.schema.includes('SIMASKO')` — perlu handle hidden state
- **Category sidebar** adalah secondary navigation — hidden di mobile, diganti dropdown
- **Product grid** adalah main content — infinite scroll tanpa pagination numbers
- **Filter change** trigger full grid refresh — perlu loading state visual
- **Banner aspect ratio** 16:6 — sangat wide, pertimbangkan mobile crop
- **Hierarki visual:** Banner (primary) → Simasko (jika ada) → Product grid (utama)

---

### 4.3 Search & Category Page (`/[store]/search`)

**Route:** `/[store]/search?q=...&category=...&subcategory=...&sort=...`  
**Layout:** default  
**Auth:** Public  
**Redirect:** `/[store]/:category` atau `/[store]/:category/:subcategory` → `/[store]/search?category=...` (301)

#### 1. Deskripsi
Halaman pencarian dan listing produk berdasarkan kategori. Query params:
- `?q=laptop` — Pencarian keyword
- `?category=laptop` — Filter kategori
- `?subcategory=acer` — Filter subkategori
- `?sort=newest` — Sorting (newest, price_low_to_high, dll)

Mendukung subkategori level 2. Menggunakan infinite scroll sama seperti landing page.

#### 2. Struktur Layout

**Desktop:**
```
┌──────────────────────────────────────────────────────────┐
│ [HEADER]                                                  │
├──────────────────────────────────────────────────────────┤
│  [Sticky Bar — Single Row]                                │
│  Home > Category > Subcategory [🔍 Badge]  [Filter ▼] 120 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌────┬────┬────┬────┬────┐               │
│  │Category  │  │ P1 │ P2 │ P3 │ P4 │ P5 │               │
│  │Sidebar   │  ├────┼────┼────┼────┼────┤               │
│  │(sticky)  │  │ P6 │ P7 │ P8 │ P9 │P10 │               │
│  │desktop   │  └────┴────┴────┴────┴────┘               │
│  │only      │     ↕ Infinite Scroll                      │
│  └──────────┘                                            │
│                                                           │
├──────────────────────────────────────────────────────────┤
│ [FOOTER]                                                  │
└──────────────────────────────────────────────────────────┘
```

**Mobile (Stacked Layout):**
```
┌──────────────────────────────────────┐
│ [HEADER]                              │
├──────────────────────────────────────┤
│  [Sticky Bar — Stacked Rows]          │
│  ┌────────────────────────────────┐   │
│  │ Home > Category > ...          │   │ ← Breadcrumb (truncate)
│  │ [🔍 Pencarian: "macbook"]      │   │ ← Search badge (if any)
│  └────────────────────────────────┘   │
│  ┌────────────────────────────────┐   │
│  │ Filter (2)             [F][U]│   │ ← Filter toolbar (info + buttons)
│  └────────────────────────────────┘   │
│  ┌────────────────────────────────┐   │
│  │ [Laptop ✕] [Termurah ✕]        │   │ ← Active filter chips
│  └────────────────────────────────┘   │
│  ┌────────────────────────────────┐   │
│  │ 120 produk                      │   │ ← Count row
│  └────────────────────────────────┘   │
├──────────────────────────────────────┤
│                                       │
│  ┌────┬────┐                          │
│  │ P1 │ P2 │                          │
│  ├────┼────┤                          │
│  │ P3 │ P4 │     ↕ Infinite Scroll    │
│  └────┴────┘                          │
│                                       │
├──────────────────────────────────────┤
│ [FOOTER]                              │
└──────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Perilaku | State |
|---|---|-------|----------|----------|-------|
| 1 | Breadcrumb | `UBreadcrumb` | Home > Category > Subcategory, **truncate** saat panjang | Normal |
| 2 | Search Query Badge | `UBadge` | Muncul saat ada `?q=` — menampilkan keyword pencarian | Normal |
| 3 | **Mobile Filter Toolbar** | `CategoryMobileFilter` | **Toolbar label dinamis** + Filter button + Sort button. Label menampilkan: `Filter & sort produk:`, `Mencari: "{query}"`, atau `Filter ({count})` | Normal |
| 4 | **Mobile Filter Slideover** | `USlideover` (right) + `UTree` | **Kategori hierarki** dengan `<UTree>` (expandable parent + subcategory). **Price Range** dengan `URadioGroup`. **Sort** dengan `URadioGroup`. Tombol Reset & Apply | Normal; Loading |
| 5 | **Active Filter Chips** | `UButton` (soft, rounded-full) | Muncul saat ada filter aktif. Klik chip → remove filter. Horizontal scroll jika banyak | Normal |
| 6 | Product Count | Text | **Desktop:** inline dengan filter. **Mobile:** baris terpisah di bawah filter | Normal |
| 7 | Category Sidebar | `UCard` + `UNavigationMenu` | Sticky, desktop only | Normal; Active state |
| 8 | Product Grid | Grid `ProductItem` | 2/4/5 columns | Loading/Empty/Normal |
| 9 | Infinite Scroll | `IntersectionObserver` | Load more | Loading spinner |

**Responsive Layout (Mobile vs Desktop):**
- **Desktop:** Single row — Breadcrumb + Badge | Filter + Count (inline)
- **Mobile:** Stacked rows — Breadcrumb row → Filter toolbar row → Active filter chips (jika ada) → Count row
- **Mobile Filter Toolbar:** Label dinamis + Filter button + Sort button (di kanan)
- **Active Filter Chips:** Horizontal scrollable row dengan chip removable (`UButton` soft rounded-full)
- Breadcrumb menggunakan `min-w-0 overflow-hidden` agar tidak overflow
- Product count hidden di mobile filter bar, muncul di baris terpisah bawah

**Mobile Filter Slideover (Right Panel):**
```
┌──────────────────────────────┐
│ Filter                 [✕]   │  ← Header
├──────────────────────────────┤
│ ▼ Kategori                   │  ← Expandable section
│   ○ Semua Kategori           │
│   ▼ Elektronik          ✓    │  ← Parent (expanded)
│     ○ Laptop                 │
│     ● Desktop           ✓    │  ← Child (selected)
│     ○ Aksesoris              │
│   ○ Fashion                  │
│   ○ Makanan                  │
├──────────────────────────────┤
│ ▼ Harga                      │  ← Price range radio
│   ○ Termurah                 │
│   ○ Termahal                 │
│   ○ Terpopuler               │
├──────────────────────────────┤
│ ▼ Urutkan                    │  ← Sort radio
│   ● Terbaru            ✓     │
│   ○ Harga Terendah           │
│   ○ Harga Tertinggi          │
├──────────────────────────────┤
│ [Reset]    [Terapkan (120)]  │  ← Footer buttons
└──────────────────────────────┘
```

**Mobile Sort Bottom Sheet:**
```
┌──────────────────────────────┐
│ Urutkan                [✕]   │
├──────────────────────────────┤
│ ● Terbaru              ✓     │
│ ○ Harga Terendah             │
│ ○ Harga Tertinggi            │
│ ○ Terpopuler                 │
│ ○ Rating Tertinggi           │
│ ○ Diskon Terbesar            │
└──────────────────────────────┘
```

**Query Params Preservation:**
- Saat user search dari header → `q` ditambahkan, category & sort dipertahankan
- Saat user ganti kategori → category/subcategory diupdate, `q` & sort dipertahankan
- Saat user ganti sort → sort diupdate, `q` & category dipertahankan

#### 4. Flow

```
Route: /[store]/search?category=laptop&subcategory=acer&q=macbook&sort=newest
  → category = 'laptop', subcategory = 'acer', q = 'macbook', sort = 'newest'
  → useProducts({ category: 'acer', search: 'macbook', sort: 'newest' })
  → GET /products?category=acer&search=macbook&sort=newest

Mobile Filter Flow:
  User klik Filter button
    ↓
  openFilter() → sync tempCategory = categorySelected, tempFilter = filterSelected
    ↓
  Sync UTree state: selectedTreeItem ← lookup dari slugToTreeItemMap
    ↓
  Jika subcategory aktif → expandedTreeItems ← tambah parent label
    ↓
  Buka USlideover (right)
    ↓
  User pilih kategori di UTree (onSelect callback)
    → tempCategory = extractSlugFromNavItem(item)  ← synchronous!
    → No race condition (onSelect langsung update)
    ↓
  User klik Apply
    → categorySelected = tempCategory, filterSelected = tempFilter
    → emit('apply') → parent page update query params
    → USlideover close
    ↓
  User klik Sort button
    → openSort() → Buka USlideover (bottom sheet)
    → Pilih sort → handleSortSelect() → langsung apply & close
    ↓
  User klik chip filter aktif
    → removeFilter() → reset category/filter → emit('apply')

Subcategory change (mobile dropdown):
  → navigateTo('/[store]/search?category=laptop&subcategory=asus&q=macbook&sort=newest')
  → route.query watch → re-fetch products (q & sort preserved)

Search from header:
  → navigateTo('/[store]/search?q=macbook+pro&category=laptop&sort=newest')
  → GET /products?search=macbook+pro&category=laptop&sort=newest
  → category & sort preserved!

Category change from sidebar:
  → navigateTo('/[store]/search?category=acer&q=macbook&sort=newest')
  → q & sort preserved!
```

#### 5. Data

| Data | Source |
|------|--------|
| Categories | `GET /categories` |
| Products | `GET /products?category={slug}&sort={sort}` |

#### 6. Nuxt UI Components Used

`UBreadcrumb`, `UBadge`, `USelect`, `UCard`, `UNavigationMenu`, `UIcon`, `ProductItem`, `USlideover`, `UTree`, `URadioGroup`, `UButton`

#### 7. Catatan untuk Designer

- **Mobile Filter Toolbar** menggunakan label dinamis — tampilkan info context (searching/filtering state) daripada static title
- **Active Filter Chips** horizontal scrollable — pertimbangkan max-width dan truncate untuk label panjang
- **UTree di mobile filter** — parent category expandable dengan chevron, child subcategory indented. Selected state menggunakan highlight color (primary)
- **Filter Slideover (right)** — full-height panel dengan sticky header + scrollable body + sticky footer (Reset + Apply)
- **Sort Bottom Sheet** — panel bawah yang lebih compact, langsung apply tanpa tombol Apply terpisah
- **Race condition handling** — onSelect callback (synchronous) dipakai untuk update temp state, bukan v-model watch
- **Slug extraction** — URL params `?category=` dan `?subcategory=` diekstrak untuk mapping ke TreeItem selection
- **State sync saat reopen** — UTree selection dan expanded state di-sync dari `categorySelected` saat filter dibuka kembali

---

### 4.3a Categories Page (`/[store]/categories`) ⭐ NEW

**Route:** `/[store]/categories`  
**Layout:** default  
**Auth:** Public  
**Device:** Mobile only (`lg:hidden`)

#### 1. Deskripsi
Halaman khusus mobile untuk menampilkan semua kategori dalam grid layout. Diakses via bottom navigation "Categories".

#### 2. Struktur Layout

```
┌──────────────────────────────────────┐
│ [← Back]  Kategori                   │
├──────────────────────────────────────┤
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ [🔧] │ │ [💻] │ │ [🎧] │         │
│  │ CPU  │ │Laptop│ │Audio │         │
│  └──────┘ └──────┘ └──────┘         │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ [🖥️] │ │ [💾] │ │ [⚡] │         │
│  │Monitor│ │Storage│ │ PSU  │         │
│  └──────┘ └──────┘ └──────┘         │
│                                      │
├──────────────────────────────────────┤
│ [🏠] [⊞] [📄] [🖥️] [👤]            │  ← Bottom Nav
└──────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Perilaku | State |
|---|-------|----------|----------|-------|
| 1 | Back Button | `UButton` | Navigate to home | Normal |
| 2 | Category Grid | `NuxtLink` grid 3-col | Icon + name, tap → category page | **Loading:** Skeleton; **Empty:** "Belum ada kategori" |
| 3 | Category Icon | `UIcon` | Dynamic icon based on category name (CPU, Laptop, Audio, etc.) | Normal |

#### 4. Flow

```
User tap "Categories" di Bottom Nav
  → navigateTo('/[store]/categories')
  → fetchCategories()
  → render grid with icon mapping

User tap category
  → navigateTo('/[store]/:category-slug')
```

#### 5. Icon Mapping

| Keyword | Icon |
|---------|------|
| cpu, processor | `i-lucide-cpu` |
| motherboard | `i-lucide-circuit-board` |
| ram, memory | `i-lucide-memory-stick` |
| ssd, storage | `i-lucide-hard-drive` |
| gpu, graphic | `i-lucide-videogame-asset` |
| psu, power | `i-lucide-plug-zap` |
| laptop | `i-lucide-laptop` |
| phone | `i-lucide-smartphone` |
| audio | `i-lucide-headphones` |
| default | `i-lucide-package` |

#### 6. Data

| Data | Source |
|------|--------|
| Categories | `GET /categories` |

#### 7. Nuxt UI Components Used

`UButton`, `UIcon`, `UAvatar`, `USkeleton`, `NuxtLink`

---

### 4.4 Product Detail (`/[store]/[slug]`)

**Route:** `/[store]/:slug`  
**Layout:** default  
**Auth:** Public  
**Redirect:** `/[store]/product/:slug` → `/[store]/:slug` (301)

#### 1. Deskripsi
Halaman detail produk. Auto-detect apakah slug adalah produk (via API check) — jika bukan, redirect ke halaman search. Menampilkan image gallery dengan zoom, informasi produk, variant/color selector, cart sidebar, review section, dan related products.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────────┐
│ [HEADER]                                                    │
├────────────────────────────────────────────────────────────┤
│  [Sticky] Home > Category > Subcategory > Product Title     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐      ┌──────────────────────────────┐  │
│  │ [Main Image]   │      │ [Badge] Product Title         │  │
│  │ (zoom on hover)│      │ ~~Rp1.000.000~~  [-20%]      │  │
│  │                │      │ Rp800.000                     │  │
│  │ [Thumbs ◀▶]    │      │ ★★★★☆ 4.5 · Terjual 10      │  │
│  └────────────────┘      │ Variant: [Select ▼]           │  │
│                           │ Color: [Select ▼]             │  │
│                           │ ─────────────────────────    │  │
│                           │ SKU: XXXX                     │  │
│                           │ Kategori: Laptop (link)       │  │
│                           │ Brand: ASUS                   │  │
│                           │ Min beli: 1                   │  │
│                           │ Berat: 2.5kg                  │  │
│                           │ ─────────────────────────    │  │
│                           │ Deskripsi produk...            │  │
│                           └──────────────────────────────┘  │
│                           ┌──────────────────────────────┐  │
│                           │ Stok: Tersedia [success]     │  │
│                           │ Jumlah: [___]  Subtotal: RpX │  │
│                           │ [+ Add to Cart]              │  │
│                           └──────────────────────────────┘  │
│                                                             │
│  ┌─ Review Section ───────────────────────────────────┐    │
│  │  ★ 4.2/5    │ Review 1: "Bagus banget" ★★★★★     │    │
│  │  [5★ █████] │ Review 2: "Mantap" ★★★★☆           │    │
│  │  [4★ ██░░░] │               [◄ 1 2 3 ►]          │    │
│  │  [All] [5★] │                                      │    │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Other Products (related)                                   │
│  [P] [P] [P] [P] [P] [P]                    [Lihat Semua]  │
│                                                             │
├────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                    │
└────────────────────────────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Letak | Perilaku | State |
|---|-------|----------|-------|----------|-------|
| 1 | Login Modal | `UModal` + `AuthLogin` | Overlay | Muncul jika user klik "Add to Cart" saat belum login | **Normal:** modal form login; **Success:** close + add to cart |
| 2 | Breadcrumb | `UBreadcrumb` | Sticky bar atas | Home > Category > Product | Normal |
| 3 | Image Gallery | `UCarousel` (main + thumb) | Kiri desktop, atas mobile | Mouseover zoom (pan/scale). Klik thumb → ganti main image | **Normal:** gallery with thumbs; **Loading:** - |
| 4 | Product Info | `UBadge` + `h1` + price + rating | Kanan atas | Menampilkan informasi produk | **Normal:** data; **Not Found:** fallback |
| 5 | Variant/Color Select | `USelect` | Info section | Ganti variant → recalculate price | Normal |
| 6 | Specifications | Text grid | Info tengah | SKU, Category (link), Brand, Min Buy, Weight | Normal |
| 7 | Description | `v-html` in prose | Info bawah | Deskripsi produk | Normal |
| 8 | Cart Sidebar | `UCard` + `UBadge` + `UInputNumber` + `UBadge` | Kanan, sticky desktop | Quantity → subtotal. Add to Cart → POST /cart | **Normal:** form; **Loading:** button loading |
| 9 | Reviews | `UCard` + `UProgress` + `UPagination` + `UAlert` | Bawah produk | Rating summary + filter + list + pagination | **Loading:** -; **Normal:** reviews; **Empty:** UAlert |
| 10 | Related Products | Grid `ProductItem` + `ULink` | Bawah reviews | Tampilkan produk terkait, "Lihat Semua" → category | Normal |

#### 4. State-setiap Fitur

| Fitur | Loading | Empty | Error | Normal |
|-------|---------|-------|-------|--------|
| Product | Skeleton layout (image + text bars) | - | Toast error | Full detail |
| Image Gallery | - | No image placeholder | - | Carousel + zoom |
| Reviews | - | UAlert + icon | - | List + pagination |
| Related Products | - | - | - | Product grid |
| Add to Cart | Button loading | - | Toast error | Success toast |

#### 5. Flow

```
User buka /{slug}
  → Check API: apakah slug adalah produk?
  → (ya) → render ProductDetail
  → (tidak) → redirect 301 ke /search?category={slug}

User buka /product/{slug} (URL lama)
  → redirect 301 ke /{slug}

User ganti variant
  → variantSelected berubah
  → price dihitung ulang (cari variant dengan price override)

User klik "Add to Cart"
  → cek isAuthenticated
  → (belum login) → showLoginModal = true
  → (sudah login) → addToCart({ product_id, quantity, variant, color })
  → success → toast + reset qty ke min
  → error → toast

User ganti review filter
  → reviewFilter berubah → reviewPage = 1
  → paginatedReviews dihitung ulang
```

#### 6. Navigasi

| Dari | Tujuan | Trigger |
|------|--------|---------|
| Breadcrumb | Home / Category | Klik |
| Spec category link | `/[store]/search?category=:slug` | Klik |
| Related products | `/[store]/:slug` | Klik |
| View All | `/[store]/search?category=:category` | Klik |
| Not Found Back | `router.back()` | Klik |
| Not Found Home | `/[store]` | Klik |
| Add to Cart (if guest) | Login modal muncul | Klik |

#### 7. Data yang Ditampilkan

| Data | Source |
|------|--------|
| Product detail | `GET /products/:slug` |
| Related products | `GET /products/:slug/related` |

**Product fields:** id, title, slug, price, discount_percentage, rating, sold_count, is_new, is_best_seller, stock, image, images[], category, brand, sku, minimum_buy, weight, description, variants[{label, value, group, price?, options?}], colors[{label, value}], reviews[{id, user_name, rating, review, created_at}]

> **Variant `group` field:** Groups variants into UI sections (e.g. RAM, Warna, Ukuran). Frontend renders a separate section per group with its own heading. Values: `'ram'`, `'warna'`, `'ukuran'`, `'kapasitas'`.

#### 8. Nuxt UI Components Used

`UModal`, `AuthLogin`, `UBreadcrumb`, `UCarousel` (×2), `NuxtImg`, `UBadge` (×3+), `UIcon`, `USelect` (×2), `USeparator`, `ULink`, `UCard` (×3), `UInputNumber`, `UButton`, `UProgress`, `UPagination`, `UAlert`, `ProductItem`

#### 9. Catatan untuk Designer

- **Image zoom** menggunakan mouse position → perlu state visual (cursor zoom indicator)
- **Cart sidebar** sticky di desktop (`lg:sticky lg:top-47`) — scroll bebas di mobile
- **Stock badge** color: `success` (>10), `warning` (1-10), `error` (0)
- **Review filter** menggunakan buttons, bukan dropdown
- **Skeleton layout** saat loading meniru bentuk asli (image square + text bars)
- **Not Found state** ketika slug tidak valid

---

### 4.5 Cart (`/[store]/cart`)

**Route:** `/[store]/cart`  
**Layout:** default  
**Auth:** requiresAuth  

#### 1. Deskripsi
Halaman keranjang belanja. Multi-select items, voucher dengan search, ringkasan pembayaran.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│ [← Back]                                               │
├────────────────────────────────────────────────────────┤
│ [⚠️ Ada pesanan yang belum dibayar]  (conditional)      │
│ [ℹ️ Pesanan expired, restore ke keranjang]  (cond.)   │
├──────────────────────┬─────────────────────────────────┤
│                      │                                  │
│  ┌─ Items ─────────┐ │ ┌─ Summary ──────────────────┐  │
│  │ ☐ Select All    │ │ │ Subtotal: Rp450.000        │  │
│  │ ☐ [Item] qty[🗑]│ │ │                              │  │
│  │ ☐ [Item] qty[🗑]│ │ │ ┌─ Voucher ─────────────┐  │  │
│  │                  │ │ │ │ 🎫 PROMO10             │  │  │
│  │                  │ │ │ │ -10% Maks Rp50rb       │  │  │
│  │ (empty state)    │ │ │ │ [Pilih] / [Dipilih ✅]  │  │  │
│  └──────────────────┘ │ │ └────────────────────────┘  │  │
│                        │ │ Diskon Item: -Rp50.000     │  │
│                        │ │ Diskon Voucher: -Rp40.000  │  │
│                        │ │ ─────────────────────────  │  │
│                        │ │ Total: Rp360.000           │  │
│                        │ │ ┌──────────────────────┐   │  │
│                        │ │ │ [Checkout (2 items)]  │   │  │
│                        │ │ │ [QRIS Logo]           │   │  │
│                        │ │ └──────────────────────┘   │  │
│                        │ └────────────────────────────┘  │
└────────────────────────┴─────────────────────────────────┘

┌─ VOUCHER MODAL (overlay) ──────────────────────────┐
│  [🎟️ Pilih Voucher] "Gratis ongkir & diskon"       │
│  [Search voucher...]                                │
│                                                     │
│  ○ Voucher A — PROMO10                              │
│    Diskon 10% · Min Rp50rb · Maks Rp50rb           │
│  ○ Voucher B — GRATISONGKIR                        │
│    Gratis ongkir · Min Rp100rb                      │
│                                                     │
│  [Clear]                               [Done]      │
└─────────────────────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Perilaku | State |
|---|-------|----------|----------|-------|
| 1 | Back Button | `UButton` `i-lucide-chevron-left` | `router.back()` | Normal |
| 2 | Pending Payment Alert | `UAlert` color="warning" | Conditional — ada order pending belum expired. Link ke payment | **Visible:** order pending exists; **Hidden:** none |
| 3 | Expired Restore Alert | `UAlert` color="info" | Conditional — ada expired orders. Klik → restore items ke cart | **Visible:** expired exists; **Hidden:** none |
| 4 | Select All | `UCheckbox` + indeterminate | Select/unselect semua items. Indeterminate jika sebagian terpilih | **Checked/Unchecked/Indeterminate** |
| 5 | Item Select | `UCheckbox` per item | Pilih item untuk checkout | **Checked/Unchecked** |
| 6 | Product Item | `ProductItemSmall` + `UInputNumber` + `UButton` delete | Tampilkan item. Ubah quantity → PUT /cart/:id. Delete → DELETE /cart/:id | **Normal:** item card; **Loading:** button loading |
| 7 | Empty State | `UIcon` + text | Jika cart kosong | **Visible:** cart empty |
| 8 | Voucher Card | `UCard` + `UBadge` | Tampilkan voucher terpilih. Klik → buka modal | **Applied:** show voucher + "Dipilih"; **None:** voucher promo text |
| 9 | Voucher Modal | `UModal` + `UInput` search + voucher list | Pilih voucher, search, clear | **Loading:** spinner; **Normal:** list; **Empty:** "Tidak ada" |
| 10 | Summary | Text | Subtotal, discounts, total | Normal |
| 11 | Checkout Button | `UButton` | Disabled jika tidak ada item selected. Klik → `/[store]/checkout?items=...` | **Disabled:** no items; **Enabled:** items selected |

#### 4. Flow

```
onMounted → getCart() + fetchPendingPaymentOrders() + getVouchers()
    ↓
User pilih item → selectedCartItemIds berubah
    ↓
Subtotal berubah → watcher → re-validate voucher terpilih
    ↓ (voucher invalid) → reset discountTotal = 0
    ↓ (voucher valid) → tetap

User klik Checkout
    ↓
navigateTo('/{store}/checkout?items=id1,id2&voucherId=xxx')
```

#### 5. Data

| Data | Source |
|------|--------|
| Cart items | `GET /cart` |
| Pending payments | `GET /orders?status=pending_payment` |
| Vouchers | `GET /voucher` |
| Voucher validation | `POST /voucher/validate` |
| Update quantity | `PUT /cart/:id` |
| Remove item | `DELETE /cart/:id` |
| Restore items | `POST /cart` (for expired orders) |

#### 6. Nuxt UI Components Used

`UButton`, `UCard`, `UIcon`, `UAlert`, `UCheckbox`, `ProductItemSmall`, `UInput`, `UBadge`, `UModal`

#### 7. Catatan untuk Designer

- **Voucher modal** adalah komponen overlay penting — perlu visual hierarchy jelas
- **Checkbox Select All** punya 3 state: checked, unchecked, indeterminate
- **Checkout button** disabled state perlu visual cue
- **Pending payment alert** sangat penting — jangan sampai terlewat
- **Expired restore** perlu konfirmasi visual

---

### 4.6 Checkout (`/[store]/checkout`)

**Route:** `/[store]/checkout`  
**Layout:** default  
**Auth:** requiresAuth  

#### 1. Deskripsi
Halaman checkout. User memilih alamat pengiriman, ekspedisi, dan melakukan pembayaran.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│ [← Back]                                               │
├────────────────────────────────────────────────────────┤
│ [⚠️ Pending Payment Alert] (conditional)                │
├──────────────────────┬─────────────────────────────────┤
│                      │                                  │
│  ┌─ Address ───────┐ │ ┌─ Summary ──────────────────┐  │
│  │ John Doe · 0812  │ │ │ Total Harga (2 items):    │  │
│  │ Jl. Merdeka No.1 │ │ │ Rp450.000                 │  │
│  │ Jakarta Pusat    │ │ │ ─────────────────────────  │  │
│  │ [Ubah Alamat →]  │ │ │ Expedition: [Pilih ▼]     │  │
│  └──────────────────┘ │ │ Ongkir: Rp15.000           │  │
│  ┌─ Items ─────────┐ │ │ ─────────────────────────  │  │
│  │ [ProductItemSm] │ │ │ Diskon Item: -Rp50.000     │  │
│  │ [ProductItemSm] │ │ │ Diskon Voucher: -Rp40.000  │  │
│  └──────────────────┘ │ │ ─────────────────────────  │  │
│                        │ │ [Pilih Rekening ▼]       │  │
│                        │ │   (if >Rp10jt)            │  │
│                        │ │ Total Bayar: Rp375.000    │  │
│                        │ │ ┌──────────────────────┐  │  │
│                        │ │ │ [✅ Bayar Sekarang]  │  │  │
│                        │ │ │ QRIS / Bank Transfer  │  │  │
│                        │ │ └──────────────────────┘  │  │
│                        │ └──────────────────────────┘  │
└────────────────────────┴─────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Perilaku |
|---|-------|----------|----------|
| 1 | Back Button | `UButton` | `router.back()` |
| 2 | Pending Payment Alert | `UAlert` | Sama seperti cart |
| 3 | Address Card | `UCard` + text | Tampilkan alamat terpilih (default: primary) |
| 4 | Address Modal | `UModal` + `SettingAddress` (selectable) | Pilih alamat lain |
| 5 | Items List | `ProductItemSmall` | Tampilkan item yang akan dibeli |
| 6 | Expedition Select | `UForm` + `UFormField` + `USelect` | Data dari `useExpedition(addressId)`. Wajib diisi |
| 7 | Bank Account Select | `USelect` (conditional) | Hanya jika total > Rp10.000.000 |
| 8 | Summary | Text | Total, discounts, voucher |
| 9 | Pay Button | `UButton` `i-lucide-circle-check` | Submit → `createCheckout()` → redirect ke payment |

#### 4. Flow

```
onMounted → getCart() + getAddresses() + getOrders({ status: 'pending_payment' })
    ↓
Auto-select primary address (default)
    ↓
Address change → getExpeditions(addressId)
    ↓
User pilih expedition
    ↓
User klik "Bayar Sekarang"
    ↓
1. Refresh pending payment orders
2. Restore expired orders ke cart
3. Validasi voucher (dari query param)
4. Cek bank transfer (if >10jt)
5. createCheckout({ expedition, address_id, cart_item_ids, voucher_id, bank_account_number, bank_account_type })
    ↓ success → navigateTo('/{store}/checkout/payment?orderId=xxx')
    ↓ error → toast, stay
```

#### 5. Validation (Zod)

```typescript
z.object({ expedition: z.string().min(1, 'Ekspedisi wajib dipilih') })
// Bank account validated imperatively (not in Zod)
```

#### 6. Data

| Data | Source |
|------|--------|
| Cart | `GET /cart` |
| Addresses | `GET /address` |
| Pending orders | `GET /orders?status=pending_payment` |
| Expeditions | `GET /ekspedisi?address_id=...` |
| Voucher validation | `POST /voucher/validate` |
| Create checkout | `POST /checkout` |

#### 7. Nuxt UI Components Used

`UButton`, `UAlert`, `UCard`, `UModal`, `SettingAddress`, `ProductItemSmall`, `UIcon`, `UForm`, `UFormField`, `USelect`

#### 8. Catatan untuk Designer

- **Bank Account Select** berubah dari hidden ke visible saat total > Rp10jt — perlu transisi
- **Expedition** tidak bisa dipilih sebelum address ditentukan
- **Submit** melakukan beberapa operasi berurutan — loading state penting

---

### 4.7 Payment (`/[store]/checkout/payment`)

**Route:** `/[store]/checkout/payment`  
**Layout:** default  
**Auth:** requiresAuth  

#### 1. Deskripsi
Halaman instruksi pembayaran. Menampilkan metode QRIS atau Bank Transfer dengan countdown timer.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│ [← Back]                                               │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [Badge: Menunggu Pembayaran] [Badge: QRIS]            │
│  ⏱ Batas pembayaran: 14:20                             │
│                                                         │
│  ┌─ Address ───────────────────────────────────────┐   │
│  │ John Doe · 0812 · Jl. Merdeka No.1             │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Items ─────────────────────────────────────────┐   │
│  │ [Product] × 2 = Rp200.000                       │   │
│  │ [Product] × 1 = Rp150.000                       │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Payment Method ───────────────────────────────┐   │
│  │                                                  │   │
│  │  [QRIS]                                          │   │
│  │  ┌──────────────────┐                            │   │
│  │  │   QR IMAGE       │  [Download]               │   │
│  │  └──────────────────┘                            │   │
│  │                                                  │   │
│  │  [ATAU]                                          │   │
│  │  [BANK TRANSFER]                                 │   │
│  │  ┌──────────────────┐                            │   │
│  │  │ BCA              │                            │   │
│  │  │ 1234567890       │                            │   │
│  │  │ a.n. PT XYZ      │                            │   │
│  │  └──────────────────┘                            │   │
│  │                                                  │   │
│  │  Total Pembayaran: Rp375.000                     │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Cara Pembayaran QRIS ─────────────────────────┐   │
│  │ 1. Buka aplikasi pembayaran                    │   │
│  │ 2. Pilih menu Scan QR                          │   │
│  │ 3. Scan QR code di atas                        │   │
│  │ 4. Periksa nominal                             │   │
│  │ 5. Masukkan PIN                                │   │
│  │ 6. Konfirmasi pembayaran                       │   │
│  │ 7. Screenshot bukti transfer                   │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
├────────────────────────────────────────────────────────┤
│ [FOOTER]                                                │
└────────────────────────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Perilaku | State |
|---|-------|----------|----------|-------|
| 1 | Address Card | `UCard` | Info penerima + alamat | Normal |
| 2 | Items Card | `UCard` + `ProductItemSmall` | Daftar produk | Normal |
| 3 | Payment Method Badge | `UBadge` | "QRIS" (primary) / "Bank Transfer" (secondary) | Normal |
| 4 | QRIS Image | `NuxtImg` | Jika payment method = qris | Normal |
| 5 | Download QRIS | `UButton` `i-lucide-download` | Trigger download file | Normal |
| 6 | Bank Account | `UCard` | Nama bank + nomor rekening | Normal |
| 7 | Countdown Timer | Timer display | Hitung mundur dari `payment_expired_at`, update per detik | **Running:** MM:SS; **Expired:** 00:00 |
| 8 | Total Bill | Text | Total pembayaran | Normal |
| 9 | Instructions | Ordered list | QRIS: 7 langkah. BT: 3 langkah | Normal |
| 10 | Auto-expiry | Watcher | Timer = 0 → restore items → redirect /cart | **Normal:** countdown; **Expired:** redirect |
| 11 | QRIS Status Polling | `UBadge` + interval | Polling `GET /payment/qris/:invoice/check` setiap 5 detik | **Pending:** badge kuning; **Paid:** redirect success; **Expired:** redirect cart |

#### 4. Flow

```
onMounted → getPaymentInfo(orderId)
    ↓
if paymentInfo null:
    ↓ expiredItems exist → restore to cart → redirect /cart
    ↓ no items → redirect /checkout/history

if paymentInfo exists:
    ↓ startTimer()
    ↓ update setiap 1 detik
    ↓ if QRIS:
        ↓ startQrisPolling()
        ↓ GET /payment/qris/:invoice/check setiap 5 detik
        ↓ Status = "paid" → stop polling → redirect /checkout/payment/success
        ↓ Status = "expired" → stop polling → onPaymentExpired()

Timer reaches 0:
    ↓ onPaymentExpired()
    ↓ POST /cart untuk setiap item
    ↓ tracking via restoredExpiredOrderIds
    ↓ warning toast
    ↓ redirect /cart
```

#### 5. Payment Methods Detail

| Aspek | QRIS | Bank Transfer |
|-------|------|---------------|
| Trigger | Default (total ≤ Rp10jt) | Total > Rp10jt |
| Tampilan | QR image + download button | Bank name + account number |
| Download | Anchor download (blob) | - |
| Steps | 7 langkah | 3 langkah |

#### 6. Data

**PaymentInfo response:**
```typescript
{
  order_id: string
  payment_method: 'qris' | 'bank_transfer'
  payment_bank_account: {
    bank_account_id?: string      // Auto-generated by server
    bank_name: string
    account_number: string
    account_name?: string        // Auto-generated by server
  } | null
  items: OrderItem[]
  address: string
  expedition: { name, cost }
  subtotal: number
  total: number
  qris_billing: {
    invoice_number: string
    qr_code: string      // Raw QR string, rendered via QR Code generator
    qris_expires_at: string
  } | null
  payment_expired_at: string | null
}
```

#### 7. Nuxt UI Components Used

`UCard`, `UBadge`, `NuxtImg`, `UButton`, `UIcon`, `ProductItemSmall`

---

### 4.8 Payment Success (`/[store]/checkout/payment/success`)

**Route:** `/[store]/checkout/payment/success`  
**Layout:** default  
**Auth:** requiresAuth  

#### 1. Deskripsi
Halaman konfirmasi pembayaran berhasil.

#### 2. Struktur Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│        [🎉 Badge Success]                   │
│                                             │
│        Pembayaran Berhasil                  │
│   Terima kasih, pesanan Anda sedang         │
│   diproses                                  │
│                                             │
│  [🏠 Kembali ke Beranda]                    │
│  [📄 Lihat Riwayat Pesanan]                 │
│                                             │
│  ┌─ Items ─────────────────────────┐        │
│  │ [Product] × 2                  │        │
│  │ [Product] × 1                  │        │
│  └────────────────────────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

#### 3. Fitur

| # | Fitur | Perilaku |
|---|-------|----------|
| 1 | Success Badge | `UBadge` rounded-full, icon party-popper |
| 2 | Title | "Pembayaran Berhasil" |
| 3 | Home Link | `/[store]` |
| 4 | History Link | `/[store]/checkout/history` |
| 5 | Items Card | Daftar produk yang dibeli |

#### 4. Data

`GET /orders/:orderId`

#### 5. Nuxt UI Components Used

`UBadge`, `UIcon`, `ULink`, `UCard`

---

### 4.9 Order History (`/[store]/checkout/history`)

**Route:** `/[store]/checkout/history`  
**Layout:** default  
**Auth:** requiresAuth  

#### 1. Deskripsi
Halaman riwayat pesanan dengan search, pagination, dan tracking.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│  Riwayat Pesanan             [Tampil: 10 ▼]            │
│  [🔍 Search pesanan...]                                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [⚠️ Pending Payment Order — Bayar sebelum 10:30]      │
│  [Lanjutkan Pembayaran →]                              │
│                                                         │
│  ┌─ Pesanan Lalu ───────────────────────────────────┐  │
│  │                                                    │  │
│  │  12 Apr 2026 • TRX-A1B2C3D4                       │  │
│  │  [✅ Selesai] [QRIS]                              │  │
│  │  [Product] × 2  [+1 lainnya]   [📦 Lacak]       │  │
│  │  ───────────────────────────────────────────────  │  │
│  │  11 Apr 2026 • TRX-E5F6G7H8                       │  │
│  │  [📦 Dikirim] [Bank Transfer]                     │  │
│  │  [Product] × 1                     [📦 Lacak]     │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  [◄ 1 2 3 ... ►]                                       │
│                                                         │
├────────────────────────────────────────────────────────┤
│ [FOOTER]                                                │
└────────────────────────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Perilaku | State |
|---|-------|----------|----------|-------|
| 1 | Page Title | Text | "Riwayat Pesanan" | Normal |
| 2 | Page Size | `USelect` | 5/10/20/50/100 | Normal |
| 3 | Search | `UInput` | 500ms debounce, clearable | Normal |
| 4 | Pending Order Card | `UCard` + timer | Order dengan status `pending_payment`. Countdown, continue button | **Visible:** ada pending; **Hidden:** none |
| 5 | Past Orders List | `UCard` + `ProductItemSmall` | List per item (first item + otherItemsCount) | **Normal:** list; **Empty:** icon + "Belum ada" |
| 6 | Status Badge | `UBadge` | Color: warning/neutral/primary/success/error | Normal |
| 7 | Payment Badge | `UBadge` | "QRIS" / "Bank Transfer" | Normal |
| 8 | Track Button | `UButton` | Desktop: modal. Mobile: bottom sheet | Normal |
| 9 | Pagination | `UPagination` | Navigasi halaman | Normal |

#### 4. Flow

```
Page load:
  getOrders({ page: 1, limit: 5 })

Search:
  searchQuery → 500ms debounce → getOrders({ search, page: 1 })

Page change:
  currentPage → getOrders({ page, limit })

Track button:
  Desktop → UModal with TransactionTracking
  Mobile → bottom sheet with TransactionTracking
```

#### 5. Data

`GET /orders?page=...&limit=...&search=...`

#### 6. Nuxt UI Components Used

`USelect`, `UInput`, `UCard`, `UButton`, `UIcon`, `UPagination`, `ProductItemSmall`, `TransactionTracking`

---

### 4.10 Order Detail (`/[store]/checkout/history/[id]`)

**Route:** `/[store]/checkout/history/:id`  
**Layout:** default  
**Auth:** requiresAuth  

#### 1. Deskripsi
Halaman detail pesanan dengan review produk, konfirmasi selesai, dan tracking.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│ [← Kembali]                                            │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Order: TRX-A1B2C3D4    [✅ Selesai] [QRIS]           │
│                                                         │
│  ┌──────────────────────┐ ┌─ Payment Summary ───────┐  │
│  │ Tanggal: 12 Apr 2026 │ │ Subtotal: Rp450.000    │  │
│  │ Ekspedisi: JNE REG   │ │ Diskon: -Rp90.000      │  │
│  │ Pembayaran: QRIS     │ │ Total: Rp360.000       │  │
│  │ Alamat: John, Jl...  │ │ Voucher: PROMO10       │  │
│  │ Rekening: BCA 1234   │ └────────────────────────┘  │
│  └──────────────────────┘                              │
│                                                         │
│  ┌─ Products ──────────────────────────────────────┐  │
│  │ [Image] Product A  [Variant] [Color]  ×2 RpX   │  │
│  │    ⭐⭐⭐⭐⭐ "Bagus banget!" [Submitted]          │  │
│  │ ───────────────────────────────────────────────  │  │
│  │ [Image] Product B                      ×1 RpX   │  │
│  │    ⭐⭐⭐⭐☆ "Mantap" [Submitted]                  │  │
│  └────────────────────────────────────────────────┘  │
│                                                         │
│  [✅ Pesanan Diterima]  (jika status delivered)        │
│                                                         │
│  ┌─ Tracking ───────────────────────────────────────┐  │
│  │ 📦 JNE REG — RESI: JKTEESR3412341 [📋 Copy]     │  │
│  │                                                   │  │
│  │ ● 12 Apr — Paket diterima                        │  │
│  │ ● 11 Apr — Paket sampai di kota tujuan            │  │
│  │ ● 10 Apr — Paket dikirim                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
├────────────────────────────────────────────────────────┤
│ [FOOTER]                                                │
└────────────────────────────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen | Perilaku | State |
|---|-------|----------|----------|-------|
| 1 | Back Button | `UButton` | → `/checkout/history` | Normal |
| 2 | Order Info Header | `UBadge` (×2) | Order ID + status badge + payment badge | Normal |
| 3 | Detail Grid | Text | Date, expedition, payment, address, bank account | Normal |
| 4 | Product List | `UCard` + `NuxtImg` + `UBadge` | Per product: image, title, variant/color, quantity, price | Normal |
| 5 | Review Per Product | Star rating (1-5) + `UTextarea` (5-500 chars) + `UButton` submit | **Not submitted:** form; **Submitted:** read-only; **Disabled:** rating < 1 or review < 5 chars |
| 6 | Confirm Finished | `ModalConfirm` | Jika status `delivered`. Klik → `POST /orders/:id/finish` | **Visible:** delivered; **Hidden:** other status |
| 7 | Payment Summary | `UCard` | Subtotal, discount, total, voucher | Normal |
| 8 | Tracking Card | `TransactionTracking` | Jika status shipped/delivered/finished | **Visible:** eligible; **Hidden:** other |

#### 4. Flow

```
Page load → getOrderDetail(orderId)
    ↓
if status = 'delivered' → tampilkan confirm button
if status = 'shipped' | 'delivered' | 'finished' → tampilkan tracking

User submit review:
  → POST /orders/:id/review { product_id, rating, review }
  → success → disable form, tampilkan submitted state

User confirm finished:
  → ModalConfirm → POST /orders/:id/finish
  → success → reload order detail
```

#### 5. Data

| Data | Source |
|------|--------|
| Order detail | `GET /orders/:id` |
| Submit review | `POST /orders/:id/review` |
| Confirm finish | `POST /orders/:id/finish` |

#### 6. Nuxt UI Components Used

`UButton`, `UCard`, `UBadge`, `UAlert`, `NuxtImg`, `UIcon`, `UTextarea`, `ModalConfirm`, `TransactionTracking`

---

### 4.11 Login (`/[store]/auth/login`)

**Route:** `/[store]/auth/login`  
**Layout:** auth  
**Auth:** guestOnly  

#### 1. Deskripsi
Halaman login dengan form username/password dan Google OAuth.

#### 2. Struktur Layout

```
┌──────────────────────────────────┐
│  [🌐 ID] (top-right)            │
│                                   │
│       [STORE LOGO]               │
│                                   │
│  ┌──────────────────────────┐    │
│  │       Masuk              │    │
│  │                          │    │
│  │ Username                 │    │
│  │ [________________]       │    │
│  │                          │    │
│  │ Password                 │    │
│  │ [________] [👁️]         │    │
│  │                          │    │
│  │     Lupa Password?       │    │
│  │                          │    │
│  │ [──── Masuk ────]        │    │
│  │                          │    │
│  │ ─── atau ───             │    │
│  │ [Google Login Button]    │    │
│  │                          │    │
│  │ Belum punya akun? Daftar │    │
│  └──────────────────────────┘    │
│                                   │
│  [FOOTER]                         │
└──────────────────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Komponen |
|---|-------|----------|
| 1 | Title | Text "Masuk" |
| 2 | Username Input | `UInput` |
| 3 | Password Input | `UInput` + show/hide toggle (`i-lucide-eye`) |
| 4 | Forgot Password Link | `ULink` → `/auth/forgot-password` |
| 5 | Submit Button | `UButton` "Masuk", loading state |
| 6 | Google Login | `GoogleLoginButton` (ClientOnly) |
| 7 | Register Link | `ULink` → `/auth/register` |

#### 4. Flow

```
Submit form:
  authStore.login(username, password, redirectTo)
    → POST /auth/login
    → success → fetchUser() → navigateTo(redirectTo)
    → error → toast

Google login:
  onGoogleSuccess(payload)
    → authStore.loginWithGoogle({ credential })
    → POST /auth/google
    → success → fetchUser() → navigateTo(redirectTo)
    → error → toast
```

#### 5. Data

`POST /auth/login` (username, password)  
`POST /auth/google` (credential)

#### 6. Nuxt UI Components Used

`UCard`, `UForm`, `UFormField`, `UInput` (×2), `UButton` (×2), `ULink` (×2)

---

### 4.12 Register (`/[store]/auth/register`)

**Route:** `/[store]/auth/register`  
**Layout:** auth  
**Auth:** guestOnly  

#### 1. Deskripsi
Halaman pendaftaran akun baru.

#### 2. Struktur Layout

```
┌──────────────────────────────────┐
│       [STORE LOGO]              │
│                                   │
│  ┌──────────────────────────┐    │
│  │       Daftar             │    │
│  │                          │    │
│  │ Nama Lengkap   [_____]   │    │
│  │ No. Telepon    [_____]   │    │
│  │ Username       [_____]   │    │
│  │                          │    │
│  │ Email          [_____]   │    │
│  │ Password       [___][👁️] │    │
│  │ Konfirmasi PW  [___][👁️] │    │
│  │                          │    │
│  │ [──── Daftar ────]       │    │
│  │                          │    │
│  │ Sudah punya akun? Masuk  │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

#### 3. Fitur

| # | Fitur | Komponen |
|---|-------|----------|
| 1 | Title | "Daftar" |
| 2 | Form Fields (6) | `UFormField` + `UInput`: Full Name, Phone, Username, Email, Password, Confirm Password |
| 3 | Password Toggle | Show/hide per field |
| 4 | Submit Button | `UButton` "Daftar" |
| 5 | Login Link | `ULink` → `/auth/login` |

#### 4. Validation (Zod)

`buildRegisterSchema(t)`: username min, email format, password min length, confirm match

#### 5. Flow

```
Submit → authStore.register(full_name, phone, username, email, password)
  → POST /auth/register
  → success → toast → navigateTo('/{store}/auth/login')
  → error → toast
```

#### 6. Nuxt UI Components Used

`UCard`, `UForm`, `UFormField` (×6), `UInput` (×6), `UButton`, `ULink`

---

### 4.13 Forgot Password (`/[store]/auth/forgot-password`)

**Route:** `/[store]/auth/forgot-password`  
**Layout:** auth  
**Auth:** guestOnly  

#### 1. Deskripsi
4-step wizard untuk reset password: Request OTP → Verify OTP → Password Baru → Sukses.

#### 2. Struktur Layout (4 Steps)

```
Step 1 [request]:       Step 2 [otp]:          Step 3 [verify]:        Step 4 [success]:
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Lupa Password   │    │  Lupa Password   │    │  Lupa Password   │    │                 │
│                  │    │                  │    │                  │    │    ✅ Berhasil   │
│  Email           │    │  Kode OTP:       │    │  Password Baru   │    │                 │
│  [______]        │    │  [○][○][○][○][○] │    │  [______] [👁️]   │    │ Password berhasil│
│                  │    │                  │    │  Konfirmasi      │    │ direset          │
│  [Kirim OTP]     │    │  Kirim ulang     │    │  [______] [👁️]   │    │                 │
│                  │    │  dalam 60s       │    │                  │    │ [Kembali Login] │
│  ← Login         │    │  [Verifikasi]    │    │  [Reset Password]│    │                 │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

#### 3. Detail Setiap Step

| Step | Input | API | Validasi |
|------|-------|-----|----------|
| request | Email | `POST /auth/forgot-password` | Email format |
| otp | 5-digit PIN (`UPinInput`) | `POST /auth/verify-otp` | 5 digits |
| verify | New Password + Confirm | `POST /auth/reset-password` | Min length, match |
| success | - | - | - |

#### 4. Flow

```
Step 1: Email → sendOtp(email) → POST /auth/forgot-password
  → success → currentStep = 'otp', startResendTimer(60s)

Step 2: OTP (5 digits) → verifyOtp(email, otp) → POST /auth/verify-otp
  → success → currentStep = 'verify'
  → error → toast
  → Resend → sendOtp(email) → reset timer

Step 3: Password + Confirm → resetPassword(email, new_password) → POST /auth/reset-password
  → success → currentStep = 'success'
  → error → toast

Step 4: Show success → "Kembali ke Login" → /auth/login
```

#### 5. Nuxt UI Components Used

`UCard`, `UForm`, `UFormField`, `UInput`, `UPinInput`, `UButton`, `ULink`, `UIcon`

---

### 4.14 Settings (`/[store]/setting`)

**Route:** `/[store]/setting`  
**Layout:** default  
**Auth:** Public (guest-friendly)  

#### 1. Deskripsi
Halaman pengaturan user. Mendukung dua state:
- **Authenticated:** Profile card, 2 tab (Biodata & Keamanan, Daftar Alamat), Logout section
- **Guest:** UI khusus dengan icon, deskripsi, dan button login

**Guest State Layout:**
```
┌──────────────────────────────────────────┐
│  Pengaturan                              │
│                                          │
│  ┌─ Guest Card ────────────────────────┐ │
│  │                                     │ │
│  │         [👤]                        │ │
│  │                                     │ │
│  │   Masuk untuk Melanjutkan          │ │
│  │   Silakan masuk ke akun Anda...    │ │
│  │                                     │ │
│  │   [🔐 Masuk ke Akun]               │ │
│  │                                     │ │
│  │   Belum punya akun? Daftar sekarang│ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                          │
├──────────────────────────────────────────┤
│ [FOOTER]                                 │
└──────────────────────────────────────────┘
```

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│  Pengaturan                                            │
│                                                         │
│  ┌─ User Profile Card ──────────────────────────────┐  │
│  │ [A] John Doe                                      │  │
│  │ john@email.com                                    │  │
│  │ [Reseller ✓] · 0812...                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [Biodata & Keamanan]  [Daftar Alamat]                 │
│                        (UTabs)                          │
├────────────────────────────────────────────────────────┤
│                                                         │
│  TAB 1: Biodata & Keamanan                             │
│  ┌────────────────────────────────────────────────┐    │
│  │ [Badge: Reseller] Terdaftar sejak 12 Jan 2025  │    │
│  │                                                  │    │
│  │ Nama Lengkap   [________________]               │    │
│  │ No. Telepon    [________________]               │    │
│  │ Email          [________________]  (disabled    │    │
│  │                               if Google auth)  │    │
│  │ Username       [________________]               │    │
│  │                                                  │    │
│  │ ── Ubah Password ── (hidden if Google auth)     │    │
│  │ Password Lama  [________] [👁️]                  │    │
│  │ Password Baru  [________] [👁️]                  │    │
│  │ Konfirmasi     [________] [👁️]                  │    │
│  │                                                  │    │
│  │ [Simpan]                                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  TAB 2: Daftar Alamat                                  │
│  ┌─ Address List ──────────────────────────────────┐   │
│  │ [UCard] John Doe · 0812 [Utama]                 │   │
│  │         Jl. Merdeka No.1, Jakarta               │   │
│  │         [Jadikan Utama] [✏️] [🗑️]              │   │
│  │                                                  │   │
│  │ [UCard] Budi · 0813                             │   │
│  │         Jl. Sudirman No.5, Bandung              │   │
│  │         [Jadikan Utama] [✏️] [🗑️]              │   │
│  └──────────────────────────────────────────────────┘  │
│  [Map Picker] + [Address Form] (add new)               │
│                                                         │
│  ┌─ Logout Section ─────────────────────────────────┐  │
│  │ 🚪 Keluar Akun                                   │  │
│  │ Keluar dari sesi login saat ini                  │  │
│  │                                    [→]           │  │
│  └───────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────┤
│ [FOOTER]                                                │
└────────────────────────────────────────────────────────┘
```

#### 3. Daftar Fitur

**Guest State** (Tampil saat belum login)

| # | Fitur | Komponen | Perilaku |
|---|-------|----------|----------|
| 1 | Guest Icon | `UIcon` | User icon di rounded container |
| 2 | Guest Title | Text | "Masuk untuk Melanjutkan" |
| 3 | Guest Description | Text | Penjelasan benefit login |
| 4 | Login Button | `UButton` | Navigate ke `/auth/login` |
| 5 | Register Link | `NuxtLink` | Navigate ke `/auth/register` |

**Authenticated State**

**User Profile Card** (Di atas tabs)

| # | Fitur | Komponen | Perilaku |
|---|-------|----------|----------|
| 6 | User Avatar | `UAvatar` | Initial dari nama user, ring border |
| 7 | User Info | Text | Nama lengkap, email, phone number |
| 8 | Role Badge | `UBadge` | "Reseller" / "Dealer" dengan check icon |

**Tab 1: Biodata & Keamanan**

| # | Fitur | Komponen | Perilaku |
|---|-------|----------|----------|
| 9 | Badge Role | `UBadge` | "Reseller" / "Dealer" jika applicable |
| 10 | Biodata Form | `UForm` + `UFormField` + `UInput` | Full Name, Phone, Email, Username |
| 11 | Email Disabled | `UInput disabled` | Jika auth provider = google |
| 12 | Password Section | Hidden jika Google auth | Old, New, Confirm |
| 13 | Save Button | `UButton` | `updateProfile()` + optional `changePassword()` |

**Tab 2: Daftar Alamat**

| # | Fitur | Komponen | Perilaku |
|---|-------|----------|----------|
| 14 | Address List | `SettingAddressList` (`UCard` per item) | List + primary badge + actions |
| 15 | Make Primary | `UButton` | `updateAddress(id, { is_primary: true })` |
| 16 | Edit Address | `UButton` | Buka modal form update |
| 17 | Delete Address | `UButton` | `deleteAddress(id)` |
| 18 | Add Address Form | `SettingAddressForm` + `SettingAddressMapPicker` | UForm + Leaflet map |
| 19 | Map Picker | Leaflet + Nominatim reverse geocode | Klik map → pin → autofill region |

**Logout Section** (Di bawah tabs)

| # | Fitur | Komponen | Perilaku |
|---|-------|----------|----------|
| 20 | Logout Card | `UCard` gradient | Gradient error background, decorative icon |
| 21 | Logout Button | `UButton` | Buka konfirmasi modal |
| 22 | Confirm Modal | `ModalConfirm` | Konfirmasi sebelum logout |

#### 4. Flow

**Guest State:**
```
User buka /setting (belum login)
  → isAuthenticated = false
  → Tampilkan Guest UI (icon + title + description + login button)

User klik "Masuk ke Akun"
  → navigateTo('/auth/login')
  → Setelah login sukses → redirect ke /setting
  → isAuthenticated = true
  → Tampilkan full setting page
```

**Authenticated State:**
```
Tab 1: Save
  → updateProfile({ full_name, phone_number, email, username })
  → if old_password filled: changePassword({ old_password, new_password })
  → success → toast

Tab 2: Add Address
  → Form submit → createAddress(formData)
  → success → reset form

Tab 2: Edit Address
  → Modal → updateAddress(id, formData)
  → success → close modal

Tab 2: Delete
  → deleteAddress(id)
  → success → remove from list
```

#### 5. API Calls

`GET /me`, `PUT /me`, `PUT /me/password`, `GET /address`, `POST /address`, `PUT /address/:id`, `DELETE /address/:id`, `GET /regions/provinces`, `/cities`, `/districts`, `/subdistricts`

#### 6. Nuxt UI Components Used

`UTabs`, `UForm`, `UBadge`, `UFormField`, `UInput`, `UButton`, `SettingAddressList`, `SettingAddressForm`, `SettingAddressMapPicker`

---

### 4.15 PC Builder — Simasko (`/[store]/simasko/rakit-komputer`)

**Route:** `/[store]/simasko/rakit-komputer`  
**Layout:** default  
**Auth:** requiresAuth  
**Feature Flag:** `storeProfile.config.schema.includes('SIMASKO')`

#### 1. Deskripsi
Tools untuk merakit PC dengan panduan kompatibilitas dan estimasi daya. Khusus untuk store dengan fitur Simasko diaktifkan.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│ [← Kembali]                                            │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [Header Card]                                          │
│  ⚡ SIMASKO BUILDER                                     │
│  Rakit Komputer Impian Anda                             │
│  ┌──────────┐ ┌──────────┐                             │
│  │ Items: 5 │ │ Daya: 350W│    [████████░░] 5/7       │
│  └──────────┘ └──────────┘                             │
│                                                         │
│  ┌─ Category Cards ────────────────────────┐ ┌─ Summary ┐│
│  │                                          │ │ Items   ││
│  │ [CPU] Processor (CPU) [Wajib]           │ │ - CPU A ││
│  │  [Search and select product... ▼]       │ │ - Mobo B││
│  │  [Selected: Intel i5-13400F]  qty[1][🗑]│ │ - RAM C ││
│  │                                          │ │ ...     ││
│  │ [Mobo] Motherboard [Wajib]              │ │ ─────── ││
│  │  [Search and select product... ▼]       │ │ Daya    ││
│  │  [Selected: ASUS B760M]     qty[1][🗑]  │ │ Estimasi ││
│  │                                          │ │ Recom.  ││
│  │ [RAM] RAM [Wajib] [Multi]               │ │ Terpilih││
│  │  [Search and select product... ▼]       │ │ ─────── ││
│  │  [Selected: DDR5 16GB] ×2  qty[1][🗑]  │ │ ⚠️ CPU   ││
│  │  [Selected: DDR5 16GB] ×2  qty[1][🗑]  │ │   & Mobo ││
│  │                                          │ │   OK ✅ ││
│  │ ... (11 categories total)               │ │ ─────── ││
│  │                                          │ │ Total:  ││
│  │                                          │ │ Rp15jt  ││
│  │                                          │ │ ─────── ││
│  │                                          │ │ [Add to ││
│  │                                          │ │  Cart]  ││
│  │                                          │ │ [Reset] ││
│  └──────────────────────────────────────────┘ └─────────┘│
│                                                         │
├────────────────────────────────────────────────────────┤
│ [FOOTER]                                                │
└────────────────────────────────────────────────────────┘
```

#### 3. 11 Kategori Komponen

| # | Kategori | Required | Multi | Ikon |
|---|----------|----------|-------|------|
| 1 | Processor (CPU) | ✅ | ❌ | `cpu` |
| 2 | Motherboard | ✅ | ❌ | `circuit-board` |
| 3 | RAM | ✅ | ✅ | `memory-stick` |
| 4 | Storage (SSD/HDD) | ✅ | ✅ | `hard-drive` |
| 5 | Power Supply (PSU) | ✅ | ❌ | `plug-zap` |
| 6 | Graphic Card (VGA) | ❌ | ❌ | `monitor-cog` |
| 7 | CPU Cooler | ❌ | ✅ | `fan` |
| 8 | Casing | ✅ | ❌ | `pc-case` |
| 9 | Monitor | ❌ | ✅ | `monitor` |
| 10 | Keyboard | ❌ | ✅ | `keyboard` |
| 11 | Mouse | ❌ | ✅ | `mouse` |

#### 4. Daftar Fitur

| # | Fitur | Perilaku |
|---|-------|----------|
| 1 | Header Card | Summary stats: selected items, estimated power, progress bar |
| 2 | Category Cards | 11 cards — icon, label, required/optional badge |
| 3 | Product Selector | `USelectMenu` searchable — pilih produk per kategori |
| 4 | Smart Suggestions | Filter by platform (Intel/AMD), RAM gen (DDR4/5), PSU wattage |
| 5 | Multi-product | Kategori tertentu bisa tambah multiple items (RAM, Storage, dll) |
| 6 | Quantity Management | `UInputNumber` per selected item |
| 7 | Compatibility Analysis | CPU-Mobo platform match, RAM-Mobo gen match, PSU watt adequacy |
| 8 | Power Estimation | Hardcoded watt per category, sum + 30% headroom |
| 9 | Summary Sidebar | Selected items, power info, compatibility alerts, total price |
| 10 | Add to Cart | `Promise.allSettled` — add semua items, partial failure handling |
| 11 | Reset All | Clear all selections |

#### 5. Flow

```
onMounted → loadProducts() (fetch all products with pagination)
    ↓
matchCategory() → auto-classify products into 11 categories
    ↓
User select product → addProductToCategory(categoryKey, productId)
    ↓
Smart suggestions update → filter available options
Compatibility updates → recalculate issues
Power estimation updates → recalculate
    ↓
User click "Add All to Cart" → addBuildToCart()
    → Promise.allSettled (POST /cart per item)
    → success → navigate /cart
    → partial → warning toast
    → fail → error toast
```

#### 6. Compatibility Checks

```
CPU Platform (Intel/AMD) vs Motherboard Platform → mismatch warning
Motherboard RAM Gen (DDR4/5) vs RAM Gen → mismatch warning
PSU Watt vs Recommended Watt (estimated × 1.3) → insufficient warning
```

#### 7. Power Estimation

| Komponen | Watt |
|----------|------|
| Processor | 95W |
| Motherboard | 60W |
| RAM | 12W |
| Storage | 8W |
| VGA | 180W |
| Cooler | 10W |
| Case | 10W |
| Monitor | 40W |
| Keyboard | 5W |
| Mouse | 3W |

Recommended PSU = Estimated × 1.3, rounded up to nearest 50W

#### 8. Nuxt UI Components Used

`UButton`, `UCard`, `UIcon`, `UBadge`, `UProgress`, `USelectMenu`, `NuxtImg`, `UInputNumber`, `UAlert`

---

### 4.16 About (`/[store]/about`)

**Route:** `/[store]/about`  
**Layout:** default  
**Auth:** Public  

#### 1. Deskripsi
Halaman informasi toko.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────────────────┐
│ [HEADER]                                                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [Hero Section — bg-primary-50]                        │
│  ┌─────────────────────┐  ┌────────────────────────┐  │
│  │ [STORE LOGO]        │  │ [FB] [IG] [YT]        │  │
│  │ Nama Toko           │  │ [Info] [Privacy] [TOS] │  │
│  └─────────────────────┘  └────────────────────────┘  │
│                                                         │
│  ┌─ Description Card ─┐ ┌─ Info Cards ────────────┐  │
│  │                    │ │                          │  │
│  │  Tentang Toko      │ │ 📍 Alamat:              │  │
│  │  Deskripsi...      │ │    Jl. Merdeka No.1     │  │
│  │                    │ │                          │  │
│  │                    │ │ 📞 Kontak: 0812-xxxx    │  │
│  │                    │ │                          │  │
│  │                    │ │ 🕐 Jam Operasional:     │  │
│  │                    │ │    Sen-Jum 08:00-17:00  │  │
│  └────────────────────┘ └──────────────────────────┘  │
│                                                         │
├────────────────────────────────────────────────────────┤
│ [FOOTER]                                                │
└────────────────────────────────────────────────────────┘
```

#### 3. Fitur

| # | Fitur | Komponen |
|---|-------|----------|
| 1 | Hero Section | Logo + store name |
| 2 | Social Buttons | `UButton` circular — FB/IG/YT |
| 3 | Info Links | `UButton` — About, Privacy, Terms |
| 4 | Description Card | `UCard` — store about (v-html) |
| 5 | Address Card | `UCard` — address |
| 6 | Contact Card | `UCard` — phone number |
| 7 | Hours Card | `UCard` — operating hours (v-html) |

#### 4. Data

`useStoreProfile()` → `storeProfile.value` (name, logo_url, about, address, phone_number, operating_hours, social_links)

#### 5. Nuxt UI Components Used

`NuxtImg`, `IconsEcommerceLogo`, `UButton`, `UIcon`, `UCard`

---

### 4.17 404 (`/404`)

**Route:** `/404`  
**Layout:** default  
**Auth:** Public  

#### 1. Deskripsi
Halaman tidak ditemukan.

#### 2. Struktur Layout

```
┌────────────────────────────────────────────┐
│                                            │
│              404                            │
│        [gradient from-primary]              │
│                                            │
│           🔭 (telescope)                   │
│                                            │
│       Halaman Tidak Ditemukan              │
│  Halaman yang Anda cari tidak tersedia     │
│                                            │
│     [← Kembali ke Beranda]                 │
│                                            │
└────────────────────────────────────────────┘
```

#### 3. Fitur

| # | Fitur | Komponen |
|---|-------|----------|
| 1 | 404 Number | Gradient text `from-primary-500 to-primary-700 bg-clip-text` |
| 2 | Empty State | `UEmpty` icon telescope |
| 3 | Title | "Halaman Tidak Ditemukan" |
| 4 | Description | "Halaman yang Anda cari tidak tersedia atau telah dipindahkan" |
| 5 | CTA Button | `UButton` "Kembali ke Beranda" → `/[store]` |

#### 4. Nuxt UI Components Used

`UIcon`, `UButton`, `UEmpty`

---

### 4.18 ChatBot (Global Overlay)

**Komponen:** `ChatBot.vue`  
**Letak:** `app/app.vue` — global, muncul di semua halaman  
**Auth:** Public  

#### 1. Deskripsi
AI product assistant dalam bentuk floating chat bubble. Melayani pertanyaan tentang produk menggunakan keyword matching.

#### 2. Struktur Layout (Closed → Open)

```
[Closed State]                    [Open State]
                                  ┌──────────────────────┐
                                  │ 🤖 Assistant 🟢     │
      [Online]                    │  [🔄] [✕]           │
       ┌──────┐                   ├──────────────────────┤
       │  💬  │                   │                      │
       │  AI  │                   │  [Welcome screen     │
       └──────┘                   │   with quick prompts] │
                                  │                      │
                                  │  [Messages area]     │
                                  │  ┌──────────┐       │
                                  │  │ User msg  │       │
                                  │  └──────────┘       │
                                  │  ┌──────────────┐   │
                                  │  │  AI response  │   │
                                  │  └──────────────┘   │
                                  │                      │
                                  ├──────────────────────┤
                                  │ [Image previews]     │
                                  │ [Write message...][📎]│
                                  │     [➤]              │
                                  └──────────────────────┘
```

#### 3. Daftar Fitur

| # | Fitur | Perilaku |
|---|-------|----------|
| 1 | FAB Button | Floating button bottom-right. Badge "Online" + tooltip "Ask AI" |
| 2 | Chat Panel | UCard 430px width, 78dvh height |
| 3 | Welcome Screen | Quick prompts: "Laptop di bawah 10jt", "Cek stok iPhone", "Termurah tersedia", "Best seller minggu ini" |
| 4 | Message Display | User: right-aligned, primary bg. AI: left-aligned, border. Image attachments in messages |
| 5 | Streaming Response | SSE (Server-Sent Events). Real-time token display |
| 6 | Fallback | Jika SSE gagal → standard POST |
| 7 | Image Upload | Max 5 images, max 5MB each, base64 |
| 8 | Session Management | Auto-create session, retry if expired |
| 9 | Retry | Retry last prompt (text + images) |
| 10 | Refresh History | Reload chat messages |

#### 4. SSE Events

| Event | Purpose |
|-------|---------|
| `ack` | Server confirmed user message. Replace optimistic message |
| `token` | Streaming text token. Append to assistant draft |
| `done` | Stream complete. Replace draft with final message |

#### 5. API Calls

`POST /chat/session`, `GET /chat/:sessionId`, `POST /chat/message`, `POST /chat/message-stream`

#### 6. Nuxt UI Components Used

`UBadge`, `UTooltip`, `UButton`, `UCard`, `UChip`, `UAvatar`, `UIcon`, `UChatPrompt`, `UChatPromptSubmit`

---

## 5. Komponen Global

### 5.1 AppHeader
- **File:** `app/components/app/AppHeader.vue` (787 lines)
- **Nuxt UI:** UPopover (×3), UButton (×20+), UNavigationMenu (×4), UInput (×2), UIcon, UTooltip (×3), UDropdownMenu (×2), UChip (×2), UAvatar (×2)
- **Fitur:** Category popover, search with debounce, locale switcher, cart badge, user dropdown, login/logout

### 5.2 AppMobileHeader
- **File:** `app/components/app/AppMobileHeader.vue` (410 lines)
- **Nuxt UI:** UButton (×7), UDropdownMenu, UInput, UIcon, UNavigationMenu, USlideover
- **Fitur:** Search slideover, cart badge, orders badge, user menu, login

### 5.3 AppFooter
- **File:** `app/components/app/AppFooter.vue` (190 lines)
- **Nuxt UI:** UContainer, UButton (×4+), UIcon, ULink (×4)
- **Fitur:** Store info, social media, navigation links, dark mode toggle, copyright

### 5.4 ProductItem (Card)
- **File:** `app/components/product/Item.vue` (139 lines)
- **Nuxt UI:** UCard, UBadge (×2), UIcon
- **Fitur:** Product card for grid. Hover: image zoom, border primary. Badges: discount, best-seller, new

### 5.5 ProductItemSmall
- **File:** `app/components/product/ItemSmall.vue` (422 lines)
- **Nuxt UI:** UBadge, UIcon, UButton (×3), UInputNumber, UModal
- **Fitur:** Compact product display. Props: withInput, withQuantity, withTrackButton, withDate, withStatusOrder, clickable. 500ms debounce quantity

### 5.6 ModalConfirm
- **File:** `app/components/Modal/Confirm.vue`
- **Nuxt UI:** UModal, UIcon, UButton (×2)
- **Fitur:** 4 types (danger/warning/info/success). Props: title, description, confirmText, cancelText, loading

### 5.7 TransactionTracking
- **File:** `app/components/transaction/Tracking.vue`
- **Nuxt UI:** UButton, USeparator, UTooltip, UStepper
- **Fitur:** Courier info, resi number with copy, timeline stepper. Props: orientation, fullscreen, withSteps

### 5.8 HomeBannerSection
- **File:** `app/components/home/BannerSection.vue`
- **Nuxt UI:** USkeleton, UCarousel
- **Fitur:** Banner carousel with autoplay, loop, wheel gestures, dots

---

## 6. Sistem Pembayaran

### 6.1 Metode Pembayaran

| Metode | Default | Threshold |
|--------|---------|-----------|
| **QRIS** | ✅ Ya (≤ Rp10jt) | Otomatis jika total ≤ Rp10.000.000 |
| **Bank Transfer** | ❌ Wajib (> Rp10jt) | Jika total > Rp10.000.000 |

### 6.2 Data Rekening Toko

```typescript
interface StoreBankAccount {
  bank_name: string      // "BCA", "Mandiri"
  account_number: string // "1234567890"
}
```

Default mock: BCA 1234567890, Mandiri 9876543210123

### 6.3 Payment Flow Lengkap

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  CART   │ ──► │ CHECKOUT │ ──► │ PAYMENT  │ ──► │ SUCCESS  │
│         │     │          │     │          │     │          │
│ Pilih   │     │ Pilih    │     │ Lihat QR │     │ Konfirmasi│
│ items   │     │ alamat,  │     │ atau     │     │          │
│ voucher │     │ ekspedisi│     │ transfer │     │          │
└─────────┘     └──────────┘     └──────────┘     └──────────┘
                    │                 │
                    ▼                 ▼
              POST /checkout    GET /payment/:orderId
                    │                 │
                    ▼                 ▼
              Response:          Response:
               order_id           qris_billing /
               payment_method     bank_account
               total              payment_expired_at
```

### 6.4 Payment Expiry & Restore Logic

```
Server set payment_expired_at (default: 10 menit dari sekarang)
    ↓
Client hitung countdown (per 1 detik)
    ↓
Countdown = 0:
  → POST /cart untuk setiap item (restore)
  → tracking via restoredExpiredOrderIds (useState)
  → warning toast "Pembayaran expired, barang dikembalikan ke keranjang"
  → redirect ke /[store]/cart

Deduplication:
  restoredExpiredOrderIds mencegah restore ganda
  (user balik ke cart → expired order sudah ditandai restored)
```

### 6.5 Order Status Flow

```
pending_payment ──► processing ──► shipped ──► delivered ──► finished
       │                                                       ▲
       ▼                                                       │
  (expired → restore to cart)                        confirm finish
```

### 6.6 Payment Confirmation

**Server endpoint:** `POST /payment/:orderId`  
Validasi session → cari order → update status `pending_payment` → `processing`

---

## 7. Theme System

### 7.1 Tiga Theme

| Aspek | `default` | `simasko` | `bazaar` |
|-------|-----------|-----------|----------|
| Primary Color | Blue (`primary`) — `#3b82f6` | Indigo (`primary`) — `#6366f1` | Rose (`primary`) — `#e11d48` |
| Secondary Color | Slate (`secondary`) — `#64748b` | Sky Blue (`secondary`) — `#0ea5e9` | Slate (`secondary`) — `#64748b` |
| Accent Color | Orange (`accent`) — `#f97316` | Violet (`accent`) — `#8b5cf6` | Amber (`accent`) — `#f59e0b` |
| Warning Color | Amber (`warning`) — `#f59e0b` | Amber (`warning`) — `#f59e0b` | Amber (`warning`) — `#f59e0b` |
| Neutral | Zinc (`gray`) — `#a1a1aa` | Zinc (`gray`) — `#a1a1aa` | Zinc (`gray`) — `#a1a1aa` |
| Card Style | `rounded-xl`, `shadow-sm`, hover `shadow-lg -translate-y-1` | `rounded-xl`, `border-info`, hover `shadow-lg -translate-y-1` | `rounded-xl`, `border-primary-200`, hover `shadow-lg -translate-y-1` |
| Button Style | `rounded-lg`, default `size="md" color="primary"` | `rounded-lg`, shadow | `rounded-lg`, default `size="md" color="primary"` |
| Badge Style | `rounded-full font-medium` | `rounded-md`, uppercase | `rounded-full font-medium` |
| Input Style | `rounded-lg border-neutral-200` | `rounded-lg border-info-200` | `rounded-lg border-primary-200` |
| Product Price | Discount → `text-accent` (orange), normal → `text-neutral-800` | `text-info-900` | Discount → `text-accent` (amber), normal → `text-primary-900` |
| Category Nav | Icon grid sidebar, active `bg-primary-50` | Icon grid sidebar, active `bg-info-50` | **Horizontal scroll strip** (no sidebar) |
| Header | Logo kiri + search + cart kanan | Logo kiri + search + cart kanan | **Centered logo, full-width search, mobile bottom nav** |
| Home Layout | Banner → Simasko → Sidebar+Grid | Banner → Simasko → Sidebar+Grid | **Banner 2×2 grid → Category strip → Simasko → Full-width Grid** |
| Product Card | Vertical card, 5-col grid | Vertical card, 5-col grid | Vertical card + **"Beli" button**, 5-col grid |

### 7.2 Color Palette (4 Warna)

**Default theme menggunakan 4 warna utama:**

| Token | Warna | Hex | Fungsi |
|-------|-------|-----|--------|
| **Primary** | 🔵 Blue | `#3b82f6` | Tombol, link, CTA, active states — general UI |
| **Secondary** | 🔘 Slate | `#64748b` | Elemen pendukung, border, ghost buttons |
| **Accent** | 🟠 Orange | `#f97316` | **Brand accent (hemat)** — harga diskon, badge promo, highlight |
| **Warning** | 🟡 Amber | `#f59e0b` | Rating stars, progress bar, peringatan |

**Orange digunakan secara hemat sebagai brand accent:**
- ✅ Harga diskon (`text-accent`)
- ✅ Badge promo / best-seller
- ✅ Ikon brand (logo, Simasko section)
- ❌ Tidak untuk tombol primary, link, atau active states (gunakan Blue)

### 7.3 Cara Kerja Theme System

```
1. Store profile loaded → useStoreProfile() watch
2. resolveStoreTheme(storeProfile.config.theme)
   → 'default' atau 'simasko'
3. Theme variant resolved via Theme Registry:
   resolveThemeComponent('ComponentName', theme)
   → returns Component from #components
4. CSS react via data-store-theme:
   :root[data-store-theme='simasko'] {
     --color-primary-500: #6366f1;  // Indigo
     --color-secondary-500: #0ea5e9; // Sky
     --color-accent-500: #8b5cf6;    // Violet
     ...
   }
5. All Nuxt UI components automatically update colors
```

### 7.4 Component Presets (Global — app.config.ts)

| Komponen | Default Style |
|----------|--------------|
| `UCard` | `rounded-xl border border-neutral-200/80 shadow-sm bg-white` |
| `UButton` | `rounded-lg`, default `size="md" color="primary"` |
| `UInput` | `rounded-lg border-neutral-200` |
| `UModal` | `rounded-2xl border border-neutral-200 shadow-xl` |
| `UBadge` | `rounded-full font-medium` |
| `UDropdownMenu` | `rounded-xl border border-neutral-200 shadow-lg`, item `rounded-lg` |

### 7.5 Dark Mode

- `classSuffix: ''` → class `.dark` on `<html>`
- Invert `--color-gray-*` scale (50 ↔ 950) — Zinc palette
- Body: `#09090b`, text: `#d4d4d8`
- Toggle via `useColorMode()` di AppFooter

### 7.6 Home Page Layout (Per-Theme)

Home page layout disimpan di `themes/*/home/Layout.vue` — memungkinkan struktur HTML berbeda per theme:

```
pages/[store]/index.vue          → data fetching + state only
├── home/Layout.vue (gateway)    → relay props/events ke theme variant
│   ├── themes/default/home/Layout.vue  → template default (blue)
│   ├── themes/simasko/home/Layout.vue  → template simasko (indigo)
│   └── themes/bazaar/home/Layout.vue   → template bazaar (rose)
```

**Layout sections per theme:**

| Section | default / simasko | bazaar |
|---------|-------------------|--------|
| Hero Banner | `HomeBannerSection` (carousel) | `HomeBannerSection` (2×2 grid desktop, carousel mobile) |
| Category Nav | `HomeCategorySidebar` (vertical sidebar) | `HomeCategorySidebar` (horizontal scroll strip) |
| Simasko | `HomeSimaskoSection` (v-if enabled) | `HomeSimaskoSection` (v-if enabled) |
| Products | Sidebar + `HomeProductGrid` | Full-width `HomeProductGrid` (no sidebar) |

### 7.7 Bazaar Theme — Structural Differences

Bazaar theme memiliki perbedaan struktural signifikan dari default/simasko:

| Komponen | Perbedaan |
|----------|-----------|
| **Header** | Mobile bottom navigation (Home/Categories/Cart/Account), no hamburger menu |
| **BannerSection** | Desktop: 2×2 grid layout, Mobile: carousel |
| **CategorySidebar** | Horizontal scroll strip with icon + label (bukan vertical sidebar) |
| **CategoryPage** | Horizontal category pills + full-width grid (bukan sidebar + grid) |
| **ProductItem** | Vertical card + visible "Beli" button |
| **HomeLayout** | No sidebar, full-width product grid |

---

## 8. API Endpoints

### 8.1 Auth

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/auth/login` | No | Login username + password |
| POST | `/auth/google` | No | Login Google credential |
| POST | `/auth/register` | No | Register user baru |
| POST | `/auth/logout` | Yes | Logout, hapus session |
| POST | `/auth/forgot-password` | No | Kirim OTP reset password |
| POST | `/auth/verify-otp` | No | Verifikasi OTP |
| POST | `/auth/reset-password` | No | Reset password |

### 8.2 User

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/me` | Yes | Get user profile |
| PUT | `/me` | Yes | Update profile |
| PUT | `/me/password` | Yes | Ganti password |

### 8.3 Store

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/store/:slug` | No | Get store profile |

### 8.4 Products

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/:slug_toko/products` | No | List products (search, category, sort, page, limit) |
| GET | `/:slug_toko/products/:slug` | No | Product detail |
| GET | `/:slug_toko/products/:slug/related` | No | Related products |
| GET | `/:slug_toko/categories` | No | All categories + children |

### 8.5 Cart

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/:slug_toko/cart` | Yes | Get cart |
| POST | `/:slug_toko/cart` | Yes | Add item |
| PUT | `/:slug_toko/cart/:id` | Yes | Update quantity |
| DELETE | `/:slug_toko/cart/:id` | Yes | Remove item |

### 8.6 Address & Regions

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/address` | Yes | List addresses |
| POST | `/address` | Yes | Create address |
| PUT | `/address/:id` | Yes | Update address |
| DELETE | `/address/:id` | Yes | Delete address |
| GET | `/regions/provinces` | Yes | Provinces list (RajaOngkir) |
| GET | `/regions/cities` | Yes | Cities by province (RajaOngkir) |
| GET | `/regions/districts` | Yes | Districts by city (RajaOngkir) |
| GET | `/regions/subdistricts` | Yes | Subdistricts by district (RajaOngkir) |

### 8.7 Orders & Payment

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/:slug_toko/orders` | Yes | List orders |
| GET | `/:slug_toko/orders/:id` | Yes | Order detail |
| POST | `/:slug_toko/orders/:id/finish` | Yes | Confirm finished |
| POST | `/:slug_toko/orders/:id/review` | Yes | Submit review |
| GET | `/:slug_toko/orders/:id/tracking` | Yes | Tracking info |
| GET | `/:slug_toko/ekspedisi` | Yes | Expedition options |
| POST | `/:slug_toko/checkout` | Yes | Create order |
| GET | `/:slug_toko/payment/:orderId` | Yes | Payment info |
| POST | `/:slug_toko/payment/:orderId` | Yes | Confirm payment |
| GET | `/:slug_toko/payment/qris/:invoice/check` | Yes | Check QRIS status (polling) |
| POST | `/:slug_toko/payment/qris/:invoice/cancel` | Yes | Cancel QRIS payment |

### 8.8 Voucher

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/:slug_toko/voucher` | Yes | List vouchers |
| POST | `/:slug_toko/voucher/validate` | Yes | Validate voucher |

### 8.9 Chat

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/:slug_toko/chat/session` | No | Create session |
| GET | `/:slug_toko/chat/:sessionId` | No | Chat history |
| POST | `/:slug_toko/chat/message` | No | Send message |
| POST | `/:slug_toko/chat/message-stream` | No | Stream response (SSE) |

### 8.10 Others

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/:slug_toko/banner` | No | Active banners |
| GET | `/:slug_toko/categories` | No | Category tree |

---

## Lampiran

### A. Business Rules Summary

1. **Bank Transfer threshold:** Total > Rp10.000.000 → wajib pilih rekening bank
2. **Review validation:** Min 5 karakter, max 500 karakter, rating ≥ 1
3. **Voucher max discount:** Capped di `max_discount` value
4. **Service code format:** Uppercase, only `[A-Z0-9_-]`
5. **Expired order restore:** Deduplication via `restoredExpiredOrderIds` state
6. **Simasko feature flag:** Controlled by `storeProfile.config.schema.includes('SIMASKO')`
7. **Google auth restriction:** Tidak bisa ganti email/password di settings
8. **Order lifecycle:** pending_payment → processing → shipped → delivered → finished
9. **Review availability:** Hanya saat status `delivered` atau `finished`
10. **Cart items selection:** Via query param `items=id1,id2,id3`
11. **Payment timer:** Server-set `payment_expired_at`, client countdown
12. **Auth session:** 6 hours expiry (server), no refresh mechanism

### B. Halaman Auth Requirements Matrix

| Halaman | requiresAuth | guestOnly | Redirect if |
|---------|:-----------:|:---------:|-------------|
| Landing, Category, Product | ❌ | ❌ | - |
| Cart, Checkout, Payment, Success | ✅ | ❌ | → Login |
| History, Detail | ✅ | ❌ | → Login |
| Settings | ✅ | ❌ | → Login |
| PC Builder | ✅ | ❌ | → Login |
| Login, Register, Forgot PW | ❌ | ✅ | → Home |
| About, 404 | ❌ | ❌ | - |

### C. Z-index Stacking

| Layer | Z-index | Elemen |
|-------|---------|--------|
| Header | `z-999` | Fixed header (AppHeader) |
| Search Overlay | `z-30` | Search backdrop |
| ChatBot FAB | `z-120` | Floating chat button |
| ChatBot Panel | inside UCard | Chat panel |
| Modal | Component default | UModal, USlideover |
| Dropdown | Component default | UDropdownMenu, UPopover |

### D. Responsive Breakpoints

| Breakpoint | Width | Dampak |
|------------|-------|--------|
| Default (mobile) | < 768px | 2-col grid, stacked layout, mobile header |
| `md:` | ≥ 768px | 4-col grid, sidebar visible |
| `lg:` | ≥ 1024px | Desktop header, 5-col grid, sticky elements |
| `xl:` | ≥ 1280px | Larger gaps |
| `2xl:` | ≥ 1536px | Text labels visible |

---

*Dokumentasi ini dibuat untuk keperluan UI/UX Designer dalam mendesain ulang website POS Sadigit Store Ecommerce.*
*Setiap halaman mencakup: struktur layout, daftar fitur, state management, flow interaksi, navigasi, data, dan Nuxt UI components.*
