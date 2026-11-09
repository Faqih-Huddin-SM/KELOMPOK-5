<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

function kirimJsonAkun(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function gagalValidasiAkun(string $pesan): void
{
    kirimJsonAkun(422, [
        'success' => false,
        'message' => $pesan,
        'error_code' => 'UNPROCESSABLE_ENTITY'
    ]);
}

function bacaJsonAkun(): array
{
    $data = json_decode((string) file_get_contents('php://input'), true);

    if (!is_array($data)) {
        kirimJsonAkun(400, [
            'success' => false,
            'message' => 'Format JSON tidak valid.',
            'error_code' => 'BAD_REQUEST'
        ]);
    }

    return $data;
}

function validasiIdAkun(array $data): int
{
    $id = filter_var($data['id_user'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id <= 0) {
        gagalValidasiAkun('ID user tidak valid.');
    }

    return $id;
}

function validasiNamaAkun(array $data): string
{
    $nama = is_string($data['nama'] ?? null) ? trim($data['nama']) : '';

    if ($nama === '' || mb_strlen($nama) > 100) {
        gagalValidasiAkun('Nama wajib diisi dan maksimal 100 karakter.');
    }

    return $nama;
}

// Spesialisasi boleh kosong; string kosong disimpan sebagai NULL.
function validasiSpesialisasiAkun(array $data): ?string
{
    $nilai = $data['spesialisasi'] ?? null;

    if ($nilai === null) {
        return null;
    }

    if (!is_string($nilai)) {
        gagalValidasiAkun('Spesialisasi harus berupa teks.');
    }

    $nilai = trim($nilai);

    if (mb_strlen($nilai) > 100) {
        gagalValidasiAkun('Spesialisasi maksimal 100 karakter.');
    }

    return $nilai === '' ? null : $nilai;
}

function tampilkanAkun(array $baris): array
{
    return [
        'id_user' => (int) $baris['id_user'],
        'username' => $baris['username'],
        'nama' => $baris['nama'],
        'spesialisasi' => $baris['spesialisasi'],
        'role' => $baris['role'],
        'aktif' => (int) $baris['aktif']
    ];
}

apiWajibLogin();

if (strtolower(trim($_SESSION['role'] ?? '')) !== 'owner') {
    kirimJsonAkun(403, [
        'success' => false,
        'message' => 'Anda tidak memiliki izin mengakses halaman ini',
        'error_code' => 'FORBIDDEN'
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST', 'PUT', 'PATCH'], true)) {
    header('Allow: GET, POST, PUT, PATCH');

    kirimJsonAkun(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    // GET: semua akun barber, termasuk yang nonaktif.
    if ($method === 'GET') {
        $stmt = $pdo->query(
            "SELECT id_user, username, nama, spesialisasi, role, aktif
             FROM users
             WHERE role = 'barber'
             ORDER BY nama ASC, id_user ASC"
        );

        kirimJsonAkun(200, [
            'success' => true,
            'data' => array_map('tampilkanAkun', $stmt->fetchAll(PDO::FETCH_ASSOC))
        ]);
    }

    $data = bacaJsonAkun();

    // POST: tambah akun barber, status awal aktif.
    if ($method === 'POST') {
        $nama = validasiNamaAkun($data);

        $username = is_string($data['username'] ?? null)
            ? trim($data['username'])
            : '';

        if ($username === '' || mb_strlen($username) > 50) {
            gagalValidasiAkun('Username wajib diisi dan maksimal 50 karakter.');
        }

        $password = $data['password'] ?? null;

        if (!is_string($password) || mb_strlen($password) < 6) {
            gagalValidasiAkun('Password wajib diisi dan minimal 6 karakter.');
        }

        $spesialisasi = validasiSpesialisasiAkun($data);

        $stmtCek = $pdo->prepare('SELECT 1 FROM users WHERE username = ? LIMIT 1');
        $stmtCek->execute([$username]);

        if ($stmtCek->fetchColumn()) {
            gagalValidasiAkun('Username sudah digunakan.');
        }

        try {
            $stmt = $pdo->prepare(
                "INSERT INTO users
                    (username, password_hash, nama, role, spesialisasi, aktif)
                 VALUES (?, ?, ?, 'barber', ?, 1)"
            );

            $stmt->execute([
                $username,
                password_hash($password, PASSWORD_DEFAULT),
                $nama,
                $spesialisasi
            ]);
        } catch (PDOException $e) {
            // Username yang sama masuk bersamaan (UNIQUE) diperlakukan sebagai username terpakai.
            if ($e->getCode() === '23000') {
                gagalValidasiAkun('Username sudah digunakan.');
            }

            throw $e;
        }

        kirimJsonAkun(201, [
            'success' => true,
            'message' => 'Akun barber berhasil ditambahkan.',
            'data' => [
                'id_user' => (int) $pdo->lastInsertId(),
                'username' => $username,
                'nama' => $nama,
                'spesialisasi' => $spesialisasi,
                'role' => 'barber',
                'aktif' => 1
            ]
        ]);
    }

    // PUT: ubah nama dan spesialisasi. Username tidak berubah.
    if ($method === 'PUT') {
        $id = validasiIdAkun($data);
        $nama = validasiNamaAkun($data);

        $stmtAda = $pdo->prepare(
            "SELECT id_user, spesialisasi FROM users WHERE id_user = ? AND role = 'barber' LIMIT 1"
        );
        $stmtAda->execute([$id]);
        $lama = $stmtAda->fetch(PDO::FETCH_ASSOC);

        if (!$lama) {
            kirimJsonAkun(404, [
                'success' => false,
                'message' => 'Akun barber tidak ditemukan.',
                'error_code' => 'NOT_FOUND'
            ]);
        }

        // Field spesialisasi tidak dikirim = tidak diubah. Dikirim kosong = dikosongkan.
        $spesialisasi = array_key_exists('spesialisasi', $data)
            ? validasiSpesialisasiAkun($data)
            : $lama['spesialisasi'];

        $stmt = $pdo->prepare('UPDATE users SET nama = ?, spesialisasi = ? WHERE id_user = ?');
        $stmt->execute([$nama, $spesialisasi, $id]);

        $stmtBaru = $pdo->prepare(
            'SELECT id_user, username, nama, spesialisasi, role, aktif FROM users WHERE id_user = ?'
        );
        $stmtBaru->execute([$id]);

        kirimJsonAkun(200, [
            'success' => true,
            'message' => 'Profil barber berhasil diperbarui.',
            'data' => tampilkanAkun($stmtBaru->fetch(PDO::FETCH_ASSOC))
        ]);
    }

    // PATCH: ubah status aktif/nonaktif.
    $id = validasiIdAkun($data);

    $aktif = $data['aktif'] ?? null;

    if (is_bool($aktif)) {
        $aktif = (int) $aktif;
    } else {
        $aktif = filter_var($aktif, FILTER_VALIDATE_INT);
    }

    if (!in_array($aktif, [0, 1], true)) {
        gagalValidasiAkun('Status aktif harus bernilai 0 atau 1.');
    }

    $stmtAkun = $pdo->prepare('SELECT id_user, role FROM users WHERE id_user = ? LIMIT 1');
    $stmtAkun->execute([$id]);
    $akun = $stmtAkun->fetch(PDO::FETCH_ASSOC);

    if (!$akun) {
        kirimJsonAkun(404, [
            'success' => false,
            'message' => 'Akun barber tidak ditemukan.',
            'error_code' => 'NOT_FOUND'
        ]);
    }

    // Akun owner tidak boleh dinonaktifkan (aksi tidak diperbolehkan).
    if ($akun['role'] === 'owner' && $aktif === 0) {
        kirimJsonAkun(403, [
            'success' => false,
            'message' => 'Akun owner tidak dapat dinonaktifkan.',
            'error_code' => 'FORBIDDEN'
        ]);
    }

    $stmt = $pdo->prepare('UPDATE users SET aktif = ? WHERE id_user = ?');
    $stmt->execute([$aktif, $id]);

    kirimJsonAkun(200, [
        'success' => true,
        'message' => $aktif === 1
            ? 'Akun barber berhasil diaktifkan.'
            : 'Akun barber berhasil dinonaktifkan.',
        'data' => [
            'id_user' => $id,
            'aktif' => $aktif
        ]
    ]);
} catch (Throwable $e) {
    error_log('API barber/akun: ' . $e->getMessage());

    kirimJsonAkun(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
