<?php

declare(strict_types=1);

// [Card 6.4.3] Batas laju untuk endpoint publik (tanpa login).
//
// Cara pakai di endpoint publik (taruh setelah require config, sebelum query):
//
//     require_once __DIR__ . '/../middleware/rate_limit.php';
//     batasiLaju('nama-endpoint');            // 60 permintaan per menit
//     batasiLaju('info-usaha', 30, 60);       // contoh batas lain: 30 per 60 detik
//
// - Hitungan per pengunjung (alamat IP) dan per nama endpoint.
// - Jendela tetap (fixed window): menit berganti, hitungan mulai dari nol lagi.
// - Melewati batas -> 429 dengan header Retry-After, lalu skrip berhenti.
// - Bila penyimpanan hitungan tidak bisa dipakai, permintaan tetap dilayani
//   (halaman publik tidak boleh mati karena pembatas) dan kesalahan dicatat.

function batasiLaju(string $nama, int $maks = 60, int $jendelaDetik = 60): void
{
    $sekarang = time();
    $idJendela = intdiv($sekarang, $jendelaDetik);
    $sisaDetik = (($idJendela + 1) * $jendelaDetik) - $sekarang;
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'tidak-diketahui');

    $folder = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kataji_ratelimit';

    if (!is_dir($folder) && !@mkdir($folder, 0700, true) && !is_dir($folder)) {
        error_log('rate_limit: folder penyimpanan tidak dapat dibuat.');
        return;
    }

    $file = $folder . DIRECTORY_SEPARATOR
        . hash('sha256', $nama . '|' . $ip . '|' . $idJendela) . '.cnt';

    $fp = @fopen($file, 'c+');

    if ($fp === false) {
        error_log('rate_limit: file hitungan tidak dapat dibuka.');
        return;
    }

    $jumlah = 0;

    if (flock($fp, LOCK_EX)) {
        $jumlah = (int) stream_get_contents($fp) + 1;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string) $jumlah);
        fflush($fp);
        flock($fp, LOCK_UN);
    }

    fclose($fp);

    // Sesekali bersihkan file hitungan jendela yang sudah lewat.
    if (random_int(1, 100) === 1) {
        foreach (glob($folder . DIRECTORY_SEPARATOR . '*.cnt') ?: [] as $lama) {
            if (@filemtime($lama) < $sekarang - (2 * $jendelaDetik)) {
                @unlink($lama);
            }
        }
    }

    header('X-RateLimit-Limit: ' . $maks);
    header('X-RateLimit-Remaining: ' . max(0, $maks - $jumlah));

    if ($jumlah > $maks) {
        header('Retry-After: ' . $sisaDetik);
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => 'Terlalu banyak permintaan. Silakan coba lagi sebentar lagi',
            'error_code' => 'TOO_MANY_REQUESTS'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}