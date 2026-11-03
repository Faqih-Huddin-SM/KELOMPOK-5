-- ============================================================
-- Data contoh DEMO: grafik tren pemasukan (kartu 4.7.3)
-- Isi: transaksi 14 hari terakhir (7 hari aktif + 7 hari pembanding),
--   tanggal relatif terhadap HARI INI (WIB), jadi demo selalu "7 hari terakhir".
-- Hasil di GET /api/rekap/tren.php?periode=7_hari :
--   pemasukan = [150000,100000,0,200000,150000,300000,150000]
--   total_pemasukan = 1.050.000 | total_periode_sebelumnya = 900.000
--   persentase_perubahan = 16.67 | status_tren = naik
-- Prasyarat: kataji_barber.sql sudah diimpor (user erik & sandi, layanan id 1-3).
-- Aman diimpor ulang: data demo lama dibersihkan dulu. Semua baris demo
-- memakai pelanggan bernama 'Demo Tren'.
-- Hapus data demo saja: jalankan blok BERSIHKAN di bagian atas file ini.
-- ============================================================
USE `kataji_barber`;

-- BERSIHKAN data demo lama (detail ikut terhapus lewat ON DELETE CASCADE)
DELETE t FROM `transaksi` t
  JOIN `pelanggan` p ON p.`id_pelanggan` = t.`id_pelanggan`
  WHERE p.`nama` = 'Demo Tren';
DELETE FROM `pelanggan` WHERE `nama` = 'Demo Tren';

INSERT INTO `pelanggan` (`nama`) VALUES ('Demo Tren');
SET @pel     = LAST_INSERT_ID();
SET @owner   = (SELECT `id_user` FROM `users` WHERE `username` = 'erik'  LIMIT 1);
SET @barber  = (SELECT `id_user` FROM `users` WHERE `username` = 'sandi' LIMIT 1);
-- Hari ini menurut WIB (tidak bergantung zona waktu server MySQL)
SET @hari_ini = DATE(UTC_TIMESTAMP() + INTERVAL 7 HOUR);

-- -13 hari | total 150.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -13 DAY, '10:00:00', 150000, 'cash');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1),
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -12 hari | total 100.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -12 DAY, '10:00:00', 100000, 'qris');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -11 hari | total 100.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -11 DAY, '10:00:00', 100000, 'transfer');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -10 hari | total 150.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -10 DAY, '10:00:00', 150000, 'cash');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1),
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -9 hari | total 150.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -9 DAY, '10:00:00', 150000, 'qris');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1),
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -8 hari | total 100.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -8 DAY, '10:00:00', 100000, 'transfer');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -7 hari | total 150.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -7 DAY, '10:00:00', 150000, 'cash');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1),
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -6 hari | total 150.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -6 DAY, '10:00:00', 150000, 'qris');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1),
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -5 hari | total 100.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -5 DAY, '10:00:00', 100000, 'transfer');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -3 hari | total 200.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -3 DAY, '10:00:00', 200000, 'cash');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 3, 'Creambath', 100000, NULL, 2);

-- -2 hari | total 150.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -2 DAY, '10:00:00', 150000, 'qris');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1),
  (@trx, 3, 'Creambath', 100000, NULL, 1);

-- -1 hari | total 300.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL -1 DAY, '10:00:00', 300000, 'transfer');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 2, 'Coloring', 250000, NULL, 1),
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1);

-- +0 hari | total 150.000
INSERT INTO `transaksi` (`id_pencatat`,`id_barber`,`id_pelanggan`,`tanggal`,`waktu`,`total_harga`,`metode_pembayaran`)
VALUES (@owner, @barber, @pel, @hari_ini + INTERVAL 0 DAY, '10:00:00', 150000, 'cash');
SET @trx = LAST_INSERT_ID();
INSERT INTO `detail_transaksi` (`id_transaksi`,`id_layanan`,`nama_layanan_saat_transaksi`,`harga_saat_transaksi`,`hpp_saat_transaksi`,`jumlah`) VALUES
  (@trx, 1, 'Potong rambut reguler', 50000, NULL, 1),
  (@trx, 3, 'Creambath', 100000, NULL, 1);