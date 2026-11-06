/**
 * Kataji Barber - Riwayat Transaksi (Frontend)
 * Sesuai Desain & Fungsionalitas Figma:
 * - Filter: Pencarian (Cari riwayat...), Metode Pembayaran, Tanggal (dd-mm-yyyy)
 * - Paginasi dinamis dengan limit per halaman (default 10)
 * - Badge metode pembayaran dengan skema warna Figma (#17186B, #E6F4EC, #3B3DA8)
 * - Riwayat transaksi bersifat permanen (tanpa tombol/kolom hapus)
 */

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('riwayatTableBody');
    const inputCari = document.getElementById('cariRiwayat');
    const selectMetode = document.getElementById('filterMetodeRiwayat');
    const inputTanggal = document.getElementById('filterTanggalRiwayat');
    const btnClearDate = document.getElementById('btnClearDate');
    const paginationInfo = document.getElementById('riwayatPaginationInfo');
    const paginationControls = document.getElementById('riwayatPaginationControls');
    const selectPerPage = document.getElementById('riwayatPerPage');
    const notification = document.getElementById('riwayatNotification');

    const API_TRANSAKSI = '/KELOMPOK-5/api/transaksi/index.php';
    const DETAIL_URL = '/KELOMPOK-5/api/transaksi/detail.php';

    if (!tableBody) return;

    let semuaTransaksi = [];
    let transaksiTerfilter = [];
    let currentPage = 1;
    let perPage = 10;
    let notificationTimer = null;

    // ======================================================
    // 1. HELPER FORMAT
    // ======================================================

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatRupiah(nominal) {
        return 'Rp' + Number(nominal || 0).toLocaleString('id-ID', {
            maximumFractionDigits: 0
        });
    }

    // Format tanggal ke DD-MM-YYYY sesuai Figma
    function formatTanggal(tanggal) {
        if (!tanggal) return '-';
        const raw = String(tanggal).slice(0, 10);
        const parts = raw.split('-');
        if (parts.length === 3) {
            // YYYY-MM-DD -> DD-MM-YYYY
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return tanggal;
    }

    function tanggalLokal(tanggal = new Date()) {
        const tahun = tanggal.getFullYear();
        const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
        const hari = String(tanggal.getDate()).padStart(2, '0');
        return `${tahun}-${bulan}-${hari}`;
    }

    function getMetodeInfo(metode) {
        const m = String(metode || '').toLowerCase().trim();
        if (m === 'cash' || m === 'tunai') {
            return { label: 'Tunai', cssClass: 'badge-tunai' };
        }
        if (m === 'qris') {
            return { label: 'QRIS', cssClass: 'badge-qris' };
        }
        if (m === 'transfer') {
            return { label: 'Transfer', cssClass: 'badge-transfer' };
        }
        return { label: escapeHtml(metode || '-'), cssClass: 'badge-tunai' };
    }

    function tampilkanPesan(pesan) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">${escapeHtml(pesan)}</td>
            </tr>
        `;
        if (paginationInfo) paginationInfo.textContent = 'Menampilkan 0 riwayat';
        if (paginationControls) paginationControls.innerHTML = '';
    }

    // ======================================================
    // 2. MEMUAT DATA DARI API
    // ======================================================

    async function muatDetailTransaksi(idTransaksi) {
        const response = await fetch(`${DETAIL_URL}?id=${encodeURIComponent(idTransaksi)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Detail gagal dimuat');
        }
        return result.data;
    }

    async function muatData() {
        tampilkanPesan('Memuat riwayat transaksi...');

        try {
            const response = await fetch(API_TRANSAKSI, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Riwayat transaksi gagal dimuat.');
            }

            semuaTransaksi = Array.isArray(result.data) ? result.data : [];

            // Jika transaksi belum memiliki layanan_teks dari backend, siapkan fallback
            const missingDetails = semuaTransaksi.filter(t => !t.layanan_teks && t.id_transaksi);
            if (missingDetails.length > 0) {
                // Ambil detail secara background
                Promise.all(missingDetails.map(async t => {
                    try {
                        const detail = await muatDetailTransaksi(t.id_transaksi);
                        if (detail && Array.isArray(detail.layanan)) {
                            t.layanan_teks = detail.layanan.map(l => {
                                const qty = Number(l.jumlah) || 1;
                                return qty > 1 ? `${l.nama_layanan} (${qty}x)` : l.nama_layanan;
                            }).join(', ');
                        }
                    } catch (e) {
                        t.layanan_teks = '-';
                    }
                })).then(() => {
                    terapkanFilter();
                });
            }

            terapkanFilter();

        } catch (error) {
            console.error('Gagal memuat riwayat:', error);
            tampilkanPesan(error.message || 'Riwayat transaksi gagal dimuat.');
        }
    }

    // ======================================================
    // 3. FILTERING & PENCARIAN
    // ======================================================

    function terapkanFilter() {
        const kataKunci = (inputCari?.value || '').toLowerCase().trim();
        const metodeDipilih = (selectMetode?.value || '').toLowerCase().trim();
        const tanggalDipilih = (inputTanggal?.value || '').trim(); // Format YYYY-MM-DD

        // Tampilkan/sembunyikan tombol clear tanggal
        if (btnClearDate) {
            btnClearDate.hidden = !tanggalDipilih;
        }

        transaksiTerfilter = semuaTransaksi.filter(trx => {
            // 1. Filter Tanggal
            if (tanggalDipilih) {
                const tglTrx = String(trx.tanggal || '').slice(0, 10);
                if (tglTrx !== tanggalDipilih) return false;
            }

            // 2. Filter Metode Pembayaran
            if (metodeDipilih) {
                const mTrx = String(trx.metode_pembayaran || '').toLowerCase().trim();
                const mapMetode = (mTrx === 'tunai') ? 'cash' : mTrx;
                const mapDipilih = (metodeDipilih === 'tunai') ? 'cash' : metodeDipilih;
                if (mapMetode !== mapDipilih) return false;
            }

            // 3. Filter Pencarian Teks
            if (kataKunci) {
                const barber = String(trx.nama_barber || '').toLowerCase();
                const pelanggan = String(trx.nama_pelanggan || '').toLowerCase();
                const layanan = String(trx.layanan_teks || '').toLowerCase();
                const nominal = String(trx.total_harga || '').toLowerCase();
                const tglFormat = formatTanggal(trx.tanggal).toLowerCase();
                const metodeInfo = getMetodeInfo(trx.metode_pembayaran);
                const metode = metodeInfo.label.toLowerCase();

                const cocok = barber.includes(kataKunci) ||
                              pelanggan.includes(kataKunci) ||
                              layanan.includes(kataKunci) ||
                              nominal.includes(kataKunci) ||
                              tglFormat.includes(kataKunci) ||
                              metode.includes(kataKunci);

                if (!cocok) return false;
            }

            return true;
        });

        currentPage = 1;
        renderTabelDanPaginasi();
    }

    // ======================================================
    // 4. RENDERING TABEL & PAGINASI (SESUAI FIGMA)
    // ======================================================

    function renderTabelDanPaginasi() {
        const totalItems = transaksiTerfilter.length;

        if (totalItems === 0) {
            tampilkanPesan('Belum ada Riwayat Hari ini');
            return;
        }

        const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }

        const startIndex = (currentPage - 1) * perPage;
        const endIndex = Math.min(startIndex + perPage, totalItems);
        const itemHalaman = transaksiTerfilter.slice(startIndex, endIndex);

        // Render Baris Tabel
        tableBody.innerHTML = itemHalaman.map((trx, index) => {
            const no = startIndex + index + 1;
            const barber = escapeHtml(trx.nama_barber || '-');
            const nama = escapeHtml(trx.nama_pelanggan || '-');
            const tgl = formatTanggal(trx.tanggal);
            const layanan = escapeHtml(trx.layanan_teks || '-');
            const nominal = formatRupiah(trx.total_harga);
            const metodeInfo = getMetodeInfo(trx.metode_pembayaran);

            return `
                <tr>
                    <td class="td-no">${no}</td>
                    <td class="td-barber">${barber}</td>
                    <td class="td-nama">${nama}</td>
                    <td class="td-tanggal">${tgl}</td>
                    <td class="td-layanan">${layanan}</td>
                    <td class="td-nominal">${nominal}</td>
                    <td class="td-metode text-center">
                        <span class="riwayat-badge ${metodeInfo.cssClass}">
                            ${metodeInfo.label}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        // Render Info Paginasi
        if (paginationInfo) {
            paginationInfo.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalItems} riwayat`;
        }

        // Render Tombol Paginasi
        renderTombolPaginasi(totalPages);
    }

    function renderTombolPaginasi(totalPages) {
        if (!paginationControls) return;

        let html = '';

        // Tombol Sebelumnya
        const prevDisabled = currentPage <= 1 ? 'disabled' : '';
        html += `
            <button type="button" class="btn-page-nav btn-page-prev" ${prevDisabled} data-page="${currentPage - 1}">
                &lt; Sebelumnya
            </button>
        `;

        // Nomor Halaman
        let pageNumbers = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
        } else {
            if (currentPage <= 3) {
                pageNumbers = [1, 2, 3, 4, '...', totalPages];
            } else if (currentPage >= totalPages - 2) {
                pageNumbers = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pageNumbers = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }

        pageNumbers.forEach(p => {
            if (p === '...') {
                html += `<span class="page-ellipsis">&hellip;</span>`;
            } else {
                const isActive = p === currentPage ? 'active' : '';
                html += `
                    <button type="button" class="btn-page-num ${isActive}" data-page="${p}">
                        ${p}
                    </button>
                `;
            }
        });

        // Tombol Selanjutnya
        const nextDisabled = currentPage >= totalPages ? 'disabled' : '';
        html += `
            <button type="button" class="btn-page-nav btn-page-next" ${nextDisabled} data-page="${currentPage + 1}">
                Selanjutnya &gt;
            </button>
        `;

        paginationControls.innerHTML = html;
    }

    // ======================================================
    // 5. EVENT LISTENERS
    // ======================================================

    // Filter Pencarian
    if (inputCari) {
        inputCari.addEventListener('input', function () {
            terapkanFilter();
        });
    }

    // Filter Metode Pembayaran
    if (selectMetode) {
        selectMetode.addEventListener('change', function () {
            terapkanFilter();
        });
    }

    // Filter Tanggal
    if (inputTanggal) {
        inputTanggal.addEventListener('change', function () {
            terapkanFilter();
        });
    }

    // Clear Tanggal
    if (btnClearDate) {
        btnClearDate.addEventListener('click', function () {
            if (inputTanggal) inputTanggal.value = '';
            terapkanFilter();
        });
    }

    // Limit Per Halaman
    if (selectPerPage) {
        selectPerPage.addEventListener('change', function () {
            perPage = Number(selectPerPage.value) || 10;
            currentPage = 1;
            renderTabelDanPaginasi();
        });
    }

    // Klik Tombol Paginasi
    if (paginationControls) {
        paginationControls.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-page]');
            if (!btn || btn.disabled) return;

            const targetPage = Number(btn.dataset.page);
            if (targetPage && targetPage !== currentPage) {
                currentPage = targetPage;
                renderTabelDanPaginasi();
            }
        });
    }

    // Mulai memuat data
    if (inputTanggal && !inputTanggal.value) {
        inputTanggal.value = tanggalLokal();
        btnClearDate.hidden = false;
    }
    muatData();
});
