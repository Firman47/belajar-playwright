# Bug Report

**ID Test:** REG-003

**Judul:** UI toast tidak menampilkan pesan error API — "Email is already registered"

**Langkah Reproduksi:**
1. Buka halaman Register
2. Isi field email dengan email yang sudah terdaftar
3. Isi field lainnya dengan data valid
4. Klik tombol Submit
5. Amati toast yang muncul

**Expected:**
Toast description menampilkan pesan dari API: "Email is already registered"

**Actual:**
Toast description menampilkan pesan generic: "Registration failed"

**Response API:**
```json
{
  "status": 409,
  "body": {
    "message": "Email is already registered"
  }
}
```

**Bukti:**
* Playwright test `expect(toastDescription).toHaveText("Email is already registered")` FAILS
* Locator `[data-slot="description"]` resolves to `<div data-slot="description">Registration failed</div>`
* HTTP status 409 sudah benar, tetapi frontend tidak menggunakan `message` dari response API untuk toast description

**Root Cause:**
Frontend tidak meneruskan `message` dari response API ke toast description. Sebagai gantinya, frontend menggunakan string hardcoded/generic "Registration failed".

**Status:**
Open
