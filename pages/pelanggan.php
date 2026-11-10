<?php
// ==============================================================================
// [Card 5.2] Halaman Pelanggan & Riwayat Layanan Pelanggan (Kataji Barber)
// User Story: Sebagai owner, saya ingin melihat riwayat layanan yang pernah
// diambil seorang pelanggan, agar saya bisa merekomendasikan layanan yang sesuai
// saat ia datang kembali.
// WBS 5.2 | Role: Frontend Developer (Faqih)
// ==============================================================================

require_once __DIR__ . '/../includes/auth_check.php';

// [Card 5.2] Pembatasan Akses: Hanya role 'owner' yang dapat mengakses halaman pelanggan
require_role(['owner']);

include __DIR__ . '/../includes/header.php';
?>

<!-- [Card 5.2] Kontainer Halaman Pelanggan -->
<div class="pelanggan-page" data-role="<?= htmlspecialchars($_SESSION['role'] ?? '') ?>">

    <!-- [Card 5.2] Header Judul Halaman -->
    <div class="pelanggan-header-row">
        <h1 class="pelanggan-title">Pelanggan</h1>
        <p class="pelanggan-subtitle">Lihat riwayat layanan untuk merekomendasikan layanan yang pas.</p>
    </div>

    <!-- [Card 5.2] Layout Grid 2 Kolom Sesuai Desain Figma:
         - Kiri: Card Daftar Pelanggan & Pencarian
         - Kanan: Card Profil Pelanggan & Card Riwayat Layanan (Timeline)
    -->
    <div class="pelanggan-layout-grid">

        <!-- [Card 5.2] =========================================================
             KOLOM KIRI: DAFTAR PELANGGAN & FORM PENCARIAN
        ======================================================================== -->
        <section class="pelanggan-card pelanggan-list-card" aria-label="Daftar Pelanggan">
            <h2 class="pelanggan-card-heading">Daftar Pelanggan</h2>

            <!-- [Card 5.2] Input Pencarian Nama Pelanggan -->
            <div class="pelanggan-search-wrap">
                <svg class="pelanggan-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    id="cariPelanggan"
                    class="pelanggan-search-input"
                    placeholder="Cari pelanggan..."
                    autocomplete="off"
                    aria-label="Cari pelanggan"
                >
            </div>

            <!-- [Card 5.2] Kontainer Daftar Item Pelanggan (Diisi Dinamis via pelanggan.js) -->
            <div class="pelanggan-list-container" id="pelangganListContainer" role="list">
                <div class="pelanggan-list-loading text-center py-4 text-muted">
                    Memuat daftar pelanggan...
                </div>
            </div>
        </section>

        <!-- [Card 5.2] =========================================================
             KOLOM KANAN: PROFIL RINGKAS & RIWAYAT LAYANAN (TIMELINE)
        ======================================================================== -->
        <main class="pelanggan-detail-col">

            <!-- [Card 5.2] 1. KARTU PROFIL RINGKAS PELANGGAN (ATAS) -->
            <section class="pelanggan-card pelanggan-profile-card" id="pelangganProfileCard" aria-label="Profil Pelanggan">
                <div class="pelanggan-profile-left">
                    <!-- Avatar Lingkaran Besar dengan Inisial Nama -->
                    <div class="pelanggan-avatar-large" id="profileAvatar" aria-hidden="true">
                        -
                    </div>
                    <div class="pelanggan-profile-info">
                        <h2 class="pelanggan-profile-name" id="profileNama">
                            Pilih Pelanggan
                        </h2>
                        <p class="pelanggan-profile-subtext" id="profileLastVisit">
                            Pilih salah satu pelanggan di sebelah kiri untuk melihat riwayat layanan.
                        </p>
                    </div>
                </div>

                <div class="pelanggan-profile-right">
                    <!-- [Card 5.2] Badge Jumlah Kunjungan Box Sesuai Desain Figma (Kotak Kunjungan) -->
                    <div class="badge-kunjungan-box" id="profileKunjunganBadge" aria-label="Jumlah kunjungan">
                        <span class="badge-kunjungan-num">0</span>
                        <span class="badge-kunjungan-label">kunjungan</span>
                    </div>
                </div>
            </section>

            <!-- [Card 5.2] 2. KARTU RIWAYAT LAYANAN TIMELINE (BAWAH) -->
            <section class="pelanggan-card pelanggan-history-card" aria-label="Riwayat Layanan">
                <div class="pelanggan-history-header">
                    <h3 class="pelanggan-history-title">Riwayat Layanan</h3>
                    <p class="pelanggan-history-subtitle">Layanan yang pernah diambil</p>
                </div>

                <!-- [Card 5.2] Kontainer Timeline Riwayat (Diisi Dinamis via pelanggan.js) -->
                <div class="pelanggan-timeline-container" id="riwayatTimelineContainer">
                    <div class="text-center py-4 text-muted">
                        Pilih pelanggan untuk memuat riwayat layanan.
                    </div>
                </div>
            </section>

        </main>

    </div>

</div>

<!-- [Card 5.2] Script Frontend Pelanggan & Riwayat Layanan -->
<script src="/KELOMPOK-5/assets/js/pelanggan.js?v=2"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>

