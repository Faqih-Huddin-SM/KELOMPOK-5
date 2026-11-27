<?php

declare(strict_types=1);

// Buffer di paling awal agar spasi/baris kosong yang tidak sengaja keluar dari
// file lain tidak ikut masuk ke isi PDF.
ob_start();

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../lib/rekap_data.php';


function kirimJsonLaporan(int $status, array $data): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

apiWajibLogin();

$role = strtolower(trim($_SESSION['role'] ?? ''));

if ($role !== 'owner') {
    kirimJsonLaporan(403, [
        'success' => false,
        'message' => 'Anda tidak memiliki izin mengakses halaman ini',
        'error_code' => 'FORBIDDEN'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');

    kirimJsonLaporan(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    // Batas bulan dan tanggal pembuatan memakai WIB.
    $zonaWIB = new DateTimeZone('Asia/Jakarta');
    $sekarangWIB = new DateTimeImmutable('now', $zonaWIB);

    $bulan = $_GET['bulan'] ?? $sekarangWIB->format('Y-m');

    $awal = is_string($bulan) && preg_match('/^[0-9]{4}-[0-9]{2}$/', $bulan)
        ? DateTimeImmutable::createFromFormat('!Y-m-d', $bulan . '-01', $zonaWIB)
        : false;

    if (!$awal || $awal->format('Y-m') !== $bulan) {
        kirimJsonLaporan(422, [
            'success' => false,
            'message' => 'Format bulan tidak valid. Gunakan YYYY-MM.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    $akhir = $awal->modify('last day of this month');

    $tanggalAwal = $awal->format('Y-m-d');
    $tanggalAkhir = $akhir->format('Y-m-d');

    // Pakai ulang perhitungan rekap yang sudah ada; pengeluaran per rentang tanggal.
    $pemasukan = ambilRekapPemasukan($pdo, $tanggalAwal, $tanggalAkhir);
    $layanan = ambilRekapLayanan($pdo, $tanggalAwal, $tanggalAkhir, 'terbanyak');
    $pengeluaran = ambilRekapPengeluaran($pdo, $tanggalAwal, $tanggalAkhir);

    // Tanpa pemasukan dan tanpa pengeluaran: hasil kosong yang jelas, bukan file.
    if ($pemasukan['jumlah_transaksi'] === 0 && $pengeluaran['jumlah_catatan'] === 0) {
        kirimJsonLaporan(200, [
            'success' => true,
            'message' => 'Tidak ada pemasukan maupun pengeluaran pada bulan ini.',
            'data' => [
                'bulan' => $bulan,
                'tanggal_awal' => $tanggalAwal,
                'tanggal_akhir' => $tanggalAkhir,
                'total_pemasukan' => 0,
                'total_pengeluaran' => 0,
                'saldo_bersih' => 0,
                'ada_data' => false
            ]
        ]);
    }
    // Library PDF dimuat di sini (bukan di atas file) supaya bila folder fpdf hilang,
    // hasilnya JSON 500 yang jelas, bukan halaman error PHP.
    $fileFpdf = __DIR__ . '/../lib/fpdf/fpdf.php';

    if (!is_file($fileFpdf)) {
        throw new RuntimeException('Library FPDF tidak ditemukan: api/lib/fpdf/fpdf.php.');
    }

    require_once __DIR__ . '/../lib/laporan_pdf.php';
    
    $fileIdentitas = __DIR__ . '/../../config/barbershop.php';

    if (!is_file($fileIdentitas)) {
        throw new RuntimeException('config/barbershop.php tidak ditemukan.');
    }

    $identitas = require $fileIdentitas;

    if (
        !is_array($identitas)
        || !is_string($identitas['nama'] ?? null)
        || trim($identitas['nama']) === ''
    ) {
        throw new RuntimeException('config/barbershop.php: nama barbershop belum diisi.');
    }

    $identitas = [
        'nama' => trim($identitas['nama']),
        'alamat' => is_string($identitas['alamat'] ?? null) ? trim($identitas['alamat']) : ''
    ];

    // Saldo bersih = total pemasukan - total pengeluaran, tanpa HPP.
    $saldoBersih = $pemasukan['total_pemasukan'] - $pengeluaran['total_pengeluaran'];

    // File dibuat penuh di memori dulu; bila gagal, tidak ada file setengah jadi terkirim.
    $isiPdf = LaporanBulananPdf::buat(
        $identitas,
        $awal,
        $akhir,
        $sekarangWIB,
        [
            'total_pemasukan' => $pemasukan['total_pemasukan'],
            'jumlah_transaksi' => $pemasukan['jumlah_transaksi'],
            'rincian_per_barber' => $pemasukan['rincian_per_barber'],
            'layanan' => $layanan,
            'total_pengeluaran' => $pengeluaran['total_pengeluaran'],
            'jumlah_catatan_pengeluaran' => $pengeluaran['jumlah_catatan'],
            'rincian_per_kategori' => $pengeluaran['rincian_per_kategori'],
            'saldo_bersih' => $saldoBersih
        ]
    );

    if (strncmp($isiPdf, '%PDF-', 5) !== 0) {
        throw new RuntimeException('Keluaran generator bukan PDF yang valid.');
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    http_response_code(200);
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="laporan-keuangan-' . $bulan . '.pdf"');
    header('Content-Length: ' . strlen($isiPdf));
    header('Cache-Control: private, no-store');
    echo $isiPdf;
    exit;
} catch (Throwable $e) {
    error_log('API laporan PDF: ' . $e->getMessage());

    kirimJsonLaporan(500, [
        'success' => false,
        'message' => 'Gagal membuat file laporan PDF. Data tidak diubah, silakan coba lagi.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}