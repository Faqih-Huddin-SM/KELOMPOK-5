/**
 * ======================================================
 * Kataji Barber - Dashboard Owner Frontend
 * Pengembang: Faqih Huddin SM (Frontend Developer)
 * ======================================================
 * Seluruh data terhubung ke endpoint backend riil.
 * Mendukung filter dinamis, interaktivitas grafik presisi,
 * dan sinkronisasi otomatis antarhalaman.
 */

document.addEventListener('DOMContentLoaded', function () {
    const dashboardApiUrl = '/KELOMPOK-5/api/rekap/dashboard.php';
    const transaksiApiUrl = '/KELOMPOK-5/api/transaksi/index.php';
    const trenApiUrl = '/KELOMPOK-5/api/rekap/tren.php';

    // State aktif untuk filter dashboard
    const state = {
        rekapPeriode: 'minggu',
        trenPeriode: '7_hari',
        layananPeriode: 'minggu',
        layananSort: 'terbanyak',
        allTransactions: []
    };

    // Nama hari singkat dalam Bahasa Indonesia (Senin s.d Minggu)
    const hariIndoList = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const bulanIndoList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const bulanNamaLengkap = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // ========================================
    // BAGIAN: UTILITAS & FORMATTER
    // ========================================

    function getToday() {
        return new Date();
    }

    function getTodayString() {
        const d = getToday();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatRupiah(value) {
        const num = Number(value || 0);
        return 'Rp' + num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    }

    function formatRupiahSingkat(value) {
        const num = Number(value || 0);
        if (num === 0) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'Jt';
        }
        if (num >= 1000) {
            return Math.round(num / 1000) + 'Rb';
        }
        return String(num);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str ?? '');
        return div.innerHTML;
    }

    async function fetchApi(url) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });

        const json = await response.json();
        if (!response.ok || json.success !== true) {
            throw new Error(json.message || 'Gagal memuat data dari server.');
        }
        return json.data;
    }

    // ========================================
    // BAGIAN: DATA TRANSAKSI SINKRON
    // ========================================

    async function loadAllTransactions() {
        try {
            const data = await fetchApi(transaksiApiUrl);
            state.allTransactions = Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('Error loadAllTransactions:', err);
            state.allTransactions = [];
        }
    }

    // ========================================
    // BAGIAN: RINGKASAN HARIAN (4 KARTU)
    // ========================================

    async function loadRingkasanHarian() {
        const elPelanggan = document.getElementById('dashPelangganHariIni');
        const elTransaksi = document.getElementById('dashTransaksiHariIni');
        const elPemasukan = document.getElementById('dashPendapatanHariIni');
        const elLabaKotor = document.getElementById('dashLabaKotorHariIni');

        // Tampilkan spinner kecil dalam pill saat memuat (sesuai Figma Image 8)
        const spinnerPill = '<div class="summary-loading-pill"><span class="dashboard-spinner spinner-sm"></span></div>';
        if (elPelanggan) elPelanggan.innerHTML = spinnerPill;
        if (elTransaksi) elTransaksi.innerHTML = spinnerPill;
        if (elPemasukan) elPemasukan.innerHTML = spinnerPill;
        if (elLabaKotor) elLabaKotor.innerHTML = spinnerPill;

        try {
            const data = await fetchApi(`${dashboardApiUrl}?periode=hari&tanggal=${getTodayString()}`);

            if (elPelanggan) elPelanggan.textContent = String(Number(data.jumlah_pelanggan || 0));
            if (elTransaksi) elTransaksi.textContent = String(Number(data.jumlah_transaksi || 0));
            if (elPemasukan) elPemasukan.textContent = formatRupiah(data.keuangan?.pemasukan || 0);
            if (elLabaKotor) elLabaKotor.textContent = formatRupiah(data.keuangan?.laba_kotor || 0);

        } catch (error) {
            console.error('Error loadRingkasanHarian:', error);
            if (elPelanggan) elPelanggan.textContent = '0';
            if (elTransaksi) elTransaksi.textContent = '0';
            if (elPemasukan) elPemasukan.textContent = 'Rp0';
            if (elLabaKotor) elLabaKotor.textContent = 'Rp0';
        }
    }

    // ========================================
    // BAGIAN: REKAP KEUANGAN & PEMASUKAN PER BARBER
    // ========================================

    async function loadRekapKeuangan(period = 'minggu') {
        state.rekapPeriode = period;
        const loadingEl = document.getElementById('rekapKeuanganLoading');
        const metricsEl = document.getElementById('rekapKeuanganMetrics');

        try {
            // Tampilkan state memuat keuangan, pembayaran, & barber (sesuai Figma Image 8)
            if (loadingEl) loadingEl.style.display = 'flex';
            if (metricsEl) metricsEl.style.display = 'none';
            renderDistribusiPembayaran([], 0, true);

            const bodyEl = document.getElementById('tabelPemasukanBody');
            if (bodyEl) {
                bodyEl.innerHTML = `
                    <tr>
                        <td colspan="3" class="td-barber-loading">
                            <div class="barber-loading-wrap">
                                <span class="dashboard-spinner spinner-inline"></span>
                                <span>Memuat data barber...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }

            const data = await fetchApi(`${dashboardApiUrl}?periode=${encodeURIComponent(period)}&tanggal=${getTodayString()}`);
            const k = data.keuangan || {};

            const elPemasukan = document.getElementById('totalPemasukan');
            const elHpp = document.getElementById('totalHpp');
            const elLabaKotor = document.getElementById('totalLabaKotor');
            const elBiayaOps = document.getElementById('totalBiayaOperasional');
            const elLabaBersih = document.getElementById('totalLabaBersih');

            if (elPemasukan) elPemasukan.textContent = formatRupiah(k.pemasukan);
            if (elHpp) elHpp.textContent = formatRupiah(k.hpp);
            if (elLabaKotor) elLabaKotor.textContent = formatRupiah(k.laba_kotor);
            if (elBiayaOps) elBiayaOps.textContent = formatRupiah(k.biaya_operasional);
            if (elLabaBersih) elLabaBersih.textContent = formatRupiah(k.laba_bersih);

            if (loadingEl) loadingEl.style.display = 'none';
            if (metricsEl) metricsEl.style.display = 'grid';

            // Distribusi pembayaran disinkronkan dengan periode rekap keuangan
            renderDistribusiPembayaran(data.pembayaran || [], data.jumlah_transaksi || 0, false);

            // Pemasukan per barber disinkronkan dengan periode yang sama
            renderPemasukanPerBarber(period);

        } catch (error) {
            console.error('Error loadRekapKeuangan:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (metricsEl) metricsEl.style.display = 'grid';
            renderDistribusiPembayaran([], 0, false);
            renderPemasukanPerBarber(period);
        }
    }

    function renderPemasukanPerBarber(period = 'minggu') {
        const bodyEl = document.getElementById('tabelPemasukanBody');
        if (!bodyEl) return;

        const now = getToday();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Hitung Senin minggu ini
        const dayOfWeek = now.getDay(); // 0 is Sunday
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Filter transaksi sesuai periode
        const filteredTrx = (state.allTransactions || []).filter(trx => {
            if (!trx.tanggal) return false;
            const tDate = new Date(trx.tanggal + 'T00:00:00');

            if (period === 'minggu') {
                return tDate >= monday && tDate <= sunday;
            } else if (period === 'bulan') {
                return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
            } else {
                return true; // Semua
            }
        });

        // Kelompokkan per barber
        const barberMap = {};
        filteredTrx.forEach(trx => {
            const bName = trx.nama_barber || 'Barber';
            if (!barberMap[bName]) {
                barberMap[bName] = { nama: bName, transaksi: 0, total: 0 };
            }
            barberMap[bName].transaksi += 1;
            barberMap[bName].total += Number(trx.total_harga || 0);
        });

        const barberList = Object.values(barberMap);
        barberList.sort((a, b) => b.total - a.total);

        // Header tabel tetap muncul, jika belum ada data tampilkan pesan di tengah (warna #6B6B6B)
        if (!barberList.length) {
            bodyEl.innerHTML = `
                <tr class="tr-barber-empty">
                    <td colspan="3" class="td-barber-empty">
                        Belum ada pemasukan periode ini
                    </td>
                </tr>
            `;
            return;
        }

        // Jika ada data, tampilkan nama si barber, jumlah transaksi, dan total pemasukan (warna #1A1A1A)
        bodyEl.innerHTML = barberList.map(item => `
            <tr class="tr-barber-data">
                <td class="td-barber-nama">${escapeHtml(item.nama)}</td>
                <td class="td-barber-trx">${Number(item.transaksi)}</td>
                <td class="td-barber-total">${formatRupiah(item.total)}</td>
            </tr>
        `).join('');
    }

    // ========================================
    // BAGIAN: GRAFIK TREN PEMASUKAN
    // ========================================

    /* [Card Tren Pemasukan] Frontend Developer (Faqih) - Penomoran request agar respons lama tidak menimpa grafik saat pill periode diklik cepat */
    let trenRequestId = 0;

    /* [Card Tren Pemasukan] Frontend Developer (Faqih) - Memuat data grafik tren.
       Untuk '7_hari', dihitung di frontend agar menampilkan transaksi hari ini + 6 hari terakhir.
       Untuk 'minggu' dan 'bulan', memuat dari endpoint BE (api/rekap/tren.php). */
    async function loadTrenPemasukan(period = '7_hari') {
        state.trenPeriode = period;
        const chartContainer = document.getElementById('dashboardLineChart');
        const loadingTren = document.getElementById('trenLoadingState');
        const wrapTren = document.getElementById('trenContentWrap');
        if (!chartContainer) return;

        const requestId = ++trenRequestId;

        // Tampilkan animasi loading tren (sesuai Figma Image 8)
        if (loadingTren) loadingTren.style.display = 'flex';
        if (wrapTren) wrapTren.style.display = 'none';

        try {
            let trendData;
            if (period === '7_hari') {
                // Pastikan transaksi terbaru sudah dimuat di frontend
                if (!state.allTransactions || state.allTransactions.length === 0) {
                    await loadAllTransactions();
                }
                if (requestId !== trenRequestId) return;
                trendData = calculate7HariTrendData();
            } else {
                const data = await fetchApi(`${trenApiUrl}?periode=${encodeURIComponent(period)}`);
                if (requestId !== trenRequestId) return; // ada permintaan lebih baru, abaikan
                trendData = mapTrenApiToTrendData(data, period);
            }

            updateTrenSummaryBox(trendData, period);
            renderSvgLineChart(chartContainer, trendData);
        } catch (error) {
            if (requestId !== trenRequestId) return;
            console.error('Gagal memuat tren pemasukan:', error);
            renderTrenError(chartContainer);
        }

        if (loadingTren) loadingTren.style.display = 'none';
        if (wrapTren) wrapTren.style.display = 'block';
    }

    /* [Card Tren Pemasukan] Frontend - Hitung tren 7 hari terakhir (hari ini + 6 hari sebelumnya) dari data transaksi */
    function calculate7HariTrendData() {
        const today = getToday();
        today.setHours(0, 0, 0, 0);

        const labels = [];
        const subLabels = [];
        const dates = [];

        // 7 hari terakhir: 6 hari sebelumnya + hari ini (total 7 hari)
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const y = d.getFullYear();
            const m = pad2(d.getMonth() + 1);
            const day = pad2(d.getDate());
            const strDate = `${y}-${m}-${day}`;

            dates.push({
                date: d,
                strDate: strDate,
                dayName: hariIndoList[(d.getDay() + 6) % 7],
                subLabel: `${day}/${m}`
            });
            labels.push(hariIndoList[(d.getDay() + 6) % 7]);
            subLabels.push(`${day}/${m}`);
        }

        const subtitleText = `Pemasukan per hari, ${subLabels[0]} - ${subLabels[subLabels.length - 1]}`;

        // Hitung pemasukan harian dari state.allTransactions
        const values = dates.map(item => {
            return (state.allTransactions || [])
                .filter(t => {
                    const trxDate = String(t.tanggal || '').split(' ')[0].split('T')[0];
                    return trxDate === item.strDate;
                })
                .reduce((sum, t) => sum + Number(t.total_harga || 0), 0);
        });

        const totalAktif = values.reduce((a, b) => a + b, 0);

        // Periode pembanding: 7 hari sebelumnya (H-13 s/d H-7)
        const prevDates = [];
        for (let i = 13; i >= 7; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const y = d.getFullYear();
            const m = pad2(d.getMonth() + 1);
            const day = pad2(d.getDate());
            prevDates.push(`${y}-${m}-${day}`);
        }

        const totalSebelumnya = (state.allTransactions || [])
            .filter(t => {
                const trxDate = String(t.tanggal || '').split(' ')[0].split('T')[0];
                return prevDates.includes(trxDate);
            })
            .reduce((sum, t) => sum + Number(t.total_harga || 0), 0);

        // Ambang stabil mengikuti standar BE (5%)
        let persentase = null;
        let status = 'stabil';
        const ambangStabil = 5;

        if (totalSebelumnya === 0) {
            persentase = totalAktif > 0 ? null : 0;
            status = totalAktif > 0 ? 'naik' : 'stabil';
        } else {
            persentase = ((totalAktif - totalSebelumnya) / totalSebelumnya) * 100;
            if (Math.abs(persentase) < ambangStabil) {
                status = 'stabil';
            } else if (persentase > 0) {
                status = 'naik';
            } else {
                status = 'turun';
            }
        }

        let pctDisplay;
        if (persentase === null) {
            pctDisplay = '100%';
        } else {
            const absPct = Math.abs(persentase);
            pctDisplay = (absPct % 1 === 0 ? absPct.toFixed(0) : absPct.toFixed(1)) + '%';
        }

        return {
            period: '7_hari',
            labels,
            subLabels,
            values,
            subtitleText,
            totalAktif,
            totalSebelumnya,
            status,
            pctDisplay,
            adaData: totalAktif > 0
        };
    }

    /* [Card Tren Pemasukan] Frontend Developer (Faqih) - Helper format tanggal dari BE (YYYY-MM-DD) tanpa geseran zona waktu */
    function parseTanggalIso(str) {
        const parts = String(str || '').split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) {
            throw new Error('Format tanggal tren dari server tidak valid.');
        }
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    /* [Card Tren Pemasukan] Frontend Developer (Faqih) - Memetakan respons tren.php ke struktur yang dipakai updateTrenSummaryBox dan renderSvgLineChart */
    function mapTrenApiToTrendData(data, period) {
        const titik = Array.isArray(data && data.titik) ? data.titik : [];
        if (!titik.length) {
            throw new Error('Respons tren dari server tidak berisi titik data.');
        }

        const awalPeriode = parseTanggalIso(data.tanggal_awal);
        const values = titik.map(t => Number(t.total_pemasukan || 0));
        let labels = [];
        let subLabels = [];
        let subtitleText = '';

        if (period === '7_hari') {
            // BE mengirim nama hari berbahasa Inggris, jadi label dibuat dari tanggalnya
            titik.forEach(t => {
                const d = parseTanggalIso(t.tanggal_awal);
                labels.push(hariIndoList[(d.getDay() + 6) % 7]);
                subLabels.push(`${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`);
            });
            subtitleText = `Pemasukan per hari, ${subLabels[0]} - ${subLabels[subLabels.length - 1]}`;
        } else if (period === 'minggu') {
            titik.forEach(t => {
                const a = parseTanggalIso(t.tanggal_awal);
                const b = parseTanggalIso(t.tanggal_akhir);
                labels.push(t.label);
                subLabels.push(`${pad2(a.getDate())} - ${pad2(b.getDate())}`);
            });
            subtitleText = `Pemasukan per minggu, ${bulanNamaLengkap[awalPeriode.getMonth()]} ${awalPeriode.getFullYear()}`;
        } else {
            labels = titik.map((t, i) => bulanIndoList[i] || t.label);
            subLabels = titik.map(() => String(awalPeriode.getFullYear()));
            subtitleText = `Pemasukan per bulan, Tahun ${awalPeriode.getFullYear()}`;
        }

        // Persentase dan status (naik/turun/stabil) dihitung BE; ambang stabil mengikuti BE
        const persen = data.persentase_perubahan;
        let pctDisplay;
        if (persen === null || persen === undefined) {
            // BE mengirim null saat periode sebelumnya Rp0 dan periode aktif ada pemasukan
            pctDisplay = '100%';
        } else {
            const absPct = Math.abs(Number(persen));
            pctDisplay = (absPct % 1 === 0 ? absPct.toFixed(0) : absPct.toFixed(1)) + '%';
        }

        const status = ['naik', 'turun', 'stabil'].includes(data.status_tren)
            ? data.status_tren
            : 'stabil';

        return {
            period,
            labels,
            subLabels,
            values,
            subtitleText,
            totalAktif: Number(data.total_pemasukan || 0),
            totalSebelumnya: Number(data.total_periode_sebelumnya || 0),
            status,
            pctDisplay,
            adaData: data.ada_data !== undefined ? Boolean(data.ada_data) : values.some(v => Number(v) > 0)
        };
    }

    /* [Card Tren Pemasukan] Frontend Developer (Faqih) - Tampilan saat endpoint tren gagal, supaya tidak menampilkan grafik Rp0 yang menyesatkan */
    function renderTrenError(chartContainer) {
        chartContainer.innerHTML = '<div class="dashboard-empty-centered">Gagal memuat data tren pemasukan</div>';

        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        setText('trenPemasukanSubtitle', 'Data tren tidak dapat dimuat');
        setText('trenStatusRingkas', '-');
        setText('trenStatusSub', '');
        setText('trenTotalAktif', '-');
        setText('trenTotalSebelumnya', '');
        setText('trenHariTertinggi', '-');
        setText('trenHariTertinggiTanggal', '');
    }
/////////////////////////////////////////////////////////////
    function updateTrenSummaryBox(trendData, period) {
        // Subtitle header
        const subtitleEl = document.getElementById('trenPemasukanSubtitle');
        if (subtitleEl) subtitleEl.textContent = trendData.subtitleText;

        // Kotak Status 1: Naik / Turun / Stabil
        const statusCard = document.getElementById('trenStatusCard');
        const statusText = document.getElementById('trenStatusRingkas');
        const statusSub = document.getElementById('trenStatusSub');
        const badgeIcon = document.getElementById('trenBadgeIcon');

        let statusWord = 'Stabil';
        if (trendData.status === 'naik') statusWord = 'Naik';
        else if (trendData.status === 'turun') statusWord = 'Turun';

        if (statusText) statusText.textContent = `${statusWord} ${trendData.pctDisplay}`;

        let labelSub = 'dibanding periode sebelumnya';
        if (period === '7_hari') labelSub = 'dibanding 7 hari sebelumnya';
        else if (period === 'minggu') labelSub = 'dibanding bulan sebelumnya';
        else if (period === 'bulan') labelSub = 'dibanding tahun sebelumnya';
        if (statusSub) statusSub.textContent = labelSub;

        // Icon SVG yang sesuai persis Figma
        if (badgeIcon) {
            if (trendData.status === 'turun') {
                badgeIcon.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B42318" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                        <polyline points="17 18 23 18 23 12"></polyline>
                    </svg>
                `;
            } else if (trendData.status === 'naik') {
                badgeIcon.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E7B3B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                `;
            } else {
                badgeIcon.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17186B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                `;
            }
        }

        if (statusCard) {
            statusCard.className = `trend-summary-card trend-summary-status-box trend-${trendData.status}`;
        }

        // Kotak 2: Total Periode
        const labelTotal = document.getElementById('trenTotalLabel');
        const valTotal = document.getElementById('trenTotalAktif');
        const subTotal = document.getElementById('trenTotalSebelumnya');

        if (labelTotal) {
            if (period === '7_hari') labelTotal.textContent = 'Total 7 hari terakhir';
            else if (period === 'minggu') labelTotal.textContent = 'Total bulan ini';
            else labelTotal.textContent = 'Total tahun ini';
        }
        if (valTotal) valTotal.textContent = formatRupiah(trendData.totalAktif);
        if (subTotal) subTotal.textContent = `sebelumnya ${formatRupiah(trendData.totalSebelumnya)}`;

        // Kotak 3: Hari/Periode Tertinggi
        const valTertinggi = document.getElementById('trenHariTertinggi');
        const tglTertinggi = document.getElementById('trenHariTertinggiTanggal');

        if (trendData.values.length) {
            const maxVal = Math.max(...trendData.values);
            const maxIdx = trendData.values.indexOf(maxVal);

            if (valTertinggi) valTertinggi.textContent = formatRupiah(maxVal);
            if (tglTertinggi) {
                if (maxVal > 0) {
                    const lbl = trendData.labels[maxIdx] || '';
                    const subLbl = trendData.subLabels[maxIdx] || '';
                    tglTertinggi.textContent = `${lbl}${subLbl ? ', ' + subLbl : ''}`;
                } else {
                    tglTertinggi.textContent = 'Belum ada data';
                }
            }
        }
    }

    function renderSvgLineChart(container, trendData) {
        const labels = trendData.labels || [];
        const subLabels = trendData.subLabels || [];
        const values = trendData.values || [];

        // Cek apakah ada data transaksi pada periode yang dipilih (Skenario: Periode tanpa data)
        const hasData = (trendData.adaData !== undefined ? Boolean(trendData.adaData) : false) ||
                        values.some(v => Number(v) > 0) ||
                        Number(trendData.totalAktif || 0) > 0;

        if (!hasData) {
            container.innerHTML = '<div class="dashboard-empty-centered" id="trenEmptyState">Belum ada data untuk ditampilkan</div>';
            return;
        }

        const svgWidth = 800;
        const svgHeight = 220;
        const paddingLeft = 65;
        const paddingRight = 45;
        const paddingTop = 45;
        const paddingBottom = 45;

        const plotWidth = svgWidth - paddingLeft - paddingRight;
        const plotHeight = svgHeight - paddingTop - paddingBottom;
        const bottomY = paddingTop + plotHeight;

        const maxVal = Math.max(...values, 0);
        let ceiling = 600000;
        if (maxVal > 0) {
            const order = Math.pow(10, Math.floor(Math.log10(maxVal)));
            ceiling = Math.ceil((maxVal * 1.3) / order) * order;
        }

        const numSteps = Math.max(labels.length - 1, 1);
        const stepX = plotWidth / numSteps;

        // Koordinat titik
        const points = values.map((val, idx) => {
            const x = paddingLeft + (stepX * idx);
            const ratio = ceiling > 0 ? (val / ceiling) : 0;
            const y = bottomY - (ratio * plotHeight);
            return { x, y, val, label: labels[idx], subLabel: subLabels[idx] };
        });

        // 4 Garis Grid Horizontal
        let gridHtml = '';
        const gridLevels = [1, 2/3, 1/3, 0];
        gridLevels.forEach(lvl => {
            const valLevel = Math.round(ceiling * lvl);
            const yPos = bottomY - (lvl * plotHeight);
            gridHtml += `
                <line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="#ECEEF6" stroke-width="1" />
                <text x="${paddingLeft - 12}" y="${yPos + 4}" fill="#8F92A1" font-family="'Poppins', sans-serif" font-size="11" font-weight="500" text-anchor="end">${formatRupiahSingkat(valLevel)}</text>
            `;
        });

        let pointsHtml = '';
        let xAxisHtml = '';

        points.forEach((pt, idx) => {
            xAxisHtml += `
                <text x="${pt.x}" y="${svgHeight - 20}" fill="#1A1D2C" font-family="'Poppins', sans-serif" font-size="11.5" font-weight="600" text-anchor="middle">${escapeHtml(pt.label)}</text>
                <text x="${pt.x}" y="${svgHeight - 6}" fill="#8F92A1" font-family="'Poppins', sans-serif" font-size="10" font-weight="400" text-anchor="middle">${escapeHtml(pt.subLabel)}</text>
            `;

            pointsHtml += `
                <g class="chart-point" data-index="${idx}" tabindex="0" role="button" aria-label="${pt.label}: ${formatRupiah(pt.val)}">
                    <!-- Area klik/hover yang ramah kursor -->
                    <circle cx="${pt.x}" cy="${pt.y}" r="22" fill="transparent" class="chart-hit-area"></circle>
                    <circle cx="${pt.x}" cy="${pt.y}" r="4.5" fill="#FFFFFF" stroke="#17186B" stroke-width="2.5" class="chart-dot"></circle>
                </g>
            `;
        });

        const polylinePoints = points.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
        const polygonPoints = points.length ? `${polylinePoints} ${points[points.length - 1].x.toFixed(1)},${bottomY} ${points[0].x.toFixed(1)},${bottomY}` : '';

        // Template SVG Lengkap dengan Garis Putus-Putus & Halo Titik (Figma Image 3)
        container.innerHTML = `
            <svg id="trendSvgElement" viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%;height:auto;display:block;" role="img" aria-label="Grafik garis tren pemasukan">
                <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#17186B" stop-opacity="0.38" />
                        <stop offset="55%" stop-color="#17186B" stop-opacity="0.14" />
                        <stop offset="100%" stop-color="#17186B" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                <g class="chart-grid-lines">${gridHtml}</g>
                ${polygonPoints ? `<polygon points="${polygonPoints}" fill="url(#trendGradient)" />` : ''}
                <polyline class="chart-line" fill="none" stroke="#17186B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${polylinePoints}" />

                <!-- Tooltip group yang muncul saat hover atau diklik (Sesuai Kotak Merah Figma Image 3) -->
                <g id="chartActiveTooltipGroup" class="chart-active-tooltip" pointer-events="none" style="display: none; opacity: 0; transition: opacity 0.15s ease;">
                    <!-- Garis Titik-Titik Vertikal ke Bawah Menuju Label Hari -->
                    <line id="chartGuideLine" x1="0" y1="0" x2="0" y2="0" stroke="#A0A3BD" stroke-dasharray="4 4" stroke-width="1.5" />
                    <!-- Halo Lingkaran Luar Transparan -->
                    <circle id="chartActiveHalo" cx="0" cy="0" r="10" fill="rgba(23, 24, 107, 0.18)" />
                    <!-- Titik Tengah Solid Navy -->
                    <circle id="chartActiveDot" cx="0" cy="0" r="4.5" fill="#17186B" />

                    <!-- Badge Tooltip di Atas Titik -->
                    <g class="chart-tooltip-badge">
                        <rect id="chartTooltipRect" x="0" y="0" width="120" height="28" rx="6" ry="6" fill="#17186B" />
                        <polygon id="chartTooltipArrow" points="0,0 0,0 0,0" fill="#17186B" />
                        <text id="chartTooltipText" x="0" y="0" fill="#FFFFFF" font-family="'Poppins', sans-serif" font-size="11" font-weight="600" text-anchor="middle"></text>
                    </g>
                </g>

                <g class="chart-points">${pointsHtml}</g>
                <g class="chart-x-axis">${xAxisHtml}</g>
            </svg>
        `;

        const svgEl = container.querySelector('#trendSvgElement');
        const tooltipGroup = container.querySelector('#chartActiveTooltipGroup');
        const guideLine = container.querySelector('#chartGuideLine');
        const activeHalo = container.querySelector('#chartActiveHalo');
        const activeDot = container.querySelector('#chartActiveDot');
        const tooltipRect = container.querySelector('#chartTooltipRect');
        const tooltipArrow = container.querySelector('#chartTooltipArrow');
        const tooltipTextEl = container.querySelector('#chartTooltipText');
        const pointElements = container.querySelectorAll('.chart-point');

        let lockedIdx = null;

        function showTooltip(idx) {
            if (!points[idx]) return;
            const pt = points[idx];
            const text = `${pt.label}: ${formatRupiah(pt.val)}`;

            tooltipTextEl.textContent = text;
            const boxWidth = Math.max(text.length * 7.5 + 24, 120);
            const boxHeight = 28;
            let boxX = pt.x - (boxWidth / 2);
            if (boxX < 10) boxX = 10;
            if (boxX + boxWidth > svgWidth - 10) boxX = svgWidth - 10 - boxWidth;
            const boxY = Math.max(pt.y - boxHeight - 12, 6);

            // Garis vertikal putus-putus ke sumbu dasar bawah (Kotak Merah Figma Image 3)
            guideLine.setAttribute('x1', pt.x);
            guideLine.setAttribute('y1', pt.y);
            guideLine.setAttribute('x2', pt.x);
            guideLine.setAttribute('y2', bottomY);

            // Posisi lingkaran halo aktif
            activeHalo.setAttribute('cx', pt.x);
            activeHalo.setAttribute('cy', pt.y);
            activeDot.setAttribute('cx', pt.x);
            activeDot.setAttribute('cy', pt.y);

            // Posisi kotak badge
            tooltipRect.setAttribute('x', boxX);
            tooltipRect.setAttribute('y', boxY);
            tooltipRect.setAttribute('width', boxWidth);
            tooltipRect.setAttribute('height', boxHeight);

            // Panah penunjuk ke bawah
            const arrowY = boxY + boxHeight;
            tooltipArrow.setAttribute('points', `${pt.x - 5},${arrowY} ${pt.x + 5},${arrowY} ${pt.x},${arrowY + 5}`);

            tooltipTextEl.setAttribute('x', boxX + (boxWidth / 2));
            tooltipTextEl.setAttribute('y', boxY + 18);

            tooltipGroup.style.display = 'inline';
            tooltipGroup.style.opacity = '1';

            pointElements.forEach((el, i) => {
                el.classList.toggle('active', i === idx);
            });
        }

        function hideTooltip() {
            if (lockedIdx !== null) return;
            tooltipGroup.style.opacity = '0';
            tooltipGroup.style.display = 'none';
            pointElements.forEach(el => el.classList.remove('active'));
        }

        // Interaksi Hover dan Klik pada Titik Grafik (Sesuai Permintaan User)
        pointElements.forEach(pointEl => {
            const idx = parseInt(pointEl.dataset.index, 10);

            pointEl.addEventListener('mouseenter', () => {
                showTooltip(idx);
            });

            pointEl.addEventListener('focus', () => {
                showTooltip(idx);
            });

            // Klik titik: kunci garis titik-titik dan tooltip pada titik tersebut
            pointEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (lockedIdx === idx) {
                    lockedIdx = null;
                    tooltipGroup.style.opacity = '0';
                    tooltipGroup.style.display = 'none';
                    pointElements.forEach(el => el.classList.remove('active'));
                } else {
                    lockedIdx = idx;
                    showTooltip(idx);
                }
            });
        });

        if (svgEl) {
            svgEl.addEventListener('mouseleave', () => {
                if (lockedIdx !== null) {
                    showTooltip(lockedIdx);
                } else {
                    hideTooltip();
                }
            });
        }

        // Klik di luar grafik untuk melepas kunci titik
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                lockedIdx = null;
                tooltipGroup.style.opacity = '0';
                tooltipGroup.style.display = 'none';
                pointElements.forEach(el => el.classList.remove('active'));
            }
        });
    }

    // ========================================
    // BAGIAN: LAYANAN TERLARIS
    // ========================================

    async function loadLayananTerlaris(period = 'minggu', sort = 'terbanyak') {
        state.layananPeriode = period;
        state.layananSort = sort;

        const container = document.getElementById('layananPopulerListContainer');
        const headEl = document.getElementById('layananTableHead');
        const footerEl = document.getElementById('layananTerlarisFooter');
        const footerTotal = document.getElementById('layananTotalTerjual');
        if (!container) return;

        try {
            // Tampilan State Memuat (Sesuai Figma Image 2)
            if (headEl) headEl.style.display = 'grid';
            if (footerEl) footerEl.style.display = 'flex';
            if (footerTotal) footerTotal.textContent = 'Total layanan terjual: -';

            container.innerHTML = `
                <div class="dashboard-loading-box box-layanan">
                    <div class="dashboard-spinner spinner-lg"></div>
                    <span>Memuat data layanan...</span>
                </div>
            `;

            const data = await fetchApi(`${dashboardApiUrl}?periode=${encodeURIComponent(period)}&tanggal=${getTodayString()}&limit=20`);
            let services = Array.isArray(data.layanan_populer) ? [...data.layanan_populer] : [];

            // Pengurutan Paling Sering vs Paling Jarang
            services.sort((a, b) => {
                const countA = Number(a.jumlah_terjual || 0);
                const countB = Number(b.jumlah_terjual || 0);
                return sort === 'terbanyak' ? (countB - countA) : (countA - countB);
            });

            const totalTerjual = services.reduce((acc, curr) => acc + Number(curr.jumlah_terjual || 0), 0);

            // Empty State: tampilkan pesan di tengah (sesuai Figma Image 3)
            if (!services.length || totalTerjual === 0) {
                if (headEl) headEl.style.display = 'grid';
                if (footerEl) footerEl.style.display = 'flex';
                if (footerTotal) footerTotal.textContent = 'Total layanan terjual: -';
                container.innerHTML = '<div class="dashboard-empty-centered">Belum ada layanan populer periode ini</div>';
                return;
            }

            // Normal State dengan Data Tersedia
            if (headEl) headEl.style.display = 'grid';
            if (footerEl) footerEl.style.display = 'flex';
            if (footerTotal) footerTotal.textContent = `Total layanan terjual: ${totalTerjual}`;

            const maxTerjual = Math.max(...services.map(s => Number(s.jumlah_terjual || 0)), 1);

            container.innerHTML = services.slice(0, 5).map((item, index) => {
                const count = Number(item.jumlah_terjual || 0);
                const pct = Math.max((count / maxTerjual) * 100, 4);
                return `
                    <div class="layanan-item-row">
                        <span class="layanan-row-no">${index + 1}</span>
                        <span class="layanan-row-name" title="${escapeHtml(item.nama_layanan)}">${escapeHtml(item.nama_layanan)}</span>
                        <div class="layanan-row-track">
                            <div class="layanan-row-bar" style="width: ${pct}%"></div>
                        </div>
                        <span class="layanan-row-val">${count}</span>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loadLayananTerlaris:', error);
            if (headEl) headEl.style.display = 'grid';
            if (footerEl) footerEl.style.display = 'flex';
            if (footerTotal) footerTotal.textContent = 'Total layanan terjual: -';
            container.innerHTML = '<div class="dashboard-empty-centered">Belum ada layanan populer periode ini</div>';
        }
    }

    // ========================================
    // BAGIAN: DISTRIBUSI PEMBAYARAN
    // ========================================

    function renderDistribusiPembayaran(items, totalTransaksi, isLoading = false) {
        const contentEl = document.getElementById('paymentChartContent');
        const emptyEl = document.getElementById('paymentEmptyState');
        const loadingEl = document.getElementById('paymentLoadingState');
        const donutEl = document.getElementById('dashboardPaymentDonut');
        const jumlahTrxEl = document.getElementById('dashboardJumlahTransaksi');

        // State Memuat (Sesuai Figma Image 2)
        if (isLoading) {
            if (contentEl) contentEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'none';
            if (loadingEl) loadingEl.style.display = 'flex';
            return;
        }

        if (loadingEl) loadingEl.style.display = 'none';

        const map = {
            cash: { jumlah_transaksi: 0, total_pemasukan: 0 },
            transfer: { jumlah_transaksi: 0, total_pemasukan: 0 },
            qris: { jumlah_transaksi: 0, total_pemasukan: 0 }
        };

        if (Array.isArray(items)) {
            items.forEach(item => {
                if (map[item.metode]) {
                    map[item.metode] = item;
                }
            });
        }

        const cashTrx = Number(map.cash.jumlah_transaksi || 0);
        const cashNom = Number(map.cash.total_pemasukan || 0);

        const qrisTrx = Number(map.qris.jumlah_transaksi || 0);
        const qrisNom = Number(map.qris.total_pemasukan || 0);

        const transferTrx = Number(map.transfer.jumlah_transaksi || 0);
        const transferNom = Number(map.transfer.total_pemasukan || 0);

        const grandTotalTrx = cashTrx + qrisTrx + transferTrx;

        // Empty State Distribusi Pembayaran (Sesuai Figma Image 1)
        if (grandTotalTrx === 0) {
            if (contentEl) contentEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'flex';
            return;
        }

        // Tampilkan Konten Grafik Donat & Legend
        if (emptyEl) emptyEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';

        // Update nilai tengah donut
        if (jumlahTrxEl) {
            jumlahTrxEl.textContent = String(grandTotalTrx);
        }

        // Update Legend
        const elCashTrx = document.getElementById('legendCashTrx');
        const elCashNom = document.getElementById('legendCashNominal');
        if (elCashTrx) elCashTrx.textContent = String(cashTrx);
        if (elCashNom) elCashNom.textContent = formatRupiah(cashNom);

        const elQrisTrx = document.getElementById('legendQrisTrx');
        const elQrisNom = document.getElementById('legendQrisNominal');
        if (elQrisTrx) elQrisTrx.textContent = String(qrisTrx);
        if (elQrisNom) elQrisNom.textContent = formatRupiah(qrisNom);

        const elTransferTrx = document.getElementById('legendTransferTrx');
        const elTransferNom = document.getElementById('legendTransferNominal');
        if (elTransferTrx) elTransferTrx.textContent = String(transferTrx);
        if (elTransferNom) elTransferNom.textContent = formatRupiah(transferNom);

        // Fallback
        const oldCash = document.getElementById('legendCash');
        const oldTransfer = document.getElementById('legendTransfer');
        const oldQris = document.getElementById('legendQris');
        if (oldCash) oldCash.textContent = `(${cashTrx} trx) ${formatRupiah(cashNom)}`;
        if (oldTransfer) oldTransfer.textContent = `(${transferTrx} trx) ${formatRupiah(transferNom)}`;
        if (oldQris) oldQris.textContent = `(${qrisTrx} trx) ${formatRupiah(qrisNom)}`;

        if (!donutEl) return;

        const pCash = (cashTrx / grandTotalTrx) * 100;
        const pTransfer = (transferTrx / grandTotalTrx) * 100;
        const pQris = (qrisTrx / grandTotalTrx) * 100;

        const endCash = pCash;
        const endTransfer = endCash + pTransfer;

        donutEl.style.background = `conic-gradient(
            #17186B 0% ${endCash}%,
            #A5B4FC ${endCash}% ${endTransfer}%,
            #CFEDDF ${endTransfer}% 100%
        )`;
    }

    // ========================================
    // BAGIAN: PERMINTAAN RESET PASSWORD
    // ========================================

    function initResetPasswordSection() {
        const emptyWrap = document.getElementById('resetEmptyWrap');
        const cardBody = document.getElementById('resetCardBody');
        const loadingEl = document.getElementById('resetLoadingState');
        const userNameEl = document.getElementById('resetUserName');
        const btnReset = document.getElementById('btnActionResetPassword');

        // Fungsi kontrol tampilan: kosong vs ada permintaan
        function renderResetStatus(requestUser = null) {
            if (!emptyWrap || !cardBody) return;

            if (loadingEl) loadingEl.style.display = 'none';

            if (requestUser && (requestUser.nama || requestUser.username)) {
                // Ada permintaan: sembunyikan tulisan kosong & tampilkan user + tombol reset
                emptyWrap.style.display = 'none';
                cardBody.style.display = 'flex';
                if (userNameEl) {
                    userNameEl.textContent = requestUser.nama || requestUser.username || 'Barber';
                    userNameEl.dataset.userId = requestUser.id_user || '';
                }
            } else {
                // Tidak ada permintaan: tampilkan garis pemisah & tulisan "Belum ada permintaan password"
                emptyWrap.style.display = 'block';
                cardBody.style.display = 'none';
            }
        }

        // Cek antrean permintaan reset password secara otomatis
        function checkCurrentResetRequest() {
            const savedRequest = localStorage.getItem('kataji:reset-request');
            if (savedRequest) {
                try {
                    const parsed = JSON.parse(savedRequest);
                    if (parsed && (parsed.nama || parsed.username)) {
                        renderResetStatus(parsed);
                        return;
                    }
                } catch (e) {}
            }
            // Kondisi default riil: tidak ada permintaan password
            renderResetStatus(null);
        }

        if (loadingEl) loadingEl.style.display = 'flex';
        window.setTimeout(checkCurrentResetRequest, 250);

        // Handler tombol Reset Password
        if (btnReset) {
            btnReset.addEventListener('click', async function () {
                const targetName = userNameEl ? userNameEl.textContent.trim() : 'Barber';
                const userId = userNameEl ? userNameEl.dataset.userId : null;

                const newPassword = window.prompt(
                    `Masukkan password baru untuk ${targetName} (minimal 6 karakter):`,
                    ''
                );

                if (newPassword === null) return;

                if (!newPassword || newPassword.trim().length < 6) {
                    alert('Password baru wajib diisi dan minimal 6 karakter.');
                    return;
                }

                try {
                    btnReset.disabled = true;
                    btnReset.textContent = 'Memproses...';

                    if (userId) {
                        const response = await fetch('/KELOMPOK-5/api/barber/reset_password.php', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id_user: parseInt(userId, 10),
                                password_baru: newPassword.trim()
                            })
                        });

                        const result = await response.json();
                        if (!response.ok || !result.success) {
                            throw new Error(result.message || 'Gagal mereset password.');
                        }
                    }

                    alert(`Password untuk ${targetName} berhasil direset!`);
                    localStorage.removeItem('kataji:reset-request');
                    renderResetStatus(null); // Otomatis kembali ke tulisan "Belum ada permintaan password"
                } catch (err) {
                    console.error('Error saat reset password:', err);
                    alert(err.message || 'Terjadi kesalahan saat memproses reset password.');
                } finally {
                    btnReset.disabled = false;
                    btnReset.textContent = 'Reset Password';
                }
            });
        }

        // Event listener saat ada request baru dari tab lain
        window.addEventListener('kataji:reset-requested', function (e) {
            renderResetStatus(e.detail || null);
        });

        window.addEventListener('storage', function (e) {
            if (e.key === 'kataji:reset-request') {
                checkCurrentResetRequest();
            }
        });

        // Helper global untuk simulasi / testing request
        window.simulasiRequestReset = function (nama = 'Erik') {
            const req = { nama: nama, waktu: new Date().toISOString() };
            localStorage.setItem('kataji:reset-request', JSON.stringify(req));
            renderResetStatus(req);
            console.log(`[Kataji] Permintaan reset password untuk "${nama}" aktif.`);
        };

        window.bersihkanRequestReset = function () {
            localStorage.removeItem('kataji:reset-request');
            renderResetStatus(null);
            console.log('[Kataji] Permintaan reset password dibersihkan.');
        };
    }

    // ========================================
    // BAGIAN: EVENT LISTENER & KONTROL UI
    // ========================================

    // 1. Filter Rekap Keuangan
    document.querySelectorAll('.periode-pemasukan-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.periode-pemasukan-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-pressed', 'true');
            loadRekapKeuangan(this.dataset.period);
        });
    });

    // 2. Filter Tren Pemasukan (Pill Group)
    document.querySelectorAll('.trend-pill-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.trend-pill-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const period = this.dataset.period;
            const selectEl = document.getElementById('trenPemasukanPeriode');
            if (selectEl) selectEl.value = period;

            loadTrenPemasukan(period);
        });
    });

    // 3. Filter Periode Layanan Terlaris
    document.querySelectorAll('.layanan-period-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.layanan-period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadLayananTerlaris(this.dataset.period, state.layananSort);
        });
    });

    // 4. Sort Layanan Terlaris (Paling Sering / Paling Jarang)
    document.querySelectorAll('.layanan-sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.layanan-sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.layananSort = this.dataset.sort;
            loadLayananTerlaris(state.layananPeriode, state.layananSort);
        });
    });

    // ========================================
    // BAGIAN: INITIAL LOAD & AUTO SINKRONISASI
    // ========================================

    async function refreshAllDashboardData() {
        renderDistribusiPembayaran([], 0, true);
        await loadAllTransactions();
        loadRingkasanHarian();
        loadRekapKeuangan(state.rekapPeriode);
        loadTrenPemasukan(state.trenPeriode);
        loadLayananTerlaris(state.layananPeriode, state.layananSort);
    }

    // Load awal saat halaman dibuka
    refreshAllDashboardData();
    initResetPasswordSection();

    // Refresh saat tab kembali aktif
    window.addEventListener('focus', refreshAllDashboardData);

    // Refresh otomatis ketika data berubah di halaman lain
    window.addEventListener('storage', function (e) {
        if (e.key === 'kataji:data-changed') {
            refreshAllDashboardData();
        }
    });

    window.addEventListener('kataji:data-changed', refreshAllDashboardData);
});
