/**
 * Kataji Barber - Pengeluaran Harian (Frontend)
 * Penyesuaian dengan API backend terbaru & dialog konfirmasi Figma
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/KELOMPOK-5/api/pengeluaran/index.php';
    const DASHBOARD_API_URL = '/KELOMPOK-5/api/rekap/dashboard.php';
    let periodeAktif = 'hari';

    // Elemen form dan input
    const form = document.getElementById('formPengeluaranHarian');
    const kategoriInput = document.getElementById('kategoriPengeluaranHarian');
    const nominalInput = document.getElementById('nominalPengeluaranHarian');
    const tanggalInput = document.getElementById('tanggalPengeluaranHarian');

    // Elemen pesan error dan tombol simpan
    const errorKategori = document.getElementById('errorKategoriPengeluaranHarian');
    const errorNominal = document.getElementById('errorNominalPengeluaranHarian');
    const tombolSimpan = document.getElementById('btnSimpanPengeluaran');

    // Elemen daftar, total, dan status
    const totalElement = document.getElementById('totalPengeluaranHarian');
    const ringkasanElement = document.getElementById('totalRingkasanPengeluaran');
    const daftarElement = document.getElementById('daftarPengeluaranHarian');
    const statusElement = document.getElementById('statusPengeluaranHarian');
    const judulDaftarElement = document.getElementById('judulDaftarPengeluaran');

    if (
        !form ||
        !kategoriInput ||
        !nominalInput ||
        !tanggalInput ||
        !errorKategori ||
        !errorNominal ||
        !tombolSimpan ||
        !totalElement ||
        !daftarElement ||
        !statusElement
    ) {
        console.error('Elemen halaman pengeluaran belum lengkap.');
        return;
    }

    form.noValidate = true;

    // ======================================================
    // 1. DIALOG KONFIRMASI (SESUAI DESAIN FIGMA KATAJI)
    // ======================================================

    function konfirmasiTindakan({
        judul = 'Hapus Pengeluaran Ini?',
        pesan = 'Apakah Anda yakin ingin menghapus data pengeluaran ini?',
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
                btnAksi.classList.add('btn-single-alert');
            } else {
                btnBatal.style.display = '';
                btnBatal.textContent = teksBatal;
                btnAksi.classList.remove('btn-single-alert');
            }

            if (tipe === 'primary') {
                btnAksi.className = 'btn-confirm-primary' + (!teksBatal ? ' btn-single-alert' : '');
            } else {
                btnAksi.className = 'btn-confirm-danger' + (!teksBatal ? ' btn-single-alert' : '');
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
        judul = 'Validasi Pengeluaran',
        pesan = '',
        teksTombol = 'Mengerti',
        tipe = 'primary'
    }) {
        if (typeof window.katajiAlert === 'function') {
            return window.katajiAlert({
                judul,
                pesan,
                teksTombol,
                tipe
            });
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
    // 2. SISTEM NOTIFIKASI
    // ======================================================

    let toast = document.getElementById('pengeluaranToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pengeluaranToast';
        toast.className = 'pengeluaran-toast';
        toast.hidden = true;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }

    let toastTimer;

    function tampilkanNotifikasi(pesan, jenis = 'berhasil') {
        clearTimeout(toastTimer);

        toast.textContent = pesan;
        toast.className = 'pengeluaran-toast';

        if (jenis === 'gagal' || jenis === 'error' || jenis === 'hapus') {
            toast.classList.add('gagal');
        } else {
            toast.classList.add('berhasil');
        }

        toast.hidden = false;

        toastTimer = setTimeout(() => {
            toast.hidden = true;
        }, 3000);
    }

    // ======================================================
    // 3. HELPER FORMAT
    // ======================================================

    function formatRupiah(nilai) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(Number(nilai) || 0);
    }

    function tanggalLokal() {
        const sekarang = new Date();
        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
        const hari = String(sekarang.getDate()).padStart(2, '0');
        return `${tahun}-${bulan}-${hari}`;
    }

    function formatTanggal(tanggal) {
        if (!tanggal) return '-';
        const bagian = tanggal.slice(0, 10).split('-');
        if (bagian.length !== 3) return tanggal;
        return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
    }

    function formatTanggalISO(tanggal) {
        if (!tanggal) return '-';
        const bagian = String(tanggal).slice(0, 10).split('-');
        return bagian.length === 3 ? `${bagian[0]}-${bagian[1]}-${bagian[2]}` : String(tanggal);
    }

    function formatWaktuPengeluaran(waktu) {
        if (!waktu) return '-';
        const teks = String(waktu).replace('T', ' ').slice(0, 16);
        const bagian = teks.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/);
        return bagian ? `${bagian[1]} ${bagian[2]}.${bagian[3]}` : teks;
    }

    function escapeHtml(teks) {
        const element = document.createElement('div');
        element.textContent = String(teks ?? '');
        return element.innerHTML;
    }

    function formatRiwayatPengeluaran(keterangan, item = {}) {
        const riwayat = String(keterangan || '').trim();
        const baris = riwayat.split('\n').filter(Boolean);
        const entri = [];
        const entriDicatat = [];

        for (let indeks = 0; indeks < baris.length; indeks += 1) {
            const header = baris[indeks];
            if (!/^\d{4}-\d{2}-\d{2}\s/.test(header)) continue;

            let bagian = header.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\.\s*(Diubah oleh|Dicatat oleh)\s+(.+)$/i);
            if (!bagian) {
                const lama = header.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s+-\s*.+?\s+oleh\s+(.+?)(?:\..*)?$/i);
                if (lama) bagian = [header, lama[1], 'Diubah oleh', lama[2]];
            }
            if (!bagian) continue;

            const [, waktu, aksi, pengubah] = bagian;
            const waktuFormat = waktu.replace(/:(\d{2})$/, '.$1');
            let detail = baris[indeks + 1] || '';
            if (aksi === 'Diubah oleh' && detail.startsWith(waktu.slice(0, 4))) detail = '';
            detail = detail.replace(/\.\s*Alasan:\s*.*$/i, '').trim();
            const labelAksi = aksi.charAt(0).toUpperCase() + aksi.slice(1);
            const detailFormat = detail
                ? detail
                    .split(';')
                    .map((perubahan) => perubahan.trim())
                    .filter(Boolean)
                    .join('; ')
                : '';

            const entriRiwayat = `
                <div class="pengeluaran-history-item">
                    <strong>${escapeHtml(waktuFormat)}. ${escapeHtml(labelAksi)} ${escapeHtml(pengubah)}</strong>
                    <div>${escapeHtml(detailFormat)}</div>
                </div>
            `;
            if (aksi === 'Dicatat oleh') entriDicatat.push(entriRiwayat);
            else entri.push(entriRiwayat);
            if (detail) indeks += 1;
        }

        if (entri.length || entriDicatat.length) {
            return [...entri.reverse(), ...entriDicatat].join('');
        }
        if (!item || !item.tanggal) return '<span>Belum ada perubahan.</span>';

        const waktu = String(item.dibuat_pada || item.tanggal).slice(0, 16).replace('T', ' ');
        const pencatat = item.nama_user || 'Pengguna';
        return `
            <div class="pengeluaran-history-item">
                <strong>${escapeHtml(waktu)}. Dicatat oleh ${escapeHtml(pencatat)}</strong>
                <div>${escapeHtml(item.kategori || '-')} Rp${escapeHtml(formatRupiah(item.nominal).replace('Rp', '').trim())}. Dicatat oleh ${escapeHtml(pencatat)}</div>
            </div>
        `;
    }

    function ambilAlasanPengeluaran(keterangan) {
        const teks = String(keterangan || '').trim();
        if (!teks) return '-';

        const baris = teks.split('\n').filter(Boolean);
        for (let indeks = baris.length - 1; indeks >= 0; indeks -= 1) {
            const alasan = baris[indeks].match(/(?:^|\. )Alasan:\s*(.*)$/i);
            if (alasan && alasan[1].trim()) return alasan[1].trim();
        }
        return '-';
    }

    let daftarBarberPengeluaran = null;

    async function muatDaftarBarberPengeluaran() {
        if (daftarBarberPengeluaran) return daftarBarberPengeluaran;

        const respons = await fetch('/KELOMPOK-5/api/barber/index.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        const hasil = await respons.json().catch(() => ({}));
        if (!respons.ok || hasil.success !== true) {
            throw new Error(hasil.message || 'Daftar barber gagal dimuat.');
        }

        daftarBarberPengeluaran = Array.isArray(hasil.data) ? hasil.data : [];
        return daftarBarberPengeluaran;
    }

    function tampilkanStatus(pesan) {
        statusElement.textContent = pesan;
    }

    // ======================================================
    // 4. VALIDASI FORM INPUT
    // ======================================================

    function bersihkanError(input, elemenError) {
        input.classList.remove('input-error');
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        elemenError.textContent = '';
    }

    function tampilkanError(input, elemenError, pesan) {
        input.classList.add('input-error');
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        elemenError.textContent = pesan;
    }

    function validasiForm() {
        bersihkanError(kategoriInput, errorKategori);
        bersihkanError(nominalInput, errorNominal);

        let valid = true;

        if (!kategoriInput.value.trim()) {
            tampilkanError(
                kategoriInput,
                errorKategori,
                '*Kategori wajib diisi'
            );
            valid = false;
        }

        const nominal = nominalInput.value.trim();
        const angkaNominal = Number(nominal);

        if (nominal === '') {
            tampilkanError(
                nominalInput,
                errorNominal,
                '*Nominal harus diisi'
            );
            valid = false;
        } else if (
            !Number.isFinite(angkaNominal) ||
            angkaNominal <= 0 ||
            !Number.isInteger(angkaNominal)
        ) {
            tampilkanError(
                nominalInput,
                errorNominal,
                '*Nominal harus lebih dari nol'
            );
            valid = false;
        } else if (angkaNominal > 2147483647) {
            tampilkanError(
                nominalInput,
                errorNominal,
                '*Nominal terlalu besar'
            );
            valid = false;
        }

        if (!valid) {
            (kategoriInput.value.trim() ? nominalInput : kategoriInput).focus();
        }

        return valid;
    }

    kategoriInput.addEventListener('change', () => {
        if (kategoriInput.value.trim()) {
            bersihkanError(kategoriInput, errorKategori);
        }
    });

    nominalInput.addEventListener('input', () => {
        const nominal = nominalInput.value.trim();
        const nilai = Number(nominal);

        if (
            nominal !== '' &&
            Number.isFinite(nilai) &&
            nilai > 0 &&
            Number.isInteger(nilai) &&
            nilai <= 2147483647
        ) {
            bersihkanError(nominalInput, errorNominal);
        }
    });

    function buatSel(teks) {
        const sel = document.createElement('td');
        sel.textContent = teks;
        return sel;
    }

    function tampilkanKosong(pesan) {
        daftarElement.replaceChildren();

        const baris = document.createElement('tr');
        const sel = document.createElement('td');

        sel.colSpan = 4;
        sel.className = 'pengeluaran-empty';
        sel.textContent = pesan;

        baris.appendChild(sel);
        daftarElement.appendChild(baris);
    }

    // ======================================================
    // 5. TOMBOL HAPUS DENGAN DIALOG KONFIRMASI FIGMA
    // ======================================================

    function buatTombolHapus(item) {
        const tombol = document.createElement('button');

        tombol.type = 'button';
        tombol.className = 'pengeluaran-delete-btn';
        tombol.textContent = 'X';
        tombol.setAttribute('aria-label', `Hapus pengeluaran ${item.kategori || ''}`);

        tombol.addEventListener('click', async () => {
            const yakin = await konfirmasiTindakan({
                judul: 'Hapus Pengeluaran Ini?',
                pesan: `Apakah Anda yakin ingin menghapus data pengeluaran ${item.kategori ? item.kategori + ' ' : ''}${formatRupiah(item.nominal)}?`,
                teksBatal: 'Batal',
                teksKonfirmasi: 'Ya, Hapus',
                tipe: 'danger'
            });

            if (!yakin) return;

            tombol.disabled = true;

            try {
                const respons = await fetch(API_URL, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        id_pengeluaran: item.id_pengeluaran
                    })
                });

                const hasil = await respons.json().catch(() => ({}));

                if (!respons.ok || hasil.success !== true) {
                    throw new Error(
                        hasil.message || 'Pengeluaran gagal dihapus.'
                    );
                }

                tampilkanNotifikasi(
                    hasil.message || 'Pengeluaran berhasil dihapus.',
                    'hapus'
                );

                await muatPengeluaran();
            localStorage.setItem('kataji:data-changed', String(Date.now()));
                localStorage.setItem('kataji:data-changed', String(Date.now()));
            } catch (error) {
                await tampilkanAlert({
                    judul: 'Gagal Menghapus',
                    pesan: error.message || 'Hanya pengeluaran hari ini yang dapat dihapus.',
                    teksTombol: 'Tutup',
                    tipe: 'danger'
                });
                tampilkanNotifikasi(
                    error.message || 'Terjadi kesalahan saat menghapus.',
                    'gagal'
                );
                tombol.disabled = false;
            }
        });

        return tombol;
    }

    function buatModalPengeluaran() {
        if (document.getElementById('modalDetailPengeluaran')) return;

        const modal = document.createElement('div');
        modal.id = 'modalDetailPengeluaran';
        modal.className = 'pengeluaran-modal-overlay';
        modal.innerHTML = `
            <div class="pengeluaran-modal-box" role="dialog" aria-modal="true" aria-labelledby="judulModalPengeluaran">
                <h3 id="judulModalPengeluaran">Detail Pengeluaran</h3>
                <div id="isiDetailPengeluaran" class="pengeluaran-detail-list"></div>
                <div class="pengeluaran-modal-actions">
                    <button type="button" class="pengeluaran-modal-cancel" data-action="close">Tutup</button>
                    <button type="button" class="pengeluaran-modal-edit" data-action="edit">Edit</button>
                    <button type="button" class="pengeluaran-modal-delete" data-action="delete">Hapus</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function tutupModalPengeluaran() {
        const modal = document.getElementById('modalDetailPengeluaran');
        if (modal) modal.classList.remove('visible');
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            tutupModalPengeluaran();
        }
    });

    function tambahBarisDetail(label, value) {
        const baris = document.createElement('div');
        baris.className = 'pengeluaran-detail-row';

        const nama = document.createElement('span');
        nama.textContent = label;
        const isi = document.createElement('strong');
        isi.textContent = value;

        baris.append(nama, isi);
        return baris;
    }

    async function hapusPengeluaranDariPopup(item) {
        const yakin = await konfirmasiTindakan({
            judul: 'Hapus Pengeluaran Ini?',
            pesan: `Apakah Anda yakin ingin menghapus data pengeluaran ${item.kategori ? item.kategori + ' ' : ''}${formatRupiah(item.nominal)}?`,
            teksBatal: 'Batal',
            teksKonfirmasi: 'Ya, Hapus',
            tipe: 'danger'
        });

        if (!yakin) return;

        try {
            const respons = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ id_pengeluaran: item.id_pengeluaran })
            });
            const hasil = await respons.json().catch(() => ({}));
            if (!respons.ok || hasil.success !== true) {
                throw new Error(hasil.message || 'Pengeluaran gagal dihapus.');
            }

            tutupModalPengeluaran();
            tampilkanNotifikasi(hasil.message || 'Pengeluaran berhasil dihapus.', 'hapus');
            await muatPengeluaran();
            localStorage.setItem('kataji:data-changed', String(Date.now()));
        } catch (error) {
            tampilkanNotifikasi(error.message || 'Pengeluaran gagal dihapus.', 'gagal');
        }
    }

    async function simpanEditPengeluaran(item, kategori, nominal, idDicatatOleh, keterangan) {
        const respons = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                id_pengeluaran: item.id_pengeluaran,
                kategori,
                nominal,
                id_user: idDicatatOleh,
                keterangan
            })
        });
        const hasil = await respons.json().catch(() => ({}));
        if (!respons.ok || hasil.success !== true) {
            throw new Error(hasil.message || 'Perubahan pengeluaran gagal disimpan.');
        }
        return hasil;
    }

    async function bukaEditPengeluaran(item) {
        const modal = document.getElementById('modalDetailPengeluaran');
        const judul = modal.querySelector('#judulModalPengeluaran');
        const isi = modal.querySelector('#isiDetailPengeluaran');
        judul.textContent = 'Edit Pengeluaran';
        isi.innerHTML = `
            <label class="pengeluaran-edit-field">
                <span>Kategori</span>
                <select id="editKategoriPengeluaran">
                    <option value="">Pilih kategori</option>
                    <option value="Bahan">Bahan</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Peralatan">Peralatan</option>
                    <option value="Lainnya">Lainnya</option>
                </select>
            </label>
            <label class="pengeluaran-edit-field">
                <span>Nominal (Rp)</span>
                <input type="number" id="editNominalPengeluaran" min="1" step="1">
            </label>
            <label class="pengeluaran-edit-field">
                <span>Dicatat oleh</span>
                <select id="editDicatatPengeluaran">
                    <option value="">Ketik disini...</option>
                </select>
            </label>
            <label class="pengeluaran-edit-field">
                <span class="pengeluaran-edit-label">
                    <span>Alasan diedit</span>
                    <small>Wajib diisi</small>
                </span>
                <textarea id="editKeteranganPengeluaran" maxlength="255" rows="3" placeholder="Contoh: salah ketik nominal"></textarea>
            </label>
        `;

        isi.querySelector('#editKategoriPengeluaran').value = item.kategori || '';
        isi.querySelector('#editNominalPengeluaran').value = Number(item.nominal) || '';
        isi.querySelector('#editKeteranganPengeluaran').value = '';

        try {
            const daftarBarber = await muatDaftarBarberPengeluaran();
            const selectDicatat = isi.querySelector('#editDicatatPengeluaran');
            daftarBarber.forEach((barber) => {
                const option = document.createElement('option');
                option.value = barber.id_user;
                option.textContent = barber.nama;
                selectDicatat.appendChild(option);
            });

            if (item.id_user && !daftarBarber.some((barber) => Number(barber.id_user) === Number(item.id_user))) {
                const option = document.createElement('option');
                option.value = item.id_user;
                option.textContent = item.nama_user || 'Pengguna';
                selectDicatat.appendChild(option);
            }
            selectDicatat.value = String(item.id_user || '');
        } catch (error) {
            tampilkanNotifikasi(error.message || 'Daftar dicatat oleh gagal dimuat.', 'gagal');
        }

        const actions = modal.querySelector('.pengeluaran-modal-actions');
        actions.classList.add('edit-mode');
        actions.innerHTML = `
            <button type="button" class="pengeluaran-modal-cancel" data-action="cancel-edit">Batal</button>
            <button type="button" class="pengeluaran-modal-save" data-action="save-edit">Simpan</button>
        `;
    }

    function bukaDetailPengeluaran(item) {
        buatModalPengeluaran();
        const modal = document.getElementById('modalDetailPengeluaran');
        const judul = modal.querySelector('#judulModalPengeluaran');
        const isi = modal.querySelector('#isiDetailPengeluaran');
        judul.textContent = 'Detail Pengeluaran';
        isi.replaceChildren(
            tambahBarisDetail('Tanggal', formatTanggalISO(item.tanggal)),
            tambahBarisDetail('Kategori', item.kategori || '-'),
            tambahBarisDetail('Nominal', formatRupiah(item.nominal)),
            tambahBarisDetail('Dicatat oleh', item.nama_user || '-'),
            tambahBarisDetail('Akun yang login', item.akun_login || '-'),
            tambahBarisDetail('Waktu dicatat', formatWaktuPengeluaran(item.dibuat_pada)),
            tambahBarisDetail('Alasan', ambilAlasanPengeluaran(item.keterangan))
        );
        const riwayat = document.createElement('div');
        riwayat.className = 'pengeluaran-change-history';
        riwayat.innerHTML = `<strong>Riwayat perubahan</strong><div>${formatRiwayatPengeluaran(item.keterangan, item)}</div>`;
        isi.appendChild(riwayat);
        modal.querySelector('.pengeluaran-modal-actions').innerHTML = `
            <button type="button" class="pengeluaran-modal-cancel" data-action="close">Tutup</button>
            <button type="button" class="pengeluaran-modal-edit" data-action="edit">Edit</button>
            <button type="button" class="pengeluaran-modal-delete" data-action="delete">Hapus</button>
        `;

        const actions = modal.querySelector('.pengeluaran-modal-actions');
        actions.classList.remove('edit-mode');
        actions.onclick = async (event) => {
            const action = event.target.dataset.action;
            if (action === 'close') {
                tutupModalPengeluaran();
                return;
            }
            if (action === 'cancel-edit') {
                bukaDetailPengeluaran(item);
                return;
            }
            if (action === 'edit') bukaEditPengeluaran(item);
            if (action === 'delete') await hapusPengeluaranDariPopup(item);
            if (action === 'save-edit') {
                const kategori = isi.querySelector('#editKategoriPengeluaran').value.trim();
                const nominal = Number(isi.querySelector('#editNominalPengeluaran').value);
                const idDicatatOleh = Number(isi.querySelector('#editDicatatPengeluaran').value);
                const keterangan = isi.querySelector('#editKeteranganPengeluaran').value.trim();

                if (!kategori) {
                    await tampilkanAlert({ judul: 'Validasi Pengeluaran', pesan: 'Kategori wajib dipilih.', tipe: 'primary' });
                    return;
                }
                if (!Number.isInteger(nominal) || nominal <= 0 || nominal > 2147483647) {
                    await tampilkanAlert({ judul: 'Validasi Pengeluaran', pesan: 'Nominal harus berupa angka bulat lebih dari nol.', tipe: 'primary' });
                    return;
                }
                if (!Number.isInteger(idDicatatOleh) || idDicatatOleh <= 0) {
                    await tampilkanAlert({
                        judul: 'Validasi Pengeluaran',
                        pesan: 'Nama dicatat oleh wajib dipilih.',
                        tipe: 'primary'
                    });
                    isi.querySelector('#editDicatatPengeluaran').focus();
                    return;
                }
                const adaPerubahan = kategori !== item.kategori ||
                    nominal !== Number(item.nominal) ||
                    idDicatatOleh !== Number(item.id_user);
                if (adaPerubahan && !keterangan) {
                    await tampilkanAlert({
                        judul: 'Validasi Pengeluaran',
                        pesan: 'Alasan diedit wajib diisi.',
                        tipe: 'primary'
                    });
                    isi.querySelector('#editKeteranganPengeluaran').focus();
                    return;
                }

                try {
                    const hasil = await simpanEditPengeluaran(item, kategori, nominal, idDicatatOleh, keterangan);
                    tutupModalPengeluaran();
                    tampilkanNotifikasi(hasil.message || 'Perubahan pengeluaran berhasil disimpan.', 'berhasil');
                    await muatPengeluaran();
                    localStorage.setItem('kataji:data-changed', String(Date.now()));
                } catch (error) {
                    tampilkanNotifikasi(error.message || 'Perubahan pengeluaran gagal disimpan.', 'gagal');
                }
            }
        };
        modal.onclick = (event) => {
            if (event.target === modal) {
                tutupModalPengeluaran();
            }
        };
        modal.classList.add('visible');
    }

    // ======================================================
    // 6. MENAMPILKAN DAFTAR & TOTAL
    // ======================================================

    function tampilkanDaftar(data) {
        daftarElement.replaceChildren();

        const periode = data.periode || periodeAktif;
        const tanggal = data.tanggal || tanggalInput.value || tanggalLokal();
        const judulPeriode = {
            hari: tanggal === tanggalLokal()
                ? 'Pengeluaran Hari Ini'
                : `Pengeluaran Tanggal ${formatTanggal(tanggal)}`,
            minggu: 'Pengeluaran Minggu Ini',
            bulan: 'Pengeluaran Bulan Ini',
            semua: 'Semua Pengeluaran'
        };
        if (judulDaftarElement) {
            judulDaftarElement.textContent =
                judulPeriode[periode] || 'Daftar Pengeluaran';
        }

        const daftar = Array.isArray(data.pengeluaran)
            ? data.pengeluaran
            : [];

        if (daftar.length === 0) {
            const pesanKosong = {
                hari: 'Belum ada pengeluaran pada tanggal ini.',
                minggu: 'Belum ada pengeluaran pada minggu ini.',
                bulan: 'Belum ada pengeluaran pada bulan ini.',
                semua: 'Belum ada data pengeluaran.'
            };
            tampilkanKosong(pesanKosong[periode] || 'Belum ada data pengeluaran.');
        } else {
            daftar.forEach((item) => {
                item.akun_login = data.akun_login || '';
                const baris = document.createElement('tr');

                baris.appendChild(buatSel(formatTanggal(item.tanggal)));
                baris.appendChild(buatSel(item.kategori || '-'));
                baris.appendChild(buatSel(formatRupiah(item.nominal)));

                const selAksi = document.createElement('td');
                selAksi.className = 'pengeluaran-action-cell';
                const detail = document.createElement('button');
                detail.type = 'button';
                detail.className = 'pengeluaran-detail-btn';
                detail.textContent = 'Detail';
                detail.addEventListener('click', () => bukaDetailPengeluaran(item));
                selAksi.appendChild(detail);

                baris.appendChild(selAksi);
                daftarElement.appendChild(baris);
            });
        }

        const total = Number(data.total_pengeluaran) || 0;
        totalElement.textContent = formatRupiah(total);

        if (ringkasanElement) {
            ringkasanElement.textContent = formatRupiah(total);
        }

        const rincianKategori = Array.isArray(data.rincian_per_kategori)
            ? data.rincian_per_kategori
            : null;
        const kategoriBahan = rincianKategori?.find((item) =>
            String(item.kategori || '').trim().toLocaleLowerCase('id-ID') === 'bahan'
        );
        const ringkasanBahan = document.getElementById('ringkasanPembelianBahan');
        if (ringkasanBahan && rincianKategori) {
            ringkasanBahan.textContent = formatRupiah(
                kategoriBahan?.total_pengeluaran || 0
            );
        }

        const ringkasanHpp = document.getElementById('ringkasanHppLayanan');
        if (ringkasanHpp && data.hpp_layanan !== undefined) {
            ringkasanHpp.textContent = formatRupiah(data.hpp_layanan);
        }

        const daftarHpp = document.getElementById('daftarHppLayanan');
        if (daftarHpp) {
            const baris = document.createElement('tr');
            const sel = document.createElement('td');
            sel.colSpan = 4;
            sel.className = 'pengeluaran-hpp-empty';
            sel.textContent = data.hpp_lengkap === false
                ? 'API menyediakan total HPP, tetapi ada transaksi yang belum memiliki data HPP. Rincian HPP per layanan belum tersedia.'
                : 'API menyediakan total HPP, tetapi belum menyediakan rincian HPP per layanan.';
            baris.appendChild(sel);
            daftarHpp.replaceChildren(baris);
        }
    }

    // ======================================================
    // 7. MEMUAT DATA PENGELUARAN DARI API
    // ======================================================

    async function muatPengeluaran() {
        tampilkanStatus('Memuat data pengeluaran...');

        try {
            const params = new URLSearchParams({
                tanggal: tanggalInput.value || tanggalLokal(),
                periode: periodeAktif
            });

            const respons = await fetch(
                `${API_URL}?${params.toString()}`,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );

            const hasil = await respons.json();

            if (!respons.ok || hasil.success !== true) {
                throw new Error(
                    hasil.message || 'Gagal memuat data pengeluaran.'
                );
            }

            tampilkanDaftar(hasil.data || {});
            tampilkanStatus('');
        } catch (error) {
            tampilkanKosong('Data pengeluaran gagal dimuat.');
            tampilkanStatus(
                error.message || 'Terjadi kesalahan saat memuat data.'
            );
        }
    }

    async function muatRingkasan() {
        const respons = await fetch(
            `${DASHBOARD_API_URL}?periode=${encodeURIComponent(periodeAktif)}&tanggal=${encodeURIComponent(tanggalInput.value || tanggalLokal())}&limit=1`,
            {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            }
        );
        const hasil = await respons.json();
        if (!respons.ok || hasil.success !== true) {
            throw new Error(hasil.message || 'Ringkasan pengeluaran gagal dimuat.');
        }

        const keuangan = hasil.data?.keuangan || {};
        const ringkasanHpp = document.getElementById('ringkasanHppLayanan');
        const ringkasanOperasional = document.getElementById('totalRingkasanPengeluaran');
        const daftarHpp = document.getElementById('daftarHppLayanan');

        if (ringkasanHpp) ringkasanHpp.textContent = formatRupiah(keuangan.hpp || 0);
        if (ringkasanOperasional) ringkasanOperasional.textContent = formatRupiah(keuangan.biaya_operasional || 0);

        if (daftarHpp) {
            const baris = document.createElement('tr');
            const sel = document.createElement('td');
            sel.colSpan = 4;
            sel.className = 'pengeluaran-hpp-empty';
            sel.textContent = keuangan.hpp_lengkap === false
                ? 'API menyediakan total HPP, tetapi ada transaksi yang belum memiliki data HPP. Rincian HPP per layanan belum tersedia.'
                : 'API menyediakan total HPP, tetapi belum menyediakan rincian HPP per layanan.';
            baris.appendChild(sel);
            daftarHpp.replaceChildren(baris);
        }
    }

    // ======================================================
    // 8. SIMPAN PENGELUARAN BARU
    // ======================================================

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const valid = validasiForm();
        if (!valid) return;

        const kategori = kategoriInput.value.trim();
        const nominal = Number(nominalInput.value);
        const tanggalTerpilih = tanggalInput.value || tanggalLokal();

        const yakin = await konfirmasiTindakan({
            judul: 'Simpan Pengeluaran?',
            pesan: `Apakah Anda yakin ingin mencatat pengeluaran "${kategori}" sebesar ${formatRupiah(nominal)}?`,
            teksBatal: 'Batal',
            teksKonfirmasi: 'Ya, Simpan',
            tipe: 'primary'
        });

        if (!yakin) return;

        tombolSimpan.disabled = true;
        tombolSimpan.textContent = 'Menyimpan...';

        try {
            const payload = {
                kategori: kategoriInput.value.trim(),
                nominal: Number(nominalInput.value),
                tanggal: tanggalTerpilih
            };

            const respons = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            const hasil = await respons.json().catch(() => ({}));

            if (!respons.ok || hasil.success !== true) {
                throw new Error(
                    hasil.message || 'Pengeluaran gagal disimpan.'
                );
            }

            form.reset();
            tanggalInput.value = tanggalTerpilih;

            bersihkanError(kategoriInput, errorKategori);
            bersihkanError(nominalInput, errorNominal);

            tampilkanNotifikasi(
                hasil.message || 'Pengeluaran berhasil disimpan.',
                'berhasil'
            );
            await tampilkanAlert({
                judul: 'Berhasil Disimpan',
                pesan: hasil.message || 'Pengeluaran berhasil disimpan.',
                teksTombol: 'Mengerti',
                tipe: 'primary'
            });

            await muatPengeluaran();
            localStorage.setItem('kataji:data-changed', String(Date.now()));
        } catch (error) {
            tampilkanNotifikasi(
                error.message || 'Terjadi kesalahan saat menyimpan.',
                'gagal'
            );
            await tampilkanAlert({
                judul: 'Gagal Menyimpan',
                pesan: error.message || 'Terjadi kesalahan saat menyimpan.',
                teksTombol: 'Tutup',
                tipe: 'danger'
            });
        } finally {
            tombolSimpan.disabled = false;
            tombolSimpan.textContent = 'Simpan';
        }
    });

    tanggalInput.value = tanggalLokal();
    tanggalInput.addEventListener('change', async () => {
        periodeAktif = 'hari';
        document.querySelectorAll('.pengeluaran-period-options [data-periode]').forEach((item) => {
            const aktif = item.dataset.periode === 'hari';
            item.classList.toggle('active', aktif);
            item.setAttribute('aria-pressed', String(aktif));
        });
        await muatPengeluaran();
        await muatRingkasan();
    });

    document.querySelectorAll('.pengeluaran-period-options [data-periode]').forEach((tombol) => {
        tombol.addEventListener('click', async () => {
            periodeAktif = tombol.dataset.periode || 'hari';
            document.querySelectorAll('.pengeluaran-period-options [data-periode]').forEach((item) => {
                const aktif = item === tombol;
                item.classList.toggle('active', aktif);
                item.setAttribute('aria-pressed', String(aktif));
            });

            if (periodeAktif === 'hari') {
                tanggalInput.value = tanggalLokal();
                await muatPengeluaran();
            } else {
                tanggalInput.value = '';
                await muatPengeluaran();
            }
            await muatRingkasan();
        });
    });

    bersihkanError(kategoriInput, errorKategori);
    bersihkanError(nominalInput, errorNominal);

    muatPengeluaran();
    muatRingkasan().catch((error) => tampilkanStatus(error.message));
});
