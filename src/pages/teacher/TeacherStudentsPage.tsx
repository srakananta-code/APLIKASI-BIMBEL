import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  BookOpen, 
  GraduationCap, 
  Phone, 
  Calendar, 
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export const TeacherStudentsPage: React.FC = () => {
  const { students, schedules, programs, teachers } = useApp();
  const { activeTeacherId } = useAuth();

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];
  const [searchTerm, setSearchTerm] = useState('');

  // Get schedules for this teacher
  const mySchedules = schedules.filter(s => s.teacherId === currentTeacher?.id);
  
  // Get all unique student IDs from my schedules
  const myStudentIds = new Set<string>();
  mySchedules.forEach(sch => {
    sch.studentIds.forEach(id => myStudentIds.add(id));
  });

  // Filter students
  const myStudents = students.filter(student => {
    const isEnrolledInMyClass = myStudentIds.has(student.id);
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchTerm.toLowerCase());
    return isEnrolledInMyClass && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-7 h-7 text-emerald-600" />
          <span>Siswa Bimbingan Saya</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar murid yang terdaftar dalam jadwal dan kelas bimbingan tentor {currentTeacher?.name}.
        </p>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa, NIS, atau jenjang kelas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="text-slate-800">{myStudents.length}</strong> siswa
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myStudents.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Tidak ada data siswa bimbingan yang sesuai.</p>
          </div>
        ) : (
          myStudents.map(student => {
            const studentSchedules = mySchedules.filter(s => s.studentIds.includes(student.id));

            return (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                      <p className="text-[11px] font-mono text-slate-500">NIS: {student.nis}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                    {student.grade}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Asal Sekolah:</span>
                    <span className="font-medium text-slate-700">{student.school || student.schoolOrigin || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Orang Tua / Wali:</span>
                    <span className="font-medium text-slate-700">{student.parentName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Kontak WA:</span>
                    <span className="font-mono text-emerald-700">{student.parentPhone || student.studentPhone || '-'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Kelas Terdaftar Bersama Anda:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {studentSchedules.map(sch => {
                      const prog = programs.find(p => p.id === sch.programId);
                      return (
                        <span
                          key={sch.id}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200"
                        >
                          {prog?.name || sch.dayOfWeek} ({sch.startTime})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
