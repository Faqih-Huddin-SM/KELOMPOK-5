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
        try {
            const data = await fetchApi(`${dashboardApiUrl}?periode=hari&tanggal=${getTodayString()}`);
            
            // 1. Pelanggan Hari Ini
            const elPelanggan = document.getElementById('dashPelangganHariIni');
            if (elPelanggan) elPelanggan.textContent = String(Number(data.jumlah_pelanggan || 0));

            // 2. Transaksi Hari Ini
            const elTransaksi = document.getElementById('dashTransaksiHariIni');
            if (elTransaksi) elTransaksi.textContent = String(Number(data.jumlah_transaksi || 0));

            // 3. Pemasukan Hari Ini
            const elPemasukan = document.getElementById('dashPendapatanHariIni');
            if (elPemasukan) elPemasukan.textContent = formatRupiah(data.keuangan?.pemasukan || 0);

            // 4. Laba Kotor Hari Ini
            const elLabaKotor = document.getElementById('dashLabaKotorHariIni');
            if (elLabaKotor) elLabaKotor.textContent = formatRupiah(data.keuangan?.laba_kotor || 0);

        } catch (error) {
            console.error('Error loadRingkasanHarian:', error);
        }
    }

    // ========================================
    // BAGIAN: REKAP KEUANGAN & PEMASUKAN PER BARBER
    // ========================================

    async function loadRekapKeuangan(period = 'minggu') {
        state.rekapPeriode = period;
        try {
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

            // Distribusi pembayaran disinkronkan dengan periode rekap keuangan
            renderDistribusiPembayaran(data.pembayaran || [], data.jumlah_transaksi || 0);

            // Pemasukan per barber disinkronkan dengan periode yang sama
            renderPemasukanPerBarber(period);

        } catch (error) {
            console.error('Error loadRekapKeuangan:', error);
        }
    }

    function renderPemasukanPerBarber(period = 'minggu') {
        const statusEl = document.getElementById('statusPemasukan');
        const wrapperEl = document.getElementById('tabelPemasukanWrapper');
        const bodyEl = document.getElementById('tabelPemasukanBody');

        if (!statusEl || !wrapperEl || !bodyEl) return;

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
        const filteredTrx = state.allTransactions.filter(trx => {
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

        if (!barberList.length) {
            statusEl.textContent = 'Belum ada transaksi barber pada periode ini';
            statusEl.hidden = false;
            wrapperEl.hidden = true;
            bodyEl.replaceChildren();
            return;
        }

        statusEl.hidden = true;
        wrapperEl.hidden = false;

        bodyEl.innerHTML = barberList.map(item => `
            <tr>
                <td class="td-barber-nama">${escapeHtml(item.nama)}</td>
                <td class="td-barber-trx text-center">${Number(item.transaksi)}</td>
                <td class="td-barber-total text-start">${formatRupiah(item.total)}</td>
            </tr>
        `).join('');
    }

    // ========================================
    // BAGIAN: GRAFIK TREN PEMASUKAN
    // ========================================

    async function loadTrenPemasukan(period = '7_hari') {
        state.trenPeriode = period;
        const chartContainer = document.getElementById('dashboardLineChart');
        if (!chartContainer) return;

        try {
            const trendData = calculateTrendData(period);
            updateTrenSummaryBox(trendData, period);
            renderSvgLineChart(chartContainer, trendData);
        } catch (error) {
            console.error('Error loadTrenPemasukan:', error);
            chartContainer.innerHTML = '<div class="chart-empty-state">Grafik pemasukan gagal dimuat.</div>';
        }
    }

    function calculateTrendData(period) {
        const now = getToday();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let labels = [];
        let subLabels = [];
        let values = [];
        let subtitleText = '';
        let totalAktif = 0;
        let totalSebelumnya = 0;

        if (period === '7_hari') {
            // Dimulai dari hari SENIN dan diakhiri hari MINGGU (Senin s.d Minggu)
            const dayOfWeek = now.getDay();
            const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            const monday = new Date(now);
            monday.setDate(now.getDate() + diffToMonday);
            monday.setHours(0, 0, 0, 0);

            // Hitung minggu sebelumnya untuk pembanding
            const prevMonday = new Date(monday);
            prevMonday.setDate(monday.getDate() - 7);
            const prevSunday = new Date(monday);
            prevSunday.setDate(monday.getDate() - 1);
            prevSunday.setHours(23, 59, 59, 999);

            const dates = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                dates.push({ date: d, strDate: str, dayName: hariIndoList[i] });
                labels.push(hariIndoList[i]);
                subLabels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
            }

            const sunday = dates[6].date;
            subtitleText = `Pemasukan per hari, ${subLabels[0]} - ${subLabels[6]}`;

            // Pemasukan per hari
            values = dates.map(item => {
                const sum = state.allTransactions
                    .filter(t => t.tanggal === item.strDate)
                    .reduce((acc, t) => acc + Number(t.total_harga || 0), 0);
                totalAktif += sum;
                return sum;
            });

            // Total minggu sebelumnya
            totalSebelumnya = state.allTransactions
                .filter(t => {
                    const td = new Date(t.tanggal + 'T00:00:00');
                    return td >= prevMonday && td <= prevSunday;
                })
                .reduce((acc, t) => acc + Number(t.total_harga || 0), 0);

        } else if (period === 'minggu') {
            // Dimulai dari awal bulan tanggal 1 (Minggu 1, Minggu 2, Minggu 3, Minggu 4)
            labels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
            subLabels = ['01 - 07', '08 - 14', '15 - 21', '22 - Akhir'];
            subtitleText = `Pemasukan per minggu, ${bulanNamaLengkap[currentMonth]} ${currentYear}`;

            const m1 = state.allTransactions.filter(t => {
                const td = new Date(t.tanggal + 'T00:00:00');
                return td.getFullYear() === currentYear && td.getMonth() === currentMonth && td.getDate() >= 1 && td.getDate() <= 7;
            }).reduce((acc, t) => acc + Number(t.total_harga || 0), 0);

            const m2 = state.allTransactions.filter(t => {
                const td = new Date(t.tanggal + 'T00:00:00');
                return td.getFullYear() === currentYear && td.getMonth() === currentMonth && td.getDate() >= 8 && td.getDate() <= 14;
            }).reduce((acc, t) => acc + Number(t.total_harga || 0), 0);

            const m3 = state.allTransactions.filter(t => {
                const td = new Date(t.tanggal + 'T00:00:00');
                return td.getFullYear() === currentYear && td.getMonth() === currentMonth && td.getDate() >= 15 && td.getDate() <= 21;
            }).reduce((acc, t) => acc + Number(t.total_harga || 0), 0);

            const m4 = state.allTransactions.filter(t => {
                const td = new Date(t.tanggal + 'T00:00:00');
                return td.getFullYear() === currentYear && td.getMonth() === currentMonth && td.getDate() >= 22;
            }).reduce((acc, t) => acc + Number(t.total_harga || 0), 0);

            values = [m1, m2, m3, m4];
            totalAktif = m1 + m2 + m3 + m4;

            // Bulan sebelumnya untuk pembanding
            const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
            totalSebelumnya = state.allTransactions.filter(t => {
                const td = new Date(t.tanggal + 'T00:00:00');
                return td.getFullYear() === prevMonthDate.getFullYear() && td.getMonth() === prevMonthDate.getMonth();
            }).reduce((acc, t) => acc + Number(t.total_harga || 0), 0);

        } else if (period === 'bulan') {
            // Dimulai dari JANUARI dan diakhiri DESEMBER (12 Bulan)
            labels = [...bulanIndoList];
            subLabels = Array(12).fill(String(currentYear));
            subtitleText = `Pemasukan per bulan, Tahun ${currentYear}`;

            values = [];
            for (let m = 0; m < 12; m++) {
                const sum = state.allTransactions.filter(t => {
                    const td = new Date(t.tanggal + 'T00:00:00');
                    return td.getFullYear() === currentYear && td.getMonth() === m;
                }).reduce((acc, t) => acc + Number(t.total_harga || 0), 0);
                values.push(sum);
                totalAktif += sum;
            }

            // Tahun sebelumnya untuk pembanding
            totalSebelumnya = state.allTransactions.filter(t => {
                const td = new Date(t.tanggal + 'T00:00:00');
                return td.getFullYear() === (currentYear - 1);
            }).reduce((acc, t) => acc + Number(t.total_harga || 0), 0);
        }

        // Hitung persentase dan status tren (Naik / Turun / Stabil)
        let status = 'stabil';
        let pctDisplay = '0%';

        if (totalSebelumnya === 0) {
            if (totalAktif > 0) {
                status = 'naik';
                pctDisplay = '100%';
            } else {
                status = 'stabil';
                pctDisplay = '0%';
            }
        } else {
            const diff = totalAktif - totalSebelumnya;
            const pct = (diff / totalSebelumnya) * 100;
            const absPct = Math.abs(pct);
            pctDisplay = (absPct % 1 === 0 ? absPct.toFixed(0) : absPct.toFixed(1)) + '%';

            if (absPct < 5) {
                status = 'stabil';
            } else if (pct > 0) {
                status = 'naik';
            } else {
                status = 'turun';
            }
        }

        return {
            period,
            labels,
            subLabels,
            values,
            subtitleText,
            totalAktif,
            totalSebelumnya,
            status,
            pctDisplay
        };
    }

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

        const svgWidth = 800;
        const svgHeight = 220;
        const paddingLeft = 65;
        const paddingRight = 45;
        const paddingTop = 45;
        const paddingBottom = 45;

        const plotWidth = svgWidth - paddingLeft - paddingRight;
        const plotHeight = svgHeight - paddingTop - paddingBottom;

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
            const y = (paddingTop + plotHeight) - (ratio * plotHeight);
            return { x, y, val, label: labels[idx], subLabel: subLabels[idx] };
        });

        // 4 Garis Grid Horizontal
        let gridHtml = '';
        const gridLevels = [1, 2/3, 1/3, 0];
        gridLevels.forEach(lvl => {
            const valLevel = Math.round(ceiling * lvl);
            const yPos = (paddingTop + plotHeight) - (lvl * plotHeight);
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
                    <!-- Hit area kursor 20px -->
                    <circle cx="${pt.x}" cy="${pt.y}" r="20" fill="transparent" class="chart-hit-area"></circle>
                    <circle cx="${pt.x}" cy="${pt.y}" r="4.5" fill="#FFFFFF" stroke="#17186B" stroke-width="2.5" class="chart-dot"></circle>
                </g>
            `;
        });

        const bottomY = paddingTop + plotHeight;
        const polylinePoints = points.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
        const polygonPoints = points.length ? `${polylinePoints} ${points[points.length - 1].x.toFixed(1)},${bottomY} ${points[0].x.toFixed(1)},${bottomY}` : '';

        // Tooltip default TERSEMBUNYI (hanya muncul saat kursor diarahkan sesuai permintaan user)
        container.innerHTML = `
            <svg id="trendSvgElement" viewBox="0 0 ${svgWidth} ${svgHeight}" style="width:100%;height:auto;display:block;" role="img" aria-label="Grafik garis tren pemasukan">
                <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#17186B" stop-opacity="0.30" />
                        <stop offset="60%" stop-color="#17186B" stop-opacity="0.10" />
                        <stop offset="100%" stop-color="#17186B" stop-opacity="0.0" />
                    </linearGradient>
                </defs>
                <g class="chart-grid-lines">${gridHtml}</g>
                ${polygonPoints ? `<polygon points="${polygonPoints}" fill="url(#trendGradient)" />` : ''}
                <polyline class="chart-line" fill="none" stroke="#17186B" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${polylinePoints}" />
                <!-- Tooltip group yang hanya muncul saat hover -->
                <g id="chartActiveTooltipGroup" class="chart-active-tooltip" pointer-events="none" style="display: none; opacity: 0; transition: opacity 0.15s ease;">
                    <line id="chartGuideLine" x1="0" y1="0" x2="0" y2="0" stroke="#17186B" stroke-dasharray="4 4" stroke-width="1.5" opacity="0.4" />
                    <g class="chart-tooltip-badge">
                        <rect id="chartTooltipRect" x="0" y="0" width="120" height="28" rx="6" ry="6" fill="#17186B" />
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
        const tooltipRect = container.querySelector('#chartTooltipRect');
        const tooltipTextEl = container.querySelector('#chartTooltipText');
        const pointElements = container.querySelectorAll('.chart-point');

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

            guideLine.setAttribute('x1', pt.x);
            guideLine.setAttribute('y1', boxY + boxHeight);
            guideLine.setAttribute('x2', pt.x);
            guideLine.setAttribute('y2', pt.y);

            tooltipRect.setAttribute('x', boxX);
            tooltipRect.setAttribute('y', boxY);
            tooltipRect.setAttribute('width', boxWidth);
            tooltipRect.setAttribute('height', boxHeight);

            tooltipTextEl.setAttribute('x', boxX + (boxWidth / 2));
            tooltipTextEl.setAttribute('y', boxY + 18);

            tooltipGroup.style.display = 'inline';
            tooltipGroup.style.opacity = '1';

            pointElements.forEach((el, i) => {
                el.classList.toggle('active', i === idx);
            });
        }

        function hideTooltip() {
            tooltipGroup.style.opacity = '0';
            tooltipGroup.style.display = 'none';
            pointElements.forEach(el => el.classList.remove('active'));
        }

        // Event hover kursor
        pointElements.forEach(pointEl => {
            pointEl.addEventListener('mouseenter', () => {
                const idx = parseInt(pointEl.dataset.index, 10);
                showTooltip(idx);
            });
            pointEl.addEventListener('focus', () => {
                const idx = parseInt(pointEl.dataset.index, 10);
                showTooltip(idx);
            });
        });

        if (svgEl) {
            svgEl.addEventListener('mouseleave', hideTooltip);
        }
    }

    // ========================================
    // BAGIAN: LAYANAN TERLARIS
    // ========================================

    async function loadLayananTerlaris(period = 'minggu', sort = 'terbanyak') {
        state.layananPeriode = period;
        state.layananSort = sort;

        const container = document.getElementById('layananPopulerListContainer');
        const footerTotal = document.getElementById('layananTotalTerjual');
        if (!container) return;

        try {
            container.innerHTML = '<div class="layanan-populer-empty">Memuat data layanan...</div>';

            const data = await fetchApi(`${dashboardApiUrl}?periode=${encodeURIComponent(period)}&tanggal=${getTodayString()}&limit=20`);
            let services = Array.isArray(data.layanan_populer) ? [...data.layanan_populer] : [];

            // Pengurutan Paling Sering vs Paling Jarang
            services.sort((a, b) => {
                const countA = Number(a.jumlah_terjual || 0);
                const countB = Number(b.jumlah_terjual || 0);
                return sort === 'terbanyak' ? (countB - countA) : (countA - countB);
            });

            // Hitung total layanan terjual
            const totalTerjual = services.reduce((acc, curr) => acc + Number(curr.jumlah_terjual || 0), 0);
            if (footerTotal) {
                footerTotal.textContent = `Total layanan terjual: ${totalTerjual}`;
            }

            if (!services.length) {
                container.innerHTML = '<div class="layanan-populer-empty">Belum ada data layanan pada periode ini</div>';
                return;
            }

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
            container.innerHTML = '<div class="layanan-populer-empty">Data layanan gagal dimuat.</div>';
        }
    }

    // ========================================
    // BAGIAN: DISTRIBUSI PEMBAYARAN
    // ========================================

    function renderDistribusiPembayaran(items, totalTransaksi) {
        const donutEl = document.getElementById('dashboardPaymentDonut');
        const jumlahTrxEl = document.getElementById('dashboardJumlahTransaksi');

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

        // Render warna donat menggunakan CSS conic-gradient
        if (!donutEl) return;

        if (grandTotalTrx === 0) {
            donutEl.style.background = '#E8EAF2';
            return;
        }

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
        const btnReset = document.getElementById('btnActionResetPassword');
        const userName = document.getElementById('resetUserName');

        if (btnReset) {
            btnReset.addEventListener('click', function () {
                const targetName = userName ? userName.textContent : 'User';
                const confirmed = window.confirm(`Apakah Anda yakin ingin memproses reset password untuk ${targetName}?`);
                if (confirmed) {
                    alert(`Permintaan reset password untuk ${targetName} telah diproses.`);
                }
            });
        }
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
