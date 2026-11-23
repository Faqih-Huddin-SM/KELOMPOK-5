<?php
require_once __DIR__ . '/../includes/auth_check.php';

require_login();

$role = $_SESSION['role'] ?? '';

if ($role !== 'owner') {
    header('Location: dashboard.php');
    exit;
}

include __DIR__ . '/../includes/header.php';
?>

<div class="pemasukan-page">
    <header class="pemasukan-heading">
        <h1>Pemasukkan</h1>
        <p>Rekap Pemasukkan Harian dari Transaksi</p>
    </header>

    <section class="pemasukan-card">
        <div class="pemasukan-card-header">
            <h2>Pemasukkan Harian</h2>

            <div class="pemasukan-date">
                <input
                    type="date"
                    id="tanggalPemasukan"
                    aria-label="Pilih tanggal pemasukkan"
                >
            </div>
        </div>

        <div class="pemasukan-total-row">
            <span>Total Pemasukkan</span>
            <strong id="totalPemasukan">Rp0</strong>
        </div>

        <div class="pemasukan-detail">
            <h3>Rincian Per Barber</h3>

            <div class="table-responsive" id="tabelPemasukanWrapper">
                <table class="data-table pemasukan-table">
                    <thead>
                        <tr>
                            <th>Barber</th>
                            <th>Transaksi</th>
                            <th>Pemasukkan</th>
                        </tr>
                    </thead>
                    <tbody id="tabelPemasukanBody">
                        <tr>
                            <td colspan="3" class="pemasukan-empty-cell">
                                Memuat data pemasukkan...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
