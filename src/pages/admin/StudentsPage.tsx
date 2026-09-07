import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Power,
  Receipt,
  CreditCard,
  CalendarCheck,
  Phone,
  UserCheck,
  GraduationCap,
  Clock,
  Calendar,
  MapPin,
  AlertTriangle,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  HardDrive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { BatchImportModal, downloadStudentImportTemplate } from '../../components/students/BatchImportModal';
import { Student } from '../../types';

interface StudentsPageProps {
  onNavigate?: (page: string) => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ onNavigate }) => {
  const {
    students,
    programs,
    schedules,
    studentCharges,
    studentPayments,
    meetingStudents,
    meetings,
    settings,
    createStudent,
    batchCreateStudents,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProgram, setFilterProgram] = useState<string>('ALL');

  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deactivatingStudent, setDeactivatingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    gender: 'L' as 'L' | 'P',
    school: '',
    grade: 'Kelas 8 SMP',
    programIds: [] as string[],
    parentName: '',
    parentPhone: '',
    studentPhone: '',
    address: '',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.parentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = filterStatus === 'ALL' || student.status === filterStatus;
    const matchProgram =
      filterProgram === 'ALL' || (student.programIds || []).includes(filterProgram);

    return matchSearch && matchStatus && matchProgram;
  });

  const handleOpenCreateModal = () => {
    const nextNis = `NIS-2026-${String(students.length + 1).padStart(3, '0')}`;
    setEditingStudent(null);
    setFormData({
      name: '',
      nis: nextNis,
      gender: 'L',
      school: '',
      grade: 'Kelas 8 SMP',
      programIds: [programs[0]?.id || ''],
      parentName: '',
      parentPhone: '',
      studentPhone: '',
      address: '',
      status: 'AKTIF',
      notes: ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      nis: student.nis,
      gender: (student.gender === 'P' || student.gender === 'Perempuan') ? 'P' : 'L',
      school: student.school || student.schoolOrigin || '',
      grade: student.grade,
      programIds: student.programIds || [],
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      studentPhone: student.studentPhone || student.phone || '',
      address: student.address || '',
      status: (student.status === 'NONAKTIF' || student.status === 'INACTIVE') ? 'NONAKTIF' : 'AKTIF',
      notes: student.notes || ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Nama siswa wajib diisi';
    if (!formData.grade.trim()) errors.grade = 'Kelas wajib dipilih / diisi';
    
    // Check NIS uniqueness jika diisi manual
    if (formData.nis.trim()) {
      const duplicateNis = students.find(
        s => s.nis.trim().toLowerCase() === formData.nis.trim().toLowerCase() && s.id !== editingStudent?.id
      );
      if (duplicateNis) {
        errors.nis = `NIS ${formData.nis} sudah digunakan oleh siswa ${duplicateNis.name}`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Jika NIS dikosongi, buatkan NIS otomatis unik
    let finalNis = formData.nis.trim();
    if (!finalNis) {
      const existingNisSet = new Set(students.map(s => s.nis.trim().toLowerCase()));
      let counter = students.length + 1;
      while (existingNisSet.has(`nis-2026-${String(counter).padStart(3, '0')}`)) {
        counter++;
      }
      finalNis = `NIS-2026-${String(counter).padStart(3, '0')}`;
    }

    const payload = {
      ...formData,
      nis: finalNis,
      parentName: formData.parentName.trim() || '-',
      parentPhone: formData.parentPhone.trim() || '-',
      programIds: formData.programIds.length > 0 ? formData.programIds : (programs[0] ? [programs[0].id] : [])
    };

    if (editingStudent) {
      updateStudent(editingStudent.id, payload);
    } else {
      createStudent(payload);
    }
    setIsFormModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Data Siswa</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data induk siswa, program bimbingan, status tagihan, dan riwayat kehadiran
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onNavigate && (
            <>
              <button
                id="btn-google-sheets-siswa"
                onClick={() => onNavigate('google-sheets')}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-emerald-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                title="Buka Google Sheets untuk ekspor atau impor data siswa"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Sheets</span>
              </button>

              <button
                id="btn-google-drive-siswa"
                onClick={() => onNavigate('google-drive')}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                title="Buka Google Drive untuk manajemen file & pencadangan"
              >
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span>Google Drive</span>
              </button>
            </>
          )}

          <button
            id="btn-unduh-template-siswa"
            onClick={() => downloadStudentImportTemplate(programs)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Unduh template Excel / CSV (Nama dan Kelas wajib, sisanya bisa dikosongi)"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Unduh Template CSV</span>
          </button>

          <button
            id="btn-import-siswa-masal"
            onClick={() => setIsBatchImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            title="Impor data siswa sekaligus via file Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor Siswa (Masal)</span>
          </button>

          <button
            id="btn-tambah-siswa-baru"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NIS, atau nama orang tua..."
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
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Status: Aktif</option>
            <option value="NONAKTIF">Status: Nonaktif</option>
          </select>

          <select
            value={filterProgram}
            onChange={e => setFilterProgram(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Program</option>
            {programs.map(prog => (
              <option key={prog.id} value={prog.id}>
                {prog.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION S: Table Data Siswa with Columns per Specification */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">Nama Siswa</th>
                <th className="px-4 py-3.5 font-semibold">NIS</th>
                <th className="px-4 py-3.5 font-semibold">Kelas</th>
                <th className="px-4 py-3.5 font-semibold">Program</th>
                <th className="px-4 py-3.5 font-semibold">Orang Tua / No HP</th>
                <th className="px-4 py-3.5 font-semibold text-center">Total Pertemuan</th>
                <th className="px-4 py-3.5 font-semibold text-right">Total Tagihan</th>
                <th className="px-4 py-3.5 font-semibold text-right">Total Dibayar</th>
                <th className="px-4 py-3.5 font-semibold text-right">Sisa Tagihan</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-400">
                    Tidak ditemukan data siswa yang cocok dengan pencarian/filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const charges = studentCharges.filter(c => c.studentId === student.id);
                  const payments = studentPayments.filter(p => p.studentId === student.id);

                  const totalTagihan = charges.reduce((sum, c) => sum + (c.amount || 0), 0);
                  const totalDibayar = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  const sisaTagihan = Math.max(0, totalTagihan - totalDibayar);
                  const totalPertemuan = charges.length;

                  const enrolledPrograms = programs.filter(p => (student.programIds || []).includes(p.id));

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            {student.name.charAt(0)}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {student.nis}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {student.grade}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {enrolledPrograms.map(p => (
                            <span
                              key={p.id}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 font-medium border border-indigo-100"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{student.parentName}</p>
                        <p className="text-[10px] text-slate-500">{student.parentPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-indigo-700 whitespace-nowrap">
                        {totalPertemuan} sesi
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 whitespace-nowrap">
                        {formatRupiah(totalTagihan)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                        {formatRupiah(totalDibayar)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        <span className={sisaTagihan > 0 ? 'text-rose-600' : 'text-slate-600'}>
                          {formatRupiah(sisaTagihan)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <StatusBadge status={student.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedStudentForDetail(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Lihat Detail Lengkap Siswa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Edit Data Siswa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (student.status === 'AKTIF') {
                                setDeactivatingStudent(student);
                              } else {
                                toggleStudentStatus(student.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              student.status === 'AKTIF'
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={student.status === 'AKTIF' ? 'Nonaktifkan Siswa' : 'Aktifkan Siswa'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          {sisaTagihan > 0 ? (
                            <button
                              onClick={() => {
                                showToast(
                                  'Siswa Tidak Dapat Dihapus',
                                  `Siswa ${student.name} masih memiliki sisa tagihan sebesar ${formatRupiah(sisaTagihan)}. Selesaikan pelunasan sebelum menghapus data.`,
                                  'error'
                                );
                              }}
                              className="p-1.5 rounded-lg text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-not-allowed"
                              title={`Tidak dapat dihapus: Masih memiliki tunggakan ${formatRupiah(sisaTagihan)}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setStudentToDelete(student)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Data Siswa (Bebas Tagihan)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* SECTION T: DETAIL SISWA MODAL */}
      {selectedStudentForDetail && (
        <Modal
          isOpen={!!selectedStudentForDetail}
          onClose={() => setSelectedStudentForDetail(null)}
          title={`Detail Siswa: ${selectedStudentForDetail.name}`}
          description={`NIS: ${selectedStudentForDetail.nis} • ${selectedStudentForDetail.grade}`}
          maxWidth="3xl"
        >
          {(() => {
            const student = selectedStudentForDetail;
            const charges = studentCharges.filter(c => c.studentId === student.id);
            const payments = studentPayments.filter(p => p.studentId === student.id);
            const totalTagihan = charges.reduce((sum, c) => sum + (c.amount || 0), 0);
            const totalDibayar = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const sisaTagihan = Math.max(0, totalTagihan - totalDibayar);

            // Attendance records for this student
            const studentAttendances = meetingStudents.filter(ms => ms.studentId === student.id);

            // Student active enrolled schedules
            const studentSchedules = schedules.filter(s => (s.studentIds || []).includes(student.id));

            return (
              <div className="space-y-6 text-xs">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Tagihan</span>
                    <span className="text-base font-bold text-slate-900 mt-0.5 block">
                      {formatRupiah(totalTagihan)}
                    </span>
                    <span className="text-[10px] text-slate-400">Dari {charges.length} pertemuan</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Dibayar</span>
                    <span className="text-base font-bold text-emerald-800 mt-0.5 block">
                      {formatRupiah(totalDibayar)}
                    </span>
                    <span className="text-[10px] text-emerald-600">{payments.length} transaksi pembayaran</span>
                  </div>
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Sisa Tagihan</span>
                    <span className="text-base font-bold text-rose-800 mt-0.5 block">
                      {formatRupiah(sisaTagihan)}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      sisaTagihan === 0 ? 'text-emerald-700' : totalDibayar > 0 ? 'text-amber-700' : 'text-rose-600'
                    }`}>
                      {totalTagihan === 0 ? 'Lunas' : sisaTagihan === 0 ? 'Lunas' : totalDibayar > 0 ? 'Sebagian (Cicilan)' : 'Belum Bayar'}
                    </span>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                      Profil & Kontak
                    </h4>
                    <div className="space-y-1.5 text-slate-700">
                      <p><span className="text-slate-400 w-24 inline-block">Nama Lengkap:</span> <strong className="text-slate-900">{student.name}</strong></p>
                      <p><span className="text-slate-400 w-24 inline-block">NIS:</span> {student.nis}</p>
                      <p><span className="text-slate-400 w-24 inline-block">Jenis Kelamin:</span> {student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</p>
                      <p><span className="text-slate-400 w-24 inline-block">Kelas:</span> {student.grade}</p>
                      <p><span className="text-slate-400 w-24 inline-block">Asal Sekolah:</span> {student.school || '-'}</p>
                      <p><span className="text-slate-400 w-24 inline-block">Alamat:</span> {student.address || '-'}</p>
                      <p><span className="text-slate-400 w-24 inline-block">No HP Siswa:</span> {student.studentPhone || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                      Orang Tua & Program
                    </h4>
                    <div className="space-y-1.5 text-slate-700">
                      <p><span className="text-slate-400 w-24 inline-block">Nama Orang Tua:</span> <strong className="text-slate-900">{student.parentName}</strong></p>
                      <p><span className="text-slate-400 w-24 inline-block">No HP / WA:</span> {student.parentPhone}</p>
                      <p><span className="text-slate-400 w-24 inline-block">Terdaftar Sejak:</span> {formatDateIndonesian(student.registeredAt)}</p>
                      <p><span className="text-slate-400 w-24 inline-block">Status:</span> <StatusBadge status={student.status} size="sm" /></p>
                      <div>
                        <span className="text-slate-400 w-24 inline-block align-top">Program:</span>
                        <div className="inline-flex flex-wrap gap-1">
                          {programs.filter(p => (student.programIds || []).includes(p.id)).map(p => (
                            <span key={p.id} className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-medium text-[10px]">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jadwal Siswa (Section 14) */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                    <span>Jadwal Les Siswa ({studentSchedules.length})</span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {studentSchedules.length === 0 ? (
                      <p className="p-3 text-center text-slate-400">Siswa ini belum dimasukkan ke jadwal manapun.</p>
                    ) : (
                      studentSchedules.map(sch => {
                        const prog = programs.find(p => p.id === sch.programId);
                        return (
                          <div key={sch.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {sch.code} • {prog?.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Hari {sch.dayOfWeek} • {sch.startTime} - {sch.endTime} WIB • {sch.room || 'Ruang 1'}
                              </p>
                            </div>
                            <StatusBadge status={sch.status} size="sm" />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Riwayat Kehadiran */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                    <span>Riwayat Kehadiran Pertemuan ({studentAttendances.length})</span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {studentAttendances.length === 0 ? (
                      <p className="p-3 text-center text-slate-400">Belum ada riwayat absensi untuk siswa ini.</p>
                    ) : (
                      studentAttendances.map(att => {
                        const mtg = meetings.find(m => m.id === att.meetingId);
                        const prog = programs.find(p => p.id === mtg?.programId);
                        return (
                          <div key={att.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {prog?.name || 'Pertemuan'} • {formatDateIndonesian(mtg?.date || '')}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Jam {mtg?.startTime} - {mtg?.endTime} {att.notes ? `• ${att.notes}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {att.attendanceStatus === 'HADIR' && (
                                <span className="text-[10px] font-semibold text-emerald-700">
                                  + {formatRupiah(settings.studentRate || 8000)}
                                </span>
                              )}
                              <StatusBadge status={att.attendanceStatus} size="sm" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Riwayat Tagihan & Riwayat Pembayaran Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Riwayat Tagihan */}
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                      Daftar Tagihan Otomatis ({charges.length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
                      {charges.length === 0 ? (
                        <p className="p-3 text-center text-slate-400">Belum ada tagihan.</p>
                      ) : (
                        charges.map(chg => (
                          <div key={chg.id} className="p-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-800">{chg.chargeNumber}</p>
                              <p className="text-[10px] text-slate-500">{formatDateIndonesian(chg.date)} • {chg.period}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 block">{formatRupiah(chg.amount)}</span>
                              <StatusBadge status={chg.status} size="sm" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Riwayat Pembayaran */}
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                      Riwayat Pembayaran ({payments.length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
                      {payments.length === 0 ? (
                        <p className="p-3 text-center text-slate-400">Belum ada riwayat pembayaran.</p>
                      ) : (
                        payments.map((pay, pIdx) => (
                          <div key={pay.id ? `pay-${pay.id}-${pIdx}` : `pay-${pIdx}`} className="p-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-emerald-800">{pay.paymentNumber}</p>
                              <p className="text-[10px] text-slate-500">{formatDateIndonesian(pay.date)} • {pay.paymentMethod}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-700 block">{formatRupiah(pay.amount)}</span>
                              <span className="text-[10px] text-slate-400">{pay.receivedBy}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* CREATE / EDIT STUDENT MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        description="Lengkapi data diri siswa. Hanya Nama dan Kelas yang wajib diisi."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          {/* Petunjuk Aturan Pengisian */}
          <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-start gap-2.5">
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              i
            </span>
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              <strong>Aturan Pengisian:</strong> Hanya kolom <strong className="underline">Nama Lengkap</strong> dan <strong className="underline">Tingkat / Kelas</strong> yang wajib diisi. Kolom NIS, asal sekolah, program, data orang tua, nomor HP, dan alamat <span className="font-semibold text-emerald-700">bisa dikosongi saja</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Siswa <span className="text-rose-500">* (Wajib)</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Andi Saputra"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                  formErrors.name ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.name && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NIS <span className="text-slate-400 font-normal">(Opsional - otomatis dibuat jika kosong)</span>
              </label>
              <input
                type="text"
                value={formData.nis}
                onChange={e => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Kosongkan untuk buat otomatis"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                  formErrors.nis ? 'border-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.nis && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.nis}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Kelamin <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tingkat / Kelas <span className="text-rose-500">* (Wajib)</span>
              </label>
              <select
                value={formData.grade}
                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                <option value="Kelas 4 SD">Kelas 4 SD</option>
                <option value="Kelas 5 SD">Kelas 5 SD</option>
                <option value="Kelas 6 SD">Kelas 6 SD</option>
                <option value="Kelas 7 SMP">Kelas 7 SMP</option>
                <option value="Kelas 8 SMP">Kelas 8 SMP</option>
                <option value="Kelas 9 SMP">Kelas 9 SMP</option>
                <option value="Kelas 10 SMA">Kelas 10 SMA</option>
                <option value="Kelas 11 SMA">Kelas 11 SMA</option>
                <option value="Kelas 12 SMA / Alumni">Kelas 12 SMA / Alumni</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Keaktifan
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'AKTIF' | 'NONAKTIF' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Asal Sekolah <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={e => setFormData({ ...formData, school: e.target.value })}
                placeholder="Contoh: SMP Negeri 1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No HP Siswa <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.studentPhone}
                onChange={e => setFormData({ ...formData, studentPhone: e.target.value })}
                placeholder="0857-xxxx-xxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Program Enrolled (Multi-select checkboxes) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilihan Program Belajar <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              {programs.map(prog => {
                const isChecked = formData.programIds.includes(prog.id);
                return (
                  <label key={prog.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData({ ...formData, programIds: [...formData.programIds, prog.id] });
                        } else {
                          setFormData({
                            ...formData,
                            programIds: formData.programIds.filter(id => id !== prog.id)
                          });
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{prog.name}</span>
                  </label>
                );
              })}
            </div>
            {formErrors.programIds && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.programIds}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Orang Tua / Wali <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.parentName}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Nama ayah/ibu (bisa dikosongi)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No HP / WhatsApp Orang Tua <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.parentPhone}
                onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="0812-xxxx-xxxx (bisa dikosongi)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Domisili
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Jl. Melati No. 12, Jakarta"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DEACTIVATION MODAL (Soft Delete) */}
      <ConfirmDialog
        isOpen={!!deactivatingStudent}
        onClose={() => setDeactivatingStudent(null)}
        onConfirm={() => {
          if (deactivatingStudent) {
            toggleStudentStatus(deactivatingStudent.id);
            setDeactivatingStudent(null);
          }
        }}
        title="Konfirmasi Nonaktifkan Siswa"
        message={`Apakah Anda yakin ingin menonaktifkan siswa "${deactivatingStudent?.name}" (${deactivatingStudent?.nis})? Data historis kehadiran dan pembayaran siswa tetap dipertahankan dan siswa dapat diaktifkan kembali sewaktu-waktu.`}
        confirmText="Ya, Nonaktifkan"
        cancelText="Batal"
        type="warning"
      />

      {/* CONFIRM DELETE STUDENT MODAL (Only allowed if no outstanding debt) */}
      <ConfirmDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={async () => {
          if (studentToDelete) {
            await deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus siswa "${studentToDelete?.name}" (${studentToDelete?.nis}) dari sistem? Siswa ini tidak memiliki tunggakan tagihan dan seluruh data terkait akan dihapus.`}
        confirmText="Ya, Hapus Permanen"
        cancelText="Batal"
        type="danger"
      />

      {/* MODAL: IMPOR DATA SISWA MASAL (BATCH IMPORT) */}
      <BatchImportModal
        isOpen={isBatchImportModalOpen}
        onClose={() => setIsBatchImportModalOpen(false)}
        existingStudents={students}
        programs={programs}
        onImport={async (studentsToImport) => {
          return await batchCreateStudents(studentsToImport);
        }}
      />
    </div>
  );
};
