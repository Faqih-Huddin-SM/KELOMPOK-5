# API Contract — KATAJI Barber

## 1. Kontrak Alur Website Lama

| Dari                | Kondisi                               | Tujuan                                      |
| ------------------- | ------------------------------------- | ------------------------------------------- |
| `login_process.php` | Username/password kosong              | `/KELOMPOK-5/pages/login.php?error=empty`   |
| `login_process.php` | Username/password salah               | `/KELOMPOK-5/pages/login.php?error=invalid` |
| `login_process.php` | Login berhasil                        | `/KELOMPOK-5/pages/dashboard.php`           |
| `auth_check.php`    | Belum login, akses halaman terkunci   | `/KELOMPOK-5/pages/login.php`               |
| `auth_check.php`    | Sesi habis (lebih dari 30 menit idle) | `/KELOMPOK-5/pages/login.php?expired=1`     |

## Aturan Umum `error_code`

Setiap respons error berisi `success: false`, `message`, dan `error_code`.

`error_code` **selalu sama dengan nama status HTTP** respons tersebut. Penjelasan penyebab yang lebih spesifik (misalnya field mana yang tidak valid) ada pada `message`. Frontend dan pengujian otomatis memeriksa `error_code`, bukan teks `message`.

|  HTTP | `error_code`             | Contoh penyebab                                  |
| ----: | ------------------------ | ------------------------------------------------ |
| `400` | `BAD_REQUEST`            | JSON rusak, format tanggal salah, ID tidak valid |
| `401` | `UNAUTHORIZED`           | Belum login, sesi habis, username/password salah |
| `403` | `FORBIDDEN`              | Role tidak diizinkan, aksi tidak diperbolehkan   |
| `404` | `NOT_FOUND`              | Data tidak ditemukan                             |
| `405` | `METHOD_NOT_ALLOWED`     | Method HTTP tidak didukung                       |
| `409` | `CONFLICT`               | Data berubah saat diproses (hapus pengeluaran)   |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Content-Type tidak didukung                      |
| `422` | `UNPROCESSABLE_ENTITY`   | Isi input tidak lolos validasi                   |
| `500` | `INTERNAL_SERVER_ERROR`  | Kesalahan server                                 |

Contoh:

```json
{
  "success": false,
  "message": "Nominal harus lebih dari nol",
  "error_code": "UNPROCESSABLE_ENTITY"
}
```

## 2. API Contract — Login

### Login Pengguna

- **Method:** `POST`
- **Endpoint:** `/KELOMPOK-5/api/auth/login.php`
- **Tujuan:** Memverifikasi username dan password pengguna.
- **Content-Type:** `application/json`
- **Format respons:** JSON

Request body:

```json
{
  "username": "erik",
  "password": "password_pengguna"
}
```

Berhasil — `200 OK`:

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "id_user": 1,
    "username": "erik",
    "nama": "Nama Pengguna",
    "role": "owner"
  }
}
```

Data di atas hanya contoh format respons.

Catatan: hanya akun dengan `users.aktif = 1` yang dapat login. Sesi login berakhir otomatis setelah 30 menit tanpa aktivitas.

Penanganan kesalahan:

| Kondisi                       |  HTTP | `error_code`             |
| ----------------------------- | ----: | ------------------------ |
| JSON tidak valid              | `400` | `BAD_REQUEST`            |
| Username atau password kosong | `422` | `UNPROCESSABLE_ENTITY`   |
| Username atau password salah  | `401` | `UNAUTHORIZED`           |
| Content-Type tidak didukung   | `415` | `UNSUPPORTED_MEDIA_TYPE` |
| Method tidak didukung         | `405` | `METHOD_NOT_ALLOWED`     |
| Kesalahan internal            | `500` | `INTERNAL_SERVER_ERROR`  |

Contoh respons ketika kredensial salah:

```json
{
  "success": false,
  "message": "Username atau password salah.",
  "error_code": "UNAUTHORIZED"
}
```

### Hasil Pengujian Login

| Skenario                     | Status HTTP                  | Hasil           |
| ---------------------------- | ---------------------------- | --------------- |
| Username dan password benar  | `200 OK`                     | Login berhasil  |
| Username atau password salah | `401 Unauthorized`           | Login ditolak   |
| Content-Type tidak sesuai    | `415 Unsupported Media Type` | Request ditolak |
| Method selain POST           | `405 Method Not Allowed`     | Method ditolak  |

Pengujian dilakukan menggunakan Postman pada server lokal.

### Cek Sesi Login

- **Method:** `GET`
- **Endpoint:** `/KELOMPOK-5/api/auth/me.php`
- **Autentikasi:** Wajib login (role `owner` atau `barber`).
- **Tujuan:** Memeriksa apakah sesi masih valid dan mengambil identitas pengguna dari sesi.
- **Akun nonaktif:** setiap request ke endpoint yang dilindungi juga memeriksa bahwa akun masih aktif. Akun yang dinonaktifkan owner mendapat `401 UNAUTHORIZED` ("Akun Anda tidak aktif. Silakan hubungi owner.") dan sesinya diakhiri.

Berhasil — `200 OK`:

```json
{
  "success": true,
  "message": "Sesi login valid.",
  "data": {
    "id_user": 1,
    "nama": "Nama Pengguna",
    "role": "owner"
  }
}
```

Belum login atau sesi habis → `401 UNAUTHORIZED`.

## 3. API Contract — Layanan

**Base endpoint:** `/api/layanan/`

**Akses:** GET dapat diakses tanpa autentikasi berdasarkan implementasi saat ini. POST, PUT, PATCH, dan DELETE memerlukan sesi login dengan role owner.

### GET — Mengambil Daftar Layanan

- **Endpoint:** `GET /api/layanan/`
- **Body:** Tidak diperlukan.
- **Respons sukses:** `200 OK`
- **Perilaku:** Mengembalikan seluruh layanan, termasuk layanan nonaktif.

Contoh respons:

```json
{
  "success": true,
  "data": [
    {
      "id_layanan": 3,
      "nama_layanan": "Creambath",
      "harga": 100000,
      "hpp": 40000,
      "aktif": 1,
      "icon_layanan": "uploads/layanan/contoh.jpg"
    }
  ]
}
```

Nilai di atas hanya contoh format respons. `icon_layanan` dapat bernilai `null` jika layanan tidak memiliki ikon.

### POST — Menambahkan Layanan

- **Endpoint:** `POST /api/layanan/`
- **Content-Type:** `multipart/form-data` (bila mengunggah ikon) atau `application/json` (tanpa ikon).
- **Respons sukses:** `201 Created`

Field (form-data atau JSON):

| Field          | Tipe | Ketentuan                                         |
| -------------- | ---- | ------------------------------------------------- |
| `nama_layanan` | Text | Wajib, maksimal 100 karakter                      |
| `harga`        | Text | Wajib, bilangan bulat lebih dari 0                |
| `hpp`          | Text | Wajib, bilangan bulat 0 atau lebih                |
| `icon_layanan` | File | Opsional; JPG/JPEG, PNG, atau WebP; maksimal 2 MB |

Layanan baru dibuat dengan `aktif = 1`. Ikon disimpan pada folder `uploads/layanan/`, sedangkan database menyimpan path relatifnya.

Respons sukses berisi `message` (`Layanan berhasil ditambahkan.`) dan `data` berupa layanan yang baru dibuat (`id_layanan`, `nama_layanan`, `harga`, `hpp`, `aktif`, `icon_layanan`).

### PUT — Memperbarui Layanan

- **Endpoint logis:** `PUT /api/layanan/`
- **Metode upload yang digunakan:** `POST /api/layanan/` dengan field `_method=PUT` pada form-data.
- **Content-Type:** `multipart/form-data` (bila mengganti ikon) atau `application/json` (tanpa ikon).
- **Respons sukses:** `200 OK`

Field yang diperlukan: `id_layanan`, `nama_layanan`, `harga`, dan `hpp`. Field `icon_layanan` opsional.

Ketentuan:

- Layanan aktif maupun nonaktif dapat diedit.
- Jika ikon baru tidak dikirim, ikon lama dipertahankan.
- Jika ikon baru berhasil disimpan, ikon lama dihapus setelah pembaruan database berhasil.
- Jika ID tidak ditemukan, respons `404 Not Found`.

### PATCH — Mengubah Status Layanan

- **Endpoint:** `PATCH /api/layanan/`
- **Content-Type:** `application/json`
- **Respons sukses:** `200 OK`

Contoh menonaktifkan layanan:

```json
{
  "id_layanan": 3,
  "aktif": 0
}
```

Untuk mengaktifkan kembali, kirim `"aktif": 1`. Nilai yang didukung hanya `0` dan `1`; jika field `aktif` tidak dikirim, nilainya dianggap `0` (nonaktif). PATCH hanya menerima JSON, hanya mengubah status, dan tidak menghapus ikon.

### DELETE — Menghapus Layanan Permanen

- **Endpoint:** `DELETE /api/layanan/`
- **Content-Type:** `application/json`
- **Respons sukses:** `200 OK`

Contoh body:

```json
{
  "id_layanan": 3
}
```

Layanan dihapus permanen beserta file ikon yang terkait. Gunakan dengan hati-hati karena operasi ini tidak sama dengan menonaktifkan layanan.

Riwayat transaksi tidak ikut hilang: `detail_transaksi` menyimpan snapshot nama, harga, dan HPP layanan. Pada baris detail yang layanannya dihapus, kolom `id_layanan` diisi `NULL` (foreign key `ON DELETE SET NULL`), sehingga `id_layanan` pada respons detail transaksi dapat bernilai `null`.

### Kode Respons

| HTTP Status                 | Keterangan                            |
| --------------------------- | ------------------------------------- |
| `200 OK`                    | GET, PUT, PATCH, atau DELETE berhasil |
| `201 Created`               | Layanan berhasil dibuat               |
| `400 Bad Request`           | JSON tidak valid                      |
| `401 Unauthorized`          | Sesi login tidak valid                |
| `403 Forbidden`             | Role bukan owner                      |
| `404 Not Found`             | Layanan tidak ditemukan               |
| `405 Method Not Allowed`    | Method tidak didukung                 |
| `422 Unprocessable Content` | Validasi field atau ikon gagal        |
| `500 Internal Server Error` | Kesalahan server                      |

Respons kesalahan berisi `success: false`, `message`, dan `error_code` yang mengikuti nama status HTTP (lihat Aturan Umum `error_code`).

### Catatan Implementasi

- Tabel `layanan` memiliki kolom `hpp INT NULL` dan `icon_layanan VARCHAR(255) NULL` (lihat bagian 11, Skema Database).
- Upload ikon menerima JPG/JPEG, PNG, dan WebP dengan ukuran maksimal 2 MB.
- Folder `uploads/layanan/` harus dapat ditulisi oleh PHP.
- Permintaan perubahan data memerlukan autentikasi owner melalui sesi yang digunakan proyek.
- Untuk form-data PUT, Postman mengirim POST dengan `_method=PUT`; jangan mengatur header `Content-Type` secara manual.
- Hasil pengujian aktual harus dicatat setelah endpoint benar-benar diuji. Dokumentasi ini bukan bukti bahwa semua pengujian telah lulus.

## 4. API Contract — Transaksi

### Base URL Lokal

```text
{{base_url}} = http://localhost:8080/KELOMPOK-5
```

Semua endpoint transaksi memerlukan sesi login yang valid.

### 4.1 GET — Daftar Transaksi

**Endpoint:** `GET /api/transaksi/`

Mengambil daftar transaksi yang dapat diakses oleh pengguna yang sedang login.

Hak akses:

- **Owner:** dapat melihat semua transaksi.
- **Barber:** hanya dapat melihat transaksi yang dicatat oleh akunnya (`id_pencatat` = id pengguna yang login).
- Role lain ditolak `403 FORBIDDEN`.

Contoh respons sukses (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "id_transaksi": 1,
      "id_pencatat": 1,
      "id_barber": 2,
      "nama_barber": "Sandi",
      "id_pelanggan": 7,
      "nama_pelanggan": "Pelanggan Tes",
      "tanggal": "2026-10-13",
      "waktu": "09:00:00",
      "total_harga": 50000,
      "metode_pembayaran": "cash",
      "dibuat_pada": "2026-10-13 09:00:00"
    }
  ]
}
```

Contoh nilai di atas bukan data tetap. Transaksi lama yang belum memiliki pelanggan memiliki `id_pelanggan` dan `nama_pelanggan` bernilai `null`. Daftar dan detail transaksi tidak memuat `no_hp`.

Query parameter `tanggal` (opsional, `YYYY-MM-DD`): owner tanpa `tanggal` melihat semua tanggal, barber tanpa `tanggal` otomatis melihat hari ini (WIB). Transaksi yang sudah dihapus (soft delete) tidak ditampilkan. Format `tanggal` yang tidak valid ditolak `400 BAD_REQUEST`. Daftar diurutkan dari tanggal, waktu, dan ID terbaru.

Query parameter tambahan untuk halaman Riwayat (semua opsional, bisa digabung):

| Parameter | Keterangan |
| --- | --- |
| `q` | Pencarian: nama pelanggan mengandung kata itu, atau `id_transaksi` persis sama (`12` atau `#12`). Maks 100 karakter. |
| `id_barber` | Hanya transaksi barber tersebut. |
| `id_layanan` | Hanya transaksi yang memuat layanan tersebut. |
| `metode_pembayaran` | `cash`, `qris`, atau `transfer`. |
| `page` | Nomor halaman, minimal 1 (default 1). |
| `per_page` | Jumlah baris per halaman, 1–100 (default 10). |

Paginasi aktif bila `page` atau `per_page` dikirim. Tanpa keduanya semua data dikembalikan. Parameter yang tidak valid ditolak `400 BAD_REQUEST`. Barber tetap hanya melihat transaksi yang dicatatnya sendiri.

Setiap baris data memuat `layanan_teks`: nama layanan dipisah koma, layanan berjumlah lebih dari satu ditulis `Nama (3x)`, contoh `Potong rambut reguler, Creambath (3x)`. Respons juga memuat `meta`:

```json
"meta": { "page": 1, "per_page": 10, "total": 23, "total_pages": 3 }
```

Halaman yang melebihi `total_pages` mengembalikan `data: []` dengan status 200.

### 4.2 POST — Menambahkan Transaksi

**Endpoint:** `POST /api/transaksi/`

Request body menggunakan JSON dan harus memuat minimal satu layanan.

Contoh body untuk owner:

```json
{
  "id_barber": 2,
  "nama_pelanggan": "Pelanggan Tes",
  "metode_pembayaran": "qris",
  "layanan": [
    {
      "id_layanan": 1,
      "jumlah": 1
    }
  ]
}
```

Contoh body untuk barber:

```json
{
  "nama_pelanggan": "Pelanggan Tes",
  "metode_pembayaran": "cash",
  "layanan": [
    {
      "id_layanan": 1,
      "jumlah": 1
    }
  ]
}
```

#### Aturan Transaksi

- Owner wajib menentukan `id_barber` yang valid dan aktif.
- Barber yang login otomatis menjadi barber transaksi.
- `id_pencatat` diambil dari pengguna yang sedang login.
- `nama_pelanggan` wajib diisi dan tidak boleh hanya berisi spasi.
- Jika pelanggan baru, data pelanggan dibuat dan dihubungkan dengan transaksi.
- Jika pelanggan dipilih dari saran nama yang sudah ada, transaksi harus menggunakan `id_pelanggan` pelanggan tersebut.
- Memilih pelanggan yang sudah ada tidak boleh membuat baris pelanggan baru untuk orang yang sama hanya karena transaksi baru dicatat.
- Field `no_hp` **tidak diproses** oleh endpoint ini. Pelanggan baru disimpan hanya dengan nama.
- `nama_pelanggan` tetap wajib diisi walaupun `id_pelanggan` dikirim.
- `id_pelanggan` yang tidak ditemukan ditolak dengan `422` dan pesan `Pelanggan yang dipilih tidak ditemukan.`
- Jumlah per layanan 1 sampai 100; layanan yang sama yang dikirim berulang digabung, dengan total maksimal 100.
- Harga layanan diambil dari database, bukan dipercaya dari harga yang dikirim oleh klien.
- Metode pembayaran wajib dikirim dan harus bernilai `cash`, `qris`, atau `transfer`.
- Total harga dihitung oleh server dan tidak boleh melebihi 2.147.483.647.
- Hanya layanan **aktif** yang dapat dipakai; layanan yang tidak ditemukan atau nonaktif ditolak `422`.
- Nama pelanggan maksimal 100 karakter.
- Tanggal dan waktu transaksi diisi server memakai zona waktu `Asia/Jakarta` (WIB).
- Data transaksi dan detail layanan disimpan dalam satu transaksi database.

#### Validasi Nama Pelanggan

Jika `nama_pelanggan` kosong atau hanya berisi spasi, server harus menolak transaksi.

- **HTTP:** `422 Unprocessable Content`
- **`error_code`:** `UNPROCESSABLE_ENTITY`
- **Pesan:** `Nama pelanggan wajib diisi.`

Contoh respons:

```json
{
  "success": false,
  "message": "Nama pelanggan wajib diisi.",
  "error_code": "UNPROCESSABLE_ENTITY"
}
```

Respons di atas merupakan format yang harus digunakan apabila sesuai dengan implementasi endpoint yang sedang diperbarui.

#### Validasi Metode Pembayaran

Metode pembayaran yang diperbolehkan:

- `cash`
- `qris`
- `transfer`

Jika metode pembayaran tidak dikirim, kosong, atau bukan salah satu nilai di atas, API menolak transaksi dengan HTTP `422 Unprocessable Content`, `error_code` `UNPROCESSABLE_ENTITY`, dan pesan `Pilih metode pembayaran yang valid.` Form kasir menampilkan pesan `Pilih metode pembayaran` jika metode belum dipilih.

Respons sukses pembuatan transaksi adalah `201 Created`:

```json
{
  "success": true,
  "message": "Transaksi berhasil dicatat.",
  "data": {
    "id_transaksi": 16,
    "id_pencatat": 1,
    "id_barber": 2,
    "id_pelanggan": 8,
    "tanggal": "2026-10-28",
    "waktu": "14:40:02",
    "total_harga": 105000,
    "metode_pembayaran": "cash",
    "layanan": [
      {
        "id_layanan": 1,
        "nama_layanan": "Potong rambut reguler",
        "harga": 50000,
        "hpp_saat_transaksi": null,
        "jumlah": 1
      }
    ]
  }
}
```

### 4.3 Pencatatan dan Saran Pelanggan

Fitur saran nama pelanggan membantu pengguna kasir menemukan pelanggan yang sudah terdaftar.

Alur penggunaan:

1. Pengguna mengetik nama pelanggan pada form transaksi.
2. Antarmuka menampilkan saran pelanggan yang cocok, jika fitur saran tersedia.
3. Jika pengguna memilih saran, form menyimpan `id_pelanggan` yang sesuai.
4. Ketika transaksi dikirim, server menggunakan pelanggan yang dipilih dan tidak membuat data pelanggan duplikat.
5. Jika nama tersebut merupakan pelanggan baru, server menyimpan pelanggan baru dan menghubungkannya ke transaksi.
6. Server menolak transaksi jika nama pelanggan kosong atau hanya berisi spasi.

Contoh body ketika pelanggan yang sudah terdaftar dipilih:

```json
{
  "id_pelanggan": 7,
  "nama_pelanggan": "Pelanggan Tes",
  "metode_pembayaran": "cash",
  "layanan": [
    {
      "id_layanan": 1,
      "jumlah": 1
    }
  ]
}
```

Contoh body ketika pelanggan baru dicatat:

```json
{
  "nama_pelanggan": "Pelanggan Baru",
  "metode_pembayaran": "cash",
  "layanan": [
    {
      "id_layanan": 1,
      "jumlah": 1
    }
  ]
}
```

#### Endpoint Saran Nama Pelanggan

- **Method:** `GET`
- **URL:** `/api/pelanggan/index.php?q={nama}`
- **Autentikasi:** Wajib login.
- **Role yang diizinkan:** `owner`, `barber`.

Aturan:

- Jika `q` diisi (minimal 2 karakter): pencarian pada kolom nama dengan pola `%q%` (nama mengandung kata kunci), diurutkan nama A–Z, maksimal **100** hasil.
- Jika `q` diisi tetapi kurang dari 2 karakter (mis. `a`), respons tetap `200 OK` dengan `data` berupa array kosong (bukan error).
- Jika `q` tidak dikirim atau kosong: mengembalikan **daftar pelanggan** (nama A–Z, maksimal 100) untuk ditampilkan di tabel.
- Pelanggan yang sudah dihapus (soft delete) tidak ikut ditampilkan.
- Setiap data hanya berisi `id_pelanggan` dan `nama` (tidak ada `no_hp`).
- Method yang diterima hanya `GET` dan `DELETE`; method lain ditolak `405 Method Not Allowed` (header `Allow: GET, DELETE`).

Contoh request:

```http
GET {{base_url}}/api/pelanggan/index.php?q=And
```

Contoh respons sukses (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "id_pelanggan": 7,
      "nama": "Andi"
    }
  ]
}
```

#### Hapus Pelanggan (Soft Delete)

- **Method:** `DELETE`
- **URL:** `/api/pelanggan/index.php?id={id_pelanggan}` (atau body JSON `{"id_pelanggan": 7}`)
- **Role yang diizinkan:** hanya `owner` (barber mendapat `403 FORBIDDEN`).

Aturan:

- Data tidak dihapus dari database, hanya kolom `dihapus_pada` diisi. Riwayat transaksi lama tetap menampilkan nama pelanggan tersebut.
- Pelanggan yang sudah dihapus tidak muncul di saran nama/daftar, dan `POST /api/transaksi/index.php` dengan `id_pelanggan` tersebut ditolak `422` (`Pelanggan yang dipilih tidak ditemukan.`).
- ID tidak dikirim/tidak valid → `400 BAD_REQUEST`. ID tidak ada atau sudah dihapus → `404 NOT_FOUND`.

Contoh request:

```http
DELETE {{base_url}}/api/pelanggan/index.php?id=7
```

Contoh respons sukses (`200 OK`):

```json
{
  "success": true,
  "message": "Pelanggan berhasil dihapus."
}
```

Nama pelanggan boleh kembar (dua orang berbeda bernama sama). Untuk menghindari data ganda, kasir sebaiknya memilih dari saran nama sehingga `id_pelanggan` yang sama dipakai ulang.

Daftar data pelanggan yang tersimpan dapat berisi beberapa baris bernama sama (data lama dari sebelum fitur saran). Saat kasir memilih saran, kirim `id_pelanggan` yang dipilih agar tidak menambah data ganda.

### 4.4 GET — Detail Transaksi

**Endpoint:** `GET /api/transaksi/detail.php?id={id_transaksi}`

Contoh URL Postman:

```text
{{base_url}}/api/transaksi/detail.php?id=1
```

Mengambil informasi transaksi beserta rincian layanan, jumlah, harga saat transaksi, dan subtotal.

Hak akses:

- Owner dapat melihat detail semua transaksi.
- Barber hanya dapat melihat detail transaksi miliknya sendiri.

Respons sukses: `200 OK`. Transaksi yang sudah dihapus (soft delete) atau bukan milik barber yang login menghasilkan `404 NOT_FOUND`. Parameter `id` yang tidak valid atau tidak dikirim menghasilkan `400 BAD_REQUEST`.

Contoh respons:

```json
{
  "success": true,
  "data": {
    "id_transaksi": 1,
    "id_pencatat": 1,
    "id_barber": 2,
    "nama_barber": "Sandi",
    "id_pelanggan": 7,
    "nama_pelanggan": "Pelanggan Tes",
    "tanggal": "2026-10-13",
    "waktu": "09:00:00",
    "total_harga": 50000,
    "metode_pembayaran": "cash",
    "dibuat_pada": "2026-10-13 09:00:00",
    "layanan": [
      {
        "id_layanan": 1,
        "nama_layanan": "Potong rambut reguler",
        "harga": 50000,
        "hpp_saat_transaksi": null,
        "jumlah": 1,
        "subtotal": 50000
      }
    ]
  }
}
```

`id_layanan` pada rincian dapat bernilai `null` jika layanannya sudah dihapus permanen; nama, harga, dan HPP tetap tersedia dari snapshot saat transaksi.

### 4.5 Kode Respons Transaksi

| HTTP Status                 | Keterangan                                         |
| --------------------------- | -------------------------------------------------- |
| `200 OK`                    | Data berhasil diambil                              |
| `201 Created`               | Transaksi berhasil dibuat                          |
| `400 Bad Request`           | Format JSON atau input tidak valid                 |
| `401 Unauthorized`          | Belum login atau sesi tidak valid                  |
| `403 Forbidden`             | Role tidak diizinkan                               |
| `404 Not Found`             | Transaksi tidak ditemukan atau tidak dapat diakses |
| `405 Method Not Allowed`    | Method tidak didukung                              |
| `422 Unprocessable Content` | Validasi data gagal                                |
| `500 Internal Server Error` | Kesalahan server                                   |

### 4.6 Catatan Implementasi Transaksi

- Format respons menggunakan JSON.
- Detail transaksi menyimpan snapshot nama layanan (`nama_layanan_saat_transaksi`), harga (`harga_saat_transaksi`), dan HPP (`hpp_saat_transaksi`) ketika transaksi dibuat.
- Skema terbaru (`database/kataji_barber.sql`) sudah memuat semua kolom hasil migrasi (`metode_pembayaran`, `hpp`, `hpp_saat_transaksi`, `dihapus_pada`, `nama_layanan_saat_transaksi`, `icon_layanan`). Migrasi di `database/migrations/` hanya diperlukan untuk database lama yang belum memakai skema tersebut.
- Endpoint daftar dan detail transaksi menerapkan pembatasan akses berdasarkan role.
- Semua URL pengujian Postman menggunakan variabel `{{base_url}}` pada environment Postman `Local KELOMPOK-5`.

### 4.7 Hapus Riwayat Transaksi (Soft Delete)

Hanya **owner**. Data tidak benar-benar dihapus: kolom `dihapus_pada` diisi waktu penghapusan, sehingga transaksi tidak lagi muncul pada daftar, detail, maupun rekap.

| Endpoint                                                      | Parameter ID                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| `DELETE /api/transaksi/index.php?id={id_transaksi}`           | query `id`                                                 |
| `DELETE /api/transaksi/hapus.php?id_transaksi={id_transaksi}` | query `id_transaksi` atau body JSON `{"id_transaksi": 15}` |

Respons sukses (`200 OK`):

```json
{
  "success": true,
  "message": "Riwayat transaksi berhasil dihapus."
}
```

| HTTP Status              | Keterangan                                           |
| ------------------------ | ---------------------------------------------------- |
| `400 Bad Request`        | ID tidak valid atau tidak dikirim (`BAD_REQUEST`)    |
| `401 Unauthorized`       | Belum login atau sesi habis (`UNAUTHORIZED`)         |
| `403 Forbidden`          | Pengguna bukan owner (`FORBIDDEN`)                   |
| `404 Not Found`          | Transaksi tidak ada atau sudah dihapus (`NOT_FOUND`) |
| `405 Method Not Allowed` | Selain `DELETE` (khusus `hapus.php`)                 |

Catatan: `/api/transaksi/index.php` hanya menerima `GET`, `POST`, dan `DELETE` (header `Allow: GET, POST, DELETE`); method lain ditolak `405 METHOD_NOT_ALLOWED`. `detail.php` hanya menerima `GET`.

### 4.8 GET — Riwayat Layanan per Pelanggan

**Endpoint:** `GET /api/riwayat/pelanggan.php?id_pelanggan={id_pelanggan}`

Mengambil riwayat layanan yang pernah diambil satu pelanggan, berdasarkan tautan `transaksi.id_pelanggan` (lihat 4.3). Dipakai frontend untuk menampilkan riwayat kunjungan pelanggan.

- **Autentikasi:** Wajib login.
- **Role yang diizinkan:** `owner` dan `barber`. Barber dapat melihat riwayat semua transaksi pelanggan tersebut, tidak terbatas pada transaksi yang ia catat sendiri.
- **Method:** hanya `GET`; method lain ditolak `405 METHOD_NOT_ALLOWED` (header `Allow: GET`).

Query parameter:

| Parameter      | Wajib | Keterangan                             |
| -------------- | ----- | -------------------------------------- |
| `id_pelanggan` | Ya    | ID pelanggan (bilangan bulat positif). |

Contoh request:

```http
GET {{base_url}}/api/riwayat/pelanggan.php?id_pelanggan=7
```

Contoh respons sukses (`200 OK`):

```json
{
  "success": true,
  "data": {
    "pelanggan": {
      "id_pelanggan": 7,
      "nama": "Andi"
    },
    "jumlah_kunjungan": 2,
    "riwayat": [
      {
        "id_transaksi": 12,
        "tanggal": "2026-10-25",
        "waktu": "15:30:00",
        "id_layanan": 2,
        "nama_layanan": "Coloring",
        "jumlah": 1
      },
      {
        "id_transaksi": 12,
        "tanggal": "2026-10-25",
        "waktu": "15:30:00",
        "id_layanan": 3,
        "nama_layanan": "Creambath",
        "jumlah": 2
      },
      {
        "id_transaksi": 10,
        "tanggal": "2026-10-20",
        "waktu": "09:00:00",
        "id_layanan": 1,
        "nama_layanan": "Potong rambut reguler",
        "jumlah": 1
      }
    ],
    "ada_data": true
  }
}
```

Nilai di atas hanya contoh format respons.

Struktur data:

- `pelanggan`: identitas pelanggan (`id_pelanggan`, `nama`).
- `jumlah_kunjungan`: jumlah transaksi berbeda milik pelanggan tersebut.
- `riwayat`: daftar **satu baris per layanan** pada setiap transaksi. Transaksi multi-layanan (4.2) muncul sebagai beberapa baris dengan `id_transaksi`, `tanggal`, dan `waktu` yang sama; frontend dapat mengelompokkan berdasarkan `id_transaksi`.
- `tanggal` (`YYYY-MM-DD`) dan `waktu` (`HH:MM:SS`): waktu transaksi dicatat (WIB).
- `nama_layanan`: nama layanan saat transaksi (snapshot dari `detail_transaksi`), sehingga tetap benar walau nama layanan diubah atau layanannya dihapus.
- `id_layanan`: dapat bernilai `null` jika layanan sudah dihapus permanen.
- `jumlah`: jumlah layanan yang diambil pada transaksi tersebut.
- `ada_data`: `false` bila pelanggan belum memiliki riwayat.

Aturan:

- Urutan dari yang terbaru: `tanggal` menurun, lalu `waktu` menurun, lalu `id_transaksi` menurun. Baris layanan dalam satu transaksi mengikuti urutan pencatatan.
- Transaksi yang sudah dihapus (soft delete, `dihapus_pada` tidak NULL) tidak ikut.
- Pelanggan yang ada tetapi belum pernah bertransaksi (misalnya pelanggan baru) mengembalikan `200 OK` dengan `riwayat` berupa array kosong, `jumlah_kunjungan` bernilai `0`, dan `ada_data` bernilai `false`. Ini bukan error.
- Data tidak memuat harga, HPP, atau metode pembayaran.

Contoh respons untuk pelanggan tanpa transaksi (`200 OK`):

```json
{
  "success": true,
  "data": {
    "pelanggan": {
      "id_pelanggan": 8,
      "nama": "Pelanggan Baru"
    },
    "jumlah_kunjungan": 0,
    "riwayat": [],
    "ada_data": false
  }
}
```

Kode respons:

| HTTP Status                 | Keterangan                                                    |
| --------------------------- | ------------------------------------------------------------- |
| `200 OK`                    | Riwayat berhasil diambil (termasuk riwayat kosong)            |
| `400 Bad Request`           | `id_pelanggan` tidak dikirim atau tidak valid (`BAD_REQUEST`) |
| `401 Unauthorized`          | Belum login atau sesi habis (`UNAUTHORIZED`)                  |
| `403 Forbidden`             | Role tidak diizinkan (`FORBIDDEN`)                            |
| `404 Not Found`             | Pelanggan tidak ada atau sudah dihapus (`NOT_FOUND`)          |
| `405 Method Not Allowed`    | Method selain `GET` (`METHOD_NOT_ALLOWED`)                    |
| `500 Internal Server Error` | Kesalahan server (`INTERNAL_SERVER_ERROR`)                    |

## 5. API Rekap Pemasukan Harian — WBS 4.5

**Endpoint:** `GET /api/rekap/pemasukan.php`

**Akses:** Owner yang sudah login.

### Query Parameter

| Parameter | Wajib | Keterangan                                                                                                                                              |
| --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tanggal` | Tidak | Tanggal acuan dalam format `YYYY-MM-DD`. Jika tidak dikirim, endpoint menggunakan tanggal hari ini berdasarkan zona waktu WIB (`Asia/Jakarta`).         |
| `periode` | Tidak | `hari` (default), `minggu` (Senin–Minggu yang memuat tanggal acuan), atau `bulan` (bulan kalender yang memuat tanggal acuan). Nilai lain ditolak `422`. |

### Contoh Request

```http
GET {{base_url}}/api/rekap/pemasukan.php
GET {{base_url}}/api/rekap/pemasukan.php?tanggal=2026-10-19
GET {{base_url}}/api/rekap/pemasukan.php?tanggal=2026-10-19&periode=minggu
```

### Contoh Respons Sukses

```json
{
  "success": true,
  "data": {
    "periode": "hari",
    "tanggal_acuan": "2026-10-19",
    "tanggal_awal": "2026-10-19",
    "tanggal_akhir": "2026-10-19",
    "total_pemasukan": 150000,
    "jumlah_transaksi": 2,
    "rincian_per_barber": [
      {
        "id_barber": 2,
        "nama_barber": "Nama Barber",
        "jumlah_transaksi": 2,
        "total_pemasukan": 150000
      }
    ],
    "ada_data": true
  }
}
```

Nilai di atas hanya contoh.

### Struktur Data

- `periode`: periode yang dipakai (`hari`, `minggu`, atau `bulan`).
- `tanggal_acuan`: tanggal yang dikirim (atau hari ini WIB jika tidak dikirim).
- `tanggal_awal` dan `tanggal_akhir`: batas rentang rekap (sama dengan tanggal acuan untuk periode `hari`).
- `total_pemasukan`: total `total_harga` seluruh transaksi dalam rentang tersebut.
- `jumlah_transaksi`: jumlah transaksi dalam rentang tersebut.
- `ada_data`: `false` bila tidak ada transaksi pada rentang tersebut.
- `rincian_per_barber`: daftar pemasukan yang dikelompokkan berdasarkan barber.
- `id_barber`: ID user barber.
- `nama_barber`: nama barber.
- `jumlah_transaksi`: jumlah transaksi barber pada periode tersebut.
- `total_pemasukan` di dalam setiap item: total pemasukan barber pada periode tersebut.

### Ketentuan

- Rekap menggunakan data transaksi dari tabel `transaksi`; transaksi yang sudah dihapus (`dihapus_pada` tidak NULL) tidak dihitung.
- Tanggal transaksi mengikuti tanggal yang dicatat dalam zona waktu WIB.
- Rentang tanpa transaksi tetap mengembalikan respons sukses (`200 OK`), dengan `total_pemasukan` dan `jumlah_transaksi` bernilai `0`, `rincian_per_barber` berupa array kosong, dan `ada_data` bernilai `false`.
- Format tanggal atau nilai `periode` yang tidak valid ditolak dengan `422 Unprocessable Entity`.
- Pengguna yang belum login harus melewati autentikasi terlebih dahulu.
- Pengguna selain owner ditolak dengan `403 Forbidden`.
- Method selain `GET` ditolak dengan `405 Method Not Allowed`.

### Kesepakatan dengan Frontend (Kartu 4.8)

Format respons rekap mingguan dan bulanan sudah dikonfirmasi cocok dengan pemakaian frontend (`assets/js/pemasukan.js`, `assets/js/dashboard.js`):

- Field yang dipakai frontend: `total_pemasukan`, `rincian_per_barber`, dan `ada_data`.
- Periode mingguan adalah **Senin–Minggu**; periode bulanan mengikuti **bulan kalender**, keduanya dalam zona waktu WIB (`Asia/Jakarta`).
- Seluruh nominal dan jumlah dikirim sebagai **angka (integer)**, bukan string: `total_pemasukan`, `jumlah_transaksi`, dan `id_barber`.
- Setiap item `rincian_per_barber` berisi `id_barber`, `nama_barber`, `jumlah_transaksi`, dan `total_pemasukan`.
- Jika tidak ada transaksi pada periode: `total_pemasukan: 0`, `jumlah_transaksi: 0`, `rincian_per_barber: []`, dan `ada_data: false`.

### 5.1 API Tren Pemasukan

**Endpoint:** `GET /api/rekap/tren.php`

**Akses:** Owner yang sudah login.

| Parameter | Wajib | Keterangan                                                            |
| --------- | ----- | --------------------------------------------------------------------- |
| `periode` | Tidak | `7_hari` (default), `minggu`, atau `bulan`. Nilai lain ditolak `422`. |

| `periode` | Rentang aktif                                                                        | Pembanding         | Label grafik              |
| --------- | ------------------------------------------------------------------------------------ | ------------------ | ------------------------- |
| `7_hari`  | 7 hari lengkap, berakhir kemarin (hari ini tidak dihitung)                           | 7 hari sebelumnya  | Nama hari (`Thursday`, …) |
| `minggu`  | Bulan berjalan, 4 titik: Minggu 1 (tgl 1–7), 2 (8–14), 3 (15–21), 4 (22–akhir bulan) | Seluruh bulan lalu | `Minggu 1` … `Minggu 4`   |
| `bulan`   | Tahun berjalan, 12 titik                                                             | Tahun lalu         | `Januari` … `Desember`    |

**Asumsi:** awal minggu adalah hari **Senin** (minggu = Senin sampai Minggu). Sudah dikonfirmasi ke tim.

Contoh respons (`200 OK`):

```json
{
  "success": true,
  "data": {
    "periode": "7_hari",
    "tanggal_awal": "2026-10-29",
    "tanggal_akhir": "2026-11-04",
    "labels": [
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday"
    ],
    "tanggal": [
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04"
    ],
    "pemasukan": [150000, 150000, 100000, 0, 200000, 150000, 300000],
    "titik": [
      {
        "label": "Thursday",
        "tanggal_awal": "2026-10-29",
        "tanggal_akhir": "2026-10-29",
        "total_pemasukan": 150000
      }
    ],
    "total_pemasukan": 1050000,
    "pembanding": "7_hari_sebelumnya",
    "tanggal_awal_sebelumnya": "2026-10-22",
    "tanggal_akhir_sebelumnya": "2026-10-28",
    "total_periode_sebelumnya": 750000,
    "persentase_perubahan": 40,
    "status_tren": "naik",
    "ambang_stabil_persen": 5,
    "ada_data": true
  }
}
```

Ketentuan:

- `tanggal` berisi tanggal ISO untuk tiap `labels` (`YYYY-MM-DD` untuk `7_hari`/`minggu`, `YYYY-MM` untuk `bulan`), urutannya sama.
- `status_tren` bernilai `naik`, `turun`, atau `stabil`. Disebut `stabil` bila selisih persentase kurang dari `ambang_stabil_persen` (positif maupun negatif); tepat di ambang dihitung `naik`/`turun`.
- `ambang_stabil_persen` mengembalikan ambang yang dipakai (saat ini `5`). Nilainya **belum final**, menunggu konfirmasi Erik. Untuk mengubahnya cukup ubah konstanta `TREN_AMBANG_STABIL_PERSEN` di bagian atas `api/rekap/tren.php`. Frontend cukup membaca `status_tren` dan `ambang_stabil_persen` dari respons.
- `persentase_perubahan` bernilai `null` jika periode sebelumnya `0` sementara periode ini ada pemasukan.
- `ada_data` bernilai `false` bila seluruh nilai `pemasukan` adalah `0`.
- Transaksi yang sudah dihapus tidak dihitung. Tanggal mengikuti zona waktu WIB.
- Non-owner ditolak `403 FORBIDDEN`; method selain `GET` ditolak `405 METHOD_NOT_ALLOWED`.
- Periode tanpa transaksi mengembalikan `200` dengan seluruh `pemasukan` bernilai `0`, `total_pemasukan` `0`, `ada_data: false`, dan `status_tren: stabil` (bukan error).
- `titik` berisi satu objek per label (`label`, `tanggal_awal`, `tanggal_akhir`, `total_pemasukan`); `tanggal` memakai `YYYY-MM` untuk `bulan` dan `YYYY-MM-DD` untuk periode lainnya.

#### Data contoh demo (7 hari terakhir)

File `database/migrations/demo_tren.sql` mengisi transaksi 14 hari terakhir (tanggal relatif terhadap hari ini WIB) untuk demo grafik. Setelah diimpor, `GET /api/rekap/tren.php?periode=7_hari` menghasilkan:

| Hari ke- | -7 | -6 | -5 | -4 | -3 | -2 | -1 |
| Pemasukan | 150000 | 150000 | 100000 | 0 | 200000 | 150000 | 300000 |

`total_pemasukan` = 1.050.000, `total_periode_sebelumnya` = 750.000, `persentase_perubahan` = 40,
`status_tren` = `naik`. Semua baris demo memakai pelanggan bernama `Demo Tren`. Mengimpor ulang file yang sama membersihkan data demo lama lebih dulu, jadi aman diulang. Data demo ikut terhitung di rekap dan dashboard, jadi hapus bila tidak diperlukan.

### 5.2 API Dashboard Owner

**Endpoint:** `GET /api/rekap/dashboard.php`

**Akses:** Owner yang sudah login.

| Parameter | Wajib | Keterangan                                                                    |
| --------- | ----- | ----------------------------------------------------------------------------- |
| `periode` | Tidak | `hari` (default), `minggu`, `bulan`, atau `semua`. Nilai lain ditolak `422`.  |
| `tanggal` | Tidak | `YYYY-MM-DD`, default hari ini (WIB). Format salah ditolak `422`.             |
| `limit`   | Tidak | Jumlah layanan populer, `1`–`20`, default `5`. Di luar rentang ditolak `422`. |

| `periode` | Rentang                                                |
| --------- | ------------------------------------------------------ |
| `hari`    | Tanggal acuan                                          |
| `minggu`  | Senin–Minggu yang memuat tanggal acuan                 |
| `bulan`   | Tanggal 1 sampai akhir bulan acuan                     |
| `semua`   | Seluruh data (`tanggal_awal`/`tanggal_akhir` = `null`) |

Contoh respons (`200 OK`):

```json
{
  "success": true,
  "data": {
    "periode": "hari",
    "tanggal_acuan": "2026-10-29",
    "tanggal_awal": "2026-10-29",
    "tanggal_akhir": "2026-10-29",
    "jumlah_transaksi": 2,
    "jumlah_pelanggan": 2,
    "keuangan": {
      "pemasukan": 200000,
      "hpp": 40000,
      "laba_kotor": 160000,
      "biaya_operasional": 60000,
      "laba_bersih": 100000,
      "hpp_lengkap": true
    },
    "pembayaran": [
      {
        "metode": "cash",
        "label": "Tunai",
        "jumlah_transaksi": 1,
        "total_pemasukan": 120000
      },
      {
        "metode": "transfer",
        "label": "Transfer",
        "jumlah_transaksi": 0,
        "total_pemasukan": 0
      },
      {
        "metode": "qris",
        "label": "QRIS",
        "jumlah_transaksi": 1,
        "total_pemasukan": 80000
      }
    ],
    "layanan_populer": [
      {
        "id_layanan": 1,
        "nama_layanan": "Potong rambut reguler",
        "jumlah_terjual": 3,
        "total_pemasukan": 120000
      }
    ],
    "ada_data": true
  }
}
```

Ketentuan:

- `laba_kotor = pemasukan - hpp`; `laba_bersih = laba_kotor - biaya_operasional`.
- `hpp` = jumlah `hpp_saat_transaksi × jumlah` tiap item. Item tanpa HPP dihitung `0` dan `hpp_lengkap` menjadi `false`.
- `biaya_operasional` = total pengeluaran pada rentang yang sama.
- `pembayaran` selalu berisi 3 metode dengan urutan `cash`, `transfer`, `qris` (nilai `0` bila tidak ada transaksi).
- `layanan_populer` terurut `jumlah_terjual` menurun, lalu nama; maksimal `limit` item.
- Periode tanpa transaksi mengembalikan `200` dengan semua angka `0`, daftar `[]`, dan `ada_data: false`.
- Transaksi yang sudah dihapus tidak dihitung. Tanggal mengikuti zona waktu WIB.
- Non-owner ditolak `403 FORBIDDEN`; method selain `GET` ditolak `405 METHOD_NOT_ALLOWED`.

### 5.3 API Jumlah Transaksi per Layanan

**Endpoint:** `GET /api/rekap/layanan.php`

**Akses:** Owner yang sudah login.

| Parameter | Wajib | Keterangan                                                                                           |
| --------- | ----- | ---------------------------------------------------------------------------------------------------- |
| `periode` | Tidak | `hari` (default), `minggu` (Senin–Minggu), atau `bulan` (kalender). Nilai lain `422`.                |
| `tanggal` | Tidak | Tanggal acuan `YYYY-MM-DD`. Default: hari ini (WIB). Tidak valid `422`.                              |
| `urutan`  | Tidak | `terbanyak` (default, paling sering dikerjakan) atau `tersedikit` (paling jarang). Nilai lain `422`. |

Contoh request:

```
GET {{base_url}}/api/rekap/layanan.php?periode=minggu&tanggal=2026-10-21
GET {{base_url}}/api/rekap/layanan.php?periode=bulan&tanggal=2026-10-21&urutan=tersedikit
```

Contoh respons (`200 OK`):

```json
{
  "success": true,
  "data": {
    "periode": "minggu",
    "tanggal_acuan": "2026-10-21",
    "tanggal_awal": "2026-10-19",
    "tanggal_akhir": "2026-10-25",
    "urutan": "terbanyak",
    "layanan": [
      {
        "peringkat": 1,
        "id_layanan": 1,
        "nama_layanan": "Potong rambut reguler",
        "jumlah_transaksi": 3,
        "total_jumlah": 3
      },
      {
        "peringkat": 2,
        "id_layanan": 3,
        "nama_layanan": "Creambath",
        "jumlah_transaksi": 1,
        "total_jumlah": 3
      }
    ],
    "ada_data": true
  }
}
```

Periode tanpa transaksi (`200 OK`, bukan error):

```json
{
  "success": true,
  "data": {
    "periode": "hari",
    "tanggal_acuan": "2026-01-01",
    "tanggal_awal": "2026-01-01",
    "tanggal_akhir": "2026-01-01",
    "urutan": "terbanyak",
    "layanan": [],
    "ada_data": false
  }
}
```

Ketentuan:

- Dihitung per baris layanan di `detail_transaksi`. Transaksi multi-layanan (4.2) menambah hitungan **setiap** layanan di dalamnya.
- `jumlah_transaksi` = banyak transaksi yang memuat layanan itu; `total_jumlah` = jumlah unit (`SUM(jumlah)`).
- `urutan=terbanyak` mengurutkan `jumlah_transaksi` menurun, `tersedikit` menaik; seri diurutkan `total_jumlah` lalu nama A–Z. `peringkat` mengikuti urutan yang dipilih (mulai dari 1).
- Hanya layanan yang punya transaksi pada periode yang muncul (layanan tanpa transaksi tidak dimasukkan).
- Layanan yang sudah dihapus permanen tetap muncul dengan `id_layanan: null` dan nama dari snapshot transaksi.
- Batas periode dan tanggal default memakai WIB. Transaksi yang sudah dihapus (soft delete) tidak dihitung.
- Tanpa login `401`; non-owner `403 FORBIDDEN`; method selain `GET` `405 METHOD_NOT_ALLOWED`.

### 5.4 API Laporan Bulanan PDF — Kartu 6.7.3

**Endpoint:** `GET /api/rekap/laporan_pdf.php?bulan=YYYY-MM`

**Akses:** Owner yang sudah login. Barber menerima `403 FORBIDDEN` dengan pesan `Anda tidak memiliki izin mengakses halaman ini`.

**Tujuan:** Mengunduh laporan pemasukan dan pengeluaran satu bulan kalender sebagai file PDF.

| Parameter | Wajib | Keterangan                                      |
| --------- | ----- | ----------------------------------------------- |
| `bulan`   | Tidak | Format `YYYY-MM`. Default bulan berjalan (WIB). |

**Isi PDF:** kop (nama dan alamat barbershop dari `config/barbershop.php`), periode, tanggal pembuatan (WIB), ringkasan total pemasukan, total pengeluaran, dan saldo bersih, lalu tabel pemasukan per barber, layanan terlaris, dan pengeluaran per kategori. Angka pemasukan dan layanan memakai perhitungan yang sama dengan `/api/rekap/pemasukan.php` dan `/api/rekap/layanan.php` (fungsi bersama di `api/lib/rekap_data.php`).

**Definisi saldo bersih:** `saldo_bersih = total pemasukan − total pengeluaran`, **tanpa HPP**. Nilainya bisa negatif (ditulis `-Rp...` di PDF).

**Batas bulan:** tanggal 1 sampai hari terakhir bulan itu menurut WIB. Pengeluaran diambil per rentang tanggal tersebut (`tanggal BETWEEN awal AND akhir`).

Berhasil dengan data — `200 OK`:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="laporan-keuangan-2026-10.pdf"`
- Bagian yang kosong (hanya pemasukan atau hanya pengeluaran yang kosong) tetap dibuat dengan `Rp0`.

Bulan tanpa pemasukan **dan** tanpa pengeluaran — `200 OK`, JSON, bukan file:

```json
{
  "success": true,
  "message": "Tidak ada pemasukan maupun pengeluaran pada bulan ini.",
  "data": {
    "bulan": "2025-01",
    "tanggal_awal": "2025-01-01",
    "tanggal_akhir": "2025-01-31",
    "total_pemasukan": 0,
    "total_pengeluaran": 0,
    "saldo_bersih": 0,
    "ada_data": false
  }
}
```

Frontend membedakan kedua hasil lewat header `Content-Type` (`application/pdf` atau `application/json`); bila JSON, cek `data.ada_data`.

Penanganan kesalahan:

| Kondisi                                    |  HTTP | `error_code`            |
| ------------------------------------------ | ----: | ----------------------- |
| Belum login / sesi habis                   | `401` | `UNAUTHORIZED`          |
| Bukan owner                                | `403` | `FORBIDDEN`             |
| Method selain `GET`                        | `405` | `METHOD_NOT_ALLOWED`    |
| `bulan` bukan `YYYY-MM` yang valid         | `422` | `UNPROCESSABLE_ENTITY`  |
| Gagal membuat file (mis. identitas kosong) | `500` | `INTERNAL_SERVER_ERROR` |

Pada kegagalan `500` tidak ada file yang terkirim dan tidak ada data yang diubah (endpoint hanya membaca).
Pesan `500`: `Gagal membuat file laporan PDF. Data tidak diubah, silakan coba lagi.`

## 6. API Pengeluaran — WBS 4.3

**Base endpoint:** `/api/pengeluaran/`

**Akses:** Owner yang sudah login.

### 6.1 GET — Daftar Pengeluaran Berdasarkan Tanggal

Endpoint:

`GET /api/pengeluaran/?tanggal=YYYY-MM-DD`

Parameter `tanggal` bersifat opsional. Jika tidak diberikan, endpoint menggunakan tanggal hari ini berdasarkan zona waktu `Asia/Jakarta` (WIB). Filter dan rekap menggunakan kolom `tanggal` bertipe `DATE`.

Format `tanggal` yang tidak valid ditolak `422 UNPROCESSABLE_ENTITY`.

Respons berhasil (`200 OK`) memuat objek `data` dengan isi:

- `tanggal`: tanggal yang diminta.
- `pengeluaran`: daftar pengeluaran pada tanggal tersebut.
- `total_pengeluaran`: total nominal pengeluaran pada tanggal tersebut.
- Setiap item `pengeluaran` berisi: `id_pengeluaran`, `kategori`, `nominal`, `tanggal`, `keterangan` (boleh `null`), `dibuat_pada`, `id_user`, dan `nama_user` (nama pencatat dari tabel `users`).

Parameter `periode` (opsional): `hari` (default), `minggu` (Senin–Minggu), `bulan`, atau `semua`, dihitung terhadap `tanggal` dalam WIB. Selain yang di atas, `data` juga memuat `periode`, `tanggal_awal`, `tanggal_akhir`, `jumlah_catatan`, `rincian_per_kategori`, `hpp_layanan`, dan `hpp_lengkap`.

**Rincian HPP per layanan (`rincian_hpp_layanan`):** daftar layanan terjual pada rentang `periode` dan `tanggal` yang sama dengan respons pengeluaran. Field `hpp_layanan` tetap ada dan tidak berubah (total HPP). Transaksi yang sudah dihapus tidak dihitung.

| Field | Keterangan |
| --- | --- |
| `id_layanan` | ID layanan (`null` bila layanan sudah dihapus dari master). |
| `nama_layanan` | Nama layanan. |
| `jumlah_terjual` | Jumlah unit terjual (`jumlah` dijumlahkan). |
| `pendapatan` | Jumlah `harga_saat_transaksi × jumlah`. |
| `hpp` | Jumlah `hpp_saat_transaksi × jumlah` (HPP yang belum diisi dihitung 0; lihat `hpp_lengkap`). |

Diurutkan dari `jumlah_terjual` terbanyak. Jumlah seluruh `hpp` sama dengan `hpp_layanan`. Periode tanpa penjualan menghasilkan `[]`.

Contoh:

```json
"hpp_layanan": 36000,
"hpp_lengkap": true,
"rincian_hpp_layanan": [
  { "id_layanan": 1, "nama_layanan": "Potong rambut reguler", "jumlah_terjual": 12, "pendapatan": 600000, "hpp": 36000 }
]
```

### 6.2 POST — Menambahkan Pengeluaran

Endpoint:

`POST /api/pengeluaran/`

Header:

`Content-Type: application/json`

Contoh body:

```json
{
  "kategori": "Bahan",
  "nominal": 150000,
  "tanggal": "2026-10-10",
  "keterangan": "Pembelian bahan"
}
```

Aturan validasi:

- `kategori` wajib diisi dan maksimal 100 karakter.
- `nominal` wajib berupa bilangan bulat lebih dari nol.
- `tanggal` opsional; jika tidak diberikan, digunakan tanggal hari ini berdasarkan zona waktu `Asia/Jakarta` (WIB).
- `keterangan` opsional dan maksimal 255 karakter.
- `id_user` diambil dari sesi login, bukan dari body request.

Respons sukses: `201 Created`, berisi `message` (`Pengeluaran berhasil dicatat.`) dan `data` (`id_pengeluaran`, `id_user`, `tanggal`, `kategori`, `nominal`, `keterangan`).

Jika nominal kosong, nol, negatif, bukan bilangan bulat, atau melebihi batas integer, API mengembalikan `422 Unprocessable Content` dengan `error_code` `UNPROCESSABLE_ENTITY` dan pesan:

`Nominal harus lebih dari nol`

### 6.3 DELETE — Menghapus Pengeluaran

Endpoint:

`DELETE /api/pengeluaran/?id_pengeluaran={id}`

`id_pengeluaran` dapat dikirim lewat query string atau body JSON `{"id_pengeluaran": 12}` (query diprioritaskan).

Aturan:

- Hanya owner yang dapat menghapus.
- Hanya pengeluaran bertanggal **hari ini (WIB)** yang boleh dihapus; selain itu `403 FORBIDDEN` dengan pesan `Hanya pengeluaran hari ini yang dapat dihapus.`
- Penghapusan bersifat permanen (baris dihapus dari tabel `pengeluaran`).
- ID tidak valid → `422 UNPROCESSABLE_ENTITY`; ID tidak ditemukan → `404 NOT_FOUND`; data berubah saat diproses → `409 CONFLICT`.

Respons sukses (`200 OK`):

```json
{
  "success": true,
  "message": "Pengeluaran berhasil dihapus.",
  "data": {
    "id_pengeluaran": 12,
    "tanggal": "2026-10-28"
  }
}
```

### 6.4 PUT — Mengubah Pengeluaran

Endpoint:

`PUT /api/pengeluaran/`

Header: `Content-Type: application/json`

Contoh body:

```json
{
  "id_pengeluaran": 123,
  "kategori": "Operasional",
  "nominal": 50000,
  "keterangan": "Pembelian sabun"
}
```

Aturan:

- Hanya owner yang dapat mengubah.
- `id_pengeluaran` wajib berupa bilangan bulat positif dan harus ada di database.
- `kategori` wajib, maksimal 100 karakter.
- `nominal` wajib berupa bilangan bulat lebih dari 0 dan maksimal `2147483647`.
- `keterangan` opsional, maksimal 255 karakter (string kosong dianggap `null`).
- Hanya pengeluaran bertanggal **hari ini (WIB)** yang boleh diubah; selain itu `403 FORBIDDEN` dengan pesan `Hanya pengeluaran hari ini yang dapat diubah.`
- `tanggal` dan pencatat (`id_user`) tidak berubah. Mengirim data yang sama dengan data lama tetap `200`.
- Validasi gagal `422 UNPROCESSABLE_ENTITY`; ID tidak ditemukan `404 NOT_FOUND`; body bukan JSON `400 BAD_REQUEST`; data berubah saat diproses `409 CONFLICT`.

Respons sukses (`200 OK`):

```json
{
  "success": true,
  "message": "Perubahan pengeluaran berhasil disimpan.",
  "data": {
    "id_pengeluaran": 123,
    "tanggal": "2026-11-03",
    "kategori": "Operasional",
    "nominal": 50000,
    "keterangan": "Pembelian sabun"
  }
}
```

### Status HTTP

| HTTP Status                 | Keterangan                                                       |
| --------------------------- | ---------------------------------------------------------------- |
| `200 OK`                    | GET atau DELETE berhasil                                         |
| `201 Created`               | Pengeluaran berhasil dicatat                                     |
| `400 Bad Request`           | JSON tidak valid (`BAD_REQUEST`)                                 |
| `401 Unauthorized`          | Sesi login tidak valid (`UNAUTHORIZED`)                          |
| `403 Forbidden`             | Bukan owner, atau pengeluaran bukan milik hari ini (`FORBIDDEN`) |
| `404 Not Found`             | Pengeluaran tidak ditemukan (`NOT_FOUND`)                        |
| `405 Method Not Allowed`    | Method tidak didukung (`Allow: GET, POST, DELETE`)               |
| `409 Conflict`              | Data berubah saat diubah/dihapus (`CONFLICT`)                    |
| `422 Unprocessable Content` | Validasi gagal (`UNPROCESSABLE_ENTITY`)                          |
| `500 Internal Server Error` | Kesalahan server                                                 |
| `200 OK`                    | GET, PUT, atau DELETE berhasil                                   |
| `405 Method Not Allowed`    | Method tidak didukung (`Allow: GET, POST, PUT, DELETE`)          |

### Skenario Pengujian Pengeluaran

- [x] Simpan pengeluaran kategori Bahan sebesar Rp150.000.
- [x] Pastikan nominal kosong, nol, dan negatif ditolak.
- [x] Ambil daftar pengeluaran berdasarkan tanggal.
- [x] Pastikan pengeluaran Rp150.000 dan Rp50.000 menghasilkan total Rp200.000 pada tanggal yang sama.
- [x] Pastikan pengguna selain owner ditolak.
- [x] Pastikan tanggal default menggunakan tanggal WIB ketika parameter atau field `tanggal` tidak diberikan.
- [x] Pastikan tanggal yang tidak memiliki pengeluaran menghasilkan `pengeluaran` berupa array kosong dan `total_pengeluaran` sebesar `0`.

## 7. Skenario Pengujian Fitur Pelanggan dan Layanan

### Pencatatan Pelanggan

- [ ] Mencatat transaksi untuk pelanggan baru.
- [ ] Memastikan pelanggan baru tersimpan dan terhubung dengan transaksi.
- [ ] Memilih nama pelanggan dari saran yang tersedia.
- [ ] Memastikan pelanggan yang dipilih menggunakan `id_pelanggan` yang benar.
- [ ] Memastikan transaksi baru untuk pelanggan yang dipilih tidak membuat data pelanggan duplikat.
- [ ] Mengirim transaksi dengan `nama_pelanggan` kosong dan memastikan server menolak request.
- [ ] Mengirim transaksi dengan `nama_pelanggan` berisi spasi saja dan memastikan server menolak request.
- [ ] Memastikan pesan validasi nama pelanggan adalah `Nama pelanggan wajib diisi.`
- [ ] Owner menghapus pelanggan (soft delete) dan menerima `200`.
- [ ] Barber mencoba menghapus pelanggan dan menerima `403`.
- [ ] Menghapus pelanggan tanpa ID `400`, ID tidak ada atau sudah dihapus `404`.
- [ ] Pelanggan yang dihapus tidak muncul di saran nama dan tidak bisa dipakai untuk transaksi baru (`422`).
- [ ] Riwayat transaksi lama tetap menampilkan nama pelanggan yang sudah dihapus.

### Riwayat Layanan per Pelanggan

- [ ] Pelanggan yang pernah bertransaksi: `GET /api/riwayat/pelanggan.php?id_pelanggan=...` mengembalikan daftar layanan dengan nama dan tanggal.
- [ ] Urutan riwayat dari yang terbaru (tanggal, lalu waktu).
- [ ] Transaksi multi-layanan muncul sebagai beberapa baris dengan `id_transaksi` yang sama.
- [ ] Pelanggan baru tanpa transaksi mengembalikan `200` dengan `riwayat` kosong dan `ada_data: false`.
- [ ] Transaksi yang sudah dihapus (soft delete) tidak muncul di riwayat.
- [ ] `id_pelanggan` tidak dikirim atau tidak valid `400`; pelanggan tidak ada atau sudah dihapus `404`; tanpa login `401`.

### Layanan Terlaris per Periode

- [ ] `GET /api/rekap/layanan.php?periode=minggu&tanggal=...` mengembalikan layanan dengan `jumlah_transaksi`, urut paling sering (default `urutan=terbanyak`).
- [ ] `urutan=tersedikit` membalik urutan (paling jarang lebih dulu).
- [ ] Transaksi multi-layanan dihitung untuk setiap layanan di dalamnya.
- [ ] Batas periode: `hari`, `minggu` (Senin–Minggu), `bulan`.
- [ ] Periode tanpa transaksi mengembalikan `200` dengan `layanan` kosong dan `ada_data: false`.
- [ ] Transaksi yang sudah dihapus tidak dihitung.
- [ ] `periode`/`urutan`/`tanggal` tidak valid `422`; barber `403`; tanpa login `401`; POST `405`.

### Pengelolaan Layanan

- [ ] GET layanan mengembalikan daftar layanan beserta status aktif/nonaktif.
- [ ] Layanan nonaktif tetap terlihat pada halaman pengelolaan layanan.
- [ ] Owner dapat mengaktifkan kembali layanan nonaktif.
- [ ] Owner dapat menonaktifkan layanan aktif.
- [ ] Pengguna selain owner tidak dapat melakukan perubahan layanan.
- [ ] Owner menghapus layanan permanen dan riwayat transaksi lama tetap tampil (`id_layanan` pada detail menjadi `null`, nama dan harga tetap dari snapshot).

## 8. Catatan Verifikasi Dokumentasi

Dokumen ini diselaraskan dengan kode API di folder `api/` dan skema database `database/kataji_barber.sql` melalui pemeriksaan statis (membaca kode dan query). Endpoint belum diuji ulang di Postman setelah penyelarasan ini.

Sebelum dianggap sebagai dokumentasi final, cocokkan kembali dengan kode aktual di repository bila ada perubahan, terutama:

- Nama endpoint dan format respons API saran pelanggan.
- Nama kolom serta nilai status aktif/nonaktif layanan.
- Struktur tabel `pelanggan` dan foreign key `transaksi.id_pelanggan`.
- Nama kolom transaksi dan detail transaksi.
- Status HTTP serta `error_code` yang benar-benar dikembalikan oleh endpoint.
- Status pengujian yang telah dilakukan. Jangan tandai pengujian sebagai selesai sebelum benar-benar dijalankan.

## WBS 4.4 — Riwayat Transaksi yang Dicatat Barber

### Deskripsi

Fitur ini memungkinkan barber melihat transaksi yang dicatat sendiri pada tanggal tertentu untuk memeriksa kemungkinan kesalahan input transaksi.

### Endpoint

#### 1. Mengambil daftar riwayat transaksi

- **Method:** `GET`
- **URL:** `/api/transaksi/index.php`
- **Autentikasi:** Wajib login.
- **Role yang diizinkan:** `owner`, `barber`.
- **Query parameter:** `tanggal` (opsional), format `YYYY-MM-DD`.

Contoh request:

```http
GET /api/transaksi/index.php?tanggal=2026-10-23
```

Aturan:

- Jika role adalah `barber` dan parameter `tanggal` tidak diberikan, API menggunakan tanggal hari ini berdasarkan zona waktu `Asia/Jakarta`.
- Jika parameter `tanggal` diberikan, daftar transaksi difilter berdasarkan tanggal tersebut.
- Barber hanya dapat melihat transaksi yang dicatat oleh akun barber yang sedang login (`id_pencatat`).
- Transaksi yang sudah dihapus secara logis (`dihapus_pada` tidak NULL) tidak ditampilkan.
- Daftar diurutkan berdasarkan tanggal, waktu, dan ID transaksi dari terbaru ke terlama.
- Format tanggal yang tidak valid menghasilkan status `400 Bad Request`.
- Pengguna tanpa autentikasi atau role yang diizinkan ditolak sesuai middleware dan aturan otorisasi API.

Contoh respons sukses:

```json
{
  "success": true,
  "data": [
    {
      "id_transaksi": 12,
      "id_pencatat": 3,
      "id_barber": 3,
      "nama_barber": "Sandi",
      "id_pelanggan": 5,
      "nama_pelanggan": "Contoh Pelanggan",
      "tanggal": "2026-10-23",
      "waktu": "11:40:00",
      "total_harga": 50000,
      "metode_pembayaran": "cash"
    }
  ]
}
```

Data di atas hanya contoh struktur respons; nilai aktual mengikuti database.

#### 2. Mengambil detail transaksi

- **Method:** `GET`
- **URL:** `/api/transaksi/detail.php?id={id_transaksi}`
- **Autentikasi:** Wajib login.

Aturan:

- Parameter `id` digunakan untuk menentukan transaksi yang diminta.
- Barber hanya boleh mengakses detail transaksi yang dicatat oleh akun yang sedang login (`id_pencatat`).
- Transaksi yang sudah dihapus secara logis tidak dapat diakses melalui endpoint detail (respons `404 NOT_FOUND`).
- Hasil pengujian otorisasi harus diverifikasi melalui Postman.

### Perilaku antarmuka

- Riwayat menampilkan tanggal transaksi dan waktu transaksi.
- Barber dapat memilih tanggal untuk melihat transaksi yang dicatat pada tanggal tersebut.
- Transaksi ditampilkan dari waktu terbaru ke terlama.
- Jika tidak ada transaksi pada hari ini, antarmuka menampilkan pesan **“Belum ada transaksi hari ini.”**
- Jika tidak ada transaksi pada tanggal yang dipilih, antarmuka menampilkan pesan **“Belum ada transaksi pada tanggal ini.”**

### Skenario pengujian Postman

| ID         | Skenario                                           | Hasil yang diharapkan                                           | Hasil aktual                            |
| ---------- | -------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| API-RWY-01 | GET riwayat dengan tanggal hari ini sebagai barber | HTTP 200; data hanya milik barber yang login dan sesuai tanggal | Isi setelah tes                         |
| API-RWY-02 | GET riwayat dengan tanggal sebelumnya              | HTTP 200; data sesuai tanggal yang diminta                      | Isi setelah tes                         |
| API-RWY-03 | GET riwayat dengan tanggal tidak valid             | HTTP 400; pesan validasi tanggal                                | Isi setelah tes                         |
| API-RWY-04 | GET riwayat tanpa sesi login                       | Akses ditolak oleh autentikasi API                              | Isi setelah tes                         |
| API-RWY-05 | GET detail transaksi yang dapat diakses            | HTTP 200 dan detail transaksi ditampilkan                       | Isi setelah tes                         |
| API-RWY-06 | GET detail transaksi milik barber lain             | Akses ditolak sesuai aturan otorisasi                           | Isi setelah tes                         |
| UI-RWY-01  | Hari ini memiliki beberapa transaksi               | Semua transaksi hari ini ditampilkan dari terbaru ke terlama    | Sudah diuji di browser; lampirkan bukti |
| UI-RWY-02  | Memilih tanggal sebelumnya                         | Hanya transaksi tanggal yang dipilih ditampilkan                | Sudah diuji di browser; lampirkan bukti |
| UI-RWY-03  | Tidak ada transaksi pada tanggal terpilih          | Pesan kosong ditampilkan                                        | Isi setelah verifikasi                  |

### Bukti pengujian

Lampirkan screenshot Postman yang memperlihatkan method, URL, status HTTP, dan body respons. Jangan tampilkan cookie sesi, token, atau kredensial pada screenshot yang dibagikan.

Catat hasil aktual berdasarkan request yang benar-benar dijalankan. Jangan menandai skenario sebagai berhasil jika belum diuji.

## 9. API Daftar Barber

**Endpoint:** `GET /api/barber/index.php`

**Akses:** Wajib login (`owner` atau `barber`).

Mengembalikan pengguna aktif (`aktif = 1`) dengan role `barber` atau `owner`, diurutkan nama A–Z. Dipakai owner untuk memilih barber pelaksana saat mencatat transaksi.

Contoh respons (`200 OK`):

```json
{
  "success": true,
  "data": [{ "id_user": 2, "nama": "Sandi" }]
}
```

Method selain `GET` ditolak `405 METHOD_NOT_ALLOWED` (header `Allow: GET`). Belum login → `401 UNAUTHORIZED`.

Akun yang dinonaktifkan tidak muncul di daftar ini. Pengelolaan akun barber (tambah, ubah profil, aktif/nonaktif, reset password) ada di bagian 10.

## 10. API Kelola Akun Barber — Kartu 3.4.3

**Akses:** hanya owner. Barber menerima `403 FORBIDDEN` dengan pesan `Anda tidak memiliki izin mengakses halaman ini`. Semua body memakai JSON.

### 10.1 Daftar akun barber

`GET /api/barber/akun.php` → `200`, berisi semua akun `role = barber` (termasuk yang nonaktif), urut nama A–Z.

```json
{
  "success": true,
  "data": [
    {
      "id_user": 2,
      "username": "sandi",
      "nama": "Sandi",
      "spesialisasi": "Fade & Beard",
      "role": "barber",
      "aktif": 1
    }
  ]
}
```

### 10.2 Tambah akun barber

`POST /api/barber/akun.php`

```json
{
  "nama": "Budi",
  "username": "budi",
  "password": "rahasia1",
  "spesialisasi": "Coloring"
}
```

| Field          | Wajib | Aturan                                        |
| -------------- | ----- | --------------------------------------------- |
| `nama`         | Ya    | Maksimal 100 karakter                         |
| `username`     | Ya    | Unik, maksimal 50 karakter                    |
| `password`     | Ya    | Minimal 6 karakter, disimpan sebagai hash     |
| `spesialisasi` | Tidak | Maksimal 100 karakter; kosong disimpan `null` |

Berhasil `201`: `data` berisi `id_user`, `username`, `nama`, `spesialisasi`, `role` (`barber`), `aktif` (`1`). Password tidak pernah ikut di respons. Username sudah dipakai atau data tidak valid → `422`.

### 10.3 Ubah profil

`PUT /api/barber/akun.php`

```json
{ "id_user": 7, "nama": "Budi Santoso", "spesialisasi": "" }
```

Memperbarui akun yang ada (aktif maupun nonaktif); username tidak berubah dan tidak ada akun baru. `spesialisasi` dikirim kosong → dikosongkan (`null`); tidak dikirim → tidak diubah. Berhasil `200` dengan `data` akun terbaru. `id_user` tidak valid atau nama kosong → `422`; akun barber tidak ada → `404`.

### 10.4 Aktifkan / nonaktifkan

`PATCH /api/barber/akun.php`

```json
{ "id_user": 7, "aktif": 0 }
```

`aktif` wajib `0` atau `1`. Berhasil `200` dengan `data: { id_user, aktif }`. Akun owner tidak dapat dinonaktifkan → `403 FORBIDDEN` ("Akun owner tidak dapat dinonaktifkan."). Akun yang dinonaktifkan:

- ditolak saat login (`401`);
- sesi yang sedang berjalan ditolak pada permintaan berikutnya (`401`, "Akun Anda tidak aktif. Silakan hubungi owner.");
- tidak muncul di pilihan Nama Barber (`GET /api/barber/index.php`), tetapi riwayat transaksinya tetap tersimpan.

### 10.5 Reset password

`PUT /api/barber/reset_password.php`

```json
{ "id_user": 7, "password_baru": "rahasia2" }
```

`password_baru` minimal 6 karakter (`422`). Password lama tidak berlaku lagi. Akun yang tidak ada atau tidak aktif → `404` dengan pesan `Akun tidak ditemukan atau tidak aktif`. Berhasil `200`.

### 10.6 Kode respons

| HTTP  | Keterangan                                                         |
| ----- | ------------------------------------------------------------------ |
| `200` | Berhasil (daftar, ubah profil, status, reset password)             |
| `201` | Akun barber ditambahkan                                            |
| `400` | Body bukan JSON (`BAD_REQUEST`)                                    |
| `401` | Belum login, sesi habis, atau akun tidak aktif (`UNAUTHORIZED`)    |
| `403` | Bukan owner, atau mencoba menonaktifkan owner (`FORBIDDEN`)        |
| `404` | Akun tidak ditemukan (`NOT_FOUND`)                                 |
| `405` | Method tidak didukung (`METHOD_NOT_ALLOWED`, header `Allow`)       |
| `422` | Validasi gagal (`UNPROCESSABLE_ENTITY`); penyebab ada di `message` |
| `500` | Kesalahan server (`INTERNAL_SERVER_ERROR`)                         |

## 11. Skema Database

Database: `kataji_barber` (MySQL/MariaDB, `utf8mb4`). File skema lengkap beserta data awal: `database/kataji_barber.sql`. Tanggal bertipe `DATE`, waktu bertipe `TIME`, dan seluruh nilai uang berupa bilangan bulat rupiah (`INT`).

| Tabel              | Kolom utama                                                                                                                                                                                            | Keterangan                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `users`            | `id_user` PK, `username` (unik), `password_hash`, `nama`, `role` (`owner`/`barber`), `spesialisasi` (NULL, maks 100 karakter), `aktif`, `dibuat_pada`                                                  | Akun login. Hanya `aktif = 1` yang dapat login. |
| `layanan`          | `id_layanan` PK, `nama_layanan`, `harga` (> 0), `hpp` (NULL atau ≥ 0), `icon_layanan` (NULL), `aktif`, `dibuat_pada`                                                                                   | `aktif = 0` berarti nonaktif.                   |
| `pelanggan`        | `id_pelanggan` PK, `nama`, `no_hp` (NULL), `dibuat_pada`, `dihapus_pada` (NULL)                                                                                                                        | Soft delete lewat `dihapus_pada`.               |
| `transaksi`        | `id_transaksi` PK, `id_pencatat` FK, `id_barber` FK, `id_pelanggan` FK (NULL), `tanggal`, `waktu`, `total_harga`, `metode_pembayaran` (`cash`/`qris`/`transfer`), `dibuat_pada`, `dihapus_pada` (NULL) | Soft delete lewat `dihapus_pada`.               |
| `detail_transaksi` | `id_detail` PK, `id_transaksi` FK, `id_layanan` FK (NULL), `nama_layanan_saat_transaksi`, `harga_saat_transaksi`, `hpp_saat_transaksi` (NULL), `jumlah` (1–100)                                        | Snapshot data layanan saat transaksi.           |
| `pengeluaran`      | `id_pengeluaran` PK, `id_user` FK, `tanggal`, `kategori`, `nominal` (> 0), `keterangan` (NULL), `dibuat_pada`                                                                                          | Dicatat owner.                                  |

Foreign key:

- `transaksi.id_pencatat` → `users.id_user` (`ON DELETE SET NULL`).
- `transaksi.id_barber` → `users.id_user` (`ON DELETE RESTRICT`).
- `transaksi.id_pelanggan` → `pelanggan.id_pelanggan` (`ON DELETE SET NULL`); boleh `NULL` untuk transaksi lama yang belum memiliki pelanggan.
- `detail_transaksi.id_transaksi` → `transaksi.id_transaksi` (`ON DELETE CASCADE`).
- `detail_transaksi.id_layanan` → `layanan.id_layanan` (`ON DELETE SET NULL`), agar layanan dapat dihapus permanen tanpa merusak riwayat.
- `pengeluaran.id_user` → `users.id_user` (`ON DELETE RESTRICT`).

Data awal pada skema: akun `erik` (owner), `sandi` (barber), `ujang` (barber), serta tiga layanan contoh. Ganti password akun awal sebelum dipakai sungguhan.