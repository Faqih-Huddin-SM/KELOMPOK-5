<?php

declare(strict_types=1);

// [Card 3.4.3 / 6.4.3] Daftar barber aktif untuk halaman publik. Tanpa login.
// Hanya data yang tampil: nama, spesialisasi, foto. Urut abjad nama.
// Barber nonaktif dan akun owner tidak ikut.
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

batasiLaju('barber-publik');

try {
    $stmt = $pdo->query(
        "SELECT nama, spesialisasi, foto
         FROM users
         WHERE role = 'barber' AND aktif = 1
         ORDER BY nama ASC, id_user ASC"
    );

    echo json_encode([
        'success' => true,
        'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('API barber/publik: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}