
<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

$method = $_SERVER['REQUEST_METHOD'];
$role = strtolower(trim($_SESSION['role'] ?? ''));
$idUser = (int) ($_SESSION['id_user'] ?? 0);

function kirimJson(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

try {
    // ==========================================
    // DELETE: HAPUS RIWAYAT (SOFT DELETE)
    // Hanya owner yang dapat menghapus.
    // ==========================================
    if ($method === 'DELETE') {
        if ($role !== 'owner') {
            kirimJson(403, [
                'success' => false,
                'message' => 'Hanya owner yang dapat menghapus riwayat transaksi.',
                'error_code' => 'FORBIDDEN'
            ]);
        }

        $idTransaksi = filter_input(
            INPUT_GET,
            'id',
            FILTER_VALIDATE_INT
        );

        if (!$idTransaksi || $idTransaksi < 1) {
            kirimJson(400, [
                'success' => false,
                'message' => 'ID transaksi tidak valid.',
                'error_code' => 'BAD_REQUEST'
            ]);
        }

        $stmt = $pdo->prepare(
            'UPDATE transaksi
             SET dihapus_pada = NOW()
             WHERE id_transaksi = :id
               AND dihapus_pada IS NULL'
        );

        $stmt->execute([
            ':id' => $idTransaksi
        ]);

        if ($stmt->rowCount() === 0) {
            kirimJson(404, [
                'success' => false,
                'message' => 'Transaksi tidak ditemukan atau sudah dihapus.',
                'error_code' => 'NOT_FOUND'
            ]);
        }

        kirimJson(200, [
            'success' => true,
            'message' => 'Riwayat transaksi berhasil dihapus.'
        ]);
    }
    
    // ==========================================
    // GET: DAFTAR TRANSAKSI
    // ==========================================
    if ($method === 'GET') {
        if (!in_array($role, ['owner', 'barber'], true)) {
            kirimJson(403, [
                'success' => false,
                'message' => 'Role tidak diizinkan.',
                'error_code' => 'FORBIDDEN'
            ]);
        }

        // Zona waktu untuk menentukan tanggal hari ini.
        $zonaWaktu = new DateTimeZone('Asia/Jakarta');
        $tanggalHariIni = (new DateTimeImmutable(
            'now',
            $zonaWaktu
        ))->format('Y-m-d');

        // Barber default melihat transaksi hari ini.
        // Owner boleh melihat semua tanggal atau memilih tanggal.
        $tanggal = $_GET['tanggal'] ?? null;

        if ($role === 'barber' && ($tanggal === null || $tanggal === '')) {
            $tanggal = $tanggalHariIni;
        }

        // Validasi tanggal jika dikirim atau diwajibkan.
        if ($tanggal !== null && $tanggal !== '') {
            if (!is_string($tanggal)) {
                kirimJson(400, [
                    'success' => false,
                    'message' => 'Format tanggal tidak valid.',
                    'error_code' => 'BAD_REQUEST'
                ]);
            }

            $tanggalObj = DateTimeImmutable::createFromFormat(
                '!Y-m-d',
                $tanggal,
                $zonaWaktu
            );

            if (
                !$tanggalObj ||
                $tanggalObj->format('Y-m-d') !== $tanggal
            ) {
                kirimJson(400, [
                    'success' => false,
                    'message' => 'Tanggal harus menggunakan format YYYY-MM-DD.',
                    'error_code' => 'BAD_REQUEST'
                ]);
            }
        }

        $sql = "
            SELECT
                t.id_transaksi,
                t.id_pencatat,
                t.id_barber,
                u.nama AS nama_barber,
                t.id_pelanggan,
                p.nama AS nama_pelanggan,
                t.tanggal,
                t.waktu,
                t.total_harga,
                t.metode_pembayaran,
                t.dibuat_pada
            FROM transaksi t
            JOIN users u
                ON u.id_user = t.id_barber
            LEFT JOIN pelanggan p
                ON p.id_pelanggan = t.id_pelanggan
            WHERE t.dihapus_pada IS NULL
        ";

        $stmtParams = [];

        // Barber hanya melihat transaksi yang dicatat oleh akunnya.
        if ($role === 'barber') {
            $sql .= " AND t.id_pencatat = :id_user";
            $stmtParams[':id_user'] = $idUser;
        }

        // Filter tanggal berlaku untuk barber dan owner.
        if ($tanggal !== null && $tanggal !== '') {
            $sql .= " AND t.tanggal = :tanggal";
            $stmtParams[':tanggal'] = $tanggal;
        }

        // Transaksi terbaru ditampilkan lebih dahulu.
        $sql .= "
            ORDER BY
                t.tanggal DESC,
                t.waktu DESC,
                t.id_transaksi DESC
        ";

        $stmt = $pdo->prepare($sql);

        foreach ($stmtParams as $namaParam => $nilaiParam) {
            $stmt->bindValue(
                $namaParam,
                $nilaiParam,
                $namaParam === ':id_user'
                    ? PDO::PARAM_INT
                    : PDO::PARAM_STR
            );
        }

        $stmt->execute();

        kirimJson(200, [
            'success' => true,
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }


    // ==========================================
    // POST: TAMBAH TRANSAKSI
    // ==========================================
    if ($method === 'POST') {
        if (!in_array($role, ['owner', 'barber'], true)) {
            kirimJson(403, [
                'success' => false,
                'message' => 'Role tidak diizinkan mencatat transaksi.',
                'error_code' => 'FORBIDDEN'
            ]);
        }

        // Baca dan validasi JSON.
        $body = file_get_contents('php://input');
        $input = json_decode($body, true);

        if (
            json_last_error() !== JSON_ERROR_NONE ||
            !is_array($input)
        ) {
            kirimJson(400, [
                'success' => false,
                'message' => 'Body harus berupa JSON yang valid.',
                'error_code' => 'BAD_REQUEST'
            ]);
        }

        $namaPelangganRaw = $input['nama_pelanggan'] ?? '';
        $layananInput = $input['layanan'] ?? [];
        $metodePembayaran = $input['metode_pembayaran'] ?? '';

        // Validasi nama pelanggan.
        if (!is_string($namaPelangganRaw)) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Nama pelanggan tidak valid.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $namaPelanggan = trim($namaPelangganRaw);

        if ($namaPelanggan === '') {
            kirimJson(422, [
                'success' => false,
                'message' => 'Nama pelanggan wajib diisi.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if (strlen($namaPelanggan) > 100) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Nama pelanggan maksimal 100 karakter.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        // Validasi metode pembayaran.
        if (
            !is_string($metodePembayaran) ||
            !in_array(
                $metodePembayaran,
                ['cash', 'qris', 'transfer'],
                true
            )
        ) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Pilih metode pembayaran yang valid.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        // Layanan wajib dipilih minimal satu.
        if (
            !is_array($layananInput) ||
            count($layananInput) === 0
        ) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Transaksi harus memiliki minimal satu layanan.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        // Tentukan barber yang melayani.
        if ($role === 'barber') {
            $idBarber = $idUser;
        } else {
            $idBarber = filter_var(
                $input['id_barber'] ?? null,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1]]
            );

            if ($idBarber === false || $idBarber === null) {
                kirimJson(422, [
                    'success' => false,
                    'message' => 'Owner wajib memilih barber yang melayani.',
                    'error_code' => 'UNPROCESSABLE_ENTITY'
                ]);
            }

            $stmtBarber = $pdo->prepare(
                "SELECT id_user
                 FROM users
                 WHERE id_user = :id_user
                   AND role IN ('barber', 'owner')
                   AND aktif = 1
                 LIMIT 1"
            );

            $stmtBarber->execute([
                ':id_user' => $idBarber
            ]);

            if (!$stmtBarber->fetchColumn()) {
                kirimJson(422, [
                    'success' => false,
                    'message' => 'Barber tidak ditemukan atau tidak aktif.',
                    'error_code' => 'UNPROCESSABLE_ENTITY'
                ]);
            }
        }

        // Validasi ID layanan dan jumlah.
        $jumlahPerLayanan = [];

        foreach ($layananInput as $item) {
            if (!is_array($item)) {
                kirimJson(422, [
                    'success' => false,
                    'message' => 'Format layanan tidak valid.',
                    'error_code' => 'UNPROCESSABLE_ENTITY'
                ]);
            }

            $idLayanan = filter_var(
                $item['id_layanan'] ?? null,
                FILTER_VALIDATE_INT,
                ['options' => ['min_range' => 1]]
            );

            $jumlah = filter_var(
                $item['jumlah'] ?? 1,
                FILTER_VALIDATE_INT,
                ['options' => [
                    'min_range' => 1,
                    'max_range' => 100
                ]]
            );

            if ($idLayanan === false || $jumlah === false) {
                kirimJson(422, [
                    'success' => false,
                    'message' => 'ID layanan atau jumlah tidak valid.',
                    'error_code' => 'UNPROCESSABLE_ENTITY'
                ]);
            }

            $jumlahPerLayanan[$idLayanan] =
                ($jumlahPerLayanan[$idLayanan] ?? 0) + $jumlah;

            if ($jumlahPerLayanan[$idLayanan] > 100) {
                kirimJson(422, [
                    'success' => false,
                    'message' => 'Jumlah layanan tidak boleh lebih dari 100.',
                    'error_code' => 'UNPROCESSABLE_ENTITY'
                ]);
            }
        }

        // ==========================================
        // SIMPAN TRANSAKSI DALAM DATABASE TRANSACTION
        // ==========================================
        $pdo->beginTransaction();

        try {
            // Gunakan pelanggan terpilih atau buat pelanggan baru.
            $idPelangganInput = $input['id_pelanggan'] ?? null;
            $idPelanggan = null;

            if (
                $idPelangganInput !== null &&
                $idPelangganInput !== ''
            ) {
                $idPelangganTerpilih = filter_var(
                    $idPelangganInput,
                    FILTER_VALIDATE_INT,
                    ['options' => ['min_range' => 1]]
                );

                if ($idPelangganTerpilih === false) {
                    throw new DomainException(
                        'ID pelanggan tidak valid.'
                    );
                }

                $stmtPelanggan = $pdo->prepare(
                    'SELECT id_pelanggan, nama
                     FROM pelanggan
                     WHERE id_pelanggan = :id
                       AND dihapus_pada IS NULL
                     LIMIT 1'
                );

                $stmtPelanggan->execute([
                    ':id' => $idPelangganTerpilih
                ]);

                $pelanggan = $stmtPelanggan->fetch(
                    PDO::FETCH_ASSOC
                );

                if (!$pelanggan) {
                    throw new DomainException(
                        'Pelanggan yang dipilih tidak ditemukan.'
                    );
                }

                $idPelanggan = (int) $pelanggan['id_pelanggan'];
            } else {
                // Tidak menyimpan nomor HP dari transaksi.
                $stmtPelanggan = $pdo->prepare(
                    'INSERT INTO pelanggan (nama)
                     VALUES (:nama)'
                );

                $stmtPelanggan->execute([
                    ':nama' => $namaPelanggan
                ]);

                $idPelanggan = (int) $pdo->lastInsertId();
            }

            // Ambil harga dan HPP dari database.
            $stmtLayanan = $pdo->prepare(
                'SELECT nama_layanan, harga, hpp
                 FROM layanan
                 WHERE id_layanan = :id
                   AND aktif = 1
                 LIMIT 1'
            );

            $rincian = [];
            $totalHarga = 0;

            foreach ($jumlahPerLayanan as $idLayanan => $jumlah) {
                $stmtLayanan->execute([
                    ':id' => $idLayanan
                ]);

                $layanan = $stmtLayanan->fetch(
                    PDO::FETCH_ASSOC
                );

                if (!$layanan) {
                    throw new DomainException(
                        "Layanan ID {$idLayanan} tidak ditemukan atau tidak aktif."
                    );
                }

                $harga = (int) $layanan['harga'];

                if (
                    $harga < 0 ||
                    $harga > intdiv(
                        PHP_INT_MAX - $totalHarga,
                        $jumlah
                    )
                ) {
                    throw new DomainException(
                        'Total harga tidak valid atau terlalu besar.'
                    );
                }

                $totalHarga += $harga * $jumlah;

                if ($totalHarga > 2147483647) {
                    throw new DomainException(
                        'Total harga terlalu besar.'
                    );
                }

                $rincian[] = [
                    'id_layanan' => (int) $idLayanan,
                    'nama_layanan' => $layanan['nama_layanan'],
                    'harga' => $harga,
                    'hpp_saat_transaksi' =>
                        $layanan['hpp'] === null
                            ? null
                            : (int) $layanan['hpp'],
                    'jumlah' => $jumlah
                ];
            }

            // Waktu transaksi menggunakan zona Asia/Jakarta.
            $sekarang = new DateTimeImmutable(
                'now',
                new DateTimeZone('Asia/Jakarta')
            );

            $tanggal = $sekarang->format('Y-m-d');
            $waktu = $sekarang->format('H:i:s');

            // Simpan transaksi utama.
            $stmtTransaksi = $pdo->prepare(
                'INSERT INTO transaksi
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
                        :id_pencatat,
                        :id_barber,
                        :id_pelanggan,
                        :tanggal,
                        :waktu,
                        :total_harga,
                        :metode_pembayaran
                    )'
            );

            $stmtTransaksi->execute([
                ':id_pencatat' => $idUser,
                ':id_barber' => $idBarber,
                ':id_pelanggan' => $idPelanggan,
                ':tanggal' => $tanggal,
                ':waktu' => $waktu,
                ':total_harga' => $totalHarga,
                ':metode_pembayaran' => $metodePembayaran
            ]);

            $idTransaksi = (int) $pdo->lastInsertId();

            // Simpan rincian setiap layanan.
            $stmtDetail = $pdo->prepare(
                'INSERT INTO detail_transaksi
                    (
                        id_transaksi,
                        id_layanan,
                        nama_layanan_saat_transaksi,
                        harga_saat_transaksi,
                        hpp_saat_transaksi,
                        jumlah
                    )
                 VALUES
                    (
                        :id_transaksi,
                        :id_layanan,
                        :nama_layanan,
                        :harga,
                        :hpp,
                        :jumlah
                    )'
            );

            foreach ($rincian as $item) {
                $stmtDetail->execute([
                    ':id_transaksi' => $idTransaksi,
                    ':id_layanan' => $item['id_layanan'],
                    ':nama_layanan' => $item['nama_layanan'],
                    ':harga' => $item['harga'],
                    ':hpp' => $item['hpp_saat_transaksi'],
                    ':jumlah' => $item['jumlah']
                ]);
            }

            $pdo->commit();

            kirimJson(201, [
                'success' => true,
                'message' => 'Transaksi berhasil dicatat.',
                'data' => [
                    'id_transaksi' => $idTransaksi,
                    'id_pencatat' => $idUser,
                    'id_barber' => $idBarber,
                    'id_pelanggan' => $idPelanggan,
                    'tanggal' => $tanggal,
                    'waktu' => $waktu,
                    'total_harga' => $totalHarga,
                    'metode_pembayaran' => $metodePembayaran,
                    'layanan' => $rincian
                ]
            ]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;
        }
    }

    // Metode selain GET, POST, dan DELETE ditolak.
    header('Allow: GET, POST, DELETE');

    kirimJson(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);

} catch (DomainException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    kirimJson(422, [
        'success' => false,
        'message' => $e->getMessage(),
        'error_code' => 'UNPROCESSABLE_ENTITY'
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('API transaksi: ' . $e->getMessage());

    kirimJson(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
