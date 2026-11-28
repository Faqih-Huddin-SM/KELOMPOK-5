<?php /* Halaman publik Kataji (kartu 6.4). Tanpa login: JANGAN include auth_check.php. */ ?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kataji Barbershop</title>
<link rel="icon" href="../assets/img/logo-kataji.png">
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="publik.css?v=<?= filemtime(__DIR__ . '/publik.css') ?>">
</head>
<body class="memuat">
<noscript><style>.loader{display:none}.memuat{overflow:auto}</style></noscript>

<!-- LOADING: gunting memotong lingkaran putus-putus, hilang otomatis setelah data selesai dimuat -->
<div class="loader" id="loader" role="status" aria-label="Memuat halaman">
  <div class="roda">
    <svg class="lingkar" viewBox="0 0 120 120" aria-hidden="true">
      <defs><mask id="mLingkar"><circle class="rv" cx="60" cy="60" r="50" pathLength="100" fill="none" stroke="#fff" stroke-width="10" transform="rotate(-90 60 60)"/></mask></defs>
      <circle class="garis-l" cx="60" cy="60" r="50" mask="url(#mLingkar)"/>
    </svg>
    <img src="../assets/img/logo-kataji.png" alt="" class="logo-l">
    <div class="orbit"><svg class="gl" viewBox="0 0 50 24"><g class="b1"><circle cx="8" cy="6" r="4.6"/><path d="M12 8L48 12 21 14.5Z"/></g><g class="b2"><circle cx="8" cy="18" r="4.6"/><path d="M12 16L48 12 21 9.5Z"/></g></svg></div>
  </div>
  <p>Memuat…</p>
</div>

<header class="hdr">
  <img src="../assets/img/logo-kataji.png" alt="Logo Kataji" class="logo">
  <strong class="brand">Kataji Barbershop</strong>
  <!-- SLOT HEADER (kartu 6.6): isi di sini, kosong = tidak makan ruang -->
  <div class="slot" id="slotHeader"></div>
  <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
  <nav class="menu" id="menu">
    <a href="#beranda" class="on">Beranda</a>
    <a href="#tentang">Tentang</a>
    <a href="#barber">Barber Kami</a>
    <a href="#layanan">Layanan &amp; Harga</a>
    <a href="#lokasi">Lokasi &amp; Kontak</a>
  </nav>
</header>

<main>
<!-- HERO CAROUSEL: daftar foto ada di publik.js (HERO_SLIDES) -->
<section class="hero" id="beranda">
  <div class="slides" id="slides"></div>
  <button class="pan kiri" id="heroPrev" aria-label="Sebelumnya">&#8249;</button>
  <button class="pan kanan" id="heroNext" aria-label="Berikutnya">&#8250;</button>
  <div class="hero-teks">
    <small>KATAJI BARBERSHOP</small>
    <h1>Kenali barber kami,<br><em>cek harga sebelum datang.</em></h1>
    <p>Rapi, nyaman, tepercaya.</p>
  </div>
  <div class="dots" id="heroDots"></div>
  <svg class="sky" viewBox="0 374 390 20" preserveAspectRatio="none"><path fill="#0C0D2E" fill-opacity=".9" d="M0 394V383L42.7 383.3L75.3 377.7L109.2 385.8L133.3 375.8L169.1 374.8L213.1 387.1L232.8 374.3L249.6 382.1L265.5 383.3L305.8 384.4L335.8 387.2L359.1 394L390 388.2V394H0Z"/></svg>
</section>
<!-- tiang barber (pattern asli dari Figma) -->
<svg class="tiang" width="100%" height="28" aria-hidden="true"><defs>
<linearGradient id="gTiang" gradientUnits="userSpaceOnUse" x1="32" y1="0" x2="32" y2="48"><stop stop-color="#17186B"/><stop offset="1" stop-color="#3B3DA8"/></linearGradient>
<pattern id="pTiang" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="16" height="48" fill="#D64545"/><rect x="32" width="16" height="48" fill="url(#gTiang)"/></pattern>
<linearGradient id="gBayang" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0C0D2E" stop-opacity=".65"/><stop offset=".7" stop-color="#0C0D2E" stop-opacity=".05"/><stop offset="1" stop-color="#0C0D2E" stop-opacity="0"/></linearGradient></defs>
<rect width="100%" height="100%" fill="#fff"/><rect width="100%" height="100%" fill="url(#pTiang)"/><rect width="100%" height="100%" fill="url(#gBayang)"/></svg>

<!-- TENTANG: tampilan saja, isi dikerjakan kartu 6.6 -->
<section class="blok gelap tex" id="tentang">
  <div class="wrap">
    <small class="kicker">TENTANG KAMI</small>
    <h2>Tentang Kataji</h2>
    <p class="isi">Kataji Barbershop hadir untuk memberi potongan rapi dengan pelayanan yang ramah. Barber kami berpengalaman dari gaya klasik hingga modern, dan kami selalu menjaga kebersihan alat serta kenyamanan Anda selama di kursi cukur.</p>
  </div>
</section>

<!-- tepi sobek: Tentang -> Barber -->
<svg class="sobek" viewBox="0 701 390 43" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="gA" gradientUnits="userSpaceOnUse" x1="0" y1="706.5" x2="0" y2="742.3"><stop stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#B9BCFF" stop-opacity=".45"/></linearGradient><path id="pA" d="M0 708.8L42.9 716.7L80 720.9L123.1 713.1L151.4 717.3L203.9 717.5L256.9 706.5L303 723.4L329.4 714.5L370.2 710.9L390 722.5V732.5L370.2 728.3L329.4 726.9L303 741.2L256.9 735.8L203.9 727.5L151.4 732.7L123.1 735.1L80 730.9L42.9 742.3L0 731.3V708.8Z"/></defs>
<path fill="#0C0D2E" fill-opacity=".5" d="M0 703.8L42.9 711.7L80 715.9L123.1 708.1L151.4 712.3L203.9 712.5L256.9 701.5L303 718.4L329.4 709.5L370.2 705.9L390 717.5V727.5L370.2 723.3L329.4 721.9L303 736.2L256.9 730.8L203.9 722.5L151.4 727.7L123.1 730.1L80 725.9L42.9 737.3L0 726.3V703.8Z"/>
<use href="#pA" fill="#F3F4FA"/><use href="#pA" fill="url(#gA)"/>
<path fill="#17186B" d="M0 1257.2V731.3L42.9 742.3L80 730.9L123.1 735.1L151.4 732.7L203.9 727.5L256.9 735.8L303 741.2L329.4 726.9L370.2 728.3L390 732.5V1257.2H0Z"/></svg>

<!-- BARBER: carousel 3D, data dari GET api/barber/publik.php -->
<section class="blok biru tex" id="barber">
  <div class="wrap">
    <small class="kicker">TIM KAMI</small>
    <h2>Barber Kami</h2>
  </div>
  <div class="panggung" id="panggung" tabindex="0" aria-label="Daftar barber"></div>
  <p class="petunjuk" id="petunjuk" hidden>Geser ke samping untuk melihat barber lain</p>
</section>

<!-- LAYANAN: biru atas &amp; bawah menyatu, digunting, lalu terbuka. Data: GET api/layanan/publik.php -->
<section class="layanan" id="layanan">
  <div class="seam" aria-hidden="true">
    <svg class="garis" viewBox="0 1232 390 22" preserveAspectRatio="none"><polyline id="garis" points=""/></svg>
    <svg class="gunting" viewBox="0 0 50 24"><g class="b1"><circle cx="8" cy="6" r="4.6"/><path d="M12 8L48 12 21 14.5Z"/></g><g class="b2"><circle cx="8" cy="18" r="4.6"/><path d="M12 16L48 12 21 9.5Z"/></g></svg>
  </div>
  <div class="gap" id="gap">
    <svg class="tepi atas" viewBox="0 1232 390 22" preserveAspectRatio="none" aria-hidden="true"><path fill="#0C0D2E" fill-opacity=".45" d="M0 1699.8V1242.9L40.9 1241.4L93.1 1248.3L151.6 1239.5L183.2 1232.7L233.8 1243.6L282 1245.5L328.4 1244.1L352.8 1242.2L373.9 1244.1L390 1233.1V1699.8H0Z"/><path fill="#fff" d="M0 1699.8V1243.9L40.9 1242.4L93.1 1249.3L151.6 1240.5L183.2 1233.7L233.8 1244.6L282 1246.5L328.4 1245.1L352.8 1243.2L373.9 1245.1L390 1234.1V1699.8H0Z"/><path fill="#F3F4FA" d="M0 1699.8V1247.9L40.9 1246.4L93.1 1253.3L151.6 1244.5L183.2 1237.7L233.8 1248.6L282 1250.5L328.4 1249.1L352.8 1247.2L373.9 1249.1L390 1238.1V1699.8H0Z"/></svg>
    <div class="kertas">
      <div class="kepala"><small class="kicker k2">HARGA</small><h2>Layanan &amp; Harga</h2></div>
      <ul class="daftar" id="daftarLayanan"></ul>
    </div>
    <svg class="tepi bawah" viewBox="0 1675 390 45" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="gC" gradientUnits="userSpaceOnUse" x1="0" y1="1680.8" x2="0" y2="1719.4"><stop stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#B9BCFF" stop-opacity=".45"/></linearGradient><path id="pC" d="M0 1693.4L48.5 1687.8L102.1 1691.9L129.4 1689.3L189.3 1693.7L217.1 1685.1L263.9 1680.8L287.6 1691L337.9 1685.6L364 1689.8L390 1696.8V1714.3L364 1704.4L337.9 1716.7L287.6 1719.4L263.9 1715.9L217.1 1715.4L189.3 1712.7L129.4 1700.9L102.1 1701.9L48.5 1717.4L0 1705.4V1693.4Z"/></defs>
    <path fill="#0C0D2E" fill-opacity=".5" d="M0 1688.4L48.5 1682.8L102.1 1686.9L129.4 1684.3L189.3 1688.7L217.1 1680.1L263.9 1675.8L287.6 1686L337.9 1680.6L364 1684.8L390 1691.8V1709.3L364 1699.4L337.9 1711.7L287.6 1714.4L263.9 1710.9L217.1 1710.4L189.3 1707.7L129.4 1695.9L102.1 1696.9L48.5 1712.4L0 1700.4V1688.4Z"/>
    <use href="#pC" fill="#F3F4FA"/><use href="#pC" fill="url(#gC)"/>
    <path fill="#17186B" d="M0 2536.4V1705.4L48.5 1717.4L102.1 1701.9L129.4 1700.9L189.3 1712.7L217.1 1715.4L263.9 1715.9L287.6 1719.4L337.9 1716.7L364 1704.4L390 1714.3V2536.4H0Z"/></svg>
  </div>
</section>

<!-- SLOT DI BAWAH LAYANAN (kartu 6.6): blok info usaha. Isi di bawah hanyalah tampilan desain. -->
<div class="slot" id="slotInfoUsaha">
  <section class="blok biru tex" id="lokasi">
    <div class="wrap">
      <small class="kicker">KUNJUNGI KAMI</small>
      <h2>Lokasi &amp; Kontak</h2>
      <div class="peta">Peta Google Maps</div>
      <p class="info"><b>Alamat</b>Jl. Contoh Raya No. 12, Kel. Contoh, Kec. Contoh, Kota Contoh</p>
      <p class="info"><b>Jam Buka</b>Senin sampai Minggu, 10.00 sampai 21.00</p>
      <a class="pil" href="#">08123456789</a><a class="pil" href="#">@kataji_barber</a>
      <a class="maps" href="#">Buka di Maps</a>
    </div>
  </section>
</div>
</main>

<footer class="foot">
  <div class="wrap">
    <div class="fbrand"><img src="../assets/img/logo-kataji.png" alt="" class="logo"><strong class="brand">Kataji Barbershop</strong></div>
    <p class="tag">Rapi, nyaman, tepercaya.</p>
    <small>&copy; 2026 Kataji Barbershop</small>
  </div>
</footer>

<script src="publik.js?v=<?= filemtime(__DIR__ . '/publik.js') ?>"></script>
</body>
</html>
