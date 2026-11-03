
/**
 * Kataji Barber - Frontend Validation & Interactivity
 * Role: Faqih Huddin SM (Frontend Developer)
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('SCRIPT KATAJI TERLOAD');
    console.log('DOM SIAP');

    // ======================================================
    // 1. NOTIFIKASI LOGIN
    // ======================================================

    const pesanLogin = sessionStorage.getItem('loginNotification');

    if (pesanLogin) {
        sessionStorage.removeItem('loginNotification');

        let notifikasi = document.querySelector('.login-notification');

        if (!notifikasi) {
            notifikasi = document.createElement('div');
            notifikasi.className = 'transaction-success login-notification';
            document.body.appendChild(notifikasi);
        }

        notifikasi.textContent = pesanLogin;

        requestAnimationFrame(() => {
            notifikasi.classList.add('show');
        });

        setTimeout(() => {
            notifikasi.classList.remove('show');
        }, 4000);
    }

    function simpanNotifikasiLogin(pesan) {
        sessionStorage.setItem('loginNotification', pesan);
    }

    // ======================================================
    // 2. HELPER VALIDASI
    // ======================================================

    function getInputUntukError(targetId) {
        const pasangan = {
            errorLayanan: 'selectLayanan',
            errorHarga: 'inputHarga',
            errorNamaPelanggan: 'namaPelanggan',
            errorHpPelanggan: 'noHpPelanggan',
            errorNamaLayanan: 'namaLayanan',
            errorHargaLayanan: 'hargaLayanan',
            errorKategori: 'kategoriPengeluaran',
            errorNominal: 'nominalPengeluaran',
            errorNamaKasir: 'namaPelanggan',
            errorBarberKasir: 'namaBarber',
            errorMetodePembayaranKasir: 'metodePembayaran'
        };

        return document.getElementById(pasangan[targetId] || '');
    }

    function getErrorElement(targetId, inputOverride = null) {
        // Gunakan elemen error yang sudah tersedia di HTML.
        const errorElement = document.getElementById(targetId);

        if (errorElement) {
            return errorElement;
        }

        // Jika elemen belum ada, buat di dekat input terkait.
        const input = inputOverride || getInputUntukError(targetId);

        if (!input) {
            return null;
        }

        const newErrorElement = document.createElement('small');
        newErrorElement.id = targetId;
        newErrorElement.className = 'kasir-field-error';
        newErrorElement.hidden = true;

        input.insertAdjacentElement('afterend', newErrorElement);

        return newErrorElement;
    }


    function showFieldError(targetId, message, inputOverride = null) {
        const errorElement = getErrorElement(targetId, inputOverride);

        if (errorElement) {
            errorElement.textContent = '*' + message;
            errorElement.hidden = false;
            errorElement.style.display = 'block';
        }

        const input = inputOverride || getInputUntukError(targetId);
        input?.classList.add('is-invalid');
    }

    function clearFieldError(targetId, inputOverride = null) {
        const errorElement = document.getElementById(targetId);

        if (errorElement) {
            errorElement.textContent = '';
            errorElement.hidden = true;
            errorElement.style.display = '';
        }

        const input = inputOverride || getInputUntukError(targetId);
        input?.classList.remove('is-invalid');
    }

    function bersihkanSemuaErrorKasir() {
    clearFieldError('errorNamaKasir');
    clearFieldError('errorBarberKasir');
    clearFieldError('errorLayananKasir');
    clearFieldError('errorMetodePembayaranKasir');
    }

    // ======================================================
    // 3. LOGIN MENGGUNAKAN API BACKEND
    // ======================================================

    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const usernameWrapper = document.getElementById('usernameWrapper');
    const passwordWrapper = document.getElementById('passwordWrapper');
    const loginErrorMessage = document.getElementById('loginErrorMessage');
    const passwordToggle = document.getElementById('passwordToggle');

    function showLoginError(message, errorUsername = false, errorPassword = false) {
        if (loginErrorMessage) {
            loginErrorMessage.textContent = message;
            loginErrorMessage.style.display = 'block';
        } else {
            alert(message);
        }

        if (errorUsername && usernameWrapper) {
            usernameWrapper.classList.add('has-error');
        }

        if (errorPassword && passwordWrapper) {
            passwordWrapper.classList.add('has-error');
        }
    }

    function clearLoginError() {
        if (loginErrorMessage) {
            loginErrorMessage.textContent = '';
            loginErrorMessage.style.display = 'none';
        }

        usernameWrapper?.classList.remove('has-error');
        passwordWrapper?.classList.remove('has-error');
    }

    passwordToggle?.addEventListener('click', function () {
        if (!passwordInput) return;

        passwordInput.type =
            passwordInput.type === 'password' ? 'text' : 'password';
    });

    usernameInput?.addEventListener('input', clearLoginError);
    passwordInput?.addEventListener('input', clearLoginError);

    if (loginForm && usernameInput && passwordInput) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username && !password) {
                showLoginError('Username dan password wajib diisi.', true, true);
                return;
            }

            if (!username) {
                showLoginError('Username wajib diisi.', true, false);
                return;
            }

            if (!password) {
                showLoginError('Password wajib diisi.', false, true);
                return;
            }

            const loginButton = loginForm.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

            const originalText = loginButton
                ? loginButton.tagName === 'INPUT'
                    ? loginButton.value
                    : loginButton.textContent
                : '';

            try {
                clearLoginError();

                if (loginButton) {
                    loginButton.disabled = true;

                    if (loginButton.tagName === 'INPUT') {
                        loginButton.value = 'Memproses...';
                    } else {
                        loginButton.textContent = 'Memproses...';
                    }
                }

                const response = await fetch(
                    '/KELOMPOK-5/api/auth/login.php',
                    {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            username: username,
                            password: password
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Login gagal.');
                }

                const role = result.data?.role;
                const namaUser = result.data?.nama || '';

                if (role === 'owner') {
                    simpanNotifikasiLogin('Login berhasil. Selamat datang ' + (namaUser || 'Owner'));
                    window.location.href = '/KELOMPOK-5/pages/dashboard.php';
                } else if (role === 'barber') {
                    simpanNotifikasiLogin('Login berhasil. Selamat bekerja ' + (namaUser || 'Barber') + '!');
                    window.location.href = '/KELOMPOK-5/pages/transaksi.php';
                } else {
                    throw new Error('Role akun tidak dikenali.');
                }
            } catch (error) {
                console.error('Login API gagal:', error);

                showLoginError(
                    error.message || 'Tidak dapat terhubung ke server.',
                    true,
                    true
                );
            } finally {
                if (loginButton) {
                    loginButton.disabled = false;

                    if (loginButton.tagName === 'INPUT') {
                        loginButton.value = originalText || 'Masuk';
                    } else {
                        loginButton.textContent = originalText || 'Masuk';
                    }
                }
            }
        });
    }

    // ======================================================
    // 4. VALIDASI FORM CATAT TRANSAKSI
    // ======================================================

    const transaksiForm = document.getElementById('formTransaksi');

    if (transaksiForm) {
        transaksiForm.addEventListener('submit', function (e) {
            const layananDipilih = document.querySelectorAll(
                'input[name="layanan[]"]:checked, input[name="id_layanan"]:checked'
            );

            const layananSelect = document.getElementById('selectLayanan');

            const hasLayanan =
                layananDipilih.length > 0 ||
                Boolean(layananSelect && layananSelect.value !== '');

            if (!hasLayanan) {
                e.preventDefault();
                showFieldError('errorLayanan', 'Pilih minimal satu layanan');
                return;
            }

            clearFieldError('errorLayanan');

            const hargaInput = document.getElementById('inputHarga');

            if (hargaInput) {
                const hargaVal = hargaInput.value.trim();

                if (hargaVal === '') {
                    e.preventDefault();
                    showFieldError('errorHarga', 'Harga wajib diisi');
                    return;
                }

                const numericHarga = Number(hargaVal.replace(/\./g, ''));

                if (!/^\d+$/.test(hargaVal.replace(/\./g, '')) ||
                    !Number.isFinite(numericHarga)) {
                    e.preventDefault();
                    showFieldError('errorHarga', 'Harga harus berupa angka');
                    return;
                }

                if (numericHarga <= 0) {
                    e.preventDefault();
                    showFieldError('errorHarga', 'Harga harus lebih dari 0');
                    return;
                }

                clearFieldError('errorHarga');

                const baseHarga = Number(
                    hargaInput.getAttribute('data-base-price') || 0
                );

                const isConfirmed =
                    transaksiForm.getAttribute('data-price-confirmed') === 'true';

                if (baseHarga > 0 && numericHarga !== baseHarga && !isConfirmed) {
                    e.preventDefault();

                    openPriceConfirmModal(function () {
                        transaksiForm.setAttribute('data-price-confirmed', 'true');
                        transaksiForm.requestSubmit();
                    });
                } else {
                    transaksiForm.removeAttribute('data-price-confirmed');
                }
            }
        });
    }

    // ======================================================
    // 5. VALIDASI FORM PELANGGAN
    // ======================================================

    const formPelanggan = document.getElementById('formPelanggan');

    if (formPelanggan) {
        const namaInput = document.getElementById('namaPelanggan');
        const hpInput = document.getElementById('noHpPelanggan');

        namaInput?.addEventListener('input', () => {
            clearFieldError('errorNamaPelanggan', namaInput);
        });

        hpInput?.addEventListener('input', () => {
            clearFieldError('errorHpPelanggan', hpInput);
        });

        formPelanggan.addEventListener('submit', function (e) {
            let isValid = true;

            if (namaInput && namaInput.value.trim() === '') {
                showFieldError(
                    'errorNamaPelanggan',
                    'Nama pelanggan wajib diisi',
                    namaInput
                );
                isValid = false;
            } else {
                clearFieldError('errorNamaPelanggan', namaInput);
            }

            if (hpInput) {
                const hpVal = hpInput.value.trim();

                if (hpVal === '') {
                    showFieldError(
                        'errorHpPelanggan',
                        'Nomor HP wajib diisi',
                        hpInput
                    );
                    isValid = false;
                } else if (!/^[0-9+\-\s]{8,18}$/.test(hpVal)) {
                    showFieldError(
                        'errorHpPelanggan',
                        'Nomor HP tidak valid',
                        hpInput
                    );
                    isValid = false;
                } else {
                    clearFieldError('errorHpPelanggan', hpInput);
                }
            }

            if (!isValid) e.preventDefault();
        });
    }

    // ======================================================
    // 6. VALIDASI FORM LAYANAN
    // ======================================================

    const formLayanan = document.getElementById('formLayanan');

    if (formLayanan) {
        const namaLayanan = document.getElementById('namaLayanan');
        const hargaLayanan = document.getElementById('hargaLayanan');

        namaLayanan?.addEventListener('input', () => {
            clearFieldError('errorNamaLayanan', namaLayanan);
        });

        hargaLayanan?.addEventListener('input', () => {
            clearFieldError('errorHargaLayanan', hargaLayanan);
        });

        formLayanan.addEventListener('submit', function (e) {
            if (namaLayanan && namaLayanan.value.trim() === '') {
                e.preventDefault();
                showFieldError(
                    'errorNamaLayanan',
                    'Nama layanan wajib diisi',
                    namaLayanan
                );
                return;
            }

            clearFieldError('errorNamaLayanan', namaLayanan);

            if (hargaLayanan) {
                const hVal = hargaLayanan.value.trim();
                const numH = Number(hVal.replace(/\./g, ''));

                if (hVal === '') {
                    e.preventDefault();
                    showFieldError(
                        'errorHargaLayanan',
                        'Harga wajib diisi',
                        hargaLayanan
                    );
                    return;
                }

                if (!/^\d+$/.test(hVal.replace(/\./g, '')) ||
                    !Number.isFinite(numH)) {
                    e.preventDefault();
                    showFieldError(
                        'errorHargaLayanan',
                        'Harga harus berupa angka',
                        hargaLayanan
                    );
                    return;
                }

                if (numH <= 0) {
                    e.preventDefault();
                    showFieldError(
                        'errorHargaLayanan',
                        'Harga harus lebih dari 0',
                        hargaLayanan
                    );
                    return;
                }

                clearFieldError('errorHargaLayanan', hargaLayanan);
            }
        });
    }

    // ======================================================
    // 7. VALIDASI FORM PENGELUARAN / HPP
    // ======================================================

    const formPengeluaran = document.getElementById('formPengeluaran');

    if (formPengeluaran) {
        const kategori = document.getElementById('kategoriPengeluaran');
        const nominal = document.getElementById('nominalPengeluaran');

        kategori?.addEventListener('change', () => {
            clearFieldError('errorKategori', kategori);
        });

        nominal?.addEventListener('input', () => {
            clearFieldError('errorNominal', nominal);
        });

        formPengeluaran.addEventListener('submit', function (e) {
            if (kategori && (kategori.value === '' || kategori.value === 'pilih')) {
                e.preventDefault();
                showFieldError(
                    'errorKategori',
                    'Kategori wajib dipilih',
                    kategori
                );
                return;
            }

            clearFieldError('errorKategori', kategori);

            if (nominal) {
                const nVal = nominal.value.trim();
                const numN = Number(nVal.replace(/\./g, ''));

                if (nVal === '') {
                    e.preventDefault();
                    showFieldError(
                        'errorNominal',
                        'Nominal wajib diisi',
                        nominal
                    );
                    return;
                }

                if (!/^\d+$/.test(nVal.replace(/\./g, '')) ||
                    !Number.isFinite(numN)) {
                    e.preventDefault();
                    showFieldError(
                        'errorNominal',
                        'Nominal harus berupa angka',
                        nominal
                    );
                    return;
                }

                if (numN <= 0) {
                    e.preventDefault();
                    showFieldError(
                        'errorNominal',
                        'Nominal harus lebih dari 0',
                        nominal
                    );
                    return;
                }

                clearFieldError('errorNominal', nominal);
            }
        });
    }

    // ======================================================
    // 8. DIALOG KONFIRMASI (SESUAI DESAIN FIGMA KATAJI)
    // ======================================================

    function konfirmasiTindakan({
        judul = 'Konfirmasi Tindakan',
        pesan = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
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

    function tampilkanAlertKataji({
        judul = 'Perhatian',
        pesan = '',
        teksTombol = 'Mengerti',
        tipe = 'primary'
    }) {
        return konfirmasiTindakan({
            judul,
            pesan,
            teksBatal: null,
            teksKonfirmasi: teksTombol,
            tipe
        });
    }

    window.katajiKonfirmasi = konfirmasiTindakan;
    window.katajiAlert = tampilkanAlertKataji;

    // ======================================================
    // 8B. MODAL KONFIRMASI HARGA BERBEDA
    // ======================================================

    function openPriceConfirmModal(onConfirmCallback) {
        let modalEl = document.getElementById('modalKonfirmasiHarga');

        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'modalKonfirmasiHarga';
            modalEl.className = 'kataji-modal-overlay';

            modalEl.innerHTML = `
                <div class="kataji-modal-box">
                    <div class="kataji-modal-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24"
                            fill="none" stroke="#D99B00" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3>Konfirmasi Perubahan Harga</h3>
                    <p>Harga berbeda dari harga layanan. Apakah Anda yakin ingin menyimpan transaksi dengan harga ini?</p>
                    <div class="kataji-modal-actions">
                        <button type="button" id="btnBatalHarga" class="btn-modal-cancel">Batalkan</button>
                        <button type="button" id="btnSimpanHarga" class="btn-modal-confirm">Ya, Simpan</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modalEl);
        }

        modalEl.style.display = 'flex';

        document.getElementById('btnBatalHarga').onclick = function () {
            modalEl.style.display = 'none';
        };

        document.getElementById('btnSimpanHarga').onclick = function () {
            modalEl.style.display = 'none';

            if (typeof onConfirmCallback === 'function') {
                onConfirmCallback();
            }
        };
    }

    // ======================================================
    // 9. MEMUAT LAYANAN DARI API
    // ======================================================

    function getIconLayanan(layanan, gambarLayanan) {
        const icon = String(layanan.icon_layanan || '').trim();

        if (icon) {
            if (/^data:image\//i.test(icon)) return icon;
            if (/^https?:\/\//i.test(icon)) return icon;
            if (icon.startsWith('/')) return icon;

            return '/KELOMPOK-5/' + icon.replace(/^\.?\//, '');
        }

        return '';
    }

    async function muatLayananDariAPI() {
        const container = document.querySelector('.kasir-services');
        if (!container) return;

        try {
            const response = await fetch(
                '/KELOMPOK-5/api/layanan/index.php',
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gagal memuat layanan.');
            }

            const daftarLayananAktif = Array.isArray(result.data)
                ? result.data.filter(layanan => Number(layanan.aktif) === 1)
                : [];

            const gambarLayanan = {};

            container.querySelectorAll('.service-card').forEach(kartu => {
                const nama = kartu.dataset.service;
                const gambar = kartu.querySelector('.service-icon img');

                if (nama && gambar && gambar.getAttribute('src')) {
                    gambarLayanan[nama] = gambar.src;
                }
            });

            // Hapus kartu layanan saja, jangan hapus elemen pesan error.
            container.querySelectorAll('.service-card').forEach(kartu => kartu.remove());

            if (daftarLayananAktif.length === 0) {
                container.textContent = 'Belum ada layanan aktif.';
                return;
            }

            daftarLayananAktif.forEach(layanan => {
                const kartu = document.createElement('button');
                kartu.type = 'button';
                kartu.className = 'service-card';
                kartu.dataset.idLayanan = String(layanan.id_layanan);
                kartu.dataset.service = String(layanan.nama_layanan);
                kartu.dataset.price = String(layanan.harga);

                const ikon = document.createElement('span');
                ikon.className = 'service-icon';

                const gambar = document.createElement('img');
                gambar.alt = layanan.nama_layanan || 'Ikon layanan';
                gambar.loading = 'lazy';

                const sumberGambar = getIconLayanan(layanan, gambarLayanan);

                if (sumberGambar) {
                    gambar.src = sumberGambar;

                    gambar.addEventListener('error', function () {
                        gambar.remove();
                        console.error(
                            'Gambar layanan gagal dimuat:',
                            sumberGambar
                        );
                    });

                    ikon.appendChild(gambar);
                }

                const info = document.createElement('span');
                info.className = 'service-info';

                const nama = document.createElement('strong');
                nama.textContent = layanan.nama_layanan;

                const harga = document.createElement('small');
                harga.textContent =
                    'Rp' + Number(layanan.harga).toLocaleString('id-ID');

                info.append(nama, harga);
                kartu.append(ikon, info);
                container.appendChild(kartu);
            });

            

            console.log('Layanan berhasil dimuat:', daftarLayananAktif);
        } catch (error) {
            console.error('Gagal memuat layanan:', error);
            container.textContent =
                'Gagal memuat layanan. Silakan muat ulang halaman.';
        }
    }

    muatLayananDariAPI();

    // ======================================================
    // 10. MEMUAT DAFTAR BARBER DARI API
    // ======================================================

    async function muatBarberDariAPI() {
        const selectBarber = document.getElementById('namaBarber');
        if (!selectBarber) return;

        try {
            const response = await fetch(
                '/KELOMPOK-5/api/barber/index.php',
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || 'Gagal mengambil daftar barber.'
                );
            }

            selectBarber.innerHTML =
                '<option value="">Ketik disini...</option>';

            (Array.isArray(result.data) ? result.data : []).forEach(barber => {
                const option = document.createElement('option');
                option.value = barber.id_user;
                option.textContent = barber.nama;
                selectBarber.appendChild(option);
            });
        } catch (error) {
            console.error('Gagal memuat barber:', error);
        }
    }

    muatBarberDariAPI();

    // ======================================================
    // 11. INTERAKSI KASIR - PILIH LAYANAN
    // ======================================================

    const servicesContainer = document.querySelector('.kasir-services');
    const selectedServicesContainer = document.getElementById('selectedServices');
    const kasirTotal = document.getElementById('kasirTotal');
    const selectedServices = {};

    function formatRupiah(value) {
        return 'Rp' + Number(value).toLocaleString('id-ID');
    }

    function renderSelectedServices() {
        if (!selectedServicesContainer || !kasirTotal) return;

        const items = Object.values(selectedServices);
        let total = 0;

        if (items.length === 0) {
            selectedServicesContainer.innerHTML =
                '<p class="empty-service">Belum ada layanan dipilih</p>';
        } else {
            selectedServicesContainer.innerHTML = items.map(item => {
                const subtotal = item.price * item.qty;
                total += subtotal;

                return `
                    <div class="selected-service-row">
                        <span>${item.name} ${item.qty}x</span>
                        <span>${formatRupiah(subtotal)}</span>
                        <button type="button"
                            data-action="remove"
                            data-id-layanan="${item.id_layanan}">×</button>
                    </div>
                `;
            }).join('');
        }

        kasirTotal.textContent = formatRupiah(total);

        servicesContainer?.querySelectorAll('.service-card').forEach(card => {
            card.classList.toggle(
                'selected',
                Boolean(selectedServices[String(card.dataset.idLayanan)])
            );
        });
    }

    servicesContainer?.addEventListener('click', function (e) {
        const card = e.target.closest('.service-card');
        if (!card) return;

        const id = String(card.dataset.idLayanan || '');
        const name = card.dataset.service;
        const price = Number(card.dataset.price);

        if (!id || !name || !Number.isFinite(price)) {
            console.error('Data layanan tidak valid.', { id, name, price });
            return;
        }

        if (selectedServices[id]) {
            delete selectedServices[id];
        } else {
            selectedServices[id] = {
                id_layanan: Number(id),
                name: name,
                price: price,
                qty: 1
            };
        }

        clearFieldError('errorLayananKasir');
        renderSelectedServices();
    });

    selectedServicesContainer?.addEventListener('click', function (e) {
        const button = e.target.closest('[data-action="remove"]');
        if (!button) return;

        delete selectedServices[String(button.dataset.idLayanan)];
        renderSelectedServices();
    });

    renderSelectedServices();

    // ======================================================
    // 12. NOTIFIKASI TRANSAKSI
    // ======================================================

    function showSuccessNotification(pesan, berhasil = true) {
        const notifikasi = document.createElement('div');

        notifikasi.className = 'transaction-success' + (berhasil ? '' : ' transaction-error');
        notifikasi.textContent = pesan;

        document.body.appendChild(notifikasi);

        requestAnimationFrame(() => {
            notifikasi.classList.add('show');
        });

        setTimeout(() => {
            notifikasi.classList.remove('show');

            setTimeout(() => {
                notifikasi.remove();
            }, 300);
        }, 3000);
    }

    // ======================================================
    // 13. SIMPAN TRANSAKSI KE API
    // ======================================================

    const btnSimpanTransaksi = document.getElementById('btnSimpanTransaksi');
    const namaPelangganKasir = document.getElementById('namaPelanggan');
    const namaBarberKasir = document.getElementById('namaBarber');
    const metodePembayaranKasir = document.getElementById('metodePembayaran');

    let selectedPelangganId = null;

    namaPelangganKasir?.addEventListener('input', function () {
        selectedPelangganId = null;
        clearFieldError('errorNamaKasir', namaPelangganKasir);
    });

    namaBarberKasir?.addEventListener('change', function () {
        clearFieldError('errorBarberKasir', namaBarberKasir);
    });

    metodePembayaranKasir?.addEventListener('change', function () {
        clearFieldError('errorMetodePembayaranKasir', metodePembayaranKasir);
    });

    if (btnSimpanTransaksi) {
        btnSimpanTransaksi.addEventListener('click', async function (e) {
            e.preventDefault();

            const namaPelanggan = namaPelangganKasir;
            const namaBarber = namaBarberKasir;
            const metodePembayaran = metodePembayaranKasir;

            const layanan = Object.values(selectedServices).map(item => ({
                id_layanan: item.id_layanan,
                jumlah: item.qty
            }));

            bersihkanSemuaErrorKasir();

            // Validasi nama pelanggan.
            if (!namaPelanggan || !namaPelanggan.value.trim()) {
                showFieldError(
                    'errorNamaKasir',
                    'Nama pelanggan wajib diisi',
                    namaPelanggan
                );
                namaPelanggan?.focus();
                return;
            }

            // Validasi barber.
            if (!namaBarber || !namaBarber.value) {
                showFieldError(
                    'errorBarberKasir',
                    'Nama barber wajib dipilih!',
                    namaBarber
                );
                namaBarber?.focus();
                return;
            }

            // Validasi layanan.
            if (layanan.length === 0) {
                showFieldError(
                    'errorLayananKasir',
                    'Pilih minimal satu layanan!'
                );
                return;
            }

            // Validasi metode pembayaran.
            if (!metodePembayaran || !metodePembayaran.value) {
                showFieldError(
                    'errorMetodePembayaranKasir',
                    'Metode pembayaran wajib dipilih!',
                    metodePembayaran
                );
                metodePembayaran?.focus();
                return;
            }

            btnSimpanTransaksi.disabled = true;

            try {
                const payload = {
                    nama_pelanggan: namaPelanggan.value.trim(),
                    id_barber: Number(namaBarber.value),
                    layanan: layanan,
                    metode_pembayaran: metodePembayaran.value
                };

                if (selectedPelangganId) {
                    payload.id_pelanggan = selectedPelangganId;
                }

                const response = await fetch(
                    '/KELOMPOK-5/api/transaksi/index.php',
                    {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || 'Transaksi gagal disimpan.'
                    );
                }

                localStorage.setItem('kataji:data-changed', String(Date.now()));
                showSuccessNotification('Transaksi berhasil dicatat.', true);

                Object.keys(selectedServices).forEach(id => {
                    delete selectedServices[id];
                });

                namaPelanggan.value = '';
                selectedPelangganId = null;
                namaBarber.value = '';
                metodePembayaran.value = '';

                bersihkanSemuaErrorKasir();
                renderSelectedServices();
            } catch (error) {
                console.error('Gagal menyimpan transaksi:', error);
                showSuccessNotification(
                    error.message ||
                    'Terjadi kesalahan saat menyimpan transaksi.',
                    false
                );
            } finally {
                btnSimpanTransaksi.disabled = false;
            }
        });
    }

    // ======================================================
    // 14. AUTOCOMPLETE NAMA PELANGGAN
    // ======================================================

    const inputPelanggan = document.getElementById('namaPelanggan');

    if (inputPelanggan) {
        const saranPelanggan = document.createElement('div');
        saranPelanggan.className = 'pelanggan-suggestions';
        saranPelanggan.hidden = true;

        const errorNamaKasir = document.getElementById('errorNamaKasir');

        if (errorNamaKasir) {
            errorNamaKasir.insertAdjacentElement('afterend', saranPelanggan);
        } else {
            inputPelanggan.insertAdjacentElement('afterend', saranPelanggan);
        }

        let timerSaran;
        let permintaanSaran;

        inputPelanggan.addEventListener('input', function () {
            selectedPelangganId = null;

            clearTimeout(timerSaran);

            if (permintaanSaran) {
                permintaanSaran.abort();
            }

            const kataKunci = inputPelanggan.value.trim();

            saranPelanggan.replaceChildren();
            saranPelanggan.hidden = true;

            if (kataKunci.length < 1) return;

            timerSaran = setTimeout(async function () {
                permintaanSaran = new AbortController();

                try {
                    const response = await fetch(
                        `/KELOMPOK-5/api/pelanggan/index.php?q=${encodeURIComponent(kataKunci)}`,
                        {
                            method: 'GET',
                            headers: { 'Accept': 'application/json' },
                            credentials: 'same-origin',
                            signal: permintaanSaran.signal
                        }
                    );

                    const result = await response.json();

                    if (!response.ok || !result.success) {
                        throw new Error(
                            result.message || 'Gagal mencari pelanggan.'
                        );
                    }

                    if (inputPelanggan.value.trim() !== kataKunci) return;

                    saranPelanggan.replaceChildren();

                    if (!Array.isArray(result.data) || result.data.length === 0) {
                        const kosong = document.createElement('div');
                        kosong.className = 'pelanggan-suggestion-empty';
                        kosong.textContent = 'Pelanggan tidak ditemukan';
                        saranPelanggan.appendChild(kosong);
                    } else {
                        const pelangganUnik = [];
                        const namaPelangganSudahAda = new Set();

                        result.data.forEach(function (pelanggan) {
                            const namaUnik = String(pelanggan.nama || '')
                                .trim()
                                .toLowerCase();

                            if (!namaUnik || namaPelangganSudahAda.has(namaUnik)) {
                                return;
                            }

                            namaPelangganSudahAda.add(namaUnik);
                            pelangganUnik.push(pelanggan);
                        });

                        pelangganUnik.forEach(function (pelanggan) {
                            const tombol = document.createElement('button');

                            tombol.type = 'button';
                            tombol.className = 'pelanggan-suggestion-item';
                            tombol.textContent = pelanggan.nama;

                            tombol.addEventListener('click', function () {
                                inputPelanggan.value = pelanggan.nama;
                                selectedPelangganId = Number(pelanggan.id_pelanggan);

                                saranPelanggan.hidden = true;
                                saranPelanggan.replaceChildren();

                                clearFieldError('errorNamaKasir', inputPelanggan);
                            });

                            saranPelanggan.appendChild(tombol);
                        });
                    }

                    saranPelanggan.hidden = false;
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Gagal mencari pelanggan:', error);
                    }
                }
            }, 250);
        });

        document.addEventListener('click', function (event) {
            if (
                event.target !== inputPelanggan &&
                !saranPelanggan.contains(event.target)
            ) {
                saranPelanggan.hidden = true;
            }
        });
    }
});
