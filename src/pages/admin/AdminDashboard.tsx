import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Award,
  Wallet,
  ArrowDownCircle,
  Receipt,
  TrendingUp,
  CreditCard,
  Clock,
  ArrowRight,
  Eye,
  AlertCircle,
  PlusCircle,
  Sparkles,
  ChevronRight,
  Megaphone,
  BellRing,
  Send,
  CalendarClock,
  Trash2,
  CheckCheck,
  UserPlus,
  ShieldCheck,
  Copy,
  Check,
  Lock,
  UserCheck,
  ExternalLink,
  XCircle,
  CheckCircle,
  X,
  Filter,
  CalendarPlus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatDateIndonesian, formatDateTimeIndonesian } from '../../services/businessLogic';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { BroadcastModal } from '../../components/broadcast/BroadcastModal';
import { Meeting, User, UserRole } from '../../types';
import { userService } from '../../services/userService';
import { isMeetingNormalWithoutDeviation } from '../../services/attendanceService';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const {
    students,
    teachers,
    meetings,
    meetingStudents,
    studentCharges,
    studentPayments,
    teacherHonors,
    teacherPayments,
    expenses,
    programs,
    schedules,
    settings,
    auditLogs,
    notifications,
    deleteNotification,
    setActiveRole,
    createTeacher,
    createMeeting,
    validateMeetingAttendance,
    batchValidateAttendance,
    addToast
  } = useApp();

  const { userProfile: currentAuthUser } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Attendance Validation Modal State (Single)
  const [validationMeeting, setValidationMeeting] = useState<Meeting | null>(null);
  const [validationNotes, setValidationNotes] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Batch Approve Modal State (Multiple Normal Sessions)
  const [isBatchApproveModalOpen, setIsBatchApproveModalOpen] = useState<boolean>(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchApproveNotes, setBatchApproveNotes] = useState<string>('Disetujui massal (Batch Approve Otomatis Tanpa Deviasi)');

  // Normal vs Deviation Pending Meetings calculation
  const allPendingValidationMeetings = meetings.filter(m => m.validationStatus === 'MENUNGGU_VALIDASI');
  const normalPendingMeetings = allPendingValidationMeetings.filter(isMeetingNormalWithoutDeviation);
  const deviationPendingMeetings = allPendingValidationMeetings.filter(m => !isMeetingNormalWithoutDeviation(m));

  const totalNormalAttendees = normalPendingMeetings.reduce((sum, m) => sum + (m.presentStudentCount || 0), 0);
  const totalEstimatedTeacherHonorBatch = totalNormalAttendees * settings.teacherRate;
  const totalEstimatedStudentChargesBatch = totalNormalAttendees * settings.studentRate;

  // Floating Action Button (FAB) & Quick Session Modal State
  const [isQuickSessionModalOpen, setIsQuickSessionModalOpen] = useState<boolean>(false);
  const [quickTeacherId, setQuickTeacherId] = useState<string>('');
  const [quickProgramId, setQuickProgramId] = useState<string>('');
  const [quickDate, setQuickDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickStartTime, setQuickStartTime] = useState<string>('15:00');
  const [quickEndTime, setQuickEndTime] = useState<string>('16:00');
  const [quickTopic, setQuickTopic] = useState<string>('');
  const [quickStudentCount, setQuickStudentCount] = useState<number>(4);
  const [isSubmittingQuickSession, setIsSubmittingQuickSession] = useState<boolean>(false);

  // Filter for Rekap Honor Guru Per Sesi
  const [sessionHonorTeacherFilter, setSessionHonorTeacherFilter] = useState<string>('ALL');
  const [sessionHonorStatusFilter, setSessionHonorStatusFilter] = useState<string>('ALL');

  // Quick Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountType, setAccountType] = useState<'GURU' | 'ADMIN'>('GURU');
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('password123');
  const [accountPhone, setAccountPhone] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isCreatingNewTeacherMaster, setIsCreatingNewTeacherMaster] = useState(false);
  const [teacherSpecialization, setTeacherSpecialization] = useState('Matematika');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Success Modal
  const [createdAccountInfo, setCreatedAccountInfo] = useState<{
    name: string;
    email: string;
    password?: string;
    role: string;
    institution: string;
    teacherName?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsersList(data);
    } catch (e) {
      console.error('Error fetching users in dashboard:', e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const bimbelAdminUsers = usersList.filter(u => u.role === 'ADMIN');
  const bimbelGuruUsers = usersList.filter(u => u.role === 'GURU');
  
  // Teachers without login account
  const teachersWithoutAccount = teachers.filter(t => 
    !bimbelGuruUsers.some(u => u.teacherId === t.id || (u.email && t.email && u.email.toLowerCase() === t.email.toLowerCase()))
  );

  const handleOpenCreateTentorModal = (preselectedTeacher?: any) => {
    setAccountType('GURU');
    setAccountError(null);
    if (preselectedTeacher) {
      setSelectedTeacherId(preselectedTeacher.id);
      setIsCreatingNewTeacherMaster(false);
      setAccountName(preselectedTeacher.name);
      setAccountEmail(preselectedTeacher.email || `${preselectedTeacher.code.toLowerCase()}@educendikia.com`);
      setAccountPhone(preselectedTeacher.phone || '');
    } else {
      const firstUnlinked = teachersWithoutAccount[0];
      if (firstUnlinked) {
        setSelectedTeacherId(firstUnlinked.id);
        setIsCreatingNewTeacherMaster(false);
        setAccountName(firstUnlinked.name);
        setAccountEmail(firstUnlinked.email || `${firstUnlinked.code.toLowerCase()}@educendikia.com`);
        setAccountPhone(firstUnlinked.phone || '');
      } else {
        setSelectedTeacherId('');
        setIsCreatingNewTeacherMaster(true);
        setAccountName('');
        setAccountEmail('');
        setAccountPhone('');
      }
    }
    setAccountPassword('password123');
    setIsAccountModalOpen(true);
  };

  const handleOpenCreateAdminModal = () => {
    setAccountType('ADMIN');
    setAccountError(null);
    setSelectedTeacherId('');
    setIsCreatingNewTeacherMaster(false);
    setAccountName('');
    setAccountEmail('');
    setAccountPhone('');
    setAccountPassword('password123');
    setIsAccountModalOpen(true);
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);

    const institutionName = currentAuthUser?.institutionName || 'Bimbel EduCendikia';

    if (!accountName.trim() || !accountEmail.trim() || !accountPassword.trim()) {
      setAccountError('Nama, Email, dan Password wajib diisi.');
      return;
    }

    if (accountPassword.length < 6) {
      setAccountError('Password minimal 6 karakter.');
      return;
    }

    setIsCreatingAccount(true);
    try {
      let resolvedTeacherId: string | null = null;
      let resolvedTeacherName = accountName.trim();

      if (accountType === 'GURU') {
        if (isCreatingNewTeacherMaster) {
          const newCode = `GUR-${String(teachers.length + 1).padStart(3, '0')}`;
          const newTeacherData = {
            name: accountName.trim(),
            code: newCode,
            phone: accountPhone.trim() || '0812-0000-0000',
            email: accountEmail.trim(),
            specialtyPrograms: [teacherSpecialization],
            specializations: [teacherSpecialization],
            experienceLevel: 'STANDAR',
            honorScheme: 'PER_SISWA',
            isCustomHonor: false,
            transportFeePerMeeting: 0,
            bankName: 'BCA',
            bankAccountNumber: '',
            bankAccountHolder: accountName.trim(),
            status: 'AKTIF' as const,
            notes: 'Dibuat bersamaan dengan akun login tentor'
          };
          await createTeacher(newTeacherData as any);
          resolvedTeacherId = newCode;
        } else {
          if (!selectedTeacherId) {
            setAccountError('Silakan pilih salah satu data Tentor terkait.');
            setIsCreatingAccount(false);
            return;
          }
          resolvedTeacherId = selectedTeacherId;
          const found = teachers.find(t => t.id === selectedTeacherId);
          if (found) resolvedTeacherName = found.name;
        }
      }

      const newUser = await userService.createUser({
        displayName: accountName.trim(),
        email: accountEmail.trim().toLowerCase(),
        password: accountPassword,
        role: accountType,
        teacherId: resolvedTeacherId,
        phone: accountPhone.trim(),
        institutionName: institutionName,
        isActive: true
      }, {
        id: currentAuthUser?.id || 'ADMIN-1',
        name: currentAuthUser?.displayName || currentAuthUser?.name || 'Administrator',
        email: currentAuthUser?.email || 'admin@educendikia.com'
      });

      await fetchUsers();

      setCreatedAccountInfo({
        name: newUser.displayName || newUser.name,
        email: newUser.email,
        password: accountPassword,
        role: accountType === 'GURU' ? 'Tentor (Guru)' : 'Administrator Lembaga',
        institution: institutionName,
        teacherName: accountType === 'GURU' ? resolvedTeacherName : undefined
      });

      setIsAccountModalOpen(false);
      addToast('success', `Akun ${accountType === 'GURU' ? 'Tentor' : 'Admin'} berhasil dibuat untuk ${newUser.displayName}!`);
    } catch (err: any) {
      console.error('Error creating user from dashboard:', err);
      setAccountError(err.message || 'Gagal membuat akun login.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const copyWhatsAppText = () => {
    if (!createdAccountInfo) return;
    const text = `*INFORMASI AKUN LOGIN SISTEM BIMBEL*
Lembaga: ${createdAccountInfo.institution}
Peran: ${createdAccountInfo.role}
Nama: ${createdAccountInfo.name}

Email Login: ${createdAccountInfo.email}
Password: ${createdAccountInfo.password}

Silakan login pada aplikasi bimbel untuk mengakses jadwal, absensi, dan data lembaga. Harap ganti password setelah berhasil masuk. Terima kasih!`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    addToast('success', 'Format pesan WhatsApp berhasil disalin ke clipboard!');
  };

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState<'PENGUMUMAN' | 'PENGINGAT_JADWAL'>('PENGUMUMAN');
  const [selectedTeacherForBroadcast, setSelectedTeacherForBroadcast] = useState<string>('ALL');

  // Broadcast & Reminder Notifications
  const broadcastNotifications = notifications.filter(
    n => n.type === 'BROADCAST_ANNOUNCEMENT' || n.type === 'SCHEDULE_REMINDER' || n.category === 'PENGUMUMAN' || n.category === 'PENGINGAT_JADWAL'
  );

  // Derive metrics
  const activeStudentsCount = students.filter(s => s.status === 'AKTIF').length;
  const activeTeachersCount = teachers.filter(t => t.status === 'AKTIF').length;

  const todayStr = '2026-09-02'; // Demo baseline date matching key prompt scenario
  const currentMonthStr = '2026-09'; // September 2026

  // Today's meetings
  const todayMeetings = meetings.filter(m => m.date === todayStr);
  const completedTodayMeetings = todayMeetings.filter(m => m.status === 'SELESAI');

  // Month's meetings
  const monthMeetings = meetings.filter(m => m.date.startsWith(currentMonthStr));
  const completedMonthMeetings = monthMeetings.filter(m => m.status === 'SELESAI');

  // Today's present students
  const todayCompletedMeetingIds = new Set(completedTodayMeetings.map(m => m.id));
  const studentsPresentToday = meetingStudents.filter(
    ms => todayCompletedMeetingIds.has(ms.meetingId) && ms.attendanceStatus === 'HADIR'
  ).length;

  // Month student-meetings
  const monthCompletedMeetingIds = new Set(completedMonthMeetings.map(m => m.id));
  const studentMeetingsThisMonth = meetingStudents.filter(
    ms => monthCompletedMeetingIds.has(ms.meetingId) && ms.attendanceStatus === 'HADIR'
  ).length;

  // Financial metrics
  const totalStudentCharges = studentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalStudentPayments = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalStudentOutstanding = Math.max(0, totalStudentCharges - totalStudentPayments);

  const totalTeacherHonor = teacherHonors.reduce((sum, h) => sum + (h.totalHonor || 0), 0);
  const totalTeacherPaid = teacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalTeacherOutstanding = Math.max(0, totalTeacherHonor - totalTeacherPaid);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Month specific financial comparison
  const monthStudentCharges = studentCharges
    .filter(c => c.date.startsWith(currentMonthStr))
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const monthStudentPayments = studentPayments
    .filter(p => p.date.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthTeacherHonor = teacherHonors
    .filter(h => h.period.toLowerCase().includes('september'))
    .reduce((sum, h) => sum + (h.totalHonor || 0), 0);
  const monthExpenses = expenses
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Section I: Teacher Monitoring Table
  const teacherActivity = teachers.map(teacher => {
    const teacherTodaySchedules = schedules.filter(s => s.teacherId === teacher.id && s.status === 'AKTIF');
    const teacherMonthMeetings = meetings.filter(
      m => m.teacherId === teacher.id && m.date.startsWith(currentMonthStr) && m.status === 'SELESAI'
    );
    const teacherMonthMeetingIds = new Set(teacherMonthMeetings.map(m => m.id));
    
    const teacherTodayCompletedMeetings = meetings.filter(
      m => m.teacherId === teacher.id && m.date === todayStr && m.status === 'SELESAI'
    );
    const teacherTodayMeetingIds = new Set(teacherTodayCompletedMeetings.map(m => m.id));

    const todayPresentCount = meetingStudents.filter(
      ms => teacherTodayMeetingIds.has(ms.meetingId) && ms.attendanceStatus === 'HADIR'
    ).length;

    const monthStudentMeetingsCount = meetingStudents.filter(
      ms => teacherMonthMeetingIds.has(ms.meetingId) && ms.attendanceStatus === 'HADIR'
    ).length;

    const monthHonor = monthStudentMeetingsCount * settings.teacherRate;

    return {
      teacher,
      todaySchedulesCount: teacherTodaySchedules.length,
      todayCompletedCount: teacherTodayCompletedMeetings.length,
      todayPresentCount,
      monthStudentMeetingsCount,
      monthHonor,
      status: teacher.status
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome / Integration Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sistem Terintegrasi Otomatis (Single Source of Truth)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Pusat Monitoring Administrasi Bimbel
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Data absensi yang dilakukan Guru otomatis menghasilkan tagihan siswa (<span className="text-emerald-400 font-semibold">{formatRupiah(settings.studentRate)}/pertemuan</span>), perhitungan honor tentor (<span className="text-indigo-400 font-semibold">{formatRupiah(settings.teacherRate)}/siswa-pertemuan</span>), dan laporan tanpa input ulang.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setBroadcastCategory('PENGUMUMAN');
                setSelectedTeacherForBroadcast('ALL');
                setIsBroadcastModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Broadcast ke Guru</span>
            </button>
            <button
              onClick={() => onNavigate('schedules')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Kelola Jadwal</span>
            </button>
            <button
              onClick={() => onNavigate('student-payments')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Catat Pembayaran</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACCESS & USER MANAGEMENT: Single Bimbel Multi-User Control */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-slate-50 rounded-2xl p-5 border border-indigo-100/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Akses & Akun Pengguna Bimbel</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-slate-700 font-semibold border border-slate-200 shadow-2xs">
                Lembaga: <strong>{currentAuthUser?.institutionName || 'Bimbel EduCendikia'}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Kelola Akun Login Tentor & Administrator Tambahan
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Semua akun terhubung dalam satu sistem lembaga bimbel ini. Sebagai Admin, Anda dapat menerbitkan akun login baru untuk Tentor (Guru) atau rekan Administrator lainnya kapan saja.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenCreateTentorModal()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Buat Akun Tentor (Guru)</span>
            </button>
            <button
              onClick={() => handleOpenCreateAdminModal()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>+ Buat Akun Admin Baru</span>
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Kelola Semua Akun ({usersList.length})</span>
            </button>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-indigo-100/70 text-xs">
          <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Administrator Bimbel</span>
              <span className="text-slate-900 font-bold text-sm">{bimbelAdminUsers.length} Akun</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Tentor Memiliki Akun</span>
              <span className="text-emerald-700 font-bold text-sm">{bimbelGuruUsers.length} dari {teachers.length} Tentor</span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Tentor Belum Berakun</span>
              <span className={`font-bold text-sm ${teachersWithoutAccount.length > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {teachersWithoutAccount.length} Tentor
              </span>
            </div>
            {teachersWithoutAccount.length > 0 ? (
              <button
                onClick={() => handleOpenCreateTentorModal(teachersWithoutAccount[0])}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                title={`Buat akun untuk ${teachersWithoutAccount[0].name}`}
              >
                + Buat
              </button>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-bold">
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
            )}
          </div>

          <div className="bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Status Otentikasi</span>
              <span className="text-indigo-600 font-bold text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Firebase Active
              </span>
            </div>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Detail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* TOP STATS GRID (Matching Professional Polish Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all hover:shadow-md"
        >
          <div className="text-slate-500 text-sm font-medium mb-1">Siswa Aktif</div>
          <div className="text-3xl font-bold text-slate-900">{activeStudentsCount}</div>
          <div className="mt-2 text-xs text-green-600 font-medium">↑ 12% Dari bulan lalu</div>
        </div>

        <div
          onClick={() => onNavigate('meetings')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all hover:shadow-md"
        >
          <div className="text-slate-500 text-sm font-medium mb-1">Pertemuan Hari Ini</div>
          <div className="text-3xl font-bold text-blue-600">
            {todayMeetings.length > 0 ? `${completedTodayMeetings.length} / ${todayMeetings.length}` : '18'}
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            {completedTodayMeetings.length} Selesai / {todayMeetings.length} Terjadwal
          </div>
        </div>

        <div
          onClick={() => onNavigate('student-charges')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all hover:shadow-md"
        >
          <div className="text-slate-500 text-sm font-medium mb-1">Total Piutang Siswa</div>
          <div className="text-3xl font-bold text-red-600">{formatRupiah(totalStudentOutstanding)}</div>
          <div className="mt-2 text-xs text-red-500 font-medium">Memerlukan penagihan</div>
        </div>

        <div
          onClick={() => onNavigate('teacher-payments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-300 transition-all hover:shadow-md"
        >
          <div className="text-slate-500 text-sm font-medium mb-1">Honor Belum Dibayar</div>
          <div className="text-3xl font-bold text-orange-500">{formatRupiah(totalTeacherOutstanding)}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">Update realtime</div>
        </div>
      </div>

      {/* ADDITIONAL SUMMARY METRICS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ringkasan Tambahan (Bulan Ini)
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Periode: September 2026
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Total Guru Aktif</span>
            <span className="text-lg font-bold text-slate-900">{activeTeachersCount} Guru</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Siswa-Pertemuan (Basis Honor)</span>
            <span className="text-lg font-bold text-blue-700 font-mono">{studentMeetingsThisMonth}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Total Tagihan Siswa</span>
            <span className="text-lg font-bold text-emerald-700 font-mono">{formatRupiah(totalStudentCharges)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium block">Total Pengeluaran</span>
            <span className="text-lg font-bold text-slate-700 font-mono">{formatRupiah(totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: GURU ACTIVITY TABLE & LOG PERTEMUAN (Design 5-col split) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* TABLE: MONITORING GURU (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full inline-block"></span>
              Aktivitas Guru & Honor (Bulan Ini)
            </h2>
            <button
              onClick={() => onNavigate('teachers')}
              className="text-blue-600 text-xs sm:text-sm font-semibold hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[11px] sticky top-0 border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3">Nama Guru</th>
                  <th className="px-4 py-3">Pertemuan</th>
                  <th className="px-4 py-3">Siswa-Pertemuan</th>
                  <th className="px-4 py-3">Honor Accrued</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherActivity.map(item => (
                  <tr key={item.teacher.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {item.teacher.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{item.teacher.name}</p>
                          <p className="text-[10px] text-slate-500 font-normal">{item.teacher.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 text-xs">
                      {item.todayCompletedCount} Hari Ini / {item.monthStudentMeetingsCount > 0 ? Math.ceil(item.monthStudentMeetingsCount / 3) : 0} Kali
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 text-xs font-medium">
                      {item.monthStudentMeetingsCount} Siswa
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-700 text-xs sm:text-sm">
                      {formatRupiah(item.monthHonor)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        item.status === 'AKTIF'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setBroadcastCategory('PENGINGAT_JADWAL');
                            setSelectedTeacherForBroadcast(item.teacher.id);
                            setIsBroadcastModalOpen(true);
                          }}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title={`Kirim Pengingat Jadwal ke ${item.teacher.name}`}
                        >
                          <BellRing className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveRole('GURU', item.teacher.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-xs font-medium transition-colors cursor-pointer"
                          title={`Masuk sebagai ${item.teacher.name}`}
                        >
                          Buka
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LIST: DAFTAR ABSENSI & VALIDASI PERTEMUAN GURU (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">
                Daftar Absensi &amp; Validasi Guru
              </h2>
              {allPendingValidationMeetings.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  {allPendingValidationMeetings.length} Perlu Validasi
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* TOMBOL BATCH APPROVE SESI NORMAL TANPA DEVIASI */}
              {normalPendingMeetings.length > 0 ? (
                <button
                  id="btn-batch-approve-normal"
                  onClick={() => setIsBatchApproveModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer transform active:scale-95"
                  title="Validasi massal semua sesi normal tanpa deviasi"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Setujui Semua yang Menunggu ({normalPendingMeetings.length})</span>
                </button>
              ) : allPendingValidationMeetings.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{allPendingValidationMeetings.length} sesi perlu cek manual (ada deviasi)</span>
                </span>
              ) : null}

              <button
                onClick={() => onNavigate('meetings')}
                className="text-indigo-600 text-xs font-semibold hover:underline cursor-pointer ml-auto sm:ml-0"
              >
                Semua Pertemuan
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[420px]">
            {meetings.slice(0, 6).map((meeting) => {
              const teacher = teachers.find(t => t.id === meeting.teacherId);
              const program = programs.find(p => p.id === meeting.programId);
              const isWaitingValidation = meeting.validationStatus === 'MENUNGGU_VALIDASI';
              const isApproved = meeting.validationStatus === 'DISETUJUI';
              const isRejected = meeting.validationStatus === 'DITOLAK';

              return (
                <div
                  key={meeting.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isWaitingValidation
                      ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                      : isApproved
                      ? 'bg-slate-50/70 border-emerald-200'
                      : isRejected
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      {meeting.startTime} WIB • {formatDateIndonesian(meeting.date)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded uppercase font-bold text-slate-600 font-mono">
                        #{meeting.meetingCode}
                      </span>
                      {/* STATUS BADGE VALIDASI & DEVIASI */}
                      {isWaitingValidation ? (
                        <>
                          {isMeetingNormalWithoutDeviation(meeting) ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Normal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              ⚠️ Deviasi
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                            <span>Perlu Validasi</span>
                          </span>
                        </>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Disetujui</span>
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Ditolak</span>
                        </span>
                      ) : (
                        <StatusBadge status={meeting.status} size="sm" />
                      )}
                    </div>
                  </div>

                  <div className="font-bold text-slate-900 text-sm">
                    {program?.name || 'Bimbingan'} - <span className="text-indigo-700">{teacher?.name || '-'}</span>
                  </div>

                  {meeting.topic && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                      Materi: "{meeting.topic}"
                    </p>
                  )}

                  <div className="text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200/60 flex justify-between items-center flex-wrap gap-2">
                    <span className="font-medium">
                      Kehadiran: <strong className="text-slate-900">{meeting.presentStudentCount} Siswa Hadir</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-700 font-bold font-mono">
                        {isWaitingValidation ? (
                          <span className="text-amber-700">(Est. +{formatRupiah(meeting.presentStudentCount * settings.teacherRate)})</span>
                        ) : isApproved ? (
                          `+${formatRupiah(meeting.presentStudentCount * settings.teacherRate)} Honor`
                        ) : (
                          'Rp 0'
                        )}
                      </span>

                      {isWaitingValidation ? (
                        <button
                          onClick={() => {
                            setValidationMeeting(meeting);
                            setValidationNotes('');
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Validasi Sekarang</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedMeeting(meeting)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Lihat Detail Absensi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 font-medium border-t border-slate-100 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Absensi guru memerlukan validasi admin sebelum honor &amp; tagihan siswa otomatis dihitung.</span>
          </div>
        </div>
      </div>

      {/* SECTION BARU: REKAPITULASI HONOR GURU PER SESI (BUKAN DIGABUNG PER HARI) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Rekapitulasi Honor Guru Per Sesi (Transparan &amp; Rinci)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap sesi dihitung terpisah berdasarkan jumlah siswa hadir ({formatRupiah(settings.teacherRate)}/siswa-sesi) agar mudah diaudit tanpa kerancuan perhitungan per hari.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={sessionHonorTeacherFilter}
              onChange={e => setSessionHonorTeacherFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Guru (Tentor)</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>

            <select
              value={sessionHonorStatusFilter}
              onChange={e => setSessionHonorStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Status Validasi</option>
              <option value="WAITING">Menunggu Validasi</option>
              <option value="APPROVED">Disetujui &amp; Terhitung</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Tabel Sesi Honor */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold">Kode Sesi &amp; Tanggal</th>
                <th className="px-4 py-3.5 font-semibold">Guru Pengajar</th>
                <th className="px-4 py-3.5 font-semibold">Program / Mapel</th>
                <th className="px-4 py-3.5 font-semibold text-center">Siswa Hadir</th>
                <th className="px-4 py-3.5 font-semibold text-right">Tarif / Siswa</th>
                <th className="px-4 py-3.5 font-semibold text-right">Honor Sesi Ini</th>
                <th className="px-4 py-3.5 font-semibold text-center">Status Validasi</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const filteredSessions = meetings
                  .filter(m => m.status === 'SELESAI')
                  .filter(m => sessionHonorTeacherFilter === 'ALL' || m.teacherId === sessionHonorTeacherFilter)
                  .filter(m => {
                    if (sessionHonorStatusFilter === 'WAITING') return m.validationStatus === 'MENUNGGU_VALIDASI';
                    if (sessionHonorStatusFilter === 'APPROVED') return m.validationStatus === 'DISETUJUI';
                    if (sessionHonorStatusFilter === 'REJECTED') return m.validationStatus === 'DITOLAK';
                    return true;
                  });

                if (filteredSessions.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada catatan sesi pertemuan yang sesuai dengan filter.
                      </td>
                    </tr>
                  );
                }

                return filteredSessions.slice(0, 10).map(meeting => {
                  const teacher = teachers.find(t => t.id === meeting.teacherId);
                  const program = programs.find(p => p.id === meeting.programId);
                  const honorSesi = meeting.presentStudentCount * settings.teacherRate;
                  const isWaiting = meeting.validationStatus === 'MENUNGGU_VALIDASI';
                  const isApproved = meeting.validationStatus === 'DISETUJUI';
                  const isRejected = meeting.validationStatus === 'DITOLAK';

                  return (
                    <tr key={meeting.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-indigo-700">#{meeting.meetingCode}</div>
                        <div className="text-[11px] text-slate-500">
                          {formatDateIndonesian(meeting.date)} • {meeting.startTime} - {meeting.endTime}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{teacher?.name || '-'}</div>
                        <div className="text-[10px] text-slate-500">{teacher?.code}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800">{program?.name || '-'}</span>
                        {meeting.topic && (
                          <div className="text-[10px] text-slate-500 italic truncate max-w-xs">{meeting.topic}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                          {meeting.presentStudentCount} Siswa
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                        {formatRupiah(settings.teacherRate)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className={`font-mono font-black ${
                          isApproved ? 'text-emerald-700' : isWaiting ? 'text-amber-700' : 'text-slate-400'
                        }`}>
                          {formatRupiah(honorSesi)}
                        </div>
                        <div className="text-[9px] text-slate-400">per sesi mandiri</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isWaiting ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Menunggu Validasi</span>
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <X className="w-3 h-3 text-rose-600" />
                            <span>Ditolak</span>
                          </span>
                        ) : (
                          <StatusBadge status={meeting.status} size="sm" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isWaiting ? (
                          <button
                            onClick={() => {
                              setValidationMeeting(meeting);
                              setValidationNotes('');
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer mx-auto"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Validasi</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedMeeting(meeting)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer mx-auto flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* BUSINESS LOGIC SYSTEM TRACE OVERLAY CARD */}
      <div className="bg-slate-900 text-white rounded-xl shadow-xl p-5 border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Logic System Trace • Single Source of Truth
            </div>
            <h4 className="text-base font-bold text-white">
              Formula Kalkulasi Otomatis Les Bimbel
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl">
              Setiap kehadiran siswa dalam pertemuan otomatis memicu pembuatan tagihan siswa dan saldo honor guru secara konsisten tanpa rekonsiliasi manual.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Attendance Base</span>
              <span className="font-mono text-emerald-400 font-bold">{formatRupiah(settings.teacherRate)}/siswa</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Base</span>
              <span className="font-mono text-yellow-400 font-bold">{formatRupiah(settings.studentRate)}/siswa</span>
            </div>
            <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Status Mesin</span>
              <span className="text-green-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
                Tersinkronisasi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PUSAT BROADCAST & PENGINGAT GURU IN-APP */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Pusat Broadcast Pengumuman &amp; Pengingat Guru
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  In-App Realtime
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim pengumuman massal atau pengingat jadwal langsung ke dashboard guru/tentor
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setBroadcastCategory('PENGINGAT_JADWAL');
                setSelectedTeacherForBroadcast('ALL');
                setIsBroadcastModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 text-blue-600" />
              <span>+ Pengingat Jadwal</span>
            </button>
            <button
              onClick={() => {
                setBroadcastCategory('PENGUMUMAN');
                setSelectedTeacherForBroadcast('ALL');
                setIsBroadcastModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>+ Broadcast Pengumuman</span>
            </button>
          </div>
        </div>

        {/* Broadcast Statistics Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Pesan Broadcast</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{broadcastNotifications.length} Pesan</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Kategori Pengumuman</span>
            <span className="text-lg font-black text-indigo-700 mt-0.5 block">
              {broadcastNotifications.filter(n => n.type === 'BROADCAST_ANNOUNCEMENT' || n.category === 'PENGUMUMAN').length}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Pengingat Jadwal</span>
            <span className="text-lg font-black text-blue-700 mt-0.5 block">
              {broadcastNotifications.filter(n => n.type === 'SCHEDULE_REMINDER' || n.category === 'PENGINGAT_JADWAL').length}
            </span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Tingkat Prioritas Mendesak</span>
            <span className="text-lg font-black text-rose-700 mt-0.5 block">
              {broadcastNotifications.filter(n => n.priority === 'URGENT').length}
            </span>
          </div>
        </div>

        {/* Broadcast Feed / Table */}
        <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
          {broadcastNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <Megaphone className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800 text-xs">Belum ada broadcast pengumuman atau pengingat jadwal yang dikirim.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kirim pesan broadcast pertama Anda ke seluruh guru bimbel sekarang.
              </p>
              <button
                onClick={() => {
                  setBroadcastCategory('PENGUMUMAN');
                  setSelectedTeacherForBroadcast('ALL');
                  setIsBroadcastModalOpen(true);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Buat Pengumuman Pertama</span>
              </button>
            </div>
          ) : (
            broadcastNotifications.map((bNotif) => {
              const targetTeacher = teachers.find(t => t.id === bNotif.recipientTeacherId);
              const isSchedule = bNotif.type === 'SCHEDULE_REMINDER' || bNotif.category === 'PENGINGAT_JADWAL';
              const isUrgent = bNotif.priority === 'URGENT';
              const isImportant = bNotif.priority === 'IMPORTANT';

              return (
                <div key={bNotif.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                      isSchedule ? 'bg-blue-100 text-blue-700' : isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isSchedule ? <CalendarClock className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                          isUrgent ? 'bg-rose-600 text-white' : isImportant ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
                        }`}>
                          {bNotif.priority || 'NORMAL'}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {isSchedule ? 'PENGINGAT JADWAL' : 'PENGUMUMAN'}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {bNotif.recipientTeacherId === 'ALL' || !bNotif.recipientTeacherId
                            ? '📢 Semua Guru'
                            : `👤 ${targetTeacher?.name || bNotif.targetTeacherName || 'Guru'}`}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{bNotif.title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{bNotif.message}</p>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1">
                        <span>Dikirim: {formatDateTimeIndonesian(bNotif.timestamp)}</span>
                        <span>•</span>
                        <span>Oleh: {bNotif.senderName || 'Admin'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCheck className="w-3 h-3" />
                          {bNotif.read || bNotif.isRead ? 'Telah dibaca oleh penerima' : 'Terkirim ke dashboard guru'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('Hapus notifikasi ini dari sistem?')) {
                        deleteNotification(bNotif.id);
                      }
                    }}
                    title="Hapus Notifikasi"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        defaultCategory={broadcastCategory}
        defaultTeacherId={selectedTeacherForBroadcast}
      />

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <Modal
          isOpen={!!selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          title={`Detail Pertemuan: ${selectedMeeting.meetingCode}`}
          description={`Tanggal: ${formatDateIndonesian(selectedMeeting.date)} • ${selectedMeeting.startTime} - ${selectedMeeting.endTime}`}
          maxWidth="lg"
        >
          {(() => {
            const teacher = teachers.find(t => t.id === selectedMeeting.teacherId);
            const program = programs.find(p => p.id === selectedMeeting.programId);
            const attendances = meetingStudents.filter(ms => ms.meetingId === selectedMeeting.id);
            const presentCount = attendances.filter(a => a.attendanceStatus === 'HADIR').length;

            return (
              <div className="space-y-4 text-xs">
                {/* Information Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Guru Pengajar</span>
                    <span className="font-semibold text-slate-900">{teacher?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Program</span>
                    <span className="font-semibold text-slate-900">{program?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Status Pertemuan</span>
                    <StatusBadge status={selectedMeeting.status} size="sm" />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Materi/Topik</span>
                    <span className="font-medium text-slate-800">{selectedMeeting.topic || '-'}</span>
                  </div>
                </div>

                {/* Calculation Impact Summary */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                  <div className="flex items-center justify-between font-bold text-indigo-950 mb-1.5">
                    <span>Otomasi Database dari Absensi ini:</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px]">
                      {presentCount} Siswa Hadir
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-indigo-900 text-xs">
                    <div>
                      • Total Tagihan: <span className="font-bold">{presentCount} × {formatRupiah(settings.studentRate)} = {formatRupiah(presentCount * settings.studentRate)}</span>
                    </div>
                    <div>
                      • Honor Guru: <span className="font-bold">{presentCount} × {formatRupiah(settings.teacherRate)} = {formatRupiah(presentCount * settings.teacherRate)}</span>
                    </div>
                  </div>
                </div>

                {/* Student Attendance List */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                    Daftar Absensi Siswa ({attendances.length} Siswa)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {attendances.length === 0 ? (
                      <p className="p-4 text-center text-slate-400">Belum ada data absensi untuk pertemuan ini.</p>
                    ) : (
                      attendances.map(att => {
                        const student = students.find(s => s.id === att.studentId);
                        return (
                          <div key={att.id} className="p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {student?.name.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{student?.name || 'Siswa'}</p>
                                <p className="text-[10px] text-slate-500">{student?.nis} • {student?.grade}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {att.attendanceStatus === 'HADIR' ? (
                                <span className="text-[11px] font-semibold text-emerald-700">
                                  + {formatRupiah(settings.studentRate)} tagihan
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Tidak ada tagihan ({att.attendanceStatus.toLowerCase()})
                                </span>
                              )}
                              <StatusBadge status={att.attendanceStatus} size="sm" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* MODAL: Buat Akun Pengguna Baru (Tentor / Admin) */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  accountType === 'GURU' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {accountType === 'GURU' ? <GraduationCap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {accountType === 'GURU' ? 'Buat Akun Login Tentor' : 'Buat Akun Administrator Tambahan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lembaga: <strong className="text-slate-700">{currentAuthUser?.institutionName || 'Bimbel EduCendikia'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Role switch toggle */}
            <div className="mt-4 p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAccountType('GURU');
                  setAccountError(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  accountType === 'GURU' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Akun Tentor (Guru)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('ADMIN');
                  setAccountError(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  accountType === 'ADMIN' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Akun Administrator</span>
              </button>
            </div>

            {accountError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <span>{accountError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4 mt-4">
              {accountType === 'GURU' && (
                <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Pilih Hubungan Data Tentor:
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCreatingNewTeacherMaster}
                        onChange={e => {
                          const checked = e.target.checked;
                          setIsCreatingNewTeacherMaster(checked);
                          if (checked) {
                            setSelectedTeacherId('');
                            setAccountName('');
                            setAccountEmail('');
                          } else {
                            const unlinked = teachersWithoutAccount[0] || teachers[0];
                            if (unlinked) {
                              setSelectedTeacherId(unlinked.id);
                              setAccountName(unlinked.name);
                              setAccountEmail(unlinked.email || `${unlinked.code.toLowerCase()}@educendikia.com`);
                              setAccountPhone(unlinked.phone || '');
                            }
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Daftarkan Guru Baru Sekaligus</span>
                    </label>
                  </div>

                  {!isCreatingNewTeacherMaster ? (
                    <div>
                      <select
                        value={selectedTeacherId}
                        onChange={e => {
                          const tId = e.target.value;
                          setSelectedTeacherId(tId);
                          const t = teachers.find(item => item.id === tId);
                          if (t) {
                            setAccountName(t.name);
                            setAccountEmail(t.email || `${t.code.toLowerCase()}@educendikia.com`);
                            setAccountPhone(t.phone || '');
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="">-- Pilih Guru yang Terdaftar di Bimbel --</option>
                        {teachers.map(t => {
                          const hasAcc = bimbelGuruUsers.some(u => u.teacherId === t.id);
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.code}) {hasAcc ? '✓ [Sudah Ada Akun]' : '⚠️ [Belum Ada Akun]'}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Sistem otomatis menghubungkan akun login dengan riwayat jadwal, absensi, dan honor tentor ini.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Mata Pelajaran / Spesialisasi Utama
                      </label>
                      <input
                        type="text"
                        value={teacherSpecialization}
                        onChange={e => setTeacherSpecialization(e.target.value)}
                        placeholder="cth: Matematika, Fisika, Bahasa Inggris"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[11px] text-indigo-600 mt-1">
                        Data master tentor baru akan otomatis dibuat di daftar guru lembaga.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="cth: Siti Rahmawati, S.Pd."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={e => setAccountEmail(e.target.value)}
                    placeholder="nama@educendikia.com"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Sementara <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={accountPassword}
                    onChange={e => setAccountPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  value={accountPhone}
                  onChange={e => setAccountPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    accountType === 'GURU' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isCreatingAccount ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Mendaftarkan ke Firebase...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Terbitkan Akun {accountType === 'GURU' ? 'Tentor' : 'Admin'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Hasil Akun Dibuat & Salin Info WhatsApp */}
      {createdAccountInfo && (
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
                Kredensial login telah tersimpan di Firebase Authentication dan Firestore database.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Lembaga Bimbel</span>
                <span className="font-bold text-slate-900">{createdAccountInfo.institution}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Hak Akses</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {createdAccountInfo.role}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Nama Pengguna</span>
                <span className="font-semibold text-slate-900">{createdAccountInfo.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Email Login</span>
                <span className="font-mono font-bold text-blue-600 select-all">{createdAccountInfo.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Password Sementara</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">
                  {createdAccountInfo.password}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 space-y-2">
              <button
                onClick={copyWhatsAppText}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCopied ? (
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
                onClick={() => setCreatedAccountInfo(null)}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB): INPUT SESI BARU */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="fab-input-sesi-baru"
          onClick={() => {
            setQuickTeacherId(teachers[0]?.id || '');
            setQuickProgramId(programs[0]?.id || '');
            setQuickDate(new Date().toISOString().split('T')[0]);
            setQuickStartTime('15:00');
            setQuickEndTime('16:00');
            setQuickTopic('');
            setQuickStudentCount(4);
            setIsQuickSessionModalOpen(true);
          }}
          className="group flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer border border-indigo-400/30"
          title="Akses cepat menambahkan data absensi / jadwal sesi baru"
        >
          <div className="p-1 rounded-full bg-white/20 group-hover:rotate-90 transition-transform duration-300">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide">Input Sesi Baru</span>
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
        </button>
      </div>

      {/* MODAL: INPUT SESI BARU SECARA INSTAN */}
      {isQuickSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Input Sesi Pertemuan Baru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jadwalkan sesi belajar atau buat sesi absensi langsung untuk tentor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickSessionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!quickTeacherId || !quickProgramId) {
                  alert('Pilih guru dan program belajar');
                  return;
                }
                setIsSubmittingQuickSession(true);
                try {
                  const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
                  await createMeeting({
                    meetingCode: `SESI-${randomCode}`,
                    teacherId: quickTeacherId,
                    programId: quickProgramId,
                    date: quickDate,
                    startTime: quickStartTime,
                    endTime: quickEndTime,
                    room: 'Ruang Les Utama',
                    topic: quickTopic || 'Materi Bimbingan Reguler',
                    status: 'BERJALAN',
                    presentStudentCount: 0,
                    notes: 'Sesi dibuat langsung melalui Input Sesi Cepat'
                  });
                  addToast({
                    title: 'Sesi Berhasil Dibuat',
                    message: `Sesi baru untuk ${formatDateIndonesian(quickDate)} telah ditambahkan ke sistem.`,
                    type: 'success'
                  });
                  setIsQuickSessionModalOpen(false);
                } catch (err: any) {
                  alert(err.message || 'Gagal membuat sesi');
                } finally {
                  setIsSubmittingQuickSession(false);
                }
              }}
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Guru (Tentor) Pengajar *
                </label>
                <select
                  value={quickTeacherId}
                  onChange={e => setQuickTeacherId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code} - {t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Program Belajar / Mata Pelajaran *
                </label>
                <select
                  value={quickProgramId}
                  onChange={e => setQuickProgramId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Program --</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Sesi *
                  </label>
                  <input
                    type="date"
                    value={quickDate}
                    onChange={e => setQuickDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    value={quickStartTime}
                    onChange={e => setQuickStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    value={quickEndTime}
                    onChange={e => setQuickEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materi / Topik Pembelajaran
                </label>
                <input
                  type="text"
                  value={quickTopic}
                  onChange={e => setQuickTopic(e.target.value)}
                  placeholder="Contoh: Latihan Soal Aljabar Linear"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Integrasi Otomatis Sesi Baru:</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Setelah dibuat, tentor dapat langsung membuka sesi ini di dashboard guru untuk absensi siswa. Honor guru ({formatRupiah(settings.teacherRate)}/siswa) dan tagihan ({formatRupiah(settings.studentRate)}/siswa) akan diproses setelah validasi admin.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickSession}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingQuickSession ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan Sesi...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>Simpan Sesi Baru</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI VALIDASI ABSENSI GURU OLEH ADMIN */}
      {validationMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Validasi Absensi Pertemuan Guru
                  </h3>
                  <p className="text-xs text-slate-500">
                    Periksa kehadiran siswa sebelum honor guru dan tagihan siswa dihitung otomatis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setValidationMeeting(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Rincian Sesi */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Kode Sesi:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    #{validationMeeting.meetingCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Guru (Tentor):</span>
                  <span className="font-bold text-slate-800">
                    {teachers.find(t => t.id === validationMeeting.teacherId)?.name || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Program / Mata Pelajaran:</span>
                  <span className="font-semibold text-slate-800">
                    {programs.find(p => p.id === validationMeeting.programId)?.name || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Waktu &amp; Tanggal:</span>
                  <span className="font-medium text-slate-700">
                    {formatDateIndonesian(validationMeeting.date)} • {validationMeeting.startTime} - {validationMeeting.endTime} WIB
                  </span>
                </div>
                {validationMeeting.topic && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-0.5">Topik / Materi:</span>
                    <span className="font-medium text-slate-800 italic">"{validationMeeting.topic}"</span>
                  </div>
                )}
              </div>

              {/* Rincian Siswa Hadir & Simulasi Finansial Sesi Ini */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">Total Siswa Hadir:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
                    {validationMeeting.presentStudentCount} Siswa
                  </span>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Honor Guru Sesi Ini</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {formatRupiah(validationMeeting.presentStudentCount * settings.teacherRate)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ({validationMeeting.presentStudentCount} × {formatRupiah(settings.teacherRate)})
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Tagihan Siswa Masuk</span>
                    <span className="text-sm font-black text-indigo-700 font-mono">
                      {formatRupiah(validationMeeting.presentStudentCount * settings.studentRate)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ({validationMeeting.presentStudentCount} × {formatRupiah(settings.studentRate)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan Admin */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Verifikasi Admin (Opsional / Alasan Penolakan)
                </label>
                <textarea
                  value={validationNotes}
                  onChange={e => setValidationNotes(e.target.value)}
                  placeholder="Berikan catatan bila ada penyesuaian atau alasan jika menolak..."
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons: Tolak vs Setujui */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={isValidating}
                  onClick={async () => {
                    if (!confirm('Apakah Anda yakin ingin MENOLAK absensi sesi ini? Guru dapat melakukan pengajuan ulang absensi.')) {
                      return;
                    }
                    setIsValidating(true);
                    try {
                      await validateMeetingAttendance(
                        validationMeeting.id,
                        'REJECT',
                        validationNotes || 'Absensi ditolak oleh admin'
                      );
                      addToast({
                        title: 'Absensi Ditolak',
                        message: `Absensi sesi #${validationMeeting.meetingCode} telah ditolak.`,
                        type: 'warning'
                      });
                      setValidationMeeting(null);
                    } catch (err: any) {
                      alert(err.message || 'Gagal memproses validasi');
                    } finally {
                      setIsValidating(false);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Tolak Absensi</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setValidationMeeting(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isValidating}
                    onClick={async () => {
                      setIsValidating(true);
                      try {
                        await validateMeetingAttendance(
                          validationMeeting.id,
                          'APPROVE',
                          validationNotes || 'Disetujui oleh admin'
                        );
                        addToast({
                          title: 'Absensi Disetujui &amp; Honor Dihitung',
                          message: `Honor guru (${formatRupiah(validationMeeting.presentStudentCount * settings.teacherRate)}) dan tagihan siswa berhasil dibukukan!`,
                          type: 'success'
                        });
                        setValidationMeeting(null);
                      } catch (err: any) {
                        alert(err.message || 'Gagal menyetujui absensi');
                      } finally {
                        setIsValidating(false);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isValidating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Memproses Validasi...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Setujui &amp; Hitung Honor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BATCH APPROVE SESI JADWAL NORMAL TANPA DEVIASI */}
      {isBatchApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Setujui Semua yang Menunggu (Batch Approve)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validasi massal otomatis untuk sesi jadwal normal tanpa deviasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchApproveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Highlight Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Sesi Normal</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {normalPendingMeetings.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Hadir</span>
                  <span className="text-lg font-black text-emerald-800 font-mono">
                    {totalNormalAttendees} Siswa
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Estimasi Tagihan</span>
                  <span className="text-xs sm:text-sm font-black text-indigo-800 font-mono block truncate">
                    {formatRupiah(totalEstimatedStudentChargesBatch)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Estimasi Honor</span>
                  <span className="text-xs sm:text-sm font-black text-amber-800 font-mono block truncate">
                    {formatRupiah(totalEstimatedTeacherHonorBatch)}
                  </span>
                </div>
              </div>

              {/* Info Notice */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Efisiensi Validasi Pergantian Bulan:</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Sistem akan menyetujui seluruh {normalPendingMeetings.length} sesi normal di bawah ini. Tagihan siswa ({formatRupiah(settings.studentRate)}/kehadiran) dan honor guru ({formatRupiah(settings.teacherRate)}/kehadiran) otomatis tercatat ke buku keuangan bimbel.
                </p>
              </div>

              {/* Deviation Alert if any */}
              {deviationPendingMeetings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {deviationPendingMeetings.length} sesi dengan deviasi / catatan dilewati
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Sesi yang memiliki perubahan jam, indikasi masalah, atau catatan khusus tetap memerlukan validasi manual satu per satu demi akurasi data.
                    </span>
                  </div>
                </div>
              )}

              {/* Session List Breakdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Daftar Sesi Normal yang Akan Disetujui ({normalPendingMeetings.length} Sesi):
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs divide-y divide-slate-100">
                  {normalPendingMeetings.map(m => {
                    const t = teachers.find(item => item.id === m.teacherId);
                    const p = programs.find(item => item.id === m.programId);
                    return (
                      <div key={m.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                              #{m.meetingCode}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {p?.name || 'Program Bimbingan'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {formatDateIndonesian(m.date)} • {m.startTime} WIB • Guru: <span className="text-slate-700 font-medium">{t?.name || '-'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            {m.presentStudentCount} Siswa Hadir
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Validation Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Validasi Massal
                </label>
                <input
                  type="text"
                  value={batchApproveNotes}
                  onChange={e => setBatchApproveNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  placeholder="Catatan validasi batch..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isBatchProcessing}
                onClick={() => setIsBatchApproveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isBatchProcessing || normalPendingMeetings.length === 0}
                onClick={async () => {
                  setIsBatchProcessing(true);
                  try {
                    const idsToApprove = normalPendingMeetings.map(m => m.id);
                    await batchValidateAttendance(idsToApprove, batchApproveNotes);
                    setIsBatchApproveModalOpen(false);
                  } catch (err: any) {
                    alert(err.message || 'Gagal memproses validasi massal');
                  } finally {
                    setIsBatchProcessing(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBatchProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Memproses {normalPendingMeetings.length} Sesi...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Konfirmasi Setujui Semua ({normalPendingMeetings.length} Sesi)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
