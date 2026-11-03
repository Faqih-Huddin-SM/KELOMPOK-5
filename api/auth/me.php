
<?php

require_once __DIR__ . '/../middleware/auth.php';

apiWajibLogin();

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'success' => true,
    'message' => 'Sesi login valid.',
    'data' => [
        'id_user' => (int) $_SESSION['id_user'],
        'nama' => $_SESSION['nama'] ?? null,
        'role' => $_SESSION['role'] ?? null
    ]
], JSON_UNESCAPED_UNICODE);
