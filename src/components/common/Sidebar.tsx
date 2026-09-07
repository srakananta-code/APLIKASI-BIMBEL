import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CalendarCheck,
  Receipt,
  CreditCard,
  Award,
  Wallet,
  ArrowDownCircle,
  FileText,
  Sliders,
  UserCheck,
  History,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCog,
  LogOut,
  Bell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

export interface NavGroup {
  groupTitle: string | null;
  items: NavItem[];
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpenMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpenMobile,
  isMobileOpen,
  onCloseMobile
}) => {
  const isMobile = isMobileOpen ?? isOpenMobile ?? false;
  const { userProfile, role, activeTeacherId, logout } = useAuth();
  const { teachers, notifications } = useApp();

  const userNotifs = notificationService.filterForUser(
    notifications,
    userProfile || { role, teacherId: activeTeacherId }
  );
  const unreadNotifCount = userNotifs.filter(n => !n.read && !n.isRead).length;

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    onCloseMobile();
  };

  const handleLogout = async () => {
    onCloseMobile();
    await logout();
  };

  const linkedTeacher = teachers.find(t => t.id === activeTeacherId);

  const adminMenuGroups: NavGroup[] = [
    {
      groupTitle: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      groupTitle: 'AKADEMIK',
      items: [
        { id: 'students', label: 'Data Siswa', icon: <Users className="w-4 h-4" /> },
        { id: 'teachers', label: 'Data Guru', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'programs', label: 'Program Belajar', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'schedules', label: 'Jadwal Les', icon: <Calendar className="w-4 h-4" /> },
        { id: 'meetings', label: 'Pertemuan & Absensi', icon: <CalendarCheck className="w-4 h-4" /> }
      ]
    },
    {
      groupTitle: 'KEUANGAN',
      items: [
        { id: 'financial-summary', label: 'Rekap Keuangan', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
        { id: 'receivables', label: 'Piutang Siswa', icon: <Receipt className="w-4 h-4 text-amber-400" /> },
        { id: 'student-charges', label: 'Tagihan Siswa', icon: <Receipt className="w-4 h-4" /> },
        { id: 'student-payments', label: 'Pembayaran Siswa', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'teacher-honor', label: 'Honor Guru', icon: <Award className="w-4 h-4" /> },
        { id: 'teacher-payments', label: 'Penyaluran Honor', icon: <Wallet className="w-4 h-4" /> },
        { id: 'expenses', label: 'Pengeluaran', icon: <ArrowDownCircle className="w-4 h-4" /> }
      ]
    },
    {
      groupTitle: 'LAPORAN & SISTEM',
      items: [
        { id: 'reports', label: 'Laporan Lengkap', icon: <FileText className="w-4 h-4" /> },
        { id: 'notifications', label: 'Pusat Notifikasi', icon: <Bell className="w-4 h-4 text-blue-400" /> }
      ]
    },
    {
      groupTitle: 'PENGATURAN',
      items: [
        { id: 'users', label: 'Pengguna Sistem', icon: <UserCog className="w-4 h-4" /> },
        { id: 'settings', label: 'Tarif & Pengaturan', icon: <Sliders className="w-4 h-4" /> },
        { id: 'audit-logs', label: 'Log Aktivitas Sistem', icon: <History className="w-4 h-4" /> }
      ]
    }
  ];

  const guruMenuGroups: NavGroup[] = [
    {
      groupTitle: null,
      items: [
        { id: 'guru-dashboard', label: 'Dashboard Guru', icon: <LayoutDashboard className="w-4 h-4" /> }
      ]
    },
    {
      groupTitle: 'JADWAL',
      items: [
        { id: 'guru-schedules', label: 'Jadwal Saya', icon: <Calendar className="w-4 h-4" /> }
      ]
    },
    {
      groupTitle: 'KEGIATAN MENGAJAR',
      items: [
        { id: 'guru-attendance', label: 'Absensi Siswa (Live)', icon: <Sparkles className="w-4 h-4 text-emerald-400" />, highlight: true },
        { id: 'guru-meetings', label: 'Pertemuan Saya', icon: <CalendarCheck className="w-4 h-4" /> },
        { id: 'guru-students', label: 'Siswa Bimbingan', icon: <Users className="w-4 h-4" /> }
      ]
    },
    {
      groupTitle: 'HONOR',
      items: [
        { id: 'guru-honor', label: 'Rekap Honor Saya', icon: <Award className="w-4 h-4" /> }
      ]
    },
    {
      groupTitle: 'AKUN & NOTIFIKASI',
      items: [
        { id: 'guru-notifications', label: 'Notifikasi & Pengingat', icon: <Bell className="w-4 h-4 text-blue-400" /> },
        { id: 'guru-profile', label: 'Profil Saya', icon: <UserCheck className="w-4 h-4" /> }
      ]
    }
  ];

  const activeGroups = role === 'ADMIN' ? adminMenuGroups : guruMenuGroups;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Sidebar Header */}
      <div className="p-5 sm:p-6 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
            {role === 'ADMIN' ? 'A' : 'G'}
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            {role === 'ADMIN' ? 'LES-ADMIN' : 'LES-GURU'}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-400 font-medium">
          {role === 'ADMIN' ? 'Portal Administrator' : `Portal Pengajar • ${userProfile?.displayName || userProfile?.name}`}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {group.groupTitle ? (
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                {group.groupTitle}
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                Main Menu
              </div>
            )}
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                      isActive
                        ? role === 'ADMIN' ? 'bg-blue-600 text-white font-medium shadow-sm' : 'bg-emerald-600 text-white font-medium shadow-sm'
                        : item.highlight
                        ? 'bg-emerald-950/40 text-emerald-300 hover:bg-slate-800 rounded-md'
                        : 'text-slate-300 hover:bg-slate-800 rounded-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 ${isActive ? 'opacity-100 text-white' : 'opacity-80 text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(item.id === 'notifications' || item.id === 'guru-notifications') && unreadNotifCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                          {unreadNotifCount}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 opacity-80" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-xs text-white flex-shrink-0">
            {(userProfile?.displayName || userProfile?.name || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">
              {userProfile?.displayName || userProfile?.name}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              <span>{role} {activeTeacherId ? `(${activeTeacherId})` : ''}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Keluar / Logout"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-800 h-screen sticky top-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
