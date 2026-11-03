

CREATE DATABASE IF NOT EXISTS kataji_barber CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kataji_barber;

-- Tabel akun (barber & owner). Menopang story: Login barber, Login owner, Pembatasan hak akses.
CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,   -- simpan hasil password_hash(), jangan pernah plain text
    nama VARCHAR(100) NOT NULL,
    role ENUM('owner', 'barber') NOT NULL,
    spesialisasi VARCHAR(100) NULL,        -- diisi untuk role barber, mendukung story Profil Barber
    aktif TINYINT(1) NOT NULL DEFAULT 1,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel daftar layanan & harga. Menopang story: Kelola daftar layanan & harga.
CREATE TABLE layanan (
    id_layanan INT AUTO_INCREMENT PRIMARY KEY,
    nama_layanan VARCHAR(100) NOT NULL,
    harga INT NOT NULL CHECK (harga > 0),
    aktif TINYINT(1) NOT NULL DEFAULT 1,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel pelanggan. Menopang story: pencatatan otomatis pelanggan, riwayat kunjungan.
CREATE TABLE pelanggan (
    id_pelanggan INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NULL,   -- opsional, lihat AC story "pencatatan otomatis data pelanggan"
    no_hp VARCHAR(20) NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabel transaksi (satu kunjungan). Menopang story: Input transaksi layanan oleh barber.
CREATE TABLE transaksi (
    id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
    id_barber INT NOT NULL,
    id_pelanggan INT NULL,
    tanggal DATE NOT NULL,
    waktu TIME NOT NULL,
    total_harga INT NOT NULL DEFAULT 0,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_barber) REFERENCES users(id_user),
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan)
) ENGINE=InnoDB;

-- Tabel rincian layanan per transaksi (satu transaksi bisa >1 layanan).
-- Menopang story: transaksi dengan multi-layanan.
CREATE TABLE detail_transaksi (
    id_detail INT AUTO_INCREMENT PRIMARY KEY,
    id_transaksi INT NOT NULL,
    id_layanan INT NOT NULL,
    harga_saat_transaksi INT NOT NULL,   -- disalin dari layanan.harga saat transaksi dibuat
    jumlah INT NOT NULL DEFAULT 1,
    FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi) ON DELETE CASCADE,
    FOREIGN KEY (id_layanan) REFERENCES layanan(id_layanan)
) ENGINE=InnoDB;

-- Tabel pengeluaran harian. Menopang story: pencatatan pengeluaran oleh owner.
CREATE TABLE pengeluaran (
    id_pengeluaran INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,   -- owner yang mencatat
    tanggal DATE NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    nominal INT NOT NULL CHECK (nominal > 0),
    keterangan VARCHAR(255) NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_user) REFERENCES users(id_user)
) ENGINE=InnoDB;

-- Data awal untuk pengujian lokal (BUKAN data produksi).
-- Ganti password_hash di bawah sesuai hasil password_hash('passwordnya', PASSWORD_DEFAULT) milik tim.
INSERT INTO users (username, password_hash, nama, role, spesialisasi) VALUES
('erik', '$2y$10$REPLACE_WITH_REAL_HASH', 'Erik Syarif Hidayat', 'owner', NULL),
