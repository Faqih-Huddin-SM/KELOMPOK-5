
<?php

header('Content-Type: application/json; charset=utf-8');

function kirimJson(int $status, array $body): void
{
    http_response_code($status);

    echo json_encode(
        $body,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// Endpoint login hanya menerima POST.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');

    kirimJson(405, [
        'success' => false,
        'message' => 'Method HTTP tidak diizinkan.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

// Request harus menggunakan JSON.
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (stripos($contentType, 'application/json') !== 0) {
    kirimJson(415, [
        'success' => false,
        'message' => 'Content-Type harus application/json.',
        'error_code' => 'UNSUPPORTED_MEDIA_TYPE'
    ]);
}

// Baca dan periksa JSON.
$input = json_decode(
    file_get_contents('php://input'),
    true
);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
    kirimJson(400, [
        'success' => false,
        'message' => 'Format JSON tidak valid.',
        'error_code' => 'BAD_REQUEST'
    ]);
}

$username = $input['username'] ?? null;
$password = $input['password'] ?? null;

if (
    !is_string($username) ||
    !is_string($password) ||
    trim($username) === '' ||
    $password === ''
) {
    kirimJson(422, [
        'success' => false,
        'message' => 'Username dan password wajib diisi.',
        'error_code' => 'UNPROCESSABLE_ENTITY'
    ]);
}

try {
    require_once __DIR__ . '/../../config/config.php';

    $stmt = $pdo->prepare(
        'SELECT id_user, username, password_hash, nama, role
         FROM users
         WHERE username = ? AND aktif = 1
         LIMIT 1'
    );

    $stmt->execute([trim($username)]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        kirimJson(401, [
            'success' => false,
            'message' => 'Username atau password salah.',
            'error_code' => 'UNAUTHORIZED'
        ]);
    }

    // Ganti ID session untuk membantu mencegah session fixation.
    session_regenerate_id(true);

    $_SESSION['id_user'] = (int) $user['id_user'];
    $_SESSION['nama'] = $user['nama'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_time'] = time();
    $_SESSION['last_activity'] = time();

    kirimJson(200, [
        'success' => true,
        'message' => 'Login berhasil.',
        'data' => [
            'id_user' => (int) $user['id_user'],
            'username' => $user['username'],
            'nama' => $user['nama'],
            'role' => $user['role']
        ]
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    kirimJson(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
