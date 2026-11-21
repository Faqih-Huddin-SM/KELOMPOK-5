/**
 * [Card X.Y] Frontend Developer (Faqih) - Aksi tombol halaman 404
 * - "Muat Ulang": memuat ulang halaman saat ini.
 * - "Kembali": ke halaman sebelumnya bila berasal dari halaman aplikasi,
 *   jika tidak ada riwayat (mis. URL diketik langsung) tetap menuju /KELOMPOK-5/ via href.
 */
document.addEventListener('DOMContentLoaded', function () {
    // [Card X.Y] Hormati pengaturan "kurangi gerakan": hentikan animasi SVG tiang barber
    const kode = document.getElementById('notfoundCode');
    if (kode && typeof kode.pauseAnimations === 'function'
        && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        kode.pauseAnimations();
    }

    const btnReload = document.getElementById('btnNotfoundReload');
    const btnBack = document.getElementById('btnNotfoundBack');

    if (btnReload) {
        btnReload.addEventListener('click', function () {
            window.location.reload();
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', function (event) {
            let samaAsal = false;
            try {
                samaAsal = document.referrer !== '' && new URL(document.referrer).origin === window.location.origin;
            } catch (err) {
                samaAsal = false;
            }

            if (samaAsal && window.history.length > 1) {
                event.preventDefault();
                window.history.back();
            }
        });
    }
});
