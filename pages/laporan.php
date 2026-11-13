<?php
// ==============================================================================
// [Card 6.7] Halaman Laporan & Ekspor Laporan Bulanan ke PDF (Kataji Barber)
// User Story: Sebagai owner, saya ingin mengekspor laporan pemasukan dan pengeluaran
// ke dalam file PDF, sehingga saya memiliki laporan keuangan periodik yang dapat
// disimpan dan dibagikan.
// MoSCoW: Should | Story Point: 5 | WBS: 6.7 | Sprint 4 | Role: Frontend Developer (Faqih)
// ==============================================================================

require_once __DIR__ . '/../includes/auth_check.php';

// [Card 6.7] Pembatasan Akses: Hanya role 'owner' yang diizinkan mengakses halaman laporan
require_role(['owner']);

$nama = $_SESSION['nama'] ?? '';
?>

<?php include __DIR__ . '/../includes/header.php'; ?>

<!-- [Card 6.7] Kontainer Utama Halaman Laporan -->
<div class="laporan-page" data-card-label="6.7">

    <!-- [Card 6.7] Header Judul Halaman Sesuai Desain Figma -->
    <div class="laporan-header-row">
        <h1 class="laporan-title">Laporan</h1>
        <p class="laporan-subtitle">Rekap pemasukan dan pengeluaran bulanan barbershop.</p>
    </div>

    <!-- [Card 6.7] =============================================================
         1. KARTU EKSPOR LAPORAN (Pemilih Bulan, Rentang Tanggal WIB, & Tombol Ekspor PDF)
    ============================================================================= -->
    <section class="laporan-card laporan-ekspor-card" aria-label="Ekspor Laporan">
        <div class="laporan-ekspor-header">
            <h2 class="laporan-card-title">Ekspor Laporan</h2>
            <p class="laporan-card-subtitle">Pilih bulan untuk melihat rekapnya, lalu unduh sebagai PDF.</p>
        </div>

        <div class="laporan-ekspor-body">
            <div class="laporan-ekspor-controls">
                <!-- [Card 6.7] Pemilih Bulan Periode Laporan (Bawaan Bulan Berjalan) -->
                <div class="laporan-picker-col">
                    <label for="laporanBulanInput" class="laporan-form-label">Periode laporan</label>
                    <div class="laporan-picker-box" id="laporanPickerBox" title="Klik untuk memilih bulan">
                        <span class="laporan-picker-display" id="laporanBulanDisplay">Memuat periode...</span>
                        <svg class="laporan-picker-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <input
                            type="month"
                            id="laporanBulanInput"
                            class="laporan-picker-native"
                            aria-label="Pilih bulan periode laporan"
                        >
                    </div>
                    <!-- [Card 6.7] Teks Rentang Tanggal Sesuai Zona Waktu WIB (00.00 - 23.59) -->
                    <p class="laporan-rentang-text" id="laporanRentangText"></p>
                </div>

                <!-- [Card 6.7] Tombol Ekspor PDF dengan Indikator Loading & Pencegahan Double-Click -->
                <div class="laporan-action-col">
                    <button
                        type="button"
                        class="btn-ekspor-pdf"
                        id="btnEksporPdf"
                        aria-label="Ekspor laporan bulanan ke file PDF"
                    >
                        <svg class="btn-ekspor-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span class="btn-ekspor-text" id="btnEksporText">Ekspor PDF</span>
                    </button>
                </div>
            </div>

            <!-- [Card 6.7] Alert Feedback Respons BE (Pesan: "Belum ada data...", "Laporan gagal dibuat...", dsb) -->
            <div id="laporanFeedback" class="laporan-feedback-alert" role="alert" style="display: none;"></div>
        </div>
    </section>

    <!-- [Card 6.7] =============================================================
         2. TIGA KARTU RINGKASAN KEUANGAN (Total Pemasukan, Total Pengeluaran, Saldo Bersih)
    ============================================================================= -->
    <div class="laporan-summary-grid">
        <!-- 1. Total Pemasukan -->
        <div class="laporan-card laporan-summary-card">
            <div class="laporan-summary-label">Total Pemasukan</div>
            <div class="laporan-summary-nominal" id="summaryTotalPemasukan">Rp0</div>
            <div class="laporan-summary-subtext" id="summaryTransPemasukan">0 transaksi</div>
        </div>

        <!-- 2. Total Pengeluaran -->
        <div class="laporan-card laporan-summary-card">
            <div class="laporan-summary-label">Total Pengeluaran</div>
            <div class="laporan-summary-nominal" id="summaryTotalPengeluaran">Rp0</div>
            <div class="laporan-summary-subtext" id="summaryCountPengeluaran">0 pengeluaran</div>
        </div>

        <!-- 3. Saldo Bersih (Kartu Navy Sesuai Desain Figma) -->
        <div class="laporan-card laporan-summary-card laporan-card-navy">
            <div class="laporan-summary-label">Saldo Bersih</div>
            <div class="laporan-summary-nominal" id="summarySaldoBersih">Rp0</div>
            <div class="laporan-summary-subtext">Pemasukan dikurangi pengeluaran</div>
        </div>
    </div>

    <!-- [Card 6.7] =============================================================
         3. TABEL DETAIL REKAP BULANAN (Tab Switcher: Pemasukan & Pengeluaran)
    ============================================================================= -->
    <section class="laporan-card laporan-table-card" aria-label="Tabel Rekap Bulanan">
        <div class="laporan-table-header-row">
            <!-- Tab Group: Pemasukan / Pengeluaran -->
            <div class="laporan-tab-group" role="tablist">
                <button
                    type="button"
                    class="laporan-tab-btn active"
                    id="tabBtnPemasukan"
                    role="tab"
                    aria-selected="true"
                >
                    Pemasukan
                </button>
                <button
                    type="button"
                    class="laporan-tab-btn"
                    id="tabBtnPengeluaran"
                    role="tab"
                    aria-selected="false"
                >
                    Pengeluaran
                </button>
            </div>

            <!-- Form Pencarian di Tabel -->
            <div class="laporan-search-wrap">
                <svg class="laporan-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    id="laporanCariInput"
                    class="laporan-search-input"
                    placeholder="Cari di rekap..."
                    autocomplete="off"
                    aria-label="Cari di rekap"
                >
            </div>
        </div>

        <!-- Tabel Kontainer Responsif -->
        <div class="laporan-table-responsive">
            <table class="laporan-data-table" id="laporanTable">
                <thead id="laporanTableHead">
                    <!-- Header kolom diisi secara dinamis oleh JavaScript sesuai tab aktif -->
                </thead>
                <tbody id="laporanTableBody">
                    <tr>
                        <td colspan="8" class="laporan-loading-cell">
                            <span class="laporan-loading-state" role="status" aria-live="polite">
                                <span class="laporan-spinner" aria-hidden="true"></span>
                                Memuat data rekap...
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination Bar -->
        <div class="laporan-pagination-bar" id="laporanPaginationBar">
            <div class="laporan-pagination-info" id="laporanPaginationInfo">
                Menampilkan 0 data
            </div>
            <div class="laporan-pagination-controls" id="laporanPaginationControls">
                <!-- Kontrol navigasi halaman diisi dinamis -->
            </div>
            <div class="laporan-per-page-wrap">
                <span class="laporan-per-page-label">Per halaman</span>
                <select id="laporanPerPage" class="laporan-per-page-select" aria-label="Jumlah baris per halaman">
                    <option value="10" selected>10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
            </div>
        </div>
    </section>

    
<!-- [Card 6.7] Dialog konfirmasi ekspor laporan sesuai Figma -->
<div class="laporan-modal-overlay" id="laporanExportModal" hidden>
    <section class="laporan-modal laporan-export-dialog" role="dialog" aria-modal="true" aria-labelledby="laporanExportTitle">
        <button type="button" class="laporan-modal-close" data-close-export aria-label="Tutup dialog">&times;</button>
        <h2 class="laporan-modal-title" id="laporanExportTitle">Ekspor laporan?</h2>
        <p class="laporan-modal-description" id="laporanExportDescription">Laporan bulanan akan diunduh dalam format PDF.</p>

        <!-- [Card 6.7] Alert Error Saat Ekspor Gagal (Figma Image 6) -->
        <div class="laporan-dialog-error" id="laporanExportError" role="alert" hidden>
            <svg class="laporan-dialog-error-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span id="laporanExportErrorText">Laporan gagal dibuat. Silakan coba lagi</span>
        </div>

        <div class="laporan-export-details">
            <div><span>Periode</span><strong id="laporanExportMonth"></strong></div>
            <div><span>Rentang waktu</span><strong id="laporanExportRange"></strong></div>
            <div><span>Format</span><strong>PDF</strong></div>
        </div>

        <div class="laporan-modal-actions">
            <button type="button" class="laporan-button laporan-button-secondary" data-close-export>Batal</button>
            <button type="button" class="laporan-button laporan-button-outline" id="btnLaporanPreview">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Preview
            </button>
            <button type="button" class="laporan-button laporan-button-primary" id="btnDialogEkspor">
                <span id="btnDialogEksporIcon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </span>
                <span id="btnDialogEksporText">Ekspor PDF</span>
            </button>
        </div>
    </section>
</div>

<!-- [Card 6.7] Dialog pratinjau laporan sesuai Figma -->
<div class="laporan-modal-overlay laporan-preview-overlay" id="laporanPreviewModal" hidden>
    <section class="laporan-modal laporan-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="laporanPreviewTitle">
        <div class="laporan-preview-heading">
            <div>
                <h2 class="laporan-modal-title" id="laporanPreviewTitle">Pratinjau Laporan</h2>
                <p class="laporan-preview-period" id="laporanPreviewPeriod">Periode Oktober 2026. Tampilan ini sama dengan file PDF yang akan diunduh.</p>
            </div>
            <button type="button" class="laporan-modal-close" data-close-preview aria-label="Tutup pratinjau">&times;</button>
        </div>

        <div class="laporan-preview-content">
            <div class="laporan-preview-loading" id="laporanPreviewLoading" role="status" aria-live="polite">
                <div class="dashboard-spinner spinner-lg"></div>
                <span>Memuat pratinjau laporan...</span>
            </div>
            <!-- [Card 6.7] Error State Pratinjau (Figma Image 7) -->
            <div class="laporan-preview-error" id="laporanPreviewError" hidden>
                <div class="laporan-preview-error-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <p id="laporanPreviewErrorMessage">Pratinjau gagal dimuat. Silakan coba lagi</p>
                <button type="button" class="laporan-button laporan-button-outline" id="btnPreviewRetry">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                    </svg>
                    Coba Lagi
                </button>
            </div>
            <iframe class="laporan-preview-frame" id="laporanPreviewFrame" title="Pratinjau laporan PDF" hidden></iframe>
        </div>

        <!-- [Card 6.7] Footer Pratinjau dengan Informasi Halaman Sesuai Figma (Image 5) -->
        <div class="laporan-modal-actions laporan-preview-actions">
            <span class="laporan-preview-page-info">Halaman 1 dari 1</span>
            <div class="laporan-preview-buttons">
                <button type="button" class="laporan-button laporan-button-secondary" data-close-preview>Tutup</button>
                <button type="button" class="laporan-button laporan-button-primary" id="btnPreviewEkspor">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Ekspor PDF
                </button>
            </div>
        </div>
    </section>
</div>

<!-- [Card 6.7] Script Frontend Laporan dimuat melalui includes/footer.php -->

<?php include __DIR__ . '/../includes/footer.php'; ?>
