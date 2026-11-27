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
        // 7 hari terakhir yang sudah lengkap: kemarin dan 6 hari sebelumnya.
        // Hari ini belum selesai, jadi tidak dihitung.
        $awal = $hariIni->modify('-7 days');
        $akhir = $hariIni->modify('-1 day');
        $awalSebelumnya = $awal->modify('-7 days');
        $akhirSebelumnya = $awal->modify('-1 day');
        $pembanding = '7_hari_sebelumnya';
    } elseif ($periode === 'minggu') {
        // Bulan berjalan dibagi 4 titik (Minggu 1-4).
        // Pembanding: seluruh bulan sebelumnya.
        $awal = $hariIni->modify('first day of this month');
        $akhir = $hariIni->modify('last day of this month');
        $awalSebelumnya = $awal->modify('-1 month');
        $akhirSebelumnya = $awal->modify('-1 day');
        $pembanding = 'bulan_lalu';
    } else {
        // Tahun berjalan: Januari sampai Desember.
        // Pembanding: seluruh tahun sebelumnya.
        $tahun = (int) $hariIni->format('Y');
        $awal = new DateTimeImmutable($tahun . '-01-01', $zona);
        $akhir = new DateTimeImmutable($tahun . '-12-31', $zona);
        $awalSebelumnya = new DateTimeImmutable(($tahun - 1) . '-01-01', $zona);
        $akhirSebelumnya = new DateTimeImmutable(($tahun - 1) . '-12-31', $zona);
        $pembanding = 'tahun_lalu';
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
    $daftarTitik = [];
    $totalAktif = 0;

    // Setiap titik grafik: [label, tanggal awal, tanggal akhir].
    $titik = [];

    if ($periode === 'bulan') {
        $namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        for ($m = 1; $m <= 12; $m++) {
            $awalBulan = new DateTimeImmutable(
                sprintf('%04d-%02d-01', $tahun, $m),
                $zona
            );
            $titik[] = [
                $namaBulan[$m - 1],
                $awalBulan,
                $awalBulan->modify('last day of this month')
            ];
        }
    } elseif ($periode === 'minggu') {
        // Minggu 1-4: tanggal 1-7, 8-14, 15-21, dan 22 sampai akhir bulan.
        $batasMinggu = [[1, 7], [8, 14], [15, 21], [22, null]];

        foreach ($batasMinggu as $i => $batas) {
            $awalMinggu = $awal->modify('+' . ($batas[0] - 1) . ' days');
            $akhirMinggu = $batas[1] === null
                ? $akhir
                : $awal->modify('+' . ($batas[1] - 1) . ' days');
            $titik[] = ['Minggu ' . ($i + 1), $awalMinggu, $akhirMinggu];
        }
    } else {
        for ($i = 0; $i < 7; $i++) {
            $hari = $awal->modify("+$i days");
            $titik[] = [$hari->format('l'), $hari, $hari];
        }
    }

    foreach ($titik as $item) {
        $a = $item[1]->format('Y-m-d');
        $b = $item[2]->format('Y-m-d');
        $jumlah = 0;

        foreach ($totalPerTanggal as $tgl => $total) {
            if ($tgl >= $a && $tgl <= $b) {
                $jumlah += $total;
            }
        }

        $labels[] = $item[0];
        $tanggalTitik[] = $periode === 'bulan'
            ? $item[1]->format('Y-m')
            : $a;
        $nilai[] = $jumlah;
        $totalAktif += $jumlah;

        $daftarTitik[] = [
            'label' => $item[0],
            'tanggal_awal' => $a,
            'tanggal_akhir' => $b,
            'total_pemasukan' => $jumlah
        ];
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
            'titik' => $daftarTitik,
            'total_pemasukan' => $totalAktif,
            'pembanding' => $pembanding,
            'tanggal_awal_sebelumnya' => $awalLama,
            'tanggal_akhir_sebelumnya' => $akhirLama,
            'total_periode_sebelumnya' => $totalSebelumnya,
            'persentase_perubahan' => $persentase === null
                ? null : round($persentase, 2),
            'status_tren' => $statusTren,
            'ambang_stabil_persen' => TREN_AMBANG_STABIL_PERSEN,
            'ada_data' => $totalAktif > 0
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
