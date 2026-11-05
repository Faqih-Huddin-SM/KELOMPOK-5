<?php

require_once __DIR__ . '/fpdf/fpdf.php';

class LaporanBulananPdf extends FPDF
{
    private const NAMA_BULAN = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    public static function rupiah(int $nominal): string
    {
        $teks = 'Rp' . number_format(abs($nominal), 0, ',', '.');

        return $nominal < 0 ? '-' . $teks : $teks;
    }

    public static function tanggalIndonesia(DateTimeInterface $tanggal): string
    {
        return (int) $tanggal->format('j') . ' '
            . self::NAMA_BULAN[(int) $tanggal->format('n')] . ' '
            . $tanggal->format('Y');
    }

    /**
     * FPDF memakai Windows-1252 (font bawaan); ubah dari UTF-8 agar teks tidak rusak.
     * Karakter di luar Windows-1252 (mis. huruf kanji) diganti tanda tanya.
     */
    private function t(string $teks): string
    {
        return mb_convert_encoding($teks, 'Windows-1252', 'UTF-8');
    }

    public function Footer(): void
    {
        $this->SetY(-14);
        $this->SetFont('Helvetica', 'I', 8);
        $this->SetTextColor(120, 120, 120);
        $this->Cell(0, 6, $this->t('Halaman ' . $this->PageNo() . ' dari {nb}'), 0, 0, 'C');
    }

    /**
     * @param array $identitas ['nama' => string, 'alamat' => string]
     * @param array $data      keluaran dari endpoint (lihat laporan_pdf.php)
     */
    public static function buat(array $identitas, DateTimeImmutable $awal, DateTimeImmutable $akhir, DateTimeImmutable $dibuat, array $data): string
    {
        $pdf = new self('P', 'mm', 'A4');
        $pdf->SetTitle($pdf->t('Laporan Keuangan ' . self::NAMA_BULAN[(int) $awal->format('n')] . ' ' . $awal->format('Y')), false);
        $pdf->SetAuthor($pdf->t($identitas['nama']), false);
        $pdf->AliasNbPages('{nb}');
        $pdf->SetMargins(15, 15, 15);
        $pdf->SetAutoPageBreak(true, 20);
        $pdf->AddPage();

        // Kop: identitas barbershop dari konfigurasi.
        $pdf->SetTextColor(20, 20, 20);
        $pdf->SetFont('Helvetica', 'B', 16);
        $pdf->Cell(0, 8, $pdf->t($identitas['nama']), 0, 1);

        if ($identitas['alamat'] !== '') {
            $pdf->SetFont('Helvetica', '', 9);
            $pdf->SetTextColor(90, 90, 90);
            $pdf->MultiCell(0, 4.5, $pdf->t($identitas['alamat']));
        }

        $pdf->Ln(1);
        $pdf->SetDrawColor(40, 40, 40);
        $pdf->SetLineWidth(0.5);
        $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
        $pdf->Ln(4);

        $pdf->SetTextColor(20, 20, 20);
        $pdf->SetFont('Helvetica', 'B', 13);
        $pdf->Cell(0, 7, $pdf->t('Laporan Pemasukan dan Pengeluaran'), 0, 1);

        $pdf->SetFont('Helvetica', '', 10);
        $pdf->Cell(
            0,
            5.5,
            $pdf->t('Periode: ' . self::NAMA_BULAN[(int) $awal->format('n')] . ' ' . $awal->format('Y')
                . ' (' . self::tanggalIndonesia($awal) . ' - ' . self::tanggalIndonesia($akhir) . ')'),
            0,
            1
        );
        $pdf->SetTextColor(90, 90, 90);
        $pdf->Cell(
            0,
            5.5,
            $pdf->t('Dibuat: ' . self::tanggalIndonesia($dibuat) . ', ' . $dibuat->format('H.i') . ' WIB'),
            0,
            1
        );
        $pdf->Ln(4);

        // Ringkasan.
        $saldo = $data['saldo_bersih'];
        $pdf->ringkasan('Total Pemasukan', self::rupiah($data['total_pemasukan']));
        $pdf->ringkasan('Total Pengeluaran', self::rupiah($data['total_pengeluaran']));
        $pdf->ringkasan('Saldo Bersih', self::rupiah($saldo), true);
        $pdf->SetFont('Helvetica', 'I', 8);
        $pdf->SetTextColor(100, 100, 100);
        $pdf->MultiCell(0, 4, $pdf->t('Saldo bersih = total pemasukan dikurangi total pengeluaran, tanpa memperhitungkan HPP.'));
        $pdf->Ln(4);

        // Pemasukan per barber.
        $pdf->judulBagian('Pemasukan per Barber');
        $baris = [];
        foreach ($data['rincian_per_barber'] as $b) {
            $baris[] = [$b['nama_barber'], (string) $b['jumlah_transaksi'], self::rupiah($b['total_pemasukan'])];
        }
        $pdf->tabel(
            [['Barber', 85, 'L'], ['Transaksi', 35, 'R'], ['Total Pemasukan', 60, 'R']],
            $baris,
            ['Total', (string) $data['jumlah_transaksi'], self::rupiah($data['total_pemasukan'])],
            'Tidak ada pemasukan pada bulan ini.'
        );

        // Layanan terlaris.
        $pdf->judulBagian('Layanan Terlaris');
        $baris = [];
        foreach ($data['layanan'] as $l) {
            $baris[] = [(string) $l['peringkat'], $l['nama_layanan'], (string) $l['jumlah_transaksi'], (string) $l['total_jumlah']];
        }
        $pdf->tabel(
            [['No', 15, 'C'], ['Layanan', 85, 'L'], ['Transaksi', 40, 'R'], ['Jumlah Terjual', 40, 'R']],
            $baris,
            null,
            'Tidak ada layanan terjual pada bulan ini.'
        );

        // Pengeluaran per kategori.
        $pdf->judulBagian('Pengeluaran per Kategori');
        $baris = [];
        foreach ($data['rincian_per_kategori'] as $k) {
            $baris[] = [$k['kategori'], (string) $k['jumlah_catatan'], self::rupiah($k['total_pengeluaran'])];
        }
        $pdf->tabel(
            [['Kategori', 85, 'L'], ['Jumlah Catatan', 35, 'R'], ['Total Pengeluaran', 60, 'R']],
            $baris,
            ['Total', (string) $data['jumlah_catatan_pengeluaran'], self::rupiah($data['total_pengeluaran'])],
            'Tidak ada pengeluaran pada bulan ini.'
        );

        return $pdf->Output('S');
    }

    private function ringkasan(string $label, string $nilai, bool $tebal = false): void
    {
        $this->SetFillColor($tebal ? 230 : 245, $tebal ? 230 : 245, $tebal ? 230 : 245);
        $this->SetTextColor(20, 20, 20);
        $this->SetFont('Helvetica', $tebal ? 'B' : '', 11);
        $this->Cell(90, 8, $this->t($label), 0, 0, 'L', true);
        $this->Cell(90, 8, $this->t($nilai), 0, 1, 'R', true);
        $this->Ln(1);
    }

    private function judulBagian(string $judul): void
    {
        if ($this->GetY() > 235) {
            $this->AddPage();
        }

        $this->SetFont('Helvetica', 'B', 11);
        $this->SetTextColor(20, 20, 20);
        $this->Cell(0, 7, $this->t($judul), 0, 1);
    }

    /**
     * @param array      $kolom [[label, lebar, rata], ...]
     * @param array      $baris tiap baris berisi teks per kolom
     * @param array|null $total baris total (selalu tampil, termasuk Rp0) atau null
     */
    private function tabel(array $kolom, array $baris, ?array $total, string $pesanKosong): void
    {
        $this->SetFillColor(40, 40, 40);
        $this->SetTextColor(255, 255, 255);
        $this->SetDrawColor(200, 200, 200);
        $this->SetLineWidth(0.2);
        $this->SetFont('Helvetica', 'B', 9.5);

        foreach ($kolom as [$label, $lebar, $rata]) {
            $this->Cell($lebar, 7, $this->t($label), 1, 0, $rata === 'L' ? 'L' : 'C', true);
        }
        $this->Ln();

        $this->SetTextColor(20, 20, 20);
        $this->SetFont('Helvetica', '', 9.5);

        if (count($baris) === 0) {
            $this->SetTextColor(110, 110, 110);
            $this->Cell(array_sum(array_column($kolom, 1)), 7, $this->t($pesanKosong), 1, 1, 'C');
            $this->SetTextColor(20, 20, 20);
        }

        foreach ($baris as $isi) {
            foreach ($kolom as $i => [$label, $lebar, $rata]) {
                $this->Cell($lebar, 7, $this->t($this->potong($isi[$i], $lebar)), 1, 0, $rata);
            }
            $this->Ln();
        }

        if ($total !== null) {
            $this->SetFont('Helvetica', 'B', 9.5);
            $this->SetFillColor(240, 240, 240);
            foreach ($kolom as $i => [$label, $lebar, $rata]) {
                $this->Cell($lebar, 7, $this->t($total[$i] ?? ''), 1, 0, $rata, true);
            }
            $this->Ln();
        }

        $this->Ln(6);
    }

    /** Potong teks panjang agar tidak menembus sel (lebar dalam mm). */
    private function potong(string $teks, float $lebar): string
    {
        $maks = $lebar - 4;
        $encoded = $this->t($teks);

        if ($this->GetStringWidth($encoded) <= $maks) {
            return $teks;
        }

        while ($teks !== '' && $this->GetStringWidth($this->t($teks . '...')) > $maks) {
            $teks = mb_substr($teks, 0, -1);
        }

        return $teks . '...';
    }
}