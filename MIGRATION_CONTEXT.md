# 📋 DOKUMEN MIGRASI & RIWAYAT KONTEKS PENGEMBANGAN (KATAJI BARBER)

Dokumen ini disiapkan untuk menjaga kesinambungan (*context continuity*) pengembangan sistem **Kataji Barber** setelah migrasi workspace dari `C:\xampp\htdocs\KELOMPOK-5` ke `D:\laragon\www\KELOMPOK-5`.

---

## 1. Profil & Peran Pengembang
- **Nama Pengembang / Role:** Faqih Huddin SM – **Frontend Developer**
- **Rekan Tim:**
  - **Backend Developer:** Zaki (Pemilik API & Database)
  - **UI/UX Designer:** Farid (Desain Figma)
  - **Stakeholder:** Owner Kataji Barbering & Hair Studio
- **Batasan & Aturan Kerja:**
  - Hanya mengerjakan lingkup **Frontend** (`pages/`, `assets/css/`, `assets/js/`, `includes/`).
  - Tidak memodifikasi logika Backend (API) kecuali file konfigurasi statis (`config/barbershop.php`). Bila ada API BE yang belum sesuai, komunikasikan lewat user untuk diteruskan ke Zaki (BE).
  - Wajib menyertakan tag komentar di setiap pengerjaan kode:
    `/* [Card X.Y] Frontend Developer (Faqih) - Penjelasan kegunaan kode */`

---

## 2. Status Fitur yang Sudah Diselesaikan (Sprint 3 & Sprint 4)

### ✅ Card [5.2] Riwayat Layanan per Pelanggan (Sprint 3 | SP: 3 | WBS 5.2)
- **Status:** **Selesai (100%)**
- **User Story:** Owner melihat riwayat layanan yang pernah diambil seorang pelanggan (misal: "Budi") terurut dari kunjungan terbaru ke lama.
- **Implementasi Frontend:**
  - Halaman [pelanggan.php](file:///D:/laragon/www/KELOMPOK-5/pages/pelanggan.php) & script `pelanggan.js`.
  - Pelanggan dengan 0 transaksi / belum pernah berkunjung difilter/ditampilkan sesuai desain.
  - Kartu profil pelanggan aktif dengan timeline kunjungan terbaru bertanda badge *"Terbaru"*.
  - Animasi loading spinner dashboard saat data profil dimuat.

### ✅ Card [6.7] Ekspor Laporan Bulanan ke PDF (Sprint 4 | SP: 5 | WBS 6.7)
- **Status:** **Selesai (100%)**
- **User Story:** Owner mengekspor rekap pemasukan dan pengeluaran bulanan ke dokumen PDF dan melihat tabel rekap di web.
- **Implementasi Frontend & Template:**
  1. **Halaman & Kontrol Pemilih Bulan:**
     - Input periode bulan bawaan bulan berjalan (WIB) dengan rentang tanggal otomatis (`1 Oktober 2026 00.00 – 31 Oktober 2026 23.59 WIB`).
     - Native month picker terintegrasi (`.showPicker()` saat kotak diklik).
  2. **Ringkasan Keuangan (3 Kartu KPI):**
     - Total Pemasukan, Total Pengeluaran, Saldo Bersih (latar navy `#17186B`).
     - Skala ukuran font disesuaikan proporsional dengan Figma (judul 24px, nominal 20px).
  3. **Tabel Rekap Bulanan (Tab Pemasukan & Tab Pengeluaran):**
     - Tab Pemasukan & Pengeluaran dipisahkan dengan border individual (bukan kapsul menyatu).
     - **Tab Pengeluaran** disesuaikan 100% dengan mockup Figma terbaru:
       Kolom: `No` | `ID Pengeluaran` (`EXP-000X`) | `Tanggal & Waktu` | `Keterangan` | `Kategori` | `Metode` (`Tunai` navy, `Transfer` indigo, `QRIS` hijau) | `Nominal`.
       Footer paginasi: *"Menampilkan X - Y dari Z pengeluaran"*.
  4. **Modal Dialog Konfirmasi & Pratinjau (Preview):**
     - Dialog konfirmasi ekspor memuat rincian periode dan tombol *Preview* & *Ekspor PDF*.
     - Modal pratinjau responsif dengan class `.has-pdf`: ringkas saat kosong/error dan membesar hanya saat file PDF dimuat ke iframe.
     - Tombol Tutup & Ekspor PDF selalu rapi di dalam footer modal.
  5. **Template PDF Resmi Kataji Barber:**
     - File [laporan_pdf.php](file:///D:/laragon/www/KELOMPOK-5/api/lib/laporan_pdf.php).
     - Memuat Logo resmi Kataji Barber (`assets/img/logo-kataji.png`), Kop surat ganda (garis tebal + tipis).
     - Meta informasi laporan periode & waktu pembuatan WIB.
     - Tabel Bagian A (Pemasukan per Barber & Total), Bagian B (Layanan Terlaris), Bagian C (Pengeluaran per Kategori & Total), Bagian D (Saldo Bersih).
     - Catatan: *"HPP layanan tidak dihitung dalam laporan ini."*
     - Tanda tangan Mengetahui Owner di kanan bawah.
     - Footer otomatis: *"Laporan dibuat otomatis oleh Kataji Barber Management & Information System"* dan *"Halaman 1 dari 1"*.

---

## 3. Panduan Setup Lingkungan Baru (Laragon)

1. **Lokasi File:**
   - Direktori aktif baru: `D:\laragon\www\KELOMPOK-5`
2. **Koneksi Database MySQL Laragon:**
   - Pastikan service **MySQL** di Laragon sudah dinyalakan (*Start All*).
   - Buka HeidiSQL / phpMyAdmin Laragon, buat database: `kataji_barber`.
   - Import file skema: [database/schema.sql](file:///D:/laragon/www/KELOMPOK-5/database/schema.sql).
   - Pengaturan kredensial di [config/config.php](file:///D:/laragon/www/KELOMPOK-5/config/config.php):
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'kataji_barber');
     define('DB_USER', 'root'); // default Laragon
     define('DB_PASS', '');     // default Laragon kosong
     ```
3. **Akses Web:**
   - Jalankan via URL: `http://localhost/KELOMPOK-5/` (direkomendasikan agar seluruh absolute path `/KELOMPOK-5/...` di JS dan CSS tetap bekerja sempurna tanpa perlu perubahan path).
4. **Akun Pengujian Owner:**
   - Buka `/pages/login.php`.
   - Login menggunakan akun owner (sesuai data seed database / instruksi user).

---

## 4. Prompt Siap Pakai untuk Sesi Antigravity di Folder Baru

Saat Anda membuka folder `D:\laragon\www\KELOMPOK-5` di sesi Antigravity baru, Anda cukup mengirim pesan berikut:

> *"Halo Antigravity, kita melanjutkan project KATAJI BARBER yang sudah dimigrasikan ke D:\laragon\www\KELOMPOK-5. Saya adalah Faqih (Frontend Developer). Silakan baca MIGRATION_CONTEXT.md untuk melihat seluruh riwayat tugas yang sudah selesai (Card 5.2 dan Card 6.7). Sekarang kita lanjutkan ke kartu/tugas berikutnya."*

