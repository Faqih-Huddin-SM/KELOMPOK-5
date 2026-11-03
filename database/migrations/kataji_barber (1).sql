-- ============================================================
-- Database  : kataji_barber
-- Proyek    : KATAJI Barber (KELOMPOK-5)
-- Dibuat dari kebutuhan kode aktual (api/, pages/, CONTRACT.md),
-- bukan dari dump lama. Sudah termasuk semua kolom hasil migrasi:
--   - layanan.hpp, layanan.icon_layanan
--   - transaksi.metode_pembayaran, transaksi.dihapus_pada
--   - pelanggan.dihapus_pada
--   - detail_transaksi.nama_layanan_saat_transaksi, hpp_saat_transaksi
-- Cara pakai: import file ini lewat phpMyAdmin (MySQL 8 / MariaDB 10.4+).
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `kataji_barber`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE `kataji_barber`;

DROP TABLE IF EXISTS `detail_transaksi`;
DROP TABLE IF EXISTS `transaksi`;
DROP TABLE IF EXISTS `pengeluaran`;
DROP TABLE IF EXISTS `pelanggan`;
DROP TABLE IF EXISTS `layanan`;
DROP TABLE IF EXISTS `users`;

-- ------------------------------------------------------------
-- users: akun login (owner / barber)
-- Dipakai: login.php, login_process.php, api/barber, form transaksi
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id_user`       INT          NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)  NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama`          VARCHAR(100) NOT NULL,
  `role`          ENUM('owner','barber') NOT NULL,
  `aktif`         TINYINT(1)   NOT NULL DEFAULT 1,
  `dibuat_pada`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_role_aktif` (`role`, `aktif`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- layanan: daftar layanan + harga jual + HPP + ikon
-- aktif = 0 -> nonaktif (tetap tampil di halaman kelola layanan)
-- ------------------------------------------------------------
CREATE TABLE `layanan` (
  `id_layanan`   INT          NOT NULL AUTO_INCREMENT,
  `nama_layanan` VARCHAR(100) NOT NULL,
  `harga`        INT          NOT NULL,
  `hpp`          INT          NULL,
  `icon_layanan` VARCHAR(255) NULL,
  `aktif`        TINYINT(1)   NOT NULL DEFAULT 1,
  `dibuat_pada`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_layanan`),
  KEY `idx_layanan_aktif` (`aktif`),
  CONSTRAINT `chk_layanan_harga` CHECK (`harga` > 0),
  CONSTRAINT `chk_layanan_hpp`   CHECK (`hpp` IS NULL OR `hpp` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- pelanggan: dibuat otomatis saat transaksi (hanya nama dari API;
-- no_hp dibaca di detail transaksi & diisi form lama)
-- Soft delete lewat dihapus_pada
-- ------------------------------------------------------------
CREATE TABLE `pelanggan` (
  `id_pelanggan` INT          NOT NULL AUTO_INCREMENT,
  `nama`         VARCHAR(100) NULL,
  `no_hp`        VARCHAR(20)  NULL,
  `dibuat_pada`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dihapus_pada` DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id_pelanggan`),
  KEY `idx_pelanggan_nama` (`nama`),
  KEY `idx_pelanggan_dihapus` (`dihapus_pada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- transaksi: header transaksi
-- id_pencatat = user yang login (owner/barber), id_barber = pelaksana
-- dihapus_pada = soft delete (hapus riwayat oleh owner)
-- ------------------------------------------------------------
CREATE TABLE `transaksi` (
  `id_transaksi`      INT      NOT NULL AUTO_INCREMENT,
  `id_pencatat`       INT      NULL,
  `id_barber`         INT      NOT NULL,
  `id_pelanggan`      INT      NULL,
  `tanggal`           DATE     NOT NULL,
  `waktu`             TIME     NOT NULL,
  `total_harga`       INT      NOT NULL DEFAULT 0,
  `metode_pembayaran` ENUM('cash','qris','transfer') NOT NULL DEFAULT 'cash',
  `dibuat_pada`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dihapus_pada`      DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id_transaksi`),
  KEY `idx_transaksi_tanggal` (`tanggal`, `dihapus_pada`),
  KEY `idx_transaksi_barber` (`id_barber`, `tanggal`),
  KEY `idx_transaksi_pencatat` (`id_pencatat`),
  KEY `idx_transaksi_pelanggan` (`id_pelanggan`),
  CONSTRAINT `fk_transaksi_pencatat`
    FOREIGN KEY (`id_pencatat`) REFERENCES `users` (`id_user`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_transaksi_barber`
    FOREIGN KEY (`id_barber`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_transaksi_pelanggan`
    FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id_pelanggan`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_transaksi_total` CHECK (`total_harga` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- detail_transaksi: rincian layanan + snapshot nama/harga/HPP.
-- id_layanan boleh NULL & ON DELETE SET NULL karena API layanan
-- mendukung hapus permanen; riwayat tetap utuh lewat snapshot.
-- ------------------------------------------------------------
CREATE TABLE `detail_transaksi` (
  `id_detail`                   INT          NOT NULL AUTO_INCREMENT,
  `id_transaksi`                INT          NOT NULL,
  `id_layanan`                  INT          NULL,
  `nama_layanan_saat_transaksi` VARCHAR(100) NOT NULL,
  `harga_saat_transaksi`        INT          NOT NULL,
  `hpp_saat_transaksi`          INT          NULL,
  `jumlah`                      INT          NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_detail`),
  KEY `idx_detail_transaksi` (`id_transaksi`),
  KEY `idx_detail_layanan` (`id_layanan`),
  CONSTRAINT `fk_detail_transaksi`
    FOREIGN KEY (`id_transaksi`) REFERENCES `transaksi` (`id_transaksi`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_layanan`
    FOREIGN KEY (`id_layanan`) REFERENCES `layanan` (`id_layanan`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_detail_harga`  CHECK (`harga_saat_transaksi` >= 0),
  CONSTRAINT `chk_detail_hpp`    CHECK (`hpp_saat_transaksi` IS NULL OR `hpp_saat_transaksi` >= 0),
  CONSTRAINT `chk_detail_jumlah` CHECK (`jumlah` BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- pengeluaran: dicatat owner (id_user dari sesi login)
-- ------------------------------------------------------------
CREATE TABLE `pengeluaran` (
  `id_pengeluaran` INT          NOT NULL AUTO_INCREMENT,
  `id_user`        INT          NOT NULL,
  `tanggal`        DATE         NOT NULL,
  `kategori`       VARCHAR(100) NOT NULL,
  `nominal`        INT          NOT NULL,
  `keterangan`     VARCHAR(255) NULL,
  `dibuat_pada`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pengeluaran`),
  KEY `idx_pengeluaran_tanggal` (`tanggal`),
  KEY `idx_pengeluaran_user` (`id_user`),
  CONSTRAINT `fk_pengeluaran_user`
    FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_pengeluaran_nominal` CHECK (`nominal` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DATA AWAL (minimal agar aplikasi bisa dipakai)
-- Password awal: erik -> owner123 | sandi -> barber123 | ujang -> ujang123
-- WAJIB diganti setelah login pertama / sebelum dipakai sungguhan.
-- ============================================================
INSERT INTO `users` (`username`, `password_hash`, `nama`, `role`, `aktif`) VALUES
('erik',  '$2y$10$pkaVbVVhyaQynXv1fL0yKOQNtJpfSfd0SWIEuSXiSBzPbStZN4EFS', 'Erik',  'owner',  1),
('sandi', '$2y$10$/agFFzgU4jt2l8i5g0Ue9umazju1E7RUyPnF0ZY9OTNuS91Dh3Cei', 'Sandi', 'barber', 1),
('ujang', '$2y$10$wcE2Y0XpFfY02UR5F94Kfea7AelYQdwN7SsRhkoz2iFyhvCb7ZY9C', 'Ujang', 'barber', 1);

INSERT INTO `layanan` (`nama_layanan`, `harga`, `hpp`, `aktif`) VALUES
('Potong rambut reguler',  50000, NULL, 1),
('Coloring',              250000, NULL, 1),
('Creambath',             100000, NULL, 1);
