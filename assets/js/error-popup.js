/**
 * [Card X.Y] Frontend Developer (Faqih) - Popup "Gagal Memuat Data" (error server) untuk semua halaman.
 *
 * Cara kerja:
 *  - Membungkus window.fetch. Permintaan GET ke /KELOMPOK-5/api/... yang dibalas status >= 500,
 *    atau gagal terhubung ke server padahal browser masih online, akan memunculkan popup ini.
 *  - Kode lama di tiap halaman tidak perlu diubah: respons asli tetap dikembalikan / error tetap dilempar.
 *  - Popup "Tidak Ada Koneksi" (saat browser offline) tetap ditangani script.js seperti sebelumnya.
 *
 * Opsi dan API:
 *  - fetch(url, { skipGlobalError: true })  -> permintaan ini tidak memunculkan popup.
 *  - window.KatajiStatusPopup.showServerError(kode?)  -> tampilkan popup secara manual.
 *  - window.KatajiStatusPopup.hide()                  -> tutup popup.
 *
 * Dipasang dengan satu baris <script> sebelum script.js (lihat footer.php dan login.php).
 */
(function () {
    'use strict';

    if (window.KatajiStatusPopup) return; // cegah pemasangan ganda

    var API_PREFIX = '/KELOMPOK-5/api/';
    var SUPPRESS_MS = 30000; // setelah "Tutup", popup tidak muncul lagi selama 30 detik
    var nativeFetch = typeof window.fetch === 'function' ? window.fetch.bind(window) : null;

    var modal = null;
    var elTitle = null;
    var elDescription = null;
    var elCode = null;
    var elCodeValue = null;
    var btnRetry = null;
    var btnClose = null;
    var previousFocus = null;
    var suppressUntil = 0;

    // [Card X.Y] CSS tambahan dimuat otomatis dari lokasi script ini (tidak perlu edit header.php)
    (function loadCss() {
        var script = document.currentScript;
        var href = script && script.src
            ? script.src.replace(/js\/error-popup\.js.*$/, 'css/error-popup.css?v=1')
            : '/KELOMPOK-5/assets/css/error-popup.css?v=1';
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    })();

    // [Card X.Y] Popup dibuat saat pertama kali dibutuhkan (document.body pasti sudah ada)
    function buildModal() {
        modal = document.createElement('div');
        modal.className = 'connection-modal-overlay status-modal-overlay';
        modal.hidden = true;
        modal.innerHTML =
            '<section class="connection-modal-dialog" role="alertdialog" aria-modal="true"' +
            ' aria-labelledby="serverErrorTitle" aria-describedby="serverErrorDescription">' +
            '  <div class="connection-modal-icon" aria-hidden="true">' +
            '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>' +
            '      <line x1="12" y1="9" x2="12" y2="13"></line>' +
            '      <line x1="12" y1="17" x2="12.01" y2="17"></line>' +
            '    </svg>' +
            '  </div>' +
            '  <h2 class="connection-modal-title" id="serverErrorTitle">Gagal Memuat Data</h2>' +
            '  <p class="connection-modal-description" id="serverErrorDescription">' +
            '    Server sedang bermasalah sehingga data gagal dimuat. Silakan coba lagi dalam beberapa saat.' +
            '   Kode kesalahan: 500.' +
            '  </p>' +
            '  <p class="status-modal-code" hidden>Kode kesalahan: <span></span></p>' +
            '  <div class="connection-modal-actions">' +
            '    <button type="button" class="connection-modal-retry">Coba Lagi</button>' +
            '    <button type="button" class="connection-modal-close">Tutup</button>' +
            '  </div>' +
            '</section>';
        document.body.appendChild(modal);

        elTitle = modal.querySelector('#serverErrorTitle');
        elDescription = modal.querySelector('#serverErrorDescription');
        elCode = modal.querySelector('.status-modal-code');
        elCodeValue = elCode.querySelector('span');
        btnRetry = modal.querySelector('.connection-modal-retry');
        btnClose = modal.querySelector('.connection-modal-close');

        btnClose.addEventListener('click', function () { hide(true); });

        btnRetry.addEventListener('click', function () {
            if (btnRetry.disabled) return;
            btnRetry.disabled = true;
            btnRetry.textContent = 'Memuat...';
            window.location.reload();
        });

        // [Card X.Y] Escape menutup popup, Tab dikunci di dalam popup
        modal.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                hide(true);
                return;
            }
            if (event.key === 'Tab') {
                var buttons = Array.prototype.slice.call(modal.querySelectorAll('button:not(:disabled)'));
                var first = buttons[0];
                var last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    function isVisible() {
        return modal !== null && modal.hidden === false;
    }

    function showServerError(statusCode) {
        if (isVisible()) return;                 // satu popup saja, walau banyak request gagal bersamaan
        if (Date.now() < suppressUntil) return;  // baru saja ditutup pengguna
        if (!modal) buildModal();

        var code = Number(statusCode);
        if (Number.isFinite(code) && code >= 500) {
            elCodeValue.textContent = String(code);
            elCode.hidden = false;
            elDescription.classList.add('connection-modal-description--tight');
        } else {
            elCode.hidden = true;
            elDescription.classList.remove('connection-modal-description--tight');
        }

        btnRetry.disabled = false;
        btnRetry.textContent = 'Coba Lagi';
        previousFocus = document.activeElement;
        modal.hidden = false;
        btnRetry.focus();
    }

    function hide(userClosed) {
        if (!isVisible()) return;
        modal.hidden = true;
        if (userClosed) suppressUntil = Date.now() + SUPPRESS_MS;
        if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }

    // [Card X.Y] Hanya GET/HEAD ke API aplikasi (data yang "dimuat"), kecuali diberi skipGlobalError
    function shouldTrack(input, init) {
        if (init && init.skipGlobalError === true) return false;

        var method = (init && init.method) || (input && typeof input === 'object' && input.method) || 'GET';
        method = String(method).toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') return false;

        try {
            var rawUrl = typeof input === 'string' ? input : (input && input.url) || String(input);
            var url = new URL(rawUrl, window.location.href);
            return url.origin === window.location.origin && url.pathname.indexOf(API_PREFIX) === 0;
        } catch (err) {
            return false;
        }
    }

    if (nativeFetch) {
        window.fetch = function (input, init) {
            var tracked = shouldTrack(input, init);

            return nativeFetch(input, init).then(function (response) {
                if (tracked && response.status >= 500) {
                    showServerError(response.status);
                }
                return response;
            }, function (error) {
                // Offline ditangani popup "Tidak Ada Koneksi" di script.js; batal (AbortError) diabaikan
                if (tracked && error && error.name !== 'AbortError' && navigator.onLine !== false) {
                    showServerError(null);
                }
                throw error;
            });
        };
    }

    window.KatajiStatusPopup = {
        showServerError: showServerError,
        hide: function () { hide(false); }
    };
})();
