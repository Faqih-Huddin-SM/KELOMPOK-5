<?php
// ==============================================================================
// [Card X.Y] Frontend Developer (Faqih) - Halaman 404 "Halaman Tidak Ditemukan"
// Halaman mandiri (tanpa sidebar), sesuai desain Figma 404_NOT_FOUND.
// Tombol "Muat Ulang" memuat ulang halaman, tombol "Kembali" ke halaman sebelumnya.
// ==============================================================================

// [Card X.Y] Pastikan status HTTP 404 dikirim agar tidak diindeks sebagai halaman valid
http_response_code(404);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>404 - Halaman Tidak Ditemukan | Kataji Barber</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <link rel="stylesheet" href="/KELOMPOK-5/assets/css/404.css?v=2">
</head>
<body class="notfound-body">
    <!-- [Card X.Y] Versi halaman 404: v3 (tiang barber dianimasikan lewat <animateTransform> di SVG angka 0) -->

    <!-- [Card X.Y] Strip diagonal barber pole di tepi atas & bawah (lihat 404.css) -->
    <main class="notfound-page">
        <section class="notfound-card" aria-labelledby="notfoundTitle">

            <!-- [Card X.Y] Angka 404, huruf "0" berupa tiang barber (SVG dari desain) -->
            <svg class="notfound-code" id="notfoundCode" viewBox="438 208 404 149" role="img" aria-label="Error 404" xmlns="http://www.w3.org/2000/svg" fill="none">
                <path d="M440.2 330V302.4L503.4 212H541.6V300.4H558V330H541.6V356H507.4V330H440.2ZM509.8 249.6L476.2 300.4H509.8V249.6Z" fill="#17186B"/>
                <path d="M664.143 209H613.857C603.443 209 595 217.711 595 228.456V336.544C595 347.289 603.443 356 613.857 356H664.143C674.557 356 683 347.289 683 336.544V228.456C683 217.711 674.557 209 664.143 209Z" fill="white"/>
                <clipPath id="kataji404Clip">
                    <path d="M664.143 209H613.857C603.443 209 595 217.711 595 228.456V336.544C595 347.289 603.443 356 613.857 356H664.143C674.557 356 683 347.289 683 336.544V228.456C683 217.711 674.557 209 664.143 209Z"/>
                </clipPath>
                <g clip-path="url(#kataji404Clip)">
                    <!-- [Card X.Y] Strip tiang barber bergerak: 12 garis asli + salinan -73.5 agar loop animasi mulus -->
                    <g class="notfound-pole-stripes">
                        <!-- [Card X.Y] Animasi SVG (SMIL): strip turun satu periode 73.5 (= 4 x 18.375), loop mulus -->
                        <animateTransform attributeName="transform" type="translate" from="0 0" to="0 73.5" dur="2.5s" repeatCount="indefinite"/>
                        <path d="M595 135.5L683 191.792V210.167L595 153.875V135.5Z" fill="#17186B"/>
                        <path d="M595 153.875L683 210.167V228.542L595 172.25V153.875Z" fill="white"/>
                        <path d="M595 172.25L683 228.542V246.917L595 190.625V172.25Z" fill="#D64545"/>
                        <path d="M595 190.625L683 246.917V265.292L595 209V190.625Z" fill="white"/>
                        <path d="M595 209L683 265.292V283.667L595 227.375V209Z" fill="#17186B"/>
                        <path d="M595 227.375L683 283.667V302.042L595 245.75V227.375Z" fill="white"/>
                        <path d="M595 245.75L683 302.042V320.417L595 264.125V245.75Z" fill="#D64545"/>
                        <path d="M595 264.125L683 320.417V338.792L595 282.5V264.125Z" fill="white"/>
                        <path d="M595 282.5L683 338.792V357.167L595 300.875V282.5Z" fill="#17186B"/>
                        <path d="M595 300.875L683 357.167V375.542L595 319.25V300.875Z" fill="white"/>
                        <path d="M595 319.25L683 375.542V393.917L595 337.625V319.25Z" fill="#D64545"/>
                        <path d="M595 337.625L683 393.917V412.292L595 356V337.625Z" fill="white"/>
                        <g transform="translate(0 -73.5)">
                            <path d="M595 135.5L683 191.792V210.167L595 153.875V135.5Z" fill="#17186B"/>
                            <path d="M595 153.875L683 210.167V228.542L595 172.25V153.875Z" fill="white"/>
                            <path d="M595 172.25L683 228.542V246.917L595 190.625V172.25Z" fill="#D64545"/>
                            <path d="M595 190.625L683 246.917V265.292L595 209V190.625Z" fill="white"/>
                            <path d="M595 209L683 265.292V283.667L595 227.375V209Z" fill="#17186B"/>
                            <path d="M595 227.375L683 283.667V302.042L595 245.75V227.375Z" fill="white"/>
                            <path d="M595 245.75L683 302.042V320.417L595 264.125V245.75Z" fill="#D64545"/>
                            <path d="M595 264.125L683 320.417V338.792L595 282.5V264.125Z" fill="white"/>
                            <path d="M595 282.5L683 338.792V357.167L595 300.875V282.5Z" fill="#17186B"/>
                            <path d="M595 300.875L683 357.167V375.542L595 319.25V300.875Z" fill="white"/>
                            <path d="M595 319.25L683 375.542V393.917L595 337.625V319.25Z" fill="#D64545"/>
                            <path d="M595 337.625L683 393.917V412.292L595 356V337.625Z" fill="white"/>
                        </g>
                    </g>
                <path d="M617 209H607.571V356H617V209Z" fill="white" fill-opacity="0.35"/>
                </g>
                <path d="M613.857 210.621H664.143C673.689 210.621 681.428 218.606 681.428 228.456V336.544C681.428 346.394 673.689 354.379 664.143 354.379H613.857C604.31 354.379 596.571 346.394 596.571 336.544V228.456C596.571 218.606 604.31 210.621 613.857 210.621Z" stroke-width="3" stroke="#17186B"/>
                <path d="M722 330V302.4L785.2 212H823.4V300.4H839.8V330H823.4V356H789.2V330H722ZM791.6 249.6L758 300.4H791.6V249.6Z" fill="#17186B"/>
                <rect x="628.5" y="259.5" width="22" height="52" rx="6.5" fill="white" stroke-width="3" stroke="#17186B"/>
            </svg>

            <h1 class="notfound-title" id="notfoundTitle">Halaman Tidak Ditemukan</h1>
            <p class="notfound-text">
                Sepertinya halaman ini sudah dicukur habis.<br>
                Alamat yang kamu tuju tidak tersedia atau sudah dipindahkan.
            </p>

            <div class="notfound-actions">
                <button type="button" class="notfound-btn notfound-btn-primary" id="btnNotfoundReload">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Muat Ulang
                </button>

                <!-- [Card X.Y] Tanpa JS: menuju index (otomatis diarahkan sesuai login/role) -->
                <a href="/KELOMPOK-5/index.php" class="notfound-btn notfound-btn-outline" id="btnNotfoundBack">Kembali</a>
            </div>
        </section>
    </main>

    <script src="/KELOMPOK-5/assets/js/404.js?v=2"></script>
</body>
</html>
