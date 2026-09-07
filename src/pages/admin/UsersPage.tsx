import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Power, 
  GraduationCap, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Key, 
  Lock, 
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { userService, CreateUserData } from '../../services/userService';
import { User, UserRole, Teacher } from '../../types';
import { formatDateTimeIndonesian } from '../../services/businessLogic';

interface UsersPageProps {
  onNavigate?: (page: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onNavigate }) => {
  const { teachers, addToast, createTeacher } = useApp();
  const { userProfile: currentAdminProfile } = useAuth();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'GURU'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State: Create New User
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    displayName: '',
    role: 'GURU',
    teacherId: '',
    phone: '',
    isActive: true
  });
  const [isCreatingNewTeacherMaster, setIsCreatingNewTeacherMaster] = useState(false);
  const [teacherSpecialization, setTeacherSpecialization] = useState('Matematika');
  const [formError, setFormError] = useState<string | null>(null);

  // Success Modal State
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    institutionName: string;
  } | null>(null);
  const [isCopiedCreds, setIsCopiedCreds] = useState(false);

  // Modal State: Edit Role / Link Teacher
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('GURU');
  const [editTeacherId, setEditTeacherId] = useState<string>('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsersList(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      addToast('error', 'Gagal memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentAdminProfile?.id) {
      addToast('warning', 'Anda tidak dapat menonaktifkan akun yang sedang digunakan saat ini.');
      return;
    }

    try {
      const newStatus = await userService.toggleUserActive(
        user.id,
        user.isActive,
        {
          id: currentAdminProfile?.id || 'ADMIN',
          name: currentAdminProfile?.name || 'Administrator'
        }
      );

      setUsersList(prev =>
        prev.map(u => (u.id === user.id ? { ...u, isActive: newStatus, status: newStatus ? 'AKTIF' : 'NONAKTIF' } : u))
      );

      addToast(
        'success',
        `Akun ${user.displayName || user.name} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
    } catch (err) {
      console.error('Error toggling user status:', err);
      addToast('error', 'Gagal memperbarui status akun pengguna.');
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditTeacherId(user.teacherId || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditRole = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await userService.updateUserRole(
        editingUser.id,
        editRole,
        editRole === 'GURU' ? editTeacherId || null : null,
        {
          id: currentAdminProfile?.id || 'ADMIN',
          name: currentAdminProfile?.name || 'Administrator'
        }
      );

      setUsersList(prev =>
        prev.map(u =>
          u.id === editingUser.id
            ? { ...u, role: editRole, teacherId: editRole === 'GURU' ? editTeacherId || null : null }
            : u
        )
      );

      addToast('success', `Peran & Guru Terkait untuk ${editingUser.name} berhasil diperbarui.`);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating role:', err);
      addToast('error', 'Gagal mengubah peran akun pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const institution = currentAdminProfile?.institutionName || 'Bimbel EduCendikia';

    if (!formData.email.trim() || !formData.displayName.trim() || !formData.password?.trim()) {
      setFormError('Nama, Email, dan Password wajib diisi.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password minimal harus 6 karakter.');
      return;
    }

    if (formData.role === 'GURU' && !isCreatingNewTeacherMaster && !formData.teacherId) {
      setFormError('Untuk role GURU, silakan pilih data Guru terkait atau centang buat data guru baru.');
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedTeacherId = formData.teacherId;

      if (formData.role === 'GURU' && isCreatingNewTeacherMaster) {
        const newCode = `GUR-${String(teachers.length + 1).padStart(3, '0')}`;
        await createTeacher({
          name: formData.displayName.trim(),
          code: newCode,
          phone: formData.phone || '0812-0000-0000',
          email: formData.email.trim(),
          specialtyPrograms: [teacherSpecialization],
          specializations: [teacherSpecialization],
          experienceLevel: 'STANDAR',
          honorScheme: 'PER_SISWA',
          isCustomHonor: false,
          transportFeePerMeeting: 0,
          bankName: 'BCA',
          bankAccountNumber: '',
          bankAccountHolder: formData.displayName.trim(),
          status: 'AKTIF',
          notes: 'Dibuat bersamaan dengan akun login tentor'
        } as any);
        resolvedTeacherId = newCode;
      }

      const newUser = await userService.createUser({
        ...formData,
        teacherId: resolvedTeacherId,
        institutionName: institution
      }, {
        id: currentAdminProfile?.id || 'ADMIN',
        name: currentAdminProfile?.name || 'Administrator',
        email: currentAdminProfile?.email || 'admin@educendikia.com'
      });

      setUsersList(prev => [newUser, ...prev]);
      addToast('success', `Akun ${newUser.displayName} berhasil dibuat!`);
      setIsCreateModalOpen(false);

      // Show credentials popup modal
      setCreatedCredentials({
        name: newUser.displayName || newUser.name,
        email: newUser.email,
        password: formData.password,
        role: newUser.role,
        institutionName: institution
      });

      setFormData({
        email: '',
        password: '',
        displayName: '',
        role: 'GURU',
        teacherId: '',
        phone: '',
        isActive: true
      });
      setIsCreatingNewTeacherMaster(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal membuat akun baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter(user => {
    const matchSearch =
      (user.displayName || user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.teacherId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' ? user.isActive !== false : user.isActive === false);

    return matchSearch && matchRole && matchStatus;
  });

  const totalUsers = usersList.length;
  const totalAdmins = usersList.filter(u => u.role === 'ADMIN').length;
  const totalGurus = usersList.filter(u => u.role === 'GURU').length;
  const totalInactive = usersList.filter(u => u.isActive === false).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-blue-600" />
              <span>Pengelolaan Pengguna Sistem</span>
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {currentAdminProfile?.institutionName || 'Bimbel EduCendikia'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Sebagai Administrator, Anda dapat membuat akun login untuk Tentor (Guru) dan Administrator lainnya dalam satu lembaga bimbel ini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setIsCreatingNewTeacherMaster(false);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Akun</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalUsers}</div>
          <p className="text-xs text-slate-400 mt-0.5">Terdaftar di Auth & Firestore</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Admin</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-2">{totalAdmins}</div>
          <p className="text-xs text-slate-400 mt-0.5">Akses Penuh Master & Keuangan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Guru / Tentor</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{totalGurus}</div>
          <p className="text-xs text-slate-400 mt-0.5">Terhubung ke Data Guru</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nonaktif</span>
            <Power className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{totalInactive}</div>
          <p className="text-xs text-slate-400 mt-0.5">Akses Login Ditangguhkan</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, ID guru..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Role</option>
              <option value="ADMIN">ADMIN Saja</option>
              <option value="GURU">GURU Saja</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Email & Kontak</th>
                <th className="py-3 px-4">Role & Hak Akses</th>
                <th className="py-3 px-4">Guru Terkait (Foreign Key)</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Login Terakhir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Memuat daftar akun pengguna...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ditemukan data pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const linkedTeacher = teachers.find(t => t.id === user.teacherId);
                  const isCurrent = user.id === currentAdminProfile?.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              user.role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {(user.displayName || user.name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{user.displayName || user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-md font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">UID: {user.id.substring(0, 10)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-mono">{user.email}</div>
                        {user.phone && <div className="text-[11px] text-slate-400">{user.phone}</div>}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-blue-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <UserCheck className="w-3.5 h-3.5" />
                            GURU
                          </span>
                        )}
                      </td>

                      {/* Linked Teacher */}
                      <td className="py-3.5 px-4">
                        {user.role === 'GURU' ? (
                          user.teacherId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {user.teacherId}
                              </span>
                              {linkedTeacher && (
                                <span className="text-slate-700 font-medium truncate max-w-[130px]">
                                  ({linkedTeacher.name})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-600 text-[11px] font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <AlertCircle className="w-3 h-3" />
                              Belum Dihubungkan
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-xs italic">- (Akses Global)</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {user.lastLoginAt ? (
                          formatDateTimeIndonesian(user.lastLoginAt)
                        ) : (
                          <span className="text-slate-400 italic">Belum pernah login</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Role & Link */}
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Ubah Role & Relasi Guru"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              user.isActive !== false
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            } ${isCurrent ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title={user.isActive !== false ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah User Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Buat Akun Pengguna Baru</h3>
                  <p className="text-xs text-slate-500">Mendaftarkan login Firebase & Firestore users</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="cth: Rahmat Hidayat, S.Pd."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@educendikia.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 karakter"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="GURU">GURU (Portal Tentor)</option>
                    <option value="ADMIN">ADMIN (Akses Penuh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.role === 'GURU' && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-900">
                      Hubungkan ke Data Master Guru <span className="text-rose-500">*</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCreatingNewTeacherMaster}
                        onChange={e => {
                          const checked = e.target.checked;
                          setIsCreatingNewTeacherMaster(checked);
                          if (checked) {
                            setFormData(prev => ({ ...prev, teacherId: '' }));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Daftarkan Guru Baru Sekaligus</span>
                    </label>
                  </div>

                  {!isCreatingNewTeacherMaster ? (
                    <>
                      <p className="text-[11px] text-emerald-700">
                        Pilih guru yang bersangkutan untuk menghubungkan akun login dengan riwayat jadwal, absensi, dan honor tentor.
                      </p>
                      <select
                        value={formData.teacherId || ''}
                        onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                        required={!isCreatingNewTeacherMaster}
                        className="w-full mt-1.5 px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">-- Pilih Guru / Tentor --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.code || t.id}) - {t.specialization || 'Tentor'}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                        Mata Pelajaran / Spesialisasi Pengajar
                      </label>
                      <input
                        type="text"
                        value={teacherSpecialization}
                        onChange={e => setTeacherSpecialization(e.target.value)}
                        placeholder="cth: Matematika, Fisika, Bahasa Inggris"
                        className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Sistem akan otomatis membuat data master guru baru dengan kode dan profil ini.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Buat Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Hasil Akun Dibuat & Salin Info WhatsApp */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Akun Pengguna Berhasil Dibuat!
              </h3>
              <p className="text-xs text-slate-500">
                Kredensial login telah tersimpan di Firebase Authentication dan database Firestore.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Lembaga Bimbel</span>
                <span className="font-bold text-slate-900">{createdCredentials.institutionName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Hak Akses (Role)</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {createdCredentials.role === 'GURU' ? 'TENTOR / GURU' : 'ADMINISTRATOR'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Nama Pengguna</span>
                <span className="font-semibold text-slate-900">{createdCredentials.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Email Login</span>
                <span className="font-mono font-bold text-blue-600 select-all">{createdCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Password Sementara</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                  {createdCredentials.password || '-'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <button
                onClick={() => {
                  const roleLabel = createdCredentials.role === 'GURU' ? 'Tentor (Guru)' : 'Administrator';
                  const text = `*KREDENSIAL LOGIN SISTEM BIMBEL*\n\n` +
                    `Halo Bapak/Ibu *${createdCredentials.name}*,\n` +
                    `Berikut adalah akun akses Anda di *${createdCredentials.institutionName}*:\n\n` +
                    `• Peran: *${roleLabel}*\n` +
                    `• Email Login: *${createdCredentials.email}*\n` +
                    `• Password: *${createdCredentials.password || '-'}*\n\n` +
                    `Silakan login dan segera ganti password setelah pertama kali masuk sistem demi keamanan. Terima kasih!`;

                  navigator.clipboard.writeText(text);
                  setIsCopiedCreds(true);
                  addToast('success', 'Format info login WhatsApp berhasil disalin ke clipboard!');
                  setTimeout(() => setIsCopiedCreds(false), 3000);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCopiedCreds ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Format WhatsApp Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Informasi Akun (Format WhatsApp)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Role & Link Teacher */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ubah Role & Relasi Guru</h3>
                  <p className="text-xs text-slate-500">{editingUser.displayName || editingUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peran Pengguna (Role)</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN (Akses Seluruh Sistem)</option>
                  <option value="GURU">GURU (Khusus Jadwal & Honor Sendiri)</option>
                </select>
              </div>

              {editRole === 'GURU' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hubungkan ke Master Guru (teacherId)
                  </label>
                  <select
                    value={editTeacherId}
                    onChange={e => setEditTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Belum Dihubungkan --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code || t.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditRole}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
