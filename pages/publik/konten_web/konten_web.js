/**
 * Kataji Barber - Konten Web (Frontend)
 * Halaman pengaturan info usaha publik untuk role owner
 * Lokasi: pages/publik/konten_web/konten_web.js
 */

document.addEventListener('DOMContentLoaded', function () {

    // Endpoint backend info usaha (siap dihubungkan saat API tersedia)
    const API_KONTEN_WEB = '/KELOMPOK-5/api/publik/info_usaha.php';

    // DOM Refs
    const form           = document.getElementById('formKontenWeb');
    const notifikasi     = document.getElementById('kontenWebNotifikasi');
    const btnSimpan      = document.getElementById('btnSimpanKontenWeb');

    const inputAlamat    = document.getElementById('kwAlamat');
    const inputPeta      = document.getElementById('kwPeta');
    const selectHariMulai   = document.getElementById('kwHariMulai');
    const selectHariSelesai = document.getElementById('kwHariSelesai');
    const inputJamBuka   = document.getElementById('kwJamBuka');
    const inputJamTutup  = document.getElementById('kwJamTutup');
    const inputWhatsapp  = document.getElementById('kwWhatsapp');

    const inputInstagram = document.getElementById('kwInstagram');
    const inputTiktok    = document.getElementById('kwTiktok');
    const inputFacebook  = document.getElementById('kwFacebook');

    const inputTagline   = document.getElementById('kwTagline');
    const inputTentang   = document.getElementById('kwTentang');
    const countTagline   = document.getElementById('countTagline');
    const countTentang   = document.getElementById('countTentang');

    // Error & Hint Refs
    const errAlamat      = document.getElementById('errAlamat');
    const errPeta        = document.getElementById('errPeta');
    const hintPeta       = document.getElementById('hintPeta');
    const errJam         = document.getElementById('errJam');
    const hintJam        = document.getElementById('hintJam');
    const errWhatsapp    = document.getElementById('errWhatsapp');
    const hintWhatsapp   = document.getElementById('hintWhatsapp');
    const errInstagram   = document.getElementById('errInstagram');
    const errTiktok      = document.getElementById('errTiktok');
    const errFacebook    = document.getElementById('errFacebook');
    const errTagline     = document.getElementById('errTagline');
    const errTentang     = document.getElementById('errTentang');

    let notifTimer = null;

    // ======================================================
    // 1. UTILITAS NOTIFIKASI & ERROR FIELD
    // ======================================================

    function tampilkanNotifikasi(pesan, jenis) {
        if (!notifikasi) return;
        notifikasi.textContent = pesan;
        notifikasi.classList.remove('show', 'is-error');
        if (jenis === 'error') {
            notifikasi.classList.add('is-error');
        }
        void notifikasi.offsetWidth;
        notifikasi.classList.add('show');

        clearTimeout(notifTimer);
        notifTimer = setTimeout(function () {
            notifikasi.classList.remove('show');
        }, 4000);
    }

    function setFieldError(fieldName, errorEl, pesan, hintEl) {
        const wrapper = form ? form.querySelector('[data-field="' + fieldName + '"]') : null;
        if (pesan) {
            if (wrapper) wrapper.classList.add('is-error');
            if (errorEl) {
                errorEl.textContent = pesan;
                errorEl.hidden = false;
            }
            if (hintEl) hintEl.hidden = true;
        } else {
            if (wrapper) wrapper.classList.remove('is-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.hidden = true;
            }
            if (hintEl) hintEl.hidden = false;
        }
    }

    function setJamError(pesan, elemenMerah) {
        const wrapper = form ? form.querySelector('[data-field="jam_buka"]') : null;
        const semuaKontrolJam = [selectHariMulai, selectHariSelesai, inputJamBuka, inputJamTutup];
        semuaKontrolJam.forEach(function (el) {
            if (el) el.classList.remove('is-error');
        });

        if (pesan) {
            if (wrapper) wrapper.classList.add('is-error');
            const targetMerah = Array.isArray(elemenMerah) && elemenMerah.length ? elemenMerah : semuaKontrolJam;
            targetMerah.forEach(function (el) {
                if (el) el.classList.add('is-error');
            });
            if (errJam) {
                errJam.textContent = pesan;
                errJam.hidden = false;
            }
            if (hintJam) hintJam.hidden = true;
        } else {
            if (wrapper) wrapper.classList.remove('is-error');
            if (errJam) {
                errJam.textContent = '';
                errJam.hidden = true;
            }
            if (hintJam) hintJam.hidden = false;
        }
    }

    function perbaruiSelectPlaceholder(selectEl) {
        if (!selectEl) return;
        selectEl.classList.toggle('is-placeholder', !selectEl.value);
    }

    function perbaruiCounter(inputEl, counterEl, maks) {
        if (!inputEl || !counterEl) return;
        counterEl.textContent = inputEl.value.length + '/' + maks;
    }

    // ======================================================
    // 2. VALIDASI
    // ======================================================

    function parseWaktuMenit(teks) {
        const bersih = String(teks || '').trim().replace(':', '.');
        const cocok = /^(\d{1,2})\.(\d{2})$/.exec(bersih);
        if (!cocok) return null;
        const jam = parseInt(cocok[1], 10);
        const menit = parseInt(cocok[2], 10);
        if (jam < 0 || jam > 23 || menit < 0 || menit > 59) return null;
        return jam * 60 + menit;
    }

    function formatWaktuNormal(teks) {
        const bersih = String(teks || '').trim().replace(':', '.');
        const cocok = /^(\d{1,2})\.(\d{2})$/.exec(bersih);
        if (!cocok) return bersih;
        const jam = String(parseInt(cocok[1], 10)).padStart(2, '0');
        return jam + '.' + cocok[2];
    }

    function bersihkanUsername(val) {
        return String(val || '').trim().replace(/^@+/, '');
    }

    function validasiUsernameSosmed(val) {
        if (!val) return true; // opsional
        if (/\s/.test(val)) return false;
        if (/^https?:\/\//i.test(val) || val.includes('/')) return false;
        return /^[a-zA-Z0-9._-]{1,60}$/.test(val);
    }

    function validasiUrlPeta(val) {
        if (!val) return false;
        try {
            const url = new URL(val);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

    function validasiSemua() {
        let valid = true;

        // 1. Alamat (wajib)
        const alamat = inputAlamat.value.trim();
        if (!alamat) {
            setFieldError('alamat', errAlamat, 'Alamat wajib diisi');
            valid = false;
        } else {
            setFieldError('alamat', errAlamat, '');
        }

        // 2. Tautan Peta (wajib, URL valid)
        const peta = inputPeta.value.trim();
        if (!peta) {
            setFieldError('tautan_peta', errPeta, 'Tautan peta wajib diisi', hintPeta);
            valid = false;
        } else if (!validasiUrlPeta(peta)) {
            setFieldError('tautan_peta', errPeta, 'Tautan peta harus berupa URL yang valid', hintPeta);
            valid = false;
        } else {
            setFieldError('tautan_peta', errPeta, '', hintPeta);
        }

        // 3. Jam Buka (hari & jam wajib diisi, jam tutup > jam buka)
        const hariMulai   = selectHariMulai.value;
        const hariSelesai = selectHariSelesai.value;
        const jamBukaRaw  = inputJamBuka.value.trim();
        const jamTutupRaw = inputJamTutup.value.trim();
        const jamKosong   = [];
        if (!hariMulai)   jamKosong.push(selectHariMulai);
        if (!hariSelesai) jamKosong.push(selectHariSelesai);
        if (!jamBukaRaw)  jamKosong.push(inputJamBuka);
        if (!jamTutupRaw) jamKosong.push(inputJamTutup);

        if (jamKosong.length > 0) {
            setJamError('Jam buka wajib diisi', jamKosong);
            valid = false;
        } else {
            const menitBuka  = parseWaktuMenit(jamBukaRaw);
            const menitTutup = parseWaktuMenit(jamTutupRaw);
            if (menitBuka === null || menitTutup === null) {
                setJamError('Format jam buka tidak valid (contoh: 10.00)', [inputJamBuka, inputJamTutup]);
                valid = false;
            } else if (menitTutup <= menitBuka) {
                setJamError('Jam tutup harus setelah jam buka', [inputJamBuka, inputJamTutup]);
                valid = false;
            } else {
                setJamError('');
            }
        }

        // 4. Nomor WhatsApp (wajib, format angka / +62...)
        const wa = inputWhatsapp.value.trim();
        if (!wa) {
            setFieldError('whatsapp', errWhatsapp, 'Nomor WhatsApp wajib diisi', hintWhatsapp);
            valid = false;
        } else if (!/^(\+62|62|0)[0-9]{8,14}$/.test(wa)) {
            setFieldError('whatsapp', errWhatsapp, 'Nomor WhatsApp tidak valid', hintWhatsapp);
            valid = false;
        } else {
            setFieldError('whatsapp', errWhatsapp, '', hintWhatsapp);
        }

        // 5. Media Sosial (wajib diisi, username valid tanpa spasi/URL)
        const ig = bersihkanUsername(inputInstagram.value);
        if (!ig) {
            setFieldError('instagram', errInstagram, 'Username Instagram wajib diisi');
            valid = false;
        } else if (!validasiUsernameSosmed(ig)) {
            setFieldError('instagram', errInstagram, 'Username Instagram tidak valid');
            valid = false;
        } else {
            setFieldError('instagram', errInstagram, '');
        }

        const tt = bersihkanUsername(inputTiktok.value);
        if (!tt) {
            setFieldError('tiktok', errTiktok, 'Username TikTok wajib diisi');
            valid = false;
        } else if (!validasiUsernameSosmed(tt)) {
            setFieldError('tiktok', errTiktok, 'Username TikTok tidak valid');
            valid = false;
        } else {
            setFieldError('tiktok', errTiktok, '');
        }

        const fb = bersihkanUsername(inputFacebook.value);
        if (!fb) {
            setFieldError('facebook', errFacebook, 'Username Facebook wajib diisi');
            valid = false;
        } else if (!validasiUsernameSosmed(fb)) {
            setFieldError('facebook', errFacebook, 'Username Facebook tidak valid');
            valid = false;
        } else {
            setFieldError('facebook', errFacebook, '');
        }

        // 6. Tagline & Tentang (wajib diisi)
        const tagline = inputTagline.value.trim();
        if (!tagline) {
            setFieldError('tagline', errTagline, 'Tagline wajib diisi');
            valid = false;
        } else if (inputTagline.value.length > 100) {
            setFieldError('tagline', errTagline, 'Tagline maksimal 100 karakter');
            valid = false;
        } else {
            setFieldError('tagline', errTagline, '');
        }

        const tentang = inputTentang.value.trim();
        if (!tentang) {
            setFieldError('tentang', errTentang, 'Tentang usaha wajib diisi');
            valid = false;
        } else if (inputTentang.value.length > 500) {
            setFieldError('tentang', errTentang, 'Tentang maksimal 500 karakter');
            valid = false;
        } else {
            setFieldError('tentang', errTentang, '');
        }

        return valid;
    }

    // ======================================================
    // 3. MUAT & SIMPAN DATA
    // ======================================================

    function isiForm(data) {
        if (!data || typeof data !== 'object') return;
        if (data.alamat !== undefined && data.alamat !== null) inputAlamat.value = data.alamat;
        if (data.tautan_peta !== undefined && data.tautan_peta !== null) inputPeta.value = data.tautan_peta;
        if (data.hari_mulai) selectHariMulai.value = data.hari_mulai;
        if (data.hari_selesai) selectHariSelesai.value = data.hari_selesai;
        if (data.jam_buka) inputJamBuka.value = formatWaktuNormal(data.jam_buka);
        if (data.jam_tutup) inputJamTutup.value = formatWaktuNormal(data.jam_tutup);
        if (data.whatsapp !== undefined && data.whatsapp !== null) inputWhatsapp.value = data.whatsapp;

        if (data.instagram) inputInstagram.value = bersihkanUsername(data.instagram);
        if (data.tiktok)    inputTiktok.value    = bersihkanUsername(data.tiktok);
        if (data.facebook)  inputFacebook.value  = bersihkanUsername(data.facebook);

        if (data.tagline !== undefined && data.tagline !== null) inputTagline.value = data.tagline;
        if (data.tentang !== undefined && data.tentang !== null) inputTentang.value = data.tentang;

        perbaruiSelectPlaceholder(selectHariMulai);
        perbaruiSelectPlaceholder(selectHariSelesai);
        perbaruiCounter(inputTagline, countTagline, 100);
        perbaruiCounter(inputTentang, countTentang, 500);
    }

    async function muatKontenWeb() {
        try {
            const resp = await fetch(API_KONTEN_WEB);
            if (resp.status === 404) return; // Endpoint belum tersedia, tampilkan form kosong
            const json = await resp.json().catch(function () { return {}; });
            if (!resp.ok) {
                throw new Error(json.message || 'Gagal memuat konten web.');
            }
            if (json.data) {
                isiForm(json.data);
            }
        } catch (err) {
            if (err && err.name !== 'TypeError') {
                tampilkanNotifikasi(err.message, 'error');
            }
        }
    }

    async function simpanKontenWeb(e) {
        e.preventDefault();
        if (!validasiSemua()) {
            const firstErr = form.querySelector('.is-error input, .is-error textarea, .is-error select');
            if (firstErr) firstErr.focus();
            return;
        }

        const payload = {
            alamat:       inputAlamat.value.trim(),
            tautan_peta:  inputPeta.value.trim(),
            hari_mulai:   selectHariMulai.value || null,
            hari_selesai: selectHariSelesai.value || null,
            jam_buka:     inputJamBuka.value.trim() ? formatWaktuNormal(inputJamBuka.value) : null,
            jam_tutup:    inputJamTutup.value.trim() ? formatWaktuNormal(inputJamTutup.value) : null,
            whatsapp:     inputWhatsapp.value.trim(),
            instagram:    bersihkanUsername(inputInstagram.value) || null,
            tiktok:       bersihkanUsername(inputTiktok.value) || null,
            facebook:     bersihkanUsername(inputFacebook.value) || null,
            tagline:      inputTagline.value.trim() || null,
            tentang:      inputTentang.value.trim() || null
        };

        btnSimpan.disabled = true;
        btnSimpan.textContent = 'Menyimpan...';

        try {
            const resp = await fetch(API_KONTEN_WEB, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await resp.json().catch(function () { return {}; });
            if (!resp.ok) {
                throw new Error(json.message || 'Gagal menyimpan konten web.');
            }
            tampilkanNotifikasi(json.message || 'Konten web berhasil disimpan.', 'berhasil');
        } catch (err) {
            tampilkanNotifikasi(err.message || 'Terjadi kesalahan saat menyimpan.', 'error');
        } finally {
            btnSimpan.disabled = false;
            btnSimpan.textContent = 'Simpan';
        }
    }

    // ======================================================
    // 4. EVENT LISTENERS
    // ======================================================

    if (form) {
        form.addEventListener('submit', simpanKontenWeb);
    }

    // Hapus awalan @ bila user mengetik/paste @ di input medsos
    [inputInstagram, inputTiktok, inputFacebook].forEach(function (inp) {
        if (!inp) return;
        inp.addEventListener('input', function () {
            if (inp.value.startsWith('@')) {
                inp.value = inp.value.replace(/^@+/, '');
            }
        });
    });

    // Clear error saat user memperbaiki input
    inputAlamat.addEventListener('input', function () {
        setFieldError('alamat', errAlamat, '');
    });
    inputPeta.addEventListener('input', function () {
        setFieldError('tautan_peta', errPeta, '', hintPeta);
    });
    inputWhatsapp.addEventListener('input', function () {
        setFieldError('whatsapp', errWhatsapp, '', hintWhatsapp);
    });
    inputInstagram.addEventListener('input', function () {
        setFieldError('instagram', errInstagram, '');
    });
    inputTiktok.addEventListener('input', function () {
        setFieldError('tiktok', errTiktok, '');
    });
    inputFacebook.addEventListener('input', function () {
        setFieldError('facebook', errFacebook, '');
    });

    [inputJamBuka, inputJamTutup].forEach(function (inp) {
        inp.addEventListener('input', function () { setJamError(''); });
        inp.addEventListener('blur', function () {
            if (inp.value.trim()) {
                inp.value = formatWaktuNormal(inp.value);
            }
        });
    });

    [selectHariMulai, selectHariSelesai].forEach(function (sel) {
        perbaruiSelectPlaceholder(sel);
        sel.addEventListener('change', function () {
            perbaruiSelectPlaceholder(sel);
            setJamError('');
        });
    });

    inputTagline.addEventListener('input', function () {
        perbaruiCounter(inputTagline, countTagline, 100);
        setFieldError('tagline', errTagline, '');
    });
    inputTentang.addEventListener('input', function () {
        perbaruiCounter(inputTentang, countTentang, 500);
        setFieldError('tentang', errTentang, '');
    });

    // Init
    perbaruiCounter(inputTagline, countTagline, 100);
    perbaruiCounter(inputTentang, countTentang, 500);
    muatKontenWeb();
});
