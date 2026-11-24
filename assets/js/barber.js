/**
 * Kataji Barber - Data Barber (Frontend)
 * Halaman manajemen barber untuk role owner
 */

document.addEventListener('DOMContentLoaded', function () {

    // ======================================================
    // KONSTANTA & REFERENSI DOM
    // ======================================================

    const API_BARBER        = '/KELOMPOK-5/api/barber/index.php';
    const API_AKUN          = '/KELOMPOK-5/api/barber/akun.php';
    const API_RESET_PW      = '/KELOMPOK-5/api/barber/reset_password.php';
    const API_FOTO          = '/KELOMPOK-5/api/barber/foto.php';
    const AVATAR_BG         = '#B9BCFF';
    const AVATAR_COLOR      = '#17186B';
    const MAX_FOTO_BYTES    = 10 * 1024 * 1024; // 10 MB

    // State
    let filterAktif         = 'semua';
    let daftarBarber        = [];
    let notifTimer          = null;
    let kataKunci           = '';   // kata kunci pencarian
    let halamanAktif        = 1;    // pagination
    let perHalaman          = 10;

    // DOM refs — tabel
    const tableBody         = document.getElementById('barberTableBody');
    const tableWrapper      = document.getElementById('barberTableWrapper');
    const loadingState      = document.getElementById('barberLoadingState');
    const emptyState        = document.getElementById('barberEmptyState');
    const notifikasi        = document.getElementById('barberNotifikasi');

    // DOM refs — filter
    const filterTabs        = document.querySelectorAll('.barber-tab');

    // DOM refs — pencarian & pagination
    const inputCari         = document.getElementById('barberSearch');
    const emptyText         = document.getElementById('barberEmptyText');
    const footerTabel       = document.getElementById('barberTableFooter');
    const infoTabel         = document.getElementById('barberInfo');
    const btnPrev           = document.getElementById('barberPrev');
    const btnNext           = document.getElementById('barberNext');
    const pageNumbers       = document.getElementById('barberPageNumbers');
    const selectPerHalaman  = document.getElementById('barberPerPage');

    // DOM refs — modal Tambah
    const modalTambah       = document.getElementById('modalTambahBarber');
    const formTambah        = document.getElementById('formTambahBarber');
    const bannerErrTambah   = document.getElementById('barberBannerErrorTambah');
    const previewFotoTambah = document.getElementById('previewFotoTambah');
    const inisialTambah     = document.getElementById('inisialTambah');
    const imgPreviewTambah  = document.getElementById('imgPreviewTambah');
    const inputFotoTambah   = document.getElementById('inputFotoTambah');
    const tambahNama        = document.getElementById('tambahNama');
    const tambahUsername    = document.getElementById('tambahUsername');
    const tambahPassword    = document.getElementById('tambahPassword');
    const tambahSpesialisasi = document.getElementById('tambahSpesialisasi');
    const errTambahNama     = document.getElementById('errorTambahNama');
    const errTambahUsername = document.getElementById('errorTambahUsername');
    const errTambahPassword = document.getElementById('errorTambahPassword');
    const errTambahSpes     = document.getElementById('errorTambahSpesialisasi');
    const btnSimpanTambah   = document.getElementById('simpanTambahBarber');

    // DOM refs — modal Ubah
    const modalUbah         = document.getElementById('modalUbahProfil');
    const formUbah          = document.getElementById('formUbahProfil');
    const bannerErrUbah     = document.getElementById('barberBannerErrorUbah');
    const ubahIdUser        = document.getElementById('ubahIdUser');
    const previewFotoUbah   = document.getElementById('previewFotoUbah');
    const inisialUbah       = document.getElementById('inisialUbah');
    const imgPreviewUbah    = document.getElementById('imgPreviewUbah');
    const inputFotoUbah     = document.getElementById('inputFotoUbah');
    const ubahNama          = document.getElementById('ubahNama');
    const ubahUsername      = document.getElementById('ubahUsername');
    const ubahSpesialisasi  = document.getElementById('ubahSpesialisasi');
    const errUbahNama       = document.getElementById('errorUbahNama');
    const errUbahSpes       = document.getElementById('errorUbahSpesialisasi');
    const btnSimpanUbah     = document.getElementById('simpanUbahProfil');
    const btnHapusFoto      = document.getElementById('btnHapusFoto');

    // DOM refs — modal Reset
    const modalReset        = document.getElementById('modalResetPassword');
    const formReset         = document.getElementById('formResetPassword');
    const resetIdUser       = document.getElementById('resetIdUser');
    const resetSubtitle     = document.getElementById('resetSubtitle');
    const resetPasswordBaru = document.getElementById('resetPasswordBaru');
    const errResetPassword  = document.getElementById('errorResetPassword');
    const btnSimpanReset    = document.getElementById('simpanResetPassword');

    // ======================================================
    // 1. UTILITAS AVATAR
    // ======================================================

    function buatInisial(nama) {
        if (!nama || typeof nama !== 'string') return '?';
        return nama.trim().charAt(0).toUpperCase();
    }

    function dapatkanUrlFoto(pathFoto) {
        if (!pathFoto) return '';
        if (pathFoto.startsWith('http') || pathFoto.startsWith('/')) {
            return pathFoto;
        }
        return '/KELOMPOK-5/' + pathFoto;
    }

    function buatAvatarHTML(barber, ukuran) {
        const size = ukuran || 40;
        const urlFoto = dapatkanUrlFoto(barber.foto || barber.foto_url);
        if (urlFoto) {
            return `<img
                src="${urlFoto}"
                alt="Foto ${escHTML(barber.nama)}"
                class="barber-avatar barber-avatar--foto"
                style="width:${size}px;height:${size}px;object-fit:cover;border-radius:50%;"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            ><span
                class="barber-avatar barber-avatar--inisial"
                style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px;display:none;"
                aria-hidden="true"
            >${buatInisial(barber.nama)}</span>`;
        }
        return `<span
            class="barber-avatar barber-avatar--inisial"
            style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px;"
            aria-hidden="true"
        >${buatInisial(barber.nama)}</span>`;
    }

    function aturPreviewFoto(preview, inisialEl, imgEl, barber, nama) {
        const urlFoto = barber ? dapatkanUrlFoto(barber.foto || barber.foto_url) : '';
        if (urlFoto) {
            imgEl.src = urlFoto;
            imgEl.hidden = false;
            inisialEl.hidden = true;
        } else {
            imgEl.src = '';
            imgEl.hidden = true;
            inisialEl.textContent = buatInisial(nama || '');
            inisialEl.hidden = false;
        }
    }

    // ======================================================
    // 2. UTILITAS UMUM
    // ======================================================

    function escHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Akun owner (jika API menyertakan field role/peran)
    function adalahOwner(barber) {
        const role = String(barber.role || barber.peran || '').toLowerCase();
        return role === 'owner' || barber.is_owner === true || Number(barber.is_owner) === 1;
    }

    function tampilkanNotifikasi(pesan, jenis) {
        if (!notifikasi) return;
        clearTimeout(notifTimer);
        notifikasi.className = 'transaction-success';
        if (jenis === 'error' || jenis === 'gagal') {
            notifikasi.classList.add('transaction-error');
        }
        notifikasi.textContent = pesan;
        notifikasi.classList.add('show');
        notifTimer = setTimeout(function () {
            notifikasi.classList.remove('show');
        }, 3500);
    }

    function setFieldError(inputEl, errEl, pesan) {
        if (!inputEl || !errEl) return;
        inputEl.classList.add('is-invalid');
        errEl.textContent = pesan;
    }

    function clearFieldError(inputEl, errEl) {
        if (!inputEl || !errEl) return;
        inputEl.classList.remove('is-invalid');
        errEl.textContent = '';
    }

    function setLoading(aktif) {
        if (!loadingState || !tableWrapper || !emptyState) return;
        if (aktif) {
            loadingState.hidden = false;
            tableWrapper.hidden = true;
            emptyState.hidden = true;
        } else {
            loadingState.hidden = true;
        }
    }

    function setEmpty(aktif) {
        if (!emptyState || !tableWrapper) return;
        if (aktif) {
            emptyState.hidden = false;
            tableWrapper.hidden = true;
        } else {
            emptyState.hidden = true;
            tableWrapper.hidden = false;
        }
    }

    async function requestJSON(method, url, body) {
        const opts = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body !== undefined) opts.body = JSON.stringify(body);
        const resp = await fetch(url, opts);
        const json = await resp.json().catch(function () { return {}; });
        if (!resp.ok) {
            throw new Error(json.message || 'Terjadi kesalahan pada server.');
        }
        return json;
    }

    async function requestFormData(method, url, formData) {
        // PUT/PATCH via FormData — beberapa server butuh _method
        const opts = { method: method, body: formData };
        const resp = await fetch(url, opts);
        const json = await resp.json().catch(function () { return {}; });
        if (!resp.ok) {
            throw new Error(json.message || 'Terjadi kesalahan pada server.');
        }
        return json;
    }

    // ======================================================
    // 3. MUAT DATA BARBER
    // ======================================================

    async function muatBarber() {
        setLoading(true);
        try {
            const result = await fetch(API_AKUN);
            const json = await result.json().catch(function () { return {}; });
            if (!result.ok) {
                throw new Error(json.message || 'Gagal memuat data barber.');
            }
            daftarBarber = Array.isArray(json.data) ? json.data : [];
            renderTabel();
        } catch (err) {
            setLoading(false);
            setEmpty(false);
            tableWrapper.hidden = false;
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--error);padding:24px;">
                Gagal memuat data. Periksa koneksi dan coba lagi.</td></tr>`;
            tampilkanNotifikasi(err.message || 'Gagal memuat data barber.', 'error');
        }
    }

    // Cocokkan kata kunci dengan nama, username, atau spesialisasi
    function cocokPencarian(b) {
        if (!kataKunci) return true;
        const q = kataKunci.toLowerCase();
        return [b.nama, b.username, b.spesialisasi].some(function (v) {
            return String(v || '').toLowerCase().indexOf(q) !== -1;
        });
    }

    // Isi angka pada tab: Semua (12) / Aktif (10) / Tidak aktif (2)
    function perbaruiJumlahTab() {
        const jumlah = {
            semua:    daftarBarber.length,
            aktif:    daftarBarber.filter(function (b) { return Number(b.aktif) === 1; }).length,
            nonaktif: daftarBarber.filter(function (b) { return Number(b.aktif) === 0; }).length
        };
        document.querySelectorAll('[data-count-for]').forEach(function (el) {
            el.textContent = '(' + (jumlah[el.dataset.countFor] || 0) + ')';
        });
    }

    function renderTabel() {
        setLoading(false);
        perbaruiJumlahTab();
        const filtered = daftarBarber.filter(function (b) {
            if (filterAktif === 'aktif')    return Number(b.aktif) === 1;
            if (filterAktif === 'nonaktif') return Number(b.aktif) === 0;
            return true;
        }).filter(cocokPencarian).sort(function (a, b) {
            const aOwner = adalahOwner(a) ? 0 : 1;
            const bOwner = adalahOwner(b) ? 0 : 1;
            if (aOwner !== bOwner) return aOwner - bOwner;
            return (a.nama || '').localeCompare(b.nama || '');
        });

        if (filtered.length === 0) {
            if (emptyText) {
                emptyText.textContent = kataKunci ? 'Barber tidak ditemukan' : 'Belum ada barber';
            }
            setEmpty(true);
            renderPagination(0, 0);
            return;
        }
        setEmpty(false);

        const totalHalaman = Math.max(1, Math.ceil(filtered.length / perHalaman));
        if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;
        const mulai  = (halamanAktif - 1) * perHalaman;
        const tampil = filtered.slice(mulai, mulai + perHalaman);

        tableBody.replaceChildren();
        tampil.forEach(function (barber, i) {
            tableBody.appendChild(buatBaris(barber, mulai + i + 1));
        });
        renderPagination(tampil.length, totalHalaman);
    }

    function renderPagination(jumlahTampil, totalHalaman) {
        if (!footerTabel) return;
        if (!jumlahTampil) {
            footerTabel.hidden = true;
            return;
        }
        footerTabel.hidden = false;
        infoTabel.textContent = 'Menampilkan ' + jumlahTampil + ' Data Barber';
        btnPrev.disabled = halamanAktif <= 1;
        btnNext.disabled = halamanAktif >= totalHalaman;

        // Tampilkan maksimal 5 nomor halaman di sekitar halaman aktif
        let akhir = Math.min(totalHalaman, Math.max(1, halamanAktif - 2) + 4);
        let awal  = Math.max(1, akhir - 4);
        pageNumbers.replaceChildren();
        for (let p = awal; p <= akhir; p++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'barber-page-btn' + (p === halamanAktif ? ' is-active' : '');
            btn.textContent = p;
            btn.setAttribute('aria-label', 'Halaman ' + p);
            if (p === halamanAktif) btn.setAttribute('aria-current', 'page');
            btn.addEventListener('click', function () {
                halamanAktif = p;
                renderTabel();
            });
            pageNumbers.appendChild(btn);
        }
    }

    // ======================================================
    // 4. BUAT BARIS TABEL
    // ======================================================

    function buatBaris(barber, nomor) {
        const aktif = Number(barber.aktif) === 1;
        const tr = document.createElement('tr');
        tr.dataset.id = barber.id_user;

        // Kolom No
        const tdNo = document.createElement('td');
        tdNo.className = 'barber-col-no';
        tdNo.textContent = nomor || '';

        // Kolom Foto (disembunyikan lewat CSS sesuai desain; hapus aturan
        // .barber-col-foto { display: none } di style.css untuk menampilkan lagi)
        const tdFoto = document.createElement('td');
        tdFoto.className = 'barber-col-foto';
        tdFoto.innerHTML = `<div class="barber-avatar-cell">${buatAvatarHTML(barber, 40)}</div>`;

        // Kolom Nama
        const tdNama = document.createElement('td');
        tdNama.className = 'barber-col-nama';
        const isOwner = adalahOwner(barber);
        const badgeOwner = isOwner ? ' <span class="barber-owner-badge">Owner</span>' : '';
        tdNama.innerHTML = `<div class="barber-nama-cell"><strong class="barber-nama-teks${isOwner ? ' barber-nama-teks--owner' : ''}" title="${escHTML(barber.nama)}">${escHTML(barber.nama)}</strong>${badgeOwner}</div>`;

        // Kolom Username
        const tdUsername = document.createElement('td');
        tdUsername.textContent = barber.username || '-';

        // Kolom Spesialisasi
        const tdSpes = document.createElement('td');
        tdSpes.className = 'barber-col-spes';
        const teksSpes = barber.spesialisasi || '-';
        tdSpes.innerHTML = `<div class="barber-spes-cell"><span class="barber-spes-teks" title="${barber.spesialisasi ? escHTML(barber.spesialisasi) : ''}">${escHTML(teksSpes)}</span></div>`;

        // Kolom Status
        const tdStatus = document.createElement('td');
        tdStatus.className = 'barber-col-status';
        tdStatus.innerHTML = aktif
            ? '<span class="barber-status-badge barber-status-badge--aktif">Aktif</span>'
            : '<span class="barber-status-badge barber-status-badge--nonaktif"> Nonaktif </span>';

        // Kolom Aksi
        const tdAksi = document.createElement('td');
        tdAksi.className = 'barber-aksi';
        const grupAksi = document.createElement('div');
        grupAksi.className = 'barber-aksi-group';

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'barber-btn-aksi barber-btn-aksi--edit';
        btnEdit.textContent = 'Ubah Profil';
        btnEdit.addEventListener('click', function () { bukaModalUbah(barber); });

        const btnReset = document.createElement('button');
        btnReset.type = 'button';
        btnReset.className = 'barber-btn-aksi barber-btn-aksi--reset';
        btnReset.textContent = 'Reset Password';
        btnReset.addEventListener('click', function () { bukaModalReset(barber); });

        // Tombol Nonaktifkan / Aktifkan (menggantikan toggle switch)
        const btnStatus = document.createElement('button');
        btnStatus.type = 'button';
        btnStatus.className = 'barber-btn-aksi ' + (aktif ? 'barber-btn-aksi--nonaktif' : 'barber-btn-aksi--aktif');
        btnStatus.textContent = aktif ? 'Nonaktifkan' : 'Aktifkan';
        btnStatus.setAttribute('aria-label', (aktif ? 'Nonaktifkan ' : 'Aktifkan ') + (barber.nama || 'barber'));
        btnStatus.addEventListener('click', function () {
            if (aktif && adalahOwner(barber)) {
                tampilkanNotifikasi('Akun owner tidak dapat dinonaktifkan', 'error');
                return;
            }
            konfirmasiToggle(barber, !aktif);
        });

        grupAksi.appendChild(btnEdit);
        grupAksi.appendChild(btnReset);
        grupAksi.appendChild(btnStatus);
        tdAksi.appendChild(grupAksi);

        tr.appendChild(tdNo);
        tr.appendChild(tdFoto);
        tr.appendChild(tdNama);
        tr.appendChild(tdUsername);
        tr.appendChild(tdSpes);
        tr.appendChild(tdStatus);
        tr.appendChild(tdAksi);
        return tr;
    }

    // ======================================================
    // 5. FILTER TABS
    // ======================================================

    filterTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            filterTabs.forEach(function (t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            filterAktif = tab.dataset.filter;
            halamanAktif = 1;
            renderTabel();
        });
    });

    // Pencarian
    if (inputCari) {
        inputCari.addEventListener('input', function () {
            kataKunci = inputCari.value.trim();
            halamanAktif = 1;
            renderTabel();
        });
    }

    // Pagination
    if (btnPrev) {
        btnPrev.addEventListener('click', function () {
            if (halamanAktif > 1) { halamanAktif--; renderTabel(); }
        });
    }
    if (btnNext) {
        btnNext.addEventListener('click', function () {
            halamanAktif++;   // dibatasi otomatis di renderTabel()
            renderTabel();
        });
    }
    if (selectPerHalaman) {
        selectPerHalaman.addEventListener('change', function () {
            perHalaman = parseInt(selectPerHalaman.value, 10) || 10;
            halamanAktif = 1;
            renderTabel();
        });
    }

    // ======================================================
    // 6. MODAL — HELPERS
    // ======================================================

    function bukaModal(modal) {
        if (!modal) return;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('barber-modal-open');
    }

    function tutupModal(modal) {
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('barber-modal-open');
    }

    // Tutup saat klik overlay
    [modalTambah, modalUbah, modalReset].forEach(function (modal) {
        if (!modal) return;
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                tutupModal(modal);
                resetSemua();
            }
        });
    });

    // Tutup saat Escape
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        [modalTambah, modalUbah, modalReset].forEach(function (modal) {
            if (modal && modal.classList.contains('is-open')) {
                tutupModal(modal);
                resetSemua();
            }
        });
    });

    function resetSemua() {
        // Reset form tambah
        if (formTambah) {
            formTambah.reset();
            [errTambahNama, errTambahUsername, errTambahPassword, errTambahSpes].forEach(function (el) {
                if (el) el.textContent = '';
            });
            [tambahNama, tambahUsername, tambahPassword, tambahSpesialisasi].forEach(function (el) {
                if (el) el.classList.remove('is-invalid');
            });
            imgPreviewTambah.hidden = true;
            imgPreviewTambah.src = '';
            inisialTambah.textContent = '?';
            inisialTambah.hidden = false;
            if (bannerErrTambah) bannerErrTambah.hidden = true;
        }
        // Reset form ubah
        if (formUbah) {
            formUbah.reset();
            [errUbahNama, errUbahSpes].forEach(function (el) {
                if (el) el.textContent = '';
            });
            [ubahNama, ubahSpesialisasi].forEach(function (el) {
                if (el) el.classList.remove('is-invalid');
            });
            imgPreviewUbah.hidden = true;
            imgPreviewUbah.src = '';
            inisialUbah.textContent = '?';
            inisialUbah.hidden = false;
            if (bannerErrUbah) bannerErrUbah.hidden = true;
        }
        // Reset form reset pw
        if (formReset) {
            formReset.reset();
            if (errResetPassword) errResetPassword.textContent = '';
            if (resetPasswordBaru) resetPasswordBaru.classList.remove('is-invalid');
        }
    }

    // ======================================================
    // 7. MODAL TAMBAH BARBER
    // ======================================================

    function bukaModalTambah() {
        resetSemua();
        bukaModal(modalTambah);
        if (tambahNama) tambahNama.focus();
    }

    function tutupModalTambah() {
        tutupModal(modalTambah);
        resetSemua();
    }

    if (document.getElementById('btnTambahBarber')) {
        document.getElementById('btnTambahBarber').addEventListener('click', bukaModalTambah);
    }
    if (document.getElementById('tutupModalTambah')) {
        document.getElementById('tutupModalTambah').addEventListener('click', tutupModalTambah);
    }
    if (document.getElementById('batalTambahBarber')) {
        document.getElementById('batalTambahBarber').addEventListener('click', tutupModalTambah);
    }

    // Preview foto Tambah
    if (inputFotoTambah) {
        inputFotoTambah.addEventListener('change', function () {
            const file = inputFotoTambah.files[0];
            if (!file) return;
            if (file.size > MAX_FOTO_BYTES) {
                tampilkanNotifikasi('Ukuran foto maksimal 10 MB.', 'error');
                inputFotoTambah.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                imgPreviewTambah.src = e.target.result;
                imgPreviewTambah.hidden = false;
                inisialTambah.hidden = true;
            };
            reader.readAsDataURL(file);
        });
    }

    // Update inisial preview saat nama diketik
    if (tambahNama) {
        tambahNama.addEventListener('input', function () {
            if (imgPreviewTambah && !imgPreviewTambah.hidden) return;
            inisialTambah.textContent = buatInisial(tambahNama.value);
        });
    }

    // Submit Tambah
    if (formTambah) {
        formTambah.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Hapus error lama
            [errTambahNama, errTambahUsername, errTambahPassword, errTambahSpes].forEach(function (el) {
                if (el) el.textContent = '';
            });
            [tambahNama, tambahUsername, tambahPassword, tambahSpesialisasi].forEach(function (el) {
                if (el) el.classList.remove('is-invalid');
            });
            if (bannerErrTambah) bannerErrTambah.hidden = true;

            const nama = tambahNama.value.trim();
            const username = tambahUsername.value.trim();
            const password = tambahPassword.value;
            const spesialisasi = tambahSpesialisasi.value.trim();
            const foto = inputFotoTambah.files[0] || null;

            let valid = true;

            if (!nama) {
                setFieldError(tambahNama, errTambahNama, 'Nama wajib diisi.');
                valid = false;
            } else if (nama.length > 100) {
                setFieldError(tambahNama, errTambahNama, 'Nama maksimal 100 karakter.');
                valid = false;
            }

            if (!username) {
                setFieldError(tambahUsername, errTambahUsername, 'Username wajib diisi.');
                valid = false;
            }

            if (!password) {
                setFieldError(tambahPassword, errTambahPassword, 'Password wajib diisi.');
                valid = false;
            } else if (password.length < 6) {
                setFieldError(tambahPassword, errTambahPassword, 'Password minimal 6 karakter.');
                valid = false;
            }

            if (spesialisasi && spesialisasi.length > 100) {
                setFieldError(tambahSpesialisasi, errTambahSpes, 'Spesialisasi maksimal 100 karakter.');
                valid = false;
            }

            if (foto && foto.size > MAX_FOTO_BYTES) {
                tampilkanNotifikasi('Ukuran foto maksimal 10 MB.', 'error');
                valid = false;
            }

            if (!valid) return;

            btnSimpanTambah.disabled = true;
            btnSimpanTambah.textContent = 'Menyimpan...';

            try {
                const bodyAkun = {
                    nama: nama,
                    username: username,
                    password: password,
                    spesialisasi: spesialisasi || ''
                };

                const result = await requestJSON('POST', API_AKUN, bodyAkun);

                // Unggah foto jika ada file dipilih
                if (foto && result.data && result.data.id_user) {
                    const fdFoto = new FormData();
                    fdFoto.append('id_user', String(result.data.id_user));
                    fdFoto.append('foto', foto);
                    await requestFormData('POST', API_FOTO, fdFoto);
                }

                tutupModalTambah();
                tampilkanNotifikasi(result.message || 'Barber berhasil ditambahkan.', 'berhasil');
                await muatBarber();
            } catch (err) {
                if (bannerErrTambah) bannerErrTambah.hidden = false;
                tampilkanNotifikasi(err.message, 'error');
            } finally {
                btnSimpanTambah.disabled = false;
                btnSimpanTambah.textContent = 'Simpan';
            }
        });
    }

    // ======================================================
    // 8. MODAL UBAH PROFIL
    // ======================================================

    let fotoUbahDihapus = false;

    function bukaModalUbah(barber) {
        resetSemua();
        fotoUbahDihapus = false;
        ubahIdUser.value = barber.id_user;
        ubahNama.value = barber.nama || '';
        ubahUsername.value = barber.username || '';
        ubahSpesialisasi.value = barber.spesialisasi || '';

        // Preview foto
        aturPreviewFoto(previewFotoUbah, inisialUbah, imgPreviewUbah, barber, barber.nama);

        bukaModal(modalUbah);
        if (ubahNama) ubahNama.focus();
    }

    function tutupModalUbah() {
        tutupModal(modalUbah);
        resetSemua();
        fotoUbahDihapus = false;
    }

    if (document.getElementById('tutupModalUbah')) {
        document.getElementById('tutupModalUbah').addEventListener('click', tutupModalUbah);
    }
    if (document.getElementById('batalUbahProfil')) {
        document.getElementById('batalUbahProfil').addEventListener('click', tutupModalUbah);
    }

    // Preview foto Ubah
    if (inputFotoUbah) {
        inputFotoUbah.addEventListener('change', function () {
            const file = inputFotoUbah.files[0];
            if (!file) return;
            if (file.size > MAX_FOTO_BYTES) {
                tampilkanNotifikasi('Ukuran foto maksimal 10 MB.', 'error');
                inputFotoUbah.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function (e) {
                imgPreviewUbah.src = e.target.result;
                imgPreviewUbah.hidden = false;
                inisialUbah.hidden = true;
                fotoUbahDihapus = false;
            };
            reader.readAsDataURL(file);
        });
    }

    // Update inisial preview ubah
    if (ubahNama) {
        ubahNama.addEventListener('input', function () {
            if (imgPreviewUbah && !imgPreviewUbah.hidden) return;
            inisialUbah.textContent = buatInisial(ubahNama.value);
        });
    }

    // Hapus Foto
    if (btnHapusFoto) {
        btnHapusFoto.addEventListener('click', async function () {
            const idUser = ubahIdUser.value;
            if (!idUser) return;

            const konfirmasi = await katajiKonfirmasi({
                judul: 'Hapus Foto?',
                pesan: 'Foto barber akan dihapus dan diganti dengan inisial nama.',
                teksKonfirmasi: 'Ya, Hapus',
                tipe: 'danger'
            });
            if (!konfirmasi) return;

            btnHapusFoto.disabled = true;
            try {
                await requestJSON('DELETE', API_FOTO, { id_user: parseInt(idUser, 10) });
                // Update preview
                imgPreviewUbah.src = '';
                imgPreviewUbah.hidden = true;
                inisialUbah.textContent = buatInisial(ubahNama.value);
                inisialUbah.hidden = false;
                fotoUbahDihapus = true;
                inputFotoUbah.value = '';
                // Update data lokal
                const idx = daftarBarber.findIndex(function (b) { return String(b.id_user) === String(idUser); });
                if (idx !== -1) {
                    daftarBarber[idx].foto = null;
                    daftarBarber[idx].foto_url = null;
                }
                tampilkanNotifikasi('Foto berhasil dihapus.', 'berhasil');
            } catch (err) {
                tampilkanNotifikasi(err.message, 'error');
            } finally {
                btnHapusFoto.disabled = false;
            }
        });
    }

    // Submit Ubah
    if (formUbah) {
        formUbah.addEventListener('submit', async function (e) {
            e.preventDefault();

            [errUbahNama, errUbahSpes].forEach(function (el) { if (el) el.textContent = ''; });
            [ubahNama, ubahSpesialisasi].forEach(function (el) { if (el) el.classList.remove('is-invalid'); });
            if (bannerErrUbah) bannerErrUbah.hidden = true;

            const idUser = ubahIdUser.value;
            const nama = ubahNama.value.trim();
            const spesialisasi = ubahSpesialisasi.value.trim();
            const foto = inputFotoUbah.files[0] || null;

            let valid = true;

            if (!nama) {
                setFieldError(ubahNama, errUbahNama, 'Nama wajib diisi.');
                valid = false;
            } else if (nama.length > 100) {
                setFieldError(ubahNama, errUbahNama, 'Nama maksimal 100 karakter.');
                valid = false;
            }

            if (spesialisasi && spesialisasi.length > 100) {
                setFieldError(ubahSpesialisasi, errUbahSpes, 'Spesialisasi maksimal 100 karakter.');
                valid = false;
            }

            if (foto && foto.size > MAX_FOTO_BYTES) {
                tampilkanNotifikasi('Ukuran foto maksimal 10 MB.', 'error');
                valid = false;
            }

            if (!valid) return;

            btnSimpanUbah.disabled = true;
            btnSimpanUbah.textContent = 'Menyimpan...';

            try {
                // Sesuai API Contract 10.3: PUT /api/barber/akun.php dengan JSON
                const bodyUbah = {
                    id_user: parseInt(idUser, 10),
                    nama: nama,
                    spesialisasi: spesialisasi || ''
                };
                const result = await requestJSON('PUT', API_AKUN, bodyUbah);

                // Jika pengguna mengunggah foto baru: POST /api/barber/foto.php
                if (foto) {
                    const fdFoto = new FormData();
                    fdFoto.append('id_user', String(idUser));
                    fdFoto.append('foto', foto);
                    await requestFormData('POST', API_FOTO, fdFoto);
                }

                tutupModalUbah();
                tampilkanNotifikasi(result.message || 'Profil berhasil diperbarui.', 'berhasil');
                await muatBarber();
            } catch (err) {
                if (bannerErrUbah) bannerErrUbah.hidden = false;
                tampilkanNotifikasi(err.message, 'error');
            } finally {
                btnSimpanUbah.disabled = false;
                btnSimpanUbah.textContent = 'Simpan';
            }
        });
    }

    // ======================================================
    // 9. MODAL RESET PASSWORD
    // ======================================================

    function bukaModalReset(barber) {
        resetSemua();
        resetIdUser.value = barber.id_user;
        const strong = resetSubtitle.querySelector('strong');
        if (strong) strong.textContent = `${barber.nama} (${barber.username})`;
        bukaModal(modalReset);
        if (resetPasswordBaru) resetPasswordBaru.focus();
    }

    function tutupModalReset() {
        tutupModal(modalReset);
        resetSemua();
    }

    if (document.getElementById('tutupModalReset')) {
        document.getElementById('tutupModalReset').addEventListener('click', tutupModalReset);
    }
    if (document.getElementById('batalResetPassword')) {
        document.getElementById('batalResetPassword').addEventListener('click', tutupModalReset);
    }

    // Submit Reset Password
    if (formReset) {
        formReset.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (errResetPassword) errResetPassword.textContent = '';
            if (resetPasswordBaru) resetPasswordBaru.classList.remove('is-invalid');

            const idUser = resetIdUser.value;
            const pw = resetPasswordBaru.value;

            if (!pw || pw.length < 6) {
                setFieldError(resetPasswordBaru, errResetPassword, 'Password minimal 6 karakter.');
                return;
            }

            btnSimpanReset.disabled = true;
            btnSimpanReset.textContent = 'Menyimpan...';

            try {
                // Sesuai API Contract 10.5: PUT /api/barber/reset_password.php dengan JSON
                const result = await requestJSON('PUT', API_RESET_PW, {
                    id_user: parseInt(idUser, 10),
                    password_baru: pw
                });
                tutupModalReset();
                tampilkanNotifikasi(result.message || 'Password berhasil direset.', 'berhasil');
            } catch (err) {
                setFieldError(resetPasswordBaru, errResetPassword, err.message);
                tampilkanNotifikasi(err.message, 'error');
            } finally {
                btnSimpanReset.disabled = false;
                btnSimpanReset.textContent = 'Simpan';
            }
        });
    }

    // ======================================================
    // 10. KONFIRMASI TOGGLE AKTIF / NONAKTIF
    // ======================================================

    async function konfirmasiToggle(barber, aktifBaru) {
        const namaBarber = barber.nama || 'barber ini';
        const judul = aktifBaru
            ? `Aktifkan akun ${namaBarber}?`
            : `Nonaktifkan akun ${namaBarber}?`;
        const pesan = aktifBaru
            ? `${namaBarber} akan bisa login kembali dan namanya muncul di pilihan Nama Barber.`
            : `${namaBarber} tidak akan bisa login dan namanya hilang dari pilihan Nama Barber. Riwayat transaksi tetap tersimpan.`;
        const teksKonfirmasi = aktifBaru ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan';

        const setuju = await katajiKonfirmasi({
            judul: judul,
            pesan: pesan,
            teksBatal: 'Batal',
            teksKonfirmasi: teksKonfirmasi,
            tipe: 'danger'
        });

        if (!setuju) return;

        try {
            const result = await requestJSON('PATCH', API_AKUN, {
                id_user: parseInt(barber.id_user),
                aktif: aktifBaru ? 1 : 0
            });
            // Update data lokal
            const idx = daftarBarber.findIndex(function (b) { return String(b.id_user) === String(barber.id_user); });
            if (idx !== -1) daftarBarber[idx].aktif = aktifBaru ? 1 : 0;
            renderTabel();
            tampilkanNotifikasi(result.message || `Status barber berhasil diperbarui.`, 'berhasil');
        } catch (err) {
            tampilkanNotifikasi(err.message, 'error');
        }
    }

    // ======================================================
    // 11. DIALOG KONFIRMASI (reuse pola kataji)
    // ======================================================

    function katajiKonfirmasi({
        judul = 'Konfirmasi',
        pesan = 'Apakah Anda yakin?',
        teksBatal = 'Batal',
        teksKonfirmasi = 'Ya, Lanjutkan',
        tipe = 'danger'
    }) {
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
            const descEl  = overlay.querySelector('#katajiConfirmDesc');
            const btnBatal = overlay.querySelector('#btnConfirmBatal');
            const btnAksi  = overlay.querySelector('#btnConfirmAksi');

            titleEl.textContent = judul;
            descEl.textContent  = pesan;
            btnBatal.textContent = teksBatal;
            btnAksi.textContent  = teksKonfirmasi;
            btnAksi.className = tipe === 'primary' ? 'btn-confirm-primary' : 'btn-confirm-danger';

            function tutup(hasil) {
                overlay.style.display = 'none';
                document.body.classList.remove('kataji-confirm-open');
                btnBatal.onclick = null;
                btnAksi.onclick  = null;
                overlay.onclick  = null;
                document.removeEventListener('keydown', onKey);
                resolve(hasil);
            }

            function onKey(e) { if (e.key === 'Escape') tutup(false); }

            btnBatal.onclick = function () { tutup(false); };
            btnAksi.onclick  = function () { tutup(true); };
            overlay.onclick  = function (e) { if (e.target === overlay) tutup(false); };
            document.addEventListener('keydown', onKey);

            document.body.classList.add('kataji-confirm-open');
            overlay.style.display = 'flex';
            btnAksi.focus();
        });
    }

    // Ekspor global agar bisa dipakai modul lain
    window.katajiKonfirmasi = window.katajiKonfirmasi || katajiKonfirmasi;

    // ======================================================
    // 12. INIT
    // ======================================================

    muatBarber();
});
