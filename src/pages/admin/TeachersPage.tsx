import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Eye,
  Edit,
  Power,
  Phone,
  Mail,
  Award,
  Calendar,
  CalendarCheck,
  CreditCard,
  ChevronRight,
  BookOpen,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Landmark,
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Teacher } from '../../types';

export const TeachersPage: React.FC = () => {
  const {
    teachers,
    schedules,
    programs,
    students,
    meetings,
    meetingStudents,
    teacherHonors,
    teacherPayments,
    settings,
    createTeacher,
    updateTeacher,
    toggleTeacherStatus,
    setActiveRole
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<Teacher | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deactivatingTeacher, setDeactivatingTeacher] = useState<Teacher | null>(null);

  // Form State with Custom Honor & Bank
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    specializations: [] as string[],
    specInput: '',
    experienceLevel: 'STANDAR' as 'JUNIOR' | 'STANDAR' | 'SENIOR' | 'MASTER',
    honorScheme: 'PER_SISWA' as 'PER_SISWA' | 'PER_SESI' | 'BULANAN',
    monthlySalary: 1500000,
    isCustomHonor: false,
    customHonorRate: settings.teacherRate || 2000,
    transportFeePerMeeting: 0,
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountHolder: '',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredTeachers = teachers.filter(teacher => {
    const matchSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.specializations || teacher.specialtyPrograms || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = filterStatus === 'ALL' || teacher.status === filterStatus;
    const matchLevel = filterLevel === 'ALL' || (teacher.experienceLevel || 'STANDAR') === filterLevel;

    return matchSearch && matchStatus && matchLevel;
  });

  const handleOpenCreateModal = () => {
    const nextCode = `GUR-${String(teachers.length + 1).padStart(3, '0')}`;
    setEditingTeacher(null);
    setFormData({
      name: '',
      code: nextCode,
      phone: '',
      email: '',
      specializations: ['Matematika', 'IPA Terpadu'],
      specInput: '',
      experienceLevel: 'STANDAR',
      honorScheme: 'PER_SISWA',
      monthlySalary: 1500000,
      isCustomHonor: false,
      customHonorRate: settings.teacherRate || 2000,
      transportFeePerMeeting: 0,
      bankName: 'BCA',
      bankAccountNumber: '',
      bankAccountHolder: '',
      status: 'AKTIF',
      notes: ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    const hasCustomHonor =
      typeof teacher.customHonorRate === 'number' && teacher.customHonorRate !== settings.teacherRate;

    setFormData({
      name: teacher.name,
      code: teacher.code,
      phone: teacher.phone,
      email: teacher.email || '',
      specializations: teacher.specializations || teacher.specialtyPrograms || ['Umum'],
      specInput: '',
      experienceLevel: (teacher.experienceLevel as any) || 'STANDAR',
      honorScheme: teacher.honorScheme || 'PER_SISWA',
      monthlySalary: teacher.monthlySalary || 1500000,
      isCustomHonor: hasCustomHonor,
      customHonorRate: teacher.customHonorRate ?? settings.teacherRate ?? 2000,
      transportFeePerMeeting: teacher.transportFeePerMeeting || 0,
      bankName: teacher.bankName || 'BCA',
      bankAccountNumber: teacher.bankAccountNumber || '',
      bankAccountHolder: teacher.bankAccountHolder || teacher.name || '',
      status: teacher.status,
      notes: teacher.notes || ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleAddSpecialization = () => {
    if (formData.specInput.trim() && !formData.specializations.includes(formData.specInput.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, formData.specInput.trim()],
        specInput: ''
      });
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setFormData({
      ...formData,
      specializations: formData.specializations.filter(s => s !== spec)
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Nama guru wajib diisi';
    if (!formData.code.trim()) errors.code = 'Kode tentor wajib diisi';
    if (!formData.phone.trim()) errors.phone = 'No HP / WhatsApp wajib diisi';
    if (formData.specializations.length === 0) {
      errors.specializations = 'Minimal 1 mata pelajaran spesialisasi';
    }

    // Uniqueness
    const duplicate = teachers.find(
      t => t.code.trim().toLowerCase() === formData.code.trim().toLowerCase() && t.id !== editingTeacher?.id
    );
    if (duplicate) {
      errors.code = `Kode ${formData.code} sudah digunakan oleh ${duplicate.name}`;
    }

    if (formData.isCustomHonor && formData.customHonorRate < 0) {
      errors.customHonorRate = 'Honor guru tidak boleh negatif';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      specialtyPrograms: formData.specializations,
      specializations: formData.specializations,
      experienceLevel: formData.experienceLevel,
      honorScheme: formData.honorScheme,
      monthlySalary: formData.honorScheme === 'BULANAN' ? Number(formData.monthlySalary) : undefined,
      customHonorRate: formData.isCustomHonor ? Number(formData.customHonorRate) : undefined,
      transportFeePerMeeting: Number(formData.transportFeePerMeeting) || 0,
      bankName: formData.bankName.trim(),
      bankAccountNumber: formData.bankAccountNumber.trim(),
      bankAccountHolder: formData.bankAccountHolder.trim() || formData.name.trim(),
      status: formData.status,
      notes: formData.notes.trim()
    };

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, payload);
    } else {
      createTeacher(payload as any);
    }
    setIsFormModalOpen(false);
  };

  const getLevelBadge = (level?: string) => {
    switch (level) {
      case 'MASTER':
        return { label: 'Master Tentor', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'SENIOR':
        return { label: 'Senior Tentor', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'JUNIOR':
        return { label: 'Junior Tentor', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      default:
        return { label: 'Standar Tentor', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <span>Manajemen Guru / Tentor Bimbel</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data pengajar, skema honor per siswa, tunjangan transport, dan rekening transfer penggajian
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Guru & Tentor Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama guru, kode tentor, atau mata pelajaran..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Tingkat</option>
            <option value="STANDAR">Standar Tentor</option>
            <option value="SENIOR">Senior Tentor</option>
            <option value="MASTER">Master Tentor</option>
            <option value="JUNIOR">Junior Tentor</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Status: Aktif</option>
            <option value="NONAKTIF">Status: Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Guru dengan Skema Honor & Rekening */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">Nama Guru & Tingkat</th>
                <th className="px-4 py-3.5 font-semibold">Kode</th>
                <th className="px-4 py-3.5 font-semibold">Skema Honor Tentor</th>
                <th className="px-4 py-3.5 font-semibold">Rekening Penggajian</th>
                <th className="px-4 py-3.5 font-semibold text-center">Jadwal</th>
                <th className="px-4 py-3.5 font-semibold text-center">Sesi Selesai</th>
                <th className="px-4 py-3.5 font-semibold text-right">Total Honor</th>
                <th className="px-4 py-3.5 font-semibold text-right">Sisa Honor</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher, idx) => {
                const teacherSchedules = schedules.filter(s => s.teacherId === teacher.id && s.status === 'AKTIF');
                const teacherMeetings = meetings.filter(m => m.teacherId === teacher.id && m.status === 'SELESAI');

                const honors = teacherHonors.filter(h => h.teacherId === teacher.id);
                const payments = teacherPayments.filter(p => p.teacherId === teacher.id);

                const totalHonor = honors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
                const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                const sisaHonor = Math.max(0, totalHonor - totalPaid);

                const levelBadge = getLevelBadge(teacher.experienceLevel);
                const hasCustomHonor = typeof teacher.customHonorRate === 'number' && teacher.customHonorRate > 0;
                const effectiveRate = teacher.customHonorRate || settings.teacherRate;

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {teacher.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900">{teacher.name}</p>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${levelBadge.color}`}>
                              {levelBadge.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {teacher.phone} {teacher.email ? `• ${teacher.email}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                      {teacher.code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        {teacher.honorScheme === 'BULANAN' ? (
                          <>
                            <span className="font-bold text-indigo-700">
                              {formatRupiah(teacher.monthlySalary || 1500000)} <span className="text-[10px] font-normal text-slate-500">/ bulan</span>
                            </span>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 w-fit mt-0.5">
                              Gaji Bulanan Tetap
                            </span>
                          </>
                        ) : teacher.honorScheme === 'PER_SESI' ? (
                          <>
                            <span className="font-bold text-indigo-700">
                              {formatRupiah(effectiveRate)} <span className="text-[10px] font-normal text-slate-500">/ sesi flat</span>
                            </span>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 w-fit mt-0.5">
                              Flat per Pertemuan
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-indigo-700">
                              {formatRupiah(effectiveRate)} <span className="text-[10px] font-normal text-slate-500">/ siswa-sesi</span>
                            </span>
                            {hasCustomHonor ? (
                              <span className="text-[10px] text-purple-700 font-medium">
                                ★ Honor Khusus Tentor
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Ikuti Master Bimbel
                              </span>
                            )}
                          </>
                        )}
                        {teacher.transportFeePerMeeting ? (
                          <span className="text-[9px] text-slate-500">
                            + Transport: {formatRupiah(teacher.transportFeePerMeeting)}/sesi
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {teacher.bankAccountNumber ? (
                        <div>
                          <p className="font-bold text-slate-900">{teacher.bankName} {teacher.bankAccountNumber}</p>
                          <p className="text-[10px] text-slate-500">a.n. {teacher.bankAccountHolder || teacher.name}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum diisi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-slate-800">
                      {teacherSchedules.length} kelas
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap font-medium text-slate-800">
                      {teacherMeetings.length} sesi
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-slate-900">
                      {formatRupiah(totalHonor)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-bold">
                      <span className={sisaHonor > 0 ? 'text-amber-600' : 'text-slate-600'}>
                        {formatRupiah(sisaHonor)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={teacher.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedTeacherDetail(teacher)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Lihat Detail Guru & Finansial"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(teacher)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Data & Honor Guru"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (teacher.status === 'AKTIF') {
                              setDeactivatingTeacher(teacher);
                            } else {
                              toggleTeacherStatus(teacher.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            teacher.status === 'AKTIF'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={teacher.status === 'AKTIF' ? 'Nonaktifkan Guru' : 'Aktifkan Guru'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveRole('GURU', teacher.id)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Masuk ke Dashboard Guru Ini"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAIL TEACHER MODAL */}
      {/* ========================================================================= */}
      {selectedTeacherDetail && (
        <Modal
          isOpen={!!selectedTeacherDetail}
          onClose={() => setSelectedTeacherDetail(null)}
          title={`Detail Pengajar: ${selectedTeacherDetail.name}`}
          description={`Kode: ${selectedTeacherDetail.code} • ${selectedTeacherDetail.experienceLevel || 'Standar'} Tentor`}
          maxWidth="3xl"
        >
          {(() => {
            const teacher = selectedTeacherDetail;
            const teacherSchedules = schedules.filter(s => s.teacherId === teacher.id);
            const teacherMeetings = meetings.filter(m => m.teacherId === teacher.id && m.status === 'SELESAI');
            const meetingIds = new Set(teacherMeetings.map(m => m.id));
            const totalStudentMeetings = meetingStudents.filter(
              ms => meetingIds.has(ms.meetingId) && ms.attendanceStatus === 'HADIR'
            ).length;

            const honors = teacherHonors.filter(h => h.teacherId === teacher.id);
            const payments = teacherPayments.filter(p => p.teacherId === teacher.id);

            const totalHonor = honors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
            const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const sisaHonor = Math.max(0, totalHonor - totalPaid);

            const effectiveRate = teacher.customHonorRate || settings.teacherRate;

            return (
              <div className="space-y-5 text-xs">
                {/* Honor Highlights */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block">Total Akumulasi Honor</span>
                    <span className="text-lg font-black text-indigo-950 mt-0.5 block">
                      {formatRupiah(totalHonor)}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium">
                      {totalStudentMeetings} Siswa-Pertemuan
                    </span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Honor Telah Dibayar</span>
                    <span className="text-lg font-black text-emerald-900 mt-0.5 block">
                      {formatRupiah(totalPaid)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">{payments.length} voucher transfer</span>
                  </div>
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Sisa Honor Tertunda</span>
                    <span className="text-lg font-black text-amber-900 mt-0.5 block">
                      {formatRupiah(sisaHonor)}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">Kewajiban Bimbel</span>
                  </div>
                </div>

                {/* Rates & Bank Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      Skema Honor Guru
                    </h4>
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Tingkat Tentor:</span>
                        <strong className="text-slate-900">{teacher.experienceLevel || 'STANDAR'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarif Honor per Siswa:</span>
                        <strong className="text-indigo-700">{formatRupiah(effectiveRate)} / sesi</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tunjangan Transport:</span>
                        <span>{formatRupiah(teacher.transportFeePerMeeting || 0)} / sesi</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px]">
                        <span>Status Honor:</span>
                        <span className="text-purple-700 font-bold">
                          {teacher.customHonorRate ? 'Honor Khusus Guru' : 'Mengikuti Master Bimbel'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                      Rekening Transfer Honor
                    </h4>
                    <div className="space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Nama Bank:</span>
                        <strong className="text-slate-900">{teacher.bankName || 'BCA'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Nomor Rekening:</span>
                        <strong className="font-mono text-slate-900">{teacher.bankAccountNumber || '-'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Atas Nama:</span>
                        <span>{teacher.bankAccountHolder || teacher.name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jadwal Mengajar Guru */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                    <span>Jadwal Mengajar yang Ditugaskan ({teacherSchedules.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {teacherSchedules.length === 0 ? (
                      <p className="p-3 text-center text-slate-400 italic">Belum ada jadwal mengajar rutin.</p>
                    ) : (
                      teacherSchedules.map(s => {
                        const prog = programs.find(p => p.id === s.programId);
                        return (
                          <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{prog?.name || s.programId}</p>
                              <p className="text-[11px] text-slate-500">
                                {s.dayOfWeek}, {s.startTime} - {s.endTime}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border">
                              {s.room || 'Kelas'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Sesi Mengajar Terakhir */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                    Riwayat Sesi Selesai ({teacherMeetings.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-44 overflow-y-auto">
                    {teacherMeetings.length === 0 ? (
                      <p className="p-3 text-center text-slate-400">Belum ada riwayat pertemuan selesai.</p>
                    ) : (
                      teacherMeetings.map(m => (
                        <div key={m.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <p className="font-semibold text-slate-900">{m.meetingCode} • {formatDateIndonesian(m.date)}</p>
                            <p className="text-[10px] text-slate-500">
                              {m.startTime} - {m.endTime} {m.topic ? `• Materi: ${m.topic}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-indigo-700 block">
                              {m.presentStudentCount} siswa hadir
                            </span>
                            <span className="text-[10px] text-slate-500">
                              +{formatRupiah(m.presentStudentCount * effectiveRate)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT TEACHER MODAL WITH HONOR & BANK SETTINGS */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingTeacher ? 'Edit Data & Honor Guru' : 'Tambah Guru / Tentor Baru'}
        description="Lengkapi informasi pengajar, tingkat kualifikasi, skema honor per siswa, dan rekening transfer"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Guru (dengan Gelar) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Budi Pratama, S.Pd., M.Si."
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                  formErrors.name ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.name && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kode Tentor *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="GUR-001"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                  formErrors.code ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.code && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.code}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tingkat Kualifikasi Tentor
              </label>
              <select
                value={formData.experienceLevel}
                onChange={e => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-900"
              >
                <option value="STANDAR">Standar Tentor</option>
                <option value="SENIOR">Senior Tentor</option>
                <option value="MASTER">Master Tentor (Olimpiade/UTBK)</option>
                <option value="JUNIOR">Junior Tentor</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No HP / WhatsApp *
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                  formErrors.phone ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.phone && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.phone}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'AKTIF' | 'NONAKTIF' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              >
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Specializations Tag Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Spesialisasi Mata Pelajaran *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.specInput}
                onChange={e => setFormData({ ...formData, specInput: e.target.value })}
                placeholder="Ketik mapel (misal: Fisika SMA) lalu tekan enter/tambah"
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpecialization();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSpecialization}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Tambah
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[40px]">
              {(formData.specializations || []).map((spec, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium"
                >
                  {spec}
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecialization(spec)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {formErrors.specializations && (
              <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.specializations}</p>
            )}
          </div>

          {/* HONOR OVERRIDE SECTION */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3">
            <div>
              <label className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                <span>Skema & Honor Pengajar</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Pilih skema honor default untuk guru ini (per siswa, per sesi flat, atau gaji bulanan).
              </p>
            </div>

            {/* Scheme Radio Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PER_SISWA', label: 'Per Siswa / Sesi', desc: 'Dikalikan siswa hadir' },
                { id: 'PER_SESI', label: 'Flat per Sesi', desc: 'Tarif flat per jam/sesi' },
                { id: 'BULANAN', label: 'Gaji Bulanan', desc: 'Gaji bulanan tetap' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, honorScheme: opt.id as any })}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                    formData.honorScheme === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="font-bold block text-[11px]">{opt.label}</span>
                  <span className={`text-[9px] ${formData.honorScheme === opt.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-indigo-200/80 space-y-3">
              <label className="font-bold text-slate-900 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCustomHonor}
                  onChange={e => setFormData({ ...formData, isCustomHonor: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Tentukan Tarif Honor Khusus untuk Tentor Ini</span>
              </label>

              {formData.isCustomHonor && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {formData.honorScheme === 'BULANAN' ? (
                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">
                        Gaji Pokok Bulanan (Rp) *
                      </label>
                      <input
                        type="number"
                        step="50000"
                        value={formData.monthlySalary}
                        onChange={e => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-indigo-900 mb-1">
                        {formData.honorScheme === 'PER_SESI'
                          ? 'Honor Flat per Sesi (Rp) *'
                          : 'Honor per Siswa-Pertemuan (Rp) *'}
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={formData.customHonorRate}
                        onChange={e => setFormData({ ...formData, customHonorRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[2000, 3500, 5000, 10000, 25000, 40000].map(v => (
                          <button
                            type="button"
                            key={v}
                            onClick={() => setFormData({ ...formData, customHonorRate: v })}
                            className="px-1.5 py-0.5 rounded text-[9px] bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 cursor-pointer"
                          >
                            {formatRupiah(v)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tunjangan Transport per Sesi (Rp)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={formData.transportFeePerMeeting}
                      onChange={e => setFormData({ ...formData, transportFeePerMeeting: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BANK ACCOUNT SECTION */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Rekening Bank Penggajian Tentor</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="BCA / Mandiri / BRI"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNumber}
                  onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  placeholder="Contoh: 1234567890"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Atas Nama Rekening
                </label>
                <input
                  type="text"
                  value={formData.bankAccountHolder}
                  onChange={e => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                  placeholder="Nama pemilik rekening"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
            >
              {editingTeacher ? 'Simpan Perubahan Guru' : 'Tambah Guru & Tentor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DEACTIVATION MODAL (Soft Delete) */}
      <ConfirmDialog
        isOpen={!!deactivatingTeacher}
        onClose={() => setDeactivatingTeacher(null)}
        onConfirm={() => {
          if (deactivatingTeacher) {
            toggleTeacherStatus(deactivatingTeacher.id);
            setDeactivatingTeacher(null);
          }
        }}
        title="Konfirmasi Nonaktifkan Guru"
        message={`Apakah Anda yakin ingin menonaktifkan guru "${deactivatingTeacher?.name}" (${deactivatingTeacher?.code})? Riwayat mengajar dan catatan honor tetap tersimpan dengan aman.`}
        confirmText="Ya, Nonaktifkan"
        cancelText="Batal"
        type="warning"
      />
    </div>
  );
};
