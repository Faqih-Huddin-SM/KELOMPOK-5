/**
 * Kataji Barber - Halaman Status Saya (Role: Barber)
 * Menampilkan data profil barber secara riil terhubung ke API
 * Mendukung foto profil (/api/barber/publik.php), spesialisasi, nama, dan status akun
 */

document.addEventListener('DOMContentLoaded', function () {
    const statusPage = document.querySelector('.status-page');
    if (!statusPage) return;

    const API_PUBLIK = '/KELOMPOK-5/api/barber/publik.php';
    const API_ME = '/KELOMPOK-5/api/auth/me.php';

    const cardEl = document.getElementById('statusProfileCard');
    const loadingState = document.getElementById('statusLoadingState');
    const profileContent = document.getElementById('statusProfileContent');
    const avatarContainer = document.getElementById('statusAvatarContainer');
    const elNama = document.getElementById('statusNama');
    const elSpesialisasi = document.getElementById('statusSpesialisasi');
    const elBadge = document.getElementById('statusAkunBadge');

    let currentUserId = Number(statusPage.dataset.userId) || 0;
    let fallbackNama = statusPage.dataset.userNama || 'Barber';

    function escapeHtml(teks) {
        const div = document.createElement('div');
        div.textContent = String(teks ?? '');
        return div.innerHTML;
    }

    function renderAvatar(foto, nama) {
        if (!avatarContainer) return;

        const initialChar = String(nama || 'B').trim().charAt(0).toUpperCase() || 'B';

        if (foto) {
            const fotoUrl = foto.startsWith('/') || foto.startsWith('http')
                ? foto
                : `/KELOMPOK-5/${foto}`;

            avatarContainer.innerHTML = `
                <img
                    src="${fotoUrl}"
                    alt="${escapeHtml(nama)}"
                    class="status-avatar-img"
                    onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'status-avatar-initial\\'>${initialChar}</div>';"
                >
            `;
        } else {
            avatarContainer.innerHTML = `
                <div class="status-avatar-initial">${initialChar}</div>
            `;
        }
    }

    async function muatProfilSaya() {
        if (loadingState && profileContent && cardEl) {
            cardEl.classList.add('is-loading');
            loadingState.style.display = 'flex';
            profileContent.style.display = 'none';
        }

        try {
            // 1. Pastikan id_user diketahui
            if (!currentUserId) {
                const respMe = await fetch(API_ME, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' }
                });
                const hasilMe = await respMe.json().catch(() => ({}));
                if (hasilMe.success && hasilMe.data?.id_user) {
                    currentUserId = Number(hasilMe.data.id_user);
                    if (hasilMe.data.nama) {
                        fallbackNama = hasilMe.data.nama;
                    }
                }
            }

            // 2. Ambil data barber dari endpoint publik
            const respons = await fetch(API_PUBLIK, {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            });

            const hasil = await respons.json().catch(() => ({}));

            let profil = null;
            if (hasil.success && Array.isArray(hasil.data)) {
                profil = hasil.data.find(b => Number(b.id_user) === currentUserId);
            }

            if (profil) {
                const nama = profil.nama || fallbackNama;
                const spesialisasi = profil.spesialisasi ? profil.spesialisasi.trim() : '-';

                if (elNama) elNama.textContent = nama;
                if (elSpesialisasi) elSpesialisasi.textContent = spesialisasi || '-';
                if (elBadge) {
                    elBadge.textContent = 'Aktif';
                    elBadge.className = 'status-badge-aktif';
                }

                renderAvatar(profil.foto, nama);
            } else {
                // Fallback jika tidak ditemukan di daftar publik
                if (elNama) elNama.textContent = fallbackNama;
                if (elSpesialisasi) elSpesialisasi.textContent = '-';
                if (elBadge) {
                    elBadge.textContent = 'Aktif';
                    elBadge.className = 'status-badge-aktif';
                }
                renderAvatar(null, fallbackNama);
            }

        } catch (error) {
            console.error('Gagal memuat profil barber:', error);
            if (elNama) elNama.textContent = fallbackNama;
            if (elSpesialisasi) elSpesialisasi.textContent = '-';
            renderAvatar(null, fallbackNama);
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
        if (e.key === 'kataji:data-changed') {
            muatProfilSaya();
        }
    });

    window.addEventListener('kataji:data-changed', function () {
        muatProfilSaya();
    });
});
