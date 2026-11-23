<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_role(['barber']);

$id_user = (int) ($_SESSION['id_user'] ?? 0);
$nama_user = $_SESSION['nama'] ?? 'Barber';

include __DIR__ . '/../includes/header.php';
?>

<link rel="stylesheet" href="/KELOMPOK-5/assets/css/status_saya.css?v=6">

<div class="status-page" data-user-id="<?= $id_user ?>" data-user-nama="<?= htmlspecialchars($nama_user) ?>">

    <!-- Heading Halaman Sesuai Desain Figma -->
    <header class="status-heading">
        <h1>Status Saya</h1>
        <p>Profil dan status akun Anda di Kataji Barber</p>
    </header>

    <!-- Kartu Profil Utama -->
    <section class="status-card is-loading" id="statusProfileCard">

        <!-- State Memuat Data (Figma Loading Screen Sesuai Gambar) -->
        <div class="status-loading-box" id="statusLoadingState">
            <div class="status-spinner" aria-hidden="true"></div>
            <span class="status-loading-text">Memuat profil Anda..</span>
        </div>

        <!-- Konten Profil (Akan ditampilkan setelah data siap) -->
        <div class="status-profile-content" id="statusProfileContent" style="display: none;">

            <!-- Badge "Hanya baca" di pojok kanan atas -->
            <div class="status-badge-readonly" aria-label="Status hak akses">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M6 10V7c0-3.31 2.69-6 6-6s6 2.69 6 6v3h.5c1.38 0 2.5 1.12 2.5 2.5v8c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 23 3 21.88 3 20.5v-8C3 11.12 4.12 10 5.5 10H6zm2.8 0h6.4V7c0-1.77-1.43-3.2-3.2-3.2s-3.2 1.43-3.2 3.2v3z"/>
                </svg>
                <span>Hanya baca</span>
            </div>

            <!-- Foto Avatar / Inisial Profil -->
            <div class="status-avatar-container" id="statusAvatarContainer">
                <div class="status-avatar-initial" id="statusAvatarInitial">
                    <?= strtoupper(mb_substr($nama_user, 0, 1)) ?>
                </div>
            </div>

            <!-- Rincian Data Barber -->
            <div class="status-info-list">
                <div class="status-info-row">
                    <div class="status-info-label">Nama</div>
                    <div class="status-info-name" id="statusNama">
                        <?= htmlspecialchars($nama_user) ?>
                    </div>
                </div>

                <div class="status-info-row">
                    <div class="status-info-label">Spesialisasi</div>
                    <div class="status-info-spec" id="statusSpesialisasi">
                        -
                    </div>
                </div>

                <div class="status-info-row">
                    <div class="status-info-label">Status Akun</div>
                    <div>
                        <span class="status-badge-aktif" id="statusAkunBadge">Aktif</span>
                    </div>
                </div>
            </div>

        </div>

    </section>

    <!-- Banner Informasi Bawah Sesuai Figma -->
    <div class="status-notice-banner" role="note">
        <div class="status-notice-icon" aria-hidden="true">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6 10V7c0-3.31 2.69-6 6-6s6 2.69 6 6v3h.5c1.38 0 2.5 1.12 2.5 2.5v8c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 23 3 21.88 3 20.5v-8C3 11.12 4.12 10 5.5 10H6zm2.8 0h6.4V7c0-1.77-1.43-3.2-3.2-3.2s-3.2 1.43-3.2 3.2v3z"/>
            </svg>
        </div>
        <div class="status-notice-text">
            <strong class="status-notice-title">Halaman ini hanya untuk dilihat.</strong>
            <span class="status-notice-desc">Data profil dikelola oleh owner. Hubungi owner jika ada data yang perlu diperbarui.</span>
        </div>
    </div>

</div>

<script src="/KELOMPOK-5/assets/js/status_saya.js?v=3"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
