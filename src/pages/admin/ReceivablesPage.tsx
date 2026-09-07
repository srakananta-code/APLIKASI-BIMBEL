import React, { useState } from 'react';
import {
  AlertCircle,
  Search,
  Filter,
  CreditCard,
  MessageCircle,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Users,
  Receipt,
  ArrowUpRight,
  Send,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Tag,
  Percent,
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian, calculateDiscount } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { PaymentMethod, Student } from '../../types';
import { wordExportService } from '../../services/wordExportService';

interface ReceivablesPageProps {
  onNavigate?: (page: string) => void;
}

export const ReceivablesPage: React.FC<ReceivablesPageProps> = ({ onNavigate }) => {
  const {
    students,
    studentCharges,
    programs,
    meetings,
    settings,
    createStudentCharge,
    deleteStudentCharge,
    recordStudentPayment,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // New Charge / Invoice Modal State
  const [isCreateChargeModalOpen, setIsCreateChargeModalOpen] = useState(false);
  const [chargeFormData, setChargeFormData] = useState({
    studentId: '',
    programId: '',
    billingModel: 'PAKET' as 'PER_PERTEMUAN' | 'PER_MINGGU' | 'PER_BULAN' | 'PAKET',
    packageName: 'Paket 12 Pertemuan 1 Bulan',
    packageSessions: 12,
    subtotal: 300000,
    discountType: 'NONE' as 'NONE' | 'NOMINAL' | 'PERSEN',
    discountValue: 0,
    discountReason: '',
    date: new Date().toISOString().split('T')[0],
    period: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    description: ''
  });

  // Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [payFormData, setPayFormData] = useState({
    amount: 0,
    paymentMethod: 'TRANSFER_BANK' as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingChargeId, setDeletingChargeId] = useState<string | null>(null);

  // WhatsApp Reminder Modal State
  const [reminderModalStudent, setReminderModalStudent] = useState<{
    student: Student;
    unpaidCharges: typeof studentCharges;
    totalUnpaid: number;
  } | null>(null);

  // Calculate receivables per student
  const studentReceivables = students.map(student => {
    const studentActiveCharges = studentCharges.filter(
      c => c.studentId === student.id
    );

    const unpaidCharges = studentActiveCharges.filter(
      c => (c.remainingAmount !== undefined ? c.remainingAmount : Math.max(0, c.amount - (c.paidAmount || 0))) > 0
    );

    const totalBilled = studentActiveCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalPaid = studentActiveCharges.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalUnpaid = unpaidCharges.reduce(
      (sum, c) => sum + (c.remainingAmount !== undefined ? c.remainingAmount : Math.max(0, c.amount - (c.paidAmount || 0))),
      0
    );

    const status = totalUnpaid === 0 ? 'LUNAS' : (totalPaid > 0 ? 'SEBAGIAN' : 'BELUM_BAYAR');

    return {
      student,
      unpaidCharges,
      allCharges: studentActiveCharges,
      totalBilled,
      totalPaid,
      totalUnpaid,
      status,
      unpaidCount: unpaidCharges.length
    };
  });

  // Filter only students with outstanding balance by default, unless searching
  const filteredReceivables = studentReceivables.filter(item => {
    const matchSearch =
      item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.student.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.student.parentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.student.parentPhone || '').includes(searchQuery);

    const matchProgram =
      filterProgram === 'ALL' ||
      item.student.programIds?.includes(filterProgram);

    const matchStatus =
      filterStatus === 'ALL'
        ? item.totalUnpaid > 0
        : (filterStatus === 'SEMUA_TERMASUK_LUNAS' ? true : item.status === filterStatus);

    return matchSearch && matchProgram && matchStatus;
  });

  // Totals
  const totalReceivables = studentReceivables.reduce((sum, item) => sum + item.totalUnpaid, 0);
  const studentsWithDebtCount = studentReceivables.filter(item => item.totalUnpaid > 0).length;
  const totalUnpaidSessions = studentReceivables.reduce((sum, item) => sum + item.unpaidCount, 0);

  const handleOpenPayModal = (student: Student, totalUnpaid: number) => {
    setSelectedStudentForPay(student);
    setPayFormData({
      amount: totalUnpaid > 0 ? totalUnpaid : settings.studentRate * 2,
      paymentMethod: 'TRANSFER_BANK',
      date: new Date().toISOString().split('T')[0],
      notes: `Pelunasan tagihan les ${student.name}`
    });
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;
    if (payFormData.amount <= 0) {
      showToast('Nominal Tidak Valid', 'Nominal pembayaran harus lebih besar dari 0.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordStudentPayment({
        studentId: selectedStudentForPay.id,
        amount: Number(payFormData.amount),
        paymentMethod: payFormData.paymentMethod,
        date: payFormData.date,
        notes: payFormData.notes
      });
      setIsPayModalOpen(false);
      setSelectedStudentForPay(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedDiscountInfo = calculateDiscount(
    Number(chargeFormData.subtotal) || 0,
    chargeFormData.discountType,
    Number(chargeFormData.discountValue) || 0
  );
  const netChargeTotal = calculatedDiscountInfo.finalPrice;

  const handleOpenCreateChargeModal = (preselectedStudentId?: string) => {
    const firstStudent = preselectedStudentId || students[0]?.id || '';
    setChargeFormData({
      studentId: firstStudent,
      programId: programs[0]?.id || '',
      billingModel: 'PAKET',
      packageName: 'Paket 12 Pertemuan 1 Bulan',
      packageSessions: 12,
      subtotal: 300000,
      discountType: 'NONE',
      discountValue: 0,
      discountReason: '',
      date: new Date().toISOString().split('T')[0],
      period: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      description: 'Paket bimbingan belajar reguler 12 sesi'
    });
    setIsCreateChargeModalOpen(true);
  };

  const handleCreateChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeFormData.studentId) {
      showToast('Pilih Siswa', 'Silakan pilih siswa yang akan ditagihkan.', 'warning');
      return;
    }
    if (chargeFormData.subtotal <= 0) {
      showToast('Nominal Tidak Valid', 'Subtotal tagihan harus lebih dari 0.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudentCharge({
        studentId: chargeFormData.studentId,
        programId: chargeFormData.programId || undefined,
        billingModel: chargeFormData.billingModel,
        packageName: chargeFormData.packageName || undefined,
        packageSessions: chargeFormData.packageSessions || undefined,
        subtotal: Number(chargeFormData.subtotal),
        discountType: chargeFormData.discountType,
        discountValue: Number(chargeFormData.discountValue) || 0,
        discountAmount: calculatedDiscountInfo.discountAmount,
        discountReason: chargeFormData.discountReason || undefined,
        amount: netChargeTotal,
        date: chargeFormData.date,
        period: chargeFormData.period,
        description: chargeFormData.description
      });
      setIsCreateChargeModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan/menghapus tagihan ini?')) return;
    setDeletingChargeId(chargeId);
    try {
      await deleteStudentCharge(chargeId);
    } finally {
      setDeletingChargeId(null);
    }
  };

  const generateReminderText = (item: {
    student: Student;
    unpaidCharges: typeof studentCharges;
    totalUnpaid: number;
  }) => {
    const orgName = settings.name || 'Bimbel Insan Cerdas';
    const dateFormatted = formatDateIndonesian(new Date().toISOString().split('T')[0]);
    const bankName = settings.bankName || 'BCA';
    const bankAccount = settings.bankAccountNumber || '8735-0921-88';
    const bankHolder = settings.bankAccountHolder || orgName;
    const dueDay = settings.billingDueDay || 10;
    const instructions = settings.billingInstructions || 'Mohon sertakan Nama & NIS siswa pada bukti transfer dan konfirmasi ke nomor administrasi ini.';

    // If custom template configured in SettingsPage
    if (settings.waBillingTemplate) {
      let templ = settings.waBillingTemplate;
      templ = templ.replace(/{nama_siswa}/g, item.student.name);
      templ = templ.replace(/{nis_siswa}/g, item.student.nis || '-');
      templ = templ.replace(/{kelas}/g, item.student.grade || '-');
      templ = templ.replace(/{nama_bimbel}/g, orgName);
      templ = templ.replace(/{tanggal}/g, dateFormatted);
      templ = templ.replace(/{jumlah_sesi}/g, String(item.unpaidCharges.length));
      templ = templ.replace(/{total_tagihan}/g, formatRupiah(item.totalUnpaid));
      templ = templ.replace(/{nama_bank}/g, bankName);
      templ = templ.replace(/{no_rekening}/g, bankAccount);
      templ = templ.replace(/{atas_nama}/g, bankHolder);
      templ = templ.replace(/{jatuh_tempo}/g, String(dueDay));
      templ = templ.replace(/{instruksi_pembayaran}/g, instructions);
      return templ;
    }

    return `Yth. Bapak/Ibu Wali dari *${item.student.name}* (NIS: ${item.student.nis}),

Salam hangat dari *${orgName}*.

Melalui pesan ini, kami menginformasikan rekapitulasi kewajiban tagihan les bimbingan belajar per tanggal *${dateFormatted}*:

• Nama Siswa: *${item.student.name}*
• Kelas: ${item.student.grade || '-'}
• Sesi Belum Lunas: ${item.unpaidCharges.length} Sesi Pertemuan
• *Total Piutang Belum Terbayar: ${formatRupiah(item.totalUnpaid)}*

💳 *Informasi Rekening Pembayaran:*
• Bank: *${bankName}*
• No. Rekening: *${bankAccount}*
• Atas Nama: *${bankHolder}*
• Jatuh Tempo: *Tanggal ${dueDay} setiap bulan*

${instructions}

Terima kasih atas perhatian dan kerja sama Bapak/Ibu.
_${orgName}_`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Teks Disalin', 'Pesan pengingat tagihan telah disalin ke clipboard.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <span>Manajemen Piutang & Tagihan Siswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring siswa yang memiliki tunggakan iuran les per sesi absensi hadir (<strong className="text-slate-900">{formatRupiah(settings.studentRate)} / pertemuan</strong>)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreateChargeModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Terbitkan Tagihan / Paket</span>
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('student-payments')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Semua Riwayat Kuitansi</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Total Piutang Belum Tertagih
          </p>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">
            {formatRupiah(totalReceivables)}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Akumulasi dari tagihan absensi siswa belum lunas
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Siswa dengan Tagihan Aktif
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {studentsWithDebtCount} <span className="text-sm font-normal text-slate-500">dari {students.length} Siswa</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Siswa yang memerlukan penagihan / follow up
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Sesi Belum Dibayar
          </p>
          <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">
            {totalUnpaidSessions} <span className="text-sm font-normal text-slate-500">Sesi Kehadiran</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dihitung otomatis per kehadiran siswa
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa, NIS, nama orang tua, nomor telepon..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Hanya yang Berhutang (Aktif)</option>
            <option value="BELUM_BAYAR">Belum Bayar Sama Sekali</option>
            <option value="SEBAGIAN">Bayar Sebagian (Partial)</option>
            <option value="SEMUA_TERMASUK_LUNAS">Tampilkan Semua Siswa</option>
          </select>

          <select
            value={filterProgram}
            onChange={e => setFilterProgram(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Receivables Student List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">
              Daftar Tagihan & Piutang Siswa
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {filteredReceivables.length} Siswa
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Klik baris untuk melihat rincian sesi yang belum terbayar
          </span>
        </div>

        {filteredReceivables.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-800 text-base">Tidak Ada Piutang Ditemukan</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || filterStatus !== 'ALL' || filterProgram !== 'ALL'
                ? 'Tidak ada siswa yang sesuai dengan filter pencarian.'
                : 'Semua siswa telah melunasi tagihan les! Tidak ada tunggakan aktif.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReceivables.map(item => {
              const isExpanded = expandedStudentId === item.student.id;
              const studentPrograms = programs.filter(p =>
                item.student.programIds?.includes(p.id)
              );

              return (
                <div key={item.student.id} className="transition-colors hover:bg-slate-50/50">
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Student Info */}
                    <div
                      className="flex-1 cursor-pointer flex items-start gap-3.5"
                      onClick={() => setExpandedStudentId(isExpanded ? null : item.student.id)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {item.student.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">{item.student.name}</h3>
                          <span className="text-xs text-slate-400 font-mono">({item.student.nis})</span>
                          <StatusBadge status={item.status} size="sm" />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span>{item.student.grade}</span>
                          <span>•</span>
                          <span>Wali: <strong className="text-slate-700">{item.student.parentName || '-'}</strong> ({item.student.parentPhone || item.student.phone || '-'})</span>
                          <span>•</span>
                          <span>Program: {studentPrograms.map(p => p.name).join(', ') || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Figures */}
                    <div className="flex items-center gap-6 self-end lg:self-auto">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Tagihan</p>
                        <p className="font-semibold text-slate-800 text-xs">{formatRupiah(item.totalBilled)}</p>
                        <p className="text-[10px] text-emerald-600">Terbayar: {formatRupiah(item.totalPaid)}</p>
                      </div>

                      <div className="text-right min-w-[130px]">
                        <p className="text-[11px] text-amber-700 font-semibold uppercase">Sisa Piutang</p>
                        <p className="font-black text-amber-900 text-base sm:text-lg">
                          {formatRupiah(item.totalUnpaid)}
                        </p>
                        <p className="text-[10px] text-amber-700 font-medium">
                          {item.unpaidCount} sesi belum lunas
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        {item.totalUnpaid > 0 && (
                          <>
                            <button
                              onClick={() => handleOpenPayModal(item.student, item.totalUnpaid)}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                              title="Catat Pembayaran Masuk"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Bayar</span>
                            </button>

                            <button
                              onClick={() => setReminderModalStudent(item)}
                              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              title="Kirim Pengingat Tagihan WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kirim Pengingat</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setExpandedStudentId(isExpanded ? null : item.student.id)}
                          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Lihat Detail Tagihan"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown Table */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                          Rincian Sesi Tagihan Absensi ({item.allCharges.length} Sesi)
                        </h4>
                        <span className="text-slate-500">
                          Tarif Sesi: {formatRupiah(settings.studentRate)}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/80 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="px-3.5 py-2.5 font-semibold">No. Invoice & Model</th>
                              <th className="px-3.5 py-2.5 font-semibold">Tanggal & Keterangan</th>
                              <th className="px-3.5 py-2.5 font-semibold">Periode</th>
                              <th className="px-3.5 py-2.5 font-semibold text-right">Rincian / Diskon</th>
                              <th className="px-3.5 py-2.5 font-semibold text-right">Tagihan Bersih</th>
                              <th className="px-3.5 py-2.5 font-semibold text-right">Sudah Dibayar</th>
                              <th className="px-3.5 py-2.5 font-semibold text-right">Sisa Tagihan</th>
                              <th className="px-3.5 py-2.5 font-semibold text-center">Status</th>
                              <th className="px-3.5 py-2.5 font-semibold text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.allCharges.map(charge => {
                              const isUnpaid = (charge.paidAmount || 0) === 0;
                              return (
                                <tr key={charge.id} className="hover:bg-slate-50">
                                  <td className="px-3.5 py-2 text-slate-800 text-[11px]">
                                    <span className="font-mono font-bold block">{charge.chargeNumber}</span>
                                    {charge.billingModel && (
                                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {charge.billingModel === 'PAKET'
                                          ? `Paket ${charge.packageSessions || ''} Sesi`
                                          : charge.billingModel === 'PER_BULAN'
                                          ? 'SPP Bulanan'
                                          : charge.billingModel === 'PER_MINGGU'
                                          ? 'Mingguan'
                                          : 'Per Sesi'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-700">
                                    <p className="font-medium">{formatDateIndonesian(charge.date)}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {charge.packageName || charge.description || 'Kehadiran Sesi Les'}
                                    </p>
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-600 font-medium">
                                    {charge.period}
                                  </td>
                                  <td className="px-3.5 py-2 text-right">
                                    {charge.discountAmount && charge.discountAmount > 0 ? (
                                      <div>
                                        <span className="line-through text-slate-400 text-[10px] block">
                                          {formatRupiah(charge.subtotal || (charge.amount + charge.discountAmount))}
                                        </span>
                                        <span className="text-[10px] font-semibold text-emerald-700">
                                          Diskon -{formatRupiah(charge.discountAmount)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">-</span>
                                    )}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-bold text-slate-900">
                                    {formatRupiah(charge.amount)}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-medium text-emerald-700">
                                    {formatRupiah(charge.paidAmount || 0)}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-bold">
                                    <span className={(charge.remainingAmount || 0) > 0 ? 'text-amber-700' : 'text-slate-400'}>
                                      {formatRupiah(charge.remainingAmount || 0)}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2 text-center">
                                    <StatusBadge status={charge.status} size="sm" />
                                  </td>
                                  <td className="px-3.5 py-2 text-center">
                                    {isUnpaid && (
                                      <button
                                        type="button"
                                        disabled={deletingChargeId === charge.id}
                                        onClick={() => handleDeleteCharge(charge.id)}
                                        className="p-1 rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                        title="Batalkan / Hapus Tagihan"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
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
            })}
          </div>
        )}
      </div>

      {/* QUICK PAYMENT MODAL */}
      {isPayModalOpen && selectedStudentForPay && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => !isSubmitting && setIsPayModalOpen(false)}
          title={`Catat Pembayaran: ${selectedStudentForPay.name}`}
          description={`NIS: ${selectedStudentForPay.nis} • Pembayaran akan otomatis dialokasikan ke tagihan terlama (FIFO)`}
          maxWidth="md"
        >
          <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nominal Pembayaran (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={payFormData.amount}
                  onChange={e => setPayFormData({ ...payFormData, amount: Number(e.target.value) })}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sistem otomatis mengalokasikan ke tagihan tertua terlebih dahulu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={payFormData.paymentMethod}
                  onChange={e => setPayFormData({ ...payFormData, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium text-slate-800"
                >
                  <option value="TRANSFER_BANK">Transfer Bank</option>
                  <option value="TUNAI">Tunai / Cash</option>
                  <option value="QRIS">QRIS</option>
                  <option value="E_WALLET">E-Wallet (GoPay/OVO/Dana)</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={payFormData.date}
                  onChange={e => setPayFormData({ ...payFormData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan / Keterangan Tambahan
              </label>
              <textarea
                rows={2}
                value={payFormData.notes}
                onChange={e => setPayFormData({ ...payFormData, notes: e.target.value })}
                placeholder="Misal: Titipan via orang tua..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* WHATSAPP REMINDER MODAL */}
      {reminderModalStudent && (
        <Modal
          isOpen={!!reminderModalStudent}
          onClose={() => setReminderModalStudent(null)}
          title={`Kirim Pengingat Tagihan: ${reminderModalStudent.student.name}`}
          description={`Wali: ${reminderModalStudent.student.parentName || '-'} • HP: ${reminderModalStudent.student.parentPhone || '-'}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
              <p className="font-bold flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Template Pesan Pengingat Tagihan Resmi
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Pesan ini telah diformat sopan, lengkap dengan rincian total piutang dan invoice sesi kehadiran les siswa.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Pratinjau Pesan WhatsApp:
              </label>
              <textarea
                readOnly
                rows={10}
                value={generateReminderText(reminderModalStudent)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed select-all"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(generateReminderText(reminderModalStudent))}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-300"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Teks Pesan</span>
              </button>

              <div className="flex items-center gap-2">
                {reminderModalStudent.student.parentPhone && (
                  <a
                    href={`https://wa.me/${reminderModalStudent.student.parentPhone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(generateReminderText(reminderModalStudent))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>Buka WhatsApp Web</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setReminderModalStudent(null)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CREATE CHARGE / INVOICE MODAL */}
      {isCreateChargeModalOpen && (
        <Modal
          isOpen={isCreateChargeModalOpen}
          onClose={() => !isSubmitting && setIsCreateChargeModalOpen(false)}
          title="Terbitkan Tagihan / Paket Bimbel Baru"
          description="Buat tagihan kustom untuk siswa, baik paket pertemuan, SPP bulanan, mingguan, lengkap dengan potongan diskon."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateChargeSubmit} className="space-y-4 text-xs">
            {/* PRESET TEMPLATES */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Pilihan Cepat Template Paket & Program</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    name: 'Paket 12 Sesi 1 Bulan',
                    model: 'PAKET',
                    sessions: 12,
                    price: 300000,
                    desc: 'Paket 12 pertemuan reguler 1 bulan'
                  },
                  {
                    name: 'Paket 8 Sesi Intensif',
                    model: 'PAKET',
                    sessions: 8,
                    price: 220000,
                    desc: 'Paket 8 pertemuan persiapan ujian'
                  },
                  {
                    name: 'SPP Bulanan Reguler',
                    model: 'PER_BULAN',
                    sessions: 1,
                    price: 180000,
                    desc: 'Biaya iuran belajar bulanan (SPP)'
                  },
                  {
                    name: 'Tagihan Mingguan (4 Sesi)',
                    model: 'PER_MINGGU',
                    sessions: 4,
                    price: 80000,
                    desc: 'Biaya les periode 1 minggu'
                  }
                ].map(preset => (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() =>
                      setChargeFormData({
                        ...chargeFormData,
                        packageName: preset.name,
                        billingModel: preset.model as any,
                        packageSessions: preset.sessions,
                        subtotal: preset.price,
                        description: preset.desc
                      })
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                  >
                    {preset.name} • {formatRupiah(preset.price)}
                  </button>
                ))}
              </div>
            </div>

            {/* STUDENT & PROGRAM SELECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={chargeFormData.studentId}
                  onChange={e => setChargeFormData({ ...chargeFormData, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                >
                  <option value="">-- Pilih Siswa Penerima Tagihan --</option>
                  {students
                    .filter(s => s.status === 'AKTIF')
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis}) • Kelas {s.grade}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Program Terkait (Opsional)
                </label>
                <select
                  value={chargeFormData.programId}
                  onChange={e => {
                    const prog = programs.find(p => p.id === e.target.value);
                    setChargeFormData({
                      ...chargeFormData,
                      programId: e.target.value,
                      subtotal: prog ? (prog.pricePerSession || chargeFormData.subtotal) : chargeFormData.subtotal
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                >
                  <option value="">-- Tidak Terikat Program Tertentu --</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) • {formatRupiah(p.pricePerSession || 0)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BILLING MODEL & PACKAGE SESSIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Siklus / Model Tagihan <span className="text-red-500">*</span>
                </label>
                <select
                  value={chargeFormData.billingModel}
                  onChange={e =>
                    setChargeFormData({
                      ...chargeFormData,
                      billingModel: e.target.value as any
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                >
                  <option value="PAKET">Paket Pertemuan (misal: 12 Sesi)</option>
                  <option value="PER_BULAN">Bulanan (SPP Bulanan Tetap)</option>
                  <option value="PER_MINGGU">Mingguan (Per Minggu)</option>
                  <option value="PER_PERTEMUAN">Per Pertemuan / Sesi</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Paket / Judul Tagihan
                </label>
                <input
                  type="text"
                  required
                  value={chargeFormData.packageName}
                  onChange={e => setChargeFormData({ ...chargeFormData, packageName: e.target.value })}
                  placeholder="Misal: Paket 12 Sesi 1 Bulan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kuota Sesi Pertemuan
                </label>
                <input
                  type="number"
                  min={1}
                  value={chargeFormData.packageSessions}
                  onChange={e =>
                    setChargeFormData({
                      ...chargeFormData,
                      packageSessions: Math.max(1, parseInt(e.target.value, 10) || 1)
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* SUBTOTAL & DISCOUNT */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Subtotal Harga Normal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={5000}
                    required
                    value={chargeFormData.subtotal}
                    onChange={e =>
                      setChargeFormData({
                        ...chargeFormData,
                        subtotal: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[100000, 180000, 220000, 300000, 450000, 600000].map(v => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setChargeFormData({ ...chargeFormData, subtotal: v })}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 cursor-pointer"
                      >
                        {formatRupiah(v)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Skema Diskon / Potongan
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                    {[
                      { id: 'NONE', label: 'Tanpa Diskon' },
                      { id: 'NOMINAL', label: 'Nominal (Rp)' },
                      { id: 'PERSEN', label: 'Persen (%)' }
                    ].map(d => (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() =>
                          setChargeFormData({
                            ...chargeFormData,
                            discountType: d.id as any,
                            discountValue: d.id === 'NONE' ? 0 : chargeFormData.discountValue
                          })
                        }
                        className={`py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer transition-colors ${
                          chargeFormData.discountType === d.id
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {chargeFormData.discountType !== 'NONE' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <input
                          type="number"
                          min={0}
                          value={chargeFormData.discountValue}
                          onChange={e =>
                            setChargeFormData({
                              ...chargeFormData,
                              discountValue: Number(e.target.value)
                            })
                          }
                          placeholder={chargeFormData.discountType === 'PERSEN' ? 'Contoh: 10%' : 'Contoh: 30000'}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={chargeFormData.discountReason}
                          onChange={e =>
                            setChargeFormData({
                              ...chargeFormData,
                              discountReason: e.target.value
                            })
                          }
                          placeholder="Alasan (Promo/Saudara)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* LIVE CALCULATION SUMMARY BANNER */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Kalkulasi Tagihan Bersih:</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600">Subtotal: {formatRupiah(chargeFormData.subtotal)}</span>
                    {calculatedDiscountInfo.discountAmount > 0 && (
                      <span className="text-emerald-600 font-semibold">
                        - Potongan Diskon: {formatRupiah(calculatedDiscountInfo.discountAmount)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Tagihan Bersih
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-700">
                    {formatRupiah(netChargeTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* DATE & PERIOD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Tagihan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={chargeFormData.date}
                  onChange={e =>
                    setChargeFormData({
                      ...chargeFormData,
                      date: e.target.value,
                      period: new Date(e.target.value).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Periode Tagihan
                </label>
                <input
                  type="text"
                  value={chargeFormData.period}
                  onChange={e => setChargeFormData({ ...chargeFormData, period: e.target.value })}
                  placeholder="Misal: Maret 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* NOTES */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan / Deskripsi Tambahan
              </label>
              <textarea
                rows={2}
                value={chargeFormData.description}
                onChange={e => setChargeFormData({ ...chargeFormData, description: e.target.value })}
                placeholder="Catatan tambahan untuk kuitansi / invoice..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsCreateChargeModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <span>Menerbitkan...</span>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    <span>Terbitkan Tagihan ({formatRupiah(netChargeTotal)})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
