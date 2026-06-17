# Bug Report

**ID Test:** REG-007

**Judul:** UI toast tidak menampilkan pesan error API — "Username is already taken"

**Langkah Reproduksi:**
1. Buka halaman Register
2. Isi field username dengan username yang sudah terdaftar
3. Isi field lainnya dengan data valid
4. Klik tombol Submit
5. Amati toast yang muncul

**Expected:**
Toast description menampilkan pesan dari API: "Username is already taken"

**Actual:**
Toast description menampilkan pesan generic: "Registration failed"

**Response API:**
```json
{
  "status": 409,
  "body": {
    "message": "Username is already taken"
  }
}
```

**Bukti:**
* Playwright test `expect(toastDescription).toHaveText("Username is already taken")` FAILS
* Locator `[data-slot="description"]` resolves to `<div data-slot="description">Registration failed</div>`
* HTTP status 409 sudah benar, tetapi frontend tidak menggunakan `message` dari response API untuk toast description

**Root Cause:**
Frontend tidak meneruskan `message` dari response API ke toast description. Sebagai gantinya, frontend menggunakan string hardcoded/generic "Registration failed". Sama dengan REG-003 — bug ini adalah kasus yang sama dengan endpoint/pesan error berbeda.

**Status:**
Open
