<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_role(['owner']);
include __DIR__ . '/../includes/header.php';
?>

<main class="barber-page">
    <div class="barber-heading">
        <h1>Data Barber</h1>
        <p>Daftar barber yang terdaftar aktif</p>
    </div>
    <div id="daftarBarber" class="barber-list"></div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
