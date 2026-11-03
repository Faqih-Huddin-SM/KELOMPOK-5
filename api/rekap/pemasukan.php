
<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

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

    // Total seluruh pemasukan dalam periode yang dipilih.
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

    $jumlahTransaksi = (int) ($hasilTotal['jumlah_transaksi'] ?? 0);
    $totalPemasukan = (int) ($hasilTotal['total_pemasukan'] ?? 0);

    // Rincian pemasukan untuk setiap barber dalam periode yang sama.
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
