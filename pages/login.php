<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Cek apakah ada nilai username yang diteruskan agar data tidak hilang saat error
$saved_username = $_POST['username'] ?? $_GET['username'] ?? '';

// Deteksi status pesan error dari backend
$error_username = isset($_GET['both_empty']) || isset($_GET['username_empty']) || isset($_GET['error']);
$error_password = isset($_GET['both_empty']) || isset($_GET['password_empty']) || isset($_GET['error']);

$error_message = '';
if (isset($_GET['both_empty'])) {
    $error_message = 'Username/email dan password wajib diisi';
} elseif (isset($_GET['username_empty'])) {
    $error_message = 'Username/email wajib diisi';
} elseif (isset($_GET['password_empty'])) {
    $error_message = 'Password wajib diisi';
} elseif (isset($_GET['error'])) {
    $error_message = 'Username atau password salah.';
} elseif (isset($_GET['expired'])) {
    $error_message = 'Sesi anda sudah habis, silakan login kembali.';
    $error_username = true;
    $error_password = true;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Kataji Barber</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Bootstrap 5 -->
    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet"
    >

    <!-- Custom Style -->
    <link
        rel="stylesheet"
        href="/KELOMPOK-5/assets/css/style.css"
    >
</head>

<body>

<div class="login-page">

    <!-- BRANDING SISI KIRI (DESKTOP) -->
    <<!--div class="login-hero">
        <div class="login-hero-logo">
            <img
                src="/KELOMPOK-5/assets/img/logo-kataji.png"
                alt="Logo Kataji Barbering Hair Studio" 
            >
        </div>
        <h2 class="login-hero-title">KATAJI BARBER</h2>
        <p class="login-hero-subtitle">MANAGEMENT &amp; INFORMATION SYSTEM</p>
    </div>-->

    <!-- CARD FORM LOGIN DI SISI KANAN -->
    <div class="login-card">

        <!-- LOGO KECIL ATAS CARD -->
        <div class="login-card-logo">
            <img
                src="/KELOMPOK-5/assets/img/logo-kataji.png"
                alt="Logo Kataji Barber"
            >
        </div>

        <h1>Masuk Ke Akun</h1>
        
        <p class="login-description">
            Silahkan masuk untuk mengakses sistem Kataji Barber
        </p>

        <form
            id="loginForm"
            method="post"
            action="/KELOMPOK-5/api/auth/login.php"        
            class="login-form"
            novalidate
        >       <!-- mengirim POST kebagian BE -->

            <!-- FIELD EMAIL / USERNAME -->
            <div class="login-field">
                <label for="username">Email / Username</label>
                <div id="usernameWrapper" class="input-with-icon <?= $error_username ? 'has-error' : '' ?>">
                    <span class="field-icon">
                        <!-- Icon Surat / Email -->
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                    </span>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="nama@email.com / username"
                        value="<?= htmlspecialchars($saved_username) ?>"
                        autocomplete="username"
                    >
                </div>
            </div>

            <!-- FIELD PASSWORD -->
            <div class="login-field">
                <label for="password">Password</label>
                <div id="passwordWrapper" class="input-with-icon <?= $error_password ? 'has-error' : '' ?>">
                    <span class="field-icon">
                        <!-- Icon Gembok -->
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </span>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        autocomplete="current-password"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        id="passwordToggle"
                        aria-label="Tampilkan Password"
                    >
                        <!-- Icon Mata -->
                        <svg id="eyeIcon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>

                <!---------------------------------------- PESAN ERROR INLINE MERAH SESUAI ATURAN VALIDASI -->
                <div id="loginErrorMessage" class="login-inline-error" style="<?= $error_message !== '' ? 'display: block;' : 'display: none;' ?>">
                    <?= htmlspecialchars($error_message !== '' ? '*' . $error_message : '') ?>
                </div>
            </div>

            <div class="login-forgot">
                <a href="#">Lupa Password?</a>
            </div>

            <button
                type="submit"
                id="btnLogin"
                class="login-button"
            >
                Masuk
            </button>

        </form>

        <div class="login-register">
            Akun dibuat oleh owner, Barber lupa password? Hubungi Owner
        </div>

    </div>

</div>

<script src="/KELOMPOK-5/assets/js/script.js"></script>

</body>
</html>