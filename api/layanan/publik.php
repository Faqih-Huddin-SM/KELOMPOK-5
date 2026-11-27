<?php

declare(strict_types=1);

// [Card 6.4.3] Daftar layanan aktif untuk halaman publik. Tanpa login.
// Hanya nama dan harga (tanpa HPP, status, atau data lain).
// Urutan sama dengan Kasir (api/layanan/index.php): id_layanan terbaru dulu.
// Dibatasi 60 permintaan per menit per pengunjung.

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/rate_limit.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

batasiLaju('layanan-publik');

try {
    $stmt = $pdo->query(
        'SELECT nama_layanan, harga
         FROM layanan
         WHERE aktif = 1
         ORDER BY id_layanan DESC'
    );

    $data = array_map(
        static fn(array $l): array => [
            'nama_layanan' => $l['nama_layanan'],
            'harga' => (int) $l['harga']
        ],
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );

    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('API layanan/publik: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}