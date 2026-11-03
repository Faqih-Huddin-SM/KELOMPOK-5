<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

function kirimJsonPelanggan(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $role = strtolower(trim($_SESSION['role'] ?? ''));

    // Hanya owner dan barber yang boleh mengakses data pelanggan.
    if (!in_array($role, ['owner', 'barber'], true)) {
        kirimJsonPelanggan(403, [
            'success' => false,
            'message' => 'Role tidak diizinkan.',
            'error_code' => 'FORBIDDEN'
        ]);
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // Endpoint ini hanya menerima GET dan DELETE.
    if (!in_array($method, ['GET', 'DELETE'], true)) {
        header('Allow: GET, DELETE');

        kirimJsonPelanggan(405, [
            'success' => false,
            'message' => 'Metode tidak diizinkan.',
            'error_code' => 'METHOD_NOT_ALLOWED'
        ]);
    }

    // -----------------------------------------------------------
    // DELETE: soft delete pelanggan (hanya owner).
    // Baris tidak dihapus dari database, hanya diberi tanda
    // dihapus_pada, sehingga riwayat transaksi tetap utuh.
    // ID dibaca dari ?id= atau body JSON {"id_pelanggan": 1}.
    // -----------------------------------------------------------
    if ($method === 'DELETE') {
        if ($role !== 'owner') {
            kirimJsonPelanggan(403, [
                'success' => false,
                'message' => 'Hanya owner yang dapat menghapus pelanggan.',
                'error_code' => 'FORBIDDEN'
            ]);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            $input = [];
        }

        $id = filter_var(
            $_GET['id'] ?? $input['id_pelanggan'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );

        if ($id === false || $id === null) {
            kirimJsonPelanggan(400, [
                'success' => false,
                'message' => 'ID pelanggan tidak valid.',
                'error_code' => 'BAD_REQUEST'
            ]);
        }

        $stmt = $pdo->prepare(
            'UPDATE pelanggan
             SET dihapus_pada = NOW()
             WHERE id_pelanggan = :id
               AND dihapus_pada IS NULL'
        );

        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            kirimJsonPelanggan(404, [
                'success' => false,
                'message' => 'Pelanggan tidak ditemukan.',
                'error_code' => 'NOT_FOUND'
            ]);
        }

        kirimJsonPelanggan(200, [
            'success' => true,
            'message' => 'Pelanggan berhasil dihapus.'
        ]);
    }

    // -----------------------------------------------------------
    // GET: saran nama / daftar pelanggan (tanpa yang sudah dihapus).
    // -----------------------------------------------------------
    $q = trim((string) ($_GET['q'] ?? ''));

    // Jika parameter q diisi, minimal harus 2 karakter.
    if ($q !== '' && strlen($q) < 2) {
        kirimJsonPelanggan(200, [
            'success' => true,
            'data' => []
        ]);
    }

    if ($q !== '') {
        $stmt = $pdo->prepare(
            'SELECT id_pelanggan, nama
             FROM pelanggan
             WHERE dihapus_pada IS NULL
               AND nama LIKE :q
             ORDER BY nama ASC, id_pelanggan ASC
             LIMIT 100'
        );

        $stmt->execute([
            ':q' => '%' . $q . '%'
        ]);
    } else {
        $stmt = $pdo->query(
            'SELECT id_pelanggan, nama
             FROM pelanggan
             WHERE dihapus_pada IS NULL
             ORDER BY nama ASC, id_pelanggan ASC
             LIMIT 100'
        );
    }

    kirimJsonPelanggan(200, [
        'success' => true,
        'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
    ]);

} catch (Throwable $e) {
    error_log('API pelanggan: ' . $e->getMessage());

    kirimJsonPelanggan(500, [
        'success' => false,
        'message' => 'Gagal memproses data pelanggan.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
