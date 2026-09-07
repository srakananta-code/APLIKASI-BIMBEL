import {
  Student,
  Teacher,
  Program,
  Meeting,
  StudentCharge,
  StudentPayment,
  TeacherHonor,
  TeacherPayment,
  Expense,
  InstitutionSetting
} from '../types';
import { formatRupiah, formatDateIndonesian } from './businessLogic';

export type Settings = InstitutionSetting;

/**
 * Utilitas untuk mengunduh string HTML sebagai file Microsoft Word (.doc)
 * Menggunakan format MIME application/msword dengan XML namespace standar MS Office Word
 */
export function downloadWordFile(filename: string, htmlBodyContent: string, documentTitle: string = 'Laporan') {
  const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 portrait;
      margin: 2cm 2cm 2cm 2cm;
      mso-header-margin: 1cm;
      mso-footer-margin: 1cm;
      mso-paper-source: 0;
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }
    .kop-surat {
      text-align: center;
      border-bottom: 3px double #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .kop-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1e1b4b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kop-sub {
      font-size: 9.5pt;
      color: #475569;
      margin: 3px 0 0 0;
    }
    .doc-title-box {
      text-align: center;
      margin: 18px 0 16px 0;
    }
    .doc-title {
      font-size: 13pt;
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0;
      text-decoration: underline;
    }
    .doc-subtitle {
      font-size: 10pt;
      color: #64748b;
      margin: 4px 0 0 0;
      font-style: italic;
    }
    .summary-grid {
      width: 100%;
      margin-bottom: 18px;
      border-collapse: collapse;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      background-color: #f8fafc;
      padding: 10px 14px;
      border-radius: 4px;
    }
    .summary-label {
      font-size: 9pt;
      color: #64748b;
      font-weight: bold;
      text-transform: uppercase;
    }
    .summary-value {
      font-size: 14pt;
      font-weight: bold;
      color: #1e293b;
      margin-top: 4px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
      font-size: 9.5pt;
    }
    table.data-table th {
      background-color: #312e81;
      color: #ffffff;
      font-weight: bold;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #312e81;
      text-transform: uppercase;
      font-size: 8.5pt;
    }
    table.data-table td {
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .text-emerald { color: #047857; }
    .text-rose { color: #b91c1c; }
    .text-indigo { color: #4338ca; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 8pt;
      font-weight: bold;
      border-radius: 3px;
      text-align: center;
    }
    .badge-lunas { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .badge-belum { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-sebagian { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .signature-section {
      width: 100%;
      margin-top: 35px;
      border-collapse: collapse;
    }
    .signature-box {
      width: 45%;
      text-align: center;
      vertical-align: top;
      font-size: 10pt;
    }
    .signature-space {
      height: 65px;
    }
    .page-break {
      page-break-before: always;
      mso-special-character: line-break;
    }
  </style>
</head>
<body>
  ${htmlBodyContent}
</body>
</html>`;

  // Create blob with BOM for accurate UTF-8 characters encoding in Microsoft Word
  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Kop Surat Standar Lembaga Bimbel
 */
function generateKopSuratHtml(settings: Settings): string {
  return `
  <div class="kop-surat">
    <div class="kop-title">${settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA'}</div>
    <div class="kop-sub">${settings.address || 'Jl. Pendidikan No. 88, Kota Pendidikan'} &bull; Telepon: ${settings.phone || '0812-3456-7890'}</div>
    <div class="kop-sub">Sistem Administrasi &amp; Manajemen Keuangan Operasional</div>
  </div>`;
}

/**
 * Generate Lembar Tanda Tangan & Pengesahan
 */
function generateSignatureHtml(settings: Settings, titleLocation: string = 'Surabaya'): string {
  const today = formatDateIndonesian(new Date().toISOString().split('T')[0]);
  return `
  <table class="signature-section">
    <tr>
      <td class="signature-box">
        <p style="margin:0;">Mengetahui,</p>
        <p style="margin:3px 0 0 0; font-weight:bold;">Pimpinan / Direktur Lembaga</p>
        <div class="signature-space"></div>
        <p style="margin:0; font-weight:bold; text-decoration:underline;">( ${settings.name || 'Pimpinan Bimbel'} )</p>
        <p style="margin:2px 0 0 0; font-size:8.5pt; color:#64748b;">NIP. 202401001</p>
      </td>
      <td style="width:10%;"></td>
      <td class="signature-box">
        <p style="margin:0;">Dicetak pada: ${today}</p>
        <p style="margin:3px 0 0 0; font-weight:bold;">Bagian Administrasi &amp; Keuangan</p>
        <div class="signature-space"></div>
        <p style="margin:0; font-weight:bold; text-decoration:underline;">( Administrator Keuangan )</p>
        <p style="margin:2px 0 0 0; font-size:8.5pt; color:#64748b;">Staff Pelaksana Keuangan</p>
      </td>
    </tr>
  </table>`;
}

export const wordExportService = {
  /**
   * 1. Export Laporan Keuangan & Laba Rugi (.doc)
   */
  exportFinancialReportWord(
    period: string,
    charges: StudentCharge[],
    payments: StudentPayment[],
    honors: TeacherHonor[],
    teacherPayments: TeacherPayment[],
    expenses: Expense[],
    settings: Settings
  ) {
    const periodCharges = charges.filter(c => c.date.startsWith(period));
    const periodPayments = payments.filter(p => p.date.startsWith(period));
    const periodHonors = honors.filter(h => h.period.toLowerCase().includes('september') || h.createdAt?.startsWith(period));
    const periodTeacherPayments = teacherPayments.filter(p => p.date.startsWith(period));
    const periodExpenses = expenses.filter(e => e.date.startsWith(period));

    const totalAkrualTagihan = periodCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalPendapatanKas = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalBebanHonor = periodHonors.reduce((sum, h) => sum + h.totalHonor, 0);
    const totalPengeluaranOperasional = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBebanUsaha = totalBebanHonor + totalPengeluaranOperasional;
    const labaBersihAkrual = totalAkrualTagihan - totalBebanUsaha;
    const marginLaba = totalAkrualTagihan > 0 ? ((labaBersihAkrual / totalAkrualTagihan) * 100).toFixed(1) : '0';

    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">LAPORAN KEUANGAN &amp; LABA / RUGI OPERASIONAL</div>
        <div class="doc-subtitle">Periode: ${period} &bull; Dicetak Otomatis oleh Sistem EduCendikia</div>
      </div>

      <!-- Ringkasan Finansial Utama -->
      <table class="summary-grid">
        <tr>
          <td style="width:32%; padding-right:8px;">
            <div class="summary-card" style="border-left: 4px solid #059669;">
              <div class="summary-label">Total Pendapatan Jasa Les (Akrual)</div>
              <div class="summary-value text-emerald">${formatRupiah(totalAkrualTagihan)}</div>
              <div style="font-size:8pt; color:#64748b; margin-top:2px;">${periodCharges.length} Tagihan Sesi Hadir</div>
            </div>
          </td>
          <td style="width:32%; padding-right:8px;">
            <div class="summary-card" style="border-left: 4px solid #dc2626;">
              <div class="summary-label">Total Beban Usaha &amp; Honor</div>
              <div class="summary-value text-rose">${formatRupiah(totalBebanUsaha)}</div>
              <div style="font-size:8pt; color:#64748b; margin-top:2px;">Honor + Biaya Operasional</div>
            </div>
          </td>
          <td style="width:36%;">
            <div class="summary-card" style="border-left: 4px solid #4f46e5; background-color:#eef2ff;">
              <div class="summary-label" style="color:#4338ca;">Estimasi Laba Bersih Operasional</div>
              <div class="summary-value text-indigo">${formatRupiah(labaBersihAkrual)}</div>
              <div style="font-size:8pt; color:#4338ca; margin-top:2px;">Profit Margin: ${marginLaba}%</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Tabel Rincian Laba Rugi Format Standar Akuntansi -->
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:65%;">URAIAN REKENING / POS KEUANGAN</th>
            <th style="width:35%; text-align:right;">JUMLAH (IDR)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color:#f1f5f9; font-weight:bold;">
            <td colspan="2">I. PENDAPATAN OPERASIONAL</td>
          </tr>
          <tr>
            <td style="padding-left:25px;">Pendapatan Jasa Les Siswa (${periodCharges.length} sesi pertemuan hadir)</td>
            <td class="text-right text-bold text-emerald">${formatRupiah(totalAkrualTagihan)}</td>
          </tr>
          <tr style="background-color:#f8fafc; font-weight:bold;">
            <td style="padding-left:15px;">TOTAL PENDAPATAN JASA OPERASIONAL</td>
            <td class="text-right text-emerald">${formatRupiah(totalAkrualTagihan)}</td>
          </tr>

          <tr style="background-color:#f1f5f9; font-weight:bold;">
            <td colspan="2">II. BEBAN OPERASIONAL &amp; HONOR PENGAJAR</td>
          </tr>
          <tr>
            <td style="padding-left:25px;">Beban Honor Guru / Tentor (Akrual Kehadiran)</td>
            <td class="text-right text-rose">${formatRupiah(totalBebanHonor)}</td>
          </tr>
          <tr>
            <td style="padding-left:25px;">Beban ATK &amp; Modul Pembelajaran Siswa</td>
            <td class="text-right text-rose">${formatRupiah(periodExpenses.filter(e => e.category === 'ATK_DAN_MODUL').reduce((s, e) => s + e.amount, 0))}</td>
          </tr>
          <tr>
            <td style="padding-left:25px;">Beban Utilitas, Gedung, Listrik &amp; Internet</td>
            <td class="text-right text-rose">${formatRupiah(periodExpenses.filter(e => e.category !== 'ATK_DAN_MODUL').reduce((s, e) => s + e.amount, 0))}</td>
          </tr>
          <tr style="background-color:#f8fafc; font-weight:bold;">
            <td style="padding-left:15px;">TOTAL BEBAN OPERASIONAL (BEBAN USAHA)</td>
            <td class="text-right text-rose">(${formatRupiah(totalBebanUsaha)})</td>
          </tr>

          <tr style="background-color:#e0e7ff; font-weight:bold; font-size:10.5pt; border-top: 2px solid #312e81; border-bottom: 2px solid #312e81;">
            <td>LABA BERSIH BULANAN (NET PROFIT)</td>
            <td class="text-right text-indigo" style="font-size:11pt;">${formatRupiah(labaBersihAkrual)}</td>
          </tr>
        </tbody>
      </table>

      <!-- Arus Kas Riil (Cash Flow) -->
      <div style="font-weight:bold; font-size:10.5pt; margin-top:16px; margin-bottom:6px; color:#0f172a;">
        INFORMASI ARUS KAS MASUK &amp; KELUAR RIIL (CASH BASIS)
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:65%;">POS ARUS KAS</th>
            <th style="width:35%; text-align:right;">JUMLAH KAS (IDR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kas Masuk dari Pembayaran Siswa Terkumpul (Kuitansi)</td>
            <td class="text-right text-emerald text-bold">${formatRupiah(totalPendapatanKas)}</td>
          </tr>
          <tr>
            <td>Kas Keluar untuk Penyaluran Honor Guru Real</td>
            <td class="text-right text-rose">(${formatRupiah(periodTeacherPayments.reduce((s, p) => s + p.amount, 0))})</td>
          </tr>
          <tr>
            <td>Kas Keluar untuk Beban Operasional &amp; Pengeluaran</td>
            <td class="text-right text-rose">(${formatRupiah(totalPengeluaranOperasional)})</td>
          </tr>
          <tr style="background-color:#f1f5f9; font-weight:bold;">
            <td>SURPLUS / DEFISIT KAS BERSIH (NET CASH FLOW)</td>
            <td class="text-right text-bold">${formatRupiah(totalPendapatanKas - periodTeacherPayments.reduce((s, p) => s + p.amount, 0) - totalPengeluaranOperasional)}</td>
          </tr>
        </tbody>
      </table>

      ${generateSignatureHtml(settings)}
    `;

    downloadWordFile(`Laporan_Keuangan_Laba_Rugi_${period}.doc`, content, 'Laporan Keuangan & Laba Rugi');
  },

  /**
   * 2. Export Laporan Rekapitulasi Siswa & Piutang (.doc)
   */
  exportStudentReportWord(
    students: Student[],
    charges: StudentCharge[],
    payments: StudentPayment[],
    settings: Settings
  ) {
    const totalTagihanAll = charges.reduce((sum, c) => sum + c.amount, 0);
    const totalBayarAll = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPiutangAll = Math.max(0, totalTagihanAll - totalBayarAll);

    const rowsHtml = students.map((std, idx) => {
      const stdCharges = charges.filter(c => c.studentId === std.id);
      const stdPayments = payments.filter(p => p.studentId === std.id);
      const tagihan = stdCharges.reduce((sum, c) => sum + c.amount, 0);
      const bayar = stdPayments.reduce((sum, p) => sum + p.amount, 0);
      const sisa = Math.max(0, tagihan - bayar);
      const isLunas = sisa === 0;

      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td style="font-weight:bold;">${std.name}</td>
          <td class="text-center" style="font-family:monospace;">${std.nis}</td>
          <td class="text-center">${std.grade}</td>
          <td class="text-center">${stdCharges.length} sesi</td>
          <td class="text-right">${formatRupiah(tagihan)}</td>
          <td class="text-right text-emerald text-bold">${formatRupiah(bayar)}</td>
          <td class="text-right text-rose text-bold">${formatRupiah(sisa)}</td>
          <td class="text-center">
            <span class="badge ${isLunas ? 'badge-lunas' : 'badge-belum'}">
              ${isLunas ? 'LUNAS' : 'BELUM LUNAS'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">REKAPITULASI KEHADIRAN &amp; PIUTANG IURAN SISWA</div>
        <div class="doc-subtitle">Total Siswa Terdaftar: ${students.length} Orang &bull; Tarif Les: ${formatRupiah(settings.studentRate)}/sesi</div>
      </div>

      <!-- Ringkasan Siswa -->
      <table class="summary-grid">
        <tr>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card">
              <div class="summary-label">Total Tagihan Akrual Siswa</div>
              <div class="summary-value">${formatRupiah(totalTagihanAll)}</div>
            </div>
          </td>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card" style="border-left: 4px solid #059669;">
              <div class="summary-label">Total Pembayaran Masuk (Lunas)</div>
              <div class="summary-value text-emerald">${formatRupiah(totalBayarAll)}</div>
            </div>
          </td>
          <td style="width:34%;">
            <div class="summary-card" style="border-left: 4px solid #dc2626;">
              <div class="summary-label">Total Sisa Piutang Tertagih</div>
              <div class="summary-value text-rose">${formatRupiah(totalPiutangAll)}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Tabel Data Siswa -->
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:4%; text-align:center;">NO</th>
            <th style="width:24%;">NAMA SISWA</th>
            <th style="width:10%; text-align:center;">NIS</th>
            <th style="width:8%; text-align:center;">KELAS</th>
            <th style="width:10%; text-align:center;">KEHADIRAN</th>
            <th style="width:14%; text-align:right;">TOTAL TAGIHAN</th>
            <th style="width:14%; text-align:right;">TOTAL BAYAR</th>
            <th style="width:14%; text-align:right;">SISA PIUTANG</th>
            <th style="width:12%; text-align:center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background-color:#e2e8f0; font-weight:bold; border-top:2px solid #0f172a;">
            <td colspan="4" class="text-center">TOTAL KESELURUHAN</td>
            <td class="text-center">${charges.length} Sesi</td>
            <td class="text-right">${formatRupiah(totalTagihanAll)}</td>
            <td class="text-right text-emerald">${formatRupiah(totalBayarAll)}</td>
            <td class="text-right text-rose">${formatRupiah(totalPiutangAll)}</td>
            <td class="text-center">-</td>
          </tr>
        </tbody>
      </table>

      ${generateSignatureHtml(settings)}
    `;

    downloadWordFile(`Laporan_Rekapitulasi_Siswa_${new Date().toISOString().split('T')[0]}.doc`, content, 'Laporan Siswa & Piutang');
  },

  /**
   * 3. Export Laporan Rekapitulasi Guru & Honor (.doc)
   */
  exportTeacherReportWord(
    teachers: Teacher[],
    honors: TeacherHonor[],
    payments: TeacherPayment[],
    settings: Settings
  ) {
    const totalHakAll = honors.reduce((sum, h) => sum + h.totalHonor, 0);
    const totalPaidAll = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalSisaAll = Math.max(0, totalHakAll - totalPaidAll);

    const rowsHtml = teachers.map((tch, idx) => {
      const tchHonors = honors.filter(h => h.teacherId === tch.id);
      const tchPayments = payments.filter(p => p.teacherId === tch.id);
      const totalHak = tchHonors.reduce((sum, h) => sum + h.totalHonor, 0);
      const totalPaid = tchPayments.reduce((sum, p) => sum + p.amount, 0);
      const sisa = Math.max(0, totalHak - totalPaid);
      const totalStudentMeetings = tchHonors.reduce((sum, h) => sum + h.studentMeetingCount, 0);
      const totalMeetings = tchHonors.reduce((sum, h) => sum + h.meetingCount, 0);
      const isLunas = sisa === 0 && totalHak > 0;

      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td style="font-weight:bold;">${tch.name}</td>
          <td class="text-center" style="font-family:monospace;">${tch.code}</td>
          <td class="text-center">${totalMeetings} sesi</td>
          <td class="text-center" style="font-weight:bold; color:#4338ca;">${totalStudentMeetings}</td>
          <td class="text-right" style="font-weight:bold;">${formatRupiah(totalHak)}</td>
          <td class="text-right text-emerald" style="font-weight:bold;">${formatRupiah(totalPaid)}</td>
          <td class="text-right text-rose" style="font-weight:bold;">${formatRupiah(sisa)}</td>
          <td class="text-center">
            <span class="badge ${isLunas ? 'badge-lunas' : sisa > 0 ? 'badge-belum' : 'badge-lunas'}">
              ${isLunas ? 'LUNAS' : sisa > 0 ? 'BELUM LUNAS' : 'SELESAI'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">REKAPITULASI KINERJA &amp; HONOR GURU / TENTOR</div>
        <div class="doc-subtitle">Basis Tarif: ${formatRupiah(settings.teacherRate)} per Siswa-Pertemuan Hadir</div>
      </div>

      <!-- Ringkasan Honor -->
      <table class="summary-grid">
        <tr>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card">
              <div class="summary-label">Total Hak Honor Guru</div>
              <div class="summary-value">${formatRupiah(totalHakAll)}</div>
            </div>
          </td>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card" style="border-left: 4px solid #059669;">
              <div class="summary-label">Honor Sudah Disalurkan</div>
              <div class="summary-value text-emerald">${formatRupiah(totalPaidAll)}</div>
            </div>
          </td>
          <td style="width:34%;">
            <div class="summary-card" style="border-left: 4px solid #d97706;">
              <div class="summary-label">Sisa Kewajiban Honor Lembaga</div>
              <div class="summary-value" style="color:#d97706;">${formatRupiah(totalSisaAll)}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Tabel Data Guru -->
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:4%; text-align:center;">NO</th>
            <th style="width:24%;">NAMA GURU / TENTOR</th>
            <th style="width:10%; text-align:center;">KODE</th>
            <th style="width:12%; text-align:center;">PERTEMUAN</th>
            <th style="width:14%; text-align:center;">SISWA-PERTEMUAN</th>
            <th style="width:14%; text-align:right;">TOTAL HAK HONOR</th>
            <th style="width:14%; text-align:right;">SUDAH DIBAYAR</th>
            <th style="width:14%; text-align:right;">SISA HONOR</th>
            <th style="width:12%; text-align:center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr style="background-color:#e2e8f0; font-weight:bold; border-top:2px solid #0f172a;">
            <td colspan="3" class="text-center">TOTAL KESELURUHAN</td>
            <td class="text-center">${honors.reduce((sum, h) => sum + h.meetingCount, 0)} Sesi</td>
            <td class="text-center">${honors.reduce((sum, h) => sum + h.studentMeetingCount, 0)}</td>
            <td class="text-right">${formatRupiah(totalHakAll)}</td>
            <td class="text-right text-emerald">${formatRupiah(totalPaidAll)}</td>
            <td class="text-right text-rose">${formatRupiah(totalSisaAll)}</td>
            <td class="text-center">-</td>
          </tr>
        </tbody>
      </table>

      ${generateSignatureHtml(settings)}
    `;

    downloadWordFile(`Laporan_Honor_Guru_${new Date().toISOString().split('T')[0]}.doc`, content, 'Laporan Honor Guru');
  },

  /**
   * 4. Export Laporan Rekapitulasi Pertemuan (.doc)
   */
  exportMeetingReportWord(
    meetings: Meeting[],
    programs: Program[],
    teachers: Teacher[],
    settings: Settings
  ) {
    const rowsHtml = meetings.map((m, idx) => {
      const prog = programs.find(p => p.id === m.programId);
      const tch = teachers.find(t => t.id === m.teacherId);
      const tagihan = (m.presentStudentCount || 0) * settings.studentRate;
      const honor = (m.presentStudentCount || 0) * settings.teacherRate;

      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family:monospace; font-weight:bold; color:#4338ca;">${m.meetingCode}</td>
          <td class="text-center">${formatDateIndonesian(m.date)}</td>
          <td>${prog?.name || '-'}</td>
          <td>${tch?.name || '-'}</td>
          <td class="text-center" style="font-weight:bold; color:#059669;">${m.presentStudentCount} / ${m.registeredStudentCount}</td>
          <td class="text-right text-emerald">${formatRupiah(tagihan)}</td>
          <td class="text-right text-indigo">${formatRupiah(honor)}</td>
          <td class="text-center">
            <span class="badge ${m.status === 'SELESAI' ? 'badge-lunas' : 'badge-sebagian'}">
              ${m.status}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">REKAPITULASI SESI PERTEMUAN &amp; INTEGRASI KEHADIRAN</div>
        <div class="doc-subtitle">Total ${meetings.length} Sesi Pertemuan Terjadwal &amp; Terlaksana</div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width:4%; text-align:center;">NO</th>
            <th style="width:12%; text-align:center;">KODE SESI</th>
            <th style="width:13%; text-align:center;">TANGGAL</th>
            <th style="width:18%;">PROGRAM</th>
            <th style="width:18%;">GURU PENGAJAR</th>
            <th style="width:10%; text-align:center;">HADIR</th>
            <th style="width:13%; text-align:right;">TAGIHAN SISWA</th>
            <th style="width:13%; text-align:right;">HONOR GURU</th>
            <th style="width:9%; text-align:center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      ${generateSignatureHtml(settings)}
    `;

    downloadWordFile(`Laporan_Pertemuan_${new Date().toISOString().split('T')[0]}.doc`, content, 'Laporan Pertemuan');
  },

  /**
   * 5. Master Full Comprehensive Report (Semua 4 Laporan Digabung dalam 1 Berkas Word)
   */
  exportExecutiveFullReportWord(
    period: string,
    students: Student[],
    teachers: Teacher[],
    meetings: Meeting[],
    programs: Program[],
    charges: StudentCharge[],
    payments: StudentPayment[],
    honors: TeacherHonor[],
    teacherPayments: TeacherPayment[],
    expenses: Expense[],
    settings: Settings
  ) {
    const periodCharges = charges.filter(c => c.date.startsWith(period));
    const periodPayments = payments.filter(p => p.date.startsWith(period));
    const periodHonors = honors.filter(h => h.period.toLowerCase().includes('september') || h.createdAt?.startsWith(period));
    const periodTeacherPayments = teacherPayments.filter(p => p.date.startsWith(period));
    const periodExpenses = expenses.filter(e => e.date.startsWith(period));

    const totalAkrualTagihan = periodCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalPendapatanKas = periodPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalBebanHonor = periodHonors.reduce((sum, h) => sum + h.totalHonor, 0);
    const totalPengeluaranOperasional = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBebanUsaha = totalBebanHonor + totalPengeluaranOperasional;
    const labaBersihAkrual = totalAkrualTagihan - totalBebanUsaha;

    const studentRows = students.map((std, idx) => {
      const stdCharges = charges.filter(c => c.studentId === std.id);
      const stdPayments = payments.filter(p => p.studentId === std.id);
      const tagihan = stdCharges.reduce((sum, c) => sum + c.amount, 0);
      const bayar = stdPayments.reduce((sum, p) => sum + p.amount, 0);
      const sisa = Math.max(0, tagihan - bayar);
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${std.name}</b></td>
          <td class="text-center">${std.nis}</td>
          <td class="text-center">${std.grade}</td>
          <td class="text-center">${stdCharges.length}</td>
          <td class="text-right">${formatRupiah(tagihan)}</td>
          <td class="text-right text-emerald">${formatRupiah(bayar)}</td>
          <td class="text-right text-rose">${formatRupiah(sisa)}</td>
          <td class="text-center"><span class="badge ${sisa === 0 ? 'badge-lunas' : 'badge-belum'}">${sisa === 0 ? 'LUNAS' : 'BELUM'}</span></td>
        </tr>
      `;
    }).join('');

    const teacherRows = teachers.map((tch, idx) => {
      const tchHonors = honors.filter(h => h.teacherId === tch.id);
      const tchPayments = teacherPayments.filter(p => p.teacherId === tch.id);
      const totalHak = tchHonors.reduce((sum, h) => sum + h.totalHonor, 0);
      const totalPaid = tchPayments.reduce((sum, p) => sum + p.amount, 0);
      const sisa = Math.max(0, totalHak - totalPaid);
      const totalStudentMeetings = tchHonors.reduce((sum, h) => sum + h.studentMeetingCount, 0);
      const totalMeetings = tchHonors.reduce((sum, h) => sum + h.meetingCount, 0);
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${tch.name}</b></td>
          <td class="text-center">${tch.code}</td>
          <td class="text-center">${totalMeetings}</td>
          <td class="text-center font-bold text-indigo">${totalStudentMeetings}</td>
          <td class="text-right font-bold">${formatRupiah(totalHak)}</td>
          <td class="text-right text-emerald">${formatRupiah(totalPaid)}</td>
          <td class="text-right text-rose">${formatRupiah(sisa)}</td>
          <td class="text-center"><span class="badge ${sisa === 0 ? 'badge-lunas' : 'badge-belum'}">${sisa === 0 ? 'LUNAS' : 'BELUM'}</span></td>
        </tr>
      `;
    }).join('');

    const fullContent = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">BUKU LAPORAN EKSEKUTIF &amp; KEUANGAN LENGKAP</div>
        <div class="doc-subtitle">Kompilasi Seluruh Aktivitas Operasional, Akademik, dan Finansial Lembaga</div>
      </div>

      <div style="background-color:#f1f5f9; border-left:4px solid #312e81; padding:10px 14px; margin-bottom:20px; font-size:9.5pt;">
        <b>Daftar Isi Dokumen Laporan:</b>
        <ol style="margin:4px 0 0 0; padding-left:18px;">
          <li>Bagian I: Laporan Laba/Rugi &amp; Arus Kas Operasional</li>
          <li>Bagian II: Rekapitulasi Data Siswa &amp; Piutang Iuran</li>
          <li>Bagian III: Rekapitulasi Kinerja Mengajar &amp; Honor Guru Tentor</li>
          <li>Bagian IV: Pengesahan &amp; Tanda Tangan Pimpinan</li>
        </ol>
      </div>

      <!-- BAGIAN I: LABA RUGI -->
      <h3 style="color:#1e1b4b; border-bottom:2px solid #cbd5e1; padding-bottom:4px; margin-top:20px;">
        BAGIAN I: LAPORAN KEUANGAN &amp; LABA RUGI (PERIODE ${period})
      </h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:65%;">POS KEUANGAN</th>
            <th style="width:35%; text-align:right;">JUMLAH (IDR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Pendapatan Jasa Les Siswa (Akrual)</td>
            <td class="text-right text-emerald text-bold">${formatRupiah(totalAkrualTagihan)}</td>
          </tr>
          <tr>
            <td>Total Beban Honor Guru / Tentor</td>
            <td class="text-right text-rose">(${formatRupiah(totalBebanHonor)})</td>
          </tr>
          <tr>
            <td>Total Beban Operasional, ATK &amp; Utilitas</td>
            <td class="text-right text-rose">(${formatRupiah(totalPengeluaranOperasional)})</td>
          </tr>
          <tr style="background-color:#e0e7ff; font-weight:bold; font-size:10pt;">
            <td>LABA BERSIH OPERASIONAL (NET PROFIT)</td>
            <td class="text-right text-indigo">${formatRupiah(labaBersihAkrual)}</td>
          </tr>
        </tbody>
      </table>

      <!-- BAGIAN II: REKAP SISWA -->
      <div class="page-break"></div>
      ${generateKopSuratHtml(settings)}
      <h3 style="color:#1e1b4b; border-bottom:2px solid #cbd5e1; padding-bottom:4px; margin-top:15px;">
        BAGIAN II: REKAPITULASI SISWA &amp; PIUTANG IURAN
      </h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:4%; text-align:center;">NO</th>
            <th style="width:25%;">NAMA SISWA</th>
            <th style="width:10%; text-align:center;">NIS</th>
            <th style="width:8%; text-align:center;">KELAS</th>
            <th style="width:8%; text-align:center;">SESI</th>
            <th style="width:15%; text-align:right;">TAGIHAN</th>
            <th style="width:15%; text-align:right;">BAYAR</th>
            <th style="width:15%; text-align:right;">SISA</th>
            <th style="width:10%; text-align:center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
      </table>

      <!-- BAGIAN III: REKAP GURU -->
      <div class="page-break"></div>
      ${generateKopSuratHtml(settings)}
      <h3 style="color:#1e1b4b; border-bottom:2px solid #cbd5e1; padding-bottom:4px; margin-top:15px;">
        BAGIAN III: REKAPITULASI KINERJA &amp; HONOR GURU
      </h3>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:4%; text-align:center;">NO</th>
            <th style="width:25%;">NAMA GURU</th>
            <th style="width:10%; text-align:center;">KODE</th>
            <th style="width:10%; text-align:center;">SESI</th>
            <th style="width:13%; text-align:center;">SISWA-SESI</th>
            <th style="width:15%; text-align:right;">HAK HONOR</th>
            <th style="width:15%; text-align:right;">TERBAYAR</th>
            <th style="width:15%; text-align:right;">SISA</th>
            <th style="width:10%; text-align:center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${teacherRows}
        </tbody>
      </table>

      <!-- PENGESAHAN -->
      <div style="margin-top:25px;">
        ${generateSignatureHtml(settings)}
      </div>
    `;

    downloadWordFile(`Laporan_Eksekutif_Lengkap_${period}.doc`, fullContent, 'Laporan Eksekutif Lengkap');
  },

  /**
   * 6. Kuitansi Pembayaran Siswa Format Word (.doc)
   */
  exportStudentReceiptWord(payment: StudentPayment, student: Student | undefined, settings: Settings) {
    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">KUITANSI PEMBAYARAN IURAN LES</div>
        <div class="doc-subtitle">Nomor Kuitansi: ${payment.paymentNumber}</div>
      </div>

      <div style="border: 2px dashed #94a3b8; padding: 18px 24px; background-color: #f8fafc; border-radius: 6px; margin: 15px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:10pt;">
          <tr>
            <td style="width:30%; padding:6px 0; color:#475569;">Telah diterima dari</td>
            <td style="width:5%; text-align:center;">:</td>
            <td style="width:65%; font-weight:bold; color:#0f172a; font-size:11pt;">${student?.name || 'Siswa'} (${student?.nis || '-'})</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Nama Orang Tua / Wali</td>
            <td style="text-align:center;">:</td>
            <td style="color:#0f172a;">${student?.parentName || '-'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Tanggal Transaksi</td>
            <td style="text-align:center;">:</td>
            <td style="color:#0f172a;">${formatDateIndonesian(payment.date)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Metode Pembayaran</td>
            <td style="text-align:center;">:</td>
            <td style="font-weight:bold; color:#0f172a;">${payment.paymentMethod.replace(/_/g, ' ')}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Untuk Keperluan</td>
            <td style="text-align:center;">:</td>
            <td style="color:#0f172a;">${payment.notes || 'Pembayaran Bimbingan Belajar'}</td>
          </tr>
        </table>

        <div style="margin-top:16px; background-color:#d1fae5; border:1px solid #6ee7b7; padding:12px 18px; border-radius:4px; text-align:center;">
          <span style="font-size:10pt; font-weight:bold; color:#065f46;">JUMLAH PEMBAYARAN: </span>
          <span style="font-size:16pt; font-weight:bold; color:#047857; margin-left:8px;">${formatRupiah(payment.amount)}</span>
        </div>
      </div>

      <table class="signature-section" style="margin-top:20px;">
        <tr>
          <td class="signature-box">
            <p style="margin:0;">Status Kuitansi:</p>
            <p style="margin:4px 0 0 0; font-weight:bold; color:#059669; font-size:12pt;">[ LUNAS &amp; SAH ]</p>
          </td>
          <td style="width:10%;"></td>
          <td class="signature-box">
            <p style="margin:0;">Penerima / Kasir,</p>
            <div class="signature-space"></div>
            <p style="margin:0; font-weight:bold; text-decoration:underline;">( ${payment.receivedBy || 'Petugas Keuangan'} )</p>
            <p style="margin:2px 0 0 0; font-size:8.5pt; color:#64748b;">Administrasi Keuangan</p>
          </td>
        </tr>
      </table>
    `;

    downloadWordFile(`Kuitansi_${payment.paymentNumber}_${student?.name || 'Siswa'}.doc`, content, `Kuitansi ${payment.paymentNumber}`);
  },

  /**
   * 7. Slip Honor Guru Format Word (.doc)
   */
  exportTeacherPaymentVoucherWord(payment: TeacherPayment, teacher: Teacher | undefined, settings: Settings) {
    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">SLIP BUKTI PENYALURAN HONOR GURU / TENTOR</div>
        <div class="doc-subtitle">Nomor Voucher: ${payment.paymentNumber}</div>
      </div>

      <div style="border: 2px dashed #94a3b8; padding: 18px 24px; background-color: #f8fafc; border-radius: 6px; margin: 15px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:10pt;">
          <tr>
            <td style="width:30%; padding:6px 0; color:#475569;">Nama Guru / Tentor</td>
            <td style="width:5%; text-align:center;">:</td>
            <td style="width:65%; font-weight:bold; color:#0f172a; font-size:11pt;">${teacher?.name || 'Guru'} (${teacher?.code || '-'})</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Periode Pembayaran</td>
            <td style="text-align:center;">:</td>
            <td style="font-weight:bold; color:#0f172a;">${payment.period}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Tanggal Realisasi Transfer</td>
            <td style="text-align:center;">:</td>
            <td style="color:#0f172a;">${formatDateIndonesian(payment.date)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Metode Penyaluran</td>
            <td style="text-align:center;">:</td>
            <td style="color:#0f172a;">${payment.paymentMethod.replace(/_/g, ' ')}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#475569;">Keterangan</td>
            <td style="text-align:center;">:</td>
            <td style="color:#0f172a;">${payment.notes || 'Penyaluran Honor Mengajar'}</td>
          </tr>
        </table>

        <div style="margin-top:16px; background-color:#e0e7ff; border:1px solid #a5b4fc; padding:12px 18px; border-radius:4px; text-align:center;">
          <span style="font-size:10pt; font-weight:bold; color:#3730a3;">TOTAL HONOR DIBAYAR: </span>
          <span style="font-size:16pt; font-weight:bold; color:#312e81; margin-left:8px;">${formatRupiah(payment.amount)}</span>
        </div>
      </div>

      <table class="signature-section" style="margin-top:20px;">
        <tr>
          <td class="signature-box">
            <p style="margin:0;">Guru Penerima,</p>
            <div class="signature-space"></div>
            <p style="margin:0; font-weight:bold; text-decoration:underline;">( ${teacher?.name || 'Guru'} )</p>
            <p style="margin:2px 0 0 0; font-size:8.5pt; color:#64748b;">Tentor EduCendikia</p>
          </td>
          <td style="width:10%;"></td>
          <td class="signature-box">
            <p style="margin:0;">Petugas Keuangan,</p>
            <div class="signature-space"></div>
            <p style="margin:0; font-weight:bold; text-decoration:underline;">( ${payment.processedBy || 'Bagian Keuangan'} )</p>
            <p style="margin:2px 0 0 0; font-size:8.5pt; color:#64748b;">Kasir &amp; Akuntansi</p>
          </td>
        </tr>
      </table>
    `;

    downloadWordFile(`Slip_Honor_${payment.paymentNumber}_${teacher?.name || 'Guru'}.doc`, content, `Slip Honor ${payment.paymentNumber}`);
  },

  /**
   * 8. Rekap Honor Pribadi Guru Format Word (.doc)
   */
  exportTeacherIndividualHonorWord(
    teacher: Teacher,
    teacherHonors: TeacherHonor[],
    teacherPayments: TeacherPayment[],
    meetings: Meeting[],
    programs: Program[],
    settings: Settings
  ) {
    const myHonors = teacherHonors.filter(h => h.teacherId === teacher.id);
    const myPayments = teacherPayments.filter(p => p.teacherId === teacher.id);
    const myMeetings = meetings.filter(m => m.teacherId === teacher.id && m.status === 'SELESAI');

    const totalHonorEarned = myHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
    const totalHonorPaid = myPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalHonorPending = Math.max(0, totalHonorEarned - totalHonorPaid);

    const meetingRows = myMeetings.map((mtg, idx) => {
      const prog = programs.find(p => p.id === mtg.programId);
      const honor = mtg.presentStudentCount * settings.teacherRate;
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family:monospace; font-weight:bold;">${mtg.meetingCode}</td>
          <td class="text-center">${formatDateIndonesian(mtg.date)}</td>
          <td>${prog?.name || '-'}</td>
          <td>${mtg.topic || '-'}</td>
          <td class="text-center" style="font-weight:bold; color:#059669;">${mtg.presentStudentCount} Siswa</td>
          <td class="text-right" style="font-weight:bold;">${formatRupiah(honor)}</td>
        </tr>
      `;
    }).join('');

    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">REKAPITULASI &amp; TRANSPARANSI HONOR PENGAJAR</div>
        <div class="doc-subtitle">Nama Guru: ${teacher.name} (${teacher.code}) &bull; Tarif: ${formatRupiah(settings.teacherRate)}/siswa-sesi</div>
      </div>

      <table class="summary-grid">
        <tr>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card">
              <div class="summary-label">Total Akumulasi Honor</div>
              <div class="summary-value">${formatRupiah(totalHonorEarned)}</div>
            </div>
          </td>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card" style="border-left:4px solid #059669;">
              <div class="summary-label">Sudah Dicairkan</div>
              <div class="summary-value text-emerald">${formatRupiah(totalHonorPaid)}</div>
            </div>
          </td>
          <td style="width:34%;">
            <div class="summary-card" style="border-left:4px solid #d97706;">
              <div class="summary-label">Sisa Belum Dicairkan</div>
              <div class="summary-value" style="color:#d97706;">${formatRupiah(totalHonorPending)}</div>
            </div>
          </td>
        </tr>
      </table>

      <div style="font-weight:bold; font-size:10.5pt; margin-top:16px; margin-bottom:6px; color:#0f172a;">
        Rincian Sesi Mengajar Selesai:
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:4%; text-align:center;">NO</th>
            <th style="width:14%; text-align:center;">KODE SESI</th>
            <th style="width:14%; text-align:center;">TANGGAL</th>
            <th style="width:20%;">PROGRAM</th>
            <th style="width:24%;">TOPIK MATERI</th>
            <th style="width:10%; text-align:center;">SISWA HADIR</th>
            <th style="width:14%; text-align:right;">HONOR SESI</th>
          </tr>
        </thead>
        <tbody>
          ${meetingRows}
          <tr style="background-color:#e2e8f0; font-weight:bold;">
            <td colspan="5" class="text-center">TOTAL HONOR DIHASILKAN</td>
            <td class="text-center">${myMeetings.reduce((s, m) => s + m.presentStudentCount, 0)} Hadir</td>
            <td class="text-right">${formatRupiah(totalHonorEarned)}</td>
          </tr>
        </tbody>
      </table>

      ${generateSignatureHtml(settings)}
    `;

    downloadWordFile(`Rekap_Honor_${teacher.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`, content, `Rekap Honor ${teacher.name}`);
  },

  /**
   * Alias untuk slip honor guru
   */
  exportTeacherHonorSlipWord(payment: TeacherPayment, teacher: Teacher | undefined, settings: Settings) {
    this.exportTeacherPaymentVoucherWord(payment, teacher, settings);
  },

  /**
   * Alias untuk rekap rincian honor guru per sesi
   */
  exportTeacherHonorBreakdownWord(
    teacher: Teacher,
    meetings: Meeting[],
    programs: Program[],
    totalHonorEarned: number,
    totalHonorPaid: number,
    settings: Settings
  ) {
    const totalHonorPending = Math.max(0, totalHonorEarned - totalHonorPaid);
    const meetingRows = meetings.map((mtg, idx) => {
      const prog = programs.find(p => p.id === mtg.programId);
      const honor = mtg.presentStudentCount * settings.teacherRate;
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family:monospace; font-weight:bold;">${mtg.meetingCode}</td>
          <td class="text-center">${formatDateIndonesian(mtg.date)}</td>
          <td>${prog?.name || '-'}</td>
          <td>${mtg.topic || '-'}</td>
          <td class="text-center" style="font-weight:bold; color:#059669;">${mtg.presentStudentCount} Siswa</td>
          <td class="text-right" style="font-weight:bold;">${formatRupiah(honor)}</td>
        </tr>
      `;
    }).join('');

    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">REKAPITULASI &amp; TRANSPARANSI HONOR PENGAJAR</div>
        <div class="doc-subtitle">Nama Guru: ${teacher.name} (${teacher.code}) &bull; Tarif: ${formatRupiah(settings.teacherRate)}/siswa-sesi</div>
      </div>

      <table class="summary-grid">
        <tr>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card">
              <div class="summary-label">Total Akumulasi Honor</div>
              <div class="summary-value">${formatRupiah(totalHonorEarned)}</div>
            </div>
          </td>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card" style="border-left:4px solid #059669;">
              <div class="summary-label">Sudah Dicairkan</div>
              <div class="summary-value text-emerald">${formatRupiah(totalHonorPaid)}</div>
            </div>
          </td>
          <td style="width:34%;">
            <div class="summary-card" style="border-left:4px solid #d97706;">
              <div class="summary-label">Sisa Belum Dicairkan</div>
              <div class="summary-value" style="color:#d97706;">${formatRupiah(totalHonorPending)}</div>
            </div>
          </td>
        </tr>
      </table>

      <div style="font-weight:bold; font-size:10.5pt; margin-top:16px; margin-bottom:6px; color:#0f172a;">
        Rincian Sesi Mengajar Selesai:
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:4%; text-align:center;">NO</th>
            <th style="width:14%; text-align:center;">KODE SESI</th>
            <th style="width:14%; text-align:center;">TANGGAL</th>
            <th style="width:20%;">PROGRAM</th>
            <th style="width:24%;">TOPIK MATERI</th>
            <th style="width:10%; text-align:center;">SISWA HADIR</th>
            <th style="width:14%; text-align:right;">HONOR SESI</th>
          </tr>
        </thead>
        <tbody>
          ${meetingRows}
          <tr style="background-color:#e2e8f0; font-weight:bold;">
            <td colspan="5" class="text-center">TOTAL HONOR DIHASILKAN</td>
            <td class="text-center">${meetings.reduce((s, m) => s + m.presentStudentCount, 0)} Hadir</td>
            <td class="text-right">${formatRupiah(totalHonorEarned)}</td>
          </tr>
        </tbody>
      </table>

      ${generateSignatureHtml(settings)}
    `;

    downloadWordFile(`Rekap_Honor_${teacher.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`, content, `Rekap Honor ${teacher.name}`);
  },

  /**
   * Surat Tagihan & Rincian Kehadiran Siswa Individual (.doc)
   */
  exportStudentBillingNoticeWord(
    student: Student,
    charges: StudentCharge[],
    payments: StudentPayment[],
    meetings: Meeting[],
    programs: Program[],
    settings: Settings
  ) {
    const totalTagihan = charges.reduce((sum, c) => sum + c.amount, 0);
    const totalBayar = payments.reduce((sum, p) => sum + p.amount, 0);
    const sisaTunggakan = Math.max(0, totalTagihan - totalBayar);

    const chargeRows = charges.map((chg, idx) => {
      const mtg = meetings.find(m => m.id === chg.meetingId);
      const prog = programs.find(p => p.id === mtg?.programId);
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center" style="font-family:monospace; font-size:8.5pt;">${chg.chargeNumber}</td>
          <td class="text-center">${formatDateIndonesian(chg.date)}</td>
          <td>${prog?.name || mtg?.meetingCode || 'Sesi Pembelajaran'}</td>
          <td>${mtg?.topic || 'Pertemuan Reguler'}</td>
          <td class="text-right" style="font-weight:bold;">${formatRupiah(chg.amount)}</td>
        </tr>
      `;
    }).join('');

    const paymentRows = payments.length === 0 ? `
      <tr>
        <td colspan="5" class="text-center" style="color:#64748b; font-style:italic;">Belum ada riwayat pembayaran yang tercatat.</td>
      </tr>
    ` : payments.map((pay, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="text-center" style="font-family:monospace; font-size:8.5pt;">${pay.paymentNumber || pay.paymentCode || pay.id}</td>
        <td class="text-center">${formatDateIndonesian(pay.date || pay.paymentDate || '')}</td>
        <td class="text-center">${pay.paymentMethod || 'TUNAI'}</td>
        <td class="text-right" style="font-weight:bold; color:#059669;">${formatRupiah(pay.amount)}</td>
      </tr>
    `).join('');

    const content = `
      ${generateKopSuratHtml(settings)}
      <div class="doc-title-box">
        <div class="doc-title">LEMBAR PEMBERITAHUAN TAGIHAN &amp; KEHADIRAN SISWA</div>
        <div class="doc-subtitle">Tanggal Terbit: ${formatDateIndonesian(new Date().toISOString().split('T')[0])}</div>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Nama Siswa</td>
          <td class="meta-value" style="font-weight:bold; color:#1e1b4b;">${student.name}</td>
          <td class="meta-label">NIS</td>
          <td class="meta-value" style="font-family:monospace;">${student.nis}</td>
        </tr>
        <tr>
          <td class="meta-label">Kelas / Jenjang</td>
          <td class="meta-value">${student.grade}</td>
          <td class="meta-label">Nama Orang Tua / Wali</td>
          <td class="meta-value">${student.parentName || '-'} (${student.parentPhone || '-'})</td>
        </tr>
        <tr>
          <td class="meta-label">Tarif Bimbingan</td>
          <td class="meta-value">${formatRupiah(settings.studentRate)} / pertemuan hadir</td>
          <td class="meta-label">Status Pembayaran</td>
          <td class="meta-value">
            <span class="badge ${sisaTunggakan === 0 ? 'badge-paid' : 'badge-unpaid'}">
              ${sisaTunggakan === 0 ? 'LUNAS' : 'BELUM LUNAS'}
            </span>
          </td>
        </tr>
      </table>

      <table class="summary-grid" style="margin-top:14px;">
        <tr>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card">
              <div class="summary-label">Total Akumulasi Tagihan</div>
              <div class="summary-value">${formatRupiah(totalTagihan)}</div>
              <div style="font-size:8pt; color:#64748b; margin-top:2px;">${charges.length} sesi kehadiran</div>
            </div>
          </td>
          <td style="width:33%; padding-right:8px;">
            <div class="summary-card" style="border-left:4px solid #059669;">
              <div class="summary-label">Total Telah Dibayar</div>
              <div class="summary-value text-emerald">${formatRupiah(totalBayar)}</div>
              <div style="font-size:8pt; color:#64748b; margin-top:2px;">${payments.length} transaksi pembayaran</div>
            </div>
          </td>
          <td style="width:34%;">
            <div class="summary-card" style="border-left:4px solid ${sisaTunggakan > 0 ? '#b91c1c' : '#059669'};">
              <div class="summary-label">Sisa Tunggakan Wajib Bayar</div>
              <div class="summary-value ${sisaTunggakan > 0 ? 'text-rose' : 'text-emerald'}">${formatRupiah(sisaTunggakan)}</div>
              <div style="font-size:8pt; color:${sisaTunggakan > 0 ? '#b91c1c' : '#059669'}; font-weight:bold; margin-top:2px;">
                ${sisaTunggakan === 0 ? 'Semua tagihan lunas' : 'Menunggu pelunasan'}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <div style="font-weight:bold; font-size:10pt; margin-top:18px; margin-bottom:6px; color:#0f172a;">
        A. Rincian Sesi Kehadiran yang Ditagihkan:
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:5%; text-align:center;">NO</th>
            <th style="width:18%; text-align:center;">KODE TAGIHAN</th>
            <th style="width:16%; text-align:center;">TANGGAL</th>
            <th style="width:23%;">PROGRAM</th>
            <th style="width:23%;">MATERI</th>
            <th style="width:15%; text-align:right;">NOMINAL</th>
          </tr>
        </thead>
        <tbody>
          ${chargeRows.length > 0 ? chargeRows : '<tr><td colspan="6" class="text-center" style="color:#64748b;">Belum ada data kehadiran</td></tr>'}
          <tr style="background-color:#e2e8f0; font-weight:bold;">
            <td colspan="5" class="text-center">TOTAL TAGIHAN KESELURUHAN</td>
            <td class="text-right">${formatRupiah(totalTagihan)}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-weight:bold; font-size:10pt; margin-top:14px; margin-bottom:6px; color:#0f172a;">
        B. Riwayat Pembayaran yang Diterima:
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:5%; text-align:center;">NO</th>
            <th style="width:22%; text-align:center;">NO. KUITANSI</th>
            <th style="width:20%; text-align:center;">TANGGAL BAYAR</th>
            <th style="width:25%; text-align:center;">METODE</th>
            <th style="width:28%; text-align:right;">JUMLAH DIBAYAR</th>
          </tr>
        </thead>
        <tbody>
          ${paymentRows}
          <tr style="background-color:#e2e8f0; font-weight:bold;">
            <td colspan="4" class="text-center">TOTAL TELAH DIBAYAR</td>
            <td class="text-right text-emerald">${formatRupiah(totalBayar)}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color:#f1f5f9; border-left:3px solid #3b82f6; padding:8px 12px; margin-top:12px; font-size:8.5pt; color:#334155;">
        <strong>Informasi Pembayaran:</strong><br/>
        Pembayaran dapat dilakukan secara tunai di kasir kantor bimbel atau transfer melalui rekening bank resmi:<br/>
        <strong>Bank Mandiri / BCA / BRI</strong>: a.n. ${settings.name || settings.organizationName || 'Lembaga Bimbingan Belajar'} (Bukti transfer harap dikonfirmasikan ke admin via WhatsApp).
      </div>

      ${generateSignatureHtml(settings)}
    `;

    downloadWordFile(`Surat_Tagihan_${student.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`, content, `Surat Tagihan ${student.name}`);
  }
};
