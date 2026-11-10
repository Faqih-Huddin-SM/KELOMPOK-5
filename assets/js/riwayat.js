/**
 * Kataji Barber - Riwayat Transaksi (Frontend)
 * Terhubung langsung dengan Backend API (/KELOMPOK-5/api/transaksi/index.php):
 * - Server-side Filter: q, id_barber, id_layanan, metode_pembayaran, tanggal (rentang / tunggal)
 * - Server-side Paginasi: page, per_page (default 10)
 * - Rentang Tanggal Default: Minggu ini (contoh: 09/11/2026 – 15/11/2026)
 * - Tombol Silang (✕): Menghapus filter tanggal sehingga kembali ke placeholder (dd-mm-yyyy) dan menampilkan semua riwayat
 * - Urutan Kolom Sesuai Figma: No, Nama, Barber, Tgl-Bln-Thn, Layanan, Nominal, Metode Pembayaran
 * - Badge Pembayaran: Tunai (#17186B), QRIS (#E6F4EC), Transfer (#3B3DA8)
 */

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('riwayatTableBody');
    const inputCari = document.getElementById('cariRiwayat');
    const selectBarber = document.getElementById('filterBarberRiwayat');
    const selectLayanan = document.getElementById('filterLayananRiwayat');
    const selectMetode = document.getElementById('filterMetodeRiwayat');
    const btnResetFilter = document.getElementById('btnResetFilter');
    const inputTanggalMulai = document.getElementById('filterTanggalMulai');
    const inputTanggalSelesai = document.getElementById('filterTanggalSelesai');
    const btnClearDate = document.getElementById('btnClearDate');
    const datePill = document.getElementById('riwayatDatePill');
    const paginationInfo = document.getElementById('riwayatPaginationInfo');
    const paginationControls = document.getElementById('riwayatPaginationControls');
    const selectPerPage = document.getElementById('riwayatPerPage');
    const notification = document.getElementById('riwayatNotification');

    const API_TRANSAKSI = '/KELOMPOK-5/api/transaksi/index.php';
    const API_BARBER = '/KELOMPOK-5/api/barber/index.php';
    const API_LAYANAN = '/KELOMPOK-5/api/layanan/index.php';

    if (!tableBody) return;

    let currentPage = 1;
    let perPage = 10;
    let debounceTimer = null;

    // ======================================================
    // 1. HELPER FORMAT & UTILITY
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

    // Mendapatkan tanggal hari ini lokal (YYYY-MM-DD)
    function getTanggalHariIni() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
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
    // 2. MEMUAT DAFTAR OPSI FILTER (BARBER & LAYANAN)
    // ======================================================

    async function muatOpsiFilter() {
        // 1. Ambil daftar Barber
        try {
            const resBarber = await fetch(API_BARBER, {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin'
            });
            const resData = await resBarber.json();
            if (resData.success && Array.isArray(resData.data) && selectBarber) {
                let options = '<option value="">Semua Barber</option>';
                resData.data.forEach(b => {
                    if (b && b.id_user && b.nama) {
                        options += `<option value="${escapeHtml(String(b.id_user))}">${escapeHtml(b.nama)}</option>`;
                    }
                });
                selectBarber.innerHTML = options;
            }
        } catch (err) {
            console.warn('Gagal memuat list barber dari API:', err);
        }

        // 2. Ambil daftar Layanan
        try {
            const resLayanan = await fetch(API_LAYANAN, {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin'
            });
            const resLayananData = await resLayanan.json();
            if (resLayananData.success && Array.isArray(resLayananData.data) && selectLayanan) {
                let options = '<option value="">Semua Layanan</option>';
                resLayananData.data.forEach(l => {
                    if (l && l.id_layanan && l.nama_layanan) {
                        options += `<option value="${escapeHtml(String(l.id_layanan))}">${escapeHtml(l.nama_layanan)}</option>`;
                    }
                });
                selectLayanan.innerHTML = options;
            }
        } catch (err) {
            console.warn('Gagal memuat list layanan dari API:', err);
        }
    }

    // ======================================================
    // 3. MEMUAT DATA DARI BACKEND API DENGAN FILTER & PAGINASI
    // ======================================================

    async function muatData() {
        tampilkanPesan('Memuat riwayat transaksi...');

        const kataKunci = (inputCari?.value || '').trim();
        const idBarber = (selectBarber?.value || '').trim();
        const idLayanan = (selectLayanan?.value || '').trim();
        const metode = (selectMetode?.value || '').trim();
        const tglMulai = (inputTanggalMulai?.value || '').trim();
        const tglSelesai = (inputTanggalSelesai?.value || '').trim();

        // Sinkronkan visibilitas tombol silang tanggal (✕)
        if (btnClearDate) {
            btnClearDate.hidden = !(tglMulai || tglSelesai);
        }

        // Susun parameter URL untuk BE
        const params = new URLSearchParams();
        params.set('page', currentPage);
        params.set('per_page', perPage);

        if (tglMulai && tglSelesai) {
            params.set('tanggal_mulai', tglMulai);
            params.set('tanggal_selesai', tglSelesai);
        } else if (tglMulai) {
            params.set('tanggal', tglMulai);
        } else if (tglSelesai) {
            params.set('tanggal', tglSelesai);
        }

        if (kataKunci) {
            params.set('q', kataKunci);
        }
        if (idBarber) {
            params.set('id_barber', idBarber);
        }
        if (idLayanan) {
            params.set('id_layanan', idLayanan);
        }
        if (metode) {
            params.set('metode_pembayaran', metode);
        }

        const url = `${API_TRANSAKSI}?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Riwayat transaksi gagal dimuat.');
            }

            const items = Array.isArray(result.data) ? result.data : [];
            const meta = result.meta || {};
            const totalItems = typeof meta.total === 'number' ? meta.total : items.length;
            const totalPages = typeof meta.total_pages === 'number' ? meta.total_pages : 1;

            renderTabel(items, totalItems);
            renderPaginasi(totalItems, totalPages, items.length);

        } catch (error) {
            console.error('Gagal memuat riwayat:', error);
            tampilkanPesan(error.message || 'Riwayat transaksi gagal dimuat.');
        }
    }

    // ======================================================
    // 4. RENDERING TABEL & PAGINASI SESUAI FIGMA
    // Urutan Kolom: No, Nama, Barber, Tgl-Bln-Thn, Layanan, Nominal, Metode Pembayaran
    // ======================================================

    function renderTabel(items, totalItems) {
        if (!items || items.length === 0) {
            tampilkanPesan('Belum ada Riwayat Transaksi');
            return;
        }

        const startIndex = (currentPage - 1) * perPage;

        tableBody.innerHTML = items.map((trx, index) => {
            const no = startIndex + index + 1;
            const nama = escapeHtml(trx.nama_pelanggan || '-');
            const barber = escapeHtml(trx.nama_barber || '-');
            const tgl = formatTanggal(trx.tanggal);
            const layananRaw = trx.layanan_teks || trx.nama_layanan || '';
            const layanan = layananRaw && layananRaw.trim() !== '' ? escapeHtml(layananRaw) : '-';
            const nominal = formatRupiah(trx.total_harga);
            const metodeInfo = getMetodeInfo(trx.metode_pembayaran);

            return `
                <tr>
                    <td class="td-no">${no}</td>
                    <td class="td-nama">${nama}</td>
                    <td class="td-barber">${barber}</td>
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
    }

    function renderPaginasi(totalItems, totalPages, currentItemCount) {
        if (!paginationInfo) return;

        if (totalItems === 0) {
            paginationInfo.textContent = 'Menampilkan 0 riwayat';
            if (paginationControls) paginationControls.innerHTML = '';
            return;
        }

        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + currentItemCount;
        paginationInfo.textContent = `Menampilkan ${startIndex + 1}-${endIndex} dari ${totalItems} riwayat`;

        if (!paginationControls) return;

        let html = '';

        // Tombol Sebelumnya (< Sebelumnya)
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

        // Tombol Selanjutnya (Selanjutnya >)
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

    // Filter Pencarian Teks (Debounce 250ms)
    if (inputCari) {
        inputCari.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentPage = 1;
                muatData();
            }, 250);
        });
    }

    // Filter Barber
    if (selectBarber) {
        selectBarber.addEventListener('change', function () {
            currentPage = 1;
            muatData();
        });
    }

    // Filter Layanan
    if (selectLayanan) {
        selectLayanan.addEventListener('change', function () {
            currentPage = 1;
            muatData();
        });
    }

    // Filter Metode Pembayaran
    if (selectMetode) {
        selectMetode.addEventListener('change', function () {
            currentPage = 1;
            muatData();
        });
    }

    // Filter Tanggal Mulai & Selesai
    if (inputTanggalMulai) {
        inputTanggalMulai.addEventListener('change', function () {
            if (inputTanggalSelesai && inputTanggalMulai.value && inputTanggalSelesai.value && inputTanggalMulai.value > inputTanggalSelesai.value) {
                inputTanggalSelesai.value = inputTanggalMulai.value;
            }
            currentPage = 1;
            muatData();
        });
    }

    if (inputTanggalSelesai) {
        inputTanggalSelesai.addEventListener('change', function () {
            if (inputTanggalMulai && inputTanggalMulai.value && inputTanggalSelesai.value && inputTanggalSelesai.value < inputTanggalMulai.value) {
                inputTanggalMulai.value = inputTanggalSelesai.value;
            }
            currentPage = 1;
            muatData();
        });
    }

    // Tombol Silang (✕) pada Tanggal: Menghapus filter tanggal sehingga kembali ke dd-mm-yyyy (semua tanggal)
    if (btnClearDate) {
        btnClearDate.addEventListener('click', function (e) {
            e.stopPropagation();
            if (inputTanggalMulai) inputTanggalMulai.value = '';
            if (inputTanggalSelesai) inputTanggalSelesai.value = '';
            btnClearDate.hidden = true;
            currentPage = 1;
            muatData();
        });
    }

    // Tombol Reset Filter: Mengembalikan semua filter ke default (tanggal hari ini - tanggal hari ini)
    if (btnResetFilter) {
        btnResetFilter.addEventListener('click', function () {
            if (inputCari) inputCari.value = '';
            if (selectBarber) selectBarber.value = '';
            if (selectLayanan) selectLayanan.value = '';
            if (selectMetode) selectMetode.value = '';

            const hariIni = getTanggalHariIni();
            if (inputTanggalMulai) inputTanggalMulai.value = hariIni;
            if (inputTanggalSelesai) inputTanggalSelesai.value = hariIni;
            if (btnClearDate) btnClearDate.hidden = false;

            currentPage = 1;
            muatData();
        });
    }

    // Limit Per Halaman
    if (selectPerPage) {
        selectPerPage.addEventListener('change', function () {
            perPage = Number(selectPerPage.value) || 10;
            currentPage = 1;
            muatData();
        });
    }

    // Klik Tombol Navigasi Paginasi
    if (paginationControls) {
        paginationControls.addEventListener('click', function (e) {
            const btn = e.target.closest('[data-page]');
            if (!btn || btn.disabled) return;

            const targetPage = Number(btn.dataset.page);
            if (targetPage && targetPage !== currentPage) {
                currentPage = targetPage;
                muatData();
            }
        });
    }

    // ======================================================
    // 6. INISIALISASI
    // Rentang Tanggal Default: Hari ini - Hari ini (contoh: 09/11/2026 – 09/11/2026)
    // ======================================================
    const hariIni = getTanggalHariIni();
    if (inputTanggalMulai && !inputTanggalMulai.value) {
        inputTanggalMulai.value = hariIni;
    }
    if (inputTanggalSelesai && !inputTanggalSelesai.value) {
        inputTanggalSelesai.value = hariIni;
    }
    if (btnClearDate) {
        btnClearDate.hidden = false;
    }

    muatOpsiFilter();
    muatData();
});
