<?php

declare(strict_types=1);

// [Card 6.6.3] Info usaha untuk halaman Pengaturan (hanya owner).
//   GET -> baca info usaha (data = null bila belum pernah diisi)
//   PUT -> simpan info usaha (menimpa seluruh isi; satu baris saja)
// Sumber tunggal aturan validasi dan pesan kesalahan info usaha: bagian 13 CONTRACT.md.

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

function kirimInfoUsaha(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function tolakValidasi(string $pesan, string $kolom): void
{
    kirimInfoUsaha(422, [
        'success' => false,
        'message' => $pesan,
        'error_code' => 'UNPROCESSABLE_ENTITY',
        'field' => $kolom
    ]);
}

function infoUsahaBentukOwner(array $baris): array
{
    return [
        'alamat' => $baris['alamat'],
        'tautan_peta' => $baris['tautan_peta'],
        'hari_awal' => (int) $baris['hari_awal'],
        'hari_akhir' => (int) $baris['hari_akhir'],
        'jam_buka' => substr((string) $baris['jam_buka'], 0, 5),
        'jam_tutup' => substr((string) $baris['jam_tutup'], 0, 5),
        'nomor_whatsapp' => $baris['nomor_whatsapp'],
        'instagram' => $baris['instagram'],
        'tiktok' => $baris['tiktok'],
        'facebook' => $baris['facebook'],
        'tagline' => $baris['tagline'],
        'tentang' => $baris['tentang']
    ];
}

apiWajibLogin();

if (strtolower(trim($_SESSION['role'] ?? '')) !== 'owner') {
    kirimInfoUsaha(403, [
        'success' => false,
        'message' => 'Anda tidak memiliki izin mengakses halaman ini',
        'error_code' => 'FORBIDDEN'
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'PUT'], true)) {
    header('Allow: GET, PUT');
    kirimInfoUsaha(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

const KOLOM_INFO_USAHA =
    'alamat, tautan_peta, hari_awal, hari_akhir, jam_buka, jam_tutup,
     nomor_whatsapp, instagram, tiktok, facebook, tagline, tentang';

try {
    // ==========================================
    // GET: baca info usaha
    // ==========================================
    if ($method === 'GET') {
        $baris = $pdo->query(
            'SELECT ' . KOLOM_INFO_USAHA . ' FROM info_usaha WHERE id_info = 1'
        )->fetch(PDO::FETCH_ASSOC);

        kirimInfoUsaha(200, [
            'success' => true,
            'data' => $baris ? infoUsahaBentukOwner($baris) : null
        ]);
    }

    // ==========================================
    // PUT: simpan info usaha
    // ==========================================
    $input = json_decode((string) file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($input)) {
        kirimInfoUsaha(400, [
            'success' => false,
            'message' => 'Body harus berupa JSON yang valid.',
            'error_code' => 'BAD_REQUEST'
        ]);
    }

    // Ambil nilai teks; nilai bukan teks dianggap kosong.
    $teks = static function (string $kunci) use ($input): string {
        $nilai = $input[$kunci] ?? '';
        return is_string($nilai) ? trim($nilai) : (is_int($nilai) ? (string) $nilai : '');
    };

    // 1. Alamat (wajib)
    $alamat = $teks('alamat');
    if ($alamat === '') {
        tolakValidasi('Alamat wajib diisi', 'alamat');
    }
    if (mb_strlen($alamat) > 255) {
        tolakValidasi('Alamat maksimal 255 karakter', 'alamat');
    }

    // 2. Tautan peta (wajib, URL http/https valid)
    $tautanPeta = $teks('tautan_peta');
    $bagianUrl = $tautanPeta === '' ? false : parse_url($tautanPeta);
    if (
        $tautanPeta === '' ||
        mb_strlen($tautanPeta) > 500 ||
        filter_var($tautanPeta, FILTER_VALIDATE_URL) === false ||
        !is_array($bagianUrl) ||
        !in_array(strtolower((string) ($bagianUrl['scheme'] ?? '')), ['http', 'https'], true) ||
        strpos((string) ($bagianUrl['host'] ?? ''), '.') === false
    ) {
        tolakValidasi('Tautan peta harus berupa URL yang valid', 'tautan_peta');
    }

    // 3. Jam buka: hari awal, hari akhir (1 = Senin ... 7 = Minggu), jam buka, jam tutup (HH:MM)
    $hari = [];
    foreach (['hari_awal', 'hari_akhir'] as $kunci) {
        $mentah = $teks($kunci);
        $angka = ctype_digit($mentah) ? (int) $mentah : 0;
        if ($angka < 1 || $angka > 7) {
            tolakValidasi('Jam buka tidak valid', $kunci);
        }
        $hari[$kunci] = $angka;
    }

    $jam = [];
    foreach (['jam_buka', 'jam_tutup'] as $kunci) {
        $mentah = $teks($kunci);
        if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $mentah)) {
            tolakValidasi('Jam buka tidak valid', $kunci);
        }
        $jam[$kunci] = $mentah;
    }

    if ($hari['hari_akhir'] < $hari['hari_awal']) {
        tolakValidasi('Hari akhir tidak boleh sebelum hari awal', 'hari_akhir');
    }
    if ($jam['jam_tutup'] <= $jam['jam_buka']) {
        tolakValidasi('Jam tutup harus setelah jam buka', 'jam_tutup');
    }

    // 4. Nomor WhatsApp (wajib; boleh diawali "+", sisanya angka; diawali 08 atau +62; 10-15 angka)
    $nomorWa = $teks('nomor_whatsapp');
    $digitWa = ltrim($nomorWa, '+');
    if (
        !preg_match('/^(?:\+62|08)\d+$/', $nomorWa) ||
        strlen($digitWa) < 10 ||
        strlen($digitWa) > 15
    ) {
        tolakValidasi('Nomor WhatsApp tidak valid', 'nomor_whatsapp');
    }

    // 5. Username media sosial (opsional; disimpan tanpa "@"; huruf, angka, titik, garis bawah)
    $sosial = [];
    foreach (['instagram' => 'Instagram', 'tiktok' => 'TikTok', 'facebook' => 'Facebook'] as $kunci => $label) {
        $username = $teks($kunci);
        if ($username !== '' && $username[0] === '@') {
            $username = substr($username, 1);
        }
        if ($username === '') {
            $sosial[$kunci] = null;
            continue;
        }
        if (strlen($username) > 50 || !preg_match('/^[A-Za-z0-9._]+$/', $username)) {
            tolakValidasi("Username {$label} tidak valid", $kunci);
        }
        $sosial[$kunci] = $username;
    }

    // 6. Tagline dan tentang (opsional)
    $tagline = $teks('tagline');
    if (mb_strlen($tagline) > 100) {
        tolakValidasi('Tagline maksimal 100 karakter', 'tagline');
    }

    $tentang = $teks('tentang');
    if (mb_strlen($tentang) > 500) {
        tolakValidasi('Tentang maksimal 500 karakter', 'tentang');
    }

    // Satu perintah menyimpan seluruhnya: bila gagal, data sebelumnya tidak berubah.
    $stmt = $pdo->prepare(
        'INSERT INTO info_usaha
            (id_info, alamat, tautan_peta, hari_awal, hari_akhir, jam_buka, jam_tutup,
             nomor_whatsapp, instagram, tiktok, facebook, tagline, tentang)
         VALUES
            (1, :alamat, :peta, :hari_awal, :hari_akhir, :jam_buka, :jam_tutup,
             :wa, :instagram, :tiktok, :facebook, :tagline, :tentang)
         ON DUPLICATE KEY UPDATE
            alamat = VALUES(alamat), tautan_peta = VALUES(tautan_peta),
            hari_awal = VALUES(hari_awal), hari_akhir = VALUES(hari_akhir),
            jam_buka = VALUES(jam_buka), jam_tutup = VALUES(jam_tutup),
            nomor_whatsapp = VALUES(nomor_whatsapp), instagram = VALUES(instagram),
            tiktok = VALUES(tiktok), facebook = VALUES(facebook),
            tagline = VALUES(tagline), tentang = VALUES(tentang)'
    );
    $stmt->execute([
        ':alamat' => $alamat,
        ':peta' => $tautanPeta,
        ':hari_awal' => $hari['hari_awal'],
        ':hari_akhir' => $hari['hari_akhir'],
        ':jam_buka' => $jam['jam_buka'] . ':00',
        ':jam_tutup' => $jam['jam_tutup'] . ':00',
        ':wa' => $nomorWa,
        ':instagram' => $sosial['instagram'],
        ':tiktok' => $sosial['tiktok'],
        ':facebook' => $sosial['facebook'],
        ':tagline' => $tagline === '' ? null : $tagline,
        ':tentang' => $tentang === '' ? null : $tentang
    ]);

    $baris = $pdo->query(
        'SELECT ' . KOLOM_INFO_USAHA . ' FROM info_usaha WHERE id_info = 1'
    )->fetch(PDO::FETCH_ASSOC);

    kirimInfoUsaha(200, [
        'success' => true,
        'message' => 'Info usaha berhasil disimpan.',
        'data' => infoUsahaBentukOwner($baris)
    ]);
} catch (Throwable $e) {
    error_log('API info_usaha: ' . $e->getMessage());

    kirimInfoUsaha(500, [
        'success' => false,
        'message' => $method === 'PUT'
            ? 'Info usaha gagal disimpan. Silakan coba lagi'
            : 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}