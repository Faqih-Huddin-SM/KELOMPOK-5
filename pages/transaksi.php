<?php

require_once __DIR__ . '/../includes/auth_check.php';

require_login();

?>

<?php include __DIR__ . '/../includes/header.php'; ?>

<div class="kasir-page">

    <!-- HEADER -->
    <div class="kasir-heading">
        <h1>Kasir</h1>
        <p>Pricelist - Klik untuk tambah (hanya layanan aktif)</p>
    </div>

    <div class="kasir-layout">

        <!-- KOLOM KIRI: DAFTAR LAYANAN -->
        <div class="kasir-service-column">

            <section class="kasir-services">

                <button
                    type="button"
                    class="service-card"
                    data-service="Haircut"
                    data-price="50000"
                >
                    <span class="service-icon">
                        <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAADS0lEQVR4nO2YW4hNURjHf+NukNsIoVGjEKLc3qiRB/cHmZJbNPIyHqXcXlAo1yQjXjxMLpOSCREiIeRB5JL75DbGyCDEzNGq/67d6ex91trnnDlH7X+tl73WXt9/rfV93/p/C2LEiBGjEDEKqAE+AL+Bp8BOYAj/ARaIdCJF+wYso8B3/rfI7tGO9wCmAHX63gpUUqCoFcn9Af1r1P8LKMshjzHASuAQcBl4CTQBf4GLQT8VAd+BFqAkZPLjaRYZFROAfcDrAPf12o2gCbppQHMaQ5M17lEWSLcDKoC7aUh77ZRcOhCNGjg2ZEw/jXmXIfly4L4lceMVm+QloTisH05rd1JhnsZcj0i8F3BUySBh0b4Cc20nH6pUaX48CHRJ6u8LPFF/VQTyE4EXlsQTwGNghKuROcoyCUX/eu1Alc/4PaCj47wrfPPatDqgJxExRbdwqolvAgMc5uqg7GJLvBXYEuLC1hiklJXwncZ8oL3DHCXK47bkv8lG1mB2b5vPQDXQyeEycvH3Z8BocoRFwA8ZMjm71CKOvjqQPw/0JscYBzyXwQZgWooxJk+vVd62JV+tk24T9NFuGcN/RNZDd92UtsR/AkvJA0wQb/VdRDW6uR86uQH" 
                            alt="scissors"
                        >
                    </span>
                    <span class="service-info">
                        <strong>Haircut</strong>
                        <small>Rp50.000</small>
                    </span>
                </button>

                <button
                    type="button"
                    class="service-card"
                    data-service="Coloring"
                    data-price="50000"
                >
                    <span class="service-icon">
                        <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAJP0lEQVR4nO1dB6wVRRQ9//33wa8oCCoqIlbsqEhiww8oiAU1sfCtwRJ7IRYEEzU2SsAoYCzRGEVFDYrBElSwAvbY9dsLKiKKBSzAL6y5yX3JOt7Znd03u7Pv7TvJTX7ef7vvztzZO7fOAjXUUEMNNdRQQ9VjHQAXA7gRQF/XzNQA3AnAY/qtJhT3+MInEKJPAXRzzVSeMV0RCNGzAIquGcsrughPCdFU14zlGfsDaBeEcrZrxvKM6wWBtAIY4pqxvIL2jNcFoSwHsK1r5vIKmviVglBaAHR1zVxecZYgEKK5AOpdM5dXPKIRygTXjOUVGwH4USOUk10zl1ccDGCtIJBVAPZxzVxecYvmKVkKoLdr5vIaCf5AI5R3AKznmsE8Yk8AazRCeRRAnWsG84jLNQIhuso1c3lEAcDzGoHQxt/smsE8oheAXzVC+QfAANcM5hHHBKiuJQA2d81gHnF/gFBeBdDZNYN5AwUZvwkQygzXDOYRuoRWiS5zzWAeMSFAIB0AjnDNYB4TWm8ECIXyKru6ZjJv2AHA3wFC+RJAjzKKL7YHMBDAUACHAjiOaRh/Rqb2TrUQzn9xToBAiF4A0KC5to4L8yikPwnAbAAfhQhZRysAfAzgSQATAZwAYLc8JtXqeBKCJut24bo+AH6KMfFR6Q/m71KOy+UCmxhM7vnCdWekIBCVyGSfwjmdqg6MDtcktErUBuAg4bqbHQilRJ8DGAugO6oUt4ZMwK+8UftBOv4Z3z7wC2cl0xTMX5yMo3hdVWFdAJ+EDL5FKClqEDZ+yusfyAV876ckmFX8xPZEFaF/QEKrRE/HsH72BTAnJcH8wXsepR0qCuQH3CB8Ps5g0DfF/M0DQ2JpNukNNp0zjwJvhq3M+PHC/182GPDpgjPY3aAVopuBqW2LKNdzJjKM9VnleErnVW/Bz/g9ZLBrWGcv4oGXPm9nJ4+6uwZrzNNiSCrANj3ARR+ZwmZcbaLzyFWde6KlyXifVZUklLkpCuWlLNU404r/NoThMcJ1My1NxlpuTC0KT+xnKQrlPXaEnWJj7j30DFTQHoK+X2xxQh4RLDSy7FanKJS3eL9z5lu8GYFZ0v2Nyj0GcY7E1oRMF/icmKJAPN5HdUHTRHFHDGZVq6RrQMWKF5MoDO/HHikLxONFkCqOiqnrt1LuMyWByZij/MaWDgRCT31TWsJYP2Z4nCpPVJW3wuIkrOWVWbSweGzQN2mZw9fGZHCycp9mi4P/TZOrJz/lOUcCSaWooydHQOMwN9KwpcGLYdlsreF3lENheLw/dnNVXB1GlAP340ULA74tpACvU0jBRRp0UZICaSmDMSo68OPdMu71J4CTNDwWBMd1uUOBUAQjEZRrPu5uSSAtAHYW+Cvypi71phxq2d+JShK/ZeOCMpk6QLmfGoj0DGimxhPejONJpe9dInznBocCoQoc63iwTKaocMGPyRGuXQ1gtIavJqEzuE1YAKTK5jkSSCJ1zeWmS6cJxQ+m9vwAgR9SS1cE1BL/wLE21UpcUi37yBILlRx+1Btk+J7SVH505eK5sN98QQg47utLoKVF3yUhEH+iKC71U+55seZ7bZzulRJQAyKmasmRVTEmZYFQxaV12Ahj3yVYRu8Ive6DNTycF4OPDlaPfpCgH09RIMSzdSy1wNgaDvb5sbtvkl8EsKnw210Uo4LyKHdHSED9LFhnW6coEFL31mFSnGBCVISg4iJNYBBsw/sd0q986dJGA74ofHE4/o8NUxQILTTruMYigxRjMsHeQuyMwiWqD6J7et9kTx2CCRwnnxOXrkYC6GeRQWra2c7gNzsLsah3hfDIYDYE/N+7NSDO1YPrv6RD2ZKgxBqUTPLnpkQTu4HBb/YRsorSirvCF+eiHhATdGMPPsm8O6nbW" 
                            alt="hair-colouring"
                        >
                    </span>
                    <span class="service-info">
                        <strong>Colouring</strong>
                        <small>Rp150.000</small>
                    </span>
                </button>

                <button
                    type="button"
                    class="service-card"
                    data-service="Perming"
                    data-price="50000"
                >
                    <span class="service-icon">
                        <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB"
                            alt="hair-perming"
                        >
                    </span>
                    <span class="service-info">
                        <strong>Perming</strong>
                        <small>Rp50.000</small>
                    </span>
                </button>

                <button
                    type="button"
                    class="service-card"
                    data-service="Smoothing"
                    data-price="50000"
                >
                    <span class="service-icon">
                        <img
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAIR0lEQVR4nO1caWwWVRQ9FdqCgmUVXFDZF8WgEhEBFRSIGqNGWQIEGwkYgqjEKCABJArqD38QBUREEJcY/WHDLqsgaFARXEAtgguy2mJFW1q0HfPCecnNzZuhX5eZKd+c5Pvzbr/57rx5791zz71TIEGCBAkSJEgDXAtgJYAiACcAvAOgY9RO1RX0BlAKwFOfUwCmA8iK2sE4oyGAnzhhbwFoDeAKAG8AqOD4p1E7GWfM4STtBlBf2RbS9k1EvsUeVwEoA1AOoJeydeQWNhN4S0T+xRoZAD7hBL3isK8XZ+HHALpG4GOsMZaTcxhAjrKNoq0AwB8ioEyKyNfYoRWpipmYocrWDMAx2kYDaC4CivlOAgBvc4JWOWyLaNvIbW5xPYAeIfoYWwzkBBUDaKts/bjSzHbtxLGejgCT1pxvHyfwKWUzZHkPbTPE+EmehQkAPMsJ+hpAprJNo+0HANli/EEAI0P2M5boJjifSd0kOgAo4fa9lWNN+EmAM8FgK1fYAod9HW1LxNhBAPtD9DHWGMMJOuJYVSNoM3yvhRifD+ClkP2MJZoLMjxM2XJIpI0tNyL/Yo9lnKA1DpsVCzYLzrfJhx+mJW5jYDABop2y9WFAMTpgFzH+FYAtIfsZS2QD+J4rbIqy1ad8ZWzPRORf7DGLE/Stg/NNpe1HAA049jyAmRH4GUt04dYs51aVaCc43wCOnQegMKEtZ5BB/c5jkNBYS5sJLhIXA2jp+Pu0Qy4n6CiApso2nLZCMVlDANwTgZ+xRAvB+QxBlmhCIu2RWBvU41Y3XDCMsmlR3EXZpZwgk5ppvErbVqXzDQLQNwTfegqpLJb15lsF5zPigMRNDChlFBUMOgNoX8s+GSXnOCcPVLbNQ9zAQpVRhbYr9ScSZFOG8ihLSWSyLGlszwkeaATVX0I4j4uEICvTSvkxxftIMZOO7HF0EUymbR8FVYunAYyvBV/mkl/qAJbBGkuBKFK"
                            alt="hair-straightener"
                        >
                    </span>
                    <span class="service-info">
                        <strong>Smoothing</strong>
                        <small>Rp50.000</small>
                    </span>
                </button>

                <button
                    type="button"
                    class="service-card"
                    data-service="Creambath"
                    data-price="50000"
                >
                    <span class="service-icon">
                        <img
                            src="data:image/png;base64,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"
                            alt="man-combing-hair"
                        >
                    </span>
                    <span class="service-info">
                        <strong>Creambath</strong>
                        <small>Rp50.000</small>
                    </span>
                </button>

            </section>
        </div>

        <!-- DETAIL TRANSAKSI -->
        <aside class="kasir-order-card">

            <h2>Layanan</h2>

            <!-- NAMA PELANGGAN -->
            <div class="kasir-field">
                <label for="namaPelanggan">Nama Pelanggan</label>
                <input
                    type="text"
                    id="namaPelanggan"
                    placeholder="Ketik disini..."
                    autocomplete="off"
                    aria-describedby="errorNamaKasir"
                >
                <small
                    id="errorNamaKasir"
                    class="kasir-field-error"
                    hidden
                ></small>
            </div>

            <!-- NAMA BARBER -->
            <div class="kasir-field">
                <label for="namaBarber">Nama Barber</label>
                <select id="namaBarber">
                    <option value="">Ketik disini...</option>
                </select>
                <small
                    id="errorBarberKasir"
                    class="kasir-field-error"
                    hidden
                ></small>
            </div>

            <!-- LAYANAN DIPILIH -->
            <div class="kasir-selected-service">
                <div class="selected-service-heading">
                    <span>Service</span>
                </div>

                <!-- Error harus berada di panel kanan -->
                <small
                    id="errorLayananKasir"
                    class="kasir-field-error"
                    hidden
                ></small>

                <div
                    id="selectedServices"
                    class="selected-services-list"
                >
                    <p class="empty-service">
                        Belum ada layanan dipilih
                    </p>
                </div>
            </div>

            <!-- TOTAL -->
            <div class="kasir-total">
                <span>Total</span>
                <strong id="kasirTotal">Rp0</strong>
            </div>

            <!-- METODE PEMBAYARAN -->
            <div class="kasir-field payment-field">
                <label for="metodePembayaran">
                    Metode Pembayaran
                </label>
                <select id="metodePembayaran">
                    <option value="">Pilih....</option>
                    <option value="cash">Tunai</option>
                    <option value="qris">QRIS</option>
                    <option value="transfer">Transfer</option>
                </select>
                <small
                    id="errorMetodePembayaranKasir"
                    class="kasir-field-error"
                    hidden
                ></small>
            </div>

            <!-- BUTTON -->
            <button
                type="button"
                class="kasir-submit"
                id="btnSimpanTransaksi"
            >
                Simpan Transaksi
            </button>

        </aside>

    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
