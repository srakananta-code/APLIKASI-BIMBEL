import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Printer,
  Calendar,
  CreditCard,
  Eye,
  Award,
  CheckCircle2,
  Download,
  AlertTriangle,
  Ban,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { Modal } from '../../components/common/Modal';
import { TeacherPayment, PaymentMethod } from '../../types';
import { wordExportService } from '../../services/wordExportService';

export const TeacherPaymentsPage: React.FC = () => {
  const {
    teacherPayments,
    teacherHonors,
    teachers,
    settings,
    recordTeacherPayment,
    voidTeacherPayment,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<TeacherPayment | null>(null);

  // Void State
  const [voidModalPayment, setVoidModalPayment] = useState<TeacherPayment | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    teacherId: '',
    period: 'September 2026',
    amount: 10000,
    paymentMethod: 'TRANSFER_BANK' as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePayments = teacherPayments.filter(p => p.status !== 'DIBATALKAN' && p.status !== 'VOID');
  const totalDisbursed = activePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayments = teacherPayments.filter(payment => {
    const teacher = teachers.find(t => t.id === payment.teacherId);
    const matchSearch =
      payment.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());

    const isVoid = payment.status === 'DIBATALKAN' || payment.status === 'VOID';
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'BERHASIL' && !isVoid) ||
      (filterStatus === 'DIBATALKAN' && isVoid);

    const matchMethod = filterMethod === 'ALL' || payment.paymentMethod === filterMethod;

    return matchSearch && matchStatus && matchMethod;
  });

  const handleOpenCreateModal = (preselectedTeacherId?: string) => {
    const teacherToUse = preselectedTeacherId || teachers[0]?.id || '';
    const teacherHonor = teacherHonors.find(
      h => h.teacherId === teacherToUse && h.period.includes('September')
    );

    setFormData({
      teacherId: teacherToUse,
      period: teacherHonor?.period || 'September 2026',
      amount: teacherHonor?.remainingAmount || 10000,
      paymentMethod: 'TRANSFER_BANK',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleTeacherSelectChange = (newTeacherId: string) => {
    const teacherHonor = teacherHonors.find(
      h => h.teacherId === newTeacherId && h.period.includes('September')
    );

    setFormData({
      ...formData,
      teacherId: newTeacherId,
      period: teacherHonor?.period || 'September 2026',
      amount: teacherHonor?.remainingAmount || 10000
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.teacherId) errors.teacherId = 'Pilih guru penerima honor';
    if (!formData.amount || formData.amount <= 0) errors.amount = 'Nominal pembayaran harus lebih dari 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await recordTeacherPayment({
        teacherId: formData.teacherId,
        period: formData.period,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        notes: formData.notes
      });
      setIsFormModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidModalPayment) return;
    if (!voidReason.trim()) {
      showToast('Alasan Diperlukan', 'Harap isi alasan pembatalan voucher honor.', 'warning');
      return;
    }

    setIsVoiding(true);
    try {
      const success = await voidTeacherPayment(voidModalPayment.id, voidReason);
      if (success) {
        setVoidModalPayment(null);
        setVoidReason('');
      }
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-indigo-600" />
            <span>Penyaluran Honor Guru (Kas Keluar)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Catat realisasi pembayaran honor kepada guru pengajar, generate voucher pembayaran, dan cetak slip honor
          </p>
        </div>

        <button
          onClick={() => handleOpenCreateModal()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Bayar Honor Guru</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-indigo-700 to-slate-800 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
            Total Kas Keluar untuk Honor Guru (Sah / Aktif)
          </p>
          <p className="text-2xl sm:text-3xl font-black mt-1">{formatRupiah(totalDisbursed)}</p>
          <p className="text-xs text-indigo-200 mt-1">
            Dari {activePayments.length} voucher transfer honor aktif
          </p>
        </div>
        <div className="p-3.5 bg-white/10 rounded-2xl border border-white/20">
          <Award className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari voucher nomor, nama guru, atau periode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Status Voucher</option>
            <option value="BERHASIL">Aktif / Berhasil</option>
            <option value="DIBATALKAN">Dibatalkan (VOID)</option>
          </select>

          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Metode</option>
            <option value="TRANSFER_BANK">Transfer Bank</option>
            <option value="TUNAI">Tunai / Cash</option>
            <option value="QRIS">QRIS</option>
            <option value="E_WALLET">E-Wallet</option>
          </select>
        </div>
      </div>

      {/* Table Pembayaran Honor Guru */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">No. Voucher</th>
                <th className="px-4 py-3.5 font-semibold">Tanggal Bayar</th>
                <th className="px-4 py-3.5 font-semibold">Nama Guru</th>
                <th className="px-4 py-3.5 font-semibold">Periode Honor</th>
                <th className="px-4 py-3.5 font-semibold">Metode Pembayaran</th>
                <th className="px-4 py-3.5 font-semibold">Diproses Oleh</th>
                <th className="px-4 py-3.5 font-semibold text-right">Nominal Dibayar</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi & Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((pay, idx) => {
                const teacher = teachers.find(t => t.id === pay.teacherId);
                const isVoid = pay.status === 'DIBATALKAN' || pay.status === 'VOID';

                return (
                  <tr
                    key={pay.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isVoid ? 'bg-slate-50/60 opacity-70' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-indigo-700 whitespace-nowrap">
                      {pay.paymentNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {formatDateIndonesian(pay.date || pay.paymentDate || '')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      <p className="leading-tight">{teacher?.name || 'Guru'}</p>
                      <p className="text-[10px] text-slate-400 font-normal">Kode: {teacher?.code}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {pay.period}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {pay.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {pay.processedBy}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap">
                      <span className={isVoid ? 'line-through text-slate-400' : 'text-indigo-700'}>
                        {formatRupiah(pay.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isVoid
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isVoid ? 'DIBATALKAN (VOID)' : 'BERHASIL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedVoucher(pay)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          title="Lihat Slip Honor"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Slip</span>
                        </button>

                        {!isVoid && (
                          <button
                            onClick={() => {
                              setVoidModalPayment(pay);
                              setVoidReason('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Batalkan Voucher (VOID)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BAYAR HONOR GURU */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !isSubmitting && setIsFormModalOpen(false)}
        title="Proses Pembayaran Honor Guru"
        description="Mencatat penyaluran honor dan memperbarui sisa hak honor guru"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Guru Penerima Honor *
            </label>
            <select
              value={formData.teacherId}
              onChange={e => handleTeacherSelectChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-medium text-slate-800"
            >
              {teachers.map(t => {
                const honor = teacherHonors.find(h => h.teacherId === t.id && h.period.includes('September'));
                const unpaid = honor?.remainingAmount || 0;
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) — Hak Honor Sisa: {formatRupiah(unpaid)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Periode Honor *
              </label>
              <input
                type="text"
                required
                value={formData.period}
                onChange={e => setFormData({ ...formData, period: e.target.value })}
                placeholder="Contoh: September 2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nominal Bayar (Rp) *
              </label>
              <input
                type="number"
                step="1000"
                min="1000"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-bold text-slate-900"
              />
              {formErrors.amount && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                <option value="TRANSFER_BANK">Transfer Bank</option>
                <option value="TUNAI">Tunai / Cash</option>
                <option value="QRIS">QRIS</option>
                <option value="E_WALLET">E-Wallet</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan / Referensi Transfer
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Transfer via BCA No. Ref 98218721"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proses & Terbitkan Slip Honor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* VOID CONFIRMATION MODAL */}
      {voidModalPayment && (
        <Modal
          isOpen={!!voidModalPayment}
          onClose={() => !isVoiding && setVoidModalPayment(null)}
          title="Batalkan Voucher Honor Guru (VOID)"
          description={`No. Voucher: ${voidModalPayment.paymentNumber} • Nominal: ${formatRupiah(voidModalPayment.amount)}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Konfirmasi Pembatalan Voucher</p>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Membatalkan voucher ini akan secara otomatis mengembalikan (roll back) status honor guru menjadi BELUM DIBAYAR / SEBAGIAN pada periode bersangkutan.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alasan Pembatalan / Koreksi <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="Misal: Salah nomor rekening transfer, revisi kehadiran kelas..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isVoiding}
                onClick={() => setVoidModalPayment(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isVoiding}
                onClick={handleConfirmVoid}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isVoiding ? <span>Membatalkan...</span> : <span>Batalkan Voucher Ini</span>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL SLIP HONOR RESMI */}
      {selectedVoucher && (
        <Modal
          isOpen={!!selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          title="Slip / Bukti Penyaluran Honor Mengajar"
          description={`No. Voucher: ${selectedVoucher.paymentNumber}`}
          maxWidth="md"
        >
          {(() => {
            const teacher = teachers.find(t => t.id === selectedVoucher.teacherId);
            const isVoid = selectedVoucher.status === 'DIBATALKAN' || selectedVoucher.status === 'VOID';

            return (
              <div className="space-y-4 text-xs">
                {/* Printable slip card */}
                <div className={`p-6 bg-slate-50 border-2 border-dashed ${isVoid ? 'border-rose-300' : 'border-slate-300'} rounded-2xl space-y-4 relative overflow-hidden`}>
                  {isVoid && (
                    <div className="absolute top-6 right-6 -rotate-12 px-4 py-1.5 border-2 border-rose-600 text-rose-600 font-black text-sm uppercase tracking-widest rounded-lg bg-rose-50/90 shadow-sm">
                      DIBATALKAN / VOID
                    </div>
                  )}

                  <div className="text-center border-b border-slate-200 pb-3">
                    <h3 className="text-base font-black text-slate-900">{settings.name}</h3>
                    <p className="text-[11px] text-slate-500">{settings.address} • Telp: {settings.phone}</p>
                    <p className="text-[10px] font-mono font-semibold text-indigo-700 mt-1">
                      SLIP PENCAIRAN HONOR: {selectedVoucher.paymentNumber}
                    </p>
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nama Guru / Tentor:</span>
                      <strong className="text-slate-900">{teacher?.name} ({teacher?.code})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Periode Mengajar:</span>
                      <span className="font-semibold text-slate-900">{selectedVoucher.period}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tanggal Pencairan:</span>
                      <span>{formatDateIndonesian(selectedVoucher.date || selectedVoucher.paymentDate || '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Metode Penyaluran:</span>
                      <span className="font-semibold">{selectedVoucher.paymentMethod.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rekening Tujuan:</span>
                      <span>{teacher?.bankInfo || 'Bank Transfer'}</span>
                    </div>
                    {isVoid && selectedVoucher.voidReason && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px]">
                        <strong>Alasan Pembatalan:</strong> {selectedVoucher.voidReason}
                      </div>
                    )}
                  </div>

                  <div className={`p-3 rounded-xl flex items-center justify-between ${
                    isVoid ? 'bg-rose-50 border border-rose-200' : 'bg-indigo-50 border border-indigo-200'
                  }`}>
                    <span className="font-bold text-slate-900 text-xs">TOTAL HONOR DIBAYAR:</span>
                    <span className={`text-lg font-black ${isVoid ? 'text-rose-800 line-through' : 'text-indigo-800'}`}>
                      {formatRupiah(selectedVoucher.amount)}
                    </span>
                  </div>

                  <div className="pt-3 flex justify-between items-end text-[11px] text-slate-500">
                    <div>
                      <p>Status: <strong className={isVoid ? 'text-rose-700' : 'text-emerald-700'}>
                        {isVoid ? 'VOUCHER DIBATALKAN' : 'DICAIRKAN & SAH'}
                      </strong></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Diproses oleh: {selectedVoucher.processedBy}</p>
                    </div>
                    <div className="text-center">
                      <p>Guru Pengajar,</p>
                      <p className="mt-8 font-bold text-slate-800 underline">{teacher?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (teacher) {
                        wordExportService.exportTeacherPaymentVoucherWord(selectedVoucher, teacher, settings);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Slip Word (.doc)</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
