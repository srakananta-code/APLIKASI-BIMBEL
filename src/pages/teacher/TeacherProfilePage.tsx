import React, { useState } from 'react';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  BookOpen, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  Award, 
  Clock, 
  Save, 
  Key, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndonesian } from '../../services/businessLogic';

export const TeacherProfilePage: React.FC = () => {
  const { teachers, updateTeacher, addToast } = useApp();
  const { userProfile, activeTeacherId } = useAuth();

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];

  const [phone, setPhone] = useState(currentTeacher?.phone || '');
  const [bankName, setBankName] = useState(currentTeacher?.bankAccount?.bankName || 'BCA');
  const [accountNumber, setAccountNumber] = useState(currentTeacher?.bankAccount?.accountNumber || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;

    setIsSaving(true);
    try {
      updateTeacher(currentTeacher.id, {
        phone,
        bankAccount: {
          bankName,
          accountNumber,
          accountHolder: currentTeacher.name
        }
      });
      addToast('success', 'Profil dan informasi rekening berhasil diperbarui!');
    } catch (err) {
      addToast('error', 'Gagal memperbarui profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <UserCheck className="w-7 h-7 text-emerald-600" />
          <span>Profil Pengajar & Pengaturan Akun</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Informasi identitas tentor, kontak, dan rekening pencairan honor bimbingan belajar.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {(currentTeacher?.name || 'G').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{currentTeacher?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                ROLE: GURU
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
                ID: {currentTeacher?.id}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Spesialisasi: <strong className="text-slate-800">{currentTeacher?.specializations?.join(', ') || currentTeacher?.specialization || 'Matematika & IPA'}</strong>
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {userProfile?.email || currentTeacher?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Bergabung: {currentTeacher?.joinedAt ? formatDateIndonesian(currentTeacher.joinedAt) : '01 September 2026'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Informasi Kontak & Pembayaran Honor
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Penerima Honor
              </label>
              <select
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
              >
                <option value="BCA">Bank BCA</option>
                <option value="BRI">Bank BRI</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="BNI">Bank BNI</option>
                <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                <option value="CIMB">Bank CIMB Niaga</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Rekening Bank
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 1234567890 a.n. Nama Anda"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Info Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Keamanan Akun & Hak Akses Terisolasi</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Akun Anda diverifikasi melalui Firebase Authentication dan dibatasi oleh Firestore Security Rules. 
              Sistem hanya mengizinkan Anda melihat dan mengelola data presensi, jadwal, dan honor yang berkaitan langsung dengan 
              ID Pengajar Anda (<strong>{activeTeacherId || currentTeacher?.id}</strong>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
