import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Student,
  Teacher,
  StudentCharge,
  StudentPayment,
  TeacherHonor,
  TeacherPayment,
  Expense,
  InstitutionSetting
} from '../types';
import { formatRupiah, formatDateIndonesian } from './businessLogic';

/**
 * Utilitas format CSV dengan RFC4180 dan UTF-8 BOM untuk kompatibilitas sempurna di Microsoft Excel
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function downloadCSVFile(filename: string, csvContent: string) {
  const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface FinancialExportData {
  period: string;
  settings: InstitutionSetting;
  studentCharges: StudentCharge[];
  studentPayments: StudentPayment[];
  teacherHonors: TeacherHonor[];
  teacherPayments: TeacherPayment[];
  expenses: Expense[];
  students: Student[];
  teachers: Teacher[];
}

export const financialExportService = {
  /**
   * 1. EKSPOR LAPORAN KEUANGAN BULANAN KE CSV
   */
  exportFinancialReportCSV(data: FinancialExportData) {
    const {
      period,
      settings,
      studentCharges,
      studentPayments,
      teacherHonors,
      teacherPayments,
      expenses,
      students,
      teachers
    } = data;

    // Filter by period
    const isPeriodMatch = (dateStr?: string, periodStr?: string) => {
      if (period === 'ALL') return true;
      if (periodStr && periodStr === period) return true;
      if (dateStr && dateStr.startsWith(period)) return true;
      return false;
    };

    const activeStudentPayments = studentPayments.filter(
      p => p.status !== 'DIBATALKAN' && p.status !== 'VOID' && isPeriodMatch(p.date || p.paymentDate)
    );

    const activeTeacherPayments = teacherPayments.filter(
      p => p.status !== 'DIBATALKAN' && p.status !== 'VOID' && isPeriodMatch(p.date || p.paymentDate, p.period)
    );

    const filteredCharges = studentCharges.filter(c => isPeriodMatch(c.date, c.period));
    const filteredHonors = teacherHonors.filter(h => period === 'ALL' || h.period === period);
    const filteredExpenses = expenses.filter(e => isPeriodMatch(e.date));

    // Totals
    const totalCashInflow = activeStudentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAccruedRevenue = filteredCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalTeacherHonorPaid = activeTeacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOperationalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCashOutflow = totalTeacherHonorPaid + totalOperationalExpenses;
    const netCashflow = totalCashInflow - totalCashOutflow;

    const totalAccruedTeacherHonor = filteredHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
    const netAccrualProfit = totalAccruedRevenue - totalAccruedTeacherHonor - totalOperationalExpenses;
    const totalReceivables = Math.max(0, totalAccruedRevenue - totalCashInflow);
    const totalPayables = Math.max(0, totalAccruedTeacherHonor - totalTeacherHonorPaid);

    // Build CSV lines
    const rows: string[] = [];

    // Header metadata
    rows.push(escapeCSV(settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA'));
    rows.push(escapeCSV(`LAPORAN KEUANGAN, ARUS KAS & LABA RUGI BULANAN`));
    rows.push(`${escapeCSV('Periode Laporan')},${escapeCSV(period === 'ALL' ? 'Semua Periode' : period)}`);
    rows.push(`${escapeCSV('Tanggal Dibuat')},${escapeCSV(formatDateIndonesian(new Date().toISOString().split('T')[0]))}`);
    rows.push('');

    // Section 1: Ringkasan Eksekutif
    rows.push(escapeCSV('=== RINGKASAN EKSEKUTIF KEUANGAN ==='));
    rows.push(`${escapeCSV('Indikator Keuangan')},${escapeCSV('Nominal (Rp)')},${escapeCSV('Keterangan')}`);
    rows.push(`${escapeCSV('Total Kas Masuk (Penerimaan Siswa)')},${totalCashInflow},${escapeCSV('Penerimaan tunai/transfer riil dari siswa')}`);
    rows.push(`${escapeCSV('Total Kas Keluar (Honor + Operasional)')},${totalCashOutflow},${escapeCSV('Total pengeluaran kas riil')}`);
    rows.push(`${escapeCSV('  - Pembayaran Honor Tentor')},${totalTeacherHonorPaid},${escapeCSV('Honor yang telah dicairkan ke rekening guru')}`);
    rows.push(`${escapeCSV('  - Beban Operasional Lembaga')},${totalOperationalExpenses},${escapeCSV('Biaya utilitas, ATK, modul, dll.')}`);
    rows.push(`${escapeCSV('Arus Kas Bersih (Net Cash Flow)')},${netCashflow},${escapeCSV('Kas Masuk dikurangi Kas Keluar Riil')}`);
    rows.push('');
    rows.push(`${escapeCSV('Total Tagihan Akrual Siswa')},${totalAccruedRevenue},${escapeCSV('Kewajiban bayar yang diterbitkan periode ini')}`);
    rows.push(`${escapeCSV('Total Beban Honor Guru (Akrual)')},${totalAccruedTeacherHonor},${escapeCSV('Total hak honor guru yang timbul periode ini')}`);
    rows.push(`${escapeCSV('Estimasi Laba Bersih Akrual')},${netAccrualProfit},${escapeCSV('Tagihan Siswa - Total Beban Honor - Operasional')}`);
    rows.push(`${escapeCSV('Sisa Piutang Siswa Belum Tertagih')},${totalReceivables},${escapeCSV('Kekurangan iuran yang belum lunas')}`);
    rows.push(`${escapeCSV('Kewajiban Honor Belum Dicairkan')},${totalPayables},${escapeCSV('Sisa honor guru belum dibayarkan')}`);
    rows.push('');

    // Section 2: Buku Mutasi Arus Kas Riil (Ledger)
    rows.push(escapeCSV('=== BUKU MUTASI ARUS KAS (JURNAL KAS MASUK & KELUAR) ==='));
    rows.push([
      escapeCSV('No'),
      escapeCSV('Tanggal'),
      escapeCSV('No Bukti'),
      escapeCSV('Arus'),
      escapeCSV('Kategori'),
      escapeCSV('Uraian Transaksi'),
      escapeCSV('Pihak Terkait'),
      escapeCSV('Metode Pembayaran'),
      escapeCSV('Kas Masuk (Rp)'),
      escapeCSV('Kas Keluar (Rp)')
    ].join(','));

    // Combine transactions
    const combined = [
      ...activeStudentPayments.map(p => {
        const st = students.find(s => s.id === p.studentId);
        return {
          date: p.date || p.paymentDate || '',
          docNo: p.paymentNumber || p.id,
          flow: 'KAS MASUK',
          category: 'Iuran Siswa',
          desc: `Pembayaran Iuran Les: ${st?.name || 'Siswa'}`,
          party: st?.name || '-',
          method: p.paymentMethod || 'TUNAI',
          inflow: p.amount || 0,
          outflow: 0
        };
      }),
      ...activeTeacherPayments.map(p => {
        const tc = teachers.find(t => t.id === p.teacherId);
        return {
          date: p.date || p.paymentDate || '',
          docNo: p.paymentNumber || p.id,
          flow: 'KAS KELUAR',
          category: 'Honor Guru',
          desc: `Pencairan Honor Tentor: ${tc?.name || 'Guru'} (${p.period || '-'})`,
          party: tc?.name || '-',
          method: p.paymentMethod || 'TRANSFER',
          inflow: 0,
          outflow: p.amount || 0
        };
      }),
      ...filteredExpenses.map(e => ({
        date: e.date || '',
        docNo: e.expenseNumber || e.id,
        flow: 'KAS KELUAR',
        category: `Operasional - ${e.category}`,
        desc: e.description || 'Pengeluaran operasional',
        party: e.recordedBy || 'Admin',
        method: e.paymentMethod || 'TUNAI',
        inflow: 0,
        outflow: e.amount || 0
      }))
    ].sort((a, b) => b.date.localeCompare(a.date));

    combined.forEach((tx, idx) => {
      rows.push([
        idx + 1,
        escapeCSV(tx.date),
        escapeCSV(tx.docNo),
        escapeCSV(tx.flow),
        escapeCSV(tx.category),
        escapeCSV(tx.desc),
        escapeCSV(tx.party),
        escapeCSV(tx.method),
        tx.inflow,
        tx.outflow
      ].join(','));
    });

    // Total row
    rows.push([
      escapeCSV('TOTAL'),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      totalCashInflow,
      totalCashOutflow
    ].join(','));

    rows.push('');

    // Section 3: Rincian Pengeluaran Operasional
    rows.push(escapeCSV('=== RINCIAN BEBAN OPERASIONAL LEMBAGA ==='));
    rows.push([
      escapeCSV('No'),
      escapeCSV('Tanggal'),
      escapeCSV('No Bukti'),
      escapeCSV('Kategori'),
      escapeCSV('Uraian Kebutuhan'),
      escapeCSV('Metode Pembayaran'),
      escapeCSV('Nominal (Rp)'),
      escapeCSV('Dicatat Oleh')
    ].join(','));

    filteredExpenses.forEach((exp, idx) => {
      rows.push([
        idx + 1,
        escapeCSV(exp.date),
        escapeCSV(exp.expenseNumber || exp.id),
        escapeCSV(exp.category),
        escapeCSV(exp.description),
        escapeCSV(exp.paymentMethod || 'TUNAI'),
        exp.amount,
        escapeCSV(exp.recordedBy || 'Admin')
      ].join(','));
    });

    const safeFilename = `Laporan_Keuangan_${period.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    downloadCSVFile(safeFilename, rows.join('\r\n'));
  },

  /**
   * 2. EKSPOR LAPORAN KEUANGAN BULANAN KE PDF
   */
  exportFinancialReportPDF(data: FinancialExportData) {
    const {
      period,
      settings,
      studentCharges,
      studentPayments,
      teacherHonors,
      teacherPayments,
      expenses,
      students,
      teachers
    } = data;

    // Filter by period
    const isPeriodMatch = (dateStr?: string, periodStr?: string) => {
      if (period === 'ALL') return true;
      if (periodStr && periodStr === period) return true;
      if (dateStr && dateStr.startsWith(period)) return true;
      return false;
    };

    const activeStudentPayments = studentPayments.filter(
      p => p.status !== 'DIBATALKAN' && p.status !== 'VOID' && isPeriodMatch(p.date || p.paymentDate)
    );

    const activeTeacherPayments = teacherPayments.filter(
      p => p.status !== 'DIBATALKAN' && p.status !== 'VOID' && isPeriodMatch(p.date || p.paymentDate, p.period)
    );

    const filteredCharges = studentCharges.filter(c => isPeriodMatch(c.date, c.period));
    const filteredHonors = teacherHonors.filter(h => period === 'ALL' || h.period === period);
    const filteredExpenses = expenses.filter(e => isPeriodMatch(e.date));

    // Totals
    const totalCashInflow = activeStudentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAccruedRevenue = filteredCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalTeacherHonorPaid = activeTeacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOperationalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCashOutflow = totalTeacherHonorPaid + totalOperationalExpenses;
    const netCashflow = totalCashInflow - totalCashOutflow;

    const totalAccruedTeacherHonor = filteredHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
    const netAccrualProfit = totalAccruedRevenue - totalAccruedTeacherHonor - totalOperationalExpenses;
    const totalReceivables = Math.max(0, totalAccruedRevenue - totalCashInflow);

    // Initialize jsPDF A4 portrait
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 14;

    // 1. KOP SURAT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 27, 75); // Dark Indigo
    doc.text((settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });

    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const addressLine = `${settings.address || 'Jl. Pendidikan No. 88'} • Telp: ${settings.phone || '0812-3456-7890'}`;
    doc.text(addressLine, pageWidth / 2, currentY, { align: 'center' });

    currentY += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistem Administrasi & Tata Kelola Keuangan Lembaga Bimbel', pageWidth / 2, currentY, { align: 'center' });

    currentY += 3;
    // Double line divider
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.line(14, currentY, pageWidth - 14, currentY);
    doc.setLineWidth(0.2);
    doc.line(14, currentY + 0.8, pageWidth - 14, currentY + 0.8);

    currentY += 8;

    // 2. JUDUL DOKUMEN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN KEUANGAN & ARUS KAS BULANAN', pageWidth / 2, currentY, { align: 'center' });

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const periodDisplay = period === 'ALL' ? 'Semua Periode Akumulatif' : `Periode: ${period}`;
    const printDate = `Dicetak: ${formatDateIndonesian(new Date().toISOString().split('T')[0])}`;
    doc.text(`${periodDisplay} | ${printDate}`, pageWidth / 2, currentY, { align: 'center' });

    currentY += 6;

    // 3. RINGKASAN EKSEKUTIF (TABEL HIGHLIGHT)
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['INDIKATOR ARUS KAS & LABA RUGI', 'NOMINAL (RP)', 'KETERANGAN ANALISIS']],
      body: [
        ['Total Penerimaan Kas (Siswa)', formatRupiah(totalCashInflow), 'Penerimaan kas riil masuk dari pembayaran SPP & paket siswa'],
        ['Total Kas Keluar (Honor + Operasional)', formatRupiah(totalCashOutflow), 'Total pencairan kas untuk gaji tentor dan biaya operasional'],
        ['  • Realisasi Pembayaran Honor Guru', formatRupiah(totalTeacherHonorPaid), 'Honor yang sudah ditransfer / dicairkan kepada guru'],
        ['  • Beban Pengeluaran Operasional', formatRupiah(totalOperationalExpenses), 'Biaya listrik, sewa, ATK modul, konsumsi, dan utilitas'],
        ['Arus Kas Bersih (Net Cash Flow)', formatRupiah(netCashflow), netCashflow >= 0 ? 'Surplus Kas Positif (Penerimaan > Pengeluaran)' : 'Defisit Arus Kas (Pengeluaran > Penerimaan)'],
        ['Total Tagihan Akrual Siswa', formatRupiah(totalAccruedRevenue), 'Kewajiban tagihan les yang terbit pada periode ini'],
        ['Total Beban Honor Guru (Akrual)', formatRupiah(totalAccruedTeacherHonor), 'Hak honor mengajar yang terakumulasi'],
        ['Estimasi Laba Bersih Akrual', formatRupiah(netAccrualProfit), 'Kinerja operasional bersih (Tagihan - Beban Honor - Beban Usaha)'],
        ['Sisa Piutang Siswa Belum Tertagih', formatRupiah(totalReceivables), 'Kekurangan bayar siswa yang masih dalam masa penagihan']
      ],
      headStyles: {
        fillColor: [49, 46, 129], // Indigo 900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', fontSize: 8 },
        1: { cellWidth: 42, halign: 'right', fontStyle: 'bold', fontSize: 8, textColor: [30, 41, 59] },
        2: { cellWidth: 'auto', fontSize: 7.5, textColor: [71, 85, 105] }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        cellPadding: 2.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;

    // 4. BUKU MUTASI ARUS KAS (JURNAL TRANSAKSI)
    const combinedTransactions = [
      ...activeStudentPayments.map(p => {
        const st = students.find(s => s.id === p.studentId);
        return {
          date: p.date || p.paymentDate || '',
          docNo: p.paymentNumber || '-',
          flow: 'MASUK',
          category: 'Iuran Siswa',
          desc: `Iuran: ${st?.name || 'Siswa'}`,
          method: p.paymentMethod || 'TUNAI',
          inflow: p.amount || 0,
          outflow: 0
        };
      }),
      ...activeTeacherPayments.map(p => {
        const tc = teachers.find(t => t.id === p.teacherId);
        return {
          date: p.date || p.paymentDate || '',
          docNo: p.paymentNumber || '-',
          flow: 'KELUAR',
          category: 'Honor Guru',
          desc: `Honor: ${tc?.name || 'Guru'}`,
          method: p.paymentMethod || 'TRANSFER',
          inflow: 0,
          outflow: p.amount || 0
        };
      }),
      ...filteredExpenses.map(e => ({
        date: e.date || '',
        docNo: e.expenseNumber || '-',
        flow: 'KELUAR',
        category: `Operasional`,
        desc: e.description || 'Beban operasional',
        method: e.paymentMethod || 'TUNAI',
        inflow: 0,
        outflow: e.amount || 0
      }))
    ].sort((a, b) => b.date.localeCompare(a.date));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('BUKU MUTASI ARUS KAS MASUK & KELUAR', 14, currentY);

    currentY += 2;

    const txBody = combinedTransactions.slice(0, 45).map((tx, idx) => [
      idx + 1,
      formatDateIndonesian(tx.date),
      tx.docNo,
      tx.category,
      tx.desc,
      tx.method,
      tx.inflow > 0 ? formatRupiah(tx.inflow) : '-',
      tx.outflow > 0 ? formatRupiah(tx.outflow) : '-'
    ]);

    // Summary footer row
    const footRow = [
      '',
      'TOTAL MUTASI KAS',
      '',
      '',
      '',
      '',
      formatRupiah(totalCashInflow),
      formatRupiah(totalCashOutflow)
    ];

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [['No', 'Tanggal', 'No. Bukti', 'Kategori', 'Keterangan Transaksi', 'Metode', 'Kas Masuk', 'Kas Keluar']],
      body: txBody,
      foot: [footRow],
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontSize: 7 },
        1: { cellWidth: 22, fontSize: 7 },
        2: { cellWidth: 22, fontStyle: 'bold', fontSize: 7 },
        3: { cellWidth: 24, fontSize: 7 },
        4: { cellWidth: 'auto', fontSize: 7 },
        5: { cellWidth: 18, halign: 'center', fontSize: 6.5 },
        6: { cellWidth: 24, halign: 'right', textColor: [4, 120, 87], fontStyle: 'bold', fontSize: 7 },
        7: { cellWidth: 24, halign: 'right', textColor: [185, 28, 28], fontStyle: 'bold', fontSize: 7 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: {
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    // Check if enough room for signature on current page; if not, add page
    if (currentY > doc.internal.pageSize.getHeight() - 45) {
      doc.addPage();
      currentY = 20;
    }

    // 5. LEMBAR PENGESAHAN / TANDA TANGAN
    const sigLeftX = 25;
    const sigRightX = pageWidth - 65;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    // Left Signature: Pimpinan
    doc.text('Mengetahui,', sigLeftX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text('Pimpinan / Direktur Lembaga', sigLeftX, currentY + 4);

    // Right Signature: Bagian Keuangan
    doc.setFont('helvetica', 'normal');
    const todayFormatted = formatDateIndonesian(new Date().toISOString().split('T')[0]);
    doc.text(`Dicetak pada: ${todayFormatted}`, sigRightX, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text('Bagian Administrasi Keuangan', sigRightX, currentY + 4);

    // Signature line
    currentY += 22;
    doc.text(`( ${settings.name || 'Pimpinan Bimbel'} )`, sigLeftX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Direktur / Pengelola Utama', sigLeftX, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text('( Staf Keuangan & Kasir )', sigRightX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Pelaksana Administrasi', sigRightX, currentY + 4);

    // 6. PAGE NUMBERING FOOTER
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Arsip Laporan Keuangan Bimbel - Halaman ${i} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    }

    const safeFilename = `Laporan_Keuangan_${period.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    doc.save(safeFilename);
  },

  /**
   * 3. EKSPOR REKAPITULASI SISWA & PIUTANG KE CSV
   */
  exportStudentReceivablesCSV(
    students: Student[],
    charges: StudentCharge[],
    payments: StudentPayment[],
    settings: InstitutionSetting
  ) {
    const rows: string[] = [];
    rows.push(escapeCSV(settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA'));
    rows.push(escapeCSV('REKAPITULASI PIUTANG & TAGIHAN SISWA'));
    rows.push(`${escapeCSV('Tanggal Cetak')},${escapeCSV(formatDateIndonesian(new Date().toISOString().split('T')[0]))}`);
    rows.push('');

    rows.push([
      escapeCSV('No'),
      escapeCSV('NIS'),
      escapeCSV('Nama Siswa'),
      escapeCSV('Kelas'),
      escapeCSV('Nama Orang Tua'),
      escapeCSV('No WhatsApp/Telp'),
      escapeCSV('Total Tagihan (Rp)'),
      escapeCSV('Sudah Dibayar (Rp)'),
      escapeCSV('Sisa Piutang (Rp)'),
      escapeCSV('Status Piutang')
    ].join(','));

    let totalAllCharged = 0;
    let totalAllPaid = 0;
    let totalAllRemaining = 0;

    students.forEach((s, idx) => {
      const studentCharges = charges.filter(c => c.studentId === s.id);
      const studentPayments = payments.filter(
        p => p.studentId === s.id && p.status !== 'DIBATALKAN' && p.status !== 'VOID'
      );

      const charged = studentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
      const paid = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, charged - paid);

      totalAllCharged += charged;
      totalAllPaid += paid;
      totalAllRemaining += remaining;

      const status = remaining === 0 && charged > 0 ? 'LUNAS' : remaining > 0 ? 'BELUM LUNAS' : 'TIDAK ADA TAGIHAN';

      rows.push([
        idx + 1,
        escapeCSV(s.nis),
        escapeCSV(s.name),
        escapeCSV(s.grade),
        escapeCSV(s.parentName || '-'),
        escapeCSV(s.parentPhone || s.phone || '-'),
        charged,
        paid,
        remaining,
        escapeCSV(status)
      ].join(','));
    });

    rows.push([
      escapeCSV('TOTAL'),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      totalAllCharged,
      totalAllPaid,
      totalAllRemaining,
      escapeCSV('')
    ].join(','));

    downloadCSVFile(`Rekap_Piutang_Siswa_${new Date().toISOString().split('T')[0]}.csv`, rows.join('\r\n'));
  },

  /**
   * 4. EKSPOR REKAPITULASI HONOR GURU KE CSV
   */
  exportTeacherHonorsCSV(
    teachers: Teacher[],
    honors: TeacherHonor[],
    payments: TeacherPayment[],
    settings: InstitutionSetting
  ) {
    const rows: string[] = [];
    rows.push(escapeCSV(settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA'));
    rows.push(escapeCSV('REKAPITULASI HONOR & PENGGAJIAN TENTOR'));
    rows.push(`${escapeCSV('Tanggal Cetak')},${escapeCSV(formatDateIndonesian(new Date().toISOString().split('T')[0]))}`);
    rows.push('');

    rows.push([
      escapeCSV('No'),
      escapeCSV('Kode Guru'),
      escapeCSV('Nama Guru'),
      escapeCSV('No HP/WA'),
      escapeCSV('Rekening Bank'),
      escapeCSV('Skema Honor'),
      escapeCSV('Total Hak Honor (Rp)'),
      escapeCSV('Honor Sudah Dibayar (Rp)'),
      escapeCSV('Sisa Belum Dibayar (Rp)'),
      escapeCSV('Status')
    ].join(','));

    let totalAllHonor = 0;
    let totalAllPaid = 0;
    let totalAllRemaining = 0;

    teachers.forEach((t, idx) => {
      const teacherHonors = honors.filter(h => h.teacherId === t.id);
      const teacherPayments = payments.filter(
        p => p.teacherId === t.id && p.status !== 'DIBATALKAN' && p.status !== 'VOID'
      );

      const honorSum = teacherHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
      const paidSum = teacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, honorSum - paidSum);

      totalAllHonor += honorSum;
      totalAllPaid += paidSum;
      totalAllRemaining += remaining;

      const bankInfo = t.bankName && t.bankAccountNumber ? `${t.bankName} - ${t.bankAccountNumber}` : '-';

      rows.push([
        idx + 1,
        escapeCSV(t.code),
        escapeCSV(t.name),
        escapeCSV(t.phone),
        escapeCSV(bankInfo),
        escapeCSV(t.honorScheme || 'PER_SISWA'),
        honorSum,
        paidSum,
        remaining,
        escapeCSV(remaining === 0 && honorSum > 0 ? 'LUNAS' : remaining > 0 ? 'TERTUNGGAK' : 'NIHIL')
      ].join(','));
    });

    rows.push([
      escapeCSV('TOTAL'),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      totalAllHonor,
      totalAllPaid,
      totalAllRemaining,
      escapeCSV('')
    ].join(','));

    downloadCSVFile(`Rekap_Honor_Guru_${new Date().toISOString().split('T')[0]}.csv`, rows.join('\r\n'));
  },

  /**
   * 5. EKSPOR REKAPITULASI BIAYA OPERASIONAL KE CSV
   */
  exportExpensesCSV(expenses: Expense[], settings: InstitutionSetting) {
    const rows: string[] = [];
    rows.push(escapeCSV(settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA'));
    rows.push(escapeCSV('REKAPITULASI PENGELUARAN OPERASIONAL'));
    rows.push(`${escapeCSV('Tanggal Cetak')},${escapeCSV(formatDateIndonesian(new Date().toISOString().split('T')[0]))}`);
    rows.push('');

    rows.push([
      escapeCSV('No'),
      escapeCSV('Tanggal'),
      escapeCSV('No Bukti'),
      escapeCSV('Kategori'),
      escapeCSV('Deskripsi Kebutuhan'),
      escapeCSV('Metode Pembayaran'),
      escapeCSV('Nominal (Rp)'),
      escapeCSV('Dicatat Oleh')
    ].join(','));

    let total = 0;
    expenses.forEach((e, idx) => {
      total += (e.amount || 0);
      rows.push([
        idx + 1,
        escapeCSV(e.date),
        escapeCSV(e.expenseNumber || e.id),
        escapeCSV(e.category),
        escapeCSV(e.description),
        escapeCSV(e.paymentMethod || 'TUNAI'),
        e.amount,
        escapeCSV(e.recordedBy || 'Admin')
      ].join(','));
    });

    rows.push([
      escapeCSV('TOTAL PENGELUARAN'),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      escapeCSV(''),
      total,
      escapeCSV('')
    ].join(','));

    downloadCSVFile(`Rekap_Pengeluaran_Operasional_${new Date().toISOString().split('T')[0]}.csv`, rows.join('\r\n'));
  },

  /**
   * 6. EKSPOR REKAPITULASI SISWA KE PDF
   */
  exportStudentReportPDF(
    students: Student[],
    charges: StudentCharge[],
    payments: StudentPayment[],
    settings: InstitutionSetting
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Kop
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 27, 75);
    doc.text((settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA').toUpperCase(), pageWidth / 2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${settings.address || 'Jl. Pendidikan No. 88'} • Telp: ${settings.phone || '0812-3456-7890'}`, pageWidth / 2, 19, { align: 'center' });

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(14, 22, pageWidth - 14, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN STATUS PIUTANG & ADMINISTRASI SISWA', pageWidth / 2, 29, { align: 'center' });

    const bodyData = students.map((s, idx) => {
      const studentCharges = charges.filter(c => c.studentId === s.id);
      const studentPayments = payments.filter(
        p => p.studentId === s.id && p.status !== 'DIBATALKAN' && p.status !== 'VOID'
      );
      const charged = studentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
      const paid = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, charged - paid);
      const status = remaining === 0 && charged > 0 ? 'LUNAS' : remaining > 0 ? 'BELUM LUNAS' : 'NIHIL';

      return [
        idx + 1,
        s.nis,
        s.name,
        s.grade,
        s.parentPhone || s.phone || '-',
        formatRupiah(charged),
        formatRupiah(paid),
        formatRupiah(remaining),
        status
      ];
    });

    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      head: [['No', 'NIS', 'Nama Siswa', 'Kelas', 'No WhatsApp', 'Tagihan', 'Dibayar', 'Sisa Piutang', 'Status']],
      body: bodyData,
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontSize: 7 },
        1: { cellWidth: 16, fontSize: 7 },
        2: { cellWidth: 38, fontStyle: 'bold', fontSize: 7 },
        3: { cellWidth: 20, fontSize: 7 },
        4: { cellWidth: 24, fontSize: 6.5 },
        5: { cellWidth: 22, halign: 'right', fontSize: 7 },
        6: { cellWidth: 22, halign: 'right', textColor: [4, 120, 87], fontSize: 7 },
        7: { cellWidth: 22, halign: 'right', textColor: [185, 28, 28], fontStyle: 'bold', fontSize: 7 },
        8: { cellWidth: 16, halign: 'center', fontSize: 6.5 }
      },
      styles: { cellPadding: 1.8, lineColor: [226, 232, 240], lineWidth: 0.2 }
    });

    doc.save(`Laporan_Piutang_Siswa_${new Date().toISOString().split('T')[0]}.pdf`);
  },

  /**
   * 7. EKSPOR REKAPITULASI GURU KE PDF
   */
  exportTeacherReportPDF(
    teachers: Teacher[],
    honors: TeacherHonor[],
    payments: TeacherPayment[],
    settings: InstitutionSetting
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 27, 75);
    doc.text((settings.name || 'BIMBINGAN BELAJAR EDU CENDIKIA').toUpperCase(), pageWidth / 2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${settings.address || 'Jl. Pendidikan No. 88'} • Telp: ${settings.phone || '0812-3456-7890'}`, pageWidth / 2, 19, { align: 'center' });

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(14, 22, pageWidth - 14, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('LAPORAN REKAPITULASI HONOR & PENGAJARAN GURU', pageWidth / 2, 29, { align: 'center' });

    const bodyData = teachers.map((t, idx) => {
      const teacherHonors = honors.filter(h => h.teacherId === t.id);
      const teacherPayments = payments.filter(
        p => p.teacherId === t.id && p.status !== 'DIBATALKAN' && p.status !== 'VOID'
      );
      const honorSum = teacherHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
      const paidSum = teacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const remaining = Math.max(0, honorSum - paidSum);
      const bankInfo = t.bankName && t.bankAccountNumber ? `${t.bankName} ${t.bankAccountNumber}` : '-';

      return [
        idx + 1,
        t.code,
        t.name,
        t.phone,
        bankInfo,
        t.honorScheme || 'PER_SISWA',
        formatRupiah(honorSum),
        formatRupiah(paidSum),
        formatRupiah(remaining)
      ];
    });

    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      head: [['No', 'Kode', 'Nama Tentor', 'No WhatsApp', 'Bank / Rekening', 'Skema', 'Total Honor', 'Terbayar', 'Sisa Honor']],
      body: bodyData,
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontSize: 7 },
        1: { cellWidth: 16, fontSize: 7 },
        2: { cellWidth: 38, fontStyle: 'bold', fontSize: 7 },
        3: { cellWidth: 22, fontSize: 6.5 },
        4: { cellWidth: 28, fontSize: 6.5 },
        5: { cellWidth: 18, halign: 'center', fontSize: 6.5 },
        6: { cellWidth: 22, halign: 'right', fontSize: 7 },
        7: { cellWidth: 22, halign: 'right', textColor: [4, 120, 87], fontSize: 7 },
        8: { cellWidth: 22, halign: 'right', textColor: [185, 28, 28], fontStyle: 'bold', fontSize: 7 }
      },
      styles: { cellPadding: 1.8, lineColor: [226, 232, 240], lineWidth: 0.2 }
    });

    doc.save(`Laporan_Honor_Guru_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};
