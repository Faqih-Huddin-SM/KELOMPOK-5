<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_login();

// Halaman ini hanya dapat diakses oleh owner.
$role = $_SESSION['role'] ?? '';

if ($role !== 'owner') {
    header('Location: dashboard.php');
    exit;
}

include __DIR__ . '/../includes/header.php';
?>

<main class="pengeluaran-page">

    <!-- Judul halaman -->
    <header class="pengeluaran-heading">
        <h1>Pengeluaran</h1>
    </header>

    <!-- Ringkasan pengeluaran -->
    <section class="pengeluaran-summary-card">

        <div class="pengeluaran-summary-header">
            <h2>Ringkasan Pengeluaran</h2>

            <div class="pengeluaran-period-options">
                <button type="button" class="active"
                    data-periode="hari" aria-pressed="true">
                    Hari Ini
                </button>
                <button type="button"
                    data-periode="minggu" aria-pressed="false">
                    Minggu Ini
                </button>
                <button type="button"
                    data-periode="bulan" aria-pressed="false">
                    Bulan Ini
                </button>
                <button type="button"
                    data-periode="semua" aria-pressed="false">
                    Semua
                </button>
            </div>
        </div>

        <div class="pengeluaran-summary-content">

            <div class="pengeluaran-summary-item">
                <span>HPP Layanan</span>
                <strong id="ringkasanHppLayanan">Rp0</strong>
            </div>

            <div class="pengeluaran-summary-item">
                <span>Pengeluaran Operasional</span>
                <strong id="totalRingkasanPengeluaran">Rp0</strong>
            </div>

            <div class="pengeluaran-summary-item">
                <span>Pembelian Bahan</span>
                <strong id="ringkasanPembelianBahan">Rp0</strong>
            </div>

        </div>
    </section>

    <!-- Form pencatatan pengeluaran -->
    <section class="pengeluaran-form-card">

        <h2 class="pengeluaran-form-title">Catat Pengeluaran</h2>

        <form id="formPengeluaranHarian" class="pengeluaran-form" novalidate>

            <div class="pengeluaran-form-group">
                <label for="kategoriPengeluaranHarian">Kategori</label>

                <select id="kategoriPengeluaranHarian"
                    name="kategori" required>
                    <option value="">Pilih kategori</option>
                    <option value="Bahan">Bahan</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Peralatan">Peralatan</option>
                    <option value="Lainnya">Lainnya</option>
                </select>

                <small
                    id="errorKategoriPengeluaranHarian"
                    class="pengeluaran-validation-error"
                    role="alert"
                ></small>

                <div class="pengeluaran-form-actions">
                    <button type="submit" id="btnSimpanPengeluaran">
                        Simpan
                    </button>
                </div>
            </div>

            <div class="pengeluaran-form-group">
                <label for="nominalPengeluaranHarian">Nominal</label>

                <input
                    type="number"
                    id="nominalPengeluaranHarian"
                    name="nominal"
                    min="1"
                    step="1"
                    placeholder="Masukkan nominal"
                    aria-describedby="errorNominalPengeluaranHarian"
                    required
                >

                <small
                    id="errorNominalPengeluaranHarian"
                    class="pengeluaran-validation-error"
                    role="alert"
                ></small>
            </div>

        </form>
    </section>

    <!-- Daftar pengeluaran harian -->
    <section class="pengeluaran-daily-card">

        <div class="pengeluaran-daily-header">
            <h2>Pengeluaran Hari Ini</h2>

            <div class="pengeluaran-date-filter">
                <label for="tanggalPengeluaranHarian"
                    class="visually-hidden">Tanggal pengeluaran</label>

                <input type="date" id="tanggalPengeluaranHarian">
            </div>
        </div>

        <p id="statusPengeluaranHarian"
            class="pengeluaran-status"
            role="status"
            aria-live="polite">
            Memuat data pengeluaran...
        </p>

        <div class="pengeluaran-table-wrapper">
            <table class="pengeluaran-table">
                <thead>
                    <tr>
                        <th scope="col">Tanggal</th>
                        <th scope="col">Kategori</th>
                        <th scope="col">Nominal</th>
                        <th scope="col">Aksi</th>
                    </tr>
                </thead>

                <tbody id="daftarPengeluaranHarian"></tbody>
            </table>
        </div>

        <div class="pengeluaran-daily-total">
            <span>Total Pengeluaran</span>
            <strong id="totalPengeluaranHarian">Rp0</strong>
        </div>

        <span id="periodePengeluaran" hidden></span>
    </section>

    <!-- HPP per layanan terjual -->
    <section class="pengeluaran-hpp-card">

        <h2>HPP Per Layanan Terjual</h2>

        <div class="pengeluaran-hpp-table-wrapper">
            <table class="pengeluaran-hpp-table">
                <thead>
                    <tr>
                        <th scope="col">Layanan</th>
                        <th scope="col">Terjual</th>
                        <th scope="col">Pendapatan</th>
                        <th scope="col">HPP</th>
                    </tr>
                </thead>

                <tbody id="daftarHppLayanan">
                    <tr>
                        <td colspan="4" class="pengeluaran-hpp-empty">
                            Data HPP belum tersedia.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

    </section>

</main>

<script src="/KELOMPOK-5/assets/js/pengeluaran.js?v=7"></script>

<?php include __DIR__ . '/../includes/footer.php'; ?>
