<?php
require_once __DIR__ . '/../includes/auth_check.php';

require_role(['owner', 'barber']);

include __DIR__ . '/../includes/header.php';
?>

<div class="riwayat-page" data-role="<?= htmlspecialchars($_SESSION['role'] ?? '') ?>">

    <div class="riwayat-heading">
        <h1>Riwayat</h1>
        <div class="riwayat-filter-controls">
            <label for="filterTanggalRiwayat" class="visually-hidden">Filter tanggal transaksi</label>
            <input
                type="date"
                id="filterTanggalRiwayat"
                class="riwayat-date-filter"
                aria-label="Filter tanggal transaksi"
            >
        </div>
    </div>

    <div class="riwayat-card">

        <!-- NOTIFIKASI -->
        <div
            id="riwayatNotification"
            class="transaction-success riwayat-delete-notification"
            hidden
        ></div>

        <div class="riwayat-table-wrapper">
            <table class="riwayat-table">

                <thead>
                    <tr>
                        <th>Barber</th>
                        <th>Nama</th>
                        <th>Tgl-Bln-Thn</th>
                        <th>Layanan</th>
                        <th>Nominal</th>
                        <th>Metode Pembayaran</th>
                         <th>Aksi</th>
                    </tr>
                </thead>

                <tbody id="riwayatTableBody">
                    <tr>
                        <td colspan="7">Memuat riwayat transaksi...</td>
                    </tr>
                </tbody>

            </table>
        </div>

    </div>

</div>

<script src="/KELOMPOK-5/assets/js/riwayat.js?v=5"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>