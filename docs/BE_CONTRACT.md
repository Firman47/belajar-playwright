# Backend Contract — Product API

> **Purpose:** Dokumen ini adalah **contract binding** antara Frontend (FE) dan Backend (BE) untuk endpoint products.
> BE **WAJIB** mengikuti spec ini persis. Setiap perubahan harus dikoordinasikan dengan tim FE terlebih dahulu.

---

## Table of Contents

1. [Rules](#1-rules)
2. [Base URL & Auth](#2-base-url--auth)
3. [Standard Response Envelope](#3-standard-response-envelope)
4. [ProductEcommerceDTO (Base Shape)](#4-productecommercedto-base-shape)
5. [List Products](#5-list-products)
6. [Product Detail](#6-product-detail)
7. [Related Products](#7-related-products)
8. [Frontend Mapping](#8-frontend-mapping)
9. [Changelog](#9-changelog)

---

## 1. Rules

### 1.1 Legenda Nullability

| Label              | Arti                                | Handling FE          |
| ------------------ | ----------------------------------- | -------------------- |
| ✅ **Never Null**  | Selalu ada, selalu bertipe sesuai   | Aman akses langsung  |
| ⚠️ **Nullable**    | Bisa `null` atau properti tidak ada | **WAJIB** null-check |
| ❌ **Always Null** | Selalu `null` (reserved)            | Bisa diabaikan       |

### Aturan Global (berlaku untuk SEMUA endpoint)

1. **Array fields** (`items`, `images`, `discounts`, `variants`, `colors`, `reviews`, `children`) — ✅ **never null**, minimal `[]`.
2. **ID fields** (`id`, `slug`) — ✅ **never null**.
3. **Boolean fields** (`is_active`, `is_new`, `is_best_seller`, `is_primary`) — ✅ **never null**.
4. **Numeric fields** (`price`, `general_price`, `stock`, `minimum_buy`, `sold_count`, `review_count`) — ✅ **never null** (default `0`).
5. **Dimensions** (`weight`, `width`, `length`, `height`) — ⚠️ **nullable** jika tidak diisi.
6. **Optional strings** (`barcode`, `description`, `category`, `brand`, `variant_name`) — ⚠️ **nullable**.
7. **Nested objects** (`sales_stats`, `review_summary`, `parent_category`) — ⚠️ **bisa null** (seluruh object).
8. **Pagination** (`next_cursor`) — ⚠️ **nullable** (`null` = no more pages).
9. **Timestamps** (`created_at`, `updated_at`) — ✅ **never null** pada entity yang sudah ada.
10. **Mirror/duplicate fields** (`name` = `title`, `brand_name` = `brand`, `category_name` = `category`, `general_price` = `price`) — ✅ **never null**, untuk backward compat.

### 1.2 snake_case WAJIB

**Semua** field dalam JSON response WAJIB menggunakan `snake_case`. Tidak ada toleransi untuk `camelCase`.

| ✅ Benar              | ❌ Salah             |
| --------------------- | -------------------- |
| `sales_stats`         | `salesStats`         |
| `review_summary`      | `reviewSummary`      |
| `is_new`              | `isNew`              |
| `minimum_buy`         | `minimumBuy`         |
| `discount_percentage` | `discountPercentage` |
| `brand_name`          | `brandName`          |
| `photo_url`           | `photoUrl`           |

### 1.2 weight = number (grams)

Field `weight` WAJIB bertipe **number** dalam satuan **gram**.

| ✅ Benar | ❌ Salah   |
| -------- | ---------- |
| `2100`   | `"2.1 kg"` |

### 1.3 images = array of objects

Field `images` WAJIB berupa array of objects dengan struktur `{ id, photo_url, is_primary }`.

| ✅ Benar                                                                | ❌ Salah          |
| ----------------------------------------------------------------------- | ----------------- |
| `[{ "id": "img_001", "photo_url": "https://...", "is_primary": true }]` | `["https://..."]` |

### 1.4 Satu Shape untuk Semua

- **List Products** dan **Related Products** pakai `items[]` dengan `ProductEcommerceDTO`
- **Product Detail** pakai `product` object yang merupakan **super-set** dari `ProductEcommerceDTO` (base fields + extra fields)

Tidak boleh ada perbedaan field antar endpoint untuk data yang sama.

---

## 2. Base URL & Auth

| Environment | URL                            |
| ----------- | ------------------------------ |
| Development | `/api/v1`                      |
| Production  | `https://api.sadigit.co.id/v1` |

Store-scoped routing:

```
{{BASE_URL}}/:slug_toko/products
{{BASE_URL}}/:slug_toko/products/:slug
{{BASE_URL}}/:slug_toko/products/:slug/related
```

**Auth:** Endpoint products **tidak** memerlukan autentikasi.

---

## 3. Standard Response Envelope

Semua endpoint mengembalikan wrapper yang sama:

```jsonc
{
  "status": true,       // boolean — true = success
  "message": "...",     // human-readable message
  "data": {} | null     // payload object
}
```

### HTTP Status Codes

| Status | Meaning                            |
| ------ | ---------------------------------- |
| `200`  | Success                            |
| `400`  | Invalid request / validation error |
| `404`  | Product not found / inactive       |
| `500`  | Server error                       |

---

## 4. ProductEcommerceDTO (Base Shape)

Ini adalah **base shape** yang digunakan oleh semua endpoint product.

```typescript
interface ProductEcommerceDTO {
  // === Identitas ===
  id: string // ✅ never null
  title: string // ✅ never null
  name: string // ✅ never null (mirror of title)
  slug: string // ✅ never null
  sku: string // ✅ never null
  store_slug: string // ✅ never null
  store_id: string // ✅ never null
  barcode: string | null // ⚠️ nullable

  // === Kategori & Brand ===
  category: string | null // ⚠️ nullable
  category_name: string | null // ⚠️ nullable (mirror of category)
  category_slug: string | null // ⚠️ nullable (hanya di detail)
  sub_category: string | null // ⚠️ nullable
  sub_category_name: string | null // ⚠️ nullable (mirror of sub_category)
  brand: string | null // ⚠️ nullable
  brand_name: string | null // ⚠️ nullable (mirror of brand)
  variant_name: string | null // ⚠️ nullable
  parent_category: { name: string; slug: string } | null // ⚠️ nullable (hanya di detail)

  // === Harga & Stok ===
  general_price: number // ✅ never null (mirror of price)
  price: number // ✅ never null
  stock: number // ✅ never null
  weight: number | null // ⚠️ nullable — grams, NUMBER bukan string
  width: number | null // ⚠️ nullable
  length: number | null // ⚠️ nullable
  height: number | null // ⚠️ nullable
  minimum_buy: number // ✅ never null
  is_active: boolean // ✅ never null
  is_new: boolean // ✅ never null
  is_best_seller: boolean // ✅ never null

  // === Media ===
  image: string | null // ⚠️ nullable — derived from images[0] (backward compat)
  images: ProductImage[] // ✅ never null, minimal []

  // === Diskon ===
  discounts: ProductDiscount[] // ✅ never null, minimal []
  discount_percentage: number | null // ⚠️ nullable (backward compat)

  // === Statistik ===
  sales_stats: ProductSalesStats | null // ⚠️ nullable — entire object
  rating: number | null // ⚠️ nullable (backward compat)
  sold_count: number // ✅ never null (backward compat)

  // === Review ===
  review_summary: ProductReviewSummary | null // ⚠️ nullable — entire object
  review_count: number // ✅ never null — derived from review_summary.review_count

  // === Timestamps ===
  created_at: string // ✅ never null — ISO 8601
  updated_at: string // ✅ never null — ISO 8601
}

interface ProductImage {
  id: string // ✅ never null
  photo_url: string // ✅ never null
  is_primary: boolean // ✅ never null
}

interface ProductDiscount {
  id: string // ✅ never null
  discount_type: 'PERCENTAGE' | 'FIXED' // ✅ never null
  discount_value: number // ✅ never null
  is_active: boolean // ✅ never null
  valid_from: string | null // ⚠️ nullable
  valid_until: string | null // ⚠️ nullable
}

interface ProductSalesStats {
  sold_count: number // ✅ never null
  last_sold_at: string | null // ⚠️ nullable
}

interface ProductReviewSummary {
  rating_avg: number | null // ⚠️ nullable
  review_count: number // ✅ never null
}
```

---

## 5. List Products

```
GET {{BASE_URL}}/:slug_toko/products
```

### Query Parameters

| Param         | Type     | Default  | Description                                        |
| ------------- | -------- | -------- | -------------------------------------------------- |
| `search`      | `string` | —        | Full-text search on title, brand, category         |
| `category`    | `string` | —        | Category slug (parent or child)                    |
| `subcategory` | `string` | —        | Subcategory slug (exact match)                     |
| `sort`        | `string` | `newest` | `newest`, `price_asc`, `price_desc`, `best_seller` |
| `price_min`   | `number` | —        | Minimum price in IDR                               |
| `price_max`   | `number` | —        | Maximum price in IDR                               |
| `cursor`      | `string` | —        | Cursor pagination (dari `next_cursor`)             |
| `limit`       | `number` | `20`     | Items per page (max 100)                           |

> **Catatan:** FE mengirim `sort` values yang sudah dinormalisasi. Jangan mengharapkan legacy values seperti `price_low_to_high` atau `most_popular`.

### Response

```json
{
  "status": true,
  "message": "Products fetched successfully",
  "data": {
    "items": [ ProductEcommerceDTO ],
    "total_count": 42,
    "next_cursor": "prod_020"
  }
}
```

- `items[]` — Array of `ProductEcommerceDTO`
- `total_count` — Total produk (untuk display)
- `next_cursor` — `product.id` untuk halaman berikutnya, atau `null` jika sudah habis

---

## 6. Product Detail

```
GET {{BASE_URL}}/:slug_toko/products/:slug
```

### Path Parameters

| Param       | Type     | Required | Description                       |
| ----------- | -------- | -------- | --------------------------------- |
| `slug_toko` | `string` | ✅       | Store slug (e.g. `sadigit-store`) |
| `slug`      | `string` | ✅       | Product's URL slug                |

### Response

```json
{
  "status": true,
  "message": "Product fetched successfully",
  "data": {
    "product": {
      // --- All ProductEcommerceDTO fields (WAJIB ada) ---
      "id": "prod_002",
      "title": "ASUS VivoBook 15 ...",
      "name": "ASUS VivoBook 15 ...",
      "slug": "asus-vivobook-15-x1504za-i5-8gb",
      "sku": "234252636374",
      "store_slug": "sadigit",
      "barcode": null,
      "category": "Laptop Asus",
      "category_slug": "asus",
      "sub_category": null,
      "brand": "Asus",
      "brand_name": "Asus",
      "variant_name": null,
      "price": 7500000,
      "stock": 85,
      "weight": 2100,
      "width": null,
      "length": null,
      "height": null,
      "minimum_buy": 1,
      "is_active": true,
      "is_new": false,
      "is_best_seller": false,
      "image": "https://picsum.photos/468/468?random=21",
      "images": [
        { "id": "img_prod_002_0", "photo_url": "https://picsum.photos/468/468?random=21", "is_primary": true }
      ],
      "discounts": [],
      "sales_stats": { "sold_count": 92, "last_sold_at": null },
      "review_summary": { "rating_avg": 4.6, "review_count": 14 },
      "discount_percentage": null,
      "rating": 4.6,
      "sold_count": 92,
      "created_at": "2025-09-15T00:00:00Z",
      "updated_at": "2025-09-15T00:00:00Z",

      // --- Extra fields (hanya di detail) ---
      "description": "Processor:<br />Intel Core i5-1235U 1.3 GHz...",
      "variants": [
        { "label": "RAM 8GB + SSD 256GB", "value": "8gb_ram_256gb_ssd", "group": "ram", "price": 7500000 }
      ],
      "colors": [
        { "label": "Quiet Blue", "value": "quiet_blue" }
      ],
      "parent_category": { "name": "Laptop", "slug": "laptop" },
      "reviews": [ ProductReviewItem ],
      "review_count": 14
    }
  }
}
```

### ProductReviewItem

```typescript
interface ProductReviewItem {
  id: string
  user_id: string
  user_name: string
  order_id: string
  rating: number
  review: string
  variant_label: string | null // snapshot dari order item
  color_label: string | null // snapshot dari order item
  created_at: string
  updated_at: string
}
```

### ProductVariant

```typescript
interface ProductVariant {
  id: string // ✅ never null — UUID
  label: string // ✅ never null — display label
  value: string // ✅ never null — option value
  group: string // ✅ never null — group name: "ram" | "warna" | "ukuran" | "kapasitas"
  price?: number // ⚠️ nullable — price override (null = use parent price)
  options?: ProductVariant[] // ⚠️ nullable — sub-variants (level 2)
}
```

> **Group field:** `group` is used by the frontend to render variants in separate UI sections (e.g. "RAM" section, "Warna" section). Sub-variants (level 2) also have `group` but are always rendered inside their parent's section. Common values: `'ram'`, `'warna'`, `'ukuran'`, `'kapasitas'`.

> **Array guarantee:** `variants` and `colors` arrays are always `[]` (never null) when there are no variants/colors. The BE detail response always returns `variants: []` and `colors: []` rather than `null`.

### Error

```json
// 404 — Product not found or inactive
{
  "status": false,
  "message": "Product not found",
  "data": null
}
```

---

## 7. Related Products

```
GET {{BASE_URL}}/:slug_toko/products/:slug/related
```

Returns up to 12 products from the same category tree.

### Response

```json
{
  "status": true,
  "message": "Related products fetched successfully",
  "data": {
    "items": [ ProductEcommerceDTO ]
  }
}
```

> Response shape **sama persis** dengan List Products (`items[]`), hanya tanpa `total_count` dan `next_cursor`.

---

## 8. Frontend Mapping

Bagaimana FE mengonsumsi data ini:

### List & Related → ProductCard

```typescript
// RawProductDTO = ProductEcommerceDTO (dari backend)
// → mapRawProductToCard() → ProductCard

ProductCard {
  id: string
  title: string          // dari raw.name || raw.title
  slug: string
  category: string       // dari raw.category
  brand: string          // dari raw.brand || raw.brand_name
  price: number          // dari raw.price
  discount_percentage: number?  // dari raw.discounts[0].discount_value
  rating: number?        // dari raw.review_summary.rating_avg
  sold_count: number?    // dari raw.sales_stats.sold_count
  review_count: number?  // dari raw.review_summary.review_count
  minimum_buy: number
  is_new: boolean?
  is_best_seller: boolean?
  stock: number
  image: string | null   // dari raw.images.find(is_primary)?.photo_url
}
```

### Detail → Product

```typescript
// Langsung pakai data.product sebagai Product (no mapping)
// Asalkan semua base ProductEcommerceDTO fields ada di dalamnya.

Product extends ProductCard {
  category_slug: string | null
  parent_category: { name, slug } | null
  sku: string
  weight: number | string | null    // BE WAJIB kirim number
  images: ProductImage[]
  variants: ProductVariant[]
  colors: ProductVariant[]
  description: string
  reviews: ProductReviewItem[]
  review_count: number
  is_active: boolean
  created_at: string
}
```

---

## 9. Changelog

| Date       | Version | Changes                                                                                                                                                                                                  |
| ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-26 | v2.1    | Tambah `group` field ke `ProductVariant` — untuk grouping UI variant per section. Tambah interface `ProductVariant` di dokumentasi.                                                                      |
| 2026-05-22 | v2.0    | **BREAKING:** Rename `salesStats` → `sales_stats`, `reviewSummary` → `review_summary`. Detail response kini konsisten dengan `ProductEcommerceDTO`. Hapus response `products[]` → semua pakai `items[]`. |
| 2026-04-16 | v1.2    | Product detail: tambah `reviews` dan `review_count`. Tambah `variant_label`, `color_label` di review.                                                                                                    |
| 2026-03-10 | v1.1    | List products: pindah dari page-based ke cursor-based pagination. Ubah format response jadi `items[]` + `total_count` + `next_cursor`.                                                                   |
| 2026-02-20 | v1.0    | Initial contract.                                                                                                                                                                                        |
