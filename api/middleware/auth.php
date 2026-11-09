<?php
require_once __DIR__ . '/../../config/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


function hancurkanSesiLogin(): void
{
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
        // Akun yang dinonaktifkan (atau sudah tidak ada) tidak boleh melanjutkan sesi lama.
    global $pdo;

    try {
        $stmtAkun = $pdo->prepare('SELECT role, aktif FROM users WHERE id_user = ? LIMIT 1');
        $stmtAkun->execute([(int) $idUser]);
        $akun = $stmtAkun->fetch(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        error_log('Middleware auth: ' . $e->getMessage());

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan pada server.',
            'error_code' => 'INTERNAL_SERVER_ERROR'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!$akun || (int) $akun['aktif'] !== 1) {
        hancurkanSesiLogin();

        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Akun Anda tidak aktif. Silakan hubungi owner.',
            'error_code' => 'UNAUTHORIZED'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Role selalu mengikuti data terbaru di database.
    $_SESSION['role'] = $akun['role'];

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