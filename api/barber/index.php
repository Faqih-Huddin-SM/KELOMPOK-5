<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

function kirimJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        header('Allow: GET');

        kirimJson(405, [
            'success' => false,
            'message' => 'Method tidak didukung.',
            'error_code' => 'METHOD_NOT_ALLOWED'
        ]);
    }

    $stmt = $pdo->prepare(
        "SELECT id_user, nama
         FROM users
         WHERE role IN ('barber', 'owner')
           AND aktif = 1
         ORDER BY nama ASC"
    );

    $stmt->execute();

    kirimJson(200, [
        'success' => true,
        'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (Throwable $e) {
    error_log('API barber: ' . $e->getMessage());

    kirimJson(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}