# Backend Tasks per Endpoint

Dokumen ini berisi daftar task untuk tim backend berdasarkan endpoint yang sudah dipakai frontend.

## Aturan Umum (berlaku untuk semua task)

- Gunakan response envelope konsisten: `{ status, message, data }`.
- Gunakan HTTP status semantik (`2xx`, `4xx`, `5xx`) sesuai kontrak di `docs/API_DOCUMENTATION.md`.
- Semua endpoint protected wajib membaca cookie session (`access_token`) dan mengembalikan `401` jika tidak valid.
- Pastikan semua field response mengikuti shape yang sudah dikonsumsi frontend.

### Aturan Khusus Endpoint Transaksi/Order

- Payload transaksi **wajib** menyertakan 3 komponen utama: `items`, `address`, dan `expedition`.
- `address` dan `expedition` harus disimpan sebagai **snapshot saat checkout** (tidak berubah walau user mengubah master address setelah order dibuat).
- Minimal endpoint yang wajib mengembalikan data tersebut: `GET /orders`, `GET /orders/:id`, `GET /payment/:order_id`.

---

## Authentication

### BE-001 - Implement `POST /auth/login`
Penjelasan: Buat endpoint login dengan input `username` (username/email) dan `password`, validasi user aktif, set cookie `access_token` + `refresh_token`, lalu kembalikan profil user tersanitasi.

### BE-002 - Implement `POST /auth/google`
Penjelasan: Buat endpoint login Google berbasis ID token (`credential`), verifikasi token server-side (issuer, audience, signature), auto-create user bila belum ada, set cookie auth yang sama seperti login biasa.

### BE-003 - Implement `POST /auth/register`
Penjelasan: Buat endpoint registrasi user baru dengan validasi field wajib, cek unique email/username, simpan user role `customer`, dan kembalikan response sukses tanpa expose password.

### BE-004 - Implement `POST /auth/logout`
Penjelasan: Buat endpoint logout untuk menghapus/expire cookie session (`access_token`, `refresh_token`) dan mengembalikan response sukses standar.

### BE-005 - Implement `POST /auth/forgot-password`
Penjelasan: Buat endpoint request OTP reset password, validasi email terdaftar, generate OTP/token reset, simpan TTL, dan trigger kanal pengiriman (email provider).

### BE-006 - Implement `POST /auth/verify-otp`
Penjelasan: Buat endpoint verifikasi OTP untuk reset password, validasi OTP + TTL + single-use behavior, dan simpan status verifikasi sementara untuk step reset password.

### BE-007 - Implement `POST /auth/reset-password`
Penjelasan: Buat endpoint final reset password yang hanya bisa dipakai setelah OTP valid, update password ter-hash, revoke token verifikasi, dan cegah reuse.

---

## Store Profile

### BE-008 - Implement `GET /store/:slug`
Penjelasan: Sediakan endpoint profil toko berdasarkan slug untuk kebutuhan branding frontend (logo, about, contact, social links, config).

---

## Current User

### BE-009 - Implement `GET /me`
Penjelasan: Buat endpoint ambil profil user login dari session aktif, return data user tanpa informasi sensitif.

### BE-010 - Implement `PUT /me`
Penjelasan: Buat endpoint update profil user (parsial), validasi konflik email/username (`409`), dan return data user terbaru.

### BE-011 - Implement `PUT /me/password`
Penjelasan: Buat endpoint ubah password dengan validasi `old_password`, rule minimum password, kesesuaian konfirmasi, lalu simpan password ter-hash.

---

## Banner, Category, Product Catalog

### BE-012 - Implement `GET /banner`
Penjelasan: Sediakan endpoint banner aktif untuk homepage, termasuk field navigasi (`link`) dan status aktif.

### BE-013 - Implement `GET /categories`
Penjelasan: Sediakan endpoint kategori parent-child (nested) sesuai kebutuhan menu dan filter frontend.

### BE-014 - Implement `GET /products`
Penjelasan: Buat endpoint listing produk dengan dukungan search, filter category slug, sort, filter harga, dan pagination.

### BE-015 - Implement `GET /products/:slug`
Penjelasan: Buat endpoint detail produk lengkap (variants, colors, reviews, review_count, parent_category) untuk halaman detail.

### BE-016 - Implement `GET /products/:slug/related`
Penjelasan: Buat endpoint rekomendasi produk terkait (prioritas kategori sama), fallback ke produk lain saat kandidat terbatas.

---

## Cart

### BE-017 - Implement `GET /cart`
Penjelasan: Buat endpoint cart user login dengan item snapshot + `unit_price` + subtotal + total item.

### BE-018 - Implement `POST /cart`
Penjelasan: Buat endpoint tambah item ke cart dengan dukungan varian/warna, default value saat kosong, serta merge quantity untuk kombinasi item yang sama.

### BE-019 - Implement `PUT /cart/:id`
Penjelasan: Buat endpoint update quantity item cart dengan validasi minimum quantity dan ownership item.

### BE-020 - Implement `DELETE /cart/:id`
Penjelasan: Buat endpoint hapus item cart berdasarkan `id` milik user login.

---

## Address

### BE-021 - Implement `GET /address`
Penjelasan: Buat endpoint daftar alamat milik user login dengan format yang dipakai frontend checkout/setting.

### BE-022 - Implement `POST /address`
Penjelasan: Buat endpoint tambah alamat baru dengan validasi field wajib dan aturan `is_primary` (hanya satu alamat utama).

### BE-023 - Implement `PUT /address/:id`
Penjelasan: Buat endpoint update alamat (partial update), validasi ownership, dan konsistensi primary address.

### BE-024 - Implement `DELETE /address/:id`
Penjelasan: Buat endpoint hapus alamat milik user login dengan guard untuk kasus alamat tidak ditemukan.

---

## Regions (RajaOngkir Integration)

> **Note:** All region endpoints are proxied through Nuxt server to RajaOngkir API with 24-hour caching. Authentication is required.

### BE-025 - Implement `GET /regions/provinces`
Penjelasan: Proxy ke RajaOngkir `/destination/province`. Return daftar provinsi dengan `code` dan `name`. Requires auth.

### BE-026 - Implement `GET /regions/cities`
Penjelasan: Proxy ke RajaOngkir `/destination/city/{province_code}`. Return daftar kota dengan `code`, `province_code`, `name`, `zip_code`. Requires auth.

### BE-027 - Implement `GET /regions/districts`
Penjelasan: Proxy ke RajaOngkir `/destination/district/{city_code}`. Return daftar kecamatan dengan `code`, `city_code`, `name`, `zip_code`. Requires auth.

### BE-028 - Implement `GET /regions/subdistricts`
Penjelasan: Proxy ke RajaOngkir `/destination/sub-district/{district_code}`. Return daftar kelurahan/desa dengan `code`, `district_code`, `name`, `zip_code`. Requires auth.

> **Renamed:** Endpoint ini sebelumnya bernama `/regions/villages`. Diubah ke `/regions/subdistricts` untuk selaras dengan terminologi RajaOngkir.

---

## Expedition, Voucher, Checkout

### BE-029 - Implement `GET /ekspedisi`
Penjelasan: Sediakan daftar ekspedisi aktif untuk opsi pengiriman pada checkout.

### BE-030 - Implement `GET /voucher`
Penjelasan: Sediakan daftar voucher aktif beserta rule diskon (type, value, min transaksi, max diskon).

### BE-031 - Implement `POST /voucher/validate`
Penjelasan: Buat endpoint validasi voucher terhadap subtotal cart (opsional subset `cart_item_ids`) dan return `discount_total` + `final_total`.

### BE-032 - Implement `POST /checkout`
Penjelasan: Buat endpoint checkout yang membuat order `pending_payment` secara atomik, menyimpan snapshot `items + address + expedition` sebagai data transaksi, menyimpan ringkasan voucher, set `payment_expired_at`, dan membersihkan item cart yang di-checkout.

---

## Orders

### BE-033 - Implement `GET /orders`
Penjelasan: Buat endpoint list order user login dengan filter status/search dan pagination, serta pastikan setiap order mengandung `items`, `address` (alamat transaksi), dan `expedition` (ekspedisi transaksi).

### BE-034 - Implement `GET /orders/:id`
Penjelasan: Buat endpoint detail order tunggal milik user login lengkap dengan `items`, `address`, `expedition`, dan metadata pembayaran.

### BE-035 - Implement `GET /orders/:id/tracking`
Penjelasan: Buat endpoint tracking order; return `409` saat tracking belum tersedia (bukan `404`), dan `404` hanya bila order tidak ditemukan/tidak dimiliki user.

### BE-036 - Implement `POST /orders/:id/review`
Penjelasan: Buat endpoint submit review per item order dengan validasi status order, validasi payload, dan behavior idempotent update untuk key `user+order+product`.

### BE-037 - Implement `POST /orders/:id/finish`
Penjelasan: Buat endpoint konfirmasi order selesai (transisi `delivered -> finished`), return `409` untuk state invalid.

---

## Payment

### BE-038 - Implement `GET /payment/:order_id`
Penjelasan: Buat endpoint info pembayaran untuk halaman QRIS; response wajib membawa `items`, `address`, dan `expedition` dari order transaksi. Return `409` bila order bukan `pending_payment`, dan `410` bila pembayaran kadaluarsa.

### BE-039 - Implement `POST /payment/:order_id`
Penjelasan: Buat endpoint konfirmasi pembayaran (simulasi webhook) untuk transisi `pending_payment -> processing`; return `409`/`410` sesuai state order.

---

## Chat

### BE-040 - Implement `POST /chat/session`
Penjelasan: Buat endpoint pembuatan sesi chat baru untuk menampung histori percakapan.

### BE-041 - Implement `GET /chat/:session_id`
Penjelasan: Buat endpoint ambil histori chat berdasarkan session id, return `404` jika sesi tidak ada.

### BE-042 - Implement `POST /chat/message`
Penjelasan: Buat endpoint kirim pesan non-streaming (text/attachment) yang menyimpan `user_message` dan `assistant_message` dalam schema yang sudah dipakai frontend.

### BE-043 - Implement `POST /chat/message-stream`
Penjelasan: Buat endpoint streaming SSE (`ack`, `token`, `done`) dengan kontrak request/response yang konsisten dengan endpoint non-streaming.

---

## Catatan Penyerahan ke Tim Backend

- Prioritaskan implementasi berurutan: Auth -> Catalog -> Cart/Address -> Checkout/Payment -> Orders -> Chat.
- Sebelum QA, pastikan contract check terhadap `docs/API_DOCUMENTATION.md` dilakukan endpoint per endpoint.
- Setelah semua endpoint selesai, lakukan smoke test end-to-end dari flow: login -> cart -> checkout -> payment -> order history.
