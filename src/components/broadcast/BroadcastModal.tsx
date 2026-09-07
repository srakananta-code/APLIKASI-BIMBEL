import React, { useState } from 'react';
import {
  Megaphone,
  Calendar,
  AlertTriangle,
  Clock,
  Send,
  Users,
  User,
  CheckCircle2,
  Sparkles,
  X,
  FileText,
  Bell,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { formatDateIndonesian } from '../../services/businessLogic';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'PENGUMUMAN' | 'PENGINGAT_JADWAL';
  defaultTeacherId?: string;
  defaultScheduleId?: string;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'PENGUMUMAN',
  defaultTeacherId = 'ALL',
  defaultScheduleId = ''
}) => {
  const {
    teachers,
    schedules,
    programs,
    broadcastAnnouncement
  } = useApp();

  const [category, setCategory] = useState<'PENGUMUMAN' | 'PENGINGAT_JADWAL' | 'SISTEM'>(defaultCategory);
  const [targetTeacherId, setTargetTeacherId] = useState<string>(defaultTeacherId);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(defaultScheduleId);
  const [priority, setPriority] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter active teachers
  const activeTeachers = teachers.filter(t => t.status === 'AKTIF');

  // Filter active schedules
  const activeSchedules = schedules.filter(s => s.status === 'AKTIF');

  // When schedule is chosen, automatically fill details
  const handleScheduleSelect = (schId: string) => {
    setSelectedScheduleId(schId);
    if (!schId) return;

    const sch = schedules.find(s => s.id === schId);
    if (!sch) return;

    const prog = programs.find(p => p.id === sch.programId);
    const teacher = teachers.find(t => t.id === sch.teacherId);

    // Auto set target teacher to the schedule's teacher if desired
    if (sch.teacherId) {
      setTargetTeacherId(sch.teacherId);
    }

    setCategory('PENGINGAT_JADWAL');
    setTitle(`Pengingat Jadwal Mengajar: ${prog?.name || 'Bimbel'} (${sch.dayOfWeek})`);
    setMessage(
      `Halo ${teacher?.name || 'Guru'}, ini pengingat untuk jadwal les ${prog?.name || ''} hari ${sch.dayOfWeek} pukul ${sch.startTime} - ${sch.endTime} WIB di ${sch.room}. Mohon hadir tepat waktu dan segera mengisi absensi siswa di dashboard setelah sesi berlangsung.`
    );
  };

  // Quick Template handler
  const applyTemplate = (type: string) => {
    switch (type) {
      case 'JADWAL_HARI_INI':
        setCategory('PENGINGAT_JADWAL');
        setPriority('IMPORTANT');
        setTitle('Pengingat Jadwal Mengajar & Absensi Hari Ini');
        setMessage(
          'Diberitahukan kepada seluruh Guru/Tentor yang memiliki sesi mengajar hari ini untuk hadir tepat waktu. Harap pastikan melakukan input absensi kehadiran siswa di portal guru segera setelah sesi selesai.'
        );
        break;
      case 'ABSENSI_SESI':
        setCategory('PENGINGAT_JADWAL');
        setPriority('IMPORTANT');
        setTitle('Penting: Mohon Lengkapi Absensi Sesi Les yang Telah Selesai');
        setMessage(
          'Bagi Guru/Tentor yang belum menyelesaikan input absensi siswa untuk sesi les sebelumnya, mohon segera melengkapinya agar perhitungan honor dan tagihan siswa dapat diproses otomatis oleh sistem.'
        );
        break;
      case 'PENYALURAN_HONOR':
        setCategory('PENGUMUMAN');
        setPriority('NORMAL');
        setTitle('Informasi Rekapitulasi & Penyaluran Honor Guru Periode Ini');
        setMessage(
          'Rekapitulasi honor mengajar periode ini telah diperbarui oleh pihak administrasi. Silakan periksa rincian honor di menu Honor Saya pada Dashboard Guru Anda masing-masing.'
        );
        break;
      case 'LIBUR_BIMBEL':
        setCategory('PENGUMUMAN');
        setPriority('IMPORTANT');
        setTitle('Pemberitahuan Hari Libur Kegiatan Belajar Mengajar');
        setMessage(
          'Diberitahukan bahwa seluruh kegiatan bimbingan belajar ditiadakan sehubungan dengan hari libur nasional. Jadwal les pengganti akan dikoordinasikan lebih lanjut.'
        );
        break;
      case 'URGENT_PERUBAHAN':
        setCategory('PENGUMUMAN');
        setPriority('URGENT');
        setTitle('Perhatian Mendesak: Penyesuaian Ruangan & Jadwal Les');
        setMessage(
          'Terdapat penyesuaian ruangan belajar untuk beberapa sesi kelas hari ini karena kegiatan pemeliharaan fasilitas. Mohon cek jadwal terupdate di aplikasi sebelum memulai pembelajaran.'
        );
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedSch = schedules.find(s => s.id === selectedScheduleId);
      const selectedProg = selectedSch ? programs.find(p => p.id === selectedSch.programId) : undefined;

      await broadcastAnnouncement({
        title: title.trim(),
        message: message.trim(),
        category,
        priority,
        targetTeacherId,
        scheduleId: selectedScheduleId || undefined,
        actionUrl: category === 'PENGINGAT_JADWAL' ? 'guru-attendance' : 'guru-dashboard',
        actionLabel: category === 'PENGINGAT_JADWAL' ? 'Buka Absensi / Jadwal' : 'Buka Dashboard Guru',
        metadata: selectedSch ? {
          room: selectedSch.room,
          time: `${selectedSch.startTime} - ${selectedSch.endTime}`,
          dayOfWeek: selectedSch.dayOfWeek,
          programName: selectedProg?.name
        } : undefined
      });

      // Reset & close
      setTitle('');
      setMessage('');
      setSelectedScheduleId('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetLabel = targetTeacherId === 'ALL'
    ? `Semua Guru Aktif (${activeTeachers.length} Guru)`
    : activeTeachers.find(t => t.id === targetTeacherId)?.name || 'Guru Terpilih';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Broadcast Pengumuman & Pengingat Guru"
      description="Kirim notifikasi in-app realtime langsung ke dashboard guru / tentor lembaga"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Category & Priority Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tipe Pesan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
              Tipe Pesan In-App
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('PENGUMUMAN')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  category === 'PENGUMUMAN'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <span>Pengumuman</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('PENGINGAT_JADWAL')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  category === 'PENGINGAT_JADWAL'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Pengingat Jadwal</span>
              </button>
            </div>
          </div>

          {/* Tingkat Prioritas */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
              Tingkat Urgensi
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPriority('NORMAL')}
                className={`py-2 px-1 text-center rounded-xl border cursor-pointer font-semibold transition-all ${
                  priority === 'NORMAL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority('IMPORTANT')}
                className={`py-2 px-1 text-center rounded-xl border cursor-pointer font-semibold transition-all ${
                  priority === 'IMPORTANT'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                }`}
              >
                Penting
              </button>
              <button
                type="button"
                onClick={() => setPriority('URGENT')}
                className={`py-2 px-1 text-center rounded-xl border cursor-pointer font-semibold transition-all ${
                  priority === 'URGENT'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                }`}
              >
                Mendesak
              </button>
            </div>
          </div>
        </div>

        {/* Target Recipient Selection */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[10px] tracking-wider">
            Penerima Notifikasi
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <select
                value={targetTeacherId}
                onChange={(e) => setTargetTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">📢 Siarkan ke Semua Guru Aktif ({activeTeachers.length} Guru)</option>
                <optgroup label="Pilih Guru Spesifik:">
                  {activeTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      👤 {t.name} ({t.code})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Optional Schedule Auto-Fill Selector */}
            <div>
              <select
                value={selectedScheduleId}
                onChange={(e) => handleScheduleSelect(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Kaitkan Jadwal Kelas (Opsional) --</option>
                {activeSchedules.map(sch => {
                  const prog = programs.find(p => p.id === sch.programId);
                  const tch = teachers.find(t => t.id === sch.teacherId);
                  return (
                    <option key={sch.id} value={sch.id}>
                      {sch.dayOfWeek} {sch.startTime} • {prog?.name} ({tch?.name?.split(' ')[0]})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Template Pills */}
        <div>
          <span className="block font-bold text-slate-600 mb-1.5 uppercase text-[10px] tracking-wider">
            Gunakan Template Cepat:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyTemplate('JADWAL_HARI_INI')}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-blue-200"
            >
              ⏰ Jadwal Mengajar Hari Ini
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('ABSENSI_SESI')}
              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-amber-200"
            >
              📝 Pengingat Input Absensi
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('PENYALURAN_HONOR')}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-emerald-200"
            >
              💰 Info Penyaluran Honor
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('LIBUR_BIMBEL')}
              className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-purple-200"
            >
              🏖️ Hari Libur Belajar
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('URGENT_PERUBAHAN')}
              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-rose-200"
            >
              ⚠️ Perubahan Ruangan/Jadwal
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Judul Notifikasi / Pengumuman <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Pengingat Mengajar Matematika SMA Hari Ini (Pukul 15:00)"
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Message Input */}
        <div>
          <label className="block font-bold text-slate-800 mb-1">
            Isi Pesan Notifikasi <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tuliskan pesan instruksi, jadwal, ruangan, atau pengumuman penting yang akan tampil di dashboard guru..."
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
          />
        </div>

        {/* Live Preview Card */}
        {title.trim() && (
          <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Preview Tampilan Notifikasi di Dashboard Guru:
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                priority === 'URGENT'
                  ? 'bg-rose-500 text-white'
                  : priority === 'IMPORTANT'
                  ? 'bg-amber-500 text-white'
                  : 'bg-indigo-500 text-white'
              }`}>
                {priority}
              </span>
            </div>
            <div className="p-3 bg-slate-800/90 rounded-lg border border-slate-700">
              <div className="flex items-start gap-2.5">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  category === 'PENGINGAT_JADWAL' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {category === 'PENGINGAT_JADWAL' ? <Clock className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-xs leading-snug">{title}</h4>
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span>Pengirim: Admin Lembaga</span>
                    <span>•</span>
                    <span>Tujuan: {targetLabel}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-xs"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !message.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer text-xs"
          >
            {isSubmitting ? (
              <span>Mengirimkan Broadcast...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Notifikasi ({targetLabel})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
