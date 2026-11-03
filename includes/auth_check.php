<?php
/**
 * Pemeriksaan akses halaman.
 * Mengatur login, session timeout (30 menit), dan pembatasan berdasarkan role (Job 3.3).
 */

require_once __DIR__ . '/../config/config.php';

define('SESSION_LIFETIME', 1800);                   // 30 menit

function require_login(): void {
    if (empty($_SESSION['id_user'])) {
        header('Location: /KELOMPOK-5/pages/login.php');
        exit;
    }

    // Cek apakah session sudah melewati batas waktu 30 menit (AC 3)
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_LIFETIME)) {
        session_unset();
        session_destroy();
        header('Location: /KELOMPOK-5/pages/login.php?expired=1');
        exit;
    }

    $_SESSION['last_activity'] = time();
}

function require_role(array $allowedRoles): void {
    require_login();
    if (!in_array($_SESSION['role'] ?? '', $allowedRoles, true)) {
        http_response_code(403);
        include __DIR__ . '/../pages/akses_ditolak.php';
        exit;
    }
}