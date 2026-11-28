/**
 * Kataji Barber - Halaman Status Saya (Role: Barber)
 * Menampilkan data profil barber secara riil terhubung ke API /api/barber/profil.php
 * Mendukung foto profil (/KELOMPOK-5/ + foto), spesialisasi, nama, dan status akun
 */

document.addEventListener('DOMContentLoaded', function () {
    const statusPage = document.querySelector('.status-page');
    if (!statusPage) return;

    const API_PROFIL = '/KELOMPOK-5/api/barber/profil.php';

    const cardEl = document.getElementById('statusProfileCard');
    const loadingState = document.getElementById('statusLoadingState');
    const profileContent = document.getElementById('statusProfileContent');
    const avatarContainer = document.getElementById('statusAvatarContainer');
    const elNama = document.getElementById('statusNama');
    const elSpesialisasi = document.getElementById('statusSpesialisasi');
    const elBadge = document.getElementById('statusAkunBadge');

    const fallbackNama = statusPage.dataset.userNama || 'Barber';
    const fallbackSpec = statusPage.dataset.userSpec || '-';
    const fallbackFoto = statusPage.dataset.userFoto || null;
    const fallbackAktif = statusPage.dataset.userAktif !== '0';

    function renderAvatar(foto, nama) {
        if (!avatarContainer) return;

        const initialChar = String(nama || 'B').trim().charAt(0).toUpperCase() || 'B';

        if (foto && String(foto).trim() !== '') {
            const fotoPath = String(foto).trim();
            const fotoUrl = (fotoPath.startsWith('/') || fotoPath.startsWith('http'))
                ? fotoPath
                : `/KELOMPOK-5/${fotoPath.replace(/^\/+/, '')}`;

            const img = document.createElement('img');
            img.src = fotoUrl;
            img.alt = String(nama || 'Barber');
            img.className = 'status-avatar-img';
            img.onerror = function () {
                this.onerror = null;
                avatarContainer.innerHTML = `<div class="status-avatar-initial">${initialChar}</div>`;
            };
            avatarContainer.innerHTML = '';
            avatarContainer.appendChild(img);
        } else {
            avatarContainer.innerHTML = `<div class="status-avatar-initial">${initialChar}</div>`;
        }
    }

    async function muatProfilSaya() {
        // Tampilkan loading jika profil belum terbuka
        if (loadingState && profileContent && cardEl && profileContent.style.display === 'none') {
            cardEl.classList.add('is-loading');
            loadingState.style.display = 'flex';
            profileContent.style.display = 'none';
        }

        try {
            const respons = await fetch(API_PROFIL, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });

            if (respons.status === 401) {
                // Sesi berakhir atau akun dinonaktifkan
                window.location.href = '/KELOMPOK-5/pages/login.php?expired=1';
                return;
            }

            const hasil = await respons.json().catch(() => ({}));

            if (hasil && hasil.success && hasil.data) {
                const profil = hasil.data;
                const nama = profil.nama || fallbackNama;
                const spesialisasi = (profil.spesialisasi && profil.spesialisasi.trim())
                    ? profil.spesialisasi.trim()
                    : '-';
                const isAktif = Number(profil.aktif) === 1;

                if (elNama) elNama.textContent = nama;
                if (elSpesialisasi) elSpesialisasi.textContent = spesialisasi;
                if (elBadge) {
                    elBadge.textContent = isAktif ? 'Aktif' : 'Nonaktif';
                    elBadge.className = isAktif ? 'status-badge-aktif' : 'status-badge-nonaktif';
                }

                renderAvatar(profil.foto, nama);
            } else {
                // Fallback menggunakan nilai awal dari server
                if (elNama) elNama.textContent = fallbackNama;
                if (elSpesialisasi) elSpesialisasi.textContent = fallbackSpec;
                if (elBadge) {
                    elBadge.textContent = fallbackAktif ? 'Aktif' : 'Nonaktif';
                    elBadge.className = fallbackAktif ? 'status-badge-aktif' : 'status-badge-nonaktif';
                }
                renderAvatar(fallbackFoto, fallbackNama);
            }
        } catch (error) {
            console.error('Gagal memuat profil barber dari API:', error);
            if (elNama) elNama.textContent = fallbackNama;
            if (elSpesialisasi) elSpesialisasi.textContent = fallbackSpec;
            if (elBadge) {
                elBadge.textContent = fallbackAktif ? 'Aktif' : 'Nonaktif';
                elBadge.className = fallbackAktif ? 'status-badge-aktif' : 'status-badge-nonaktif';
            }
            renderAvatar(fallbackFoto, fallbackNama);
        } finally {
            if (loadingState && profileContent && cardEl) {
                cardEl.classList.remove('is-loading');
                loadingState.style.display = 'none';
                profileContent.style.display = 'flex';
            }
        }
    }

    // Panggil saat pertama dimuat
    muatProfilSaya();

    // Sinkronisasi otomatis saat ada pembaruan data
    window.addEventListener('storage', function (e) {
        if (e.key === 'kataji:data-changed' || e.key === 'kataji:barber-changed') {
            muatProfilSaya();
        }
    });

    window.addEventListener('kataji:data-changed', function () {
        muatProfilSaya();
    });

    // Auto-refresh saat tab kembali aktif
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            muatProfilSaya();
        }
    });
});
