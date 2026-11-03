
<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_role(['owner']);
?>

<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="layanan-page">

    <!-- Judul halaman -->
    <div class="layanan-heading">
        <h1>Layanan</h1>
    </div>

    <!-- Notifikasi dari API -->
    <div
        id="layananNotifikasi"
        class="layanan-notifikasi"
        role="status"
        aria-live="polite"
    ></div>

    <!-- Tabel daftar layanan -->
    <div class="layanan-card">
        <div class="layanan-table-wrapper">
            <table class="layanan-table">
                <thead>
                    <tr>
                        <th>Layanan</th>
                        <th>Harga</th>
                        <th>HPP</th>
                        <th>Aktif</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody id="layananTableBody">
                    <tr>
                        <td colspan="5">Memuat data layanan...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Form tambah layanan -->
    <div class="layanan-card tambah-layanan-card">
        <h2>Tambah Layanan</h2>

        <form id="formTambahLayanan" class="tambah-layanan-form" novalidate>

            <div class="layanan-input-group">
                <label for="namaLayanan">Nama</label>
                <input
                    type="text"
                    id="namaLayanan"
                    maxlength="100"
                >
                <span
                    id="errorNamaLayanan"
                    class="layanan-error"
                ></span>
            </div>

            <div class="layanan-input-group">
                <label for="hargaLayanan">Harga</label>
                <input
                    type="number"
                    id="hargaLayanan"
                    min="1"
                >
                <span
                    id="errorHargaLayanan"
                    class="layanan-error"
                ></span>
            </div>

            <div class="layanan-input-group">
                <label for="hppLayanan">HPP</label>
                <input
                    type="number"
                    id="hppLayanan"
                    min="1"
                    step="1"
                >
                <span
                    id="errorHppLayanan"
                    class="layanan-error"
                ></span>
            </div>

            <button type="submit" class="layanan-submit">
                Tambah
            </button>

        </form>
    </div>

</div>

<!-- Modal Edit Layanan -->
<div
    id="modalEditLayanan"
    class="layanan-modal-overlay"
    aria-hidden="true"
>
    <div
        class="layanan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="judulModalEditLayanan"
    >

        <!-- Header modal -->
        <div class="layanan-modal-header">
            <h2 id="judulModalEditLayanan">Edit Layanan</h2>

            <button
                type="button"
                id="tutupModalEditLayanan"
                class="layanan-modal-close"
                aria-label="Tutup modal"
            >
                &times;
            </button>
        </div>

        <!-- Form edit -->
        <form id="formEditLayanan" novalidate>

            <input
                type="hidden"
                id="editIdLayanan"
            >

            <div class="layanan-modal-body">

                <div class="layanan-modal-group">
                    <label for="editNamaLayanan">
                        Nama Layanan
                    </label>

                    <input
                        type="text"
                        id="editNamaLayanan"
                        placeholder="Masukkan nama layanan"
                        maxlength="100"
                    >

                    <span
                        id="errorEditNamaLayanan"
                        class="layanan-error"
                    ></span>
                </div>

                <!-- Ikon mengikuti desain; belum dikirim ke API -->
                <div class="layanan-modal-group">
                    <label for="editIconLayanan">
                        Icon Layanan
                    </label>

                    <input
                        type="file"
                        id="editIconLayanan"
                        accept="image/png,image/jpeg,image/webp"
                    >

                    <small class="layanan-modal-hint">
                        *Format .PNG, .JPG, .WEBP Maks 2 mb
                    </small>
                </div>

                <div class="layanan-modal-group">
                    <label for="editHargaLayanan">
                        Harga
                    </label>

                    <input
                        type="number"
                        id="editHargaLayanan"
                        min="1"
                        placeholder="Masukkan harga layanan"
                    >

                    <span
                        id="errorEditHargaLayanan"
                        class="layanan-error"
                    ></span>
                </div>

                <div class="layanan-modal-group">
                    <label for="editHppLayanan">
                        HPP
                    </label>

                    <input
                        type="number"
                        id="editHppLayanan"
                        min="1"
                        step="1"
                        placeholder="Masukkan HPP"
                    >

                    <span
                        id="errorEditHppLayanan"
                        class="layanan-error"
                    ></span>
                </div>

            </div>

            <!-- Tombol simpan -->
            <div class="layanan-modal-footer">
                <button
                    type="submit"
                    id="simpanEditLayanan"
                    class="layanan-modal-submit"
                >
                    Simpan Layanan
                </button>
            </div>

        </form>

    </div>
</div>

<script src="/KELOMPOK-5/assets/js/layanan.js?v=4"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
