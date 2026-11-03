
<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibOwner();

$method = $_SERVER['REQUEST_METHOD'];
$idUser = (int) ($_SESSION['id_user'] ?? 0);

function kirimJsonPengeluaran(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function tanggalValidPengeluaran($tanggal): bool
{
    if (!is_string($tanggal)) {
        return false;
    }

    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $tanggal);

    return $date !== false && $date->format('Y-m-d') === $tanggal;
}

function tanggalHariIniWIBPengeluaran(): string
{
    return (new DateTimeImmutable(
        'now',
        new DateTimeZone('Asia/Jakarta')
    ))->format('Y-m-d');
}

try {
    // GET: daftar dan total pengeluaran per tanggal.
    if ($method === 'GET') {
        $tanggal = $_GET['tanggal'] ?? tanggalHariIniWIBPengeluaran();
        if (!tanggalValidPengeluaran($tanggal)) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Format tanggal harus YYYY-MM-DD.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

                $stmt = $pdo->prepare(
            'SELECT p.id_pengeluaran, p.kategori, p.nominal, p.tanggal,
                    p.keterangan, p.dibuat_pada, p.id_user,
                    u.nama AS nama_user
             FROM pengeluaran p
             LEFT JOIN users u ON u.id_user = p.id_user
             WHERE p.tanggal = :tanggal
             ORDER BY p.id_pengeluaran DESC'
        );

        $stmt->execute(['tanggal' => $tanggal]);
        $daftar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmtTotal = $pdo->prepare(
            'SELECT COALESCE(SUM(nominal), 0)
             FROM pengeluaran
             WHERE tanggal = :tanggal'
        );

        $stmtTotal->execute(['tanggal' => $tanggal]);

        kirimJsonPengeluaran(200, [
            'success' => true,
            'data' => [
                'tanggal' => $tanggal,
                'pengeluaran' => $daftar,
                'total_pengeluaran' => (int) $stmtTotal->fetchColumn()
            ]
        ]);
    }

    // POST: simpan pengeluaran baru.
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            kirimJsonPengeluaran(400, [
                'success' => false,
                'message' => 'Body harus berupa JSON yang valid.',
                'error_code' => 'BAD_REQUEST'
            ]);
        }

        $kategori = trim(
            is_string($input['kategori'] ?? null)
                ? $input['kategori']
                : ''
        );

        $nominalInput = $input['nominal'] ?? null;
        $tanggal = $input['tanggal'] ?? tanggalHariIniWIBPengeluaran();
        $keterangan = $input['keterangan'] ?? null;

        // Tolak nominal kosong, bukan angka, nol, negatif,
        // desimal, dan angka di luar batas integer database.
        $nominalValid = (
            (is_int($nominalInput) ||
                (is_string($nominalInput) &&
                 preg_match('/^[0-9]+$/', $nominalInput)))
            && (float) $nominalInput > 0
            && (float) $nominalInput <= 2147483647
        );

        if (!$nominalValid) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Nominal harus lebih dari nol',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $nominal = (int) $nominalInput;

        if ($kategori === '' || mb_strlen($kategori) > 100) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Kategori wajib diisi (maksimal 100 karakter).',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if (!tanggalValidPengeluaran($tanggal)) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Format tanggal harus YYYY-MM-DD.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if ($keterangan !== null && !is_string($keterangan)) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Keterangan harus berupa teks.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $keterangan = $keterangan !== null ? trim($keterangan) : null;

        if ($keterangan === '') {
            $keterangan = null;
        }

        if ($keterangan !== null && mb_strlen($keterangan) > 255) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Keterangan maksimal 255 karakter.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO pengeluaran
                (id_user, tanggal, kategori, nominal, keterangan)
             VALUES
                (:id_user, :tanggal, :kategori, :nominal, :keterangan)'
        );

        $stmt->execute([
            'id_user' => $idUser,
            'tanggal' => $tanggal,
            'kategori' => $kategori,
            'nominal' => $nominal,
            'keterangan' => $keterangan
        ]);

        kirimJsonPengeluaran(201, [
            'success' => true,
            'message' => 'Pengeluaran berhasil dicatat.',
            'data' => [
                'id_pengeluaran' => (int) $pdo->lastInsertId(),
                'id_user' => $idUser,
                'tanggal' => $tanggal,
                'kategori' => $kategori,
                'nominal' => $nominal,
                'keterangan' => $keterangan
            ]
        ]);
    }
    // DELETE: hapus pengeluaran hanya jika tanggalnya hari ini (WIB).
        // PUT: ubah kategori, nominal, dan keterangan pengeluaran.
    // Hanya pengeluaran hari ini (WIB) yang boleh diubah; tanggal dan
    // pencatat tidak berubah.
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            kirimJsonPengeluaran(400, [
                'success' => false,
                'message' => 'Body harus berupa JSON yang valid.',
                'error_code' => 'BAD_REQUEST'
            ]);
        }

        // ID wajib berupa bilangan bulat positif.
        $idInput = $input['id_pengeluaran'] ?? null;
        $idValid = (
            is_int($idInput) && $idInput > 0
            || (is_string($idInput)
                && preg_match('/^[1-9][0-9]*$/', $idInput)
                && (float) $idInput <= PHP_INT_MAX)
        );

        if (!$idValid) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'ID pengeluaran tidak valid.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $idPengeluaran = (int) $idInput;

        $kategori = trim(
            is_string($input['kategori'] ?? null)
                ? $input['kategori']
                : ''
        );

        if ($kategori === '' || mb_strlen($kategori) > 100) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Kategori wajib diisi (maksimal 100 karakter).',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        // Nominal: bilangan bulat, lebih dari 0, maksimal 2147483647.
        $nominalInput = $input['nominal'] ?? null;
        $nominalValid = (
            (is_int($nominalInput) ||
                (is_string($nominalInput) &&
                 preg_match('/^[0-9]+$/', $nominalInput)))
            && (float) $nominalInput > 0
            && (float) $nominalInput <= 2147483647
        );

        if (!$nominalValid) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Nominal harus lebih dari nol',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $nominal = (int) $nominalInput;

        // Keterangan opsional, maksimal 255 karakter.
        $keterangan = $input['keterangan'] ?? null;

        if ($keterangan !== null && !is_string($keterangan)) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Keterangan harus berupa teks.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $keterangan = $keterangan !== null ? trim($keterangan) : null;

        if ($keterangan === '') {
            $keterangan = null;
        }

        if ($keterangan !== null && mb_strlen($keterangan) > 255) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'Keterangan maksimal 255 karakter.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $tanggalHariIni = tanggalHariIniWIBPengeluaran();

        $stmt = $pdo->prepare(
            'SELECT id_pengeluaran, tanggal
             FROM pengeluaran
             WHERE id_pengeluaran = :id_pengeluaran
             LIMIT 1'
        );
        $stmt->execute(['id_pengeluaran' => $idPengeluaran]);
        $pengeluaran = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pengeluaran) {
            kirimJsonPengeluaran(404, [
                'success' => false,
                'message' => 'Pengeluaran tidak ditemukan.',
                'error_code' => 'NOT_FOUND'
            ]);
        }

        // Tolak perubahan data dari tanggal selain hari ini.
        if ($pengeluaran['tanggal'] !== $tanggalHariIni) {
            kirimJsonPengeluaran(403, [
                'success' => false,
                'message' => 'Hanya pengeluaran hari ini yang dapat diubah.',
                'error_code' => 'FORBIDDEN'
            ]);
        }

        $stmtUbah = $pdo->prepare(
            'UPDATE pengeluaran
             SET kategori = :kategori,
                 nominal = :nominal,
                 keterangan = :keterangan
             WHERE id_pengeluaran = :id_pengeluaran
               AND tanggal = :tanggal'
        );
        $stmtUbah->execute([
            'kategori' => $kategori,
            'nominal' => $nominal,
            'keterangan' => $keterangan,
            'id_pengeluaran' => $idPengeluaran,
            'tanggal' => $tanggalHariIni
        ]);

        // rowCount() bernilai 0 juga bila isinya sama dengan data lama,
        // jadi pastikan datanya memang masih ada sebelum dianggap konflik.
        if ($stmtUbah->rowCount() === 0) {
            $stmt->execute(['id_pengeluaran' => $idPengeluaran]);
            $masihAda = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$masihAda || $masihAda['tanggal'] !== $tanggalHariIni) {
                kirimJsonPengeluaran(409, [
                    'success' => false,
                    'message' => 'Pengeluaran tidak dapat diubah. Muat ulang data lalu coba lagi.',
                    'error_code' => 'CONFLICT'
                ]);
            }
        }

        kirimJsonPengeluaran(200, [
            'success' => true,
            'message' => 'Perubahan pengeluaran berhasil disimpan.',
            'data' => [
                'id_pengeluaran' => $idPengeluaran,
                'tanggal' => $tanggalHariIni,
                'kategori' => $kategori,
                'nominal' => $nominal,
                'keterangan' => $keterangan
            ]
        ]);
    }
    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            $input = [];
        }

        // Terima ID melalui query string atau JSON body.
        $idInput = $_GET['id_pengeluaran']
            ?? $input['id_pengeluaran']
            ?? null;

        // Validasi ID: wajib bilangan bulat positif.
        $idValid = (
            is_int($idInput)
            || (is_string($idInput)
                && preg_match('/^[1-9][0-9]*$/', $idInput))
        );

        if (!$idValid || (float) $idInput > PHP_INT_MAX) {
            kirimJsonPengeluaran(422, [
                'success' => false,
                'message' => 'ID pengeluaran tidak valid.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $idPengeluaran = (int) $idInput;
        $tanggalHariIni = tanggalHariIniWIBPengeluaran();

        // Cari data berdasarkan ID.
        $stmt = $pdo->prepare(
            'SELECT id_pengeluaran, tanggal
             FROM pengeluaran
             WHERE id_pengeluaran = :id_pengeluaran
             LIMIT 1'
        );
        $stmt->execute(['id_pengeluaran' => $idPengeluaran]);
        $pengeluaran = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$pengeluaran) {
            kirimJsonPengeluaran(404, [
                'success' => false,
                'message' => 'Pengeluaran tidak ditemukan.',
                'error_code' => 'NOT_FOUND'
            ]);
        }

        // Tolak penghapusan data dari tanggal selain hari ini.
        if ($pengeluaran['tanggal'] !== $tanggalHariIni) {
            kirimJsonPengeluaran(403, [
                'success' => false,
                'message' => 'Hanya pengeluaran hari ini yang dapat dihapus.',
                'error_code' => 'FORBIDDEN'
            ]);
        }

        // Kondisi tanggal di query DELETE menjadi pemeriksaan tambahan.
        $stmtDelete = $pdo->prepare(
            'DELETE FROM pengeluaran
             WHERE id_pengeluaran = :id_pengeluaran
               AND tanggal = :tanggal'
        );
        $stmtDelete->execute([
            'id_pengeluaran' => $idPengeluaran,
            'tanggal' => $tanggalHariIni
        ]);

        if ($stmtDelete->rowCount() !== 1) {
            kirimJsonPengeluaran(409, [
                'success' => false,
                'message' => 'Pengeluaran tidak dapat dihapus. Muat ulang data lalu coba lagi.',
                'error_code' => 'CONFLICT'
            ]);
        }

        kirimJsonPengeluaran(200, [
            'success' => true,
            'message' => 'Pengeluaran berhasil dihapus.',
            'data' => [
                'id_pengeluaran' => $idPengeluaran,
                'tanggal' => $tanggalHariIni
            ]
        ]);
    }
        header('Allow: GET, POST, PUT, DELETE');

    kirimJsonPengeluaran(405, [
        'success' => false,
        'message' => 'Method tidak didukung.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);

} catch (Throwable $e) {
    error_log('API pengeluaran: ' . $e->getMessage());

    kirimJsonPengeluaran(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
