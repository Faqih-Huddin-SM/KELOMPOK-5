/**
 * [Card 6.4] Frontend Developer (Faqih) - Halaman publik Kataji Barbershop (skeleton)
 *
 * - Memuat dua endpoint publik (CONTRACT.md bagian 12) SECARA TERPISAH, jadi bila satu
 *   gagal, bagian lain tetap tampil.
 * - Pembaruan otomatis tiap 5 menit tanpa reload: data hanya digambar ulang bila berubah,
 *   posisi gulir dipertahankan, dan bila pembaruan gagal data yang sedang tampil dibiarkan.
 * - Semua teks dari API dipasang lewat textContent (tidak ada innerHTML dari data).
 * - Halaman ini tidak memuat error-popup.js / script.js; error ditangani per bagian di sini,
 *   dan fetch diberi skipGlobalError agar popup global tidak ikut muncul bila suatu saat dimuat.
 */
(function () {
    'use strict';

    const BASE_URL = '/KELOMPOK-5/';
    const REFRESH_MS = 5 * 60 * 1000;   // pembaruan otomatis tiap 5 menit
    const TIMEOUT_MS = 15000;           // batas waktu satu permintaan
    const PESAN_BATAS_LAJU = 'Terlalu banyak permintaan. Silakan coba lagi sebentar lagi';

    // ------------------------------------------------------------------
    // Helper tampilan
    // ------------------------------------------------------------------

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    // Format rupiah: 35000 -> "Rp 35.000"
    function formatRupiah(nilai) {
        const angka = Math.round(Number(nilai));
        if (!Number.isFinite(angka)) return 'Rp -';
        return 'Rp ' + angka.toLocaleString('id-ID');
    }

    // Monogram: huruf pertama nama, kapital
    function ambilMonogram(nama) {
        const huruf = Array.from(String(nama || '').trim())[0];
        return huruf ? huruf.toLocaleUpperCase('id-ID') : '?';
    }

    // Spesialisasi -> tag. Dipisah koma atau kata utuh "dan" (tanpa membedakan huruf besar/kecil);
    // spasi di tepi dibuang; tag kosong atau ganda diabaikan.
    function parseSpesialisasi(teks) {
        if (typeof teks !== 'string') return [];

        const hasil = [];
        const sudahAda = new Set();

        teks.split(/,|\bdan\b/i).forEach(function (bagian) {
            const tag = bagian.trim().replace(/\s+/g, ' ');
            if (!tag) return;

            const kunci = tag.toLocaleLowerCase('id-ID');
            if (sudahAda.has(kunci)) return;

            sudahAda.add(kunci);
            hasil.push(tag);
        });

        return hasil;
    }

    function buatMonogram(nama) {
        const node = el('div', 'publik-avatar publik-avatar--monogram', ambilMonogram(nama));
        node.setAttribute('aria-hidden', 'true');
        return node;
    }

    function buatAvatar(nama, foto) {
        if (typeof foto !== 'string' || foto.trim() === '') {
            return buatMonogram(nama);
        }

        const img = el('img', 'publik-avatar');
        img.src = BASE_URL + foto.trim().replace(/^\/+/, '');
        img.alt = 'Foto barber ' + nama;
        img.loading = 'lazy';
        img.decoding = 'async';
        // Foto tidak bisa dimuat (mis. 404 untuk barber nonaktif) -> pakai monogram
        img.addEventListener('error', function () {
            img.replaceWith(buatMonogram(nama));
        });
        return img;
    }

    // ------------------------------------------------------------------
    // Render per bagian
    // ------------------------------------------------------------------

    function renderBarber(data) {
        const daftar = data.map(function (barber) {
            const nama = String(barber.nama == null ? '' : barber.nama).trim() || 'Tanpa nama';
            const kartu = el('article', 'publik-barber-card');

            const avatarWrap = el('div', 'publik-avatar-wrap');
            avatarWrap.appendChild(buatAvatar(nama, barber.foto));

            const info = el('div', 'publik-barber-info');
            info.appendChild(el('h3', 'publik-barber-nama', nama));

            const tags = parseSpesialisasi(barber.spesialisasi);
            if (tags.length === 0) {
                info.appendChild(el('p', 'publik-spesialisasi-kosong', 'Spesialisasi belum diisi'));
            } else {
                const ul = el('ul', 'publik-tags');
                tags.forEach(function (tag) { ul.appendChild(el('li', 'publik-tag', tag)); });
                info.appendChild(ul);
            }

            kartu.appendChild(avatarWrap);
            kartu.appendChild(info);
            return kartu;
        });

        return daftar;
    }

    function renderLayanan(data) {
        return data.map(function (layanan) {
            const item = el('div', 'publik-layanan-item');
            item.appendChild(el('span', 'publik-layanan-nama', String(layanan.nama_layanan == null ? '' : layanan.nama_layanan)));
            item.appendChild(el('span', 'publik-layanan-harga', formatRupiah(layanan.harga)));
            return item;
        });
    }

    // ------------------------------------------------------------------
    // Definisi bagian
    // ------------------------------------------------------------------

    const sections = {
        barber: {
            url: BASE_URL + 'api/barber/publik.php',
            container: document.getElementById('barberList'),
            render: renderBarber,
            teksKosong: 'Belum ada barber yang ditampilkan',
            teksGagal: 'Profil barber gagal dimuat. Silakan coba lagi'
        },
        layanan: {
            url: BASE_URL + 'api/layanan/publik.php',
            container: document.getElementById('layananList'),
            render: renderLayanan,
            teksKosong: 'Daftar layanan belum tersedia',
            teksGagal: 'Daftar layanan gagal dimuat. Silakan coba lagi'
        }
    };

    Object.keys(sections).forEach(function (kunci) {
        const sec = sections[kunci];
        sec.kunci = kunci;
        sec.sedangMemuat = false;
        sec.adaData = false;       // true setelah pernah berhasil menampilkan data / kondisi kosong
        sec.jsonTerakhir = null;   // untuk membandingkan: gambar ulang hanya bila data berubah
        // Simpan markup skeleton awal (dari PHP) untuk dipakai lagi saat "Coba Lagi"
        sec.skeleton = Array.from(sec.container.childNodes).map(function (n) { return n.cloneNode(true); });
    });

    // ------------------------------------------------------------------
    // Pengambilan data
    // ------------------------------------------------------------------

    async function ambilData(url) {
        const controller = new AbortController();
        const timer = window.setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
                cache: 'no-store',
                signal: controller.signal,
                skipGlobalError: true
            });

            let body = null;
            try { body = await response.json(); } catch (e) { body = null; }

            if (response.status === 429) {
                const err = new Error('batas laju');
                err.jenis = 'batas-laju';
                err.pesan = (body && typeof body.message === 'string' && body.message) || PESAN_BATAS_LAJU;
                throw err;
            }

            if (!response.ok || !body || body.success !== true || !Array.isArray(body.data)) {
                const err = new Error('respons tidak valid');
                err.jenis = 'gagal';
                throw err;
            }

            return body.data;
        } finally {
            window.clearTimeout(timer);
        }
    }

    function tampilkanKondisi(sec, teks, jenis) {
        const kotak = el('div', 'publik-state' + (jenis === 'gagal' ? ' publik-state--error' : ''));
        kotak.appendChild(el('p', 'publik-state-text', teks));

        if (jenis === 'gagal') {
            const tombol = el('button', 'publik-retry-btn', 'Coba Lagi');
            tombol.type = 'button';
            tombol.addEventListener('click', function () { muatBagian(sec, false); });
            kotak.appendChild(tombol);
        }

        sec.container.replaceChildren(kotak);
        sec.container.setAttribute('aria-busy', 'false');
    }

    function tampilkanSkeleton(sec) {
        sec.container.replaceChildren.apply(sec.container, sec.skeleton.map(function (n) { return n.cloneNode(true); }));
        sec.container.setAttribute('aria-busy', 'true');
    }

    // silent = true untuk pembaruan otomatis: tidak menampilkan skeleton, dan bila gagal
    // data yang sedang tampil dipertahankan.
    async function muatBagian(sec, silent) {
        if (sec.sedangMemuat) return;
        sec.sedangMemuat = true;

        if (!silent && !sec.adaData) tampilkanSkeleton(sec);

        try {
            const data = await ambilData(sec.url);
            const json = JSON.stringify(data);

            if (!sec.adaData || json !== sec.jsonTerakhir) {
                const posisiGulir = window.scrollY;

                if (data.length === 0) {
                    tampilkanKondisi(sec, sec.teksKosong, 'kosong');
                } else {
                    sec.container.replaceChildren.apply(sec.container, sec.render(data));
                    sec.container.setAttribute('aria-busy', 'false');
                }

                window.scrollTo(0, posisiGulir);   // posisi gulir tidak kembali ke atas
                sec.jsonTerakhir = json;
                sec.adaData = true;
            }
        } catch (err) {
            // Pembaruan otomatis yang gagal tidak boleh menghapus data yang sedang tampil
            if (!(silent && sec.adaData)) {
                const teks = err && err.jenis === 'batas-laju' ? err.pesan : sec.teksGagal;
                tampilkanKondisi(sec, teks, 'gagal');
                sec.adaData = false;
                sec.jsonTerakhir = null;
            }
        } finally {
            sec.sedangMemuat = false;
        }
    }

    // Kedua bagian dimuat sendiri-sendiri: kegagalan satu bagian tidak mempengaruhi yang lain
    function muatSemua(silent) {
        Object.keys(sections).forEach(function (kunci) { muatBagian(sections[kunci], silent); });
    }

    // ------------------------------------------------------------------
    // Pembaruan otomatis tiap 5 menit
    // ------------------------------------------------------------------

    let terakhirMuat = Date.now();

    function pembaruanBerkala() {
        terakhirMuat = Date.now();
        muatSemua(true);
    }

    window.setInterval(function () {
        if (!document.hidden) pembaruanBerkala();
    }, REFRESH_MS);

    // Tab/layar yang tadinya tersembunyi lalu aktif lagi dan data sudah lewat 5 menit -> segarkan
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden && Date.now() - terakhirMuat >= REFRESH_MS) pembaruanBerkala();
    });

    muatSemua(false);
})();
