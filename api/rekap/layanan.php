<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

function kirimJsonRekapLayanan(int $status, array $data): void
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
    kirimJsonRekapLayanan(403, [
        'success' => false,
        'message' => 'Hanya owner yang dapat melihat rekap layanan.',
        'error_code' => 'FORBIDDEN'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');

    kirimJsonRekapLayanan(405, [
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
    $urutan = $_GET['urutan'] ?? 'terbanyak';

    if (!is_string($periode) ||
        !in_array($periode, ['hari', 'minggu', 'bulan'], true)) {
        kirimJsonRekapLayanan(422, [
            'success' => false,
            'message' => 'Periode harus hari, minggu, atau bulan.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    if (!is_string($urutan) ||
        !in_array($urutan, ['terbanyak', 'tersedikit'], true)) {
        kirimJsonRekapLayanan(422, [
            'success' => false,
            'message' => 'Urutan harus terbanyak atau tersedikit.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    if (!is_string($tanggal)) {
        kirimJsonRekapLayanan(422, [
            'success' => false,
            'message' => 'Format tanggal harus YYYY-MM-DD.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    $tanggalObj = DateTimeImmutable::createFromFormat(
        '!Y-m-d',
        $tanggal,
        $zonaWIB
    );

    $errorTanggal = DateTimeImmutable::getLastErrors();

    if (
        !$tanggalObj ||
        ($errorTanggal !== false &&
            ($errorTanggal['warning_count'] > 0 ||
             $errorTanggal['error_count'] > 0)) ||
        $tanggalObj->format('Y-m-d') !== $tanggal
    ) {
        kirimJsonRekapLayanan(422, [
            'success' => false,
            'message' => 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    if ($periode === 'hari') {
        $awal = $tanggalObj;
        $akhir = $tanggalObj;
    } elseif ($periode === 'minggu') {
        // Minggu dimulai Senin dan berakhir Minggu.
        $awal = $tanggalObj->modify('monday this week');
        $akhir = $awal->modify('+6 days');
    } else {
        $awal = $tanggalObj->modify('first day of this month');
        $akhir = $tanggalObj->modify('last day of this month');
    }

    $tanggalAwal = $awal->format('Y-m-d');
    $tanggalAkhir = $akhir->format('Y-m-d');

    $arah = $urutan === 'terbanyak' ? 'DESC' : 'ASC';

    // Dihitung per baris layanan (detail_transaksi), jadi transaksi
    // multi-layanan menambah hitungan setiap layanan yang ada di dalamnya.
    // Layanan yang sudah dihapus permanen (id_layanan NULL) dikelompokkan
    // berdasarkan nama pada saat transaksi.
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
    $baris = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $layanan = [];
    $peringkat = 0;

    foreach ($baris as $item) {
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

    // Periode tanpa transaksi tetap 200 dengan daftar kosong.
    kirimJsonRekapLayanan(200, [
        'success' => true,
        'data' => [
            'periode' => $periode,
            'tanggal_acuan' => $tanggal,
            'tanggal_awal' => $tanggalAwal,
            'tanggal_akhir' => $tanggalAkhir,
            'urutan' => $urutan,
            'layanan' => $layanan,
            'ada_data' => count($layanan) > 0
        ]
    ]);
} catch (Throwable $e) {
    error_log('API rekap layanan: ' . $e->getMessage());

    kirimJsonRekapLayanan(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}