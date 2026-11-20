<?php
if (!isset($_SERVER['REDIRECT_STATUS']) || (int) $_SERVER['REDIRECT_STATUS'] !== 500) {
    http_response_code(500);
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>500 - Server Sedang Bermasalah | Kataji Barber</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >
    <link rel="stylesheet" href="/KELOMPOK-5/assets/css/404.css?v=2">
</head>
<body class="notfound-body">
    <main class="notfound-page">
        <section class="notfound-card" aria-labelledby="serverErrorTitle">
            <svg class="notfound-code" viewBox="0 0 402 149" role="img" aria-label="Error 500" xmlns="http://www.w3.org/2000/svg">
                <text x="201" y="119" text-anchor="middle" fill="#17186B"
                    font-family="Poppins, sans-serif" font-size="128" font-weight="800">500</text>
            </svg>

            <h1 class="notfound-title" id="serverErrorTitle">Server Sedang Bermasalah</h1>
            <p class="notfound-text">
                Maaf, server sedang mengalami kendala.<br>
                Silakan coba lagi beberapa saat lagi.
            </p>

            <div class="notfound-actions">
                <button type="button" class="notfound-btn notfound-btn-primary" id="btnServerRetry">
                    Coba Lagi
                </button>
                <a href="/KELOMPOK-5/" class="notfound-btn notfound-btn-outline">
                    Kembali ke Beranda
                </a>
            </div>
        </section>
    </main>
    <script src="/KELOMPOK-5/assets/js/500.js?v=1"></script>
</body>
</html>
