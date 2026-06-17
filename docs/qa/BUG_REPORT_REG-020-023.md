# Bug Report

**ID Test:** REG-020, REG-023

**Judul:** Tidak ada validasi nomor telepon — API menerima input tidak valid (1 digit, mengandung huruf)

**Klasifikasi:** BUG_APP

**Deskripsi:**
Field nomor telepon tidak memiliki validasi apapun — baik client-side maupun server-side. API mengembalikan 200 SUCCESS untuk input yang jelas tidak valid seperti "1" (1 digit), "abc", dan "08abc12345". Seharusnya ada validasi format minimal (misal: minimal 8 digit, hanya angka).

**Test Cases Terkait:**
| ID | Input | API Status | API Message | Status |
|----|-------|-----------|-------------|--------|
| REG-016 | "abc" | 200 | "Registration successful" | BUG_APP |
| REG-020 | "1" | 200 | "Registration successful" | BUG_APP |
| REG-023 | "08abc12345" | 200 | "Registration successful" | BUG_APP |

**Langkah Reproduksi (contoh REG-020):**

1. Buka halaman Register
2. Isi semua field dengan data valid, kecuali phone = "1" (1 digit)
3. Klik Register
4. API mengembalikan 200 SUCCESS — akun berhasil dibuat

**Expected:**
API mengembalikan 400 dengan validation error "Phone number is not valid" atau minimal client-side validation muncul.

**Actual:**
API mengembalikan 200 — akun berhasil dibuat dengan nomor telepon "1" atau "abc".

**Response API (REG-020):**

```json
{
  "status": true,
  "message": "Registration successful. Please log in.",
  "data": null
}
```

**Catatan:**
- HTML attribute `maxlength`, `minlength`, dan `pattern` pada input phone semuanya null
- Tidak ada Zod validation untuk format phone
- Server-side class-validator tidak memvalidasi format phone
- Ini bisa menyebabkan data kotor di database

**Status:** Open
