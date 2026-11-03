/**
 * Kataji Barber - Manajemen Layanan (Frontend)
 * Penyesuaian dengan API backend terbaru & desain modal konfirmasi Figma
 */

document.addEventListener('DOMContentLoaded', function () {
    const API_LAYANAN = '/KELOMPOK-5/api/layanan/index.php';

    // Elemen form tambah dan tabel
    const form = document.getElementById('formTambahLayanan');
    const namaInput = document.getElementById('namaLayanan');
    const hargaInput = document.getElementById('hargaLayanan');
    const hppInput = document.getElementById('hppLayanan');
    const iconInput = document.getElementById('iconLayanan');
    const tableBody = document.getElementById('layananTableBody');

    // Elemen pesan error form tambah
    const errorNamaTambah = document.getElementById('errorNamaLayanan');
    const errorHargaTambah = document.getElementById('errorHargaLayanan');
    const errorHppTambah = document.getElementById('errorHppLayanan');

    // Elemen modal edit
    const modal = document.getElementById('modalEditLayanan');
    const formEdit = document.getElementById('formEditLayanan');
    const editId = document.getElementById('editIdLayanan');
    const editNama = document.getElementById('editNamaLayanan');
    const editHarga = document.getElementById('editHargaLayanan');
    const editHpp = document.getElementById('editHppLayanan');
    const editIcon = document.getElementById('editIconLayanan');
    const tombolTutupModal = document.getElementById('tutupModalEditLayanan');
    const tombolSimpanEdit = document.getElementById('simpanEditLayanan');

    // Elemen pesan error modal edit
    const errorEditNama = document.getElementById('errorEditNamaLayanan');
    const errorEditHarga = document.getElementById('errorEditHargaLayanan');
    const errorEditHpp = document.getElementById('errorEditHppLayanan');

    if (form) form.noValidate = true;
    if (formEdit) formEdit.noValidate = true;

    let notificationTimer;
    let layananSedangDiedit = null;

    // ======================================================
    // 1. DIALOG KONFIRMASI (SESUAI DESAIN FIGMA KATAJI)
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
            btnBatal.textContent = teksBatal;
            btnAksi.textContent = teksKonfirmasi;

            if (tipe === 'primary') {
                btnAksi.className = 'btn-confirm-primary';
            } else {
                btnAksi.className = 'btn-confirm-danger';
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

    // Ekspor ke window agar bisa dipakai jika diperlukan
    window.katajiKonfirmasi = window.katajiKonfirmasi || konfirmasiTindakan;

    // ======================================================
    // 2. SISTEM NOTIFIKASI
    // ======================================================

    function tampilkanNotifikasi(pesan, jenis = 'berhasil') {
        let notification = document.getElementById('layananNotifikasi');

        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'layananNotifikasi';
            document.body.appendChild(notification);
        }

        clearTimeout(notificationTimer);

        notification.className = 'transaction-success';
        if (['error', 'hapus', 'nonaktif', 'gagal'].includes(jenis)) {
            notification.classList.add('transaction-error');
        }
        notification.textContent = pesan;

        requestAnimationFrame(function () {
            notification.classList.add('show');
        });

        notificationTimer = setTimeout(function () {
            notification.classList.remove('show');
        }, 3000);
    }

    // ======================================================
    // 3. HELPER VALIDASI FIELD FORM
    // ======================================================

    function showFieldError(input, errorElement, pesan) {
        if (errorElement) {
            errorElement.textContent = '*' + pesan;
            errorElement.style.display = 'block';
        }
        if (input) {
            input.classList.add('is-invalid');
            input.setAttribute('aria-invalid', 'true');
        }
    }

    function clearFieldError(input, errorElement) {
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = '';
        }
        if (input) {
            input.classList.remove('is-invalid');
            input.removeAttribute('aria-invalid');
        }
    }

    function hapusSemuaErrorTambah() {
        clearFieldError(namaInput, errorNamaTambah);
        clearFieldError(hargaInput, errorHargaTambah);
        clearFieldError(hppInput, errorHppTambah);
    }

    function bersihkanSemuaErrorEdit() {
        clearFieldError(editNama, errorEditNama);
        clearFieldError(editHarga, errorEditHarga);
        clearFieldError(editHpp, errorEditHpp);
    }

    // Event input untuk menghapus error saat pengguna mulai mengetik
    namaInput?.addEventListener('input', function () {
        clearFieldError(namaInput, errorNamaTambah);
    });

    hargaInput?.addEventListener('input', function () {
        clearFieldError(hargaInput, errorHargaTambah);
    });

    hppInput?.addEventListener('input', function () {
        clearFieldError(hppInput, errorHppTambah);
    });

    editNama?.addEventListener('input', function () {
        clearFieldError(editNama, errorEditNama);
    });

    editHarga?.addEventListener('input', function () {
        clearFieldError(editHarga, errorEditHarga);
    });

    editHpp?.addEventListener('input', function () {
        clearFieldError(editHpp, errorEditHpp);
    });

    // ======================================================
    // 4. REQUEST API
    // ======================================================

    async function requestAPI(method, data) {
        const options = {
            method: method,
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json'
            }
        };

        if (data instanceof FormData) {
            options.body = data;
        } else if (data !== undefined) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }

        let response;
        try {
            response = await fetch(API_LAYANAN, options);
        } catch (netErr) {
            throw new Error('Gagal terhubung ke server. Periksa koneksi Anda.');
        }

        let result;
        try {
            result = await response.json();
        } catch (error) {
            throw new Error('Format respons server tidak valid.');
        }

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message ||
                'Gagal memproses layanan (Status ' + response.status + ').'
            );
        }

        return result;
    }

    // Membuat FormData untuk request multipart
    function buatDataLayanan(nama, harga, hpp, fileIcon) {
        const data = new FormData();
        data.append('nama_layanan', nama);
        data.append('harga', String(harga));
        data.append('hpp', String(hpp));

        if (fileIcon && fileIcon.size > 0) {
            data.append('icon_layanan', fileIcon);
        }

        return data;
    }

    // Validasi file ikon
    function validasiIkon(file) {
        if (!file) return '';

        const tipeDiizinkan = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!tipeDiizinkan.includes(file.type)) {
            return 'Ikon harus berformat JPG, PNG, atau WebP.';
        }

        if (file.size > 2 * 1024 * 1024) {
            return 'Ukuran ikon maksimal 2 MB.';
        }

        return '';
    }

    function buatInputAngka(className, value, min) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = className;
        input.min = String(min);
        input.step = '1';
        input.value = value === null || value === undefined || value === ''
            ? ''
            : String(value);

        input.setAttribute(
            'aria-label',
            className.includes('price') ? 'Harga layanan' : 'HPP layanan'
        );

        return input;
    }

    // Membuat input harga atau HPP dengan prefix Rp
function buatInputRupiah(className, value, min) {
    const wrapper = document.createElement('div');
    wrapper.className = 'layanan-rupiah-wrapper';

    const prefix = document.createElement('span');
    prefix.className = 'layanan-rupiah-prefix';
    prefix.textContent = 'Rp';

    const input = buatInputAngka(className, value, min);

    wrapper.append(prefix, input);

    return wrapper;
}

    function buatTombol(teks, className, aksi) {
        const tombol = document.createElement('button');
        tombol.type = 'button';
        tombol.className = className;
        tombol.textContent = teks;
        tombol.addEventListener('click', aksi);
        return tombol;
    }

    // ======================================================
    // 5. MODAL EDIT LAYANAN
    // ======================================================

    function bukaModalEdit(layanan) {
        if (!modal || !formEdit) return;

        layananSedangDiedit = layanan;

        editId.value = layanan.id_layanan;
        editNama.value = layanan.nama_layanan || '';
        editHarga.value = Number(layanan.harga) || '';
        editHpp.value = layanan.hpp === null || layanan.hpp === undefined
            ? ''
            : String(layanan.hpp);

        if (editIcon) editIcon.value = '';

        bersihkanSemuaErrorEdit();

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('layanan-modal-open');

        editNama.focus();
    }

    function tutupModalEdit() {
        if (!modal || !formEdit) return;

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('layanan-modal-open');

        formEdit.reset();
        bersihkanSemuaErrorEdit();
        layananSedangDiedit = null;
    }

    if (tombolTutupModal) {
        tombolTutupModal.addEventListener('click', tutupModalEdit);
    }

    if (modal) {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                tutupModalEdit();
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (
            event.key === 'Escape' &&
            modal &&
            modal.classList.contains('is-open')
        ) {
            tutupModalEdit();
        }
    });

    // Submit Edit Layanan
    if (formEdit) {
        formEdit.addEventListener('submit', async function (event) {
            event.preventDefault();
            bersihkanSemuaErrorEdit();

            const nama = editNama.value.trim();
            const hargaRaw = editHarga.value.trim();
            const hppRaw = editHpp.value.trim();

            let valid = true;

            // Validasi Nama
            if (nama === '') {
                showFieldError(editNama, errorEditNama, 'Nama layanan wajib diisi.');
                valid = false;
            } else if (nama.length > 100) {
                showFieldError(editNama, errorEditNama, 'Nama layanan maksimal 100 karakter.');
                valid = false;
            }

            // Validasi Harga
            if (hargaRaw === '') {
                showFieldError(editHarga, errorEditHarga, 'Harga layanan wajib diisi.');
                valid = false;
            } else {
                const harga = Number(hargaRaw);
                if (!Number.isInteger(harga) || harga <= 0) {
                    showFieldError(editHarga, errorEditHarga, 'Harga harus lebih dari 0.');
                    valid = false;
                }
            }

            // Validasi HPP
            if (hppRaw === '') {
                showFieldError(editHpp, errorEditHpp, 'HPP wajib diisi.');
                valid = false;
            } else {
                const hpp = Number(hppRaw);
                if (!Number.isInteger(hpp) || hpp <= 0) {
                    showFieldError(editHpp, errorEditHpp, 'HPP harus lebih dari 0.');
                    valid = false;
                } else if (hpp > 2147483647) {
                    showFieldError(editHpp, errorEditHpp, 'HPP terlalu besar.');
                    valid = false;
                }
            }

            // Validasi file ikon jika diunggah
            const fileIcon = editIcon && editIcon.files ? editIcon.files[0] : null;
            if (fileIcon) {
                const errorIkon = validasiIkon(fileIcon);
                if (errorIkon) {
                    tampilkanNotifikasi(errorIkon, 'error');
                    valid = false;
                }
            }

            // Jika validasi gagal: JANGAN menutup modal dan JANGAN kirim request
            if (!valid || !layananSedangDiedit) {
                return;
            }

            tombolSimpanEdit.disabled = true;
            tombolSimpanEdit.textContent = 'Menyimpan...';

            try {
                let result;
                const harga = Number(hargaRaw);
                const hpp = Number(hppRaw);

                if (fileIcon) {
                    const data = buatDataLayanan(nama, harga, hpp, fileIcon);
                    data.append('_method', 'PUT');
                    data.append('id_layanan', String(editId.value));

                    result = await requestAPI('POST', data);
                } else {
                    result = await requestAPI('PUT', {
                        id_layanan: Number(editId.value),
                        nama_layanan: nama,
                        harga: harga,
                        hpp: hpp
                    });
                }

                tutupModalEdit();

                tampilkanNotifikasi(
                    result.message || 'Layanan berhasil diperbarui.',
                    'berhasil'
                );

                await muatLayanan();
            } catch (error) {
                tampilkanNotifikasi(error.message, 'error');
            } finally {
                tombolSimpanEdit.disabled = false;
                tombolSimpanEdit.textContent = 'Simpan Layanan';
            }
        });
    }

    // ======================================================
    // 6. MEMBUAT BARIS TABEL & AKSI (NONAKTIF/HAPUS)
    // ======================================================

    function buatBaris(layanan) {
        const row = document.createElement('tr');
        row.dataset.serviceRow = 'true';
        row.dataset.idLayanan = layanan.id_layanan;

        // Kolom nama layanan
        const namaCell = document.createElement('td');
        const namaInputBaris = document.createElement('input');
        namaInputBaris.type = 'text';
        namaInputBaris.className = 'layanan-name-input';
        namaInputBaris.maxLength = 100;
        namaInputBaris.value = layanan.nama_layanan || '';
        namaInputBaris.setAttribute('aria-label', 'Nama layanan');
        namaCell.appendChild(namaInputBaris);

        // Kolom harga
    const hargaCell = document.createElement('td');
    const hargaInputBaris = buatInputAngka(
        'layanan-price-input',
        layanan.harga,
        1
    );

    const hargaWrapper = document.createElement('div');
    hargaWrapper.className = 'layanan-rupiah-wrapper';

    const hargaPrefix = document.createElement('span');
    hargaPrefix.className = 'layanan-rupiah-prefix';
    hargaPrefix.textContent = 'Rp';

    hargaWrapper.append(hargaPrefix, hargaInputBaris);
    hargaCell.appendChild(hargaWrapper);

    // Kolom HPP
    const hppCell = document.createElement('td');
    const hppInputBaris = buatInputAngka(
        'layanan-hpp-input',
        layanan.hpp,
        1
    );

    const hppWrapper = document.createElement('div');
    hppWrapper.className = 'layanan-rupiah-wrapper';

    const hppPrefix = document.createElement('span');
    hppPrefix.className = 'layanan-rupiah-prefix';
    hppPrefix.textContent = 'Rp';

    hppWrapper.append(hppPrefix, hppInputBaris);
    hppCell.appendChild(hppWrapper);

        // Kolom status aktif
        const statusCell = document.createElement('td');
        const status = document.createElement('input');
        status.type = 'checkbox';
        status.className = 'layanan-checkbox';
        status.checked = Number(layanan.aktif) === 1;
        status.setAttribute('aria-label', 'Status layanan aktif');
        statusCell.appendChild(status);

        // Kolom aksi
        const aksiCell = document.createElement('td');
        aksiCell.className = 'layanan-aksi';

        // Tombol Edit
        aksiCell.appendChild(
            buatTombol('Edit', 'layanan-edit-button', function () {
                bukaModalEdit({
                    id_layanan: layanan.id_layanan,
                    nama_layanan: namaInputBaris.value.trim() || layanan.nama_layanan,
                    harga: hargaInputBaris.value || layanan.harga,
                    hpp: hppInputBaris.value !== '' ? hppInputBaris.value : layanan.hpp,
                    icon_layanan: layanan.icon_layanan
                });
            })
        );

        // Tombol Hapus dengan Dialog Konfirmasi Figma
        aksiCell.appendChild(
            buatTombol('Hapus', 'layanan-hapus-button', async function () {
                const nama = namaInputBaris.value.trim() || layanan.nama_layanan;

                const yakin = await konfirmasiTindakan({
                    judul: 'Hapus Layanan Ini?',
                    pesan: `Apakah Anda yakin ingin menghapus layanan "${nama}"? Data layanan akan dihapus secara permanen.`,
                    teksBatal: 'Batal',
                    teksKonfirmasi: 'Ya, Hapus',
                    tipe: 'danger'
                });

                if (!yakin) {
                    return;
                }

                try {
                    const result = await requestAPI('DELETE', {
                        id_layanan: Number(layanan.id_layanan)
                    });

                    localStorage.setItem('kataji:data-changed', String(Date.now()));

                    tampilkanNotifikasi(
                        result.message || 'Layanan berhasil dihapus.',
                        result.soft_deleted ? 'nonaktif' : 'hapus'
                    );

                    await muatLayanan();
                } catch (error) {
                    tampilkanNotifikasi(error.message, 'error');
                }
            })
        );

        // Checkbox status: Menonaktifkan / Mengaktifkan dengan Dialog Konfirmasi Figma
        status.addEventListener('change', async function () {
            const statusSebelumnya = !status.checked;
            const aktifBaru = status.checked ? 1 : 0;
            const nama = namaInputBaris.value.trim() || layanan.nama_layanan;

            let yakin = false;

            if (aktifBaru === 0) {
                // Konfirmasi Menonaktifkan (sesuai Figma pada screenshot)
                yakin = await konfirmasiTindakan({
                    judul: 'Nonaktifkan Layanan Ini?',
                    pesan: 'Apakah Anda yakin ingin menonaktifkan layanan ini? Layanan yang dinonaktifkan tidak akan tersedia.',
                    teksBatal: 'Batal',
                    teksKonfirmasi: 'Ya,Nonaktifkan',
                    tipe: 'danger'
                });
            } else {
                // Konfirmasi Mengaktifkan kembali
                yakin = await konfirmasiTindakan({
                    judul: 'Aktifkan Layanan Ini?',
                    pesan: `Apakah Anda yakin ingin mengaktifkan layanan "${nama}"? Layanan akan tersedia kembali di kasir.`,
                    teksBatal: 'Batal',
                    teksKonfirmasi: 'Ya, Aktifkan',
                    tipe: 'primary'
                });
            }

            // Jika dibatalkan: batalkan perubahan checkbox dan JANGAN panggil API
            if (!yakin) {
                status.checked = statusSebelumnya;
                return;
            }

            status.disabled = true;

            try {
                const result = await requestAPI('PATCH', {
                    id_layanan: Number(layanan.id_layanan),
                    aktif: aktifBaru
                });

                tampilkanNotifikasi(
                    result.message || (
                        aktifBaru === 1
                            ? 'Layanan berhasil diaktifkan.'
                            : 'Layanan berhasil dinonaktifkan.'
                    ),
                    aktifBaru === 1 ? 'berhasil' : 'nonaktif'
                );

                await muatLayanan();
            } catch (error) {
                status.checked = statusSebelumnya;
                tampilkanNotifikasi(error.message, 'error');
            } finally {
                status.disabled = false;
            }
        });

        row.append(namaCell, hargaCell, hppCell, statusCell, aksiCell);
        return row;
    }

    // ======================================================
    // 7. MEMUAT DATA LAYANAN
    // ======================================================

    async function muatLayanan() {
        if (!tableBody) return;

        tableBody.replaceChildren();

        const loadingRow = document.createElement('tr');
        const loadingCell = document.createElement('td');
        loadingCell.colSpan = 5;
        loadingCell.textContent = 'Memuat data layanan...';
        loadingRow.appendChild(loadingCell);
        tableBody.appendChild(loadingRow);

        try {
            const result = await requestAPI('GET');
            const daftar = Array.isArray(result.data) ? result.data : [];

            tableBody.replaceChildren();

            if (daftar.length === 0) {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.colSpan = 5;
                cell.textContent = 'Belum ada layanan.';
                row.appendChild(cell);
                tableBody.appendChild(row);
                return;
            }

            daftar.forEach(function (layanan) {
                tableBody.appendChild(buatBaris(layanan));
            });
        } catch (error) {
            tableBody.replaceChildren();

            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 5;
            cell.textContent = 'Data layanan gagal dimuat.';
            row.appendChild(cell);
            tableBody.appendChild(row);

            tampilkanNotifikasi(error.message, 'error');
        }
    }

    // ======================================================
    // 8. FORM TAMBAH LAYANAN
    // ======================================================

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            hapusSemuaErrorTambah();

            const nama = namaInput.value.trim();
            const hargaRaw = hargaInput.value.trim();
            const hppRaw = hppInput.value.trim();

            let valid = true;

            // Validasi Nama
            if (nama === '') {
                showFieldError(namaInput, errorNamaTambah, 'Nama layanan wajib diisi.');
                valid = false;
            } else if (nama.length > 100) {
                showFieldError(namaInput, errorNamaTambah, 'Nama layanan maksimal 100 karakter.');
                valid = false;
            }

            // Validasi Harga
            if (hargaRaw === '') {
                showFieldError(hargaInput, errorHargaTambah, 'Harga layanan wajib diisi.');
                valid = false;
            } else {
                const harga = Number(hargaRaw);
                if (!Number.isInteger(harga) || harga <= 0) {
                    showFieldError(hargaInput, errorHargaTambah, 'Harga harus lebih dari 0.');
                    valid = false;
                }
            }

            // Validasi HPP
            if (hppRaw === '') {
                showFieldError(hppInput, errorHppTambah, 'HPP wajib diisi.');
                valid = false;
            } else {
                const hpp = Number(hppRaw);
                if (!Number.isInteger(hpp) || hpp <= 0) {
                    showFieldError(hppInput, errorHppTambah, 'HPP harus lebih dari 0.');
                    valid = false;
                } else if (hpp > 2147483647) {
                    showFieldError(hppInput, errorHppTambah, 'HPP terlalu besar.');
                    valid = false;
                }
            }

            // Validasi icon jika form memiliki input icon
            const fileIcon = iconInput && iconInput.files ? iconInput.files[0] : null;
            if (fileIcon) {
                const errorIkon = validasiIkon(fileIcon);
                if (errorIkon) {
                    tampilkanNotifikasi(errorIkon, 'error');
                    valid = false;
                }
            }

            // Jika validasi gagal: hentikan proses
            if (!valid) {
                return;
            }

            const submitButton = form.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Menyimpan...';
            }

            try {
                const harga = Number(hargaRaw);
                const hpp = Number(hppRaw);
                const data = buatDataLayanan(nama, harga, hpp, fileIcon);
                const result = await requestAPI('POST', data);

                form.reset();
                hapusSemuaErrorTambah();

                tampilkanNotifikasi(
                    result.message || 'Layanan berhasil ditambahkan.',
                    'berhasil'
                );

                await muatLayanan();
            } catch (error) {
                tampilkanNotifikasi(error.message, 'error');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Tambah';
                }
            }
        });
    }

    // Muat daftar layanan saat halaman dibuka
    muatLayanan();
});