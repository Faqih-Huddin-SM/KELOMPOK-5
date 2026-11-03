document.addEventListener('DOMContentLoaded', function () {
    const dashboardUrl = '/KELOMPOK-5/api/rekap/dashboard.php';
    const periodeSelect = document.getElementById('layananPeriode');
    const urutanSelect = document.getElementById('layananUrutan');
    const statusElement = document.getElementById('layananTerlarisStatus');
    const listElement = document.getElementById('layananTerlarisList');

    if (!periodeSelect || !urutanSelect || !statusElement || !listElement) return;

    function escapeHtml(teks) {
        const div = document.createElement('div');
        div.textContent = String(teks || '');
        return div.innerHTML;
    }

    function renderData(layanan) {
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
        statusElement.textContent = 'Memuat data layanan...';
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

            renderData(Array.isArray(hasil.data.layanan_populer) ? hasil.data.layanan_populer : []);
        } catch (error) {
            console.error('Gagal memuat layanan terlaris:', error);
            statusElement.hidden = false;
            statusElement.textContent = 'Data layanan gagal dimuat. Silakan coba lagi.';
            listElement.replaceChildren();
        }
    }

    periodeSelect.addEventListener('change', muatLayananTerlaris);
    urutanSelect.addEventListener('change', function () {
        const items = Array.from(listElement.querySelectorAll('.layanan-terlaris-item'));
        if (items.length === 0) {
            muatLayananTerlaris();
            return;
        }

        muatLayananTerlaris();
    });

    muatLayananTerlaris();
});
