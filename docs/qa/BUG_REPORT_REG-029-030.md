# Bug Report

**ID Test:** REG-029, REG-030

**Judul:** Tidak ada sanitasi input — XSS dan SQL Injection payload diterima API dengan 200 SUCCESS

**Klasifikasi:** BUG_APP

**Deskripsi:**
Field Full Name (dan kemungkinan field text lainnya) tidak memiliki sanitasi input. API mengembalikan 200 SUCCESS untuk payload XSS (`<script>alert("xss")</script>`) dan SQL Injection (`Robert'; DROP TABLE users; --`). Ini adalah security vulnerability yang serius.

**Test Cases Terkait:**
| ID | Input | API Status | API Message |
|----|-------|-----------|-------------|
| REG-029 | `<script>alert("xss")</script>` | 200 | "Registration successful" |
| REG-030 | `Robert'; DROP TABLE users; --` | 200 | "Registration successful" |

**Langkah Reproduksi (REG-029):**

1. Buka halaman Register
2. Isi Full Name dengan `<script>alert("xss")</script>`
3. Isi field lain dengan data valid
4. Klik Register
5. API mengembalikan 200 SUCCESS

**Expected:**
- API harus mengembalikan 400 dengan pesan "Input contains invalid characters"
- Atau minimal melakukan sanitasi (strip HTML tags, escape SQL characters)
- Jangan pernah menyimpan XSS/SQLi payload ke database

**Actual:**
API mengembalikan 200 SUCCESS — payload berbahaya diterima dan kemungkinan disimpan ke database.

**Response API (REG-029):**

```json
{
  "status": true,
  "message": "Registration successful. Please log in.",
  "data": null
}
```

**Impact:**
- **XSS (REG-029):** Jika data ini ditampilkan di halaman lain (misal dashboard admin, profile page), script akan execute di browser korban.
- **SQL Injection (REG-030):** Jika input tidak di-escape sebelum query, attacker bisa memanipulasi database.

**Recommendasi:**
1. Implementasi sanitasi di server-side (strip HTML tags, escape SQL)
2. Jangan pernah percaya user input — validasi dan sanitasi selalu dilakukan di backend
3. Gunakan ORM dengan parameterized queries (seharusnya sudah, tapi perlu diverifikasi)
4. Tambahkan CSP headers untuk mitigasi XSS
5. Field text lain (Username, Email, Phone) juga harus diperiksa

**Status:** Open
