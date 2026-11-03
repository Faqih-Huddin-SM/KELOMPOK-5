<?php

require_once __DIR__ . '/../includes/auth_check.php';

require_role(['barber', 'owner']);

require_once __DIR__ . '/../config/config.php';


// ======================================================
// Pastikan request berasal dari POST
// ======================================================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /KELOMPOK-5/pages/transaksi.php');
    exit;
}

if (
    empty($_SESSION['csrf_token']) ||
    !is_string($_POST['csrf_token'] ?? null) ||
    !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])
) {
    header('Location: /KELOMPOK-5/pages/transaksi.php?error=invalid');
    exit;
}


// ======================================================
// Ambil pencatat dari akun yang sedang login
// ======================================================

$id_pencatat = (int) ($_SESSION['id_user'] ?? 0);

if ($id_pencatat <= 0) {
    header('Location: /KELOMPOK-5/pages/login.php');
    exit;
}


// ======================================================
// Ambil barber pelaksana dari dropdown
// ======================================================

$id_barber = ($_SESSION['role'] ?? '') === 'barber'
    ? $id_pencatat
    : filter_var(
        $_POST['id_barber'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

if ($id_barber === false) {
    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?error=invalid_barber'
    );
    exit;
}


// ======================================================
// Ambil data form
// ======================================================

$idPelangganRaw = $_POST['id_pelanggan'] ?? '';
$layananDipilih = $_POST['layanan'] ?? [];
$jumlahInput = $_POST['jumlah'] ?? [];
// FE kasir tidak menyediakan harga manual; harga selalu diambil dari database.
$hargaManualInput = [];
$namaPelangganRaw = $_POST['nama_pelanggan'] ?? '';
$noHpRaw = $_POST['no_hp'] ?? '';
$metodePembayaran = $_POST['metode_pembayaran'] ?? '';

if (trim($metodePembayaran) === '') {
    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?error=payment_required'
    );
    exit;
}

if (
    !is_array($layananDipilih) ||
    !is_array($jumlahInput) ||
    !is_array($hargaManualInput) ||
    !is_string($namaPelangganRaw) ||
    !is_string($noHpRaw) ||
    !is_string($metodePembayaran) ||
    !is_string($idPelangganRaw) ||
    !in_array($metodePembayaran, ['cash', 'qris', 'transfer'], true) ||
    strlen(trim($namaPelangganRaw)) > 100 ||
    strlen(trim($noHpRaw)) > 20
) {
    header('Location: /KELOMPOK-5/pages/transaksi.php?error=invalid');
    exit;
}

$namaPelanggan = trim($namaPelangganRaw);
$noHp = trim($noHpRaw);
$idPelangganRaw = $_POST['id_pelanggan'] ?? '';

if ($namaPelanggan === '') {
    header('Location: /KELOMPOK-5/pages/transaksi.php?error=customer_required');
    exit;
}

if ($namaPelanggan === '') {
    header('Location: /KELOMPOK-5/pages/transaksi.php?error=customer_required');
    exit;
}

// ======================================================
// Validasi barber pelaksana
// Harus akun aktif dengan role barber atau owner
// ======================================================

$stmtBarber = $pdo->prepare(
    "SELECT id_user
     FROM users
     WHERE id_user = ?
     AND aktif = 1
     AND role IN ('barber', 'owner')
     LIMIT 1"
);

$stmtBarber->execute([$id_barber]);

$barberValid = $stmtBarber->fetchColumn();

if (!$barberValid) {
    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?error=invalid_barber'
    );
    exit;
}


// ======================================================
// AC 3
// Tidak ada layanan yang dipilih
// ======================================================

if (!is_array($layananDipilih) || count($layananDipilih) === 0) {
    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?error=no_service'
    );
    exit;
}


// ======================================================
// Normalisasi ID layanan
// ======================================================

$idLayananList = [];

foreach ($layananDipilih as $idLayanan) {
    $idLayananValid = filter_var(
        $idLayanan,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    if ($idLayananValid === false) {
        header('Location: /KELOMPOK-5/pages/transaksi.php?error=invalid');
        exit;
    }

    $idLayananList[] = $idLayananValid;
}

$idLayananList = array_values(array_unique($idLayananList));


// ======================================================
// Jika setelah validasi tidak ada ID layanan
// ======================================================

if (count($idLayananList) === 0) {
    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?error=no_service'
    );
    exit;
}


// ======================================================
// Ambil harga layanan langsung dari database
// Hanya layanan aktif yang boleh digunakan
// ======================================================

$placeholders = implode(
    ',',
    array_fill(0, count($idLayananList), '?')
);

$stmt = $pdo->prepare(
    "SELECT id_layanan, nama_layanan, harga, hpp
     FROM layanan
     WHERE aktif = 1
     AND id_layanan IN ($placeholders)
     ORDER BY id_layanan ASC"
);

$stmt->execute($idLayananList);

$layananDatabase = $stmt->fetchAll(PDO::FETCH_ASSOC);


// ======================================================
// Pastikan semua layanan yang dipilih masih aktif
// ======================================================

if (count($layananDatabase) !== count($idLayananList)) {
    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?error=invalid'
    );
    exit;
}


// ======================================================
// Siapkan data transaksi
// ======================================================

$detailTransaksi = [];

$totalHarga = 0;

$adaHargaManualBerbeda = false;


foreach ($layananDatabase as $layanan) {

    $idLayanan = (int) $layanan['id_layanan'];
    $hargaDatabase = (int) $layanan['harga'];


    // -----------------------------------------------
    // Jumlah
    // -----------------------------------------------

    $jumlahRaw = $jumlahInput[$idLayanan] ?? '1';
    $jumlah = filter_var(
        $jumlahRaw,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 100]]
    );

    if ($jumlah === false) {
        header('Location: /KELOMPOK-5/pages/transaksi.php?error=invalid');
        exit;
    }


    // -----------------------------------------------
    // Harga manual
    // -----------------------------------------------

    $hargaManual = null;

    // Harga manual bersifat opsional.
    // Jika kosong, gunakan harga dari database.
    $hargaManualRaw = isset($hargaManualInput[$idLayanan])
        ? trim((string) $hargaManualInput[$idLayanan])
        : '';

    if ($hargaManualRaw === '') {

        $hargaManual = $hargaDatabase;

    } else {

        // Harga manual harus berupa angka bulat positif.
        if (
            !preg_match('/^\d+$/', $hargaManualRaw) ||
            (int) $hargaManualRaw <= 0 ||
            (float) $hargaManualRaw > 2147483647
        ) {
            header(
                'Location: /KELOMPOK-5/pages/transaksi.php?error=price_invalid'
            );
            exit;
        }

        $hargaManual = (int) $hargaManualRaw;
    }


    // -----------------------------------------------
    // AC2
    // Harga manual berbeda dengan harga daftar layanan
    // -----------------------------------------------

    if ($hargaManual !== $hargaDatabase) {
        $adaHargaManualBerbeda = true;
    }


    // -----------------------------------------------
    // Harga yang akan digunakan
    // -----------------------------------------------

    $hargaFinal = $hargaDatabase;

    if ($hargaManual !== null) {
        $hargaFinal = $hargaManual;
    }


    // -----------------------------------------------
    // Hitung subtotal
    // -----------------------------------------------

    $subtotal = $hargaFinal * $jumlah;

    if ($subtotal > 2147483647 - $totalHarga) {
        header('Location: /KELOMPOK-5/pages/transaksi.php?error=price_invalid');
        exit;
    }

    $totalHarga += $subtotal;


    // -----------------------------------------------
    // Simpan detail transaksi sementara
    // -----------------------------------------------

    $detailTransaksi[] = [
        'id_layanan' => $idLayanan,
        'nama_layanan' => $layanan['nama_layanan'],
        'harga_database' => $hargaDatabase,
        'harga_final' => $hargaFinal,
        'hpp_saat_transaksi' => $layanan['hpp'] === null ? null : (int) $layanan['hpp'],
        'jumlah' => $jumlah,
        'subtotal' => $subtotal
    ];
}


// ======================================================
// AC2
// Jika harga manual berbeda, minta konfirmasi
// ======================================================

$konfirmasiHarga = isset($_POST['konfirmasi_harga'])
    && $_POST['konfirmasi_harga'] === '1';


if ($adaHargaManualBerbeda && !$konfirmasiHarga):

?>

<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <title>Konfirmasi Harga - Kataji Barber</title>

    <style>

        body {
            font-family: Arial, sans-serif;
            background: #f5f6fa;
            margin: 0;
            padding: 40px;
        }

        .confirmation-card {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 14px;
            box-shadow: 0 5px 25px rgba(0, 0, 0, 0.08);
        }

        .warning {
            background: #fff7d9;
            border: 1px solid #e5c95f;
            color: #765f00;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }

        th,
        td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            text-align: left;
        }

        .button {
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        }

        .confirm {
            background: #17186B;
            color: white;
        }

        .cancel {
            background: #ddd;
            color: #333;
            text-decoration: none;
            display: inline-block;
        }

    </style>

</head>

<body>

    <div class="confirmation-card">

        <h1>Konfirmasi Harga</h1>

        <div class="warning">

            Harga manual berbeda dengan harga pada daftar layanan.
            Periksa kembali sebelum transaksi disimpan.

        </div>


        <table>

            <thead>

                <tr>

                    <th>Layanan</th>

                    <th>Harga Daftar</th>

                    <th>Harga Manual</th>

                    <th>Jumlah</th>

                    <th>Subtotal</th>

                </tr>

            </thead>


            <tbody>

                <?php foreach ($detailTransaksi as $detail): ?>

                    <tr>

                        <td>
                            <?= htmlspecialchars(
                                $detail['nama_layanan']
                            ) ?>
                        </td>

                        <td>
                            Rp<?= number_format(
                                $detail['harga_database'],
                                0,
                                ',',
                                '.'
                            ) ?>
                        </td>

                        <td>
                            Rp<?= number_format(
                                $detail['harga_final'],
                                0,
                                ',',
                                '.'
                            ) ?>
                        </td>

                        <td>
                            <?= $detail['jumlah'] ?>
                        </td>

                        <td>
                            Rp<?= number_format(
                                $detail['subtotal'],
                                0,
                                ',',
                                '.'
                            ) ?>
                        </td>

                    </tr>

                <?php endforeach; ?>

            </tbody>

        </table>


        <h3>

            Total:
            Rp<?= number_format(
                $totalHarga,
                0,
                ',',
                '.'
            ) ?>

        </h3>


        <!--
            Kirim ulang data transaksi
            dengan flag konfirmasi_harga = 1
        -->

        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="nama_pelanggan" value="<?= htmlspecialchars($namaPelanggan, ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="no_hp" value="<?= htmlspecialchars($noHp, ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="metode_pembayaran" value="<?= htmlspecialchars($metodePembayaran, ENT_QUOTES, 'UTF-8') ?>">

            <input
                type="hidden"
                name="id_barber"
                value="<?= $id_barber ?>"
            >


            <?php foreach ($idLayananList as $idLayanan): ?>

                <input
                    type="hidden"
                    name="layanan[]"
                    value="<?= $idLayanan ?>"
                >


                <input
                    type="hidden"
                    name="jumlah[<?= $idLayanan ?>]"
                    value="<?= (int) (
                        $jumlahInput[$idLayanan] ?? 1
                    ) ?>"
                >


                <input
                    type="hidden"
                    name="harga_manual[<?= $idLayanan ?>]"
                    value="<?= htmlspecialchars(
                        $hargaManualInput[$idLayanan] ?? '',
                        ENT_QUOTES,
                        'UTF-8'
                    ) ?>"
                >

            <?php endforeach; ?>


            <input
                type="hidden"
                name="konfirmasi_harga"
                value="1"
            >


            <button
                type="submit"
                class="button confirm"
            >
                Ya, Simpan Transaksi
            </button>


            <a
                href="/KELOMPOK-5/pages/transaksi.php"
                class="button cancel"
            >
                Batal
            </a>

        </form>

    </div>

</body>

</html>

<?php

    exit;

endif;


// ======================================================
// SIMPAN TRANSAKSI
// ======================================================

try {

    $pdo->beginTransaction();


    // -----------------------------------------------
    // Waktu transaksi menggunakan WIB
    // -----------------------------------------------

    $zonaWIB = new DateTimeZone('Asia/Jakarta');

    $sekarang = new DateTimeImmutable(
        'now',
        $zonaWIB
    );

    $tanggal = $sekarang->format('Y-m-d');

    $waktu = $sekarang->format('H:i:s');


    // -----------------------------------------------
    // Insert tabel transaksi
    // -----------------------------------------------

    $stmtTransaksi = $pdo->prepare(
        "INSERT INTO transaksi
        (
            id_pencatat,
            id_barber,
            id_pelanggan,
            tanggal,
            waktu,
            total_harga,
            metode_pembayaran
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )"
    );


    
    $idPelanggan = null;

    if ($idPelangganRaw !== '') {
        $idPelangganTerpilih = filter_var(
            $idPelangganRaw,
            FILTER_VALIDATE_INT
        );

        if ($idPelangganTerpilih === false || $idPelangganTerpilih < 1) {
            throw new DomainException('Pelanggan yang dipilih tidak valid.');
        }

        $stmtPelanggan = $pdo->prepare(
            'SELECT id_pelanggan
             FROM pelanggan
             WHERE id_pelanggan = ?
             LIMIT 1'
        );
        $stmtPelanggan->execute([$idPelangganTerpilih]);

        $pelangganAda = $stmtPelanggan->fetchColumn();

        if ($pelangganAda === false) {
            throw new DomainException(
                'Pelanggan yang dipilih tidak ditemukan.'
            );
        }

        $idPelanggan = (int) $pelangganAda;
    } else {
        if ($namaPelanggan === '') {
            throw new DomainException('Nama pelanggan wajib diisi.');
        }

        $stmtPelanggan = $pdo->prepare(
            'INSERT INTO pelanggan (nama, no_hp)
             VALUES (?, ?)'
        );
        $stmtPelanggan->execute([
            $namaPelanggan,
            $noHp !== '' ? $noHp : null
        ]);

        $idPelanggan = (int) $pdo->lastInsertId();
    }



    $stmtTransaksi->execute([
        $id_pencatat,
        $id_barber,
        $idPelanggan,
        $tanggal,
        $waktu,
        $totalHarga,
        $metodePembayaran
    ]);


    $idTransaksi = (int) $pdo->lastInsertId();


    // -----------------------------------------------
    // Insert detail transaksi
    // -----------------------------------------------

$stmtDetail = $pdo->prepare(
    "INSERT INTO detail_transaksi
    (
        id_transaksi,
        id_layanan,
        nama_layanan_saat_transaksi,
        harga_saat_transaksi,
        hpp_saat_transaksi,
        jumlah
    )
    VALUES (?, ?, ?, ?, ?, ?)"
);

foreach ($detailTransaksi as $detail) {
    $stmtDetail->execute([
        $idTransaksi,
        $detail['id_layanan'],
        $detail['nama_layanan'],
        $detail['harga_final'],
        $detail['hpp_saat_transaksi'],
        $detail['jumlah']
    ]);
}



    // -----------------------------------------------
    // Commit
    // -----------------------------------------------

    $pdo->commit();


    // -----------------------------------------------
    // Berhasil
    // -----------------------------------------------

    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?success=1'
    );

    exit;


} catch (Throwable $e) {

    // Jika gagal, batalkan semua perubahan
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }


    // Untuk development, error bisa dilihat di log.
    error_log($e->getMessage());


    header(
        'Location: /KELOMPOK-5/pages/transaksi.php?error=failed'
    );

    exit;
}
