
<?php

header('Content-Type: application/json; charset=utf-8');

function kirimJson(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function bacaJson(): array
{
    $isi = file_get_contents('php://input');
    $data = json_decode($isi, true);

    if (!is_array($data)) {
        kirimJson(400, [
            'success' => false,
            'message' => 'harus berupa json yang valid .',
            'error_code' => 'BAD_REQUEST'
        ]);
    }

    return $data;
}

function bacaDataRequest(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'multipart/form-data') === 0) {
        return $_POST;
    }

    return bacaJson();
}

function simpanIkon(?array $file, ?string $ikonLama = null): ?string
{
    if (
        $file === null ||
        !isset($file['error']) ||
        $file['error'] === UPLOAD_ERR_NO_FILE
    ) {
        return $ikonLama;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        kirimJson(422, [
            'success' => false,
            'message' => 'Upload ikon gagal.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    if (
        !isset($file['size'], $file['tmp_name']) ||
        $file['size'] > 2 * 1024 * 1024
    ) {
        kirimJson(422, [
            'success' => false,
            'message' => 'Ukuran ikon maksimal 2 MB.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        kirimJson(422, [
            'success' => false,
            'message' => 'File upload tidak valid.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);

    $formatDiizinkan = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];

    if (!isset($formatDiizinkan[$mime])) {
        kirimJson(422, [
            'success' => false,
            'message' => 'Ikon harus berformat JPG, PNG, atau WebP.',
            'error_code' => 'UNPROCESSABLE_ENTITY'
        ]);
    }

    $folder = __DIR__ . '/../../uploads/layanan';

    if (
        !is_dir($folder) &&
        !mkdir($folder, 0755, true) &&
        !is_dir($folder)
    ) {
        throw new RuntimeException(
            'Folder upload ikon tidak dapat dibuat.'
        );
    }

    $namaFile = bin2hex(random_bytes(16))
        . '.'
        . $formatDiizinkan[$mime];

    $tujuan = $folder . '/' . $namaFile;

    if (!move_uploaded_file($file['tmp_name'], $tujuan)) {
        throw new RuntimeException('File ikon gagal disimpan.');
    }

    return 'uploads/layanan/' . $namaFile;
}

function hapusFileIkon(?string $path): void
{
    if (!$path || strpos($path, 'uploads/layanan/') !== 0) {
        return;
    }

    $namaFile = basename($path);

    if (
        $namaFile === '' ||
        $namaFile === '.' ||
        $namaFile === '..'
    ) {
        return;
    }

    $file = __DIR__ . '/../../uploads/layanan/' . $namaFile;

    if (is_file($file)) {
        unlink($file);
    }
}

$methodAsli = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$method = $methodAsli;

// Dukungan PUT dengan multipart/form-data.
if (
    $methodAsli === 'POST' &&
    ($_POST['_method'] ?? '') === 'PUT'
) {
    $method = 'PUT';
}

if (!in_array(
    $method,
    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    true
)) {
    header('Allow: GET, POST, PUT, PATCH, DELETE');

    kirimJson(405, [
        'success' => false,
        'message' => 'Method HTTP tidak diizinkan.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

try {
    require_once __DIR__ . '/../../config/config.php';

    if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        require_once __DIR__ . '/../middleware/auth.php';
        apiWajibOwner();
    }

    // GET: mengambil semua layanan, termasuk yang nonaktif.
    if ($method === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT id_layanan, nama_layanan, harga, hpp, aktif, icon_layanan
             FROM layanan
             ORDER BY id_layanan DESC'
        );

        $stmt->execute();

        kirimJson(200, [
            'success' => true,
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    // POST: menambahkan layanan baru.
    if ($method === 'POST') {
        $data = bacaDataRequest();

        $namaRaw = $data['nama_layanan'] ?? null;

        if (!is_string($namaRaw)) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Nama layanan wajib berupa teks.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $nama = trim($namaRaw);
        $harga = filter_var(
            $data['harga'] ?? null,
            FILTER_VALIDATE_INT
        );
        $hpp = filter_var(
            $data['hpp'] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($nama === '' || strlen($nama) > 100) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Nama layanan wajib diisi dan maksimal 100 karakter.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if ($harga === false || $harga === null || $harga <= 0) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Harga harus berupa bilangan bulat lebih dari nol.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if (
            $hpp === false ||
            $hpp === null ||
            $hpp < 0 ||
            $hpp > 2147483647
        ) {
            kirimJson(422, [
                'success' => false,
                'message' => 'HPP harus berupa bilangan bulat nol atau lebih.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $ikonBaru = simpanIkon($_FILES['icon_layanan'] ?? null);

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO layanan
                    (nama_layanan, harga, hpp, icon_layanan, aktif)
                 VALUES (?, ?, ?, ?, 1)'
            );

            $stmt->execute([
                $nama,
                $harga,
                $hpp,
                $ikonBaru
            ]);
        } catch (Throwable $e) {
            hapusFileIkon($ikonBaru);
            throw $e;
        }

        kirimJson(201, [
            'success' => true,
            'message' => 'Layanan berhasil ditambahkan.',
            'data' => [
                'id_layanan' => (int) $pdo->lastInsertId(),
                'nama_layanan' => $nama,
                'harga' => $harga,
                'hpp' => $hpp,
                'aktif' => 1,
                'icon_layanan' => $ikonBaru
            ]
        ]);
    }

    // PUT: mengedit layanan aktif maupun nonaktif.
    if ($method === 'PUT') {
        $data = bacaDataRequest();

        $id = filter_var(
            $data['id_layanan'] ?? null,
            FILTER_VALIDATE_INT
        );

        $namaRaw = $data['nama_layanan'] ?? null;

        if (!is_string($namaRaw)) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Nama layanan wajib berupa teks.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $nama = trim($namaRaw);
        $harga = filter_var(
            $data['harga'] ?? null,
            FILTER_VALIDATE_INT
        );
        $hpp = filter_var(
            $data['hpp'] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($id === false || $id === null || $id <= 0) {
            kirimJson(422, [
                'success' => false,
                'message' => 'ID layanan tidak valid.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if ($nama === '' || strlen($nama) > 100) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Nama layanan wajib diisi dan maksimal 100 karakter.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if ($harga === false || $harga === null || $harga <= 0) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Harga harus berupa bilangan bulat lebih dari nol.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        if (
            $hpp === false ||
            $hpp === null ||
            $hpp < 0 ||
            $hpp > 2147483647
        ) {
            kirimJson(422, [
                'success' => false,
                'message' => 'HPP harus berupa bilangan bulat nol atau lebih.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        // Tidak memakai kondisi "aktif = 1", jadi layanan nonaktif tetap bisa diedit.
        $cek = $pdo->prepare(
            'SELECT icon_layanan
             FROM layanan
             WHERE id_layanan = ?'
        );

        $cek->execute([$id]);
        $layananLama = $cek->fetch(PDO::FETCH_ASSOC);

        if (!$layananLama) {
            kirimJson(404, [
                'success' => false,
                'message' => 'Layanan tidak ditemukan.',
                'error_code' => 'NOT_FOUND'
            ]);
        }

        $ikonLama = $layananLama['icon_layanan'];

        $fileIkonDiunggah = isset($_FILES['icon_layanan'])
            && $_FILES['icon_layanan']['error'] !== UPLOAD_ERR_NO_FILE;

        $ikonBaru = simpanIkon(
            $_FILES['icon_layanan'] ?? null,
            $ikonLama
        );

        try {
            $stmt = $pdo->prepare(
                'UPDATE layanan
                 SET nama_layanan = ?, harga = ?, hpp = ?, icon_layanan = ?
                 WHERE id_layanan = ?'
            );

            $stmt->execute([
                $nama,
                $harga,
                $hpp,
                $ikonBaru,
                $id
            ]);
        } catch (Throwable $e) {
            if ($fileIkonDiunggah && $ikonBaru !== $ikonLama) {
                hapusFileIkon($ikonBaru);
            }

            throw $e;
        }

        // Hapus ikon lama hanya setelah database berhasil diperbarui.
        if ($fileIkonDiunggah && $ikonLama !== $ikonBaru) {
            hapusFileIkon($ikonLama);
        }

        kirimJson(200, [
            'success' => true,
            'message' => 'Layanan berhasil diperbarui.',
            'data' => [
                'id_layanan' => (int) $id,
                'nama_layanan' => $nama,
                'harga' => $harga,
                'hpp' => $hpp,
                'icon_layanan' => $ikonBaru
            ]
        ]);
    }

    // PATCH: hanya mengubah status aktif/nonaktif.
    if ($method === 'PATCH') {
        $data = bacaJson();

        $id = filter_var(
            $data['id_layanan'] ?? null,
            FILTER_VALIDATE_INT
        );

        if ($id === false || $id === null || $id <= 0) {
            kirimJson(422, [
                'success' => false,
                'message' => 'ID layanan tidak valid.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $aktif = array_key_exists('aktif', $data)
            ? filter_var($data['aktif'], FILTER_VALIDATE_INT)
            : 0;

        if (!in_array($aktif, [0, 1], true)) {
            kirimJson(422, [
                'success' => false,
                'message' => 'Status aktif harus bernilai 0 atau 1.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $stmt = $pdo->prepare(
            'UPDATE layanan
             SET aktif = ?
             WHERE id_layanan = ?'
        );

        $stmt->execute([$aktif, $id]);

        if ($stmt->rowCount() === 0) {
            $cek = $pdo->prepare(
                'SELECT id_layanan
                 FROM layanan
                 WHERE id_layanan = ?'
            );

            $cek->execute([$id]);

            if (!$cek->fetchColumn()) {
                kirimJson(404, [
                    'success' => false,
                    'message' => 'Layanan tidak ditemukan.',
                    'error_code' => 'NOT_FOUND'
                ]);
            }
        }

        kirimJson(200, [
            'success' => true,
            'message' => $aktif === 1
                ? 'Layanan berhasil diaktifkan.'
                : 'Layanan berhasil dinonaktifkan.'
        ]);
    }

    // DELETE: menghapus layanan permanen beserta file ikonnya.
    if ($method === 'DELETE') {
        $data = bacaJson();

        $id = filter_var(
            $data['id_layanan'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($id === false || $id === null) {
            kirimJson(422, [
                'success' => false,
                'message' => 'ID layanan tidak valid.',
                'error_code' => 'UNPROCESSABLE_ENTITY'
            ]);
        }

        $cek = $pdo->prepare(
            'SELECT icon_layanan
             FROM layanan
             WHERE id_layanan = ?'
        );

        $cek->execute([$id]);
        $layananLama = $cek->fetch(PDO::FETCH_ASSOC);

        if (!$layananLama) {
            kirimJson(404, [
                'success' => false,
                'message' => 'Layanan tidak ditemukan.',
                'error_code' => 'NOT_FOUND'
            ]);
        }

        $stmt = $pdo->prepare(
            'DELETE FROM layanan
             WHERE id_layanan = ?'
        );

        $stmt->execute([$id]);

        hapusFileIkon($layananLama['icon_layanan']);

        kirimJson(200, [
            'success' => true,
            'message' => 'Layanan berhasil dihapus permanen.'
        ]);
    }
} catch (Throwable $e) {
    error_log($e->getMessage());

    kirimJson(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
