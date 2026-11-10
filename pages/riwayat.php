<?php
require_once __DIR__ . '/../includes/auth_check.php';

require_role(['owner', 'barber']);

include __DIR__ . '/../includes/header.php';
?>

<div class="riwayat-page" data-role="<?= htmlspecialchars($_SESSION['role'] ?? '') ?>">

    <!-- HEADER: TITLE & DATE FILTER (SESUAI FIGMA) -->
    <div class="riwayat-header-row">
        <h1 class="riwayat-title">Riwayat</h1>

        <div class="riwayat-date-picker-wrap" id="riwayatDatePill">
            <svg class="riwayat-date-calendar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <input
                type="date"
                id="filterTanggalMulai"
                class="riwayat-top-date-input"
                aria-label="Tanggal Mulai"
            >
            <span class="riwayat-date-separator">&ndash;</span>
            <input
                type="date"
                id="filterTanggalSelesai"
                class="riwayat-top-date-input"
                aria-label="Tanggal Selesai"
            >
            <button type="button" class="btn-clear-date" id="btnClearDate" title="Tampilkan semua tanggal (dd-mm-yyyy)" aria-label="Hapus filter tanggal" hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    </div>

    <!-- FILTER CARD (SESUAI FIGMA) -->
    <section class="riwayat-filter-card">
        <!-- BARIS 1: SEARCH INPUT FULL WIDTH -->
        <div class="riwayat-search-full">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
                type="text"
                id="cariRiwayat"
                class="riwayat-search-field"
                placeholder="Cari nama pelanggan atau ID transaksi..."
                autocomplete="off"
            >
        </div>

        <!-- BARIS 2: 4 KOLOM (BARBER, LAYANAN, PEMBAYARAN, RESET FILTER) -->
        <div class="riwayat-filter-grid">
            <!-- 1. BARBER -->
            <div class="filter-col">
                <label for="filterBarberRiwayat" class="filter-label">Barber</label>
                <div class="filter-select-wrap">
                    <svg class="filter-leading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <select id="filterBarberRiwayat" class="filter-select">
                        <option value="">Semua Barber</option>
                    </select>
                    <svg class="filter-chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <!-- 2. LAYANAN -->
            <div class="filter-col">
                <label for="filterLayananRiwayat" class="filter-label">Layanan</label>
                <div class="filter-select-wrap">
                    <svg class="filter-leading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                    </svg>
                    <select id="filterLayananRiwayat" class="filter-select">
                        <option value="">Semua Layanan</option>
                    </select>
                    <svg class="filter-chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <!-- 3. PEMBAYARAN -->
            <div class="filter-col">
                <label for="filterMetodeRiwayat" class="filter-label">Pembayaran</label>
                <div class="filter-select-wrap">
                    <svg class="filter-leading-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                        <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                    <select id="filterMetodeRiwayat" class="filter-select">
                        <option value="">Semua Metode</option>
                        <option value="cash">Tunai</option>
                        <option value="qris">QRIS</option>
                        <option value="transfer">Transfer</option>
                    </select>
                    <svg class="filter-chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <!-- 4. RESET FILTER BUTTON -->
            <div class="filter-col filter-action-col">
                <button type="button" id="btnResetFilter" class="btn-reset-filter-figma">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    <span>Reset Filter</span>
                </button>
            </div>
        </div>
    </section>

    <!-- CARD TABEL RIWAYAT (URUTAN: NO, NAMA, BARBER, TGL-BLN-THN, LAYANAN, NOMINAL, METODE PEMBAYARAN) -->
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
                        <th class="th-nama">Nama</th>
                        <th class="th-barber">Barber</th>
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

<script src="/KELOMPOK-5/assets/js/riwayat.js?v=12"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
