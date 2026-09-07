import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  Plus,
  Eye,
  Trash2,
  Users,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Meeting } from '../../types';

interface MeetingsPageProps {
  onNavigate?: (page: string) => void;
}

export const MeetingsPage: React.FC<MeetingsPageProps> = ({ onNavigate }) => {
  const {
    meetings,
    meetingStudents,
    teachers,
    programs,
    students,
    settings,
    createMeeting,
    deleteMeeting,
    setActiveRole
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState<Meeting | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  // Filtered Meetings
  const filteredMeetings = meetings.filter(m => {
    const teacher = teachers.find(t => t.id === m.teacherId);
    const program = programs.find(p => p.id === m.programId);

    const matchSearch =
      m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (program?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topic || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = filterStatus === 'ALL' || m.status === filterStatus;
    const matchTeacher = filterTeacher === 'ALL' || m.teacherId === filterTeacher;

    return matchSearch && matchStatus && matchTeacher;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            <span>Pertemuan & Rekap Absensi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring sesi tatap muka bimbel, status kehadiran, dan hasil otomasi tagihan & honor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Quick jump to teacher attendance
              setActiveRole('GURU', 'TCH-001');
              if (onNavigate) onNavigate('guru-attendance');
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Isi Absensi (sbg Guru)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode pertemuan, guru, mapel, atau topik materi..."
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
            <option value="SELESAI">Status: Selesai</option>
            <option value="TERJADWAL">Status: Terjadwal</option>
            <option value="BERLANGSUNG">Status: Berlangsung</option>
          </select>

          <select
            value={filterTeacher}
            onChange={e => setFilterTeacher(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Guru</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION X: Table Pertemuan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">Kode Pertemuan</th>
                <th className="px-4 py-3.5 font-semibold">Tanggal & Waktu</th>
                <th className="px-4 py-3.5 font-semibold">Program Belajar</th>
                <th className="px-4 py-3.5 font-semibold">Guru Pengajar</th>
                <th className="px-4 py-3.5 font-semibold">Topik Materi</th>
                <th className="px-4 py-3.5 font-semibold text-center">Kehadiran Siswa</th>
                <th className="px-4 py-3.5 font-semibold text-right">Tagihan Otomatis</th>
                <th className="px-4 py-3.5 font-semibold text-right">Honor Guru</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeetings.map((mtg, idx) => {
                const program = programs.find(p => p.id === mtg.programId);
                const teacher = teachers.find(t => t.id === mtg.teacherId);
                const tagihanOtomatis = mtg.presentStudentCount * settings.studentRate;
                const honorOtomatis = mtg.presentStudentCount * settings.teacherRate;

                return (
                  <tr key={mtg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-900 whitespace-nowrap">
                      {mtg.meetingCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">
                        {formatDateIndonesian(mtg.date)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {mtg.startTime} - {mtg.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {program?.name || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {teacher?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">
                      {mtg.topic || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="w-3 h-3" />
                        {mtg.presentStudentCount} hadir
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        / {mtg.registeredStudentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(tagihanOtomatis)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-indigo-700 whitespace-nowrap">
                      {formatRupiah(honorOtomatis)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={mtg.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedMeetingDetail(mtg)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Lihat Detail Absensi & Tagihan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMeetingId(mtg.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Pertemuan"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* DETAIL PERTEMUAN MODAL */}
      {selectedMeetingDetail && (
        <Modal
          isOpen={!!selectedMeetingDetail}
          onClose={() => setSelectedMeetingDetail(null)}
          title={`Detail Pertemuan: ${selectedMeetingDetail.meetingCode}`}
          description={`${formatDateIndonesian(selectedMeetingDetail.date)} • ${selectedMeetingDetail.startTime} - ${selectedMeetingDetail.endTime}`}
          maxWidth="2xl"
        >
          {(() => {
            const mtg = selectedMeetingDetail;
            const program = programs.find(p => p.id === mtg.programId);
            const teacher = teachers.find(t => t.id === mtg.teacherId);
            const attendances = meetingStudents.filter(ms => ms.meetingId === mtg.id);
            const presentCount = attendances.filter(a => a.attendanceStatus === 'HADIR').length;

            return (
              <div className="space-y-4 text-xs">
                {/* Meta info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Guru</span>
                    <strong className="text-slate-900">{teacher?.name || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Program</span>
                    <strong className="text-slate-900">{program?.name || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ruangan</span>
                    <strong className="text-slate-900">{mtg.room || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                    <StatusBadge status={mtg.status} size="sm" />
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                  <h4 className="font-bold text-indigo-950 text-xs mb-1">
                    Hasil Integrasi Otomatis (Single Source of Truth):
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-indigo-900">
                    <div>
                      • Total Tagihan Siswa: <strong>{presentCount} × {formatRupiah(settings.studentRate)} = {formatRupiah(presentCount * settings.studentRate)}</strong>
                    </div>
                    <div>
                      • Total Honor Tentor: <strong>{presentCount} × {formatRupiah(settings.teacherRate)} = {formatRupiah(presentCount * settings.teacherRate)}</strong>
                    </div>
                  </div>
                </div>

                {/* Attendance table */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                    Daftar Absensi Siswa ({attendances.length} Siswa)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {attendances.map(att => {
                      const student = students.find(s => s.id === att.studentId);
                      return (
                        <div key={att.id} className="p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {student?.name.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{student?.name || 'Siswa'}</p>
                              <p className="text-[10px] text-slate-500">{student?.nis} • {student?.grade}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-medium text-slate-600">
                              {att.attendanceStatus === 'HADIR' ? `+${formatRupiah(settings.studentRate)}` : 'Rp0'}
                            </span>
                            <StatusBadge status={att.attendanceStatus} size="sm" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog
        isOpen={!!deletingMeetingId}
        onClose={() => setDeletingMeetingId(null)}
        onConfirm={() => {
          if (deletingMeetingId) {
            deleteMeeting(deletingMeetingId);
            setDeletingMeetingId(null);
          }
        }}
        title="Hapus Pertemuan"
        message="Menghapus pertemuan ini akan menghapus data absensi terkait. Apakah Anda yakin?"
        variant="danger"
        confirmText="Hapus Pertemuan"
      />
    </div>
  );
};
