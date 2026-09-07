import React, { useState } from 'react';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Users,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { Meeting } from '../../types';

interface TeacherMeetingsHistoryPageProps {
  onNavigate?: (page: string) => void;
}

export const TeacherMeetingsHistoryPage: React.FC<TeacherMeetingsHistoryPageProps> = ({ onNavigate }) => {
  const {
    activeTeacherId,
    teachers,
    meetings,
    meetingStudents,
    students,
    programs,
    settings
  } = useApp();

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];
  const myMeetings = meetings.filter(m => m.teacherId === currentTeacher?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState<Meeting | null>(null);

  const filteredMeetings = myMeetings.filter(m => {
    const prog = programs.find(p => p.id === m.programId);
    return (
      m.meetingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prog?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.topic || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            <span>Riwayat Sesi Pertemuan Mengajar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar seluruh sesi bimbingan belajar yang telah Anda laksanakan beserta status kehadiran siswa
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode pertemuan, mata pelajaran, atau topik materi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* SECTION BC: Table Pertemuan Saya */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">Kode Sesi</th>
                <th className="px-4 py-3.5 font-semibold">Tanggal & Waktu</th>
                <th className="px-4 py-3.5 font-semibold">Program Belajar</th>
                <th className="px-4 py-3.5 font-semibold">Topik Materi</th>
                <th className="px-4 py-3.5 font-semibold text-center">Kehadiran</th>
                <th className="px-4 py-3.5 font-semibold text-right">Honor Anda</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeetings.map((mtg, idx) => {
                const program = programs.find(p => p.id === mtg.programId);
                const earnedHonor = mtg.presentStudentCount * settings.teacherRate;

                return (
                  <tr key={mtg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-900 whitespace-nowrap">
                      {mtg.meetingCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{formatDateIndonesian(mtg.date)}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{mtg.startTime} - {mtg.endTime}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{program?.name}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{mtg.topic || '-'}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {mtg.presentStudentCount} hadir
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-700 whitespace-nowrap">
                      {formatRupiah(earnedHonor)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={mtg.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedMeetingDetail(mtg)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedMeetingDetail && (
        <Modal
          isOpen={!!selectedMeetingDetail}
          onClose={() => setSelectedMeetingDetail(null)}
          title={`Detail Sesi Pertemuan: ${selectedMeetingDetail.meetingCode}`}
          description={`${formatDateIndonesian(selectedMeetingDetail.date)} • ${selectedMeetingDetail.startTime} - ${selectedMeetingDetail.endTime}`}
          maxWidth="lg"
        >
          {(() => {
            const mtg = selectedMeetingDetail;
            const attendances = meetingStudents.filter(ms => ms.meetingId === mtg.id);
            const presentCount = attendances.filter(a => a.attendanceStatus === 'HADIR').length;

            return (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-indigo-950 block">Honor Mengajar Sesi Ini:</span>
                    <span className="text-slate-600 text-[11px]">{presentCount} siswa hadir × {formatRupiah(settings.teacherRate)}</span>
                  </div>
                  <span className="text-lg font-black text-indigo-900">
                    {formatRupiah(presentCount * settings.teacherRate)}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                    Absensi Siswa:
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
                    {attendances.map(att => {
                      const std = students.find(s => s.id === att.studentId);
                      return (
                        <div key={att.id} className="p-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{std?.name}</p>
                            <p className="text-[10px] text-slate-400">{std?.nis} • {std?.grade}</p>
                          </div>
                          <StatusBadge status={att.attendanceStatus} size="sm" />
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
    </div>
  );
};
