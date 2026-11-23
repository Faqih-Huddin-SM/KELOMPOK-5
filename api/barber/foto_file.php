<?php

declare(strict_types=1);

// [Card 6.4.3] Menyajikan file foto barber (dipanggil otomatis lewat
// uploads/barber/.htaccess, alamat foto di frontend tidak berubah).
// - Pengunjung publik: hanya foto barber AKTIF; foto barber nonaktif -> 404.
// - Owner yang login: boleh melihat semua foto (halaman kelola barber).

require_once __DIR__ . '/../../config/config.php';

function fotoTidakAda(): void
{
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Foto tidak ditemukan.',
        'error_code' => 'NOT_FOUND'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$nama = $_GET['f'] ?? '';

if (
    !is_string($nama) ||
    !preg_match('/^[a-f0-9]{32}\.(jpg|png)$/', $nama, $cocok)
) {
    fotoTidakAda();
}

try {
    $stmt = $pdo->prepare(
        'SELECT role, aktif FROM users WHERE foto = ? LIMIT 1'
    );
    $stmt->execute(['uploads/barber/' . $nama]);
    $barber = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    error_log('API barber/foto_file: ' . $e->getMessage());
    fotoTidakAda();
}

if (!$barber) {
    fotoTidakAda();
}

$adalahOwner = strtolower(trim($_SESSION['role'] ?? '')) === 'owner';
$barberAktif = $barber['role'] === 'barber' && (int) $barber['aktif'] === 1;

if (!$adalahOwner && !$barberAktif) {
    fotoTidakAda();
}

$file = __DIR__ . '/../../uploads/barber/' . $nama;

if (!is_file($file)) {
    fotoTidakAda();
}

header('Content-Type: ' . ($cocok[1] === 'png' ? 'image/png' : 'image/jpeg'));
header('Content-Length: ' . filesize($file));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: ' . ($adalahOwner ? 'private, no-cache' : 'public, max-age=60'));
readfile($file);
