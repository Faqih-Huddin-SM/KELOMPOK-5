<?php
// ==============================================================================
// [Card 6.4] Frontend Developer (Faqih) - Halaman publik Kataji Barbershop (skeleton)
//
// Rute PUBLIK: tanpa login. Halaman ini sengaja TIDAK memanggil require_login() /
// includes/header.php (sidebar). Akses: /KELOMPOK-5/pages/publik.php
//
// Data diambil lewat endpoint publik kartu 6.4.3 (CONTRACT.md bagian 12):
//   GET /api/barber/publik.php   -> profil barber aktif
//   GET /api/layanan/publik.php  -> layanan aktif + harga
//
// SLOT untuk kartu 6.6.5 (menu "Tentang" & blok info usaha): #slotHeader dan #slotBawahLayanan.
// Biarkan slot kosong TANPA spasi/teks di dalamnya, agar CSS :empty menyembunyikannya
// dan tidak meninggalkan celah.
// ==============================================================================
$tahun = date('Y');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kataji Barbershop</title>
    <meta name="description" content="Profil barber, daftar layanan, dan harga di Kataji Barbershop.">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >
    <link rel="stylesheet" href="/KELOMPOK-5/publik/publik.css?v=1">
</head>
<body class="publik-body">

    <!-- [Card 6.4] KERANGKA: header (logo + nama + slot) -->
    <header class="publik-header">
        <div class="publik-container publik-header-inner">
            <a class="publik-brand" href="/KELOMPOK-5/publik/publik.php" aria-label="Kataji Barbershop, ke atas halaman">
                <img class="publik-brand-logo" src="/KELOMPOK-5/assets/img/logo-kataji.png" alt="" width="64" height="64">
                <span class="publik-brand-name">Kataji Barbershop</span>
            </a>

            <!-- [Card 6.4] SLOT HEADER: diisi kartu 6.6.5 (menu "Tentang"). Jangan beri spasi di dalamnya. -->
            <div class="publik-slot publik-slot--header" id="slotHeader" data-slot="header"></div>
        </div>
    </header>

    <main class="publik-main publik-container">

        <!-- [Card 6.4] BAGIAN: profil barber -->
        <section class="publik-section" id="barber" aria-labelledby="judulBarber">
            <h2 class="publik-section-title" id="judulBarber">Barber Kami</h2>

            <div class="publik-barber-grid" id="barberList" aria-live="polite" aria-busy="true">
                <?php for ($i = 0; $i < 4; $i++): ?>
                <div class="publik-barber-card publik-barber-card--skeleton" aria-hidden="true">
                    <div class="publik-avatar-wrap"><div class="publik-skel publik-skel-avatar"></div></div>
                    <div class="publik-barber-info">
                        <div class="publik-skel publik-skel-line publik-skel-line--nama"></div>
                        <div class="publik-skel publik-skel-line publik-skel-line--tag"></div>
                    </div>
                </div>
                <?php endfor; ?>
            </div>
        </section>

        <!-- [Card 6.4] BAGIAN: layanan dan harga -->
        <section class="publik-section" id="layanan" aria-labelledby="judulLayanan">
            <h2 class="publik-section-title" id="judulLayanan">Layanan dan Harga</h2>

            <div class="publik-layanan-list" id="layananList" aria-live="polite" aria-busy="true">
                <?php for ($i = 0; $i < 6; $i++): ?>
                <div class="publik-layanan-item publik-layanan-item--skeleton" aria-hidden="true">
                    <div class="publik-skel publik-skel-line publik-skel-line--layanan"></div>
                    <div class="publik-skel publik-skel-line publik-skel-line--harga"></div>
                </div>
                <?php endfor; ?>
            </div>
        </section>

        <!-- [Card 6.4] SLOT BAWAH LAYANAN: diisi kartu 6.6.5 (blok info usaha). Jangan beri spasi di dalamnya. -->
        <div class="publik-slot publik-slot--bawah-layanan" id="slotBawahLayanan" data-slot="bawah-layanan"></div>

        <noscript>
            <p class="publik-state">Aktifkan JavaScript untuk melihat daftar barber dan layanan.</p>
        </noscript>
    </main>

    <footer class="publik-footer">
        <div class="publik-container">
            <small>&copy; <?= htmlspecialchars($tahun) ?> Kataji Barbershop</small>
        </div>
    </footer>

    <script src="/KELOMPOK-5/publik/publik.js?v=1"></script>
</body>
</html>
