<?php

declare(strict_types=1);

// [Card 3.4.3 / 6.4] Daftar barber aktif untuk halaman publik. Tanpa login.
// Barber nonaktif tidak ikut. Akun owner tidak ikut.

require_once __DIR__ . '/../../config/config.php';

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

try {
    $stmt = $pdo->query(
        "SELECT id_user, nama, spesialisasi, foto
         FROM users
         WHERE role = 'barber' AND aktif = 1
         ORDER BY nama ASC, id_user ASC"
    );

    $data = array_map(
        static fn(array $b): array => [
            'id_user' => (int) $b['id_user'],
            'nama' => $b['nama'],
            'spesialisasi' => $b['spesialisasi'],
            'foto' => $b['foto']
        ],
        $stmt->fetchAll(PDO::FETCH_ASSOC)
    );

    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('API barber/publik: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}