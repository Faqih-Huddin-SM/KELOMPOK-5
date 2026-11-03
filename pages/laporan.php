<?php

require_once __DIR__ . '/../includes/auth_check.php';

require_role(['owner']);

$nama = $_SESSION['nama'] ?? '';
?>

<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="laporan-page" data-card-label="6.2.2">
    <div class="dashboard-heading">
        <h1>Laporan</h1>
        <p>Laporan layanan yang paling sering digunakan</p>
    </div>

    <section class="dashboard-section layanan-terlaris-card">
        <div class="layanan-terlaris-header">
            <div>
                <span class="card-work-label">Card 6.2.2 - Layanan Terlaris</span>
                <h2 class="dashboard-card-title">Layanan Terlaris</h2>
            </div>

            <div class="layanan-terlaris-filters">
                <label for="layananPeriode">Periode</label>
                <select id="layananPeriode" class="form-select">
                    <option value="bulan">Bulan ini</option>
                    <option value="minggu">Minggu ini</option>
                </select>

                <label for="layananUrutan">Urutan</label>
                <select id="layananUrutan" class="form-select">
                    <option value="sering">Paling sering</option>
                    <option value="jarang">Paling jarang</option>
                </select>
            </div>
        </div>

        <div id="layananTerlarisStatus" class="layanan-terlaris-status" role="status" aria-live="polite">
            Memuat data layanan...
        </div>
        <div id="layananTerlarisList" class="layanan-terlaris-list"></div>
    </section>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>