<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'kataji_barber');
define('DB_USER', 'root');
define('DB_PASS', '');

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

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}