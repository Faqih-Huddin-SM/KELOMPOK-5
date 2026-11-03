<?php
require_once __DIR__ . '/../includes/auth_check.php';
require_role(['barber']);
include __DIR__ . '/../includes/header.php';
?>

<main class="status-page">
    <div class="status-heading">
        <h1>Status Saya</h1>
        <p>Anda masuk sebagai <?= htmlspecialchars($_SESSION['nama'] ?? 'Barber') ?></p>
    </div>
    <div class="status-card">
        <strong>Status:</strong> Aktif
    </div>
</main>

<?php include __DIR__ . '/../includes/footer.php'; ?>
