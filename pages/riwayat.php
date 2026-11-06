<?php
require_once __DIR__ . '/../includes/auth_check.php';

require_role(['owner', 'barber']);

include __DIR__ . '/../includes/header.php';
?>

<div class="riwayat-page" data-role="<?= htmlspecialchars($_SESSION['role'] ?? '') ?>">

    <!-- HEADING -->
    <div class="riwayat-heading">
        <div class="riwayat-heading-text">
            <h1>Riwayat</h1>
            <p>Riwayat transaksi dan layanan pelanggan.</p>
        </div>
    </div>

    <!-- FILTER BAR (SESUAI FIGMA) -->
    <div class="riwayat-filter-bar">
        <div class="riwayat-filter-left">
            <!-- PENCARIAN -->
            <div class="riwayat-search-wrap">
                <svg class="riwayat-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    id="cariRiwayat"
                    class="riwayat-search-input"
                    placeholder="Cari riwayat..."
                    autocomplete="off"
                >
            </div>

            <!-- METODE PEMBAYARAN -->
            <div class="riwayat-select-wrap">
                <select id="filterMetodeRiwayat" class="riwayat-select-input">
                    <option value="">Semua Metode</option>
                    <option value="cash">Tunai</option>
                    <option value="qris">QRIS</option>
                    <option value="transfer">Transfer</option>
                </select>
                <svg class="riwayat-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>

        <div class="riwayat-filter-right">
            <!-- TANGGAL (DD-MM-YYYY) -->
            <div class="riwayat-date-wrap">
                <input
                    type="date"
                    id="filterTanggalRiwayat"
                    class="riwayat-date-input"
                    aria-label="Filter tanggal transaksi"
                >
                <button type="button" class="btn-clear-date" id="btnClearDate" title="Tampilkan semua tanggal" hidden>
                    &times;
                </button>
            </div>
        </div>
    </div>

    <!-- CARD TABEL RIWAYAT -->
    <div class="riwayat-card">

        <!-- NOTIFIKASI -->
        <div
            id="riwayatNotification"
            class="transaction-success riwayat-notification"
            hidden
        ></div>

        <div class="riwayat-table-wrapper">
            <table class="riwayat-table">
                <thead>
                    <tr>
                        <th class="th-no">No</th>
                        <th class="th-barber">Barber</th>
                        <th class="th-nama">Nama</th>
                        <th class="th-tanggal">Tgl-Bln-Thn</th>
                        <th class="th-layanan">Layanan</th>
                        <th class="th-nominal">Nominal</th>
                        <th class="th-metode text-center">Metode Pembayaran</th>
                    </tr>
                </thead>

                <tbody id="riwayatTableBody">
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">Memuat riwayat transaksi...</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- FOOTER PAGINASI (SESUAI FIGMA) -->
        <div class="riwayat-pagination-bar" id="riwayatPaginationBar">
            <div class="riwayat-pagination-info" id="riwayatPaginationInfo">
                Menampilkan 0 riwayat
            </div>

            <div class="riwayat-pagination-controls" id="riwayatPaginationControls">
                <!-- Diisi dinamis oleh JavaScript -->
            </div>

            <div class="riwayat-pagination-limit">
                <span>Per halaman</span>
                <div class="riwayat-limit-wrap">
                    <select id="riwayatPerPage" class="riwayat-limit-select">
                        <option value="5">5</option>
                        <option value="10" selected>10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                    <svg class="riwayat-limit-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </div>

    </div>

</div>

<script src="/KELOMPOK-5/assets/js/riwayat.js?v=8"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
