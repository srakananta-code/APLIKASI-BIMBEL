import React from 'react';
import {
  GraduationCap,
  Calendar,
  Award,
  Clock,
  PlayCircle,
  Users,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { TeacherAnnouncementBoard } from '../../components/broadcast/TeacherAnnouncementBoard';

interface TeacherDashboardProps {
  onNavigate: (page: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const {
    activeTeacherId,
    teachers,
    schedules,
    meetings,
    teacherHonors,
    programs,
    settings,
    createMeeting
  } = useApp();

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];
  const mySchedules = schedules.filter(s => s.teacherId === currentTeacher?.id && s.status === 'AKTIF');
  const myMeetings = meetings.filter(m => m.teacherId === currentTeacher?.id);
  const myCompletedMeetings = myMeetings.filter(m => m.status === 'SELESAI');

  const myHonor = teacherHonors.find(
    h => h.teacherId === currentTeacher?.id && h.period.includes('September')
  );

  const pendingAttendanceMeetings = myMeetings.filter(m => m.status === 'TERJADWAL');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Portal Guru & Tentor Terintegrasi</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Selamat Mengajar, {currentTeacher?.name}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Mata Pelajaran: <strong>{currentTeacher?.specializations?.join(', ') || currentTeacher?.specialtyPrograms?.join(', ') || currentTeacher?.subjectSpecialization || 'Umum'}</strong> • Kode: <strong>{currentTeacher?.code}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('guru-attendance')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Input Absensi Siswa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Jadwal Kelas Aktif"
          value={`${mySchedules.length} Jadwal`}
          subtitle="Jadwal mingguan Anda"
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          colorScheme="sky"
        />

        <StatCard
          title="Sesi Les Selesai"
          value={`${myCompletedMeetings.length} Sesi`}
          subtitle="Telah diabsensi & tercatat"
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          colorScheme="emerald"
        />

        <StatCard
          title="Honor Bulan Ini"
          value={formatRupiah(myHonor?.totalHonor || 0)}
          subtitle={`${myHonor?.studentMeetingCount || 0} siswa-pertemuan`}
          icon={<Award className="w-5 h-5 text-blue-600" />}
          colorScheme="indigo"
          highlight
        />

        <StatCard
          title="Tarif Per Siswa-Sesi"
          value={formatRupiah(settings.teacherRate)}
          subtitle="Dihitung otomatis saat absensi"
          icon={<Users className="w-5 h-5 text-slate-600" />}
          colorScheme="slate"
        />
      </div>

      {/* Alert if there is pending meeting to be attended */}
      {pendingAttendanceMeetings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-amber-950 text-xs sm:text-sm">
                Ada {pendingAttendanceMeetings.length} Sesi Pertemuan Belum Diabsensi!
              </p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Silakan lakukan absensi kehadiran siswa agar sistem otomatis mencatat honor Anda dan tagihan siswa.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('guru-attendance')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            Buka Absensi Sekarang
          </button>
        </div>
      )}

      {/* In-App Announcement & Schedule Reminder Board */}
      <TeacherAnnouncementBoard onNavigate={onNavigate} />

      {/* Grid: My Schedules & Recent Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Jadwal Saya */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Jadwal Mengajar Anda</span>
            </h3>
            <button
              onClick={() => onNavigate('guru-schedules')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-0.5"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {mySchedules.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">Belum ada jadwal mengajar aktif.</p>
            ) : (
              mySchedules.map(sch => {
                const prog = programs.find(p => p.id === sch.programId);
                return (
                  <div
                    key={sch.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{prog?.name}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {sch.dayOfWeek}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sch.startTime} - {sch.endTime}
                        </span>
                        <span>•</span>
                        <span>{sch.room}</span>
                        <span>•</span>
                        <span>{sch.studentIds.length} Siswa</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        createMeeting({
                          scheduleId: sch.id,
                          programId: sch.programId,
                          teacherId: sch.teacherId,
                          date: new Date().toISOString().split('T')[0],
                          startTime: sch.startTime,
                          endTime: sch.endTime,
                          room: sch.room,
                          registeredStudentCount: sch.studentIds.length,
                          status: 'TERJADWAL',
                          topic: prog?.name || 'Pertemuan Reguler',
                          notes: 'Dibuat langsung dari dashboard guru'
                        });
                        onNavigate('guru-attendance');
                      }}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Mulai Sesi</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Riwayat Sesi Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Sesi Pertemuan Selesai Terbaru</span>
            </h3>
            <button
              onClick={() => onNavigate('guru-meetings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-0.5"
            >
              <span>Riwayat Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {myCompletedMeetings.length === 0 ? (
              <p className="text-slate-400 text-xs py-4 text-center">Belum ada riwayat sesi pertemuan selesai.</p>
            ) : (
              myCompletedMeetings.slice(0, 4).map(mtg => {
                const prog = programs.find(p => p.id === mtg.programId);
                const earnedHonor = mtg.presentStudentCount * settings.teacherRate;

                return (
                  <div
                    key={mtg.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{prog?.name} ({mtg.meetingCode})</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatDateIndonesian(mtg.date)} • {mtg.topic || 'Materi Belajar'}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        {mtg.presentStudentCount} siswa hadir
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-700 block">
                        +{formatRupiah(earnedHonor)}
                      </span>
                      <span className="text-[10px] text-slate-400">Honor Sesi</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
