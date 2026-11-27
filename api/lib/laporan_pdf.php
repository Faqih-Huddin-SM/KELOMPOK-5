<?php
// ==============================================================================
// [Card 6.7] Template Laporan Keuangan PDF Sesuai Format Resmi KATAJI BARBER
// MoSCoW: Should | Story Point: 5 | WBS: 6.7 | Sprint 4
// Sesuai Desain Template Laporan Bulanan (A. Pemasukan, B. Layanan Terlaris,
// C. Pengeluaran, D. Saldo Bersih, Tanda Tangan Pemilik & Kop Logo Resmi)
// ==============================================================================

require_once __DIR__ . '/fpdf/fpdf.php';

class LaporanBulananPdf extends FPDF
{
    private const NAMA_BULAN = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    /** Jumlah layanan yang ditampilkan pada bagian "Layanan Terlaris". */
    private const TOP_LAYANAN = 3;

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

    private function t(string $teks): string
    {
        return mb_convert_encoding($teks, 'Windows-1252', 'UTF-8');
    }

    public function Footer(): void
    {
        // Garis batas footer
        $this->SetY(-15);
        $this->SetDrawColor(30, 30, 30);
        $this->SetLineWidth(0.2);
        $this->Line(15, $this->GetY(), 195, $this->GetY());

        // Teks footer
        $this->SetY(-12);
        $this->SetFont('Helvetica', '', 8);
        $this->SetTextColor(20, 20, 20);
        $this->Cell(130, 5, $this->t('Laporan dibuat otomatis oleh Kataji Barber Management & Information System'), 0, 0, 'L');
        $this->Cell(50, 5, $this->t('Halaman ' . $this->PageNo() . ' dari {nb}'), 0, 0, 'R');
    }

    public static function buat(array $identitas, DateTimeImmutable $awal, DateTimeImmutable $akhir, DateTimeImmutable $dibuat, array $data): string
    {
        $pdf = new self('P', 'mm', 'A4');
        $pdf->SetTitle($pdf->t('Laporan Keuangan ' . self::NAMA_BULAN[(int) $awal->format('n')] . ' ' . $awal->format('Y')), false);
        $pdf->SetAuthor($pdf->t($identitas['nama']), false);
        $pdf->AliasNbPages('{nb}');
        $pdf->SetMargins(15, 12, 15);
        $pdf->SetAutoPageBreak(true, 18);
        $pdf->AddPage();

        // ------------------------------------------------------------------
        // 1. KOP SURAT DENGAN LOGO RESMI KATAJI BARBER
        // ------------------------------------------------------------------
        $logoPath = __DIR__ . '/../../assets/img/logo-kataji-hitamputih.png';
        if (file_exists($logoPath)) {
            try {
                $pdf->Image($logoPath, 9, 3, 22);
            } catch (Throwable $e) {
                // Logo gagal dimuat: laporan tetap dibuat tanpa logo.
            }
        }

        $pdf->SetY(9);
        $pdf->SetTextColor(20, 20, 20);
        $pdf->SetFont('Helvetica', 'B', 13);
        $pdf->Cell(0, 6, $pdf->t(mb_strtoupper($identitas['nama'], 'UTF-8')), 0, 1, 'C');

        $pdf->SetFont('Helvetica', '', 8.5);
        $pdf->SetTextColor(50, 50, 50);
        $pdf->Cell(0, 5, $pdf->t($identitas['alamat']), 0, 1, 'C');

        // Garis Pembatas Kop Surat (Garis Ganda: Tebal dan Tipis)
        $pdf->SetDrawColor(30, 30, 30);
        $pdf->SetLineWidth(0.8);
        $pdf->Line(15, 23, 195, 23);
        $pdf->SetLineWidth(0.3);
        $pdf->Line(15, 24.2, 195, 24.2);

        // ------------------------------------------------------------------
        // 2. JUDUL DOKUMEN & INFORMASI PERIODE
        // ------------------------------------------------------------------
        $pdf->SetY(28);
        $pdf->SetTextColor(20, 20, 20);
        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->Cell(0, 5.5, $pdf->t('LAPORAN KEUANGAN'), 0, 1, 'C');

        $pdf->SetFont('Helvetica', '', 9.5);
        $pdf->SetTextColor(60, 60, 60);
        $pdf->Cell(0, 5, $pdf->t('Pemasukan dan Pengeluaran'), 0, 1, 'C');
        $pdf->Ln(4);

        // Metadata Periode
        $namaBulanTahun = self::NAMA_BULAN[(int) $awal->format('n')] . ' ' . $awal->format('Y');
        $rentangTeks = self::tanggalIndonesia($awal) . ' pukul 00.00 s.d. ' . self::tanggalIndonesia($akhir) . ' pukul 23.59 WIB';
        $dibuatTeks = self::tanggalIndonesia($dibuat) . ', pukul ' . $dibuat->format('H.i') . ' WIB';

        $pdf->SetFont('Helvetica', '', 8.5);
        $pdf->SetTextColor(20, 20, 20);

        $pdf->Cell(34, 4.5, $pdf->t('Periode Laporan'), 0, 0, 'L');
        $pdf->Cell(0, 4.5, $pdf->t(':  ' . $namaBulanTahun), 0, 1, 'L');

        $pdf->Cell(34, 4.5, $pdf->t('Rentang Waktu'), 0, 0, 'L');
        $pdf->Cell(0, 4.5, $pdf->t(':  ' . $rentangTeks), 0, 1, 'L');

        $pdf->Cell(34, 4.5, $pdf->t('Tanggal Pembuatan'), 0, 0, 'L');
        $pdf->Cell(0, 4.5, $pdf->t(':  ' . $dibuatTeks), 0, 1, 'L');
        $pdf->Ln(4);

        // ------------------------------------------------------------------
        // 3. BAGIAN A: PEMASUKAN
        // ------------------------------------------------------------------
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->Cell(0, 5.5, $pdf->t('A. PEMASUKAN'), 0, 1, 'L');

        $pdf->SetDrawColor(30, 30, 30);
        $pdf->SetLineWidth(0.3);
        $pdf->SetFont('Helvetica', 'B', 8.5);
        $pdf->Cell(12, 6, $pdf->t('No'), 1, 0, 'C');
        $pdf->Cell(78, 6, $pdf->t('Nama Barber'), 1, 0, 'L');
        $pdf->Cell(45, 6, $pdf->t('Jumlah Transaksi'), 1, 0, 'R');
        $pdf->Cell(45, 6, $pdf->t('Total Pemasukan'), 1, 1, 'R');

        $pdf->SetFont('Helvetica', '', 8.5);
        $barbers = $data['rincian_per_barber'] ?? [];
        if (count($barbers) === 0) {
            $pdf->Cell(180, 6, $pdf->t('Tidak ada pemasukan pada periode ini'), 1, 1, 'L');
        } else {
            $no = 1;
            foreach ($barbers as $b) {
                $pdf->Cell(12, 6, (string) $no++, 1, 0, 'C');
                $pdf->Cell(78, 6, $pdf->t($b['nama_barber']), 1, 0, 'L');
                $pdf->Cell(45, 6, (string) $b['jumlah_transaksi'], 1, 0, 'R');
                $pdf->Cell(45, 6, self::rupiah($b['total_pemasukan']), 1, 1, 'R');
            }
        }

        // Total Pemasukan Row
        $pdf->SetFont('Helvetica', 'B', 8.5);
        $pdf->Cell(90, 6, $pdf->t('Total Pemasukan'), 1, 0, 'L');
        $pdf->Cell(45, 6, (string) $data['jumlah_transaksi'], 1, 0, 'R');
        $pdf->Cell(45, 6, self::rupiah($data['total_pemasukan']), 1, 1, 'R');
        $pdf->Ln(3.5);

        // ------------------------------------------------------------------
        // 4. BAGIAN B: LAYANAN TERLARIS (3 teratas)
        // ------------------------------------------------------------------
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->Cell(0, 5.5, $pdf->t('B. LAYANAN TERLARIS'), 0, 1, 'L');

        $pdf->SetFont('Helvetica', 'B', 8.5);
        $pdf->Cell(12, 6, $pdf->t('No'), 1, 0, 'C');
        $pdf->Cell(113, 6, $pdf->t('Layanan'), 1, 0, 'L');
        $pdf->Cell(55, 6, $pdf->t('Jumlah Transaksi'), 1, 1, 'R');

        $pdf->SetFont('Helvetica', '', 8.5);
        $layanan = $data['layanan'] ?? [];
        if (count($layanan) === 0) {
            $pdf->Cell(180, 6, $pdf->t('Tidak ada layanan terjual pada periode ini'), 1, 1, 'L');
        } else {
            $no = 1;
            foreach (array_slice($layanan, 0, self::TOP_LAYANAN) as $l) {
                $pdf->Cell(12, 6, (string) $no++, 1, 0, 'C');
                $pdf->Cell(113, 6, $pdf->t($l['nama_layanan']), 1, 0, 'L');
                $pdf->Cell(55, 6, (string) $l['jumlah_transaksi'], 1, 1, 'R');
            }
        }
        $pdf->Ln(3.5);

        // ------------------------------------------------------------------
        // 5. BAGIAN C: PENGELUARAN
        // ------------------------------------------------------------------
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->Cell(0, 5.5, $pdf->t('C. PENGELUARAN'), 0, 1, 'L');

        $pdf->SetFont('Helvetica', 'B', 8.5);
        $pdf->Cell(12, 6, $pdf->t('No'), 1, 0, 'C');
        $pdf->Cell(113, 6, $pdf->t('Kategori'), 1, 0, 'L');
        $pdf->Cell(55, 6, $pdf->t('Total'), 1, 1, 'R');

        $pdf->SetFont('Helvetica', '', 8.5);
        $kategoriList = $data['rincian_per_kategori'] ?? [];
        if (count($kategoriList) === 0) {
            $pdf->Cell(180, 6, $pdf->t('Tidak ada pengeluaran pada periode ini'), 1, 1, 'L');
        } else {
            $no = 1;
            foreach ($kategoriList as $k) {
                $pdf->Cell(12, 6, (string) $no++, 1, 0, 'C');
                $pdf->Cell(113, 6, $pdf->t($k['kategori']), 1, 0, 'L');
                $pdf->Cell(55, 6, self::rupiah($k['total_pengeluaran']), 1, 1, 'R');
            }
        }

        // Total Pengeluaran Row
        $pdf->SetFont('Helvetica', 'B', 8.5);
        $pdf->Cell(125, 6, $pdf->t('Total Pengeluaran'), 1, 0, 'L');
        $pdf->Cell(55, 6, self::rupiah($data['total_pengeluaran']), 1, 1, 'R');
        $pdf->Ln(3.5);

        // ------------------------------------------------------------------
        // 6. BAGIAN D: SALDO BERSIH
        // ------------------------------------------------------------------
        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->Cell(0, 5.5, $pdf->t('D. SALDO BERSIH'), 0, 1, 'L');

        $pdf->SetFont('Helvetica', '', 8.5);
        $pdf->Cell(125, 6, $pdf->t('Total Pemasukan'), 1, 0, 'L');
        $pdf->Cell(55, 6, self::rupiah($data['total_pemasukan']), 1, 1, 'R');

        $pdf->Cell(125, 6, $pdf->t('Dikurangi Total Pengeluaran'), 1, 0, 'L');
        $pdf->Cell(55, 6, self::rupiah($data['total_pengeluaran']), 1, 1, 'R');

        $pdf->SetFont('Helvetica', 'B', 9);
        $pdf->Cell(125, 6, $pdf->t('Saldo Bersih'), 1, 0, 'L');
        $pdf->Cell(55, 6, self::rupiah($data['saldo_bersih']), 1, 1, 'R');

        $pdf->Ln(2);
        $pdf->SetFont('Helvetica', '', 7.5);
        $pdf->SetTextColor(80, 80, 80);
        $pdf->Cell(0, 4, $pdf->t('Catatan: HPP layanan tidak dihitung dalam laporan ini.'), 0, 1, 'L');

        // ------------------------------------------------------------------
        // 7. TANDA TANGAN PEMILIK
        // ------------------------------------------------------------------
        $pdf->Ln(6);

        // Pindah halaman bila sisa ruang tidak cukup untuk blok tanda tangan.
        if ($pdf->GetY() > 245) {
            $pdf->AddPage();
        }

       $pdf->SetTextColor(20, 20, 20);
        $pdf->SetFont('Helvetica', '', 8.5);

        $pdf->Ln(8); // <-- tambahan: menurunkan seluruh blok tanda tangan

        $pdf->SetX(135);
        $pdf->Cell(50, 4, $pdf->t('Mengetahui,'), 0, 1, 'C');
        $pdf->SetX(135);
        $pdf->Cell(50, 4, $pdf->t('Owner'), 0, 1, 'C');

        $pdf->Ln(15);
        $pdf->SetX(135);
        $pdf->Cell(50, 0.3, '', 'T', 1, 'C');
        $pdf->SetX(135);
        $pdf->Cell(50, 4.5, $pdf->t('Owner Kataji'), 0, 1, 'C');

        return $pdf->Output('S');
    }
}