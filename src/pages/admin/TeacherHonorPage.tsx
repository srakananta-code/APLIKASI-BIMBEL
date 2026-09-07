import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  Eye,
  Wallet,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

interface TeacherHonorPageProps {
  onNavigate?: (page: string) => void;
}

export const TeacherHonorPage: React.FC<TeacherHonorPageProps> = ({ onNavigate }) => {
  const { teacherHonors, teachers, settings, meetings, meetingStudents } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedHonorDetail, setSelectedHonorDetail] = useState<any | null>(null);

  const totalHonor = teacherHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
  const totalPaid = teacherHonors.reduce((sum, h) => sum + (h.paidAmount || 0), 0);
  const totalUnpaid = teacherHonors.reduce((sum, h) => sum + (h.remainingAmount || 0), 0);

  const periods = Array.from(new Set(teacherHonors.map(h => h.period)));

  const filteredHonors = teacherHonors.filter(honor => {
    const teacher = teachers.find(t => t.id === honor.teacherId);
    const matchSearch =
      honor.honorNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher?.code || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchPeriod = filterPeriod === 'ALL' || honor.period === filterPeriod;
    const matchStatus = filterStatus === 'ALL' || honor.status === filterStatus;

    return matchSearch && matchPeriod && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-indigo-600" />
            <span>Rekapitulasi Honor Guru (Otomatis)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Dihitung otomatis dari akumulasi kehadiran siswa per pertemuan: <strong className="text-slate-900">{formatRupiah(settings.teacherRate)} / siswa-pertemuan</strong>
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('teacher-payments')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Proses Pembayaran Honor</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Akumulasi Honor Guru
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatRupiah(totalHonor)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dihitung murni dari data absensi hadir</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Honor Sudah Disalurkan
          </p>
          <p className="text-xl font-bold text-emerald-800 mt-1">{formatRupiah(totalPaid)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Telah dibayarkan kepada guru</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Sisa Honor Belum Dibayar
          </p>
          <p className="text-xl font-bold text-amber-800 mt-1">{formatRupiah(totalUnpaid)}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Kewajiban aktif lembaga les</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode rekap atau nama guru tentor..."
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
            <option value="BELUM_DIBAYAR">Belum Dibayar</option>
            <option value="SEBAGIAN">Sebagian</option>
            <option value="LUNAS">Lunas</option>
          </select>

          <select
            value={filterPeriod}
            onChange={e => setFilterPeriod(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Periode</option>
            {periods.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION AA: Table Rekap Honor Guru */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">No. Rekap</th>
                <th className="px-4 py-3.5 font-semibold">Nama Guru</th>
                <th className="px-4 py-3.5 font-semibold">Periode Bulan</th>
                <th className="px-4 py-3.5 font-semibold text-center">Total Pertemuan</th>
                <th className="px-4 py-3.5 font-semibold text-center">Siswa-Pertemuan</th>
                <th className="px-4 py-3.5 font-semibold">Tarif / Siswa-Sesi</th>
                <th className="px-4 py-3.5 font-semibold text-right">Total Honor</th>
                <th className="px-4 py-3.5 font-semibold text-right">Sudah Dibayar</th>
                <th className="px-4 py-3.5 font-semibold text-right">Sisa Honor</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHonors.map((hnr, idx) => {
                const teacher = teachers.find(t => t.id === hnr.teacherId);

                return (
                  <tr key={hnr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-900 whitespace-nowrap">
                      {hnr.honorNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{teacher?.name || 'Guru'}</p>
                      <p className="text-[10px] text-slate-400">{teacher?.code}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-900 whitespace-nowrap">
                      {hnr.period}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-800 whitespace-nowrap">
                      {hnr.meetingCount} Sesi
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-700 whitespace-nowrap">
                      {hnr.studentMeetingCount}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatRupiah(hnr.ratePerStudentMeeting)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(hnr.totalHonor)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-700 whitespace-nowrap">
                      {formatRupiah(hnr.paidAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                      <span className={hnr.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-600'}>
                        {formatRupiah(hnr.remainingAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={hnr.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedHonorDetail(hnr)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Lihat Detail Breakdown Honor"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL BREAKDOWN HONOR MODAL */}
      {selectedHonorDetail && (
        <Modal
          isOpen={!!selectedHonorDetail}
          onClose={() => setSelectedHonorDetail(null)}
          title={`Detail Honor Guru: ${teachers.find(t => t.id === selectedHonorDetail.teacherId)?.name}`}
          description={`Periode: ${selectedHonorDetail.period} • No. Rekap: ${selectedHonorDetail.honorNumber}`}
          maxWidth="lg"
        >
          {(() => {
            const hnr = selectedHonorDetail;
            const teacher = teachers.find(t => t.id === hnr.teacherId);
            const teacherMeetings = meetings.filter(
              m => m.teacherId === hnr.teacherId && m.status === 'SELESAI'
            );

            return (
              <div className="space-y-4 text-xs">
                {/* Math breakdown formula box */}
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl">
                  <h4 className="font-bold text-indigo-950 text-xs mb-1.5">
                    Rumus Perhitungan Honor (Sistem Terintegrasi):
                  </h4>
                  <p className="text-indigo-900 font-mono text-sm font-bold">
                    {hnr.studentMeetingCount} (Siswa-Pertemuan) × {formatRupiah(hnr.ratePerStudentMeeting)} = {formatRupiah(hnr.totalHonor)}
                  </p>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    *Hanya siswa dengan status <strong>HADIR</strong> yang dikalikan honor. Siswa Izin, Sakit, atau Alpa tidak diperhitungkan.
                  </p>
                </div>

                {/* Sesi Pertemuan Yang Berkontribusi */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                    Daftar Pertemuan Selesai Terkait:
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
                    {teacherMeetings.map(m => (
                      <div key={m.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{m.meetingCode} • {formatDateIndonesian(m.date)}</p>
                          <p className="text-[10px] text-slate-500">{m.topic || 'Sesi Les'}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-700 block">
                            {m.presentStudentCount} siswa hadir
                          </span>
                          <span className="text-[10px] text-slate-500">
                            +{formatRupiah(m.presentStudentCount * hnr.ratePerStudentMeeting)}
                          </span>
                        </div>
                      </div>
                    ))}
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
