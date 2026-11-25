<?php

declare(strict_types=1);

// [Card 6.6.3] Info usaha untuk halaman publik. Tanpa login.
// Memakai middleware batas laju dari kartu 6.4.3 (60 permintaan per menit per pengunjung).
// Belum pernah diisi -> 200 dengan data = null (bukan error).

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/rate_limit.php';

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

batasiLaju('info-usaha-publik');

const NAMA_HARI = [1 => 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

try {
    $baris = $pdo->query(
        'SELECT alamat, tautan_peta, hari_awal, hari_akhir, jam_buka, jam_tutup,
                nomor_whatsapp, instagram, tiktok, facebook, tagline, tentang
         FROM info_usaha WHERE id_info = 1'
    )->fetch(PDO::FETCH_ASSOC);

    if (!$baris) {
        echo json_encode(['success' => true, 'data' => null], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Nomor tampil seperti yang diisi owner; tautan WhatsApp memakai format 62...
    $digit = ltrim((string) $baris['nomor_whatsapp'], '+');
    $internasional = strpos($digit, '08') === 0 ? '62' . substr($digit, 1) : $digit;

    $sosial = static function (?string $username, string $awalUrl): ?array {
        return $username === null || $username === ''
            ? null
            : ['username' => $username, 'url' => $awalUrl . $username];
    };

    echo json_encode([
        'success' => true,
        'data' => [
            'alamat' => $baris['alamat'],
            'tautan_peta' => $baris['tautan_peta'],
            'jam_buka' => [
                'hari_awal' => (int) $baris['hari_awal'],
                'hari_akhir' => (int) $baris['hari_akhir'],
                'nama_hari_awal' => NAMA_HARI[(int) $baris['hari_awal']],
                'nama_hari_akhir' => NAMA_HARI[(int) $baris['hari_akhir']],
                'jam_buka' => substr((string) $baris['jam_buka'], 0, 5),
                'jam_tutup' => substr((string) $baris['jam_tutup'], 0, 5)
            ],
            'nomor_whatsapp' => $baris['nomor_whatsapp'],
            'whatsapp_link' => 'https://wa.me/' . $internasional,
            'instagram' => $sosial($baris['instagram'], 'https://www.instagram.com/'),
            'tiktok' => $sosial($baris['tiktok'], 'https://www.tiktok.com/@'),
            'facebook' => $sosial($baris['facebook'], 'https://www.facebook.com/'),
            'tagline' => $baris['tagline'],
            'tentang' => $baris['tentang']
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('API info_usaha/publik: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ], JSON_UNESCAPED_UNICODE);
}