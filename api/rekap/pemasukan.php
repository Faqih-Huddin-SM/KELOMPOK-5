<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../lib/rekap_data.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

$role = strtolower(trim($_SESSION['role'] ?? ''));

function kirimJsonRekap(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if ($role !== 'owner') {
    kirimJsonRekap(403, [
        'success' => false,
        'message' => 'Hanya owner yang dapat melihat rekap pemasukan.',
        'error_code' => 'FORBIDDEN'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');

    kirimJsonRekap(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    // Gunakan WIB untuk tanggal acuan dan batas periode.
    $zonaWIB = new DateTimeZone('Asia/Jakarta');

    $hariIniWIB = new DateTimeImmutable('today', $zonaWIB);
    $periode = $_GET['periode'] ?? 'hari';
    $tanggal = $_GET['tanggal'] ?? $hariIniWIB->format('Y-m-d');

    if (!is_string($periode) ||
        !in_array($periode, ['hari', 'minggu', 'bulan'], true)) {
        kirimJsonRekap(422, [
            'success' => false,
            'message' => 'Periode harus hari, minggu, atau bulan.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    // Validasi tanggal dengan format YYYY-MM-DD.
    if (!is_string($tanggal)) {
        kirimJsonRekap(422, [
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
        kirimJsonRekap(422, [
            'success' => false,
            'message' => 'Format tanggal tidak valid. Gunakan YYYY-MM-DD.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    // Tentukan batas periode berdasarkan tanggal acuan.
    if ($periode === 'hari') {
        $awal = $tanggalObj;
        $akhir = $tanggalObj;
    } elseif ($periode === 'minggu') {
        // Minggu dimulai Senin dan berakhir Minggu.
        $awal = $tanggalObj->modify('monday this week');
        $akhir = $awal->modify('+6 days');
    } else {
        // Periode bulan kalender.
        $awal = $tanggalObj->modify('first day of this month');
        $akhir = $tanggalObj->modify('last day of this month');
    }

    $tanggalAwal = $awal->format('Y-m-d');
    $tanggalAkhir = $akhir->format('Y-m-d');

    // Perhitungan dipakai bersama dengan laporan PDF (api/lib/rekap_data.php).
    $rekap = ambilRekapPemasukan($pdo, $tanggalAwal, $tanggalAkhir);

    $jumlahTransaksi = $rekap['jumlah_transaksi'];
    $totalPemasukan = $rekap['total_pemasukan'];
    $rincianBarber = $rekap['rincian_per_barber'];

    kirimJsonRekap(200, [
        'success' => true,
        'data' => [
            'periode' => $periode,
            'tanggal_acuan' => $tanggal,
            'tanggal_awal' => $tanggalAwal,
            'tanggal_akhir' => $tanggalAkhir,
            'total_pemasukan' => $totalPemasukan,
            'jumlah_transaksi' => $jumlahTransaksi,
            'rincian_per_barber' => $rincianBarber,
            'ada_data' => $jumlahTransaksi > 0
        ]
    ]);

} catch (Throwable $e) {
    error_log('API rekap pemasukan: ' . $e->getMessage());

    kirimJsonRekap(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}