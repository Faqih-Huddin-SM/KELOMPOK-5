<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

function kirimJsonResetPassword(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

apiWajibLogin();

if (strtolower(trim($_SESSION['role'] ?? '')) !== 'owner') {
    kirimJsonResetPassword(403, [
        'success' => false,
        'message' => 'Anda tidak memiliki izin mengakses halaman ini',
        'error_code' => 'FORBIDDEN'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    header('Allow: PUT');

    kirimJsonResetPassword(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    $data = json_decode((string) file_get_contents('php://input'), true);

    if (!is_array($data)) {
        kirimJsonResetPassword(400, [
            'success' => false,
            'message' => 'Format JSON tidak valid.',
            'error_code' => 'BAD_REQUEST'
        ]);
    }

    $id = filter_var($data['id_user'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id <= 0) {
        kirimJsonResetPassword(422, [
            'success' => false,
            'message' => 'ID user tidak valid.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    $passwordBaru = $data['password_baru'] ?? null;

    if (!is_string($passwordBaru) || mb_strlen($passwordBaru) < 6) {
        kirimJsonResetPassword(422, [
            'success' => false,
            'message' => 'Password baru wajib diisi dan minimal 6 karakter.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    // Hanya akun barber yang aktif yang bisa di-reset.
    $stmtCek = $pdo->prepare(
        "SELECT 1 FROM users WHERE id_user = ? AND role = 'barber' AND aktif = 1 LIMIT 1"
    );
    $stmtCek->execute([$id]);

    if (!$stmtCek->fetchColumn()) {
        kirimJsonResetPassword(404, [
            'success' => false,
            'message' => 'Akun tidak ditemukan atau tidak aktif',
            'error_code' => 'NOT_FOUND'
        ]);
    }

    $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id_user = ?');
    $stmt->execute([password_hash($passwordBaru, PASSWORD_DEFAULT), $id]);

    kirimJsonResetPassword(200, [
        'success' => true,
        'message' => 'Password barber berhasil direset.',
        'data' => ['id_user' => $id]
    ]);
} catch (Throwable $e) {
    error_log('API barber/reset_password: ' . $e->getMessage());

    kirimJsonResetPassword(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
