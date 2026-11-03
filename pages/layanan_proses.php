<?php

require_once __DIR__ . '/../includes/auth_check.php';

require_role(['owner']);

// Hanya menerima request POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /KELOMPOK-5/pages/layanan.php');
    exit;
}

if (
    empty($_SESSION['csrf_token']) ||
    !is_string($_POST['csrf_token'] ?? null) ||
    !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])
) {
    header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
    exit;
}

$action = $_POST['action'] ?? '';
$jumlahKarakter = static function (string $teks): int {
    if (function_exists('mb_strlen')) {
        return mb_strlen($teks, 'UTF-8');
    }
    return preg_match_all('/./us', $teks, $matches) ?: 0;
};


// =====================================================
// TAMBAH LAYANAN
// =====================================================

if ($action === 'tambah') {

    $nama_layanan = is_string($_POST['nama_layanan'] ?? null)
        ? trim($_POST['nama_layanan'])
        : '';
    $harga_input = is_string($_POST['harga'] ?? null)
        ? trim($_POST['harga'])
        : '';
    $hpp_input = is_string($_POST['hpp'] ?? null)
        ? trim($_POST['hpp'])
        : '';

    // Nama layanan wajib diisi
    if ($nama_layanan === '') {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=nama_kosong');
        exit;
    }

    if ($jumlahKarakter($nama_layanan) > 100) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=nama_invalid');
        exit;
    }

    $cekNama = $pdo->prepare(
        'SELECT 1 FROM layanan WHERE LOWER(TRIM(nama_layanan)) = LOWER(?) LIMIT 1'
    );
    $cekNama->execute([$nama_layanan]);
    if ($cekNama->fetchColumn()) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=nama_invalid');
        exit;
    }

    // Harga wajib diisi
    if ($harga_input === '') {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=harga_invalid');
        exit;
    }

    $harga = filter_var($harga_input, FILTER_VALIDATE_INT);

    // AC3: harga harus berupa angka dan > 0
    if ($harga === false || $harga <= 0 || $harga > 2147483647) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=harga_invalid');
        exit;
    }

    $hpp = filter_var($hpp_input, FILTER_VALIDATE_INT);
    if ($hpp === false || $hpp < 0 || $hpp > 2147483647) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=hpp_invalid');
        exit;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO layanan (nama_layanan, harga, hpp, aktif)
         VALUES (?, ?, ?, 1)'
    );

    try {
        $stmt->execute([$nama_layanan, $harga, $hpp]);
    } catch (Throwable $e) {
        error_log('Tambah layanan gagal: ' . $e->getMessage());
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    header('Location: /KELOMPOK-5/pages/layanan.php?status=tambah_sukses');
    exit;
}


// =====================================================
// UBAH LAYANAN
// =====================================================

if ($action === 'ubah') {

    $id_layanan = filter_var(
        $_POST['id_layanan'] ?? null,
        FILTER_VALIDATE_INT
    );

    $nama_layanan = is_string($_POST['nama_layanan'] ?? null)
        ? trim($_POST['nama_layanan'])
        : '';
    $harga_input = is_string($_POST['harga'] ?? null)
        ? trim($_POST['harga'])
        : '';
    $hpp_input = is_string($_POST['hpp'] ?? null)
        ? trim($_POST['hpp'])
        : '';

    if ($id_layanan === false || $id_layanan <= 0) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    $cekLayanan = $pdo->prepare(
        'SELECT nama_layanan, hpp FROM layanan WHERE id_layanan = ?'
    );
    $cekLayanan->execute([$id_layanan]);
    $layananSaatIni = $cekLayanan->fetch(PDO::FETCH_ASSOC);
    if (!$layananSaatIni) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    if ($nama_layanan === '') {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=nama_kosong');
        exit;
    }

    if ($jumlahKarakter($nama_layanan) > 100) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=nama_invalid');
        exit;
    }

    if (strcasecmp(trim($nama_layanan), trim($layananSaatIni['nama_layanan'])) !== 0) {
        $cekNama = $pdo->prepare(
            'SELECT 1 FROM layanan
             WHERE id_layanan <> ? AND LOWER(TRIM(nama_layanan)) = LOWER(?)
             LIMIT 1'
        );
        $cekNama->execute([$id_layanan, $nama_layanan]);
        if ($cekNama->fetchColumn()) {
            header('Location: /KELOMPOK-5/pages/layanan.php?status=nama_invalid');
            exit;
        }
    }

    if ($harga_input === '') {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=harga_invalid');
        exit;
    }

    $harga = filter_var($harga_input, FILTER_VALIDATE_INT);

    // AC3
    if ($harga === false || $harga <= 0 || $harga > 2147483647) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=harga_invalid');
        exit;
    }

    if ($hpp_input === '' && $layananSaatIni['hpp'] === null) {
        // HPP historis yang belum diketahui dipertahankan sebagai NULL.
        $hpp = null;
    } else {
        $hpp = filter_var($hpp_input, FILTER_VALIDATE_INT);
        if ($hpp === false || $hpp < 0 || $hpp > 2147483647) {
            header('Location: /KELOMPOK-5/pages/layanan.php?status=hpp_invalid');
            exit;
        }
    }

    $stmt = $pdo->prepare(
        'UPDATE layanan
         SET nama_layanan = ?, harga = ?, hpp = ?
         WHERE id_layanan = ?'
    );

    try {
        $stmt->execute([$nama_layanan, $harga, $hpp, $id_layanan]);
    } catch (Throwable $e) {
        error_log('Ubah layanan gagal: ' . $e->getMessage());
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    header('Location: /KELOMPOK-5/pages/layanan.php?status=ubah_sukses');
    exit;
}


// =====================================================
// NONAKTIFKAN LAYANAN
// =====================================================

if ($action === 'nonaktifkan') {

    $id_layanan = filter_var(
        $_POST['id_layanan'] ?? null,
        FILTER_VALIDATE_INT
    );

    if ($id_layanan === false || $id_layanan <= 0) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    // Tidak menghapus record.
    // Hanya mengubah status menjadi tidak aktif.
    $stmt = $pdo->prepare(
        'UPDATE layanan
         SET aktif = 0
         WHERE id_layanan = ? AND aktif = 1'
    );

    $stmt->execute([
        $id_layanan
    ]);

    if ($stmt->rowCount() === 0) {
        $cek = $pdo->prepare('SELECT 1 FROM layanan WHERE id_layanan = ?');
        $cek->execute([$id_layanan]);
        if (!$cek->fetchColumn()) {
            header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
            exit;
        }
    }

    header('Location: /KELOMPOK-5/pages/layanan.php?status=nonaktif_sukses');
    exit;
}


if ($action === 'aktifkan' || $action === 'status') {
    $id_layanan = filter_var(
        $_POST['id_layanan'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    $aktif = $action === 'aktifkan'
        ? 1
        : filter_var($_POST['aktif'] ?? null, FILTER_VALIDATE_INT);

    if ($id_layanan === false || !in_array($aktif, [0, 1], true)) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE layanan SET aktif = ? WHERE id_layanan = ?'
    );
    $stmt->execute([$aktif, $id_layanan]);

    if ($stmt->rowCount() === 0) {
        $cek = $pdo->prepare('SELECT 1 FROM layanan WHERE id_layanan = ?');
        $cek->execute([$id_layanan]);
        if (!$cek->fetchColumn()) {
            header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
            exit;
        }
    }

    header('Location: /KELOMPOK-5/pages/layanan.php?status=status_sukses');
    exit;
}



if ($action === 'hapus') {
    $id_layanan = filter_var(
        $_POST['id_layanan'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($id_layanan === false) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    $stmt = $pdo->prepare(
        'DELETE FROM layanan WHERE id_layanan = ?'
    );
    $stmt->execute([$id_layanan]);

    if ($stmt->rowCount() === 0) {
        header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
        exit;
    }

    header('Location: /KELOMPOK-5/pages/layanan.php?status=hapus_sukses');
    exit;
}
   

// Action tidak dikenal
header('Location: /KELOMPOK-5/pages/layanan.php?status=gagal');
exit;
