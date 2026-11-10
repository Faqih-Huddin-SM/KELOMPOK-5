/**
 * ==============================================================================
 * [Card 5.2] Script Frontend Pelanggan & Riwayat Layanan Pelanggan (Kataji Barber)
 * WBS 5.2 | Role: Frontend Developer (Faqih)
 *
 * Fitur & Skenario:
 * 1. Daftar layanan yang pernah diambil beserta tanggal, terurut dari kunjungan terbaru.
 * 2. Transaksi multi-layanan digabung per kunjungan dengan tanda "+" (contoh: Cukur + Creambath).
 * 3. Kunjungan paling atas (terbaru) ditandai dengan badge "Terbaru".
 * 4. Pesan "Belum ada riwayat layanan" jika pelanggan belum pernah bertransaksi (ada_data === false).
 * 5. Pelanggan baru dengan 1 kunjungan menampilkan kunjungan tersebut tanpa pesan kosong.
 * 6. Pencarian pelanggan secara responsif dan interaktif.
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    // [Card 5.2] Elemen DOM
    const listContainer = document.getElementById('pelangganListContainer');
    const inputCari = document.getElementById('cariPelanggan');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileNama = document.getElementById('profileNama');
    const profileLastVisit = document.getElementById('profileLastVisit');
    const profileKunjunganBadge = document.getElementById('profileKunjunganBadge');
    const timelineContainer = document.getElementById('riwayatTimelineContainer');

    // [Card 5.2] Endpoint Backend API
    const API_PELANGGAN = '/KELOMPOK-5/api/pelanggan/index.php';
    const API_RIWAYAT_PELANGGAN = '/KELOMPOK-5/api/riwayat/pelanggan.php';

    // [Card 5.2] State Aplikasi
    let semuaPelanggan = [];
    let pelangganAktifId = null;
    let debounceTimer = null;
    const cacheKunjungan = new Map(); // Menyimpan jumlah kunjungan per pelanggan (id_pelanggan -> count)

    // ==========================================================================
    // [Card 5.2] 1. HELPER & FORMATTER
    // ==========================================================================

    /**
     * Escape string HTML untuk mencegah XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format tanggal YYYY-MM-DD ke Bahasa Indonesia (contoh: "10 Oktober 2026")
     */
    function formatTanggalIndo(tanggalStr) {
        if (!tanggalStr) return '-';
        const namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        const raw = String(tanggalStr).slice(0, 10);
        const parts = raw.split('-');
        if (parts.length === 3) {
            const tahun = parts[0];
            const bulan = namaBulan[parseInt(parts[1], 10) - 1] || parts[1];
            const tgl = parseInt(parts[2], 10);
            return `${tgl} ${bulan} ${tahun}`;
        }
        return tanggalStr;
    }

    /**
     * Ambil inisial huruf pertama dari nama pelanggan (contoh: "Budi" -> "B")
     */
    function getInisial(nama) {
        const clean = (nama || '').trim();
        return clean ? clean.charAt(0).toUpperCase() : '?';
    }

    // ==========================================================================
    // [Card 5.2] 2. MEMUAT DAFTAR PELANGGAN DARI API
    // ==========================================================================

    /**
     * Memuat daftar seluruh pelanggan dari /api/pelanggan/index.php
     */
    async function muatDaftarPelanggan(keyword = '') {
        try {
            let url = API_PELANGGAN;
            if (keyword.trim()) {
                url += `?q=${encodeURIComponent(keyword.trim())}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gagal memuat pelanggan.');
            }

            semuaPelanggan = Array.isArray(result.data) ? result.data : [];

            // Simpan jumlah kunjungan yang dikembalikan dari API ke cache
            semuaPelanggan.forEach(p => {
                if (p && p.id_pelanggan && p.jumlah_kunjungan !== undefined) {
                    cacheKunjungan.set(Number(p.id_pelanggan), Number(p.jumlah_kunjungan));
                }
            });

            renderDaftarPelanggan(semuaPelanggan);

            // [Card 5.2] Auto-select pelanggan:
            // 1. Sesuai parameter URL (?id=...) jika ada
            // 2. Atau pelanggan "Budi" (skenario utama Figma)
            // 3. Atau pelanggan pertama yang memiliki riwayat kunjungan
            // 4. Fallback ke pelanggan pertama
            if (semuaPelanggan.length > 0) {
                const urlParams = new URLSearchParams(window.location.search);
                const requestedId = parseInt(urlParams.get('id') || '0', 10);

                let dipilih = null;
                if (requestedId) {
                    dipilih = semuaPelanggan.find(p => Number(p.id_pelanggan) === requestedId);
                }
                if (!dipilih) {
                    dipilih = semuaPelanggan.find(p => (p.nama || '').trim().toLowerCase() === 'budi');
                }
                if (!dipilih) {
                    dipilih = semuaPelanggan.find(p => Number(p.jumlah_kunjungan || 0) > 0);
                }
                if (!dipilih) {
                    dipilih = semuaPelanggan[0];
                }

                pilihPelanggan(dipilih.id_pelanggan, dipilih.nama);
            } else {
                tampilkanDaftarKosong('Tidak ada pelanggan ditemukan.');
                resetProfilKosong();
            }

        } catch (error) {
            console.error('[Card 5.2] Gagal memuat daftar pelanggan:', error);
            tampilkanDaftarKosong('Gagal memuat data pelanggan.');
        }
    }

    /**
     * Render item daftar pelanggan di kolom kiri sesuai desain Figma
     */
    function renderDaftarPelanggan(list) {
        if (!listContainer) return;

        if (list.length === 0) {
            tampilkanDaftarKosong('Tidak ada pelanggan ditemukan.');
            return;
        }

        listContainer.innerHTML = list.map(p => {
            const id = p.id_pelanggan;
            const nama = escapeHtml(p.nama || 'Tanpa Nama');
            const inisial = escapeHtml(getInisial(p.nama));
            const isActive = Number(pelangganAktifId) === Number(id) ? 'active' : '';

            // [Card 5.2] Ambil jumlah_kunjungan langsung dari respons API pelanggan (0 = "Belum ada kunjungan")
            const jml = (typeof p.jumlah_kunjungan === 'number')
                ? p.jumlah_kunjungan
                : (cacheKunjungan.get(Number(id)) ?? 0);
            const kunjunganTeks = jml > 0 ? `${jml} kunjungan` : 'Belum ada kunjungan';

            return `
                <div
                    class="pelanggan-item ${isActive}"
                    data-id="${id}"
                    data-nama="${nama}"
                    role="button"
                    tabindex="0"
                    aria-label="Pilih pelanggan ${nama}"
                >
                    <div class="pelanggan-item-avatar" aria-hidden="true">
                        ${inisial}
                    </div>
                    <div class="pelanggan-item-info">
                        <h3 class="pelanggan-item-name">${nama}</h3>
                        <p class="pelanggan-item-kunjungan" id="kunjunganLabel-${id}">${kunjunganTeks}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    function tampilkanDaftarKosong(pesan) {
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="pelanggan-list-empty text-center py-4 text-muted">
                    ${escapeHtml(pesan)}
                </div>
            `;
        }
    }

    function resetProfilKosong() {
        if (profileNama) profileNama.textContent = 'Pilih Pelanggan';
        if (profileAvatar) profileAvatar.textContent = '-';
        if (profileLastVisit) profileLastVisit.textContent = 'Tidak ada pelanggan yang dipilih.';
        if (profileKunjunganBadge) {
            profileKunjunganBadge.innerHTML = `
                <span class="badge-kunjungan-num">0</span>
                <span class="badge-kunjungan-label">kunjungan</span>
            `;
        }
        if (timelineContainer) {
            timelineContainer.innerHTML = `
                <div class="pelanggan-empty-state">
                    <p class="pelanggan-empty-title">Belum ada riwayat layanan</p>
                    <p class="pelanggan-empty-desc">Pilih pelanggan untuk melihat riwayat.</p>
                </div>
            `;
        }
    }

    // ==========================================================================
    // [Card 5.2] 3. MEMUAT RIWAYAT LAYANAN PELANGGAN TERTENTU
    // ==========================================================================

    /**
     * Memilih pelanggan dan memanggil API /api/riwayat/pelanggan.php?id_pelanggan={id}
     */
    async function pilihPelanggan(idPelanggan, namaPelanggan) {
        if (!idPelanggan) return;

        pelangganAktifId = Number(idPelanggan);

        // [Card 5.2] Perbarui status aktif pada elemen list di sebelah kiri
        const semuaItem = document.querySelectorAll('.pelanggan-item');
        semuaItem.forEach(item => {
            const itemMatch = Number(item.dataset.id) === pelangganAktifId;
            item.classList.toggle('active', itemMatch);
        });

        // [Card 5.2] Tampilkan indikator memuat pada profil dan timeline
        if (profileNama) profileNama.textContent = namaPelanggan || 'Memuat...';
        if (profileAvatar) profileAvatar.textContent = getInisial(namaPelanggan);
        if (profileLastVisit) profileLastVisit.textContent = 'Memuat riwayat kunjungan...';
        if (timelineContainer) {
            timelineContainer.innerHTML = `
                <div class="pelanggan-timeline-loading text-center py-4 text-muted">
                    Memuat riwayat layanan...
                </div>
            `;
        }

        try {
            const response = await fetch(`${API_RIWAYAT_PELANGGAN}?id_pelanggan=${encodeURIComponent(idPelanggan)}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gagal memuat riwayat layanan.');
            }

            const data = result.data || {};
            const pelangganInfo = data.pelanggan || { id_pelanggan: idPelanggan, nama: namaPelanggan };
            const jumlahKunjungan = Number(data.jumlah_kunjungan) || 0;
            const riwayatRaw = Array.isArray(data.riwayat) ? data.riwayat : [];
            const adaData = Boolean(data.ada_data && riwayatRaw.length > 0);

            // Simpan ke cache kunjungan dan perbarui label di list kiri
            cacheKunjungan.set(pelangganAktifId, jumlahKunjungan);
            const labelEl = document.getElementById(`kunjunganLabel-${pelangganAktifId}`);
            if (labelEl) {
                labelEl.textContent = jumlahKunjungan > 0 ? `${jumlahKunjungan} kunjungan` : 'Belum ada kunjungan';
            }

            // [Card 5.2] Update Tampilan Kartu Profil Pelanggan (Atas)
            renderKartuProfil(pelangganInfo.nama, jumlahKunjungan, riwayatRaw, adaData);

            // [Card 5.2] Update Tampilan Timeline Riwayat Layanan (Bawah)
            renderTimelineRiwayat(riwayatRaw, adaData);

        } catch (error) {
            console.error('[Card 5.2] Gagal memuat riwayat pelanggan:', error);
            if (profileLastVisit) profileLastVisit.textContent = 'Gagal memuat detail pelanggan.';
            if (timelineContainer) {
                timelineContainer.innerHTML = `
                    <div class="text-center py-4 text-danger">
                        ${escapeHtml(error.message || 'Terjadi kesalahan saat memuat riwayat.')}
                    </div>
                `;
            }
        }
    }

    /**
     * [Card 5.2] Render Profil Ringkas (Avatar Besar, Nama, Tanggal Terakhir, Badge Kunjungan)
     */
    function renderKartuProfil(nama, jumlahKunjungan, riwayatList, adaData) {
        if (profileNama) profileNama.textContent = nama || 'Pelanggan';
        if (profileAvatar) profileAvatar.textContent = getInisial(nama);

        // Badge Kunjungan di kanan kartu profil (Kotak Kunjungan)
        if (profileKunjunganBadge) {
            profileKunjunganBadge.innerHTML = `
                <span class="badge-kunjungan-num">${jumlahKunjungan}</span>
                <span class="badge-kunjungan-label">kunjungan</span>
            `;
        }

        // Teks Terakhir Berkunjung
        if (profileLastVisit) {
            if (adaData && riwayatList.length > 0) {
                // Riwayat sudah terurut dari kunjungan terbaru oleh BE
                const tanggalTerbaru = riwayatList[0].tanggal;
                profileLastVisit.textContent = `Terakhir berkunjung: ${formatTanggalIndo(tanggalTerbaru)}`;
            } else {
                profileLastVisit.textContent = 'Belum pernah berkunjung';
            }
        }
    }

    /**
     * [Card 5.2] Render Timeline Riwayat Layanan
     * - Mengelompokkan transaksi multi-layanan per id_transaksi (contoh: "Cukur + Creambath")
     * - Menandai kunjungan teratas dengan badge "Terbaru"
     * - Menampilkan pesan "Belum ada riwayat layanan" bila belum pernah bertransaksi
     */
    function renderTimelineRiwayat(riwayatList, adaData) {
        if (!timelineContainer) return;

        // [Card 5.2] SKENARIO: Belum pernah bertransaksi (ada_data === false)
        if (!adaData || riwayatList.length === 0) {
            timelineContainer.innerHTML = `
                <div class="pelanggan-empty-state">
                    <div class="pelanggan-empty-icon" aria-hidden="true">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <p class="pelanggan-empty-title">Belum ada riwayat layanan</p>
                    <p class="pelanggan-empty-desc">Pelanggan ini belum pernah melakukan transaksi.</p>
                </div>
            `;
            return;
        }

        // [Card 5.2] SKENARIO: Kelompokkan baris layanan per kunjungan (berdasarkan id_transaksi)
        // BE sudah mengurutkan transaksi dari tanggal dan waktu terbaru
        const kunjunganMap = new Map();

        riwayatList.forEach(item => {
            const idTrx = item.id_transaksi;
            if (!kunjunganMap.has(idTrx)) {
                kunjunganMap.set(idTrx, {
                    id_transaksi: idTrx,
                    tanggal: item.tanggal,
                    waktu: item.waktu,
                    layananList: []
                });
            }

            const namaLayanan = item.nama_layanan || 'Layanan';
            const jumlah = Number(item.jumlah) || 1;
            const labelLayanan = jumlah > 1 ? `${namaLayanan} (${jumlah}x)` : namaLayanan;

            kunjunganMap.get(idTrx).layananList.push(labelLayanan);
        });

        const daftarKunjungan = Array.from(kunjunganMap.values());

        // [Card 5.2] Render Node Timeline Sesuai Desain Figma
        timelineContainer.innerHTML = `
            <div class="pelanggan-timeline-list">
                ${daftarKunjungan.map((kunjungan, index) => {
                    const isLatest = index === 0; // Kunjungan paling atas adalah yang terbaru
                    const tglFormat = formatTanggalIndo(kunjungan.tanggal);
                    // Gabungkan multi-layanan dengan tanda " + " (contoh: "Cukur + Creambath")
                    const layananGabung = escapeHtml(kunjungan.layananList.join(' + '));
                    const latestBadge = isLatest
                        ? '<span class="timeline-badge-terbaru">Terbaru</span>'
                        : '';
                    const latestClass = isLatest ? 'is-latest' : '';

                    return `
                        <div class="timeline-item ${latestClass}">
                            <span class="timeline-item-dot" aria-hidden="true"></span>
                            <div class="timeline-content">
                                <span class="timeline-date">${tglFormat}</span>
                                <h4 class="timeline-services">${layananGabung}</h4>
                            </div>
                            ${latestBadge}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ==========================================================================
    // [Card 5.2] 4. EVENT LISTENERS
    // ==========================================================================

    // [Card 5.2] Event Klik Memilih Pelanggan dari Kolom Kiri
    if (listContainer) {
        listContainer.addEventListener('click', function (e) {
            const item = e.target.closest('.pelanggan-item');
            if (!item) return;

            const id = Number(item.dataset.id);
            const nama = item.dataset.nama || '';
            if (id && id !== pelangganAktifId) {
                pilihPelanggan(id, nama);
            }
        });

        // Dukungan aksesibilitas keyboard (Enter / Spasi)
        listContainer.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                const item = e.target.closest('.pelanggan-item');
                if (item) {
                    e.preventDefault();
                    item.click();
                }
            }
        });
    }

    // [Card 5.2] Input Pencarian Pelanggan (Debounce 250ms)
    if (inputCari) {
        inputCari.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            const keyword = inputCari.value.toLowerCase().trim();

            debounceTimer = setTimeout(() => {
                if (keyword === '') {
                    renderDaftarPelanggan(semuaPelanggan);
                } else {
                    // Filter lokal terlebih dahulu untuk kecepatan instan
                    const hasilFilter = semuaPelanggan.filter(p =>
                        (p.nama || '').toLowerCase().includes(keyword)
                    );
                    renderDaftarPelanggan(hasilFilter);

                    // Jika tidak ada di lokal atau keyword panjang, query ke server
                    if (hasilFilter.length === 0 && keyword.length >= 2) {
                        muatDaftarPelanggan(keyword);
                    }
                }
            }, 250);
        });
    }

    // ==========================================================================
    // [Card 5.2] 5. INISIALISASI
    // ==========================================================================
    muatDaftarPelanggan();
});

