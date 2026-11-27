
<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json; charset=utf-8');

apiWajibLogin();

$role = strtolower(trim($_SESSION['role'] ?? ''));
$idUser = (int) ($_SESSION['id_user'] ?? 0);

function kirimJsonDetail(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');

    kirimJsonDetail(405, [
        'success' => false,
        'message' => 'Method hanya GET.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
}

$idTransaksi = filter_var(
    $_GET['id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);

if ($idTransaksi === false) {
    kirimJsonDetail(400, [
        'success' => false,
        'message' => 'ID transaksi tidak valid.',
        'error_code' => 'BAD_REQUEST'
    ]);
}

try {
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
        JOIN users u ON u.id_user = t.id_barber
        LEFT JOIN pelanggan p ON p.id_pelanggan = t.id_pelanggan
        WHERE t.id_transaksi = :id_transaksi
  AND t.dihapus_pada IS NULL
    ";

    if ($role === 'barber') {
        $sql .= " AND t.id_pencatat = :id_user";
    } elseif ($role !== 'owner') {
        kirimJsonDetail(403, [
            'success' => false,
            'message' => 'Role tidak diizinkan.',
            'error_code' => 'FORBIDDEN'
        ]);
    }

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(
        ':id_transaksi',
        $idTransaksi,
        PDO::PARAM_INT
    );

    if ($role === 'barber') {
        $stmt->bindValue(':id_user', $idUser, PDO::PARAM_INT);
    }

    $stmt->execute();
    $transaksi = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$transaksi) {
        kirimJsonDetail(404, [
            'success' => false,
            'message' => 'Transaksi tidak ditemukan.',
            'error_code' => 'NOT_FOUND'
        ]);
    }

    $stmtDetail = $pdo->prepare("
    SELECT
        dt.id_layanan,
        dt.nama_layanan_saat_transaksi AS nama_layanan,
        dt.harga_saat_transaksi AS harga,
        dt.hpp_saat_transaksi,
        dt.jumlah,
        (dt.harga_saat_transaksi * dt.jumlah) AS subtotal
    FROM detail_transaksi dt
    WHERE dt.id_transaksi = :id_transaksi
    ORDER BY dt.id_detail ASC
");

    $stmtDetail->execute([
        ':id_transaksi' => $idTransaksi
    ]);

    $transaksi['layanan'] = $stmtDetail->fetchAll(PDO::FETCH_ASSOC);

    kirimJsonDetail(200, [
        'success' => true,
        'data' => $transaksi
    ]);

} catch (Throwable $e) {
    error_log('API detail transaksi: ' . $e->getMessage());

    kirimJsonDetail(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error_code' => 'INTERNAL_SERVER_ERROR'
    ]);
}
