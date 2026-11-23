<?php

declare(strict_types=1);

// [Card 3.4.3] Unggah, ganti, dan hapus foto profil barber (hanya owner).
//   POST   multipart/form-data: id_user + foto  -> unggah atau ganti foto
//   DELETE ?id_user=ID (atau JSON {"id_user": ID}) -> hapus foto

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

const FOTO_MAKS_BYTE = 10 * 1024 * 1024; // 10 MB
const FOTO_FOLDER_DB = 'uploads/barber/';

function kirimJsonFoto(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function gagalFoto(string $pesan, int $status = 422, string $kode = 'UNPROCESSABLE_ENTITY'): void
{
    kirimJsonFoto($status, [
        'success' => false,
        'message' => $pesan,
        'error_code' => $kode
    ]);
}

function hapusFileFoto(?string $path): void
{
    if (!$path || strpos($path, FOTO_FOLDER_DB) !== 0) {
        return;
    }

    $namaFile = basename($path);

    if ($namaFile === '' || $namaFile === '.' || $namaFile === '..') {
        return;
    }

    $file = __DIR__ . '/../../' . FOTO_FOLDER_DB . $namaFile;

    if (is_file($file)) {
        unlink($file);
    }
}

function cariBarberFoto(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare(
        "SELECT id_user, nama, foto, aktif
         FROM users
         WHERE id_user = ?
         LIMIT 1"
    );
    $stmt->execute([$id]);
    $baris = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$baris) {
        kirimJsonFoto(404, [
            'success' => false,
            'message' => 'Akun barber tidak ditemukan.',
            'error_code' => 'NOT_FOUND'
        ]);
    }

    return $baris;
}

apiWajibLogin();

if (strtolower(trim($_SESSION['role'] ?? '')) !== 'owner') {
    kirimJsonFoto(403, [
        'success' => false,
        'message' => 'Anda tidak memiliki izin mengakses halaman ini',
        'error_code' => 'FORBIDDEN'
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['POST', 'DELETE'], true)) {
    header('Allow: POST, DELETE');
    kirimJsonFoto(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    // ==========================================
    // DELETE: hapus foto
    // ==========================================
    if ($method === 'DELETE') {
        $idInput = $_GET['id_user'] ?? null;

        if ($idInput === null) {
            $json = json_decode((string) file_get_contents('php://input'), true);
            $idInput = is_array($json) ? ($json['id_user'] ?? null) : null;
        }

        $id = filter_var($idInput, FILTER_VALIDATE_INT);

        if ($id === false || $id === null || $id <= 0) {
            gagalFoto('ID user tidak valid.');
        }

        $barber = cariBarberFoto($pdo, $id);

        if ($barber['foto'] === null || $barber['foto'] === '') {
            gagalFoto('Barber ini belum memiliki foto.', 404, 'NOT_FOUND');
        }

        // Kosongkan kolom lebih dulu; file dihapus setelah database berhasil.
        $stmt = $pdo->prepare('UPDATE users SET foto = NULL WHERE id_user = ?');
        $stmt->execute([$id]);

        hapusFileFoto($barber['foto']);

        kirimJsonFoto(200, [
            'success' => true,
            'message' => 'Foto barber berhasil dihapus.',
            'data' => ['id_user' => $id, 'foto' => null]
        ]);
    }

    // ==========================================
    // POST: unggah atau ganti foto
    // ==========================================
    // Bila ukuran kiriman melebihi post_max_size, PHP mengosongkan $_POST dan $_FILES.
    if (
        empty($_POST) && empty($_FILES) &&
        (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0
    ) {
        gagalFoto('Ukuran foto maksimal 10 MB');
    }

    $id = filter_var($_POST['id_user'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id <= 0) {
        gagalFoto('ID user tidak valid.');
    }

    $barber = cariBarberFoto($pdo, $id);
    $file = $_FILES['foto'] ?? null;

    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        gagalFoto('Pilih foto yang akan diunggah.');
    }

    if (
        $file['error'] === UPLOAD_ERR_INI_SIZE ||
        $file['error'] === UPLOAD_ERR_FORM_SIZE
    ) {
        gagalFoto('Ukuran foto maksimal 10 MB');
    }

    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        gagalFoto('Foto gagal diunggah. Silakan coba lagi', 500, 'INTERNAL_SERVER_ERROR');
    }

    if ((int) $file['size'] > FOTO_MAKS_BYTE) {
        gagalFoto('Ukuran foto maksimal 10 MB');
    }

    // Tipe file diperiksa dari isi file, bukan dari ekstensi atau Content-Type kiriman.
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $formatDiizinkan = ['image/jpeg' => 'jpg', 'image/png' => 'png'];

    if (!isset($formatDiizinkan[$mime]) || @getimagesize($file['tmp_name']) === false) {
        gagalFoto('Format foto harus JPG atau PNG');
    }

    $folder = __DIR__ . '/../../' . FOTO_FOLDER_DB;

    if (!is_dir($folder) && !mkdir($folder, 0755, true) && !is_dir($folder)) {
        throw new RuntimeException('Folder foto barber tidak dapat dibuat.');
    }

    // Nama file diacak.
    $namaFile = bin2hex(random_bytes(16)) . '.' . $formatDiizinkan[$mime];
    $pathBaru = FOTO_FOLDER_DB . $namaFile;

    if (!move_uploaded_file($file['tmp_name'], $folder . $namaFile)) {
        throw new RuntimeException('File foto gagal disimpan.');
    }

    try {
        $stmt = $pdo->prepare('UPDATE users SET foto = ? WHERE id_user = ?');
        $stmt->execute([$pathBaru, $id]);
    } catch (Throwable $e) {
        // Database gagal: buang file baru, foto lama tidak berubah.
        hapusFileFoto($pathBaru);
        throw $e;
    }

    // Database berhasil: foto lama baru boleh dihapus dari penyimpanan.
    hapusFileFoto($barber['foto']);

    kirimJsonFoto(200, [
        'success' => true,
        'message' => $barber['foto'] ? 'Foto barber berhasil diganti.' : 'Foto barber berhasil diunggah.',
        'data' => ['id_user' => $id, 'foto' => $pathBaru]
    ]);
} catch (Throwable $e) {
    error_log('API barber/foto: ' . $e->getMessage());

    kirimJsonFoto(500, [
        'success' => false,
        'message' => $method === 'POST'
            ? 'Foto gagal diunggah. Silakan coba lagi'
            : 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}