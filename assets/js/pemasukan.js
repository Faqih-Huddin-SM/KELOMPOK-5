document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('.pemasukan-page')) return;

    const API_URL = '/KELOMPOK-5/api/rekap/pemasukan.php';
    const tanggalInput = document.getElementById('tanggalPemasukan');
    const totalElement = document.getElementById('totalPemasukan');
    const tabelBody = document.getElementById('tabelPemasukanBody');

    if (!totalElement || !tabelBody || !tanggalInput) {
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

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    async function muatPemasukanHarian(tanggal) {
        tabelBody.innerHTML = `
            <tr>
                <td colspan="3" class="pemasukan-loading-cell">
                    Memuat data pemasukan...
                </td>
            </tr>
        `;

        try {
            const params = new URLSearchParams({
                periode: 'hari',
                tanggal: tanggal
            });

            const response = await fetch(`${API_URL}?${params.toString()}`, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' }
            });

            const hasil = await response.json();

            if (!response.ok || hasil.success !== true || !hasil.data) {
                throw new Error(hasil.message || 'Gagal memuat data pemasukan.');
            }

            const data = hasil.data;
            const rincian = Array.isArray(data.rincian_per_barber) ? data.rincian_per_barber : [];

            // Update Total Pemasukkan Harian
            totalElement.textContent = formatRupiah(data.total_pemasukan || 0);

            // Render Rincian Per Barber pada Hari Tersebut
            if (rincian.length === 0) {
                tabelBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="pemasukan-empty-cell">
                            Belum ada transaksi pada tanggal ini
                        </td>
                    </tr>
                `;
                return;
            }

            tabelBody.innerHTML = rincian.map(barber => {
                const nama = barber.nama_barber || 'Tidak diketahui';
                const trx = Number(barber.jumlah_transaksi) || 0;
                const total = Number(barber.total_pemasukan) || 0;
                return `
                    <tr>
                        <td class="td-barber-nama">${escapeHtml(nama)}</td>
                        <td class="td-barber-trx">${trx}</td>
                        <td class="td-barber-total">${formatRupiah(total)}</td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('Gagal memuat pemasukan:', error);
            totalElement.textContent = formatRupiah(0);
            tabelBody.innerHTML = `
                <tr>
                    <td colspan="3" class="pemasukan-empty-cell">
                        Belum ada transaksi pada tanggal ini
                    </td>
                </tr>
            `;
        }
    }

    // Set tanggal default hari ini & muat data harian
    tanggalInput.value = tanggalLokal();
    muatPemasukanHarian(tanggalInput.value);

    // Event listener saat tanggal diganti
    tanggalInput.addEventListener('change', function () {
        if (this.value) {
            muatPemasukanHarian(this.value);
        }
    });

    // Refresh otomatis jika ada perubahan data
    window.addEventListener('storage', function (e) {
        if (e.key === 'kataji:data-changed') {
            muatPemasukanHarian(tanggalInput.value);
        }
    });

    window.addEventListener('kataji:data-changed', function () {
        muatPemasukanHarian(tanggalInput.value);
    });
});
