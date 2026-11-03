<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibOwner();

function kirimJsonHapus(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Endpoint ini hanya menerima DELETE.
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    header('Allow: DELETE');

    kirimJsonHapus(405, [
        'success' => false,
        'message' => 'Gunakan metode DELETE.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

// PHP tidak mengisi $_POST untuk DELETE, jadi ID dibaca dari
// query string (?id_transaksi=) atau body JSON ({"id_transaksi": 1}).
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    $input = [];
}

$id = filter_var(
    $_GET['id_transaksi'] ?? $input['id_transaksi'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

if ($id === false || $id === null) {
    kirimJsonHapus(400, [
        'success' => false,
        'message' => 'ID transaksi tidak valid.',
        'error_code' => 'BAD_REQUEST'
    ]);
}

try {
    $stmt = $pdo->prepare(
        'UPDATE transaksi
         SET dihapus_pada = NOW()
         WHERE id_transaksi = :id
           AND dihapus_pada IS NULL'
    );

    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
        kirimJsonHapus(404, [
            'success' => false,
            'message' => 'Transaksi tidak ditemukan atau sudah dihapus.',
            'error_code' => 'NOT_FOUND'
        ]);
    }

    kirimJsonHapus(200, [
        'success' => true,
        'message' => 'Riwayat transaksi berhasil dihapus.'
    ]);
} catch (PDOException $e) {
    error_log('API hapus transaksi: ' . $e->getMessage());

    kirimJsonHapus(500, [
        'success' => false,
        'message' => 'Gagal menghapus riwayat transaksi.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
