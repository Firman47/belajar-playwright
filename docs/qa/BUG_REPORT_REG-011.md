# Bug Report

**ID Test:** REG-011

**Judul:** Field password tidak memiliki validasi max-length

**Langkah Reproduksi:**
1. Buka halaman Register
2. Klik field password
3. Ketikkan karakter melebihi batas maksimal (misal 300 karakter)

**Expected:**
Field password memiliki atribut `maxlength` (contoh: 255) sehingga input dibatasi di sisi klien.

**Actual:**
Field password tidak memiliki atribut `maxlength` (null). Pengguna dapat mengetikkan karakter tanpa batas.

**Response API:**
N/A — tidak ada validasi dari sisi klien

**Bukti:**
* Playwright test `expect(await passwordInput.getAttribute("maxlength")).not.toBeNull()` FAILS
* Atribut `maxlength` pada elemen input password adalah `null`

**Root Cause:**
Validasi skema Zod tidak menyertakan constraint `max-length` pada field password, sehingga komponen input tidak merender atribut `maxlength`.

**Status:**
Open
