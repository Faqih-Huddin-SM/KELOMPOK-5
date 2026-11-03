/**
 * Kataji Barber - Riwayat Transaksi (Frontend)
 * Penyesuaian dengan API backend terbaru & dialog konfirmasi Figma
 */

document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('riwayatTableBody');
    const notification = document.getElementById('riwayatNotification');
    const filterTanggal = document.getElementById('filterTanggalRiwayat');
    const pageEl = document.querySelector('.riwayat-page');
    const userRole = (pageEl?.dataset.role || '').toLowerCase();

    const API_TRANSAKSI = '/KELOMPOK-5/api/transaksi/index.php';
    const DETAIL_URL = '/KELOMPOK-5/api/transaksi/detail.php';

    if (!tableBody) {
        return;
    }

    let notificationTimer;

    // ======================================================
    // 1. DIALOG KONFIRMASI (SESUAI DESAIN FIGMA KATAJI)
    // ======================================================

    function konfirmasiTindakan({
        judul = 'Hapus Riwayat Transaksi?',
        pesan = 'Apakah Anda yakin ingin menghapus riwayat transaksi ini?',
        teksBatal = 'Batal',
        teksKonfirmasi = 'Ya, Hapus',
        tipe = 'danger'
    }) {
        if (typeof window.katajiKonfirmasi === 'function') {
            return window.katajiKonfirmasi({
                judul,
                pesan,
                teksBatal,
                teksKonfirmasi,
                tipe
            });
        }

        return new Promise(function (resolve) {
            let overlay = document.getElementById('katajiModalKonfirmasi');

            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'katajiModalKonfirmasi';
                overlay.className = 'kataji-confirm-overlay';
                overlay.setAttribute('role', 'dialog');
                overlay.setAttribute('aria-modal', 'true');
                overlay.innerHTML = `
                    <div class="kataji-confirm-box">
                        <h3 class="kataji-confirm-title" id="katajiConfirmTitle"></h3>
                        <p class="kataji-confirm-desc" id="katajiConfirmDesc"></p>
                        <div class="kataji-confirm-actions">
                            <button type="button" class="btn-confirm-cancel" id="btnConfirmBatal">Batal</button>
                            <button type="button" class="btn-confirm-danger" id="btnConfirmAksi">Ya</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);
            }

            const titleEl = overlay.querySelector('#katajiConfirmTitle');
            const descEl = overlay.querySelector('#katajiConfirmDesc');
            const btnBatal = overlay.querySelector('#btnConfirmBatal');
            const btnAksi = overlay.querySelector('#btnConfirmAksi');

            titleEl.textContent = judul;
            descEl.textContent = pesan;
            btnAksi.textContent = teksKonfirmasi;

            if (!teksBatal) {
                btnBatal.style.display = 'none';
                btnAksi.className = 'btn-confirm-primary btn-single-alert';
            } else {
                btnBatal.style.display = '';
                btnBatal.textContent = teksBatal;
                btnAksi.className = tipe === 'primary'
                    ? 'btn-confirm-primary'
                    : 'btn-confirm-danger';
            }

            function tutup(hasil) {
                overlay.style.display = 'none';
                document.body.classList.remove('kataji-confirm-open');
                btnBatal.onclick = null;
                btnAksi.onclick = null;
                overlay.onclick = null;
                document.removeEventListener('keydown', onKeyDown);
                resolve(hasil);
            }

            function onKeyDown(e) {
                if (e.key === 'Escape') {
                    tutup(false);
                }
            }

            btnBatal.onclick = function () { tutup(false); };
            btnAksi.onclick = function () { tutup(true); };
            overlay.onclick = function (e) {
                if (e.target === overlay) tutup(false);
            };
            document.addEventListener('keydown', onKeyDown);

            document.body.classList.add('kataji-confirm-open');
            overlay.style.display = 'flex';
            btnAksi.focus();
        });
    }

    function tampilkanAlert({
        judul = 'Perhatian',
        pesan = '',
        teksTombol = 'Mengerti',
        tipe = 'primary'
    }) {
        if (typeof window.katajiAlert === 'function') {
            return window.katajiAlert({ judul, pesan, teksTombol, tipe });
        }
        return konfirmasiTindakan({
            judul,
            pesan,
            teksBatal: null,
            teksKonfirmasi: teksTombol,
            tipe
        });
    }

    // ======================================================
    // 2. HELPER FORMAT
    // ======================================================

    function formatRupiah(nominal) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(nominal) || 0);
    }

    function tanggalHariIni() {
        const sekarang = new Date();
        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
        const hari = String(sekarang.getDate()).padStart(2, '0');
        return `${tahun}-${bulan}-${hari}`;
    }

    function formatTanggal(tanggal) {
        if (!tanggal) return '-';
        const bagian = String(tanggal).slice(0, 10).split('-');
        if (bagian.length !== 3) return tanggal;
        return `${bagian[2]}-${bagian[1]}-${bagian[0]}`;
    }

    function formatMetodePembayaran(metode) {
        const daftar = {
            cash: 'Tunai',
            qris: 'QRIS',
            transfer: 'Transfer'
        };
        return daftar[String(metode || '').toLowerCase()] || '-';
    }

    // ======================================================
    // 3. NOTIFIKASI
    // ======================================================

    function tampilkanNotifikasi(pesan, berhasil = true) {
        if (!notification) {
            return;
        }

        clearTimeout(notificationTimer);

        notification.textContent = pesan;
        notification.hidden = false;

        notification.classList.toggle('transaction-success', berhasil);
        notification.classList.toggle('transaction-error', !berhasil);

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.hidden = true;
            }, 300);
        }, 3000);
    }

    function tampilkanPesan(pesan) {
        tableBody.replaceChildren();

        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.textContent = pesan;

        row.appendChild(cell);
        tableBody.appendChild(row);
    }

    // ======================================================
    // 4. MEMUAT DETAIL & DAFTAR TRANSAKSI
    // ======================================================

    async function muatDetailTransaksi(idTransaksi) {
        const response = await fetch(
            `${DETAIL_URL}?id=${encodeURIComponent(idTransaksi)}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || 'Detail transaksi gagal dimuat.'
            );
        }

        return result.data;
    }

    async function muatRiwayat() {
        tampilkanPesan('Memuat riwayat transaksi...');

        try {
            const response = await fetch(API_TRANSAKSI, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Riwayat transaksi gagal dimuat.'
                );
            }

            const semuaTransaksi = Array.isArray(result.data) ? result.data : [];
            const tanggalDipilih = filterTanggal?.value || '';
            const transaksiTampil = tanggalDipilih
                ? semuaTransaksi.filter(function (transaksi) {
                    return String(transaksi.tanggal || '').slice(0, 10) === tanggalDipilih;
                })
                : semuaTransaksi;

            if (transaksiTampil.length === 0) {
                tampilkanPesan(
                    tanggalDipilih
                        ? 'Belum ada riwayat transaksi pada tanggal ini.'
                        : 'Belum ada riwayat transaksi.'
                );
                return;
            }

            tableBody.replaceChildren();

            const transaksiDenganDetail = await Promise.all(
                transaksiTampil.map(async function (transaksi) {
                    try {
                        const detail = await muatDetailTransaksi(
                            transaksi.id_transaksi
                        );

                        return {
                            ...transaksi,
                            layanan: detail.layanan || []
                        };
                    } catch (error) {
                        return {
                            ...transaksi,
                            layanan: null
                        };
                    }
                })
            );

            transaksiDenganDetail.forEach(function (transaksi) {
                const row = document.createElement('tr');
                row.dataset.idTransaksi = transaksi.id_transaksi;

                // Barber
                const barber = document.createElement('td');
                barber.textContent = transaksi.nama_barber || '-';

                // Nama Pelanggan
                const nama = document.createElement('td');
                nama.textContent = transaksi.nama_pelanggan || '-';

                // Tanggal
                const tanggal = document.createElement('td');
                tanggal.textContent = formatTanggal(transaksi.tanggal);

                // Layanan
                const layanan = document.createElement('td');
                if (transaksi.layanan === null) {
                    layanan.textContent = 'Gagal memuat';
                } else if (transaksi.layanan.length === 0) {
                    layanan.textContent = '-';
                } else {
                    layanan.textContent = transaksi.layanan.map(function (item) {
                        const jumlah = Number(item.jumlah) || 1;
                        return jumlah > 1
                            ? `${item.nama_layanan} (${jumlah}x)`
                            : item.nama_layanan;
                    }).join(', ');
                }

                // Nominal
                const nominal = document.createElement('td');
                nominal.textContent = formatRupiah(transaksi.total_harga);

                // Metode Pembayaran
                const pembayaran = document.createElement('td');
                pembayaran.textContent = formatMetodePembayaran(
                    transaksi.metode_pembayaran
                );

                // Aksi (Hanya owner yang berhak menghapus)
                const aksi = document.createElement('td');

                if (userRole === 'owner') {
                    const tombolHapus = document.createElement('button');
                    tombolHapus.type = 'button';
                    tombolHapus.className = 'riwayat-delete-btn';
                    tombolHapus.textContent = '×';
                    tombolHapus.setAttribute('aria-label', 'Hapus riwayat transaksi');
                    tombolHapus.dataset.idTransaksi = transaksi.id_transaksi;
                    aksi.appendChild(tombolHapus);
                } else {
                    aksi.textContent = '-';
                }

                row.append(
                    barber,
                    nama,
                    tanggal,
                    layanan,
                    nominal,
                    pembayaran,
                    aksi
                );

                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Gagal memuat riwayat:', error);
            tampilkanPesan(
                error.message || 'Riwayat transaksi gagal dimuat.'
            );
        }
    }

    // ======================================================
    // 5. HAPUS RIWAYAT TRANSAKSI (DELETE API DENGAN KONFIRMASI)
    // ======================================================

    tableBody.addEventListener('click', async function (event) {
        const tombol = event.target.closest('.riwayat-delete-btn');
        if (!tombol) return;

        const idTransaksi = tombol.dataset.idTransaksi;
        if (!idTransaksi) {
            tampilkanNotifikasi('ID transaksi tidak ditemukan.', false);
            await tampilkanAlert({
                judul: 'Validasi Riwayat',
                pesan: 'ID transaksi tidak ditemukan.',
                tipe: 'danger'
            });
            return;
        }

        const yakin = await konfirmasiTindakan({
            judul: 'Hapus Riwayat Transaksi?',
            pesan: 'Apakah Anda yakin ingin menghapus riwayat transaksi ini? Data yang dihapus tidak akan ditampilkan lagi.',
            teksBatal: 'Batal',
            teksKonfirmasi: 'Ya, Hapus',
            tipe: 'danger'
        });

        if (!yakin) {
            return;
        }

        tombol.disabled = true;

        try {
            // Sesuai kontrak backend: DELETE /api/transaksi/index.php?id={id_transaksi}
            const response = await fetch(
                `${API_TRANSAKSI}?id=${encodeURIComponent(idTransaksi)}`,
                {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            let result;
            try {
                result = await response.json();
            } catch (jsonErr) {
                throw new Error('Respons server bukan JSON yang valid.');
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Gagal menghapus riwayat transaksi.'
                );
            }

            localStorage.setItem('kataji:data-changed', String(Date.now()));

            tampilkanNotifikasi(
                result.message || 'Riwayat transaksi berhasil dihapus.',
                true
            );

            await muatRiwayat();
        } catch (error) {
            console.error('Gagal menghapus transaksi:', error);
            tampilkanNotifikasi(
                error.message || 'Gagal menghapus riwayat transaksi.',
                false
            );
            await tampilkanAlert({
                judul: 'Gagal Menghapus',
                pesan: error.message || 'Gagal menghapus riwayat transaksi.',
                tipe: 'danger'
            });
            tombol.disabled = false;
        }
    });

    if (filterTanggal) {
        filterTanggal.value = tanggalHariIni();
        filterTanggal.addEventListener('change', muatRiwayat);
    }

    muatRiwayat();
});
