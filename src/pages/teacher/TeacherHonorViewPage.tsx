import React from 'react';
import {
  Award,
  Wallet,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Printer,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { wordExportService } from '../../services/wordExportService';

export const TeacherHonorViewPage: React.FC = () => {
  const {
    activeTeacherId,
    teachers,
    teacherHonors,
    teacherPayments,
    meetings,
    programs,
    settings
  } = useApp();

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];
  const myHonors = teacherHonors.filter(h => h.teacherId === currentTeacher?.id);
  const myPayments = teacherPayments.filter(p => p.teacherId === currentTeacher?.id);
  const myMeetings = meetings.filter(m => m.teacherId === currentTeacher?.id && m.status === 'SELESAI');

  const totalHonorEarned = myHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
  const totalHonorPaid = myPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalHonorPending = Math.max(0, totalHonorEarned - totalHonorPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-indigo-600" />
            <span>Rekapitulasi & Transparansi Honor Saya</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Akumulasi honor mengajar berdasarkan data kehadiran siswa yang telah diverifikasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentTeacher) {
                wordExportService.exportTeacherHonorBreakdownWord(
                  currentTeacher,
                  myMeetings,
                  programs,
                  totalHonorEarned,
                  totalHonorPaid,
                  settings
                );
              }
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Format Word (.doc)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Akumulasi Honor
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalHonorEarned)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dari seluruh sesi mengajar selesai</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Sudah Dicairkan / Diterima
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{formatRupiah(totalHonorPaid)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Telah ditransfer lembaga ke rekening Anda</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            Sisa Honor Belum Dicairkan
          </p>
          <p className="text-2xl font-black text-amber-800 mt-1">{formatRupiah(totalHonorPending)}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Akan ditransfer pada jadwal gajian</p>
        </div>
      </div>

      {/* Formula Info Banner */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center gap-3 text-xs text-indigo-950">
        <Award className="w-6 h-6 text-indigo-600 shrink-0" />
        <div>
          <p className="font-bold">Tarif Honor Aktif: {formatRupiah(settings.teacherRate)} per Siswa-Pertemuan</p>
          <p className="text-[11px] text-indigo-800 mt-0.5">
            Sistem menjamin keadilan & transparansi: Honor dihitung murni dari jumlah siswa yang berstatus <strong>HADIR</strong> pada setiap sesi pertemuan yang Anda selesaikan.
          </p>
        </div>
      </div>

      {/* Breakdown per Pertemuan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Rincian Honor Per Sesi Mengajar Selesai
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {myMeetings.length} Sesi Pertemuan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Kode Pertemuan</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Program</th>
                <th className="px-4 py-3 font-semibold">Topik Materi</th>
                <th className="px-4 py-3 font-semibold text-center">Siswa Hadir</th>
                <th className="px-4 py-3 font-semibold">Tarif Berlaku</th>
                <th className="px-4 py-3 font-semibold text-right">Total Honor Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myMeetings.map(mtg => {
                const prog = programs.find(p => p.id === mtg.programId);
                const honor = mtg.presentStudentCount * settings.teacherRate;

                return (
                  <tr key={mtg.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{mtg.meetingCode}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDateIndonesian(mtg.date)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{prog?.name}</td>
                    <td className="px-4 py-3 text-slate-600">{mtg.topic}</td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">
                      {mtg.presentStudentCount} siswa
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatRupiah(settings.teacherRate)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                      {formatRupiah(honor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
