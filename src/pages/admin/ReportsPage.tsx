import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Users,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  Receipt,
  Award,
  Wallet,
  ArrowDownCircle,
  FileCheck,
  ChevronDown,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { wordExportService } from '../../services/wordExportService';
import { financialExportService } from '../../services/financialExportService';

interface ReportsPageProps {
  onNavigate?: (page: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const {
    students,
    teachers,
    meetings,
    meetingStudents,
    studentCharges,
    studentPayments,
    teacherHonors,
    teacherPayments,
    expenses,
    programs,
    settings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'financial' | 'students' | 'teachers' | 'meetings'>('financial');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-09');
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const [showPdfDropdown, setShowPdfDropdown] = useState<boolean>(false);
  const [showCsvDropdown, setShowCsvDropdown] = useState<boolean>(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [downloadFormatBadge, setDownloadFormatBadge] = useState<string>('Microsoft Word (.doc)');

  // Calculations for Financial Statement (Laba/Rugi Bimbel)
  const periodCharges = studentCharges.filter(c => c.date.startsWith(selectedPeriod));
  const periodPayments = studentPayments.filter(p => p.date.startsWith(selectedPeriod));
  const periodTeacherHonor = teacherHonors.filter(h => h.period.toLowerCase().includes('september'));
  const periodTeacherPayments = teacherPayments.filter(p => p.date.startsWith(selectedPeriod));
  const periodExpenses = expenses.filter(e => e.date.startsWith(selectedPeriod));

  const totalPendapatanKas = periodPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalAkrualTagihan = periodCharges.reduce((sum, c) => sum + c.amount, 0);
  const totalBebanHonor = periodTeacherHonor.reduce((sum, h) => sum + h.totalHonor, 0);
  const totalPengeluaranOperasional = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalBebanUsaha = totalBebanHonor + totalPengeluaranOperasional;
  const labaBersihKas = totalPendapatanKas - (periodTeacherPayments.reduce((sum, p) => sum + p.amount, 0) + totalPengeluaranOperasional);
  const labaBersihAkrual = totalAkrualTagihan - totalBebanUsaha;

  const triggerSuccess = (msg: string, badge: string = 'Microsoft Word (.doc)') => {
    setDownloadSuccessMsg(msg);
    setDownloadFormatBadge(badge);
    setTimeout(() => setDownloadSuccessMsg(null), 4000);
  };

  const handleExportCurrentTabPDF = () => {
    setShowPdfDropdown(false);
    if (activeTab === 'financial') {
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
      triggerSuccess('Laporan Keuangan & Laba Rugi (.pdf) berhasil diunduh', 'Adobe PDF (.pdf)');
    } else if (activeTab === 'students') {
      financialExportService.exportStudentReportPDF(students, studentCharges, studentPayments, settings);
      triggerSuccess('Laporan Rekapitulasi Siswa & Piutang (.pdf) berhasil diunduh', 'Adobe PDF (.pdf)');
    } else if (activeTab === 'teachers') {
      financialExportService.exportTeacherReportPDF(teachers, teacherHonors, teacherPayments, settings);
      triggerSuccess('Laporan Rekapitulasi Guru & Honor (.pdf) berhasil diunduh', 'Adobe PDF (.pdf)');
    } else {
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
      triggerSuccess('Laporan Keuangan (.pdf) berhasil diunduh', 'Adobe PDF (.pdf)');
    }
  };

  const handleExportCurrentTabCSV = () => {
    setShowCsvDropdown(false);
    if (activeTab === 'financial') {
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
      triggerSuccess('Laporan Keuangan & Mutasi Kas (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
    } else if (activeTab === 'students') {
      financialExportService.exportStudentReceivablesCSV(students, studentCharges, studentPayments, settings);
      triggerSuccess('Rekapitulasi Piutang & Tagihan Siswa (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
    } else if (activeTab === 'teachers') {
      financialExportService.exportTeacherHonorsCSV(teachers, teacherHonors, teacherPayments, settings);
      triggerSuccess('Rekapitulasi Honor & Penggajian Guru (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
    } else {
      financialExportService.exportExpensesCSV(expenses, settings);
      triggerSuccess('Rekapitulasi Pengeluaran Operasional (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
    }
  };

  const handleExportCurrentTabWord = () => {
    setShowExportDropdown(false);
    if (activeTab === 'financial') {
      wordExportService.exportFinancialReportWord(
        selectedPeriod,
        studentCharges,
        studentPayments,
        teacherHonors,
        teacherPayments,
        expenses,
        settings
      );
      triggerSuccess('Laporan Keuangan & Laba Rugi (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
    } else if (activeTab === 'students') {
      wordExportService.exportStudentReportWord(students, studentCharges, studentPayments, settings);
      triggerSuccess('Laporan Rekapitulasi Siswa & Piutang (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
    } else if (activeTab === 'teachers') {
      wordExportService.exportTeacherReportWord(teachers, teacherHonors, teacherPayments, settings);
      triggerSuccess('Laporan Rekapitulasi Kinerja & Honor Guru (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
    } else if (activeTab === 'meetings') {
      wordExportService.exportMeetingReportWord(meetings, programs, teachers, settings);
      triggerSuccess('Laporan Rekapitulasi Pertemuan (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
    }
  };

  const handleExportFullExecutiveReportWord = () => {
    setShowExportDropdown(false);
    wordExportService.exportExecutiveFullReportWord(
      selectedPeriod,
      students,
      teachers,
      meetings,
      programs,
      studentCharges,
      studentPayments,
      teacherHonors,
      teacherPayments,
      expenses,
      settings
    );
    triggerSuccess('Buku Laporan Eksekutif Lengkap (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
  };

  return (
    <div className="space-y-5">
      {/* Toast Feedback */}
      {downloadSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{downloadSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono font-bold">
            {downloadFormatBadge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span>Laporan Eksekutif & Keuangan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekapitulasi komprehensif data siswa, aktivitas guru, statistik pertemuan, dan laporan laba/rugi
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Export Button Group */}
          <div className="relative inline-flex rounded-xl shadow-xs">
            <button
              onClick={handleExportCurrentTabPDF}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-l-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh laporan aktif ke format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>
            <button
              onClick={() => {
                setShowPdfDropdown(!showPdfDropdown);
                setShowCsvDropdown(false);
                setShowExportDropdown(false);
              }}
              className="px-2 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-r-xl text-xs flex items-center transition-colors cursor-pointer border-l border-rose-500"
              title="Pilihan ekspor PDF"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {showPdfDropdown && (
              <div className="absolute right-0 mt-9 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Format Cetak Adobe PDF (.pdf)
                </div>

                <button
                  onClick={() => {
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
                    setShowPdfDropdown(false);
                    triggerSuccess('Laporan Keuangan & Laba Rugi (.pdf) berhasil diunduh', 'Adobe PDF (.pdf)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>1. Laporan Keuangan Bulanan (.pdf)</span>
                </button>

                <button
                  onClick={() => {
                    financialExportService.exportStudentReportPDF(students, studentCharges, studentPayments, settings);
                    setShowPdfDropdown(false);
                    triggerSuccess('Laporan Rekapitulasi Siswa & Piutang (.pdf) berhasil diunduh', 'Adobe PDF (.pdf)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>2. Rekapitulasi Piutang Siswa (.pdf)</span>
                </button>

                <button
                  onClick={() => {
                    financialExportService.exportTeacherReportPDF(teachers, teacherHonors, teacherPayments, settings);
                    setShowPdfDropdown(false);
                    triggerSuccess('Laporan Rekapitulasi Guru & Honor (.pdf) berhasil diunduh', 'Adobe PDF (.pdf)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>3. Rekap Kinerja & Honor Guru (.pdf)</span>
                </button>
              </div>
            )}
          </div>

          {/* CSV Export Button Group */}
          <div className="relative inline-flex rounded-xl shadow-xs">
            <button
              onClick={handleExportCurrentTabCSV}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-l-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh laporan aktif ke format CSV Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={() => {
                setShowCsvDropdown(!showCsvDropdown);
                setShowPdfDropdown(false);
                setShowExportDropdown(false);
              }}
              className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-xl text-xs flex items-center transition-colors cursor-pointer border-l border-emerald-500"
              title="Pilihan ekspor CSV"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {showCsvDropdown && (
              <div className="absolute right-0 mt-9 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Spreadsheet Excel (.csv)
                </div>

                <button
                  onClick={() => {
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
                    setShowCsvDropdown(false);
                    triggerSuccess('Laporan Keuangan & Mutasi Arus Kas (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 flex items-center gap-2.5 text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. Laporan Keuangan & Kas (.csv)</span>
                </button>

                <button
                  onClick={() => {
                    financialExportService.exportStudentReceivablesCSV(students, studentCharges, studentPayments, settings);
                    setShowCsvDropdown(false);
                    triggerSuccess('Rekapitulasi Piutang & Tagihan Siswa (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>2. Rekap Piutang Siswa (.csv)</span>
                </button>

                <button
                  onClick={() => {
                    financialExportService.exportTeacherHonorsCSV(teachers, teacherHonors, teacherPayments, settings);
                    setShowCsvDropdown(false);
                    triggerSuccess('Rekapitulasi Honor & Penggajian Guru (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>3. Rekap Honor Guru (.csv)</span>
                </button>

                <button
                  onClick={() => {
                    financialExportService.exportExpensesCSV(expenses, settings);
                    setShowCsvDropdown(false);
                    triggerSuccess('Rekapitulasi Pengeluaran Operasional (.csv) berhasil diunduh', 'Spreadsheet CSV (.csv)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 flex items-center gap-2.5 text-slate-800 font-medium transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>4. Rekap Biaya Operasional (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Word Export Button Group */}
          <div className="relative inline-flex rounded-xl shadow-xs">
            <button
              onClick={handleExportCurrentTabWord}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-l-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh laporan aktif ke format Microsoft Word (.doc)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Word</span>
            </button>
            <button
              onClick={() => {
                setShowExportDropdown(!showExportDropdown);
                setShowPdfDropdown(false);
                setShowCsvDropdown(false);
              }}
              className="px-2 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-r-xl text-xs flex items-center transition-colors cursor-pointer border-l border-indigo-500"
              title="Pilihan ekspor Word lainnya"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportDropdown && (
              <div className="absolute right-0 mt-9 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Pilih Berkas Word (.doc)
                </div>

                <button
                  onClick={handleExportFullExecutiveReportWord}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-2.5 text-indigo-900 font-bold transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <p className="font-bold">Buku Laporan Eksekutif Lengkap</p>
                    <p className="text-[10px] text-slate-500 font-normal">Gabungan Laba Rugi, Siswa, Guru &amp; Sesi</p>
                  </div>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={() => {
                    wordExportService.exportFinancialReportWord(
                      selectedPeriod,
                      studentCharges,
                      studentPayments,
                      teacherHonors,
                      teacherPayments,
                      expenses,
                      settings
                    );
                    setShowExportDropdown(false);
                    triggerSuccess('Laporan Keuangan & Laba Rugi (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. Laporan Laba / Rugi &amp; Arus Kas (.doc)</span>
                </button>

                <button
                  onClick={() => {
                    wordExportService.exportStudentReportWord(students, studentCharges, studentPayments, settings);
                    setShowExportDropdown(false);
                    triggerSuccess('Laporan Rekapitulasi Siswa (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>2. Rekapitulasi Siswa &amp; Piutang (.doc)</span>
                </button>

                <button
                  onClick={() => {
                    wordExportService.exportTeacherReportWord(teachers, teacherHonors, teacherPayments, settings);
                    setShowExportDropdown(false);
                    triggerSuccess('Laporan Rekapitulasi Guru (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>3. Rekap Kinerja &amp; Honor Guru (.doc)</span>
                </button>

                <button
                  onClick={() => {
                    wordExportService.exportMeetingReportWord(meetings, programs, teachers, settings);
                    setShowExportDropdown(false);
                    triggerSuccess('Laporan Rekapitulasi Pertemuan (.doc) berhasil diunduh', 'Microsoft Word (.doc)');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>4. Rekap Pertemuan &amp; Presensi (.doc)</span>
                </button>
              </div>
            )}
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('google-sheets')}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Buka Google Sheets untuk ekspor/impor spreadsheet langsung"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'financial'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Laporan Keuangan & Laba/Rugi
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Laporan Siswa & Piutang
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'teachers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Laporan Kinerja Guru & Honor
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'meetings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Laporan Rekap Pertemuan
        </button>
      </div>

      {/* TAB 1: LAPORAN KEUANGAN LABA / RUGI (Section AJ) */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Filter Periode:</span>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 cursor-pointer"
              >
                <option value="2026-09">September 2026</option>
                <option value="2026-08">Agustus 2026</option>
                <option value="2026-07">Juli 2026</option>
              </select>
            </div>

            <button
              onClick={() => {
                wordExportService.exportFinancialReportWord(
                  selectedPeriod,
                  studentCharges,
                  studentPayments,
                  teacherHonors,
                  teacherPayments,
                  expenses,
                  settings
                );
                triggerSuccess('Laporan Keuangan & Laba Rugi (.doc) berhasil diunduh');
              }}
              className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Laporan Laba Rugi Word (.doc)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold uppercase text-slate-400">Total Pendapatan Siswa (Akrual)</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{formatRupiah(totalAkrualTagihan)}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Dari absensi siswa hadir ({periodCharges.length} tagihan)</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-bold uppercase text-slate-400">Total Beban Usaha (Honor + Ops)</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{formatRupiah(totalBebanUsaha)}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Honor Tentor ({formatRupiah(totalBebanHonor)}) + Ops ({formatRupiah(totalPengeluaranOperasional)})</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/30">
              <p className="text-xs font-bold uppercase text-indigo-700">Estimasi Laba Bersih Operasional</p>
              <p className="text-2xl font-black text-indigo-950 mt-1">{formatRupiah(labaBersihAkrual)}</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">Margin Laba: {totalAkrualTagihan > 0 ? ((labaBersihAkrual / totalAkrualTagihan) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 text-xs">
            <div className="text-center border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">{settings.name}</h3>
              <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                Laporan Laba / Rugi & Arus Kas Bimbel
              </p>
              <p className="text-[11px] text-slate-500">Periode: September 2026</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4 font-mono">
              {/* Pendapatan */}
              <div>
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1 text-sm">
                  <span>I. PENDAPATAN JASA LES</span>
                  <span>{formatRupiah(totalAkrualTagihan)}</span>
                </div>
                <div className="pl-4 py-1 text-slate-600 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>• Tagihan Kehadiran Siswa ({periodCharges.length} sesi × {formatRupiah(settings.studentRate)})</span>
                    <span>{formatRupiah(totalAkrualTagihan)}</span>
                  </div>
                </div>
              </div>

              {/* Beban Usaha */}
              <div>
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1 text-sm">
                  <span>II. BEBAN OPERASIONAL & HONOR</span>
                  <span className="text-rose-600">({formatRupiah(totalBebanUsaha)})</span>
                </div>
                <div className="pl-4 py-1 text-slate-600 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>• Beban Honor Guru / Tentor</span>
                    <span>{formatRupiah(totalBebanHonor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Beban ATK & Modul Belajar</span>
                    <span>
                      {formatRupiah(
                        periodExpenses
                          .filter(e => e.category === 'ATK_DAN_MODUL')
                          .reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Beban Utilitas, Internet & Gedung</span>
                    <span>
                      {formatRupiah(
                        periodExpenses
                          .filter(e => e.category !== 'ATK_DAN_MODUL')
                          .reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Laba Bersih */}
              <div className="pt-3 border-t-2 border-slate-900 flex justify-between font-black text-sm text-slate-950 bg-slate-50 p-3 rounded-xl">
                <span>LABA BERSIH BULANAN (NET PROFIT)</span>
                <span className="text-emerald-700">{formatRupiah(labaBersihAkrual)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN SISWA (Section AG) */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Rekapitulasi Kehadiran & Piutang Siswa
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Total {students.length} Siswa Terdaftar
              </p>
            </div>

            <button
              onClick={() => {
                wordExportService.exportStudentReportWord(students, studentCharges, studentPayments, settings);
                triggerSuccess('Laporan Rekapitulasi Siswa (.doc) berhasil diunduh');
              }}
              className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Unduh Rekap Siswa Word (.doc)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                  <th className="px-4 py-3 font-semibold">NIS</th>
                  <th className="px-4 py-3 font-semibold">Kelas</th>
                  <th className="px-4 py-3 font-semibold text-center">Total Kehadiran (Hadir)</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Tagihan</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Bayar</th>
                  <th className="px-4 py-3 font-semibold text-right">Sisa Piutang</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(std => {
                  const charges = studentCharges.filter(c => c.studentId === std.id);
                  const payments = studentPayments.filter(p => p.studentId === std.id);
                  const totalTagihan = charges.reduce((sum, c) => sum + c.amount, 0);
                  const totalBayar = payments.reduce((sum, p) => sum + p.amount, 0);
                  const sisa = Math.max(0, totalTagihan - totalBayar);

                  return (
                    <tr key={std.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{std.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{std.nis}</td>
                      <td className="px-4 py-3 text-slate-700">{std.grade}</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-700">
                        {charges.length} sesi
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatRupiah(totalTagihan)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700">
                        {formatRupiah(totalBayar)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        {formatRupiah(sisa)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={sisa === 0 ? 'LUNAS' : 'BELUM_BAYAR'} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN GURU (Section AH) */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Rekapitulasi Jam Mengajar & Honor Guru
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Basis Hitung: {formatRupiah(settings.teacherRate)} / siswa-pertemuan
              </p>
            </div>

            <button
              onClick={() => {
                wordExportService.exportTeacherReportWord(teachers, teacherHonors, teacherPayments, settings);
                triggerSuccess('Laporan Rekapitulasi Guru (.doc) berhasil diunduh');
              }}
              className="px-3.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Unduh Rekap Guru Word (.doc)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nama Guru</th>
                  <th className="px-4 py-3 font-semibold">Kode Tentor</th>
                  <th className="px-4 py-3 font-semibold text-center">Pertemuan Terlaksana</th>
                  <th className="px-4 py-3 font-semibold text-center">Akumulasi Siswa-Pertemuan</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Hak Honor</th>
                  <th className="px-4 py-3 font-semibold text-right">Sudah Disalurkan</th>
                  <th className="px-4 py-3 font-semibold text-right">Sisa Kewajiban</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(tch => {
                  const honors = teacherHonors.filter(h => h.teacherId === tch.id);
                  const payments = teacherPayments.filter(p => p.teacherId === tch.id);
                  const totalHak = honors.reduce((sum, h) => sum + h.totalHonor, 0);
                  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
                  const sisa = Math.max(0, totalHak - totalPaid);
                  const totalStudentMeetings = honors.reduce((sum, h) => sum + h.studentMeetingCount, 0);
                  const totalMeetings = honors.reduce((sum, h) => sum + h.meetingCount, 0);

                  return (
                    <tr key={tch.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{tch.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{tch.code}</td>
                      <td className="px-4 py-3 text-center font-medium text-slate-800">
                        {totalMeetings} sesi
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-700">
                        {totalStudentMeetings}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatRupiah(totalHak)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700">
                        {formatRupiah(totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">
                        {formatRupiah(sisa)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={sisa === 0 ? 'LUNAS' : 'BELUM_DIBAYAR'} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN PERTEMUAN (Section AI) */}
      {activeTab === 'meetings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Rekapitulasi Pertemuan & Integrasi Kehadiran
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Total {meetings.length} Sesi Pertemuan
              </p>
            </div>

            <button
              onClick={() => {
                wordExportService.exportMeetingReportWord(meetings, programs, teachers, settings);
                triggerSuccess('Laporan Rekapitulasi Pertemuan (.doc) berhasil diunduh');
              }}
              className="px-3.5 py-1.5 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600" />
              <span>Unduh Rekap Pertemuan Word (.doc)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kode</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Program</th>
                  <th className="px-4 py-3 font-semibold">Guru Pengajar</th>
                  <th className="px-4 py-3 font-semibold text-center">Siswa Hadir</th>
                  <th className="px-4 py-3 font-semibold text-right">Tagihan Siswa</th>
                  <th className="px-4 py-3 font-semibold text-right">Honor Guru</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {meetings.map(m => {
                  const program = programs.find(p => p.id === m.programId);
                  const teacher = teachers.find(t => t.id === m.teacherId);
                  const tagihan = m.presentStudentCount * settings.studentRate;
                  const honor = m.presentStudentCount * settings.teacherRate;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">{m.meetingCode}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDateIndonesian(m.date)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{program?.name}</td>
                      <td className="px-4 py-3 text-slate-800">{teacher?.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">
                        {m.presentStudentCount} / {m.registeredStudentCount}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700">
                        {formatRupiah(tagihan)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-indigo-700">
                        {formatRupiah(honor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={m.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

