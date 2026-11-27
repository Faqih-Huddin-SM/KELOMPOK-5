<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_role(['owner']);
include __DIR__ . '/../includes/header.php';
?>

<style>
/* Pastikan ellipsis untuk Nama & Spesialisasi aktif langsung tanpa terhalang cache style.css */
.barber-page .barber-col-spes { max-width: 180px; white-space: nowrap; color: #6B6B6B; }
.barber-page .barber-spes-cell { display: inline-flex; align-items: center; max-width: 100%; vertical-align: middle; }
.barber-page .barber-spes-teks { display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
</style>

<div class="barber-page">

    <!-- Notifikasi Toast -->
    <div id="barberNotifikasi" class="transaction-success" role="status" aria-live="polite"></div>

    <!-- Heading Row -->
    <div class="barber-heading-row">
        <div class="barber-heading-text">
            <h1>Data Barber</h1>
            <p>Kelola data dan informasi barber Kataji Barber</p>
        </div>
        <button type="button" id="btnTambahBarber" class="barber-btn-tambah">
            + Tambah Barber
        </button>
    </div>

    <!-- Card Tabel -->
    <div class="barber-card">

        <!-- Toolbar: Filter Tabs + Pencarian -->
        <div class="barber-toolbar">
            <div class="barber-filter-tabs" role="tablist" aria-label="Filter status barber">
                <button type="button" class="barber-tab active" data-filter="semua" role="tab" aria-selected="true">Semua <span data-count-for="semua">(0)</span></button>
                <button type="button" class="barber-tab" data-filter="aktif" role="tab" aria-selected="false">Aktif <span data-count-for="aktif">(0)</span></button>
                <button type="button" class="barber-tab" data-filter="nonaktif" role="tab" aria-selected="false"> Nonaktif <span data-count-for="nonaktif">(0)</span></button>
            </div>
            <div class="barber-search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"/>
                    <path d="M21 21l-4.3-4.3"/>
                </svg>
                <input type="search" id="barberSearch" placeholder="Cari nama, username, atau spesialisasi..." aria-label="Cari barber" autocomplete="off">
            </div>
        </div>

        <!-- Loading State -->
        <div id="barberLoadingState" class="barber-loading-state" role="status" aria-live="polite">
            <span class="barber-spinner" aria-hidden="true"></span>
            <span class="barber-loading-text">Memuat data barber...</span>
        </div>

        <!-- Empty State -->
        <div id="barberEmptyState" class="barber-empty-state" hidden>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span id="barberEmptyText">Belum ada barber</span>
        </div>

        <!-- Table -->
        <div class="barber-table-wrapper" id="barberTableWrapper" hidden>
            <table class="barber-table">
                <thead>
                    <tr>
                        <th class="barber-col-no">No</th>
                        <th class="barber-col-foto">Foto</th>
                        <th class="barber-col-nama">Nama</th>
                        <th>Username</th>
                        <th class="barber-col-spes">Spesialisasi</th>
                        <th class="barber-col-status">Status</th>
                        <th class="barber-col-aksi">Aksi</th>
                    </tr>
                </thead>
                <tbody id="barberTableBody"></tbody>
            </table>
        </div>

        <!-- Footer Tabel: info, pagination, jumlah per halaman -->
        <div class="barber-table-footer" id="barberTableFooter" hidden>
            <span class="barber-info" id="barberInfo"></span>

            <nav class="barber-pager" aria-label="Navigasi halaman">
                <button type="button" class="barber-pager-nav" id="barberPrev">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                    Sebelumnya
                </button>
                <div class="barber-page-numbers" id="barberPageNumbers"></div>
                <button type="button" class="barber-pager-nav" id="barberNext">
                    Selanjutnya
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </nav>

            <label class="barber-perpage" for="barberPerPage">
                <span>Per halaman</span>
                <select id="barberPerPage">
                    <option value="5">5</option>
                    <option value="10" selected>10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </label>
        </div>

    </div><!-- /barber-card -->

</div><!-- /barber-page -->

<!-- ===================================================
     MODAL TAMBAH BARBER
=================================================== -->
<div id="modalTambahBarber" class="barber-modal-overlay" aria-hidden="true">
    <div class="barber-modal" role="dialog" aria-modal="true" aria-labelledby="judulModalTambah">

        <div class="barber-modal-header">
            <h2 id="judulModalTambah">Tambah Barber</h2>
        </div>

        <div id="barberBannerErrorTambah" class="barber-modal-banner-error" hidden>
            Profil gagal disimpan. Silakan coba lagi.
        </div>

        <form id="formTambahBarber" novalidate>
            <div class="barber-modal-body">

                <!-- Foto -->
                <div class="barber-foto-row">
                    <div class="barber-foto-preview" id="previewFotoTambah" aria-label="Pratinjau foto barber">
                        <span id="inisialTambah">?</span>
                        <img id="imgPreviewTambah" src="" alt="Foto barber" hidden>
                    </div>
                    <div class="barber-foto-actions">
                        <span class="barber-foto-label">Foto Barber</span>
                        <label for="inputFotoTambah" class="btn-unggah-foto">Unggah Foto</label>
                        <input type="file" id="inputFotoTambah" name="foto_barber" accept="image/jpeg,image/png" hidden>
                        <p class="barber-modal-hint">JPG atau PNG, maksimal 10 MB.</p>
                        <p class="barber-modal-hint">Bila kosong, halaman publik memakai inisial.</p>
                    </div>
                </div>

                <!-- Nama -->
                <div class="barber-modal-group">
                    <label for="tambahNama"><strong>Nama</strong></label>
                    <input type="text" id="tambahNama" name="nama" maxlength="100" placeholder="Masukkan nama barber">
                    <span id="errorTambahNama" class="barber-field-error"></span>
                    <small class="barber-modal-hint">Maksimal 100 karakter</small>
                </div>

                <!-- Username -->
                <div class="barber-modal-group">
                    <label for="tambahUsername"><strong>Username</strong></label>
                    <input type="text" id="tambahUsername" name="username" placeholder="Masukkan username">
                    <span id="errorTambahUsername" class="barber-field-error"></span>
                    <small class="barber-modal-hint">Unik dan tidak dapat diubah setelah akun dibuat</small>
                </div>

                <!-- Password -->
                <div class="barber-modal-group">
                    <label for="tambahPassword"><strong>Password awal</strong></label>
                    <input type="password" id="tambahPassword" name="password" placeholder="Masukkan password awal">
                    <span id="errorTambahPassword" class="barber-field-error"></span>
                    <small class="barber-modal-hint">Minimal 6 karakter</small>
                </div>

                <!-- Spesialisasi -->
                <div class="barber-modal-group">
                    <label for="tambahSpesialisasi"><strong>Spesialisasi (opsional)</strong></label>
                    <input type="text" id="tambahSpesialisasi" name="spesialisasi" maxlength="100" placeholder="Contoh: Fade, Pompadour">
                    <span id="errorTambahSpesialisasi" class="barber-field-error"></span>
                    <small class="barber-modal-hint">Maksimal 100 karakter</small>
                </div>

            </div><!-- /barber-modal-body -->

            <div class="barber-modal-footer">
                <button type="button" class="barber-btn-batal" id="batalTambahBarber">Batal</button>
                <button type="submit" class="barber-btn-simpan" id="simpanTambahBarber">Simpan</button>
            </div>
        </form>

    </div>
</div>

<!-- ===================================================
     MODAL UBAH PROFIL
=================================================== -->
<div id="modalUbahProfil" class="barber-modal-overlay" aria-hidden="true">
    <div class="barber-modal" role="dialog" aria-modal="true" aria-labelledby="judulModalUbah">

        <div class="barber-modal-header">
            <h2 id="judulModalUbah">Ubah Profil</h2>
            <button type="button" class="barber-modal-close" id="tutupModalUbah" aria-label="Tutup modal">&times;</button>
        </div>

        <div id="barberBannerErrorUbah" class="barber-modal-banner-error" hidden>
            Profil gagal disimpan. Silakan coba lagi.
        </div>

        <form id="formUbahProfil" novalidate>
            <input type="hidden" id="ubahIdUser">

            <div class="barber-modal-body">

                <!-- Foto -->
                <div class="barber-foto-row">
                    <div class="barber-foto-preview" id="previewFotoUbah" aria-label="Pratinjau foto barber">
                        <span id="inisialUbah">?</span>
                        <img id="imgPreviewUbah" src="" alt="Foto barber" hidden>
                    </div>
                    <div class="barber-foto-actions">
                        <div class="barber-foto-btn-row">
                            <label for="inputFotoUbah" class="btn-unggah-foto">Ganti Foto</label>
                            <input type="file" id="inputFotoUbah" name="foto_barber" accept="image/jpeg,image/png" hidden>
                            <button type="button" class="btn-hapus-foto" id="btnHapusFoto">Hapus Foto</button>
                        </div>
                        <p class="barber-modal-hint">JPG atau PNG, maksimal 10 MB.</p>
                        <p class="barber-modal-hint">Bila kosong, halaman publik memakai inisial.</p>
                    </div>
                </div>

                <!-- Nama -->
                <div class="barber-modal-group">
                    <label for="ubahNama"><strong>Nama</strong></label>
                    <input type="text" id="ubahNama" name="nama" maxlength="100" placeholder="Masukkan nama barber">
                    <span id="errorUbahNama" class="barber-field-error"></span>
                </div>

                <!-- Username (disabled) -->
                <div class="barber-modal-group">
                    <label for="ubahUsername"><strong>Username</strong></label>
                    <div class="barber-username-wrapper">
                        <input type="text" id="ubahUsername" name="username" disabled>
                        <span class="barber-lock-icon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </span>
                    </div>
                    <small class="barber-modal-hint">Username tidak dapat diubah</small>
                </div>

                <!-- Spesialisasi -->
                <div class="barber-modal-group">
                    <label for="ubahSpesialisasi"><strong>Spesialisasi <span style="font-weight:400;color:var(--text-secondary)">(opsional)</span></strong></label>
                    <input type="text" id="ubahSpesialisasi" name="spesialisasi" maxlength="100" placeholder="Contoh: Fade, Pompadour">
                    <span id="errorUbahSpesialisasi" class="barber-field-error"></span>
                </div>

            </div><!-- /barber-modal-body -->

            <div class="barber-modal-footer">
                <button type="button" class="barber-btn-batal" id="batalUbahProfil">Batal</button>
                <button type="submit" class="barber-btn-simpan" id="simpanUbahProfil">Simpan</button>
            </div>
        </form>

    </div>
</div>

<!-- ===================================================
     MODAL RESET PASSWORD
=================================================== -->
<div id="modalResetPassword" class="barber-modal-overlay" aria-hidden="true">
    <div class="barber-modal barber-modal--narrow" role="dialog" aria-modal="true" aria-labelledby="judulModalReset">

        <div class="barber-modal-header">
            <h2 id="judulModalReset">Reset Password</h2>
            <button type="button" class="barber-modal-close" id="tutupModalReset" aria-label="Tutup modal">&times;</button>
        </div>

        <form id="formResetPassword" novalidate>
            <input type="hidden" id="resetIdUser">

            <div class="barber-modal-body">
                <p id="resetSubtitle" class="barber-reset-subtitle">Akun: <strong></strong></p>

                <!-- Password Baru -->
                <div class="barber-modal-group">
                    <label for="resetPasswordBaru"><strong>Password baru</strong></label>
                    <input type="password" id="resetPasswordBaru" placeholder="Ketik password baru">
                    <span id="errorResetPassword" class="barber-field-error"></span>
                    <small class="barber-modal-hint">Minimal 6 karakter</small>
                </div>
            </div>

            <div class="barber-modal-footer">
                <button type="button" class="barber-btn-batal" id="batalResetPassword">Batal</button>
                <button type="submit" class="barber-btn-simpan" id="simpanResetPassword">Simpan</button>
            </div>
        </form>

    </div>
</div>

<script src="/KELOMPOK-5/assets/js/barber.js?v=8"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
