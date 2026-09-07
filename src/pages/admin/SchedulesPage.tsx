import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  MapPin,
  PlayCircle,
  Search,
  Filter,
  Eye,
  Power,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Schedule, DayOfWeek } from '../../types';
import { formatDateIndonesian } from '../../services/businessLogic';

interface SchedulesPageProps {
  onNavigate?: (page: string) => void;
}

export const SchedulesPage: React.FC<SchedulesPageProps> = ({ onNavigate }) => {
  const {
    schedules,
    teachers,
    programs,
    students,
    meetings,
    createSchedule,
    updateSchedule,
    toggleScheduleStatus,
    deleteSchedule,
    createMeeting
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState<string>('ALL');
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<Schedule | null>(null);
  const [deactivatingSchedule, setDeactivatingSchedule] = useState<Schedule | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);

  // Generate meeting modal
  const [generatingForSchedule, setGeneratingForSchedule] = useState<Schedule | null>(null);
  const [meetingDate, setMeetingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [meetingTopic, setMeetingTopic] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    programId: '',
    teacherId: '',
    dayOfWeek: 'Senin' as DayOfWeek,
    startTime: '15:30',
    endTime: '17:00',
    room: 'Ruang Belajar 1',
    studentIds: [] as string[],
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const days: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const filteredSchedules = schedules.filter(sch => {
    const prog = programs.find(p => p.id === sch.programId);
    const tch = teachers.find(t => t.id === sch.teacherId);

    const matchSearch =
      sch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prog?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tch?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sch.room || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchDay = filterDay === 'ALL' || sch.dayOfWeek === filterDay;
    const matchTeacher = filterTeacher === 'ALL' || sch.teacherId === filterTeacher;
    const matchStatus = filterStatus === 'ALL' || sch.status === filterStatus;

    return matchSearch && matchDay && matchTeacher && matchStatus;
  });

  const handleOpenCreateModal = () => {
    const activePrograms = programs.filter(p => p.status === 'AKTIF');
    const activeTeachers = teachers.filter(t => t.status === 'AKTIF');
    const activeStudents = students.filter(s => s.status === 'AKTIF');

    setEditingSchedule(null);
    setFormData({
      programId: activePrograms[0]?.id || programs[0]?.id || '',
      teacherId: activeTeachers[0]?.id || teachers[0]?.id || '',
      dayOfWeek: 'Senin',
      startTime: '15:30',
      endTime: '17:00',
      room: 'Ruang Belajar 1',
      studentIds: activeStudents.slice(0, 3).map(s => s.id),
      status: 'AKTIF',
      notes: ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (sch: Schedule) => {
    setEditingSchedule(sch);
    setFormData({
      programId: sch.programId,
      teacherId: sch.teacherId,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room || 'Ruang Belajar 1',
      studentIds: sch.studentIds || [],
      status: sch.status,
      notes: sch.notes || ''
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.programId) errors.programId = 'Pilih program belajar';
    if (!formData.teacherId) errors.teacherId = 'Pilih guru pengajar';
    if (!formData.startTime || !formData.endTime) errors.time = 'Waktu les wajib diisi';
    if (formData.studentIds.length === 0) errors.studentIds = 'Pilih minimal satu siswa peserta';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, formData);
    } else {
      createSchedule(formData);
    }
    setIsFormModalOpen(false);
  };

  const handleCreateMeetingFromSchedule = () => {
    if (!generatingForSchedule) return;

    createMeeting({
      scheduleId: generatingForSchedule.id,
      programId: generatingForSchedule.programId,
      teacherId: generatingForSchedule.teacherId,
      date: meetingDate,
      startTime: generatingForSchedule.startTime,
      endTime: generatingForSchedule.endTime,
      room: generatingForSchedule.room,
      registeredStudentCount: generatingForSchedule.studentIds.length,
      status: 'TERJADWAL',
      topic: meetingTopic || 'Pertemuan Reguler',
      notes: `Dibuat dari jadwal ${generatingForSchedule.code}`
    });

    setGeneratingForSchedule(null);
    setMeetingTopic('');
    if (onNavigate) {
      onNavigate('meetings');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>Jadwal Les Bimbingan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur alokasi hari, jam belajar, ruang kelas, guru pengajar, dan daftar siswa peserta
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Jadwal Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode jadwal, guru, program, atau ruangan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={filterDay}
            onChange={e => setFilterDay(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Hari</option>
            {days.map(d => (
              <option key={d} value={d}>
                Hari {d}
              </option>
            ))}
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

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Status: Aktif</option>
            <option value="NONAKTIF">Status: Nonaktif</option>
          </select>
        </div>
      </div>

      {/* SECTION W: Table Jadwal Les */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">Kode Jadwal</th>
                <th className="px-4 py-3.5 font-semibold">Hari & Waktu</th>
                <th className="px-4 py-3.5 font-semibold">Program Belajar</th>
                <th className="px-4 py-3.5 font-semibold">Guru Pengajar</th>
                <th className="px-4 py-3.5 font-semibold">Ruang</th>
                <th className="px-4 py-3.5 font-semibold text-center">Siswa Terdaftar</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.map((sch, idx) => {
                const program = programs.find(p => p.id === sch.programId);
                const teacher = teachers.find(t => t.id === sch.teacherId);
                const enrolled = students.filter(s => (sch.studentIds || []).includes(s.id));

                return (
                  <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-900 whitespace-nowrap">
                      {sch.code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{sch.dayOfWeek}</span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {sch.startTime} - {sch.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {program?.name || '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {teacher?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {sch.room || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        <Users className="w-3 h-3" />
                        {enrolled.length} Siswa
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={sch.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedScheduleDetail(sch)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Lihat Detail Jadwal"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setGeneratingForSchedule(sch);
                            setMeetingTopic(program?.name || 'Pertemuan Reguler');
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-emerald-200/70 flex items-center gap-1"
                          title="Generate Pertemuan Baru dari Jadwal ini"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Buat Sesi</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(sch)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Edit Jadwal"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (sch.status === 'AKTIF') {
                              setDeactivatingSchedule(sch);
                            } else {
                              toggleScheduleStatus(sch.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            sch.status === 'AKTIF'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={sch.status === 'AKTIF' ? 'Nonaktifkan Jadwal' : 'Aktifkan Jadwal'}
                        >
                          <Power className="w-4 h-4" />
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

      {/* DETAIL SCHEDULE MODAL */}
      {selectedScheduleDetail && (
        <Modal
          isOpen={!!selectedScheduleDetail}
          onClose={() => setSelectedScheduleDetail(null)}
          title={`Detail Jadwal: ${selectedScheduleDetail.code}`}
          description={`Hari ${selectedScheduleDetail.dayOfWeek} • Jam ${selectedScheduleDetail.startTime} - ${selectedScheduleDetail.endTime} WIB`}
          maxWidth="3xl"
        >
          {(() => {
            const sch = selectedScheduleDetail;
            const program = programs.find(p => p.id === sch.programId);
            const teacher = teachers.find(t => t.id === sch.teacherId);
            const enrolled = students.filter(s => (sch.studentIds || []).includes(s.id));
            const pastMeetings = meetings.filter(m => m.scheduleId === sch.id);

            return (
              <div className="space-y-5 text-xs">
                {/* Schedule Header Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="space-y-1.5 text-slate-700">
                    <p><span className="text-slate-400 w-28 inline-block">Kode Jadwal:</span> <strong className="font-mono text-indigo-700">{sch.code}</strong></p>
                    <p><span className="text-slate-400 w-28 inline-block">Program:</span> <strong className="text-slate-900">{program?.name}</strong></p>
                    <p><span className="text-slate-400 w-28 inline-block">Guru Pengajar:</span> <strong className="text-slate-900">{teacher?.name} ({teacher?.code})</strong></p>
                    <p><span className="text-slate-400 w-28 inline-block">Status:</span> <StatusBadge status={sch.status} size="sm" /></p>
                  </div>
                  <div className="space-y-1.5 text-slate-700">
                    <p><span className="text-slate-400 w-28 inline-block">Hari & Waktu:</span> <strong>{sch.dayOfWeek}, {sch.startTime} - {sch.endTime} WIB</strong></p>
                    <p><span className="text-slate-400 w-28 inline-block">Ruangan:</span> <strong>{sch.room || 'Ruang Belajar 1'}</strong></p>
                    <p><span className="text-slate-400 w-28 inline-block">Jumlah Peserta:</span> <strong className="text-indigo-700">{enrolled.length} Siswa</strong></p>
                    <p><span className="text-slate-400 w-28 inline-block">Pertemuan Selesai:</span> <strong>{pastMeetings.length} Pertemuan</strong></p>
                  </div>
                </div>

                {/* Daftar Siswa Peserta */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                    <span>Daftar Siswa Peserta Kelas ({enrolled.length})</span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {enrolled.length === 0 ? (
                      <p className="p-3 text-center text-slate-400">Belum ada siswa terdaftar pada jadwal ini.</p>
                    ) : (
                      enrolled.map((std, idx) => (
                        <div key={std.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium w-5 text-center">{idx + 1}</span>
                            <div>
                              <p className="font-semibold text-slate-900">{std.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {std.nis} • {std.grade} • Wali: {std.parentName} ({std.parentPhone})
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={std.status} size="sm" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Riwayat Pertemuan Terkait Jadwal */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                    Riwayat Pertemuan dari Jadwal ini ({pastMeetings.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-40 overflow-y-auto">
                    {pastMeetings.length === 0 ? (
                      <p className="p-3 text-center text-slate-400">Belum ada sesi pertemuan yang dilaksanakan.</p>
                    ) : (
                      pastMeetings.map(m => (
                        <div key={m.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <p className="font-semibold text-slate-900">{m.meetingCode} • {formatDateIndonesian(m.date)}</p>
                            <p className="text-[10px] text-slate-500">{m.topic || 'Pertemuan Reguler'} • Jam {m.startTime} - {m.endTime}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-indigo-700 font-semibold">{m.presentStudentCount || 0} hadir</span>
                            <StatusBadge status={m.status} size="sm" />
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

      {/* CREATE / EDIT SCHEDULE MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal Les' : 'Buat Jadwal Les Baru'}
        description="Pilih guru, program, hari/jam, serta tentukan siswa yang bergabung di kelas"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Program Belajar *
              </label>
              <select
                value={formData.programId}
                onChange={e => setFormData({ ...formData, programId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Guru Pengajar / Tentor *
              </label>
              <select
                value={formData.teacherId}
                onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) {t.status === 'NONAKTIF' ? '(Nonaktif)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hari *
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              >
                {days.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jam Mulai *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jam Selesai *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ruangan Belajar
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={e => setFormData({ ...formData, room: e.target.value })}
                placeholder="Ruang 1 / Lab IPA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Jadwal
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

          {/* Student Assignment List */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                Pilih Siswa Terdaftar di Kelas ini * ({formData.studentIds.length} Siswa Dipilih)
              </label>
              <button
                type="button"
                onClick={() => {
                  const allActiveIds = students.filter(s => s.status === 'AKTIF').map(s => s.id);
                  setFormData({
                    ...formData,
                    studentIds: formData.studentIds.length === allActiveIds.length ? [] : allActiveIds
                  });
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                {formData.studentIds.length === students.length ? 'Batal Pilih Semua' : 'Pilih Semua Siswa'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
              {students.filter(s => s.status === 'AKTIF').map(std => {
                const isSelected = formData.studentIds.includes(std.id);
                return (
                  <label
                    key={std.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData({ ...formData, studentIds: [...formData.studentIds, std.id] });
                        } else {
                          setFormData({
                            ...formData,
                            studentIds: formData.studentIds.filter(id => id !== std.id)
                          });
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0 flex-1 truncate">
                      <span className="block truncate">{std.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{std.nis} • {std.grade}</span>
                    </div>
                  </label>
                );
              })}
            </div>
            {formErrors.studentIds && (
              <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.studentIds}</p>
            )}
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
              {editingSchedule ? 'Simpan Perubahan' : 'Buat Jadwal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* GENERATE MEETING QUICK ACTION MODAL */}
      {generatingForSchedule && (
        <Modal
          isOpen={!!generatingForSchedule}
          onClose={() => setGeneratingForSchedule(null)}
          title={`Jadwalkan Sesi Pertemuan: ${generatingForSchedule.code}`}
          description={`Program: ${programs.find(p => p.id === generatingForSchedule.programId)?.name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Pertemuan *
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={e => setMeetingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Materi / Pokok Bahasan
              </label>
              <input
                type="text"
                value={meetingTopic}
                onChange={e => setMeetingTopic(e.target.value)}
                placeholder="Contoh: Bab 4 Persamaan Kuadrat"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
              <p>• <strong>Guru:</strong> {teachers.find(t => t.id === generatingForSchedule.teacherId)?.name}</p>
              <p>• <strong>Waktu:</strong> {generatingForSchedule.startTime} - {generatingForSchedule.endTime}</p>
              <p>• <strong>Siswa Terdaftar:</strong> {generatingForSchedule.studentIds.length} Siswa</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGeneratingForSchedule(null)}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateMeetingFromSchedule}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Buat Sesi Pertemuan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DEACTIVATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deactivatingSchedule}
        onClose={() => setDeactivatingSchedule(null)}
        onConfirm={() => {
          if (deactivatingSchedule) {
            toggleScheduleStatus(deactivatingSchedule.id);
            setDeactivatingSchedule(null);
          }
        }}
        title="Konfirmasi Nonaktifkan Jadwal"
        message={`Apakah Anda yakin ingin menonaktifkan jadwal "${deactivatingSchedule?.code}"? Jadwal yang dinonaktifkan tidak akan muncul pada pilihan pembuatan sesi harian guru.`}
        confirmText="Ya, Nonaktifkan"
        cancelText="Batal"
        type="warning"
      />
    </div>
  );
};
