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
            <div class="pelanggan-list-container is-loading" id="pelangganListContainer" role="list">
                <!-- [Card 5.2] Loading state awal daftar pelanggan -->
                <div class="pelanggan-list-loading-wrap" role="status" aria-live="polite">
                    <span class="pelanggan-loading-spinner" aria-hidden="true"></span>
                    <span>Memuat daftar pelanggan...</span>
                </div>
            </div>
        </section>

        <!-- [Card 5.2] =========================================================
             KOLOM KANAN: PROFIL RINGKAS & RIWAYAT LAYANAN (TIMELINE)
        ======================================================================== -->
        <main class="pelanggan-detail-col">

            <!-- [Card 5.2] 1. KARTU PROFIL RINGKAS PELANGGAN (ATAS) -->
            <section class="pelanggan-card pelanggan-profile-card" id="pelangganProfileCard" aria-label="Profil Pelanggan" aria-busy="true">
                <div class="pelanggan-profile-loading-state" role="status" aria-live="polite">
                    <span class="pelanggan-loading-spinner" aria-hidden="true"></span>
                    <span>Memuat profil pelanggan...</span>
                </div>
                <div class="pelanggan-profile-content">
                    <div class="pelanggan-profile-left">
                        <!-- Avatar Lingkaran Besar dengan Inisial Nama -->
                        <div class="pelanggan-avatar-large" id="profileAvatar" aria-hidden="true">
                            <span class="pelanggan-loading-spinner pelanggan-loading-spinner--avatar"></span>
                        </div>
                        <div class="pelanggan-profile-info">
                            <h2 class="pelanggan-profile-name" id="profileNama">
                                Memuat pelanggan...
                            </h2>
                            <p class="pelanggan-profile-subtext pelanggan-profile-loading" id="profileLastVisit" role="status" aria-live="polite">
                                <span class="pelanggan-loading-spinner" aria-hidden="true"></span>
                                Memuat data pelanggan...
                            </p>
                        </div>
                    </div>

                    <div class="pelanggan-profile-right">
                        <!-- [Card 5.2] Badge Jumlah Kunjungan Box Sesuai Desain Figma (Kotak Kunjungan) -->
                        <div class="badge-kunjungan-box" id="profileKunjunganBadge" aria-label="Jumlah kunjungan" aria-busy="true">
                            <span class="pelanggan-loading-spinner pelanggan-loading-spinner--visits" role="status" aria-label="Memuat jumlah kunjungan"></span>
                            <span class="badge-kunjungan-label">kunjungan</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- [Card 5.2] 2. KARTU RIWAYAT LAYANAN TIMELINE (BAWAH) -->
            <!-- id="riwayatHistoryCard" dipakai JS untuk hide/show saat pelanggan belum pernah bertransaksi -->
            <section class="pelanggan-card pelanggan-history-card" id="riwayatHistoryCard" aria-label="Riwayat Layanan" aria-busy="true">
                <div class="pelanggan-history-header">
                    <h3 class="pelanggan-history-title">Riwayat Layanan</h3>
                    <!-- [Card 5.2] Subtitle sesuai Figma: "terbaru di atas" -->
                    <p class="pelanggan-history-subtitle">Layanan yang pernah diambil, terbaru di atas</p>
                </div>

                <!-- [Card 5.2] Kontainer Timeline Riwayat (Diisi Dinamis via pelanggan.js) -->
                <div class="pelanggan-timeline-container" id="riwayatTimelineContainer">
                    <div class="pelanggan-timeline-loading" role="status" aria-live="polite">
                        <span class="pelanggan-loading-spinner pelanggan-loading-spinner--large" aria-hidden="true"></span>
                        <span>Memuat riwayat layanan...</span>
                    </div>
                </div>
            </section>

        </main>

    </div>

</div>

<!-- [Card 5.2] Script Frontend Pelanggan & Riwayat Layanan -->
<script src="/KELOMPOK-5/assets/js/pelanggan.js?v=9"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
