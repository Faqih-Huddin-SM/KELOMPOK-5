<?php
/**
 * Template konfigurasi koneksi database.
 * Salin file ini menjadi config.php (di folder yang sama), lalu isi kredensial asli.
 * config.php TIDAK boleh ter-commit ke Git — sudah didaftarkan di .gitignore.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'kataji_barber');
define('DB_USER', 'root');       // default XAMPP, sesuaikan bila berbeda
define('DB_PASS', '');           // default XAMPP kosong, sesuaikan bila berbeda

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    error_log('Koneksi database gagal: ' . $e->getMessage());
    http_response_code(500);
    die('Koneksi database gagal. Periksa konfigurasi dan log server.');
}

// Mulai session di satu tempat agar konsisten dipakai seluruh halaman.
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
