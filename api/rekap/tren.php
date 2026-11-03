<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

/*
 * Ambang status "stabil" (dalam persen).
 * Selisih kurang dari ambang ini dianggap "stabil".
 * Nilai 5 menunggu konfirmasi Erik; ubah angka ini bila berbeda.
 */
const TREN_AMBANG_STABIL_PERSEN = 5;

apiWajibLogin();

$role = strtolower(trim($_SESSION['role'] ?? ''));

function kirimJsonTren(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($role !== 'owner') {
    kirimJsonTren(403, [
        'success' => false,
        'message' => 'Hanya owner yang dapat melihat tren pemasukan.',
        'error_code' => 'FORBIDDEN'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    kirimJsonTren(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    $zona = new DateTimeZone('Asia/Jakarta');
    $hariIni = new DateTimeImmutable('today', $zona);
    $periode = $_GET['periode'] ?? '7_hari';

    if (!in_array($periode, ['7_hari', 'minggu', 'bulan'], true)) {
        kirimJsonTren(422, [
            'success' => false,
            'message' => 'Periode harus 7_hari, minggu, atau bulan.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    // Tentukan rentang periode aktif dan periode pembanding.
    if ($periode === '7_hari') {
        $awal = $hariIni->modify('-6 days');
        $akhir = $hariIni;
        $awalSebelumnya = $awal->modify('-7 days');
        $akhirSebelumnya = $awal->modify('-1 day');
        $tipe = 'hari';
    } elseif ($periode === 'minggu') {
        // Minggu berjalan: Senin sampai Minggu.
        $awal = $hariIni->modify('monday this week');
        $akhir = $awal->modify('+6 days');
        $awalSebelumnya = $awal->modify('-7 days');
        $akhirSebelumnya = $awal->modify('-1 day');
        $tipe = 'hari';
    } else {
        // Bulan berjalan dibandingkan bulan sebelumnya.
        $awal = $hariIni->modify('first day of this month');
        $akhir = $hariIni->modify('last day of this month');
        $awalSebelumnya = $awal->modify('-1 month');
        $akhirSebelumnya = $awal->modify('-1 day');
        $tipe = 'bulan';
    }

    $awalAktif = $awal->format('Y-m-d');
    $akhirAktif = $akhir->format('Y-m-d');
    $awalLama = $awalSebelumnya->format('Y-m-d');
    $akhirLama = $akhirSebelumnya->format('Y-m-d');

    // Ambil pemasukan harian dari periode aktif.
    $stmt = $pdo->prepare(
        'SELECT tanggal, COALESCE(SUM(total_harga), 0) AS total
         FROM transaksi
         WHERE dihapus_pada IS NULL
           AND tanggal BETWEEN :awal AND :akhir
         GROUP BY tanggal
         ORDER BY tanggal ASC'
    );

    $stmt->execute([
        ':awal' => $awalAktif,
        ':akhir' => $akhirAktif
    ]);

    $hasil = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $totalPerTanggal = [];

    foreach ($hasil as $baris) {
        $totalPerTanggal[$baris['tanggal']] = (int) $baris['total'];
    }

    // Total pemasukan periode sebelumnya.
    $stmtLama = $pdo->prepare(
        'SELECT COALESCE(SUM(total_harga), 0)
         FROM transaksi
         WHERE dihapus_pada IS NULL
           AND tanggal BETWEEN :awal AND :akhir'
    );

    $stmtLama->execute([
        ':awal' => $awalLama,
        ':akhir' => $akhirLama
    ]);

    $totalSebelumnya = (int) $stmtLama->fetchColumn();

    $labels = [];
    $tanggalTitik = [];
    $nilai = [];
    $totalAktif = 0;

    if ($periode === 'bulan') {
        // Grafik bulanan: satu titik untuk setiap bulan.
        // Saat ini menampilkan 12 bulan terakhir.
        $awalGrafik = $hariIni->modify('first day of this month')
            ->modify('-11 months');

        $stmtBulanan = $pdo->prepare(
            'SELECT DATE_FORMAT(tanggal, "%Y-%m") AS periode,
                    COALESCE(SUM(total_harga), 0) AS total
             FROM transaksi
             WHERE dihapus_pada IS NULL
               AND tanggal BETWEEN :awal AND :akhir
             GROUP BY DATE_FORMAT(tanggal, "%Y-%m")'
        );

        $stmtBulanan->execute([
            ':awal' => $awalGrafik->format('Y-m-d'),
            ':akhir' => $akhirAktif
        ]);

        $hasilBulanan = [];
        foreach ($stmtBulanan->fetchAll(PDO::FETCH_ASSOC) as $baris) {
            $hasilBulanan[$baris['periode']] = (int) $baris['total'];
        }

        for ($i = 0; $i < 12; $i++) {
            $bulan = $awalGrafik->modify("+$i months");
            $key = $bulan->format('Y-m');
            $jumlah = $hasilBulanan[$key] ?? 0;

            $labels[] = $bulan->format('M Y');
            $tanggalTitik[] = $key;
            $nilai[] = $jumlah;

            if ($key >= $awal->format('Y-m') &&
                $key <= $akhir->format('Y-m')) {
                $totalAktif += $jumlah;
            }
        }
    } else {
                for ($i = 0; $i < 7; $i++) {
            $tanggalObj = $awal->modify("+$i days");
            $key = $tanggalObj->format('Y-m-d');
            $jumlah = $totalPerTanggal[$key] ?? 0;

            $labels[] = $tanggalObj->format('l');
            $tanggalTitik[] = $key;
            $nilai[] = $jumlah;
            $totalAktif += $jumlah;
        }
    }

    // Hitung perubahan pemasukan.
    if ($totalSebelumnya === 0) {
        $persentase = $totalAktif > 0 ? null : 0;
        $statusTren = $totalAktif > 0 ? 'naik' : 'stabil';
    } else {
        $persentase = (($totalAktif - $totalSebelumnya)
            / $totalSebelumnya) * 100;

        if (abs($persentase) < TREN_AMBANG_STABIL_PERSEN) {
            $statusTren = 'stabil';
        } elseif ($persentase > 0) {
            $statusTren = 'naik';
        } else {
            $statusTren = 'turun';
        }
    }

    kirimJsonTren(200, [
        'success' => true,
        'data' => [
            'periode' => $periode,
            'tanggal_awal' => $awalAktif,
            'tanggal_akhir' => $akhirAktif,
            'labels' => $labels,
            'tanggal' => $tanggalTitik,
            'pemasukan' => $nilai,
            'total_pemasukan' => $totalAktif,
            'total_periode_sebelumnya' => $totalSebelumnya,
            'persentase_perubahan' => $persentase === null
                ? null : round($persentase, 2),
            'status_tren' => $statusTren,
            'ambang_stabil_persen' => TREN_AMBANG_STABIL_PERSEN,
            'ada_data' => array_sum($nilai) > 0
        ]
    ]);
} catch (Throwable $e) {
    error_log('API tren pemasukan: ' . $e->getMessage());

    kirimJsonTren(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
