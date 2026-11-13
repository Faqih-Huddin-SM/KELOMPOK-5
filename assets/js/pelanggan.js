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
    const profileCard = document.getElementById('pelangganProfileCard');
    const profileNama = document.getElementById('profileNama');
    const profileLastVisit = document.getElementById('profileLastVisit');
    const profileKunjunganBadge = document.getElementById('profileKunjunganBadge');
    const timelineContainer = document.getElementById('riwayatTimelineContainer');
    const historyCard = document.getElementById('riwayatHistoryCard');

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
        const waktuMulai = performance.now();

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

            if (!keyword.trim()) {
                const sisaWaktuLoading = 500 - (performance.now() - waktuMulai);
                if (sisaWaktuLoading > 0) {
                    await new Promise(resolve => setTimeout(resolve, sisaWaktuLoading));
                }
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gagal memuat pelanggan.');
            }

            const semuaRaw = Array.isArray(result.data) ? result.data : [];

            // [Card 5.2] Simpan jumlah kunjungan ke cache dari API
            semuaRaw.forEach(p => {
                if (p && p.id_pelanggan && p.jumlah_kunjungan !== undefined) {
                    cacheKunjungan.set(Number(p.id_pelanggan), Number(p.jumlah_kunjungan));
                }
            });

            // [Card 5.2] Filter: hanya tampilkan pelanggan yang sudah pernah bertransaksi (jumlah_kunjungan > 0)
            // Pelanggan dengan 0 kunjungan tidak ditampilkan di daftar sesuai permintaan
            semuaPelanggan = semuaRaw.filter(p => Number(p.jumlah_kunjungan || 0) > 0);

            renderDaftarPelanggan(semuaPelanggan);

            // [Card 5.2] Auto-select pelanggan (hanya dari yang sudah pernah bertransaksi):
            // 1. Sesuai parameter URL (?id=...) jika ada
            // 2. Atau pelanggan pertama yang memiliki kunjungan
            if (semuaPelanggan.length > 0) {
                const urlParams = new URLSearchParams(window.location.search);
                const requestedId = parseInt(urlParams.get('id') || '0', 10);

                let dipilih = null;
                if (requestedId) {
                    dipilih = semuaPelanggan.find(p => Number(p.id_pelanggan) === requestedId);
                }
                if (!dipilih) {
                    dipilih = semuaPelanggan[0];
                }

                pilihPelanggan(dipilih.id_pelanggan, dipilih.nama);
            } else {
                tampilkanDaftarKosong('Belum ada pelanggan dengan riwayat transaksi.');
                resetProfilKosong();
            }

        } catch (error) {
            console.error('[Card 5.2] Gagal memuat daftar pelanggan:', error);
            tampilkanDaftarKosong('Gagal memuat data pelanggan.');
            if (profileNama) profileNama.textContent = 'Gagal memuat pelanggan';
            if (profileAvatar) profileAvatar.textContent = '-';
            if (profileLastVisit) profileLastVisit.textContent = 'Silakan muat ulang halaman untuk mencoba kembali.';
            if (profileCard) profileCard.setAttribute('aria-busy', 'false');
            if (profileKunjunganBadge) {
                profileKunjunganBadge.setAttribute('aria-busy', 'false');
                profileKunjunganBadge.innerHTML = `
                    <span class="badge-kunjungan-num">-</span>
                    <span class="badge-kunjungan-label">kunjungan</span>
                `;
            }
            if (historyCard) historyCard.setAttribute('aria-busy', 'false');
            if (timelineContainer) {
                timelineContainer.innerHTML = `
                    <div class="text-center py-4 text-danger">
                        Gagal memuat riwayat layanan.
                    </div>
                `;
            }
        }
    }

    /**
     * [Card 5.2] Render Daftar Pelanggan — hanya tampilkan yang sudah pernah bertransaksi
     * List sudah difilter sebelum masuk ke sini (jumlah_kunjungan > 0)
     */
    function renderDaftarPelanggan(list) {
        if (!listContainer) return;

        // [Card 5.2] Filter lokal: pastikan hanya yang ada kunjungan (double-check)
        const listBertransaksi = list.filter(p => Number(p.jumlah_kunjungan || 0) > 0);

        if (listBertransaksi.length === 0) {
            tampilkanDaftarKosong('Belum ada pelanggan dengan riwayat transaksi.');
            return;
        }

        listContainer.innerHTML = listBertransaksi.map(p => {
            const id = p.id_pelanggan;
            const nama = escapeHtml(p.nama || 'Tanpa Nama');
            const inisial = escapeHtml(getInisial(p.nama));
            const isActive = Number(pelangganAktifId) === Number(id) ? 'active' : '';

            // [Card 5.2] Jumlah kunjungan pasti > 0 karena sudah difilter
            const jml = (typeof p.jumlah_kunjungan === 'number')
                ? p.jumlah_kunjungan
                : (cacheKunjungan.get(Number(id)) ?? 0);
            const kunjunganTeks = `${jml} kunjungan`;

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
        if (profileCard) profileCard.setAttribute('aria-busy', 'false');
        if (historyCard) historyCard.setAttribute('aria-busy', 'false');
        if (profileKunjunganBadge) {
            profileKunjunganBadge.setAttribute('aria-busy', 'false');
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
     * [Card 5.2] Memilih pelanggan dan memanggil API /api/riwayat/pelanggan.php?id_pelanggan={id}
     * Hanya dipanggil untuk pelanggan yang sudah pernah bertransaksi (jumlah_kunjungan > 0)
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

        // [Card 5.2] Tampilkan history card dulu (akan disembunyikan kembali jika 0 kunjungan)
        // dan tampilkan loading spinner di timeline
        if (historyCard) historyCard.style.display = '';

        if (profileNama) profileNama.textContent = namaPelanggan || 'Memuat...';
        if (profileAvatar) {
            profileAvatar.innerHTML = '<span class="pelanggan-loading-spinner pelanggan-loading-spinner--avatar" aria-hidden="true"></span>';
        }
        if (profileLastVisit) {
            profileLastVisit.innerHTML = `
                <span class="pelanggan-loading-spinner" aria-hidden="true"></span>
                Memuat riwayat kunjungan...
            `;
        }
        if (profileKunjunganBadge) {
            profileKunjunganBadge.setAttribute('aria-busy', 'true');
            profileKunjunganBadge.innerHTML = `
                <span class="pelanggan-loading-spinner pelanggan-loading-spinner--visits" role="status" aria-label="Memuat jumlah kunjungan"></span>
                <span class="badge-kunjungan-label">kunjungan</span>
            `;
        }
        if (profileCard) profileCard.setAttribute('aria-busy', 'true');
        if (historyCard) historyCard.setAttribute('aria-busy', 'true');
        if (timelineContainer) {
            timelineContainer.innerHTML = `
                <div class="pelanggan-timeline-loading" role="status" aria-live="polite">
                    <span class="pelanggan-loading-spinner pelanggan-loading-spinner--large" aria-hidden="true"></span>
                    <span>Memuat riwayat layanan...</span>
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
            if (profileCard) profileCard.setAttribute('aria-busy', 'false');
            if (historyCard) historyCard.setAttribute('aria-busy', 'false');

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

            // [Card 5.2] Hide/show history card: sembunyikan jika 0 transaksi (tidak perlu pesan kosong)
            if (historyCard) {
                historyCard.style.display = jumlahKunjungan === 0 ? 'none' : '';
            }

            // [Card 5.2] Update Tampilan Timeline Riwayat Layanan (Bawah)
            renderTimelineRiwayat(riwayatRaw, adaData);

        } catch (error) {
            console.error('[Card 5.2] Gagal memuat riwayat pelanggan:', error);
            if (profileCard) profileCard.setAttribute('aria-busy', 'false');
            if (historyCard) historyCard.setAttribute('aria-busy', 'false');
            if (profileAvatar) profileAvatar.textContent = getInisial(namaPelanggan);
            if (profileLastVisit) profileLastVisit.textContent = 'Gagal memuat detail pelanggan.';
            if (profileKunjunganBadge) {
                profileKunjunganBadge.setAttribute('aria-busy', 'false');
                profileKunjunganBadge.innerHTML = `
                    <span class="badge-kunjungan-num">-</span>
                    <span class="badge-kunjungan-label">kunjungan</span>
                `;
            }
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
            profileKunjunganBadge.setAttribute('aria-busy', 'false');
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
     * - Sembunyikan history card jika jumlahKunjungan === 0 (sudah ditangani di pilihPelanggan())
     * - Urutan sesuai Figma: nama layanan di ATAS, tanggal di BAWAH
     */
    function renderTimelineRiwayat(riwayatList, adaData) {
        if (!timelineContainer) return;

        // [Card 5.2] SKENARIO: Belum pernah bertransaksi — history card sudah disembunyikan oleh pilihPelanggan()
        if (!adaData || riwayatList.length === 0) {
            timelineContainer.innerHTML = '';
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

        // [Card 5.2] Render Node Timeline Sesuai Desain Figma:
        // Setiap kunjungan = dot kiri + BOX kanan (nama layanan + badge "Terbaru" sejajar, tanggal di bawah)
        timelineContainer.innerHTML = `
            <div class="pelanggan-timeline-list">
                ${daftarKunjungan.map((kunjungan, index) => {
                    const isLatest = index === 0;
                    const tglFormat = formatTanggalIndo(kunjungan.tanggal);
                    // Gabungkan multi-layanan dengan " + " (contoh: "Cukur + Creambath")
                    const layananGabung = escapeHtml(kunjungan.layananList.join(' + '));
                    // Badge "Terbaru" diletakkan DALAM box, sejajar nama layanan (sesuai Figma)
                    const latestBadge = isLatest
                        ? '<span class="timeline-badge-terbaru">Terbaru</span>'
                        : '';
                    const latestClass = isLatest ? 'is-latest' : '';

                    return `
                        <div class="timeline-item ${latestClass}">
                            <span class="timeline-item-dot" aria-hidden="true"></span>
                            <div class="timeline-item-box">
                                <div class="timeline-item-top">
                                    <h4 class="timeline-services">${layananGabung}</h4>
                                    ${latestBadge}
                                </div>
                                <span class="timeline-date">
                                    <svg class="timeline-cal-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    ${tglFormat}
                                </span>
                            </div>
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
