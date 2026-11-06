<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$role = $_SESSION['role'] ?? '';
$nama = $_SESSION['nama'] ?? '';

$current_page = basename($_SERVER['PHP_SELF']);
$login_notification = $_SESSION['login_notification'] ?? '';
unset($_SESSION['login_notification']);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kataji Barber</title>

    <!-- Google Fonts -->
    <!-- Pastikan 3 baris ini ada dan file sudah di-SAVE -->
    <link rel="preconnect" href="https://googleapis.com">
    <link rel="preconnect" href="https://gstatic.com" crossorigin>
    <link href="https://googleapis.com/css2?family=New+Amsterdam&display=swap" rel="stylesheet">

    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <!-- Bootstrap 5 -->
    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
    >

    <!-- Custom Style -->
    <link
        rel="stylesheet"
        href="/KELOMPOK-5/assets/css/style.css?v=23"
    >
</head>

<body>
<?php if ($login_notification !== ''): ?>
    <div class="transaction-success login-notification show">
        <?= htmlspecialchars($login_notification) ?>
    </div>
<?php endif; ?>
<div class="app-layout">

    <!-- SIDEBAR -->
    <aside class="app-sidebar">

        <!-- LOGO & BRAND -->
        <div class="sidebar-logo">
            <a
                
                class="sidebar-brand-link"
            >
                <img
                    src="/KELOMPOK-5/assets/img/logo-kataji.png"
                    alt="Logo Kataji Barber"
                >
                <span class="sidebar-brand-text">
                    KATAJI BARBER
                </span>
            </a>
        </div>

        <!-- MENU NAVIGASI -->
        <nav class="sidebar-menu">
            <?php if ($role === 'owner'): ?>

    <!-- DASHBOARD -->
    <a
        href="/KELOMPOK-5/pages/dashboard.php"
        class="sidebar-link <?= $current_page === 'dashboard.php' ? 'active' : '' ?>"
    >
        <span>Dashboard</span>
    </a>

    <!-- KASIR -->
    <a
        href="/KELOMPOK-5/pages/transaksi.php"
        class="sidebar-link <?= $current_page === 'transaksi.php' ? 'active' : '' ?>"
    >
        <span>Kasir</span>
    </a>

    <!-- RIWAYAT -->
    <a
        href="/KELOMPOK-5/pages/riwayat.php"
        class="sidebar-link <?= $current_page === 'riwayat.php' ? 'active' : '' ?>"
    >
        <span>Riwayat</span>
    </a>

    <!-- DATA BARBER -->
    <a
        href="/KELOMPOK-5/pages/barber.php"
        class="sidebar-link <?= $current_page === 'barber.php' ? 'active' : '' ?>"
    >
        <span>Data Barber</span>
    </a>

    <!-- LAYANAN-->
    <a
        href="/KELOMPOK-5/pages/layanan.php"
        class="sidebar-link <?= $current_page === 'layanan.php' ? 'active' : '' ?>"
    >
        <span>Layanan</span>
    </a>

    <!-- PEMASUKAN -->
    <a
        href="/KELOMPOK-5/pages/pemasukan.php"
        class="sidebar-link <?= $current_page === 'pemasukan.php' ? 'active' : '' ?>"
    >
        <span>Pemasukkan</span>
    </a>

    <!-- PENGELUARAN / HPP -->
    <a
        href="/KELOMPOK-5/pages/pengeluaran.php"
        class="sidebar-link <?= $current_page === 'pengeluaran.php' ? 'active' : '' ?>"
    >
        <span>Pengeluaran/HPP</span>
    </a>

    <!-- LAPORAN -->
    <a
        href="/KELOMPOK-5/pages/laporan.php"
        class="sidebar-link <?= $current_page === 'laporan.php' ? 'active' : '' ?>"
    >
        <span>Laporan</span>
    </a>

<?php elseif ($role === 'barber'): ?>

    <!-- KASIR -->
    <a
        href="/KELOMPOK-5/pages/transaksi.php"
        class="sidebar-link <?= $current_page === 'transaksi.php' ? 'active' : '' ?>"
    >
        <span>Kasir</span>
    </a>

    <!-- RIWAYAT SAYA -->
    <a
        href="/KELOMPOK-5/pages/riwayat.php"
        class="sidebar-link <?= $current_page === 'riwayat.php' ? 'active' : '' ?>"
    >
        <span>Riwayat</span>
    </a>

    <!-- STATUS SAYA -->
    <a
        href="/KELOMPOK-5/pages/status_saya.php"
        class="sidebar-link <?= $current_page === 'status_saya.php' ? 'active' : '' ?>"
    >
        <span>Status Saya</span>
    </a>

<?php endif; ?>

</nav>

    <!-- TOMBOL KELUAR -->
    <div class="sidebar-bottom">
        <a
            href="/KELOMPOK-5/pages/logout.php"
            class="sidebar-logout"
        >
            Keluar
        </a>
    </div>

</aside>

<!-- AREA KONTEN UTAMA -->
<div class="app-main">
    <main class="app-content">
