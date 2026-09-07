import React, { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Award,
  Receipt,
  Calendar,
  Filter,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  PieChart,
  ArrowRight,
  Sparkles,
  Clock,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { wordExportService } from '../../services/wordExportService';
import { financialExportService } from '../../services/financialExportService';

interface FinancialSummaryPageProps {
  onNavigate?: (page: string) => void;
}

export const FinancialSummaryPage: React.FC<FinancialSummaryPageProps> = ({ onNavigate }) => {
  const {
    studentCharges,
    studentPayments,
    teacherHonors,
    teacherPayments,
    expenses,
    students,
    teachers,
    settings
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const triggerExportSuccess = (msg: string) => {
    setDownloadSuccessMsg(msg);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    financialExportService.exportFinancialReportPDF({
      period: selectedPeriod,
      settings,
      studentCharges,
      studentPayments,
      teacherHonors,
      teacherPayments,
      expenses,
      students,
      teachers
    });
    triggerExportSuccess(`Laporan Keuangan (${selectedPeriod === 'ALL' ? 'Semua Periode' : selectedPeriod}) format PDF berhasil diunduh`);
  };

  const handleExportCSV = () => {
    setShowExportMenu(false);
    financialExportService.exportFinancialReportCSV({
      period: selectedPeriod,
      settings,
      studentCharges,
      studentPayments,
      teacherHonors,
      teacherPayments,
      expenses,
      students,
      teachers
    });
    triggerExportSuccess(`Laporan Keuangan & Mutasi Kas (${selectedPeriod === 'ALL' ? 'Semua Periode' : selectedPeriod}) format CSV berhasil diunduh`);
  };

  const handleExportReceivablesCSV = () => {
    setShowExportMenu(false);
    financialExportService.exportStudentReceivablesCSV(students, studentCharges, studentPayments, settings);
    triggerExportSuccess('Rekapitulasi Piutang Siswa format CSV berhasil diunduh');
  };

  const handleExportHonorsCSV = () => {
    setShowExportMenu(false);
    financialExportService.exportTeacherHonorsCSV(teachers, teacherHonors, teacherPayments, settings);
    triggerExportSuccess('Rekapitulasi Honor Guru format CSV berhasil diunduh');
  };

  const handleExportExpensesCSV = () => {
    setShowExportMenu(false);
    financialExportService.exportExpensesCSV(expenses, settings);
    triggerExportSuccess('Rekapitulasi Pengeluaran Operasional format CSV berhasil diunduh');
  };

  // Extract available periods
  const chargePeriods = Array.from(new Set(studentCharges.map(c => c.period)));
  const honorPeriods = Array.from(new Set(teacherHonors.map(h => h.period)));
  const allPeriods = Array.from(new Set([...chargePeriods, ...honorPeriods])).filter(Boolean);

  // Filter helpers
  const filterByDateOrPeriod = (dateStr: string, periodStr?: string) => {
    if (selectedPeriod !== 'ALL') {
      if (periodStr && periodStr === selectedPeriod) return true;
      if (selectedPeriod.toLowerCase().includes('september') && dateStr.startsWith('2026-09')) return true;
      if (selectedPeriod.toLowerCase().includes('agustus') && dateStr.startsWith('2026-08')) return true;
      return false;
    }

    if (dateRange.start && dateStr < dateRange.start) return false;
    if (dateRange.end && dateStr > dateRange.end) return false;
    return true;
  };

  // Filtered collections (exclude VOID / DIBATALKAN for calculations)
  const activeStudentPayments = studentPayments.filter(
    p => p.status !== 'DIBATALKAN' && p.status !== 'VOID' && filterByDateOrPeriod(p.date || p.paymentDate || '')
  );

  const activeTeacherPayments = teacherPayments.filter(
    p => p.status !== 'DIBATALKAN' && p.status !== 'VOID' && filterByDateOrPeriod(p.date || p.paymentDate || '', p.period)
  );

  const filteredStudentCharges = studentCharges.filter(
    c => filterByDateOrPeriod(c.date, c.period)
  );

  const filteredTeacherHonors = teacherHonors.filter(
    h => selectedPeriod === 'ALL' || h.period === selectedPeriod
  );

  const filteredExpenses = expenses.filter(
    e => filterByDateOrPeriod(e.date)
  );

  // Core Financial Figures
  // 1. Cash Inflow (Kas Masuk Real)
  const totalCashInflow = activeStudentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // 2. Accrued Revenue (Tagihan Siswa)
  const totalAccruedRevenue = filteredStudentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalStudentReceivables = Math.max(0, totalAccruedRevenue - totalCashInflow);

  // 3. Cash Outflow (Kas Keluar Real: Honor Dibayar + Pengeluaran Operasional)
  const totalTeacherHonorPaid = activeTeacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOperationalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCashOutflow = totalTeacherHonorPaid + totalOperationalExpenses;

  // 4. Accrued Expenses (Beban Honor Guru Akrual)
  const totalAccruedTeacherHonor = filteredTeacherHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
  const totalTeacherHonorPayable = Math.max(0, totalAccruedTeacherHonor - totalTeacherHonorPaid);

  // 5. Net Profit Calculations
  // A. Net Cashflow = Real Cash In - Real Cash Out
  const netCashflow = totalCashInflow - totalCashOutflow;

  // B. Accrual Net Profit = Tagihan Siswa - Total Beban Honor - Operasional
  const netAccrualProfit = totalAccruedRevenue - totalAccruedTeacherHonor - totalOperationalExpenses;

  // Combine unified transactions feed for ledger audit
  const combinedTransactions = [
    ...activeStudentPayments.map(p => {
      const st = students.find(s => s.id === p.studentId);
      return {
        id: p.id,
        date: p.date || p.paymentDate || '',
        type: 'KAS_MASUK' as const,
        category: 'Iuran Siswa',
        title: `Pembayaran Siswa: ${st?.name || 'Siswa'}`,
        subtitle: `No. Kuitansi: ${p.paymentNumber} • Metode: ${p.paymentMethod}`,
        amount: p.amount,
        isInflow: true
      };
    }),
    ...activeTeacherPayments.map(p => {
      const tc = teachers.find(t => t.id === p.teacherId);
      return {
        id: p.id,
        date: p.date || p.paymentDate || '',
        type: 'KAS_KELUAR' as const,
        category: 'Honor Guru',
        title: `Pencairan Honor: ${tc?.name || 'Guru'}`,
        subtitle: `No. Voucher: ${p.paymentNumber} • Periode: ${p.period}`,
        amount: p.amount,
        isInflow: false
      };
    }),
    ...filteredExpenses.map(e => ({
      id: e.id,
      date: e.date,
      type: 'KAS_KELUAR' as const,
      category: `Operasional (${e.category})`,
      title: e.description,
      subtitle: `No. Bukti: ${e.expenseNumber} • Petugas: ${e.recordedBy}`,
      amount: e.amount,
      isInflow: false
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {downloadSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{downloadSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">
            Siap Diarsipkan
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <span>Rekapitulasi Keuangan & Arus Kas (Admin)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Laporan komprehensif pemasukan siswa, honor tentor, pengeluaran operasional, dan laba bersih
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ekspor PDF Button */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Ekspor Laporan Keuangan ke format PDF resmi untuk dicetak/diarsipkan"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor PDF (.pdf)</span>
          </button>

          {/* Ekspor CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Ekspor Rekap Keuangan & Arus Kas ke format CSV spreadsheet Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV (.csv)</span>
          </button>

          {/* Cetak Langsung */}
          <button
            onClick={() => window.print()}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak tampilan layar langsung"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Cetak</span>
          </button>

          {/* Opsi Ekspor Lainnya Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Menu arsip & ekspor lainnya"
            >
              <span>Opsi</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Arsip Format Spreadsheet (.csv)
                </div>

                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 flex items-center gap-2.5 text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">1. Rekap Arus Kas & Jurnal (.csv)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Mutasi kas masuk dan keluar periode aktif</p>
                  </div>
                </button>

                <button
                  onClick={handleExportReceivablesCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">2. Rekap Piutang Siswa (.csv)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Status tagihan, pembayaran &amp; sisa piutang</p>
                  </div>
                </button>

                <button
                  onClick={handleExportHonorsCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-amber-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">3. Rekap Honor Guru (.csv)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Hak honor, rekening bank &amp; status cair</p>
                  </div>
                </button>

                <button
                  onClick={handleExportExpensesCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">4. Rekap Biaya Operasional (.csv)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Daftar beban operasional dan rincian bukti</p>
                  </div>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Arsip Dokumen Resmi (.pdf)
                </div>

                <button
                  onClick={handleExportPDF}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 text-rose-900 font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <p className="font-bold">Laporan Keuangan Eksekutif (.pdf)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Format cetak A4 dengan Kop dan Pengesahan</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">Filter Periode:</span>
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium cursor-pointer"
          >
            <option value="ALL">Semua Periode Akumulatif</option>
            {allPeriods.map(period => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Tarif Siswa: <strong className="text-emerald-700">{formatRupiah(settings.studentRate)}</strong></span>
          <span>•</span>
          <span>Tarif Guru: <strong className="text-indigo-700">{formatRupiah(settings.teacherRate)}</strong></span>
        </div>
      </div>

      {/* HIGHLIGHT SUMMARY: NET CASHFLOW & MARGIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Net Cash Flow */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-indigo-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-400/30">
                Arus Kas Bersih (Real Cashflow)
              </span>
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              {formatRupiah(netCashflow)}
            </p>
            <p className="text-xs text-indigo-200 mt-1">
              Rumus: Total Kas Masuk ({formatRupiah(totalCashInflow)}) - Total Kas Keluar ({formatRupiah(totalCashOutflow)})
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-indigo-800/80 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-indigo-300 text-[10px] font-semibold uppercase">Kas Masuk Siswa</p>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">{formatRupiah(totalCashInflow)}</p>
            </div>
            <div>
              <p className="text-indigo-300 text-[10px] font-semibold uppercase">Kas Keluar Operasional+Honor</p>
              <p className="font-bold text-rose-300 text-sm mt-0.5">{formatRupiah(totalCashOutflow)}</p>
            </div>
          </div>
        </div>

        {/* Accrual Profit & Loss */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-emerald-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                Estimasi Laba Akrual (Accrual Profit)
              </span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              {formatRupiah(netAccrualProfit)}
            </p>
            <p className="text-xs text-emerald-200 mt-1">
              Rumus: Tagihan Siswa ({formatRupiah(totalAccruedRevenue)}) - Total Beban Honor ({formatRupiah(totalAccruedTeacherHonor)}) - Pengeluaran ({formatRupiah(totalOperationalExpenses)})
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-emerald-800/80 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-emerald-300 text-[10px] font-semibold uppercase">Pendapatan Sesi</p>
              <p className="font-bold text-emerald-300 text-xs mt-0.5">{formatRupiah(totalAccruedRevenue)}</p>
            </div>
            <div>
              <p className="text-emerald-300 text-[10px] font-semibold uppercase">Beban Honor Sesi</p>
              <p className="font-bold text-amber-300 text-xs mt-0.5">{formatRupiah(totalAccruedTeacherHonor)}</p>
            </div>
            <div>
              <p className="text-emerald-300 text-[10px] font-semibold uppercase">Pengeluaran Lain</p>
              <p className="font-bold text-rose-300 text-xs mt-0.5">{formatRupiah(totalOperationalExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED 6-CARD FINANCIAL BREAKDOWN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Kas Masuk Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Penerimaan Siswa (Kas Masuk)</span>
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totalCashInflow)}</p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dari {activeStudentPayments.length} Kuitansi</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('student-payments')}
                className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                Kuitansi <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Piutang Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">2. Piutang Siswa Belum Lunas</span>
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">{formatRupiah(totalStudentReceivables)}</p>
          <div className="mt-2 text-[11px] text-amber-700 flex items-center justify-between">
            <span>Tagihan dari sesi kehadiran</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('receivables')}
                className="text-amber-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                Detail Piutang <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Honor Sudah Dibayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Honor Guru Telah Dicairkan</span>
            <ArrowUpCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">{formatRupiah(totalTeacherHonorPaid)}</p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dari {activeTeacherPayments.length} Voucher Honor</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('teacher-payments')}
                className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                Voucher <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Hutang Honor Guru */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">4. Sisa Honor Belum Dibayar</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-rose-900 mt-2">{formatRupiah(totalTeacherHonorPayable)}</p>
          <div className="mt-2 text-[11px] text-rose-700 flex items-center justify-between">
            <span>Kewajiban aktif lembaga les</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('teacher-honor')}
                className="text-rose-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                Rekap Honor <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 5: Pengeluaran Operasional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">5. Beban Operasional Lain</span>
            <Receipt className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totalOperationalExpenses)}</p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Listrik, internet, ATK, modul</span>
            {onNavigate && (
              <button
                onClick={() => onNavigate('expenses')}
                className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                Pengeluaran <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 6: Total Beban Kas Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">6. Total Beban Kas Keluar</span>
            <ArrowUpCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totalCashOutflow)}</p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Honor Guru + Operasional</span>
            <span className="font-semibold text-slate-700">100% Tercatat</span>
          </div>
        </div>
      </div>

      {/* RECENT FINANCIAL TRANSACTIONS LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              Buku Kas Masuk & Keluar (Arus Kas Transaksi)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Histori kronologis seluruh transaksi pembayaran, honor guru, dan pengeluaran
            </p>
          </div>

          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
            {combinedTransactions.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Jenis Arus</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Keterangan / Transaksi</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal Masuk</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDateIndonesian(tx.date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.isInflow
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.isInflow ? '+ KAS MASUK' : '- KAS KELUAR'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                    {tx.category}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{tx.title}</p>
                    <p className="text-[10px] text-slate-400">{tx.subtitle}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                    {tx.isInflow ? formatRupiah(tx.amount) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-rose-700 whitespace-nowrap">
                    {!tx.isInflow ? formatRupiah(tx.amount) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
