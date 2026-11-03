<?php

declare(strict_types=1);

// ---------------------------------------------------------------
// Halaman dokumentasi Swagger UI.
// Letakkan di: KELOMPOK-5/swagger.php (sefolder dengan openapi.yaml)
// Buka di    : http://localhost/KELOMPOK-5/swagger.php
// ---------------------------------------------------------------

// OPSIONAL: batasi dokumentasi hanya untuk owner yang sudah login.
// Hapus tanda komentar 2 baris di bawah jika ingin mengaktifkannya.
//
// require_once __DIR__ . '/api/middleware/auth.php';
// apiWajibOwner();

$specFile = __DIR__ . '/openapi.yaml';

// Kirim file openapi.yaml lewat PHP bila diminta ?spec=1
// (berguna jika server memblokir akses langsung ke file .yaml).
if (isset($_GET['spec'])) {
    if (!is_file($specFile)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'openapi.yaml tidak ditemukan.';
        exit;
    }

    header('Content-Type: application/yaml; charset=utf-8');
    header('Cache-Control: no-cache');
    readfile($specFile);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dokumentasi API Barbershop</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css">
  <style>
    body { margin: 0; background: #fafafa; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.addEventListener('load', function () {
      window.ui = SwaggerUIBundle({
        // Spesifikasi dibaca lewat swagger.php?spec=1 (file openapi.yaml di folder yang sama)
        url: 'swagger.php?spec=1',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        persistAuthorization: true,
        tryItOutEnabled: true,
        // Kirim cookie sesi PHP saat "Try it out"
        requestInterceptor: function (req) {
          req.credentials = 'include';
          return req;
        },
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout'
      });
    });
  </script>
</body>
</html>