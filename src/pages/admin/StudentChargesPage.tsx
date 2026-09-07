import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Users,
  MessageSquare,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowUpDown,
  Phone,
  Copy,
  Check,
  Send,
  Sparkles,
  ChevronRight,
  TrendingUp,
  X,
  FileText,
  Clock,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian, formatDateTimeIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Student, StudentCharge, PaymentMethod } from '../../types';
import { wordExportService } from '../../services/wordExportService';

interface StudentChargesPageProps {
  onNavigate?: (page: string) => void;
}

export const StudentChargesPage: React.FC<StudentChargesPageProps> = ({ onNavigate }) => {
  const {
    studentCharges,
    students,
    meetings,
    programs,
    settings,
    studentPayments,
    recordStudentPayment,
    showToast
  } = useApp();

  // Mode Tampilan: 'by-student' (Rekap Per Siswa - nyaman) vs 'by-session' (Log Sesi Tagihan)
  const [viewMode, setViewMode] = useState<'by-student' | 'by-session'>('by-student');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<string>('ALL');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterSessionStatus, setFilterSessionStatus] = useState<string>('ALL');

  // Modal State
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [selectedStudentForWa, setSelectedStudentForWa] = useState<Student | null>(null);
  const [copiedWa, setCopiedWa] = useState(false);

  // Quick Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  // Totals
  const totalCharges = studentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPaid = studentCharges.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
  const totalUnpaid = Math.max(0, totalCharges - totalPaid);
  const collectionRate = totalCharges > 0 ? Math.round((totalPaid / totalCharges) * 100) : 100;

  const periods = Array.from(new Set(studentCharges.map(c => c.period || c.date.substring(0, 7)))).filter(Boolean);

  // Data per siswa yang sudah diagregasi
  const studentBillLedger = useMemo(() => {
    return students.map(std => {
      const charges = studentCharges.filter(c => c.studentId === std.id);
      const payments = studentPayments.filter(p => p.studentId === std.id);
      
      const tagihanTotal = charges.reduce((sum, c) => sum + (c.amount || 0), 0);
      const bayarTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const tunggakan = Math.max(0, tagihanTotal - bayarTotal);
      const sessionCount = charges.length;
      
      let statusTagihan: 'LUNAS' | 'BELUM_BAYAR' | 'SEBAGIAN' = 'LUNAS';
      if (tagihanTotal === 0) {
        statusTagihan = 'LUNAS';
      } else if (tunggakan === 0) {
        statusTagihan = 'LUNAS';
      } else if (bayarTotal > 0 && tunggakan > 0) {
        statusTagihan = 'SEBAGIAN';
      } else {
        statusTagihan = 'BELUM_BAYAR';
      }

      return {
        student: std,
        charges,
        payments,
        tagihanTotal,
        bayarTotal,
        tunggakan,
        sessionCount,
        statusTagihan
      };
    });
  }, [students, studentCharges, studentPayments]);

  // Siswa yang difilter
  const filteredStudentLedger = useMemo(() => {
    return studentBillLedger.filter(item => {
      const matchSearch =
        item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.student.parentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.student.grade || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        studentStatusFilter === 'ALL' ? true :
        studentStatusFilter === 'UNPAID' ? item.tunggakan > 0 && item.bayarTotal === 0 :
        studentStatusFilter === 'PARTIAL' ? item.statusTagihan === 'SEBAGIAN' :
        item.tunggakan === 0;

      const matchProgram =
        filterProgram === 'ALL' ? true :
        (item.student.programIds || []).includes(filterProgram);

      return matchSearch && matchStatus && matchProgram;
    });
  }, [studentBillLedger, searchQuery, studentStatusFilter, filterProgram]);

  // Log per sesi tagihan yang difilter
  const filteredSessionCharges = useMemo(() => {
    return studentCharges.filter(charge => {
      const student = students.find(s => s.id === charge.studentId);
      const meeting = meetings.find(m => m.id === charge.meetingId);

      const matchSearch =
        charge.chargeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student?.nis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (meeting?.meetingCode || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = filterSessionStatus === 'ALL' || charge.status === filterSessionStatus;
      const matchPeriod = filterPeriod === 'ALL' || (charge.period || charge.date.substring(0, 7)) === filterPeriod;

      return matchSearch && matchStatus && matchPeriod;
    });
  }, [studentCharges, students, meetings, searchQuery, filterSessionStatus, filterPeriod]);

  // Hitung jumlah siswa
  const countUnpaidStudents = studentBillLedger.filter(i => i.statusTagihan === 'BELUM_BAYAR').length;
  const countPartialStudents = studentBillLedger.filter(i => i.statusTagihan === 'SEBAGIAN').length;
  const countPaidStudents = studentBillLedger.filter(i => i.tagihanTotal > 0 && i.statusTagihan === 'LUNAS').length;
  const countStudentsWithDebt = studentBillLedger.filter(i => i.tunggakan > 0).length;

  // Handlers
  const handleOpenQuickPayment = (student: Student) => {
    const ledger = studentBillLedger.find(i => i.student.id === student.id);
    const sisa = ledger ? ledger.tunggakan : 0;
    setSelectedStudentForPayment(student);
    setPaymentAmount(sisa > 0 ? sisa : settings.studentRate);
    setPaymentMethod('TUNAI');
    setPaymentNotes('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleProcessQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;
    if (paymentAmount <= 0) {
      showToast('Nominal Tidak Valid', 'Masukkan nominal pembayaran lebih dari Rp 0.', 'warning');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await recordStudentPayment({
        studentId: selectedStudentForPayment.id,
        amount: Number(paymentAmount),
        paymentMethod,
        notes: paymentNotes || `Pembayaran tagihan bimbel ${selectedStudentForPayment.name}`,
        date: paymentDate
      });
      setSelectedStudentForPayment(null);
    } catch (err: any) {
      showToast('Gagal Memproses Pembayaran', err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleOpenWaMessage = (student: Student) => {
    setSelectedStudentForWa(student);
    setCopiedWa(false);
  };

  const generateWaText = (student: Student) => {
    const ledger = studentBillLedger.find(i => i.student.id === student.id);
    if (!ledger) return '';

    const attendedMeetings = ledger.charges.map((c, idx) => {
      const mtg = meetings.find(m => m.id === c.meetingId);
      const prog = programs.find(p => p.id === mtg?.programId);
      return `${idx + 1}. ${formatDateIndonesian(c.date)} - ${prog?.name || 'Bimbingan Belajar'}${mtg?.topic ? ` (${mtg.topic})` : ''}: ${formatRupiah(c.amount)}`;
    }).join('\n');

    return `*PEMBERITAHUAN TAGIHAN BIMBINGAN BELAJAR*
*${settings.institutionName || 'BIMBEL DIGITAL SMART'}*

Kepada Yth. Bapak/Ibu Wali dari Ananda:
*${student.name}* (NIS: ${student.nis} - ${student.grade})

Berikut kami sampaikan rincian tagihan sesi belajar yang telah dihadiri:

*Ringkasan Finansial:*
• Total Kehadiran: *${ledger.sessionCount} Sesi*
• Tarif per Sesi: *${formatRupiah(settings.studentRate)}*
• Total Akumulasi Tagihan: *${formatRupiah(ledger.tagihanTotal)}*
• Total Telah Dibayar: *${formatRupiah(ledger.bayarTotal)}*
• *Sisa Tunggakan Wajib Bayar: ${formatRupiah(ledger.tunggakan)}*

*Rincian Sesi Kehadiran:*
${attendedMeetings || '- Belum ada data kehadiran'}

*Rekening Pembayaran:*
Transfer dapat ditujukan ke rekening resmi bimbel atau dibayar tunai di kasir:
• *BCA/Mandiri/BRI:* a.n. ${settings.institutionName || 'Lembaga Bimbel'}

_Konfirmasi bukti transfer dapat dikirimkan ke nomor admin ini. Terima kasih atas perhatian dan kerja sama Bapak/Ibu._ 🙏`;
  };

  const handleCopyWaText = (student: Student) => {
    const text = generateWaText(student);
    navigator.clipboard.writeText(text);
    setCopiedWa(true);
    showToast('Teks WA Berhasil Disalin', 'Pesan tagihan siap ditempel (paste) ke chat WhatsApp wali murid.', 'success');
    setTimeout(() => setCopiedWa(false), 3000);
  };

  const handleSendWaDirect = (student: Student) => {
    const text = generateWaText(student);
    let phone = (student.parentPhone || student.studentPhone || '').trim();
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    phone = phone.replace(/[^0-9]/g, '');

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleExportStudentDoc = (student: Student) => {
    const ledger = studentBillLedger.find(i => i.student.id === student.id);
    if (!ledger) return;

    wordExportService.exportStudentBillingNoticeWord(
      student,
      ledger.charges,
      ledger.payments,
      meetings,
      programs,
      settings
    );
    showToast('Surat Tagihan Word Terunduh', `Surat tagihan untuk ${student.name} (.doc) berhasil diunduh.`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Receipt className="w-6 h-6 text-indigo-600" />
              <span>Pusat Tagihan &amp; Piutang Siswa</span>
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              Otomatis dari Absensi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola piutang, cek rincian kehadiran les ({formatRupiah(settings.studentRate)}/sesi hadir), dan catat pembayaran dengan mudah.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('student-payments')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-600" />
              <span>Riwayat Kuitansi</span>
            </button>
          )}

          <button
            onClick={() => {
              wordExportService.exportStudentReportWord(students, studentCharges, studentPayments, settings);
              showToast('Laporan Rekapitulasi Diunduh', 'Rekap tagihan seluruh siswa (.doc) berhasil diunduh.', 'success');
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Unduh rekap semua piutang siswa ke Microsoft Word"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Rekap Piutang (.doc)</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Finansial Tagihan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Tagihan Siswa
            </p>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(totalCharges)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
            <span>{studentCharges.length} akumulasi sesi</span>
            <span className="font-semibold text-indigo-600">{students.length} siswa</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Sudah Diterima (Lunas)
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-800 mt-1">{formatRupiah(totalPaid)}</p>
          <div className="flex items-center justify-between text-[11px] text-emerald-700 mt-1.5 pt-1.5 border-t border-emerald-100">
            <span>Tingkat Pelunasan</span>
            <span className="font-bold">{collectionRate}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Sisa Piutang / Tunggakan
            </p>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-700 mt-1">{formatRupiah(totalUnpaid)}</p>
          <div className="flex items-center justify-between text-[11px] text-rose-700 mt-1.5 pt-1.5 border-t border-rose-100">
            <span>Menunggu Pembayaran</span>
            <span className="font-bold">{countStudentsWithDebt} siswa</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Status Kelunasan Siswa
            </p>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-emerald-700">{countPaidStudents}</span>
            <span className="text-xs text-slate-500 font-medium">Lunas</span>
            <span className="text-slate-300">/</span>
            <span className="text-xl font-black text-amber-600">{countPartialStudents}</span>
            <span className="text-xs text-slate-500 font-medium">Sebagian</span>
            <span className="text-slate-300">/</span>
            <span className="text-xl font-black text-rose-600">{countUnpaidStudents}</span>
            <span className="text-xs text-slate-500 font-medium">Belum Bayar</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${students.length > 0 ? (countPaidStudents / students.length) * 100 : 0}%` }}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${students.length > 0 ? (countPartialStudents / students.length) * 100 : 0}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${students.length > 0 ? (countUnpaidStudents / students.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Switch Mode & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Switcher & Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* View Mode Toggle Button */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-fit">
            <button
              onClick={() => setViewMode('by-student')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'by-student'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rekap Piutang per Siswa ({students.length})</span>
            </button>
            <button
              onClick={() => setViewMode('by-session')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'by-session'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Log Sesi Kehadiran ({studentCharges.length})</span>
            </button>
          </div>

          {/* Status Quick Pills for Student Mode */}
          {viewMode === 'by-student' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setStudentStatusFilter('ALL')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer ${
                  studentStatusFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({students.length})
              </button>
              <button
                onClick={() => setStudentStatusFilter('UNPAID')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  studentStatusFilter === 'UNPAID'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span>Belum Bayar</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${studentStatusFilter === 'UNPAID' ? 'bg-rose-700' : 'bg-rose-200 text-rose-800'}`}>
                  {countUnpaidStudents}
                </span>
              </button>
              <button
                onClick={() => setStudentStatusFilter('PARTIAL')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  studentStatusFilter === 'PARTIAL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Sebagian (Cicil)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${studentStatusFilter === 'PARTIAL' ? 'bg-amber-700' : 'bg-amber-200 text-amber-800'}`}>
                  {countPartialStudents}
                </span>
              </button>
              <button
                onClick={() => setStudentStatusFilter('PAID')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  studentStatusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>Lunas</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${studentStatusFilter === 'PAID' ? 'bg-emerald-700' : 'bg-emerald-200 text-emerald-800'}`}>
                  {countPaidStudents}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                viewMode === 'by-student'
                  ? 'Cari nama siswa, NIS, kelas, atau nama wali murid...'
                  : 'Cari no tagihan, nama siswa, NIS, atau kode pertemuan...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            {viewMode === 'by-student' ? (
              <select
                value={filterProgram}
                onChange={e => setFilterProgram(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-semibold cursor-pointer"
              >
                <option value="ALL">Semua Program Belajar</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <select
                  value={filterSessionStatus}
                  onChange={e => setFilterSessionStatus(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-semibold cursor-pointer"
                >
                  <option value="ALL">Semua Status Tagihan</option>
                  <option value="BELUM_BAYAR">Belum Bayar</option>
                  <option value="SEBAGIAN">Sebagian</option>
                  <option value="LUNAS">Lunas</option>
                </select>

                <select
                  value={filterPeriod}
                  onChange={e => setFilterPeriod(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-semibold cursor-pointer"
                >
                  <option value="ALL">Semua Periode</option>
                  {periods.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: TAMPILAN REKAP PER SISWA (Buku Piutang & Tagihan yang Nyaman) */}
      {viewMode === 'by-student' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Daftar Piutang &amp; Tagihan Siswa</span>
                <span className="text-xs font-normal text-slate-500">
                  (Menampilkan {filteredStudentLedger.length} dari {students.length} siswa)
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              *Klik <strong>"Catat Bayar"</strong> untuk mencatat pelunasan langsung tanpa pindah halaman.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-center w-8">No</th>
                  <th className="px-4 py-3 font-semibold">Siswa / NIS</th>
                  <th className="px-4 py-3 font-semibold">Wali &amp; Kontak</th>
                  <th className="px-4 py-3 font-semibold text-center">Kehadiran</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Tagihan</th>
                  <th className="px-4 py-3 font-semibold text-right">Sudah Bayar</th>
                  <th className="px-4 py-3 font-semibold text-right">Sisa Tunggakan</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                  <th className="px-4 py-3 font-semibold text-center min-w-[200px]">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudentLedger.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada data siswa yang cocok dengan filter.</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau status filter di atas.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudentLedger.map((item, idx) => {
                    const hasTunggakan = item.tunggakan > 0;
                    return (
                      <tr
                        key={item.student.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          hasTunggakan ? 'bg-white' : 'bg-emerald-50/10'
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight hover:text-indigo-600 cursor-pointer" onClick={() => setSelectedStudentForDetail(item.student)}>
                                {item.student.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                                <span>{item.student.nis}</span>
                                <span>&bull;</span>
                                <span className="font-sans text-slate-600 font-medium">{item.student.grade}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800 leading-tight">
                            {item.student.parentName || '-'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.student.parentPhone || item.student.studentPhone || '-'}</span>
                          </p>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg font-bold text-slate-700 text-xs">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.sessionCount} Sesi</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                          {formatRupiah(item.tagihanTotal)}
                        </td>

                        <td className="px-4 py-3.5 text-right font-semibold text-emerald-700">
                          {formatRupiah(item.bayarTotal)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-black text-sm ${hasTunggakan ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatRupiah(item.tunggakan)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge status={item.statusTagihan} size="sm" />
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Tombol Catat Bayar Langsung */}
                            <button
                              onClick={() => handleOpenQuickPayment(item.student)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs ${
                                hasTunggakan
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title="Catat Pembayaran Masuk dari Siswa Ini"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{hasTunggakan ? 'Bayar' : '+ Bayar'}</span>
                            </button>

                            {/* Tombol Notifikasi Tagihan WA / Kirim Pengingat */}
                            <button
                              onClick={() => handleOpenWaMessage(item.student)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs ${
                                hasTunggakan
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                              title="Generate pesan WhatsApp dan kirim pengingat tagihan"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-600" />
                              <span>{hasTunggakan ? 'Kirim Pengingat' : 'Pesan WA'}</span>
                            </button>

                            {/* Tombol Rincian Sesi Kehadiran */}
                            <button
                              onClick={() => setSelectedStudentForDetail(item.student)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Lihat Rincian Sesi Pertemuan & Kuitansi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Unduh Surat Tagihan Word */}
                            <button
                              onClick={() => handleExportStudentDoc(item.student)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Unduh Lembar Tagihan Word (.doc)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: TAMPILAN LOG SESI KEHADIRAN (Transaction Audit Log) */}
      {viewMode === 'by-session' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Log Transaksi Tagihan per Sesi Kehadiran
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Setiap baris terbentuk otomatis saat guru melakukan absensi hadir di kelas.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl self-start sm:self-auto">
              Total {filteredSessionCharges.length} Tagihan Sesi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                  <th className="px-4 py-3.5 font-semibold">No. Tagihan</th>
                  <th className="px-4 py-3.5 font-semibold">Nama Siswa</th>
                  <th className="px-4 py-3.5 font-semibold">Tanggal Pertemuan</th>
                  <th className="px-4 py-3.5 font-semibold">Program / Sesi</th>
                  <th className="px-4 py-3.5 font-semibold">Tarif Sesi</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Nominal Tagihan</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Sudah Dibayar</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Sisa Tagihan</th>
                  <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessionCharges.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                      Tidak ditemukan data log tagihan yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredSessionCharges.map((chg, idx) => {
                    const student = students.find(s => s.id === chg.studentId);
                    const meeting = meetings.find(m => m.id === chg.meetingId);
                    const program = programs.find(p => p.id === meeting?.programId);

                    return (
                      <tr key={chg.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-900 whitespace-nowrap">
                          {chg.chargeNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">{student?.name || 'Siswa'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{student?.nis}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatDateIndonesian(chg.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          <p className="font-medium text-slate-800">{program?.name || 'Program Bimbel'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{meeting?.meetingCode}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {formatRupiah(chg.rateApplied || settings.studentRate)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(chg.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                          {formatRupiah(chg.paidAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                          <span className={chg.remainingAmount > 0 ? 'text-rose-600' : 'text-slate-600'}>
                            {formatRupiah(chg.remainingAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <StatusBadge status={chg.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: CATAT PEMBAYARAN CEPAT (Quick In-Page Payment) */}
      {selectedStudentForPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudentForPayment(null)}
          title={`Catat Pembayaran Masuk - ${selectedStudentForPayment.name}`}
          size="md"
        >
          {(() => {
            const ledger = studentBillLedger.find(i => i.student.id === selectedStudentForPayment.id);
            const tunggakan = ledger ? ledger.tunggakan : 0;
            const inputAmount = Number(paymentAmount) || 0;
            const projectedRemaining = Math.max(0, tunggakan - inputAmount);
            const isFullPayment = tunggakan > 0 && inputAmount >= tunggakan;
            const isPartialPayment = inputAmount > 0 && inputAmount < tunggakan;

            return (
              <form onSubmit={handleProcessQuickPayment} className="space-y-4">
                {/* Info Ringkas Siswa */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{selectedStudentForPayment.name}</p>
                    <p className="text-slate-500 font-mono">{selectedStudentForPayment.nis} &bull; {selectedStudentForPayment.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Total Sisa Tunggakan</p>
                    <p className="text-sm font-black text-rose-600">{formatRupiah(tunggakan)}</p>
                  </div>
                </div>

                {/* Input Tanggal & Metode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Pembayaran
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                    >
                      <option value="TUNAI">Tunai / Cash (Kasir)</option>
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="QRIS">QRIS / E-Wallet</option>
                    </select>
                  </div>
                </div>

                {/* Input Nominal dengan Shortcut */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
                    </label>
                    {tunggakan > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(tunggakan)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Lunasi Semua ({formatRupiah(tunggakan)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={paymentAmount || ''}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    placeholder="Contoh: 50000"
                    className="w-full px-3.5 py-2.5 text-base font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Shortcut:</span>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(settings.studentRate)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      1 Sesi ({formatRupiah(settings.studentRate)})
                    </button>
                    {tunggakan > settings.studentRate && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(settings.studentRate * 2)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        2 Sesi ({formatRupiah(settings.studentRate * 2)})
                      </button>
                    )}
                    {tunggakan > 0 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(tunggakan)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Pas Sisa Tunggakan ({formatRupiah(tunggakan)})
                      </button>
                    )}
                  </div>
                </div>

                {/* Simulasi Real-Time Status Pasca Pembayaran */}
                {inputAmount > 0 && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isFullPayment
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : isPartialPayment
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {isFullPayment ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span>Proyeksi Status Pembayaran:</span>
                      </span>
                      {isFullPayment ? (
                        <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-bold uppercase tracking-wider">
                          Lunas
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-600 text-white rounded-md text-[11px] font-bold uppercase tracking-wider">
                          Sebagian (Cicil)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50">
                      <span>Sisa Tunggakan Setelah Bayar Ini:</span>
                      <strong className={isFullPayment ? 'text-emerald-700' : 'text-amber-700'}>
                        {formatRupiah(projectedRemaining)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Catatan Tambahan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Contoh: Titipan orang tua via transfer BCA"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                {/* Info Alokasi Otomatis */}
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Alokasi Otomatis Sistem (FIFO)</span>
                  </p>
                  <p className="mt-0.5 text-indigo-800">
                    Pembayaran sebesar <strong>{formatRupiah(paymentAmount || 0)}</strong> akan otomatis melunasi tagihan pertemuan terlama yang belum lunas, menerbitkan nomor kuitansi resmi, dan memperbarui sisa piutang secara langsung.
                  </p>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForPayment(null)}
                    disabled={isSubmittingPayment}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment || paymentAmount <= 0}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmittingPayment ? 'Memproses...' : 'Simpan Pembayaran'}</span>
                  </button>
                </div>
              </form>
            );
          })()}
        </Modal>
      )}

      {/* MODAL 2: RINCIAN DETAIL KARTU PIUTANG SISWA */}
      {selectedStudentForDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudentForDetail(null)}
          title={`Rincian Tagihan & Kehadiran - ${selectedStudentForDetail.name}`}
          size="lg"
        >
          {(() => {
            const ledger = studentBillLedger.find(i => i.student.id === selectedStudentForDetail.id);
            if (!ledger) return null;

            return (
              <div className="space-y-4">
                {/* Header Siswa & Ringkasan */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-bold">
                          {selectedStudentForDetail.nis}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">{selectedStudentForDetail.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Kelas: {selectedStudentForDetail.grade} &bull; Wali: {selectedStudentForDetail.parentName || '-'} ({selectedStudentForDetail.parentPhone || '-'})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportStudentDoc(selectedStudentForDetail)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Word (.doc)</span>
                      </button>
                      <button
                        onClick={() => {
                          handleOpenQuickPayment(selectedStudentForDetail);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Catat Bayar</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-200/80">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Tagihan</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{formatRupiah(ledger.tagihanTotal)}</p>
                      <p className="text-[10px] text-slate-500">{ledger.sessionCount} Sesi</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Sudah Dibayar</p>
                      <p className="text-sm font-black text-emerald-700 mt-0.5">{formatRupiah(ledger.bayarTotal)}</p>
                      <p className="text-[10px] text-emerald-600">{ledger.payments.length} Kuitansi</p>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <p className="text-[10px] text-rose-600 font-bold uppercase">Sisa Tunggakan</p>
                      <p className="text-sm font-black text-rose-600 mt-0.5">{formatRupiah(ledger.tunggakan)}</p>
                      <p className="text-[10px] text-rose-500 font-bold">{ledger.tunggakan === 0 ? 'LUNAS' : 'Belum Lunas'}</p>
                    </div>
                  </div>
                </div>

                {/* Tabel 1: Daftar Sesi Kehadiran yang Ditagihkan */}
                <div>
                  <h5 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
                    <span>1. Rincian Sesi Kehadiran ({ledger.charges.length} Pertemuan)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Tarif: {formatRupiah(settings.studentRate)}/sesi</span>
                  </h5>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[9px] tracking-wider border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">No. Tagihan</th>
                          <th className="px-3 py-2">Tanggal</th>
                          <th className="px-3 py-2">Materi / Sesi</th>
                          <th className="px-3 py-2 text-right">Nominal</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ledger.charges.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-slate-400 text-xs">
                              Belum ada sesi kehadiran tercatat untuk siswa ini.
                            </td>
                          </tr>
                        ) : (
                          ledger.charges.map(chg => {
                            const mtg = meetings.find(m => m.id === chg.meetingId);
                            const prog = programs.find(p => p.id === mtg?.programId);
                            return (
                              <tr key={chg.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-800">{chg.chargeNumber}</td>
                                <td className="px-3 py-2 text-slate-600">{formatDateIndonesian(chg.date)}</td>
                                <td className="px-3 py-2 text-slate-800">
                                  <span className="font-semibold">{prog?.name || 'Sesi Les'}</span>
                                  {mtg?.topic && <span className="text-slate-500 text-[10px]"> - {mtg.topic}</span>}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-slate-900">{formatRupiah(chg.amount)}</td>
                                <td className="px-3 py-2 text-center">
                                  <StatusBadge status={chg.status} size="sm" />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabel 2: Riwayat Pembayaran Siswa */}
                <div>
                  <h5 className="font-bold text-slate-900 text-xs mb-2">
                    2. Riwayat Pembayaran Masuk ({ledger.payments.length} Kuitansi)
                  </h5>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[9px] tracking-wider border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">No. Kuitansi</th>
                          <th className="px-3 py-2">Tanggal Bayar</th>
                          <th className="px-3 py-2">Metode</th>
                          <th className="px-3 py-2 text-right">Jumlah Bayar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ledger.payments.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-slate-400 text-xs">
                              Belum ada pembayaran yang tercatat.
                            </td>
                          </tr>
                        ) : (
                          ledger.payments.map((pay, pIdx) => (
                            <tr key={pay.id ? `pay-${pay.id}-${pIdx}` : `pay-${pIdx}`} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-mono text-[11px] font-bold text-emerald-800">
                                {pay.paymentNumber || (pay as any).paymentCode || pay.id}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{formatDateIndonesian(pay.date)}</td>
                              <td className="px-3 py-2 text-slate-700 font-semibold">
                                {pay.paymentMethod ? pay.paymentMethod.replace(/_/g, ' ') : 'TUNAI'}
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-emerald-700">{formatRupiah(pay.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Modal */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenWaMessage(selectedStudentForDetail)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim Tagihan via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setSelectedStudentForDetail(null)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* MODAL 3: GENERATOR TEKS WHATSAPP TAGIHAN */}
      {selectedStudentForWa && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudentForWa(null)}
          title={`Pesan Penagihan WhatsApp - ${selectedStudentForWa.name}`}
          size="md"
        >
          <div className="space-y-3.5">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Format Pesan WhatsApp Ramah &amp; Siap Kirim</span>
              </p>
              <p className="mt-0.5 text-emerald-800 text-[11px]">
                Nomor Tujuan: <strong>{selectedStudentForWa.parentPhone || selectedStudentForWa.studentPhone || '(Nomor belum diisi)'}</strong> ({selectedStudentForWa.parentName || 'Wali Murid'})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preview Teks Pesan:
              </label>
              <textarea
                readOnly
                rows={12}
                value={generateWaText(selectedStudentForWa)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudentForWa(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyWaText(selectedStudentForWa)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  {copiedWa ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWa ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWaDirect(selectedStudentForWa)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Buka WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

