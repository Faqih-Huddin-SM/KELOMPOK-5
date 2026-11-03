
document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.pemasukan-page')) return;

    const API_URL = '/KELOMPOK-5/api/rekap/pemasukan.php';
    const API_TRANSAKSI = '/KELOMPOK-5/api/transaksi/index.php';

    const tombolPeriode = document.querySelectorAll('.periode-pemasukan-btn');
    const tanggalInput = document.getElementById('tanggalPemasukan');
    const filterTanggal = document.getElementById('filterTanggalPemasukan');
    const totalElement = document.getElementById('totalPemasukan');
    const statusElement = document.getElementById('statusPemasukan');
    const tabelWrapper = document.getElementById('tabelPemasukanWrapper');
    const tabelBody = document.getElementById('tabelPemasukanBody');

    if (!totalElement || !statusElement || !tabelBody) {
        console.error('Elemen halaman pemasukan belum lengkap.');
        return;
    }

    function tanggalLokal(tanggal = new Date()) {
        const tahun = tanggal.getFullYear();
        const bulan = String(tanggal.getMonth() + 1).padStart(2, '0');
        const hari = String(tanggal.getDate()).padStart(2, '0');
        return `${tahun}-${bulan}-${hari}`;
    }

    function formatRupiah(nominal) {
        return 'Rp' + Number(nominal || 0).toLocaleString('id-ID', {
            maximumFractionDigits: 0
        });
    }

    function buatSel(teks) {
        const sel = document.createElement('td');
        sel.textContent = teks;
        return sel;
    }

    function tanggalDariStringISO(value) {
        return new Date(`${value}T00:00:00`);
    }

    function mulaiMinggu(tanggal) {
        const mulai = new Date(tanggal);
        const hari = mulai.getDay();
        mulai.setDate(mulai.getDate() - (hari === 0 ? 6 : hari - 1));
        return mulai;
    }

    async function muatRekapTanggal(tanggal, periode = 'hari') {
        const params = new URLSearchParams({
            periode,
            tanggal
        });
        const response = await fetch(
            `${API_URL}?${params.toString()}`,
            {
                method: 'GET',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            }
        );
        const hasil = await response.json();

        if (!response.ok || hasil.success !== true || !hasil.data) {
            throw new Error(hasil.message || 'Gagal memuat data pemasukan.');
        }

        return hasil.data;
    }

    async function muatSemuaPemasukan() {
        const response = await fetch(API_TRANSAKSI, {
            method: 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        const hasil = await response.json();

        if (!response.ok || hasil.success !== true) {
            throw new Error(hasil.message || 'Gagal memuat semua transaksi.');
        }

        const transaksi = Array.isArray(hasil.data) ? hasil.data : [];
        const perBarber = new Map();
        let total = 0;

        transaksi.forEach((item) => {
            const nominal = Number(item.total_harga) || 0;
            const nama = item.nama_barber || 'Tidak diketahui';
            total += nominal;
            perBarber.set(nama, (perBarber.get(nama) || 0) + nominal);
        });

        return {
            total_pemasukan: total,
            rincian_per_barber: Array.from(perBarber, ([nama_barber, total_pemasukan]) => ({
                nama_barber,
                total_pemasukan
            }))
        };
    }

    function gabungkanRekap(rekapHarian) {
        const perBarber = new Map();
        let total = 0;

        rekapHarian.forEach((data) => {
            total += Number(data.total_pemasukan) || 0;
            const rincian = Array.isArray(data.rincian_per_barber)
                ? data.rincian_per_barber
                : [];

            rincian.forEach((barber) => {
                const nama = barber.nama_barber || 'Tidak diketahui';
                const lama = perBarber.get(nama) || 0;
                perBarber.set(nama, lama + (Number(barber.total_pemasukan) || 0));
            });
        });

        return {
            total_pemasukan: total,
            rincian_per_barber: Array.from(perBarber, ([nama_barber, total_pemasukan]) => ({
                nama_barber,
                total_pemasukan
            }))
        };
    }

    async function muatRentangTanggal(tanggalAwal, tanggalAkhir) {
        const mulai = tanggalDariStringISO(tanggalAwal);
        const akhir = tanggalDariStringISO(tanggalAkhir);
        const daftarTanggal = [];

        for (let tanggal = new Date(mulai); tanggal <= akhir; tanggal.setDate(tanggal.getDate() + 1)) {
            daftarTanggal.push(tanggalLokal(tanggal));
        }

        const rekap = await Promise.all(daftarTanggal.map(muatRekapTanggal));
        return gabungkanRekap(rekap);
    }

    async function muatPemasukan(periode) {
        statusElement.hidden = false;
        statusElement.textContent = 'Memuat data pemasukan...';
        tabelWrapper.hidden = true;
        totalElement.textContent = formatRupiah(0);
        tabelBody.replaceChildren();

        try {
            let data;
            const hariIni = tanggalLokal();
            let tanggal = hariIni;

            if (periode === 'semua') {
                data = await muatSemuaPemasukan();
            } else if (periode === 'minggu' || periode === 'bulan') {
                data = await muatRekapTanggal(hariIni, periode);
            } else {
                tanggal = tanggalInput?.value || hariIni;
                data = await muatRekapTanggal(tanggal, 'hari');
            }

            const rincian = Array.isArray(data.rincian_per_barber)
                ? data.rincian_per_barber
                : [];

            totalElement.textContent = formatRupiah(data.total_pemasukan);

            const dashPendapatan = document.getElementById('dashPendapatanHariIni');
            if (dashPendapatan && periode === 'hari' && tanggal === hariIni) {
                dashPendapatan.textContent = formatRupiah(data.total_pemasukan);
            }

            if (rincian.length === 0) {
                statusElement.textContent = tombolPeriode.length
                    ? 'Belum ada transaksi pada periode ini'
                    : 'Belum ada transaksi pada tanggal ini.';
                return;
            }

            rincian.forEach((barber) => {
                const baris = document.createElement('tr');
                baris.append(buatSel(barber.nama_barber || 'Tidak diketahui'));

                if (!tombolPeriode.length) {
                    baris.append(buatSel(String(Number(barber.jumlah_transaksi) || 0)));
                }

                baris.append(buatSel(formatRupiah(barber.total_pemasukan)));
                tabelBody.appendChild(baris);
            });

            statusElement.hidden = true;
            tabelWrapper.hidden = false;
        } catch (error) {
            console.error('Gagal memuat pemasukan:', error);
            statusElement.textContent = 'Pemasukan gagal dimuat. Silakan coba lagi.';
        }
    }

    tombolPeriode.forEach((tombol) => {
        tombol.addEventListener('click', () => {
            const periode = tombol.dataset.period;

            tombolPeriode.forEach((item) => {
                const aktif = item === tombol;
                item.classList.toggle('active', aktif);
                item.setAttribute('aria-pressed', String(aktif));
            });

            if (filterTanggal) {
                filterTanggal.hidden = periode !== 'hari';
            }
            muatPemasukan(periode);
        });
    });

    if (tanggalInput) {
        tanggalInput.value = tanggalLokal();
        tanggalInput.addEventListener('change', () => {
            muatPemasukan('hari');
        });
    }

    if (filterTanggal) {
        filterTanggal.hidden = false;
    }

    const periodeAwal = document.querySelector('.periode-pemasukan-btn.active');
    muatPemasukan(periodeAwal?.dataset.period || 'hari');
});
