<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

function kirimJsonDashboard(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

$role = strtolower(trim($_SESSION['role'] ?? ''));

if ($role !== 'owner') {
    kirimJsonDashboard(403, [
        'success' => false,
        'message' => 'Hanya owner yang dapat melihat dashboard.',
        'error_code' => 'FORBIDDEN'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');

    kirimJsonDashboard(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    // Tanggal acuan dan batas periode memakai WIB.
    $zonaWIB = new DateTimeZone('Asia/Jakarta');
    $hariIniWIB = new DateTimeImmutable('today', $zonaWIB);

    $periode = $_GET['periode'] ?? 'hari';
    $tanggal = $_GET['tanggal'] ?? $hariIniWIB->format('Y-m-d');
    $limitInput = $_GET['limit'] ?? '5';

    if (!is_string($periode) ||
        !in_array($periode, ['hari', 'minggu', 'bulan', 'semua'], true)) {
        kirimJsonDashboard(422, [
            'success' => false,
            'message' => 'Periode harus hari, minggu, bulan, atau semua.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    // Jumlah layanan populer yang ditampilkan: 1 sampai 20.
    $limit = filter_var(
        $limitInput,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 20]]
    );

    if ($limit === false) {
        kirimJsonDashboard(422, [
            'success' => false,
            'message' => 'Limit harus berupa angka 1 sampai 20.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    // Validasi tanggal dengan format YYYY-MM-DD.
    $tanggalObj = is_string($tanggal)
        ? DateTimeImmutable::createFromFormat('!Y-m-d', $tanggal, $zonaWIB)
        : false;

    if (!$tanggalObj || $tanggalObj->format('Y-m-d') !== $tanggal) {
        kirimJsonDashboard(422, [
            'success' => false,
            'message' => 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    // Tentukan batas periode. Periode "semua" tidak dibatasi tanggal.
    $tanggalAwal = null;
    $tanggalAkhir = null;

    if ($periode === 'hari') {
        $tanggalAwal = $tanggal;
        $tanggalAkhir = $tanggal;
    } elseif ($periode === 'minggu') {
        // Minggu dimulai Senin dan berakhir Minggu.
        $awal = $tanggalObj->modify('monday this week');
        $tanggalAwal = $awal->format('Y-m-d');
        $tanggalAkhir = $awal->modify('+6 days')->format('Y-m-d');
    } elseif ($periode === 'bulan') {
        $tanggalAwal = $tanggalObj->modify('first day of this month')
            ->format('Y-m-d');
        $tanggalAkhir = $tanggalObj->modify('last day of this month')
            ->format('Y-m-d');
    }

    // Potongan WHERE per tabel + parameternya.
    $param = [];
    $filterTransaksi = '';
    $filterDetail = '';
    $filterPengeluaran = '';

    if ($tanggalAwal !== null) {
        $param = [':awal' => $tanggalAwal, ':akhir' => $tanggalAkhir];
        $filterTransaksi = ' AND tanggal BETWEEN :awal AND :akhir';
        $filterDetail = ' AND t.tanggal BETWEEN :awal AND :akhir';
        $filterPengeluaran = ' WHERE tanggal BETWEEN :awal AND :akhir';
    }

    // 1) Pemasukan, jumlah transaksi, dan jumlah pelanggan.
    $stmt = $pdo->prepare(
        'SELECT
            COUNT(*) AS jumlah_transaksi,
            COALESCE(SUM(total_harga), 0) AS pemasukan,
            COUNT(DISTINCT id_pelanggan) AS jumlah_pelanggan
         FROM transaksi
         WHERE dihapus_pada IS NULL' . $filterTransaksi
    );
    $stmt->execute($param);
    $ringkas = $stmt->fetch(PDO::FETCH_ASSOC);

    // 2) HPP dari snapshot saat transaksi. HPP kosong dihitung 0,
    //    dan jumlahnya dilaporkan lewat hpp_lengkap.
    $stmt = $pdo->prepare(
        'SELECT
            COALESCE(SUM(COALESCE(dt.hpp_saat_transaksi, 0) * dt.jumlah), 0)
                AS hpp,
            COALESCE(SUM(dt.hpp_saat_transaksi IS NULL), 0) AS item_tanpa_hpp
         FROM detail_transaksi dt
         INNER JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
         WHERE t.dihapus_pada IS NULL' . $filterDetail
    );
    $stmt->execute($param);
    $hppRow = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3) Biaya operasional dari tabel pengeluaran.
    $stmt = $pdo->prepare(
        'SELECT COALESCE(SUM(nominal), 0) FROM pengeluaran'
        . $filterPengeluaran
    );
    $stmt->execute($param);
    $biayaOperasional = (int) $stmt->fetchColumn();

    // 4) Distribusi metode pembayaran (selalu tiga metode).
    $stmt = $pdo->prepare(
        'SELECT
            metode_pembayaran,
            COUNT(*) AS jumlah_transaksi,
            COALESCE(SUM(total_harga), 0) AS total_pemasukan
         FROM transaksi
         WHERE dihapus_pada IS NULL' . $filterTransaksi . '
         GROUP BY metode_pembayaran'
    );
    $stmt->execute($param);

    $perMetode = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $baris) {
        $perMetode[$baris['metode_pembayaran']] = $baris;
    }

    $labelMetode = [
        'cash' => 'Tunai',
        'transfer' => 'Transfer',
        'qris' => 'QRIS'
    ];
    $pembayaran = [];

    foreach ($labelMetode as $kode => $label) {
        $pembayaran[] = [
            'metode' => $kode,
            'label' => $label,
            'jumlah_transaksi' => (int) ($perMetode[$kode]['jumlah_transaksi'] ?? 0),
            'total_pemasukan' => (int) ($perMetode[$kode]['total_pemasukan'] ?? 0)
        ];
    }

    // 5) Layanan populer: terbanyak terjual, lalu nama A-Z.
    $stmt = $pdo->prepare(
        'SELECT
            dt.id_layanan,
            COALESCE(MAX(l.nama_layanan), MAX(dt.nama_layanan_saat_transaksi))
                AS nama_layanan,
            SUM(dt.jumlah) AS jumlah_terjual,
            SUM(dt.harga_saat_transaksi * dt.jumlah) AS total_pemasukan
         FROM detail_transaksi dt
         INNER JOIN transaksi t ON t.id_transaksi = dt.id_transaksi
         LEFT JOIN layanan l ON l.id_layanan = dt.id_layanan
         WHERE t.dihapus_pada IS NULL' . $filterDetail . '
         GROUP BY COALESCE(CONCAT("id:", dt.id_layanan),
                           CONCAT("nama:", dt.nama_layanan_saat_transaksi)),
                  dt.id_layanan
         ORDER BY jumlah_terjual DESC, nama_layanan ASC
         LIMIT ' . (int) $limit
    );
    $stmt->execute($param);

    $layananPopuler = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $baris) {
        $layananPopuler[] = [
            'id_layanan' => $baris['id_layanan'] === null
                ? null : (int) $baris['id_layanan'],
            'nama_layanan' => $baris['nama_layanan'],
            'jumlah_terjual' => (int) $baris['jumlah_terjual'],
            'total_pemasukan' => (int) $baris['total_pemasukan']
        ];
    }

    $jumlahTransaksi = (int) $ringkas['jumlah_transaksi'];
    $pemasukan = (int) $ringkas['pemasukan'];
    $hpp = (int) $hppRow['hpp'];
    $labaKotor = $pemasukan - $hpp;

    kirimJsonDashboard(200, [
        'success' => true,
        'data' => [
            'periode' => $periode,
            'tanggal_acuan' => $tanggal,
            'tanggal_awal' => $tanggalAwal,
            'tanggal_akhir' => $tanggalAkhir,
            'jumlah_transaksi' => $jumlahTransaksi,
            'jumlah_pelanggan' => (int) $ringkas['jumlah_pelanggan'],
            'keuangan' => [
                'pemasukan' => $pemasukan,
                'hpp' => $hpp,
                'laba_kotor' => $labaKotor,
                'biaya_operasional' => $biayaOperasional,
                'laba_bersih' => $labaKotor - $biayaOperasional,
                'hpp_lengkap' => (int) $hppRow['item_tanpa_hpp'] === 0
            ],
            'pembayaran' => $pembayaran,
            'layanan_populer' => $layananPopuler,
            'ada_data' => $jumlahTransaksi > 0
        ]
    ]);

} catch (Throwable $e) {
    error_log('API dashboard: ' . $e->getMessage());

    kirimJsonDashboard(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}