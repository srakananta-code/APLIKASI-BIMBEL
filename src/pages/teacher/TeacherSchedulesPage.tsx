import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../../components/common/StatusBadge';

interface TeacherSchedulesPageProps {
  onNavigate?: (page: string) => void;
}

export const TeacherSchedulesPage: React.FC<TeacherSchedulesPageProps> = ({ onNavigate }) => {
  const {
    activeTeacherId,
    teachers,
    schedules,
    programs,
    students,
    createMeeting
  } = useApp();

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];
  const mySchedules = schedules.filter(s => s.teacherId === currentTeacher?.id);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <span>Jadwal Mengajar Saya</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Daftar jadwal les mingguan yang ditugaskan kepada Anda oleh Administrator
        </p>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {days.map(day => {
          const daySchedules = mySchedules.filter(s => s.dayOfWeek === day);
          if (daySchedules.length === 0) return null;

          return (
            <div
              key={day}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col"
            >
              <div className="p-3.5 bg-slate-900 text-white font-bold text-xs flex items-center justify-between">
                <span>Hari {day}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
                  {daySchedules.length} Kelas
                </span>
              </div>

              <div className="p-4 divide-y divide-slate-100 flex-1 space-y-3">
                {daySchedules.map(sch => {
                  const program = programs.find(p => p.id === sch.programId);
                  const enrolled = students.filter(s => sch.studentIds.includes(s.id));

                  return (
                    <div key={sch.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-700">{sch.code}</span>
                        <StatusBadge status={sch.status} size="sm" />
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{program?.name}</h4>

                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sch.startTime} - {sch.endTime} WIB</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sch.room || 'Ruang Les Utama'}</span>
                        </p>
                        <p className="flex items-center gap-1.5 font-semibold text-indigo-900">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{enrolled.length} Siswa Terdaftar</span>
                        </p>
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
                            topic: program?.name || 'Pertemuan Reguler',
                            notes: `Mulai sesi les dari jadwal ${sch.code}`
                          });
                          if (onNavigate) onNavigate('guru-attendance');
                        }}
                        className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Mulai Sesi & Isi Absensi</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
