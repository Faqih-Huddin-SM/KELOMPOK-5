<?php
/**
 * Index di dalam folder project, supaya akses ke
 * https://domainanda.com/KELOMPOK-5/ juga langsung masuk ke aplikasi.
 */
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!empty($_SESSION['id_user'])) {
    $page = (($_SESSION['role'] ?? '') === 'owner') ? 'dashboard.php' : 'transaksi.php';
} else {
    $page = 'login.php';
}

header('Location: /KELOMPOK-5/pages/' . $page);
exit;