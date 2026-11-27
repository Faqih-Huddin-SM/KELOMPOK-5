<?php
require_once __DIR__ . '/../../../includes/auth_check.php';
require_role(['owner']);
include __DIR__ . '/../../../includes/header.php';
?>

<link rel="stylesheet" href="/KELOMPOK-5/pages/publik/konten_web/konten_web.css?v=2">

<div class="konten-web-page">

    <!-- Notifikasi Toast -->
    <div id="kontenWebNotifikasi" class="transaction-success" role="status" aria-live="polite"></div>

    <!-- Header Halaman -->
    <header class="kw-header">
        <h1 class="kw-title">Konten Web</h1>
        <p class="kw-subtitle">Atur info usaha yang tampil di halaman publik Kataji</p>
    </header>

    <form id="formKontenWeb" class="kw-form" novalidate>

        <!-- Baris Atas: Info Dasar (kiri) + Media Sosial (kanan) -->
        <div class="kw-top-grid">

            <!-- CARD 1: INFO DASAR -->
            <section class="kw-card kw-card--info" aria-labelledby="kwJudulInfoDasar">
                <div class="kw-card-head">
                    <h2 id="kwJudulInfoDasar" class="kw-card-title">Info Dasar</h2>
                    <p class="kw-card-desc">Kolom bertanda * wajib diisi</p>
                </div>

                <!-- Alamat -->
                <div class="kw-field" data-field="alamat">
                    <label for="kwAlamat" class="kw-label">
                        Alamat <span class="kw-required" aria-hidden="true">*</span>
                    </label>
                    <textarea
                        id="kwAlamat"
                        name="alamat"
                        class="kw-textarea kw-textarea--alamat"
                        placeholder="Tulis alamat lengkap"
                        rows="2"
                        required
                    ></textarea>
                    <p id="errAlamat" class="kw-error" role="alert" hidden></p>
                </div>

                <!-- Tautan Peta (Google Maps) -->
                <div class="kw-field" data-field="tautan_peta">
                    <label for="kwPeta" class="kw-label">
                        Tautan Peta (Google Maps) <span class="kw-required" aria-hidden="true">*</span>
                    </label>
                    <input
                        type="url"
                        id="kwPeta"
                        name="tautan_peta"
                        class="kw-input"
                        placeholder="https://maps.app.goo.gl/..."
                        autocomplete="off"
                        required
                    >
                    <p id="hintPeta" class="kw-hint">Tempel tautan dari Google Maps</p>
                    <p id="errPeta" class="kw-error" role="alert" hidden></p>
                </div>

                <!-- Jam Buka -->
                <div class="kw-field" data-field="jam_buka">
                    <span class="kw-label">Jam Buka</span>
                    <div class="kw-jam-row">
                        <div class="kw-select-wrap">
                            <select id="kwHariMulai" name="hari_mulai" class="kw-select" aria-label="Hari buka mulai">
                                <option value="">Pilih hari</option>
                                <option value="Senin">Senin</option>
                                <option value="Selasa">Selasa</option>
                                <option value="Rabu">Rabu</option>
                                <option value="Kamis">Kamis</option>
                                <option value="Jumat">Jumat</option>
                                <option value="Sabtu">Sabtu</option>
                                <option value="Minggu">Minggu</option>
                            </select>
                        </div>
                        <span class="kw-sep">sampai</span>
                        <div class="kw-select-wrap">
                            <select id="kwHariSelesai" name="hari_selesai" class="kw-select" aria-label="Hari buka selesai">
                                <option value="">Pilih hari</option>
                                <option value="Senin">Senin</option>
                                <option value="Selasa">Selasa</option>
                                <option value="Rabu">Rabu</option>
                                <option value="Kamis">Kamis</option>
                                <option value="Jumat">Jumat</option>
                                <option value="Sabtu">Sabtu</option>
                                <option value="Minggu">Minggu</option>
                            </select>
                        </div>
                        <input
                            type="text"
                            id="kwJamBuka"
                            name="jam_buka"
                            class="kw-input kw-input--time"
                            placeholder="00.00"
                            maxlength="5"
                            inputmode="numeric"
                            aria-label="Jam buka"
                        >
                        <span class="kw-sep">sampai</span>
                        <input
                            type="text"
                            id="kwJamTutup"
                            name="jam_tutup"
                            class="kw-input kw-input--time"
                            placeholder="00.00"
                            maxlength="5"
                            inputmode="numeric"
                            aria-label="Jam tutup"
                        >
                    </div>
                    <p id="hintJam" class="kw-hint">Satu rentang untuk semua hari buka</p>
                    <p id="errJam" class="kw-error" role="alert" hidden></p>
                </div>

                <!-- Nomor WhatsApp -->
                <div class="kw-field" data-field="whatsapp">
                    <label for="kwWhatsapp" class="kw-label">
                        Nomor WhatsApp <span class="kw-required" aria-hidden="true">*</span>
                    </label>
                    <input
                        type="tel"
                        id="kwWhatsapp"
                        name="whatsapp"
                        class="kw-input"
                        placeholder="08xxxxxxxxxx"
                        autocomplete="off"
                        required
                    >
                    <p id="hintWhatsapp" class="kw-hint">Contoh: 08123456789 atau +628123456789</p>
                    <p id="errWhatsapp" class="kw-error" role="alert" hidden></p>
                </div>
            </section>

            <!-- CARD 2: MEDIA SOSIAL -->
            <section class="kw-card kw-card--sosmed" aria-labelledby="kwJudulMediaSosial">
                <div class="kw-card-head">
                    <h2 id="kwJudulMediaSosial" class="kw-card-title">Media Sosial</h2>
                    <p class="kw-card-desc">Isi username saja, bukan URL. Awalan @ boleh diketik.</p>
                </div>

                <!-- Instagram -->
                <div class="kw-field kw-field--sosmed" data-field="instagram">
                    <label for="kwInstagram" class="kw-label">
                        Instagram <span class="kw-optional">(opsional)</span>
                    </label>
                    <div class="kw-prefix-wrap">
                        <span class="kw-prefix" aria-hidden="true">@</span>
                        <input
                            type="text"
                            id="kwInstagram"
                            name="instagram"
                            class="kw-input kw-input--prefixed"
                            placeholder="username"
                            autocomplete="off"
                        >
                    </div>
                    <p id="errInstagram" class="kw-error" role="alert" hidden></p>
                </div>

                <!-- TikTok -->
                <div class="kw-field kw-field--sosmed" data-field="tiktok">
                    <label for="kwTiktok" class="kw-label">
                        TikTok <span class="kw-optional">(opsional)</span>
                    </label>
                    <div class="kw-prefix-wrap">
                        <span class="kw-prefix" aria-hidden="true">@</span>
                        <input
                            type="text"
                            id="kwTiktok"
                            name="tiktok"
                            class="kw-input kw-input--prefixed"
                            placeholder="username"
                            autocomplete="off"
                        >
                    </div>
                    <p id="errTiktok" class="kw-error" role="alert" hidden></p>
                </div>

                <!-- Facebook -->
                <div class="kw-field kw-field--sosmed" data-field="facebook">
                    <label for="kwFacebook" class="kw-label">
                        Facebook <span class="kw-optional">(opsional)</span>
                    </label>
                    <div class="kw-prefix-wrap">
                        <span class="kw-prefix" aria-hidden="true">@</span>
                        <input
                            type="text"
                            id="kwFacebook"
                            name="facebook"
                            class="kw-input kw-input--prefixed"
                            placeholder="username"
                            autocomplete="off"
                        >
                    </div>
                    <p id="errFacebook" class="kw-error" role="alert" hidden></p>
                </div>
            </section>

        </div>

        <!-- Baris Bawah: Tentang Usaha -->
        <section class="kw-card kw-card--tentang" aria-labelledby="kwJudulTentang">
            <div class="kw-card-head">
                <h2 id="kwJudulTentang" class="kw-card-title">Tentang Usaha</h2>
                <p class="kw-card-desc">Tampil di halaman publik. Menu &quot;Tentang&quot; muncul bila teks Tentang diisi.</p>
            </div>

            <!-- Tagline -->
            <div class="kw-field" data-field="tagline">
                <label for="kwTagline" class="kw-label">
                    Tagline <span class="kw-optional">(opsional)</span>
                </label>
                <input
                    type="text"
                    id="kwTagline"
                    name="tagline"
                    class="kw-input"
                    maxlength="100"
                    placeholder="Contoh: Rapi, nyaman, tepercaya."
                    autocomplete="off"
                >
                <div class="kw-field-meta">
                    <p id="errTagline" class="kw-error" role="alert" hidden></p>
                    <span id="countTagline" class="kw-counter">0/100</span>
                </div>
            </div>

            <!-- Tentang -->
            <div class="kw-field" data-field="tentang">
                <label for="kwTentang" class="kw-label">
                    Tentang <span class="kw-optional">(opsional)</span>
                </label>
                <textarea
                    id="kwTentang"
                    name="tentang"
                    class="kw-textarea kw-textarea--tentang"
                    maxlength="500"
                    rows="4"
                    placeholder="Ceritakan singkat tentang Kataji Barbershop..."
                ></textarea>
                <div class="kw-field-meta">
                    <p id="errTentang" class="kw-error" role="alert" hidden></p>
                    <span id="countTentang" class="kw-counter">0/500</span>
                </div>
            </div>
        </section>

        <!-- Tombol Simpan -->
        <div class="kw-actions">
            <button type="submit" id="btnSimpanKontenWeb" class="kw-btn-simpan">
                Simpan
            </button>
        </div>

    </form>

</div>

<script src="/KELOMPOK-5/pages/publik/konten_web/konten_web.js?v=2"></script>

<?php include __DIR__ . '/../../../includes/footer.php'; ?>
