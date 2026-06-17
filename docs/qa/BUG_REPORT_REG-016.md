# Bug Report

**ID Test:** REG-016

**Judul:** Tidak ada validasi format nomor telepon — API menerima string non-numeric

**Klasifikasi:** BUG_APP

**Langkah Reproduksi:**
1. Buka halaman Register
2. Isi field Phone Number dengan string non-numeric (misal: "abc")
3. Isi field lainnya dengan data valid
4. Klik tombol Register
5. Amati response API dan redirect

**Expected:**
- Client-side: validasi format nomor telepon muncul (misal: "Please enter a valid phone number")
- ATAU Server-side: API mengembalikan error (400/422) dengan pesan format tidak valid

**Actual:**
- Tidak ada validasi client-side untuk format phone
- API mengembalikan 200 dengan `{"status":true,"message":"Registration successful. Please log in."}`
- User berhasil registrasi dengan nomor telepon "abc"
- Redirect ke halaman login

**Response API:**
```json
{
  "status": 200,
  "body": {
    "status": true,
    "message": "Registration successful. Please log in.",
    "data": null
  }
}
```

**Bukti:**
* Playwright test `expect(apiResponseStatus).not.toBe(200)` FAILS — API return 200
* Tidak ada validasi client-side (Zod schema) untuk format phone number
* Tidak ada validasi server-side untuk format phone number

**Root Cause:**
Baik client-side (Zod validation schema) maupun server-side tidak memiliki validasi format untuk field `phone_number`. Field hanya di-cek required-nya, tidak ada validasi apakah input berupa nomor telepon yang valid.

**Status:**
Open
