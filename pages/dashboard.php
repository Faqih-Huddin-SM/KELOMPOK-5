<?php

require_once __DIR__ . '/../includes/auth_check.php';

require_role(['owner']);

$role = $_SESSION['role'] ?? '';
$nama = $_SESSION['nama'] ?? '';

// Format sapaan sesuai role & nama (Figma: "Selamat datang, Owner Kataji")
$display_role = ($role === 'owner') ? 'Owner Kataji' : ($nama ?: 'Barber');
?>

<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="dashboard-page">

    <!-- ======================================== -->
    <!-- BAGIAN: HEADER DASHBOARD -->
    <!-- ======================================== -->
    <div class="dashboard-heading">
        <h1>Dashboard</h1>
        <p>Selamat datang, <?= htmlspecialchars($display_role) ?></p>
    </div>

    <!-- ======================================== -->
    <!-- BAGIAN: RINGKASAN HARIAN (4 KARTU) -->
    <!-- ======================================== -->
    <div class="dashboard-summary">

        <!-- 1. PELANGGAN HARI INI -->
        <div class="summary-card">
            <div class="summary-card-header">
                <span class="summary-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </span>
                <span class="summary-title">Pelanggan Hari Ini</span>
            </div>
            <strong class="summary-value" id="dashPelangganHariIni">
                <div class="summary-loading-pill"><span class="dashboard-spinner spinner-sm"></span></div>
            </strong>
        </div>

        <!-- 2. TRANSAKSI HARI INI -->
        <div class="summary-card">
            <div class="summary-card-header">
                <span class="summary-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </span>
                <span class="summary-title">Transaksi Hari Ini</span>
            </div>
            <strong class="summary-value" id="dashTransaksiHariIni">
                <div class="summary-loading-pill"><span class="dashboard-spinner spinner-sm"></span></div>
            </strong>
        </div>

        <!-- 3. PEMASUKAN HARI INI -->
        <div class="summary-card">
            <div class="summary-card-header">
                <span class="summary-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                </span>
                <span class="summary-title">Pemasukkan Hari Ini</span>
            </div>
            <strong class="summary-value" id="dashPendapatanHariIni">
                <div class="summary-loading-pill"><span class="dashboard-spinner spinner-sm"></span></div>
            </strong>
        </div>

        <!-- 4. LABA KOTOR HARI INI -->
        <div class="summary-card">
            <div class="summary-card-header">
                <span class="summary-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                </span>
                <span class="summary-title">Laba Kotor Hari Ini</span>
            </div>
            <strong class="summary-value" id="dashLabaKotorHariIni">
                <div class="summary-loading-pill"><span class="dashboard-spinner spinner-sm"></span></div>
            </strong>
        </div>

    </div>

    <!-- ======================================== -->
    <!-- BAGIAN: REKAP KEUANGAN -->
    <!-- ======================================== -->
    <section class="dashboard-section rekap-pemasukan rekap-card">
        <div class="rekap-header">
            <h2>Rekap Keuangan</h2>

            <div class="rekap-filter-area">
                <div class="periode-pemasukan" aria-label="Filter periode pemasukan">
                    <button type="button" class="periode-pemasukan-btn active" data-period="minggu" aria-pressed="true">Minggu Ini</button>
                    <button type="button" class="periode-pemasukan-btn" data-period="bulan" aria-pressed="false">Bulan Ini</button>
                    <button type="button" class="periode-pemasukan-btn" data-period="semua" aria-pressed="false">Semua</button>
                </div>
            </div>
        </div>

        <!-- LOADING STATE REKAP KEUANGAN (FIGMA IMAGE) -->
        <div class="dashboard-loading-box box-sm" id="rekapKeuanganLoading">
            <span class="dashboard-spinner spinner-inline"></span>
            <span>Memuat data keuangan...</span>
        </div>

        <div class="financial-metrics rekap-metrics" id="rekapKeuanganMetrics" style="display: none;">
            <div class="metric-item metric-pemasukan">
                <span class="metric-label">Pemasukkan</span>
                <strong class="metric-val" id="totalPemasukan">Rp0</strong>
            </div>
            <div class="metric-item">
                <span class="metric-label">HPP</span>
                <strong class="metric-val" id="totalHpp">Rp0</strong>
            </div>
            <div class="metric-item">
                <span class="metric-label">Laba Kotor</span>
                <strong class="metric-val" id="totalLabaKotor">Rp0</strong>
            </div>
            <div class="metric-item">
                <span class="metric-label">Biaya Operasional</span>
                <strong class="metric-val" id="totalBiayaOperasional">Rp0</strong>
            </div>
            <div class="metric-item">
                <span class="metric-label">Laba Bersih</span>
                <strong class="metric-val" id="totalLabaBersih">Rp0</strong>
            </div>
        </div>
    </section>

    <!-- ======================================== -->
    <!-- BAGIAN: PEMASUKAN PER BARBER -->
    <!-- ======================================== -->
    <section class="dashboard-section rekap-barber-section">
        <h2 class="dashboard-card-title">Pemasukan per Barber</h2>

        <div class="table-responsive rekap-barber-table" id="tabelPemasukanWrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="th-barber-nama">Nama Barber</th>
                        <th class="th-barber-trx">Transaksi</th>
                        <th class="th-barber-total">Total Pemasukan</th>
                    </tr>
                </thead>
                <tbody id="tabelPemasukanBody">
                    <tr>
                        <td colspan="3" class="td-barber-loading">
                            <div class="barber-loading-wrap">
                                <span class="dashboard-spinner spinner-inline"></span>
                                <span>Memuat data barber...</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <!-- ======================================== -->
    <!-- BAGIAN: GRAFIK TREN PEMASUKAN & DISTRIBUSI -->
    <!-- ======================================== -->
    <div class="dashboard-chart-grid-single">
        <!-- TREN PEMASUKAN (LEBAR PENUH SESUAI FIGMA) -->
        <section class="dashboard-section dashboard-chart-card">
            <div class="trend-chart-header">
                <div>
                    <h2 class="dashboard-card-title" id="trenPemasukanJudul">Tren Pemasukkan</h2>
                    <span class="trend-card-subtitle" id="trenPemasukanSubtitle">Pemasukan per hari</span>
                </div>
                <!-- FILTER PILL TREN (FIGMA) -->
                <div class="trend-period-pill-group" role="group" aria-label="Periode tren pemasukan">
                    <button type="button" class="trend-pill-btn active" data-period="7_hari">7 Hari Terakhir</button>
                    <button type="button" class="trend-pill-btn" data-period="minggu">Per Minggu</button>
                    <button type="button" class="trend-pill-btn" data-period="bulan">Per Bulan</button>
                </div>
                <!-- Sembunyikan select lama agar kompatibilitas kode tetap terjaga -->
                <select id="trenPemasukanPeriode" class="form-select trend-period-select visually-hidden" aria-hidden="true">
                    <option value="7_hari" selected>7 Hari Terakhir</option>
                    <option value="minggu">Per Minggu</option>
                    <option value="bulan">Per Bulan</option>
                </select>
            </div>

            <!-- LOADING STATE TREN (FIGMA IMAGE) -->
            <div class="dashboard-loading-box box-tren" id="trenLoadingState">
                <div class="dashboard-spinner spinner-lg"></div>
                <span>Memuat data tren...</span>
            </div>

            <!-- KONTEN TREN (SUMMARY + CHART) -->
            <div id="trenContentWrap" style="display: none;">
                <!-- 3 KARTU SUMMARY TREN (FIGMA) -->
                <div class="trend-summary-grid">
                    <div class="trend-summary-card trend-summary-status-box" id="trenStatusCard">
                        <div class="trend-badge-icon" id="trenBadgeIcon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                        </div>
                        <div class="trend-badge-info">
                            <strong id="trenStatusRingkas">Stabil 0%</strong>
                            <small id="trenStatusSub">dibanding periode sebelumnya</small>
                        </div>
                    </div>
                    <div class="trend-summary-card trend-summary-neutral">
                        <span id="trenTotalLabel">Total 7 hari terakhir</span>
                        <strong id="trenTotalAktif">Rp0</strong>
                        <small id="trenTotalSebelumnya">sebelumnya Rp0</small>
                    </div>
                    <div class="trend-summary-card trend-summary-neutral">
                        <span>Hari tertinggi</span>
                        <strong id="trenHariTertinggi">Rp0</strong>
                        <small id="trenHariTertinggiTanggal">Belum ada data</small>
                    </div>
                </div>

                <!-- GRAFIK SVG LINE DENGAN TOOLTIP -->
                <div class="line-chart-container">
                    <div class="line-chart" id="dashboardLineChart" aria-label="Grafik tren pemasukan" aria-live="polite">
                        <div class="dashboard-empty-centered" id="trenEmptyState">Belum ada data untuk ditampilkan</div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- ======================================== -->
    <!-- BAGIAN: 2 KOLOM (LAYANAN TERLARIS & DISTRIBUSI PEMBAYARAN) -->
    <!-- ======================================== -->
    <div class="dashboard-bottom-grid">

        <!-- 1. LAYANAN TERLARIS -->
        <section class="dashboard-section menu-terlaris-section">
            <div class="layanan-terlaris-header">
                <h2 class="dashboard-card-title">Layanan Terlaris</h2>
                <div class="layanan-terlaris-controls">
                    <button type="button" class="layanan-period-btn active" data-period="minggu">Minggu Ini</button>
                    <button type="button" class="layanan-period-btn" data-period="bulan">Bulan Ini</button>
                    <button type="button" class="layanan-period-btn" data-period="semua">Semua</button>
                </div>
            </div>

            <!-- SUBHEADER SORTING -->
            <div class="layanan-sort-bar">
                <span class="layanan-sort-label">Urutkan</span>
                <div class="layanan-sort-buttons">
                    <button type="button" class="layanan-sort-btn active" data-sort="terbanyak">Paling Sering</button>
                    <button type="button" class="layanan-sort-btn" data-sort="tersedikit">Paling Jarang</button>
                </div>
            </div>

            <!-- HEADER TABEL MINI LAYANAN -->
            <div class="layanan-table-head" id="layananTableHead">
                <span class="col-head-no">No</span>
                <span class="col-head-nama">Layanan</span>
                <span class="col-head-qty">Jumlah Terjual</span>
            </div>

            <!-- LIST LAYANAN POPULER -->
            <div id="layananPopulerListContainer" class="layanan-populer-container">
                <div class="dashboard-loading-box box-layanan">
                    <div class="dashboard-spinner spinner-lg"></div>
                    <span>Memuat data layanan...</span>
                </div>
            </div>

            <!-- FOOTER INFO LAYANAN -->
            <div class="layanan-terlaris-footer" id="layananTerlarisFooter">
                <span class="layanan-footer-total" id="layananTotalTerjual">Total layanan terjual: -</span>
                <a href="/KELOMPOK-5/pages/laporan.php" class="layanan-footer-link">Rincian per barber ada di Laporan</a>
            </div>
        </section>

        <!-- 2. DISTRIBUSI PEMBAYARAN -->
        <section class="dashboard-section payment-chart-card">
            <div class="payment-card-header">
                <h2 class="dashboard-card-title">Distribusi Pembayaran</h2>
                <span class="payment-card-subtitle">Berdasarkan metode, periode terpilih</span>
            </div>

            <!-- LOADING STATE DISTRIBUSI (FIGMA IMAGE) -->
            <div class="dashboard-loading-box box-pembayaran" id="paymentLoadingState" style="display: flex;">
                <div class="dashboard-spinner spinner-lg"></div>
                <span>Memuat data pembayaran...</span>
            </div>

            <!-- EMPTY STATE DISTRIBUSI (FIGMA IMAGE 1) -->
            <div class="dashboard-empty-centered" id="paymentEmptyState" style="display: none;">
                Belum ada transaksi periode ini
            </div>

            <div class="payment-chart-content" id="paymentChartContent" style="display: none;">
                <!-- DONUT CHART DENGAN CENTER TEXT -->
                <div class="payment-donut-wrap">
                    <div class="payment-donut" id="dashboardPaymentDonut" role="img" aria-label="Diagram donat distribusi pembayaran">
                        <div class="payment-donut-center">
                            <strong id="dashboardJumlahTransaksi">0</strong>
                            <span>transaksi</span>
                        </div>
                    </div>
                </div>

                <!-- LEGEND METODE PEMBAYARAN (2 KOLOM SESUAI FIGMA) -->
                <div class="payment-legend-grid">
                    <div class="payment-legend-item">
                        <span class="legend-dot legend-cash"></span>
                        <span class="legend-text">Tunai (<span id="legendCashTrx">0</span> Trx)</span>
                        <strong id="legendCashNominal">Rp0</strong>
                    </div>
                    <div class="payment-legend-item">
                        <span class="legend-dot legend-qris"></span>
                        <span class="legend-text">QRIS (<span id="legendQrisTrx">0</span> Trx)</span>
                        <strong id="legendQrisNominal">Rp0</strong>
                    </div>
                    <div class="payment-legend-item">
                        <span class="legend-dot legend-transfer"></span>
                        <span class="legend-text">Transfer (<span id="legendTransferTrx">0</span> Trx)</span>
                        <strong id="legendTransferNominal">Rp0</strong>
                    </div>
                </div>

                <!-- Fallback elemen untuk kompatibilitas skrip lama -->
                <div class="d-none" aria-hidden="true">
                    <span id="legendCash"></span>
                    <span id="legendTransfer"></span>
                    <span id="legendQris"></span>
                    <span id="trenPemasukanIndicator"></span>
                </div>
            </div>
        </section>
    </div>

    <!-- ======================================== -->
    <!-- BAGIAN: PERMINTAAN RESET PASSWORD (LEBAR PENUH) -->
    <!-- ======================================== -->
    <section class="dashboard-section reset-section-full" id="resetPasswordSection">
        <h2 class="reset-card-title">Permintaan Reset Password</h2>

        <!-- LOADING STATE RESET (FIGMA IMAGE) -->
        <div class="dashboard-loading-box box-sm" id="resetLoadingState" style="display: flex;">
            <span class="dashboard-spinner spinner-inline"></span>
            <span>Memuat data permintaan...</span>
        </div>

        <!-- Tampilan Saat Kosong (Sesuai Desain Figma) -->
        <div class="reset-empty-wrap" id="resetEmptyWrap" style="display: none;">
            <div class="reset-card-divider" id="resetCardDivider"></div>
            <div class="reset-empty-state" id="resetEmptyState">
                Belum ada permintaan password
            </div>
        </div>

        <!-- Tampilan Saat Ada Permintaan -->
        <div class="reset-card-body" id="resetCardBody" style="display: none;">
            <div class="reset-user-info">
                <span class="reset-user-name" id="resetUserName">Erik</span>
            </div>
            <button type="button" class="btn-reset-password" id="btnActionResetPassword">
                Reset Password
            </button>
        </div>
    </section>

</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
