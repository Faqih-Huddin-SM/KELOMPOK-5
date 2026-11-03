<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

function kirimJsonRiwayatPelanggan(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

try {
    $role = strtolower(trim($_SESSION['role'] ?? ''));

    // Hanya owner dan barber yang boleh melihat riwayat pelanggan.
    if (!in_array($role, ['owner', 'barber'], true)) {
        kirimJsonRiwayatPelanggan(403, [
            'success' => false,
            'message' => 'Role tidak diizinkan.',
            'error_code' => 'FORBIDDEN'
        ]);
    }

    // Endpoint ini hanya menerima GET.
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Allow: GET');

        kirimJsonRiwayatPelanggan(405, [
            'success' => false,
            'message' => 'Method tidak didukung.',
            'error_code' => 'METHOD_NOT_ALLOWED'
        ]);
    }

    // ID pelanggan wajib berupa bilangan bulat positif.
    $idPelanggan = filter_var(
        $_GET['id_pelanggan'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($idPelanggan === false || $idPelanggan === null) {
        kirimJsonRiwayatPelanggan(400, [
            'success' => false,
            'message' => 'ID pelanggan tidak valid.',
            'error_code' => 'BAD_REQUEST'
        ]);
    }

    // Pelanggan harus ada dan belum dihapus (soft delete).
    $stmtPelanggan = $pdo->prepare(
        'SELECT id_pelanggan, nama
         FROM pelanggan
         WHERE id_pelanggan = :id
           AND dihapus_pada IS NULL
         LIMIT 1'
    );

    $stmtPelanggan->execute([':id' => $idPelanggan]);
    $pelanggan = $stmtPelanggan->fetch(PDO::FETCH_ASSOC);

    if (!$pelanggan) {
        kirimJsonRiwayatPelanggan(404, [
            'success' => false,
            'message' => 'Pelanggan tidak ditemukan.',
            'error_code' => 'NOT_FOUND'
        ]);
    }

    // Satu baris per layanan pada setiap transaksi, jadi transaksi
    // multi-layanan terbaca per baris. Transaksi yang sudah dihapus
    // (soft delete) tidak ikut. Terbaru lebih dulu.
    $stmtRiwayat = $pdo->prepare(
        'SELECT
            t.id_transaksi,
            t.tanggal,
            t.waktu,
            dt.id_layanan,
            dt.nama_layanan_saat_transaksi AS nama_layanan,
            dt.jumlah
         FROM transaksi t
         JOIN detail_transaksi dt
            ON dt.id_transaksi = t.id_transaksi
         WHERE t.id_pelanggan = :id
           AND t.dihapus_pada IS NULL
         ORDER BY
            t.tanggal DESC,
            t.waktu DESC,
            t.id_transaksi DESC,
            dt.id_detail ASC'
    );

    $stmtRiwayat->execute([':id' => $idPelanggan]);
    $baris = $stmtRiwayat->fetchAll(PDO::FETCH_ASSOC);

    $riwayat = [];
    $idTransaksiUnik = [];

    foreach ($baris as $item) {
        $idTransaksi = (int) $item['id_transaksi'];
        $idTransaksiUnik[$idTransaksi] = true;

        $riwayat[] = [
            'id_transaksi' => $idTransaksi,
            'tanggal' => $item['tanggal'],
            'waktu' => $item['waktu'],
            'id_layanan' => $item['id_layanan'] === null
                ? null
                : (int) $item['id_layanan'],
            'nama_layanan' => $item['nama_layanan'],
            'jumlah' => (int) $item['jumlah']
        ];
    }

    // Pelanggan tanpa transaksi tetap 200 dengan riwayat kosong.
    kirimJsonRiwayatPelanggan(200, [
        'success' => true,
        'data' => [
            'pelanggan' => [
                'id_pelanggan' => (int) $pelanggan['id_pelanggan'],
                'nama' => $pelanggan['nama']
            ],
            'jumlah_kunjungan' => count($idTransaksiUnik),
            'riwayat' => $riwayat,
            'ada_data' => count($riwayat) > 0
        ]
    ]);
} catch (Throwable $e) {
    error_log('API riwayat pelanggan: ' . $e->getMessage());

    kirimJsonRiwayatPelanggan(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}