-- [Kartu 6.6.3] Penyimpanan info usaha: satu tabel dengan satu baris (id_info selalu 1).
CREATE TABLE IF NOT EXISTS info_usaha (
  id_info TINYINT UNSIGNED NOT NULL DEFAULT 1,
  alamat VARCHAR(255) NOT NULL,
  tautan_peta VARCHAR(500) NOT NULL,
  hari_awal TINYINT UNSIGNED NOT NULL,
  hari_akhir TINYINT UNSIGNED NOT NULL,
  jam_buka TIME NOT NULL,
  jam_tutup TIME NOT NULL,
  nomor_whatsapp VARCHAR(20) NOT NULL,
  instagram VARCHAR(50) NULL,
  tiktok VARCHAR(50) NULL,
  facebook VARCHAR(50) NULL,
  tagline VARCHAR(100) NULL,
  tentang VARCHAR(500) NULL,
  diperbarui_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_info),
  CONSTRAINT ck_info_usaha_satu_baris CHECK (id_info = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;