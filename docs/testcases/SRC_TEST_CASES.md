# Search Module — Test Case Specifications

**Module:** Search & Product Listing  
**Route:** `/kurostoreid/search?q=...&category=...&subcategory=...&sort=...`  
**API Endpoint:** `GET /e_commerce/v1/kurostoreid/products?search=&category=&sort=&price_min=&price_max=&cursor=&limit=`  
**Auth:** Public  
**Test ID Prefix:** `SRC-`

> **API Contract (from API_DOCUMENTATION.md §8.1):**
> - Base: `GET /e_commerce/v1/{store}/products`
> - Query params: `search`, `category`, `subcategory`, `sort`, `price_min`, `price_max`, `cursor`, `limit`
> - Sort values: `newest`, `price_asc`, `price_desc`, `best_seller`
> - Response: `{ status, message, data: { items[], total_count, next_cursor } }`
> - Items shape: `ProductEcommerceDTO` (id, title, slug, price, stock, images[], etc.)

---

## Test Cases

### SRC-001: Search by keyword (found) — API 200, results appear in grid

| Field | Value |
|-------|-------|
| **ID** | SRC-001 |
| **Priority** | P0 |
| **Tags** | `@smoke` `@regression` |
| **Description** | Search dengan keyword yang ada di database harus mengembalikan produk yang match dan menampilkannya di grid. |
| **Pre-condition** | Buka halaman `/kurostoreid/search?q=charger` |
| **Steps** | 1. Navigate ke search page dengan query `?q=charger`<br>2. Tunggu response API products<br>3. Verifikasi response status 200<br>4. Verifikasi `body.status === true`<br>5. Verifikasi `body.data.items` berisi minimal 1 produk<br>6. Verifikasi produk dengan title "Charger 5V" muncul di grid |
| **Expected Result** | API mengembalikan produk yang match keyword. Grid menampilkan produk tersebut. |
| **Classification** | ✅ PASS (API + UI match) |

### SRC-002: Search no results — empty state

| Field | Value |
|-------|-------|
| **ID** | SRC-002 |
| **Priority** | P0 |
| **Tags** | `@regression` |
| **Description** | Search dengan keyword yang tidak ada di database harus menampilkan empty state. |
| **Pre-condition** | Buka halaman `/kurostoreid/search?q=zzzxxxnonexistent` |
| **Steps** | 1. Navigate ke search page dengan query `?q=zzzxxxnonexistent`<br>2. Tunggu response API products<br>3. Verifikasi response status 200<br>4. Verifikasi `body.data.items` kosong (array [])<br>5. Verifikasi `body.data.total_count === 0`<br>6. Verifikasi UI menampilkan "0 products" atau empty state icon |
| **Expected Result** | API mengembalikan items kosong. UI menampilkan pesan "0 products" atau empty state. |
| **Classification** | ✅ PASS (API behavior benar) |

### SRC-003: Search tanpa keyword — semua produk tampil

| Field | Value |
|-------|-------|
| **ID** | SRC-003 |
| **Priority** | P1 |
| **Tags** | `@regression` |
| **Description** | Search tanpa query param `q` (hanya `/search`) harus menampilkan semua produk. |
| **Pre-condition** | Buka halaman `/kurostoreid/search` tanpa query |
| **Steps** | 1. Navigate ke search page tanpa query<br>2. Tunggu response API products<br>3. Verifikasi response status 200<br>4. Verifikasi `body.data.total_count > 0`<br>5. Verifikasi UI menampilkan jumlah produk yang sesuai |
| **Expected Result** | API mengembalikan semua produk. Grid menampilkan produk-produk tersebut. |
| **Classification** | ✅ PASS (API behavior benar) |

### SRC-004: Filter by category via sidebar — produk sesuai kategori

| Field | Value |
|-------|-------|
| **ID** | SRC-004 |
| **Priority** | P1 |
| **Tags** | `@regression` |
| **Description** | Klik kategori "Laptop" di sidebar harus memfilter produk hanya dari kategori Laptop. |
| **Pre-condition** | Buka halaman `/kurostoreid/search` |
| **Steps** | 1. Navigate ke search page<br>2. Klik kategori "Laptop" di sidebar<br>3. Tunggu response API dengan filter category<br>4. Verifikasi URL mengandung `?category=laptop`<br>5. Verifikasi semua produk yang muncul memiliki category "Laptop" |
| **Expected Result** | API mengembalikan produk kategori Laptop saja. URL terupdate dengan `?category=laptop`. |
| **Classification** | ✅ PASS |

### SRC-005: Sort by price ascending

| Field | Value |
|-------|-------|
| **ID** | SRC-005 |
| **Priority** | P1 |
| **Tags** | `@regression` |
| **Description** | Pilih sort "Termurah" harus mengurutkan produk dari harga terendah ke tertinggi. |
| **Pre-condition** | Buka halaman `/kurostoreid/search` |
| **Steps** | 1. Navigate ke search page<br>2. Klik tab "Termurah" atau pilih sort price_asc<br>3. Tunggu response API dengan sort=price_asc<br>4. Verifikasi produk pertama memiliki harga <= produk kedua |
| **Expected Result** | API mengembalikan produk terurut price ascending. UI menampilkan produk termurah pertama. |
| **Classification** | ✅ PASS |

### SRC-006: Sort by price descending

| Field | Value |
|-------|-------|
| **ID** | SRC-006 |
| **Priority** | P1 |
| **Tags** | `@regression` |
| **Description** | Pilih sort "Termahal" harus mengurutkan produk dari harga tertinggi ke terendah. |
| **Pre-condition** | Buka halaman `/kurostoreid/search` |
| **Steps** | 1. Navigate ke search page<br>2. Klik tab "Termahal" atau pilih sort price_desc<br>3. Tunggu response API dengan sort=price_desc<br>4. Verifikasi produk pertama memiliki harga >= produk kedua |
| **Expected Result** | API mengembalikan produk terurut price descending. |
| **Classification** | ✅ PASS |

### SRC-007: Price range filter — produk dalam rentang harga

| Field | Value |
|-------|-------|
| **ID** | SRC-007 |
| **Priority** | P2 |
| **Tags** | `@regression` |
| **Description** | Klik filter harga "Rp100k - Rp500k" harus menampilkan produk dengan harga dalam rentang tersebut. |
| **Pre-condition** | Buka halaman `/kurostoreid/search` |
| **Steps** | 1. Navigate ke search page<br>2. Klik filter harga "Rp100k - Rp500k"<br>3. Tunggu response API dengan price_min & price_max<br>4. Verifikasi semua produk memiliki harga 100000 <= price <= 500000 |
| **Expected Result** | API mengembalikan produk dalam rentang harga. UI menampilkan filter aktif. |
| **Classification** | ✅ PASS |

### SRC-008: Search dari header input — navigasi ke search page

| Field | Value |
|-------|-------|
| **ID** | SRC-008 |
| **Priority** | P1 |
| **Tags** | `@smoke` `@regression` |
| **Description** | Input keyword di search bar header dan tekan Enter harus redirect ke search page dengan query param. |
| **Pre-condition** | Buka halaman home `/kurostoreid` |
| **Steps** | 1. Buka halaman home<br>2. Isi search input dengan "test"<br>3. Tekan Enter<br>4. Verifikasi URL berubah menjadi `/search?q=test`<br>5. Verifikasi API products dipanggil dengan search=test |
| **Expected Result** | Navigasi ke search page dengan hasil pencarian. |
| **Classification** | ✅ PASS |

### SRC-009: Breadcrumb navigasi — Home link

| Field | Value |
|-------|-------|
| **ID** | SRC-009 |
| **Priority** | P2 |
| **Tags** | `@regression` |
| **Description** | Breadcrumb "Home" di search page harus navigate ke homepage. |
| **Pre-condition** | Buka halaman `/kurostoreid/search` |
| **Steps** | 1. Navigate ke search page<br>2. Klik breadcrumb "Home"<br>3. Verifikasi URL berubah menjadi `/kurostoreid` |
| **Expected Result** | Navigasi ke homepage. |
| **Classification** | ✅ PASS |

### SRC-010: Product card click — navigate to product detail

| Field | Value |
|-------|-------|
| **ID** | SRC-010 |
| **Priority** | P1 |
| **Tags** | `@regression` |
| **Description** | Klik product card harus navigate ke halaman detail produk. |
| **Pre-condition** | Buka halaman `/kurostoreid/search?q=charger` |
| **Steps** | 1. Buka search page dengan hasil<br>2. Klik product card pertama<br>3. Verifikasi URL berubah menjadi `/kurostoreid/charger-5v`<br>4. Verifikasi halaman detail produk muncul |
| **Expected Result** | Navigasi ke product detail page. |
| **Classification** | ✅ PASS |

### SRC-011: @error-handling API 500 — error handling products

| Field | Value |
|-------|-------|
| **ID** | SRC-011 |
| **Priority** | P2 |
| **Tags** | `@error-handling` |
| **Description** | Jika API products mengembalikan 500, UI harus menampilkan error toast atau fallback. |
| **Pre-condition** | Route interception untuk return 500 |
| **Steps** | 1. Intercept API products untuk return 500<br>2. Navigate ke search page<br>3. Verifikasi UI menampilkan error notification |
| **Expected Result** | Error toast muncul atau empty state. Tidak crash. |
| **Classification** | ✅ PASS (error handling) |

### SRC-012: Product count display — total_count sesuai

| Field | Value |
|-------|-------|
| **ID** | SRC-012 |
| **Priority** | P2 |
| **Tags** | `@regression` |
| **Description** | Jumlah produk yang ditampilkan di UI harus sesuai dengan `total_count` dari API. |
| **Pre-condition** | Buka halaman `/kurostoreid/search` |
| **Steps** | 1. Navigate ke search page<br>2. Tangkap response API products<br>3. Verifikasi teks jumlah produk di UI (e.g., "N products")<br>4. Bandingkan dengan `body.data.total_count` |
| **Expected Result** | UI count === API total_count. |
| **BUG_APP Detection** | Jika UI count != API total_count → BUG_APP |
| **Classification** | ⚠️ BUG_APP jika mismatch |

### SRC-013: Subcategory filter — produk sesuai subkategori

| Field | Value |
|-------|-------|
| **ID** | SRC-013 |
| **Priority** | P2 |
| **Tags** | `@regression` |
| **Description** | Filter dengan subcategory harus mengembalikan produk sesuai subkategori. |
| **Pre-condition** | Buka halaman dengan subcategory param |
| **Steps** | 1. Navigate ke `/kurostoreid/search?category=mouse&subcategory=mouse%20gaming`<br>2. Tunggu API response<br>3. Verifikasi produk yang muncul memiliki sub_category "mouse gaming" |
| **Expected Result** | API mengembalikan produk dengan subkategori yang sesuai. |
| **Classification** | ✅ PASS |

### SRC-014: XSS in search description — API tidak melakukan sanitasi

| Field | Value |
|-------|-------|
| **ID** | SRC-014 |
| **Priority** | P2 |
| **Tags** | `@regression` `@security` |
| **Description** | Produk "Charger 5V" memiliki description berisi `<script><b>test</b>alert('a')</script>`. API mengembalikan description tanpa sanitasi. UI harus menampilkan dengan aman (tidak execute script). |
| **Pre-condition** | Buka halaman `/kurostoreid/search?q=charger` |
| **Steps** | 1. Buka search page dengan keyword "charger"<br>2. Verifikasi produk "Charger 5V" muncul<br>3. Klik produk untuk ke detail page<br>4. Verifikasi description tidak mengeksekusi script |
| **Expected Result** | Halaman tidak crash. Script tidak tereksekusi. |
| **Classification** | ✅ OBSERVATION (no documented requirement about sanitization) |

### SRC-015: @error-handling API timeout — loading state

| Field | Value |
|-------|-------|
| **ID** | SRC-015 |
| **Priority** | P2 |
| **Tags** | `@error-handling` `@slow` |
| **Description** | Jika API products lambat, UI harus menampilkan loading state (spinner/skeleton). |
| **Pre-condition** | Route interception untuk delay response |
| **Steps** | 1. Intercept API products dengan delay 5 detik<br>2. Navigate ke search page<br>3. Verifikasi loading spinner visible<br>4. Tunggu response<br>5. Verifikasi products muncul |
| **Expected Result** | Loading state muncul selama API processing. Products muncul setelah response. |
| **Classification** | ✅ PASS |
