import React, { useState } from 'react';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
  Send,
  Save,
  Info,
  Layers,
  CheckCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { AttendanceStatus } from '../../types';

interface TeacherAttendancePageProps {
  onNavigate?: (page: string) => void;
}

export const TeacherAttendancePage: React.FC<TeacherAttendancePageProps> = ({ onNavigate }) => {
  const {
    activeTeacherId,
    teachers,
    meetings,
    meetingStudents,
    students,
    programs,
    schedules,
    settings,
    submitAttendance,
    createMeeting
  } = useApp();

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];

  // Available meetings for this teacher
  const teacherMeetings = meetings.filter(m => m.teacherId === currentTeacher?.id);
  const scheduledMeetings = teacherMeetings.filter(m => m.status === 'TERJADWAL');

  // Selected meeting state
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    scheduledMeetings[0]?.id || teacherMeetings[0]?.id || ''
  );

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
  const selectedProgram = programs.find(p => p.id === selectedMeeting?.programId);
  const existingMeetingStudents = meetingStudents.filter(ms => ms.meetingId === selectedMeetingId);

  // Determine students enrolled in this schedule or program
  const scheduleForMeeting = schedules.find(s => s.id === selectedMeeting?.scheduleId);
  const enrolledStudentIds = scheduleForMeeting?.studentIds || students.slice(0, 4).map(s => s.id);

  // Local Attendance State for active session
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: AttendanceStatus; notes: string }>
  >(() => {
    const initial: Record<string, { status: AttendanceStatus; notes: string }> = {};
    if (existingMeetingStudents.length > 0) {
      existingMeetingStudents.forEach(ms => {
        initial[ms.studentId] = { status: ms.attendanceStatus, notes: ms.notes || '' };
      });
    } else {
      enrolledStudentIds.forEach(id => {
        initial[id] = { status: 'HADIR', notes: '' };
      });
    }
    return initial;
  });

  const [sessionTopic, setSessionTopic] = useState(selectedMeeting?.topic || '');
  const [sessionNotes, setSessionNotes] = useState(selectedMeeting?.notes || '');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Sync state when meeting selection changes
  const handleSelectMeeting = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    const mtg = meetings.find(m => m.id === meetingId);
    const msList = meetingStudents.filter(ms => ms.meetingId === meetingId);
    const sch = schedules.find(s => s.id === mtg?.scheduleId);
    const stdIds = sch?.studentIds || students.slice(0, 4).map(s => s.id);

    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    if (msList.length > 0) {
      msList.forEach(ms => {
        updated[ms.studentId] = { status: ms.attendanceStatus, notes: ms.notes || '' };
      });
    } else {
      stdIds.forEach(id => {
        updated[id] = { status: 'HADIR', notes: '' };
      });
    }

    setAttendanceRecords(updated);
    setSessionTopic(mtg?.topic || '');
    setSessionNotes(mtg?.notes || '');
    setIsSubmittedSuccess(false);
  };

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleSetAllStatus = (newStatus: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    Object.keys(attendanceRecords).forEach(studentId => {
      updated[studentId] = {
        ...attendanceRecords[studentId],
        status: newStatus
      };
    });
    setAttendanceRecords(updated);
  };

  // Live calculations
  const studentEntries: Array<[string, { status: AttendanceStatus; notes: string }]> = Object.entries(
    attendanceRecords
  ) as Array<[string, { status: AttendanceStatus; notes: string }]>;
  const presentCount = studentEntries.filter(([_, data]) => data.status === 'HADIR').length;
  const izinCount = studentEntries.filter(([_, data]) => data.status === 'IZIN').length;
  const sakitCount = studentEntries.filter(([_, data]) => data.status === 'SAKIT').length;
  const alpaCount = studentEntries.filter(([_, data]) => data.status === 'ALPA').length;

  const estimatedTeacherHonor = presentCount * settings.teacherRate;
  const estimatedStudentCharges = presentCount * settings.studentRate;

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId) return;

    const attendancesPayload = studentEntries.map(([studentId, data]) => ({
      studentId,
      status: data.status,
      notes: data.notes
    }));

    submitAttendance(selectedMeetingId, attendancesPayload, sessionTopic, sessionNotes);
    setIsSubmittedSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            <span>Lembar Absensi Siswa & Pelaksanaan Sesi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tandai kehadiran siswa secara akurat. Data absensi otomatis langsung mengkalkulasi honor Anda dan tagihan siswa.
          </p>
        </div>
      </div>

      {/* Select Meeting Session */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <label className="block font-bold text-slate-800 text-xs">
          Pilih Sesi Pertemuan Yang Hendak Diabsensi:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teacherMeetings.map(m => {
            const isSelected = m.id === selectedMeetingId;
            const prog = programs.find(p => p.id === m.programId);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMeeting(m.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-700">{m.meetingCode}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === 'SELESAI'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-xs mt-1">{prog?.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formatDateIndonesian(m.date)} • {m.startTime} - {m.endTime}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Banner */}
      {isSubmittedSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Absensi Selesai Disimpan & Terintegrasi!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                {presentCount} siswa hadir otomatis membentuk {presentCount} tagihan siswa dan menambahkan <strong>+{formatRupiah(estimatedTeacherHonor)}</strong> ke rekap honor Anda.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('guru-honor')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              Lihat Rekap Honor Saya
            </button>
          )}
        </div>
      )}

      {/* Real-time Calculation Floating/Card Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              Kalkulasi Otomatis (Live Calculation)
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-300">
              +{formatRupiah(estimatedTeacherHonor)}
            </span>
            <span className="text-xs text-indigo-200">
              Honor Anda ({presentCount} hadir × {formatRupiah(settings.teacherRate)})
            </span>
          </div>
        </div>

        {/* Quick Badge breakdown */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
            {presentCount} Hadir
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
            {izinCount} Izin
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
            {sakitCount} Sakit
          </span>
          <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
            {alpaCount} Alpa
          </span>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmitAttendance} className="space-y-5">
        {/* Materi & Catatan Kelas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Topik / Materi Pembelajaran Yang Disampaikan *
            </label>
            <input
              type="text"
              required
              value={sessionTopic}
              onChange={e => setSessionTopic(e.target.value)}
              placeholder="Contoh: Pembahasan Soal UTS Bab Listrik Dinamis"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Sesi / Evaluasi Kelas (Opsional)
            </label>
            <input
              type="text"
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="Contoh: Siswa antusias, perlu penguatan pada rumus ohm"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>
        </div>

        {/* SECTION BD: Interactive Attendance List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Absensi Siswa ({studentEntries.length} Siswa Terdaftar)
                </h3>
                {presentCount === studentEntries.length && studentEntries.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Semua Hadir
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gunakan 1-klik tombol di samping untuk menandai semua hadir, lalu ubah siswa yang berhalangan
              </p>
            </div>

            {/* Quick Set All Buttons */}
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                id="btn-tandai-semua-hadir"
                type="button"
                onClick={() => handleSetAllStatus('HADIR')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
                title="Tandai semua siswa hadir dalam 1 klik"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Tandai Semua Hadir (Check All)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetAllStatus('IZIN')}
                className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Set semua siswa izin"
              >
                Set Izin
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {studentEntries.map(([studentId, data], idx) => {
              const student = students.find(s => s.id === studentId);
              const status = data.status;

              return (
                <div
                  key={studentId}
                  className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    status === 'HADIR' ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {student?.name || `Siswa #${studentId}`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        NIS: {student?.nis} • Kelas: {student?.grade}{student?.schoolOrigin ? ` • ${student.schoolOrigin}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Status Selection Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as AttendanceStatus[]).map(st => {
                      const isActive = status === st;
                      let activeStyle = '';
                      if (st === 'HADIR') activeStyle = 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs';
                      else if (st === 'IZIN') activeStyle = 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs';
                      else if (st === 'SAKIT') activeStyle = 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs';
                      else if (st === 'ALPA') activeStyle = 'bg-rose-600 text-white font-bold border-rose-600 shadow-xs';

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(studentId, st)}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border ${
                            isActive
                              ? activeStyle
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>

                  {/* Impact Note */}
                  <div className="text-right min-w-[120px] text-xs">
                    {status === 'HADIR' ? (
                      <span className="font-bold text-emerald-700">
                        +{formatRupiah(settings.teacherRate)} Honor
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Rp0 (Tidak Hadir)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Menyimpan absensi akan mengubah status pertemuan menjadi <strong>SELESAI</strong> dan membuat mutasi tagihan serta honor secara permanen.
            </span>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Simpan Absensi & Generate Keuangan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
