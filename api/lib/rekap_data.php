<?php

declare(strict_types=1);

/**
 * Perhitungan rekap yang dipakai bersama oleh endpoint rekap dan laporan PDF.
 * Semua fungsi menerima batas tanggal (Y-m-d, sudah dihitung dalam WIB)
 * dan hanya membaca data (tidak mengubah apa pun).
 */

/**
 * Total pemasukan, jumlah transaksi, dan rincian per barber.
 * Transaksi yang sudah dihapus (dihapus_pada) tidak dihitung.
 */
function ambilRekapPemasukan(PDO $pdo, string $tanggalAwal, string $tanggalAkhir): array
{
    $stmtTotal = $pdo->prepare(
        'SELECT
            COUNT(*) AS jumlah_transaksi,
            COALESCE(SUM(total_harga), 0) AS total_pemasukan
         FROM transaksi
         WHERE tanggal BETWEEN :awal_total AND :akhir_total
           AND dihapus_pada IS NULL'
    );

    $stmtTotal->execute([
        ':awal_total' => $tanggalAwal,
        ':akhir_total' => $tanggalAkhir
    ]);

    $hasilTotal = $stmtTotal->fetch(PDO::FETCH_ASSOC);

    $stmtBarber = $pdo->prepare(
        'SELECT
            t.id_barber,
            u.nama AS nama_barber,
            COUNT(t.id_transaksi) AS jumlah_transaksi,
            COALESCE(SUM(t.total_harga), 0) AS total_pemasukan
         FROM transaksi t
         INNER JOIN users u ON u.id_user = t.id_barber
         WHERE t.tanggal BETWEEN :awal_barber AND :akhir_barber
           AND t.dihapus_pada IS NULL
         GROUP BY t.id_barber, u.nama
         ORDER BY u.nama ASC'
    );

    $stmtBarber->execute([
        ':awal_barber' => $tanggalAwal,
        ':akhir_barber' => $tanggalAkhir
    ]);

    $rincianBarber = $stmtBarber->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rincianBarber as &$barber) {
        $barber['id_barber'] = (int) $barber['id_barber'];
        $barber['jumlah_transaksi'] = (int) $barber['jumlah_transaksi'];
        $barber['total_pemasukan'] = (int) $barber['total_pemasukan'];
    }
    unset($barber);

    return [
        'jumlah_transaksi' => (int) ($hasilTotal['jumlah_transaksi'] ?? 0),
        'total_pemasukan' => (int) ($hasilTotal['total_pemasukan'] ?? 0),
        'rincian_per_barber' => $rincianBarber
    ];
}

/**
 * Peringkat layanan pada rentang tanggal. $urutan: 'terbanyak' | 'tersedikit'.
 *
 * Dihitung per baris layanan (detail_transaksi), jadi transaksi
 * multi-layanan menambah hitungan setiap layanan yang ada di dalamnya.
 * Layanan yang sudah dihapus permanen (id_layanan NULL) dikelompokkan
 * berdasarkan nama pada saat transaksi.
 */
function ambilRekapLayanan(
    PDO $pdo,
    string $tanggalAwal,
    string $tanggalAkhir,
    string $urutan = 'terbanyak'
): array {
    $arah = $urutan === 'terbanyak' ? 'DESC' : 'ASC';

    $stmt = $pdo->prepare(
        "SELECT
            dt.id_layanan,
            COALESCE(MAX(l.nama_layanan), MAX(dt.nama_layanan_saat_transaksi)) AS nama_layanan,
            COUNT(DISTINCT t.id_transaksi) AS jumlah_transaksi,
            SUM(dt.jumlah) AS total_jumlah
         FROM transaksi t
         JOIN detail_transaksi dt ON dt.id_transaksi = t.id_transaksi
         LEFT JOIN layanan l ON l.id_layanan = dt.id_layanan
         WHERE t.tanggal BETWEEN :awal AND :akhir
           AND t.dihapus_pada IS NULL
         GROUP BY dt.id_layanan,
                  CASE WHEN dt.id_layanan IS NULL
                       THEN dt.nama_layanan_saat_transaksi ELSE '' END
         ORDER BY jumlah_transaksi $arah, total_jumlah $arah, nama_layanan ASC"
    );

    $stmt->execute([':awal' => $tanggalAwal, ':akhir' => $tanggalAkhir]);

    $layanan = [];
    $peringkat = 0;

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
        $peringkat++;
        $layanan[] = [
            'peringkat' => $peringkat,
            'id_layanan' => $item['id_layanan'] === null
                ? null
                : (int) $item['id_layanan'],
            'nama_layanan' => $item['nama_layanan'],
            'jumlah_transaksi' => (int) $item['jumlah_transaksi'],
            'total_jumlah' => (int) $item['total_jumlah']
        ];
    }

    return $layanan;
}

/**
 * Total pengeluaran dan rincian per kategori pada rentang tanggal
 * (batas dihitung dalam WIB oleh pemanggil). Kolom `tanggal` bertipe DATE.
 */
function ambilRekapPengeluaran(PDO $pdo, string $tanggalAwal, string $tanggalAkhir): array
{
    $stmt = $pdo->prepare(
        'SELECT
            kategori,
            COUNT(*) AS jumlah_catatan,
            COALESCE(SUM(nominal), 0) AS total_pengeluaran
         FROM pengeluaran
         WHERE tanggal BETWEEN :awal AND :akhir
         GROUP BY kategori
         ORDER BY total_pengeluaran DESC, kategori ASC'
    );

    $stmt->execute([':awal' => $tanggalAwal, ':akhir' => $tanggalAkhir]);

    $rincian = [];
    $total = 0;
    $jumlahCatatan = 0;

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
        $rincian[] = [
            'kategori' => $item['kategori'],
            'jumlah_catatan' => (int) $item['jumlah_catatan'],
            'total_pengeluaran' => (int) $item['total_pengeluaran']
        ];
        $total += (int) $item['total_pengeluaran'];
        $jumlahCatatan += (int) $item['jumlah_catatan'];
    }

    return [
        'total_pengeluaran' => $total,
        'jumlah_catatan' => $jumlahCatatan,
        'rincian_per_kategori' => $rincian
    ];
}