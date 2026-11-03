
<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function apiWajibLogin(): void
{
    header('Content-Type: application/json; charset=utf-8');

    $idUser = $_SESSION['id_user'] ?? null;
    $lastActivity = $_SESSION['last_activity'] ?? null;

    // Sesi belum memiliki identitas pengguna.
    if (!$idUser || !$lastActivity) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Silakan login terlebih dahulu.',
            'error_code' => 'UNAUTHORIZED'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Sesi berakhir setelah 30 menit tidak aktif.
    if (time() - (int) $lastActivity > 1800) {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();

            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();

        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Sesi login telah berakhir. Silakan login kembali.',
            'error_code' => 'UNAUTHORIZED'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Perbarui waktu aktivitas pengguna.
    $_SESSION['last_activity'] = time();
}

function apiWajibOwner(): void
{
    apiWajibLogin();

    $role = strtolower(trim($_SESSION['role'] ?? ''));

    if ($role !== 'owner') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Akses hanya untuk owner.',
            'error_code' => 'FORBIDDEN'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}