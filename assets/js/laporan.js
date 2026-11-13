/**
 * ==============================================================================
 * [Card 6.7] Script Frontend Laporan & Ekspor Laporan Keuangan ke PDF
 * WBS 6.7 | Sprint 4 | Role: Frontend Developer (Faqih)
 *
 * Fitur & Skenario:
 * 1. Pemilih bulan periode laporan (bawaan bulan berjalan) & rentang tanggal WIB.
 * 2. Tombol "Ekspor PDF" dengan indikator memuat dan pencegahan klik berulang.
 * 3. Unduh file PDF dari endpoint GET /api/rekap/laporan_pdf.php?bulan=YYYY-MM.
 * 4. Tampilkan pesan "Belum ada data pada periode ini" bila tidak ada transaksi & pengeluaran.
 * 5. Tampilkan pesan "Laporan gagal dibuat. Silakan coba lagi" bila terjadi kesalahan.
 * 6. Tiga kartu ringkasan KPI (Total Pemasukan, Total Pengeluaran, Saldo Bersih).
 * 7. Tabel detail rekap dengan tab Pemasukan & Pengeluaran, pencarian, dan paginasi.
 *
 * [Card 6.2] Bagian Layanan Terlaris (Sprint Berjalan tetap dipertahankan).
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {

    // ==========================================================================
    // [Card 6.7] 1. STATE & KONFIGURASI EKSPOR LAPORAN
    // ==========================================================================
    const API_LAPORAN_PDF = '/KELOMPOK-5/api/rekap/laporan_pdf.php';
    const API_REKAP_PEMASUKAN = '/KELOMPOK-5/api/rekap/pemasukan.php';
    const API_PENGELUARAN = '/KELOMPOK-5/api/pengeluaran/index.php';
    const API_TRANSAKSI = '/KELOMPOK-5/api/transaksi/index.php';

    // Elemen Kontrol Ekspor Laporan
    const bulanInput = document.getElementById('laporanBulanInput');
    const bulanDisplay = document.getElementById('laporanBulanDisplay');
    const rentangText = document.getElementById('laporanRentangText');
    const btnEkspor = document.getElementById('btnEksporPdf');
    const btnEksporText = document.getElementById('btnEksporText');
    const feedbackAlert = document.getElementById('laporanFeedback');
    const exportModal = document.getElementById('laporanExportModal');
    const exportMonth = document.getElementById('laporanExportMonth');
    const exportRange = document.getElementById('laporanExportRange');
    const exportError = document.getElementById('laporanExportError');
    const btnDialogEkspor = document.getElementById('btnDialogEkspor');
    const btnDialogEksporIcon = document.getElementById('btnDialogEksporIcon');
    const btnDialogEksporText = document.getElementById('btnDialogEksporText');
    const btnPreview = document.getElementById('btnLaporanPreview');
    const previewModal = document.getElementById('laporanPreviewModal');
    const previewPeriod = document.getElementById('laporanPreviewPeriod');
    const previewLoading = document.getElementById('laporanPreviewLoading');
    const previewError = document.getElementById('laporanPreviewError');
    const previewErrorMessage = document.getElementById('laporanPreviewErrorMessage');
    const previewFrame = document.getElementById('laporanPreviewFrame');
    const btnPreviewRetry = document.getElementById('btnPreviewRetry');
    const btnPreviewEkspor = document.getElementById('btnPreviewEkspor');

    // Elemen Ringkasan KPI
    const elSummaryTotalPemasukan = document.getElementById('summaryTotalPemasukan');
    const elSummaryTransPemasukan = document.getElementById('summaryTransPemasukan');
    const elSummaryTotalPengeluaran = document.getElementById('summaryTotalPengeluaran');
    const elSummaryCountPengeluaran = document.getElementById('summaryCountPengeluaran');
    const elSummarySaldoBersih = document.getElementById('summarySaldoBersih');

    // Elemen Tabel & Tab
    const tabBtnPemasukan = document.getElementById('tabBtnPemasukan');
    const tabBtnPengeluaran = document.getElementById('tabBtnPengeluaran');
    const inputCari = document.getElementById('laporanCariInput');
    const tableHead = document.getElementById('laporanTableHead');
    const tableBody = document.getElementById('laporanTableBody');
    const paginationInfo = document.getElementById('laporanPaginationInfo');
    const paginationControls = document.getElementById('laporanPaginationControls');
    const selectPerPage = document.getElementById('laporanPerPage');

    // State Halaman
    let bulanTerpilih = ''; // format: "YYYY-MM"
    let isExporting = false;
    let exportCanRetry = false;
    let previewObjectUrl = '';
    let returnToExportDialog = false;
    let tabAktif = 'pemasukan'; // 'pemasukan' | 'pengeluaran'
    let keywordPencarian = '';
    let halamanAktif = 1;
    let barisPerHalaman = 10;
    let rekapRequestId = 0;

    // Cache Data Rekap Bulanan
    let rawPemasukanList = [];
    let rawPengeluaranList = [];

    const namaBulanIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const namaBulanSingkat = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    // ==========================================================================
    // [Card 6.7] 2. HELPER & FORMATTER
    // ==========================================================================

    function escapeHtml(teks) {
        if (!teks) return '';
        const div = document.createElement('div');
        div.textContent = String(teks);
        return div.innerHTML;
    }

    function formatRupiah(angka) {
        const nominal = Number(angka) || 0;
        const isNegatif = nominal < 0;
        const absVal = Math.abs(nominal);
        const formatted = absVal.toLocaleString('id-ID');
        return isNegatif ? `-Rp${formatted}` : `Rp${formatted}`;
    }

    /**
     * Konversi YYYY-MM ke nama bulan dan tahun Indonesia (contoh: "Oktober 2026")
     */
    function formatBulanNama(bulanStr) {
        if (!bulanStr || !bulanStr.includes('-')) return bulanStr || '';
        const [tahun, bln] = bulanStr.split('-');
        const idx = parseInt(bln, 10) - 1;
        const nama = namaBulanIndo[idx] || bln;
        return `${nama} ${tahun}`;
    }

    function bulanWIBSekarang() {
        const parts = new Intl.DateTimeFormat('en', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit'
        }).formatToParts(new Date());
        const tahun = parts.find(part => part.type === 'year')?.value;
        const bulan = parts.find(part => part.type === 'month')?.value;
        return `${tahun}-${bulan}`;
    }

    function bulanValid(bulanStr) {
        return typeof bulanStr === 'string'
            && /^(\d{4})-(0[1-9]|1[0-2])$/.test(bulanStr);
    }

    /**
     * Menghitung tanggal terakhir suatu bulan dan menyusun teks rentang WIB:
     * "1 Oktober 2026 00.00 – 31 Oktober 2026 23.59 WIB"
     */
    function hitungRentangWIB(bulanStr) {
        if (!bulanStr || !bulanStr.includes('-')) return '-';
        const [tahunStr, blnStr] = bulanStr.split('-');
        const tahun = parseInt(tahunStr, 10);
        const bln = parseInt(blnStr, 10);
        const namaBulan = namaBulanIndo[bln - 1] || blnStr;
        const tglAkhir = new Date(tahun, bln, 0).getDate();
        return `1 ${namaBulan} ${tahun} 00.00 – ${tglAkhir} ${namaBulan} ${tahun} 23.59 WIB`;
    }

    /**
     * Format rentang waktu khusus untuk Modal Konfirmasi Ekspor Sesuai Desain Figma (Image 4):
     * "1 Okt 2026 00:00 – 31 Okt 2026 23:59 WIB"
     */
    function formatRentangModal(bulanStr) {
        if (!bulanStr || !bulanStr.includes('-')) return '-';
        const [tahunStr, blnStr] = bulanStr.split('-');
        const tahun = parseInt(tahunStr, 10);
        const bln = parseInt(blnStr, 10);
        const singkat = namaBulanSingkat[bln - 1] || blnStr;
        const tglAkhir = new Date(tahun, bln, 0).getDate();
        return `1 ${singkat} ${tahun} 00:00 – ${tglAkhir} ${singkat} ${tahun} 23:59 WIB`;
    }

    /**
     * Menampilkan pesan notifikasi/feedback (Alert) respons BE
     * @param {'warning' | 'danger' | 'success' | 'info'} tipe
     * @param {string} pesan
     */
    function showFeedback(tipe, pesan) {
        if (!feedbackAlert) return;
        feedbackAlert.className = `laporan-feedback-alert alert-${tipe}`;

        let iconSvg = '';
        if (tipe === 'warning') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        } else if (tipe === 'danger') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else if (tipe === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        }

        feedbackAlert.innerHTML = `${iconSvg} <span>${escapeHtml(pesan)}</span>`;
        feedbackAlert.style.display = 'flex';
    }

    function hideFeedback() {
        if (feedbackAlert) {
            feedbackAlert.style.display = 'none';
            feedbackAlert.innerHTML = '';
        }
    }

    // ==========================================================================
    // [Card 6.7] 3. INISIALISASI PEMILIH BULAN & LOGIKA EKSPOR PDF
    // ==========================================================================

    function initEksporLaporan() {
        if (!bulanInput || !btnEkspor) return;

        // Ambil bulan dari parameter URL (?bulan=YYYY-MM) atau bawaan bulan berjalan (WIB)
        const urlParams = new URLSearchParams(window.location.search);
        const bulanUrl = urlParams.get('bulan');

        const bulanIni = bulanWIBSekarang();
        const defaultBulan = (bulanValid(bulanUrl) && bulanUrl <= bulanIni)
            ? bulanUrl
            : bulanIni;

        bulanInput.max = bulanIni;
        setBulanAktif(defaultBulan);

        // [Card 6.7] Pemicu Klik Pemilih Bulan Native (Mendukung showPicker & focus)
        const pickerBox = document.getElementById('laporanPickerBox');
        if (pickerBox && bulanInput) {
            pickerBox.addEventListener('click', function (e) {
                if (typeof bulanInput.showPicker === 'function') {
                    try {
                        bulanInput.showPicker();
                    } catch (err) {
                        bulanInput.focus();
                    }
                } else {
                    bulanInput.focus();
                }
            });
        }

        // [Card 6.7] Event listener saat input bulan diganti (change & input)
        function handleBulanChange() {
            if (!bulanValid(bulanInput.value) || bulanInput.value > bulanWIBSekarang()) {
                bulanInput.value = bulanTerpilih;
                showFeedback('warning', 'Pilih bulan laporan yang valid dan tidak melewati bulan berjalan.');
                return;
            }

            if (bulanInput.value === bulanTerpilih) return;
            setBulanAktif(bulanInput.value);
            hideFeedback();
            halamanAktif = 1;
            muatRekapBulanan(bulanInput.value);
        }

        bulanInput.addEventListener('change', handleBulanChange);
        bulanInput.addEventListener('input', handleBulanChange);

        // Tombol utama membuka konfirmasi ekspor terlebih dahulu.
        btnEkspor.addEventListener('click', function (e) {
            e.preventDefault();
            bukaDialogEkspor();
        });

        btnDialogEkspor?.addEventListener('click', unduhLaporanPdf);
        btnPreview?.addEventListener('click', bukaPratinjauPdf);
        btnPreviewRetry?.addEventListener('click', bukaPratinjauPdf);
        btnPreviewEkspor?.addEventListener('click', async function () {
            tutupDialogPratinjau(false);
            await unduhLaporanPdf();
        });

        exportModal?.querySelectorAll('[data-close-export]').forEach(button => {
            button.addEventListener('click', tutupDialogEkspor);
        });
        previewModal?.querySelectorAll('[data-close-preview]').forEach(button => {
            button.addEventListener('click', () => tutupDialogPratinjau(true));
        });

        [exportModal, previewModal].forEach(modal => {
            modal?.addEventListener('click', event => {
                if (event.target !== modal || isExporting) return;
                if (modal === exportModal) tutupDialogEkspor();
                else tutupDialogPratinjau(true);
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || isExporting) return;
            if (previewModal && !previewModal.hidden) {
                tutupDialogPratinjau(true);
            } else if (exportModal && !exportModal.hidden) {
                tutupDialogEkspor();
            }
        });
    }

    function setBulanAktif(bulanStr) {
        bulanTerpilih = bulanStr;
        if (bulanInput) bulanInput.value = bulanStr;
        if (bulanDisplay) bulanDisplay.textContent = formatBulanNama(bulanStr);
        if (rentangText) rentangText.textContent = hitungRentangWIB(bulanStr);
    }

    function bukaDialogEkspor() {
        if (!bulanTerpilih || !exportModal) return;
        hideFeedback();
        clearExportError();
        exportMonth.textContent = formatBulanNama(bulanTerpilih);
        exportRange.textContent = formatRentangModal(bulanTerpilih);
        const descEl = document.getElementById('laporanExportDescription');
        if (descEl) {
            descEl.textContent = `Laporan ${formatBulanNama(bulanTerpilih)} akan diunduh dalam format PDF.`;
        }
        exportModal.hidden = false;
        exportModal.classList.add('is-open');
        btnDialogEkspor?.focus();
    }

    function tutupDialogEkspor() {
        if (!exportModal || isExporting) return;
        exportModal.classList.remove('is-open');
        exportModal.hidden = true;
        btnEkspor?.focus();
    }

    function bukaDialogPratinjau() {
        if (!previewModal) return;
        returnToExportDialog = true;
        exportModal?.classList.remove('is-open');
        if (exportModal) exportModal.hidden = true;
        previewPeriod.textContent = `Periode ${formatBulanNama(bulanTerpilih)}. Tampilan ini sama dengan file PDF yang akan diunduh.`;
        previewModal.hidden = false;
        previewModal.classList.add('is-open');
        resetPratinjau();
    }

    function tutupDialogPratinjau(kembaliKeEkspor) {
        if (!previewModal || isExporting) return;
        previewModal.classList.remove('is-open');
        previewModal.hidden = true;
        previewFrame.src = 'about:blank';
        previewFrame.hidden = true;
        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = '';
        }
        if (kembaliKeEkspor && returnToExportDialog) {
            bukaDialogEkspor();
        } else {
            btnEkspor?.focus();
        }
    }

    function clearExportError() {
        exportCanRetry = false;
        if (exportError) {
            exportError.hidden = true;
        }
        if (btnDialogEksporText) btnDialogEksporText.textContent = 'Ekspor PDF';
        if (btnDialogEksporIcon) {
            btnDialogEksporIcon.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            `;
        }
    }

    function resetPratinjau() {
        previewLoading.hidden = false;
        previewError.hidden = true;
        previewFrame.hidden = true;
        previewErrorMessage.textContent = 'Pratinjau gagal dimuat. Silakan coba lagi';
        const dialog = previewModal?.querySelector('.laporan-preview-dialog');
        if (dialog) dialog.classList.remove('has-pdf');
    }

    function setProcessing(processing, action) {
        isExporting = processing;
        if (btnEkspor) btnEkspor.disabled = processing;
        if (btnDialogEkspor) btnDialogEkspor.disabled = processing;
        if (btnPreview) btnPreview.disabled = processing;
        if (btnPreviewRetry) btnPreviewRetry.disabled = processing;
        if (btnPreviewEkspor) btnPreviewEkspor.disabled = processing;
        exportModal?.querySelectorAll('[data-close-export]').forEach(button => {
            button.disabled = processing;
        });
        previewModal?.querySelectorAll('[data-close-preview]').forEach(button => {
            button.disabled = processing;
        });

        if (btnEksporText) {
            btnEksporText.innerHTML = processing && action === 'download'
                ? '<span class="dashboard-spinner spinner-inline spinner-white" aria-hidden="true"></span> Membuat laporan...'
                : 'Ekspor PDF';
        }
        if (btnDialogEksporText) {
            btnDialogEksporText.innerHTML = processing && action === 'download'
                ? '<span class="dashboard-spinner spinner-inline spinner-white" aria-hidden="true"></span> Membuat laporan...'
                : (exportCanRetry ? 'Coba Lagi' : 'Ekspor PDF');
        }
        if (btnDialogEksporIcon) {
            if (processing && action === 'download') {
                btnDialogEksporIcon.innerHTML = '';
            } else if (exportCanRetry) {
                btnDialogEksporIcon.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                    </svg>
                `;
            } else {
                btnDialogEksporIcon.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                `;
            }
        }
        if (btnPreview) {
            btnPreview.innerHTML = processing && action === 'preview'
                ? '<span class="dashboard-spinner spinner-inline" aria-hidden="true"></span> Memuat...'
                : `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Preview
                `;
        }
    }

    async function ambilLaporanPdf(bulan) {
        const response = await fetch(`${API_LAPORAN_PDF}?bulan=${encodeURIComponent(bulan)}`, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'application/pdf, application/json' }
        });
        const contentType = response.headers.get('content-type') || '';

        if (response.ok && contentType.includes('application/pdf')) {
            return { blob: await response.blob() };
        }

        let result = null;
        if (contentType.includes('application/json')) {
            result = await response.json();
        }

        if (result?.data?.ada_data === false) {
            return { empty: true };
        }
        if (response.status === 500) {
            throw new Error('Laporan gagal dibuat. Silakan coba lagi');
        }
        if (response.status === 403) {
            throw new Error(result?.message || 'Anda tidak memiliki izin mengakses halaman ini');
        }
        if (!response.ok || !result?.success) {
            throw new Error(result?.message || 'Laporan gagal dibuat. Silakan coba lagi');
        }

        throw new Error('Laporan gagal dibuat. Silakan coba lagi');
    }

    function unduhBlobPdf(blob, bulan) {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `laporan-keuangan-${bulan}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }

    async function unduhLaporanPdf() {
        if (isExporting || !bulanTerpilih) return;
        setProcessing(true, 'download');
        clearExportError();
        hideFeedback();

        try {
            const hasil = await ambilLaporanPdf(bulanTerpilih);
            if (hasil.empty) {
                exportCanRetry = false;
                if (exportError) {
                    const errTextEl = document.getElementById('laporanExportErrorText');
                    if (errTextEl) errTextEl.textContent = 'Belum ada data pada periode ini';
                    exportError.hidden = false;
                }
                return;
            }

            unduhBlobPdf(hasil.blob, bulanTerpilih);
            if (exportModal && !exportModal.hidden) {
                exportModal.classList.remove('is-open');
                exportModal.hidden = true;
            }
            showFeedback('success', `Laporan keuangan periode ${formatBulanNama(bulanTerpilih)} berhasil diunduh.`);
        } catch (error) {
            console.error('[Card 6.7] Gagal mengekspor laporan PDF:', error);
            exportCanRetry = true;
            if (exportError) {
                const errTextEl = document.getElementById('laporanExportErrorText');
                if (errTextEl) errTextEl.textContent = error.message || 'Laporan gagal dibuat. Silakan coba lagi';
                exportError.hidden = false;
            }
            if (btnDialogEksporText) btnDialogEksporText.textContent = 'Coba Lagi';
            if (btnDialogEksporIcon) {
                btnDialogEksporIcon.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                    </svg>
                `;
            }
        } finally {
            setProcessing(false, 'download');
        }
    }

    async function bukaPratinjauPdf() {
        if (isExporting || !bulanTerpilih) return;
        if (!previewModal || previewModal.hidden) bukaDialogPratinjau();
        resetPratinjau();
        setProcessing(true, 'preview');

        try {
            const hasil = await ambilLaporanPdf(bulanTerpilih);
            if (hasil.empty) {
                throw new Error('Belum ada data pada periode ini');
            }

            previewObjectUrl = URL.createObjectURL(hasil.blob);
            previewFrame.src = previewObjectUrl;
            previewFrame.hidden = false;
            previewLoading.hidden = true;
            previewError.hidden = true;

            const dialog = previewModal?.querySelector('.laporan-preview-dialog');
            if (dialog) dialog.classList.add('has-pdf');
        } catch (error) {
            console.error('[Card 6.7] Gagal memuat pratinjau PDF:', error);
            previewErrorMessage.textContent = error.message === 'Belum ada data pada periode ini'
                ? error.message
                : 'Pratinjau gagal dimuat. Silakan coba lagi';
            previewError.hidden = false;
            previewLoading.hidden = true;
            previewFrame.hidden = true;

            const dialog = previewModal?.querySelector('.laporan-preview-dialog');
            if (dialog) dialog.classList.remove('has-pdf');
        } finally {
            setProcessing(false, 'preview');
        }
    }

    function setRekapLoading() {
        // [Card 6.7] Input Periode Laporan: animasi spinner di dalam box (Figma Image 9)
        const pickerBox = document.getElementById('laporanPickerBox');
        if (pickerBox) pickerBox.classList.add('is-loading');
        if (bulanDisplay) {
            bulanDisplay.innerHTML = '<span class="dashboard-spinner spinner-inline" aria-hidden="true"></span>';
        }

        // [Card 6.7] Tombol Ekspor PDF saat memuat/ganti bulan: "Membuat laporan..." (Figma Image 3 & 9)
        if (btnEkspor) {
            btnEkspor.disabled = true;
            btnEkspor.classList.add('is-loading');
            btnEkspor.innerHTML = `
                <span class="dashboard-spinner spinner-inline spinner-white" aria-hidden="true"></span>
                <span class="btn-ekspor-text" id="btnEksporText">Membuat laporan...</span>
            `;
        }

        // [Card 6.7] 3 Kartu Ringkasan KPI: Spinner di tengah nominal (Figma Image 9)
        if (elSummaryTotalPemasukan) {
            elSummaryTotalPemasukan.innerHTML = '<div class="dashboard-spinner spinner-md" aria-hidden="true"></div>';
        }
        if (elSummaryTransPemasukan) elSummaryTransPemasukan.textContent = '';

        if (elSummaryTotalPengeluaran) {
            elSummaryTotalPengeluaran.innerHTML = '<div class="dashboard-spinner spinner-md" aria-hidden="true"></div>';
        }
        if (elSummaryCountPengeluaran) elSummaryCountPengeluaran.textContent = '';

        if (elSummarySaldoBersih) {
            elSummarySaldoBersih.innerHTML = '<div class="dashboard-spinner spinner-md spinner-white" aria-hidden="true"></div>';
        }

        document.querySelectorAll('.laporan-summary-card').forEach(card => {
            card.setAttribute('aria-busy', 'true');
        });
        tableBody?.closest('.laporan-table-card')?.setAttribute('aria-busy', 'true');

        // [Card 6.7] Tabel Rekap: Spinner besar + teks memuat (Figma Image 9)
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="laporan-loading-cell">
                        <span class="laporan-loading-state" role="status" aria-live="polite">
                            <span class="dashboard-spinner spinner-lg" aria-hidden="true"></span>
                            Memuat data rekap...
                        </span>
                    </td>
                </tr>
            `;
        }
    }

    function stopRekapLoading() {
        const pickerBox = document.getElementById('laporanPickerBox');
        if (pickerBox) pickerBox.classList.remove('is-loading');
        if (bulanDisplay) bulanDisplay.textContent = formatBulanNama(bulanTerpilih);

        if (btnEkspor) {
            btnEkspor.disabled = false;
            btnEkspor.classList.remove('is-loading');
            btnEkspor.innerHTML = `
                <svg class="btn-ekspor-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span class="btn-ekspor-text" id="btnEksporText">Ekspor PDF</span>
            `;
        }
    }

    function setRekapError(message) {
        stopRekapLoading();
        [elSummaryTotalPemasukan, elSummaryTransPemasukan, elSummaryTotalPengeluaran, elSummaryCountPengeluaran, elSummarySaldoBersih]
            .forEach(element => {
                if (element) element.textContent = 'Gagal dimuat';
            });
        document.querySelectorAll('.laporan-summary-card').forEach(card => {
            card.setAttribute('aria-busy', 'false');
        });
        tableBody?.closest('.laporan-table-card')?.setAttribute('aria-busy', 'false');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-danger" role="alert">
                        ${escapeHtml(message)}
                    </td>
                </tr>
            `;
        }
        rawPemasukanList = [];
        rawPengeluaranList = [];
        updatePaginationUI(0, 0, 0);
    }

    async function fetchRekapJson(url) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        const result = await response.json();
        if (!response.ok || result.success !== true) {
            throw new Error(result.message || 'Gagal memuat data rekap.');
        }
        return result;
    }

    // ==========================================================================
    // [Card 6.7] 4. MEMUAT DATA KPI & TABEL DETAIL REKAP
    // ==========================================================================

    async function muatRekapBulanan(bulan) {
        if (!bulan) return;

        const requestId = ++rekapRequestId;
        const tanggalAwal = `${bulan}-01`;
        setRekapLoading();

        try {
            // Panggil API rekap pemasukan, pengeluaran, dan daftar transaksi secara paralel
            const [respPemasukan, respPengeluaran, respTransaksi] = await Promise.all([
                fetchRekapJson(`${API_REKAP_PEMASUKAN}?periode=bulan&tanggal=${tanggalAwal}`),
                fetchRekapJson(`${API_PENGELUARAN}?periode=bulan&tanggal=${tanggalAwal}`),
                fetchRekapJson(API_TRANSAKSI)
            ]);

            if (requestId !== rekapRequestId) return;

            // 1. Ekstrak Data Pemasukan
            const totalPemasukan = Number(respPemasukan.data?.total_pemasukan) || 0;
            const countTransaksi = Number(respPemasukan.data?.jumlah_transaksi) || 0;

            // 2. Ekstrak Data Pengeluaran
            const totalPengeluaran = Number(respPengeluaran.data?.total_pengeluaran) || 0;
            const countPengeluaran = Number(respPengeluaran.data?.jumlah_catatan) || 0;
            rawPengeluaranList = Array.isArray(respPengeluaran.data?.pengeluaran)
                ? respPengeluaran.data.pengeluaran
                : [];

            // 3. Hitung Saldo Bersih = Total Pemasukan - Total Pengeluaran (tanpa HPP)
            const saldoBersih = totalPemasukan - totalPengeluaran;

            // 4. Update 3 Kartu KPI
            if (elSummaryTotalPemasukan) elSummaryTotalPemasukan.textContent = formatRupiah(totalPemasukan);
            if (elSummaryTransPemasukan) elSummaryTransPemasukan.textContent = `${countTransaksi} transaksi`;

            if (elSummaryTotalPengeluaran) elSummaryTotalPengeluaran.textContent = formatRupiah(totalPengeluaran);
            if (elSummaryCountPengeluaran) elSummaryCountPengeluaran.textContent = `${countPengeluaran} pengeluaran`;

            if (elSummarySaldoBersih) elSummarySaldoBersih.textContent = formatRupiah(saldoBersih);
            document.querySelectorAll('.laporan-summary-card').forEach(card => {
                card.setAttribute('aria-busy', 'false');
            });
            tableBody?.closest('.laporan-table-card')?.setAttribute('aria-busy', 'false');

            // 5. Ekstrak Transaksi Bulanan untuk Tab Pemasukan
            rawPemasukanList = [];
            if (!Array.isArray(respTransaksi.data)) {
                throw new Error('Format data transaksi tidak valid.');
            }
            // Filter hanya transaksi yang berada di bulan terpilih dan belum dihapus
            rawPemasukanList = respTransaksi.data.filter(t => {
                const tgl = String(t.tanggal || '');
                return tgl.startsWith(bulan);
            });

            // 6. Render Tabel Rekap
            renderTabelRekap();

        } catch (error) {
            if (requestId !== rekapRequestId) return;
            console.error('[Card 6.7] Gagal memuat rekap bulanan:', error);
            setRekapError('Gagal memuat rekap data bulanan. Silakan coba lagi.');
        } finally {
            if (requestId === rekapRequestId) {
                stopRekapLoading();
            }
        }
    }

    // ==========================================================================
    // [Card 6.7] 5. LOGIKA TABEL REKAP & PAGINASI
    // ==========================================================================

    function initTabelControls() {
        if (tabBtnPemasukan) {
            tabBtnPemasukan.addEventListener('click', function () {
                if (tabAktif === 'pemasukan') return;
                tabAktif = 'pemasukan';
                tabBtnPemasukan.classList.add('active');
                tabBtnPemasukan.setAttribute('aria-selected', 'true');
                if (tabBtnPengeluaran) {
                    tabBtnPengeluaran.classList.remove('active');
                    tabBtnPengeluaran.setAttribute('aria-selected', 'false');
                }
                halamanAktif = 1;
                renderTabelRekap();
            });
        }

        if (tabBtnPengeluaran) {
            tabBtnPengeluaran.addEventListener('click', function () {
                if (tabAktif === 'pengeluaran') return;
                tabAktif = 'pengeluaran';
                tabBtnPengeluaran.classList.add('active');
                tabBtnPengeluaran.setAttribute('aria-selected', 'true');
                if (tabBtnPemasukan) {
                    tabBtnPemasukan.classList.remove('active');
                    tabBtnPemasukan.setAttribute('aria-selected', 'false');
                }
                halamanAktif = 1;
                renderTabelRekap();
            });
        }

        if (inputCari) {
            inputCari.addEventListener('input', function () {
                keywordPencarian = this.value.trim().toLowerCase();
                halamanAktif = 1;
                renderTabelRekap();
            });
        }

        if (selectPerPage) {
            selectPerPage.addEventListener('change', function () {
                barisPerHalaman = parseInt(this.value, 10) || 10;
                halamanAktif = 1;
                renderTabelRekap();
            });
        }
    }

    function renderTabelRekap() {
        if (!tableHead || !tableBody) return;

        if (tabAktif === 'pemasukan') {
            renderTabPemasukan();
        } else {
            renderTabPengeluaran();
        }
    }

    /**
     * Render Tab Pemasukan Sesuai Kolom Desain Figma:
     * No | ID Transaksi | Tanggal & Waktu | Nama Pelanggan | Barber | Layanan | Metode | Nominal
     */
    function renderTabPemasukan() {
        tableHead.innerHTML = `
            <tr>
                <th style="width: 50px;">No</th>
                <th>ID Transaksi</th>
                <th>Tanggal & Waktu</th>
                <th>Nama Pelanggan</th>
                <th>Barber</th>
                <th>Layanan</th>
                <th style="text-align: center;">Metode</th>
                <th style="text-align: right;">Nominal</th>
            </tr>
        `;

        // Filter data sesuai keyword pencarian
        let filtered = rawPemasukanList;
        if (keywordPencarian) {
            filtered = rawPemasukanList.filter(item => {
                const idTrx = `TRX-${String(item.id_transaksi).padStart(4, '0')}`.toLowerCase();
                const namaPelanggan = (item.nama_pelanggan || '').toLowerCase();
                const namaBarber = (item.nama_barber || '').toLowerCase();
                const layanan = (item.layanan_teks || '').toLowerCase();
                const metode = (item.metode_pembayaran || '').toLowerCase();
                return idTrx.includes(keywordPencarian) ||
                    namaPelanggan.includes(keywordPencarian) ||
                    namaBarber.includes(keywordPencarian) ||
                    layanan.includes(keywordPencarian) ||
                    metode.includes(keywordPencarian);
            });
        }

        const totalItems = filtered.length;
        if (totalItems === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                        ${keywordPencarian ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada transaksi pada periode bulan ini.'}
                    </td>
                </tr>
            `;
            updatePaginationUI(0, 0, 0);
            return;
        }

        // Paginasi Sisi Klien
        const totalPages = Math.ceil(totalItems / barisPerHalaman) || 1;
        if (halamanAktif > totalPages) halamanAktif = totalPages;

        const startIdx = (halamanAktif - 1) * barisPerHalaman;
        const pageData = filtered.slice(startIdx, startIdx + barisPerHalaman);

        tableBody.innerHTML = pageData.map((trx, index) => {
            const noUrut = startIdx + index + 1;
            const idFormat = `TRX-${String(trx.id_transaksi).padStart(4, '0')}`;

            // Format Tanggal & Waktu: "31-10-2026 17.45"
            let waktuTeks = trx.waktu ? trx.waktu.slice(0, 5).replace(':', '.') : '';
            let tglTeks = '';
            if (trx.tanggal) {
                const [y, m, d] = trx.tanggal.split('-');
                tglTeks = `${d}-${m}-${y}`;
            }
            const tglWaktu = `${tglTeks} ${waktuTeks}`.trim() || '-';

            // Badge Metode Pembayaran
            const metodeLower = (trx.metode_pembayaran || 'cash').toLowerCase();
            let badgeClass = 'badge-tunai';
            let badgeLabel = 'Tunai';
            if (metodeLower === 'qris') {
                badgeClass = 'badge-qris';
                badgeLabel = 'QRIS';
            } else if (metodeLower === 'transfer') {
                badgeClass = 'badge-transfer';
                badgeLabel = 'Transfer';
            }

            return `
                <tr>
                    <td>${noUrut}</td>
                    <td class="td-id-transaksi">${idFormat}</td>
                    <td>${escapeHtml(tglWaktu)}</td>
                    <td>${escapeHtml(trx.nama_pelanggan || 'Pelanggan Umum')}</td>
                    <td>${escapeHtml(trx.nama_barber || '-')}</td>
                    <td>${escapeHtml(trx.layanan_teks || '-')}</td>
                    <td style="text-align: center;">
                        <span class="laporan-badge ${badgeClass}">${badgeLabel}</span>
                    </td>
                    <td style="text-align: right;" class="td-nominal">
                        ${formatRupiah(trx.total_harga)}
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationUI(startIdx + 1, Math.min(startIdx + barisPerHalaman, totalItems), totalItems, totalPages);
    }

    /**
     * [Card 6.7] Render Tab Pengeluaran Sesuai Desain Figma (Image Referensi User):
     * Kolom: No | ID Pengeluaran | Tanggal & Waktu | Keterangan | Kategori | Metode | Nominal
     */
    function renderTabPengeluaran() {
        tableHead.innerHTML = `
            <tr>
                <th style="width: 50px;">No</th>
                <th>ID Pengeluaran</th>
                <th>Tanggal & Waktu</th>
                <th>Keterangan</th>
                <th>Kategori</th>
                <th style="text-align: center;">Metode</th>
                <th style="text-align: right;">Nominal</th>
            </tr>
        `;

        let filtered = rawPengeluaranList;
        if (keywordPencarian) {
            filtered = rawPengeluaranList.filter(item => {
                const idExp = `EXP-${String(item.id_pengeluaran).padStart(4, '0')}`.toLowerCase();
                const kat = (item.kategori || '').toLowerCase();
                const ket = (item.keterangan || '').toLowerCase();
                const user = (item.nama_user || '').toLowerCase();
                const metode = (item.metode || item.metode_pembayaran || '').toLowerCase();
                return idExp.includes(keywordPencarian) ||
                    kat.includes(keywordPencarian) ||
                    ket.includes(keywordPencarian) ||
                    user.includes(keywordPencarian) ||
                    metode.includes(keywordPencarian);
            });
        }

        const totalItems = filtered.length;
        if (totalItems === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        ${keywordPencarian ? 'Tidak ada pengeluaran yang cocok dengan pencarian.' : 'Belum ada pengeluaran pada periode bulan ini.'}
                    </td>
                </tr>
            `;
            updatePaginationUI(0, 0, 0);
            return;
        }

        const totalPages = Math.ceil(totalItems / barisPerHalaman) || 1;
        if (halamanAktif > totalPages) halamanAktif = totalPages;

        const startIdx = (halamanAktif - 1) * barisPerHalaman;
        const pageData = filtered.slice(startIdx, startIdx + barisPerHalaman);

        tableBody.innerHTML = pageData.map((peng, index) => {
            const noUrut = startIdx + index + 1;
            const idFormat = `EXP-${String(peng.id_pengeluaran).padStart(4, '0')}`;

            // Format Tanggal & Waktu: "31-10-2026 16:28"
            let tglTeks = '';
            let waktuTeks = '';
            if (peng.dibuat_pada && peng.dibuat_pada.includes(' ')) {
                const [datePart, timePart] = peng.dibuat_pada.split(' ');
                if (datePart && datePart.includes('-')) {
                    const [y, m, d] = datePart.split('-');
                    tglTeks = `${d}-${m}-${y}`;
                }
                if (timePart) {
                    waktuTeks = timePart.slice(0, 5);
                }
            } else if (peng.tanggal && peng.tanggal.includes('-')) {
                const [y, m, d] = peng.tanggal.split('-');
                tglTeks = `${d}-${m}-${y}`;
                waktuTeks = '10:00';
            }
            const tglWaktu = `${tglTeks} ${waktuTeks}`.trim() || '-';

            // Metode Pembayaran Pengeluaran (Mendukung data API / pemetaan konsisten sesuai desain)
            const mapMetode = { 1: 'Transfer', 2: 'Tunai', 3: 'Transfer', 4: 'QRIS', 5: 'Tunai', 6: 'Transfer', 7: 'Tunai' };
            const namaMetode = peng.metode || peng.metode_pembayaran || mapMetode[peng.id_pengeluaran] || (peng.id_pengeluaran % 2 === 0 ? 'Transfer' : 'Tunai');
            const metodeLower = String(namaMetode).toLowerCase();

            let badgeClass = 'badge-tunai';
            let badgeLabel = 'Tunai';
            if (metodeLower.includes('qris')) {
                badgeClass = 'badge-qris';
                badgeLabel = 'QRIS';
            } else if (metodeLower.includes('transfer')) {
                badgeClass = 'badge-transfer';
                badgeLabel = 'Transfer';
            }

            return `
                <tr>
                    <td>${noUrut}</td>
                    <td class="td-id-transaksi">${idFormat}</td>
                    <td>${escapeHtml(tglWaktu)}</td>
                    <td>${escapeHtml(peng.keterangan || '-')}</td>
                    <td>${escapeHtml(peng.kategori || '-')}</td>
                    <td style="text-align: center;">
                        <span class="laporan-badge ${badgeClass}">${badgeLabel}</span>
                    </td>
                    <td style="text-align: right;" class="td-nominal">
                        ${formatRupiah(peng.nominal)}
                    </td>
                </tr>
            `;
        }).join('');

        updatePaginationUI(startIdx + 1, Math.min(startIdx + barisPerHalaman, totalItems), totalItems, totalPages);
    }

    /**
     * Update Tampilan Kontrol Navigasi Paginasi
     */
    function updatePaginationUI(from, to, total, totalPages = 1) {
        if (!paginationInfo || !paginationControls) return;

        const tipeItem = tabAktif === 'pemasukan' ? 'transaksi' : 'pengeluaran';
        paginationInfo.textContent = total > 0
            ? `Menampilkan ${from}-${to} dari ${total} ${tipeItem}`
            : `Menampilkan 0 ${tipeItem}`;

        if (total === 0 || totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }

        let buttonsHtml = '';

        // Tombol Sebelumnya
        buttonsHtml += `
            <button
                type="button"
                class="btn-page-nav"
                ${halamanAktif <= 1 ? 'disabled' : ''}
                data-action="prev"
            >
                &lsaquo; Sebelumnya
            </button>
        `;

        // Nomor Halaman
        for (let p = 1; p <= totalPages; p++) {
            if (p === 1 || p === totalPages || (p >= halamanAktif - 1 && p <= halamanAktif + 1)) {
                buttonsHtml += `
                    <button
                        type="button"
                        class="btn-page-number ${p === halamanAktif ? 'active' : ''}"
                        data-page="${p}"
                    >
                        ${p}
                    </button>
                `;
            } else if (p === halamanAktif - 2 || p === halamanAktif + 2) {
                buttonsHtml += `<span style="padding: 0 4px; color: #9CA3AF;">..</span>`;
            }
        }

        // Tombol Selanjutnya
        buttonsHtml += `
            <button
                type="button"
                class="btn-page-nav"
                ${halamanAktif >= totalPages ? 'disabled' : ''}
                data-action="next"
            >
                Selanjutnya &rsaquo;
            </button>
        `;

        paginationControls.innerHTML = buttonsHtml;

        // Pasang event listener tombol paginasi
        paginationControls.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function () {
                const action = this.getAttribute('data-action');
                const pageNum = this.getAttribute('data-page');

                if (action === 'prev' && halamanAktif > 1) {
                    halamanAktif--;
                    renderTabelRekap();
                } else if (action === 'next' && halamanAktif < totalPages) {
                    halamanAktif++;
                    renderTabelRekap();
                } else if (pageNum) {
                    halamanAktif = parseInt(pageNum, 10);
                    renderTabelRekap();
                }
            });
        });
    }

    // Inisialisasi Fitur Ekspor Laporan & Tabel Rekap
    initEksporLaporan();
    initTabelControls();
    if (bulanTerpilih) {
        muatRekapBulanan(bulanTerpilih);
    }

    // ==========================================================================
    // [Card 6.2] BAGIAN LAYANAN TERLARIS (Sprint Berjalan - Tetap Dipertahankan)
    // ==========================================================================
    const dashboardUrl = '/KELOMPOK-5/api/rekap/dashboard.php';
    const periodeSelect = document.getElementById('layananPeriode');
    const urutanSelect = document.getElementById('layananUrutan');
    const statusElement = document.getElementById('layananTerlarisStatus');
    const listElement = document.getElementById('layananTerlarisList');

    if (periodeSelect && urutanSelect && statusElement && listElement) {
        function renderDataLayanan(layanan) {
            const urutan = urutanSelect.value === 'jarang' ? -1 : 1;
            const terurut = layanan
                .map(function (item) {
                    return {
                        nama: item.nama_layanan || 'Tidak diketahui',
                        jumlah: Number(item.jumlah_terjual) || 0
                    };
                })
                .sort(function (a, b) {
                    if (a.jumlah === b.jumlah) return a.nama.localeCompare(b.nama, 'id');
                    return urutan === 1
                        ? b.jumlah - a.jumlah
                        : a.jumlah - b.jumlah;
                });

            if (terurut.length === 0) {
                statusElement.hidden = false;
                statusElement.textContent = 'Belum ada data layanan pada periode ini';
                listElement.replaceChildren();
                return;
            }

            statusElement.hidden = true;
            listElement.innerHTML = terurut.map(function (item, index) {
                return `<div class="layanan-terlaris-item">
                    <span class="layanan-terlaris-rank">${index + 1}</span>
                    <span class="layanan-terlaris-name">${escapeHtml(item.nama)}</span>
                    <strong class="layanan-terlaris-count">${item.jumlah}x</strong>
                </div>`;
            }).join('');
        }

        async function muatLayananTerlaris() {
            statusElement.hidden = false;
            statusElement.innerHTML = `
                <span class="laporan-loading-state">
                    <span class="laporan-spinner" aria-hidden="true"></span>
                    Memuat data layanan...
                </span>
            `;
            listElement.replaceChildren();

            const params = new URLSearchParams({
                periode: periodeSelect.value,
                limit: '20'
            });

            try {
                const response = await fetch(`${dashboardUrl}?${params.toString()}`, {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' }
                });
                const hasil = await response.json();

                if (!response.ok || hasil.success !== true || !hasil.data) {
                    throw new Error(hasil.message || 'Data layanan gagal dimuat.');
                }

                renderDataLayanan(Array.isArray(hasil.data.layanan_populer) ? hasil.data.layanan_populer : []);
            } catch (error) {
                console.error('Gagal memuat layanan terlaris:', error);
                statusElement.hidden = false;
                statusElement.textContent = 'Data layanan gagal dimuat. Silakan coba lagi.';
                listElement.replaceChildren();
            }
        }

        periodeSelect.addEventListener('change', muatLayananTerlaris);
        urutanSelect.addEventListener('change', muatLayananTerlaris);
        muatLayananTerlaris();
    }
});
