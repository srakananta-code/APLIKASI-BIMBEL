import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Bell,
  UserCheck,
  Shield,
  RotateCcw,
  Menu,
  ChevronDown,
  Clock,
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  AlertCircle,
  Megaphone,
  CalendarClock,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatDateTimeIndonesian } from '../../services/businessLogic';
import { notificationService } from '../../services/notificationService';
import { UserRole, SystemNotification } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigate?: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate }) => {
  const {
    settings,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    resetToDefaultData,
    teachers
  } = useApp();

  const { userProfile, role, activeTeacherId, logout } = useAuth();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const relevantNotifications = notificationService.filterForUser(
    notifications,
    userProfile || { role, teacherId: activeTeacherId }
  );

  const unreadCount = relevantNotifications.filter(n => !n.read && !n.isRead).length;

  const handleNotifClick = (notif: SystemNotification) => {
    if (!notif.read && !notif.isRead) {
      markNotificationAsRead(notif.id);
    }
    setIsNotifDropdownOpen(false);

    if (!onNavigate) return;

    if (notif.actionUrl) {
      onNavigate(notif.actionUrl);
      return;
    }

    const refType = (notif.referenceType || '').toUpperCase();
    if (refType === 'STUDENT_PAYMENT') {
      onNavigate('student-payments');
    } else if (refType === 'RECEIVABLE' || refType === 'STUDENT_CHARGE') {
      onNavigate(role === 'ADMIN' ? 'receivables' : 'guru-dashboard');
    } else if (refType === 'TEACHER_HONOR') {
      onNavigate(role === 'ADMIN' ? 'teacher-honor' : 'guru-honor');
    } else if (refType === 'MEETING') {
      onNavigate(role === 'ADMIN' ? 'meetings' : 'guru-meetings');
    } else if (refType === 'SCHEDULE') {
      onNavigate(role === 'ADMIN' ? 'schedules' : 'guru-schedules');
    } else {
      onNavigate(role === 'ADMIN' ? 'notifications' : 'guru-notifications');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserDropdownOpen(false);
    await logout();
  };

  const linkedTeacher = teachers.find(t => t.id === activeTeacherId);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Brand & Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-sm">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  {settings.name.split(' ')[0]} <span className="text-blue-600">{settings.name.split(' ').slice(1).join(' ')}</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                  Auth Active
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 font-medium">
                Sistem Administrasi Terpadu • Firebase Auth & Role Guard
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Rates / Business Logic Banner */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Tagihan Siswa:</span>
            <span className="font-mono font-bold text-emerald-700">{formatRupiah(settings.studentRate)}</span>
            <span className="text-slate-400">/pertemuan</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Honor Guru:</span>
            <span className="font-mono font-bold text-blue-700">{formatRupiah(settings.teacherRate)}</span>
            <span className="text-slate-400">/siswa-pertemuan</span>
          </div>
        </div>

        {/* Right Side: Reset, Notifications, User Account Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (window.confirm('Reset database kembali ke dataset demo awal?')) {
                resetToDefaultData();
              }
            }}
            title="Reset ke Data Demo Awal"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset Demo</span>
          </button>

          {/* Notifications Button */}
          <div className="relative" ref={notifDropdownRef}>
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="relative p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Notifikasi & Aktivitas
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {unreadCount} belum dibaca
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {relevantNotifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Belum ada notifikasi
                    </div>
                  ) : (
                    relevantNotifications.map((notif, idx) => {
                      const isUnread = !notif.read && !notif.isRead;
                      const isSchedule = notif.type === 'SCHEDULE_REMINDER' || notif.category === 'PENGINGAT_JADWAL';
                      const isUrgent = notif.priority === 'URGENT';
                      const isImportant = notif.priority === 'IMPORTANT';

                      return (
                        <div
                          key={notif.id ? `notif-${notif.id}-${idx}` : `notif-${idx}`}
                          onClick={() => handleNotifClick(notif)}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                            isUnread
                              ? isUrgent
                                ? 'bg-rose-50/50 border-l-2 border-rose-500'
                                : isImportant
                                ? 'bg-amber-50/50 border-l-2 border-amber-500'
                                : 'bg-blue-50/40 border-l-2 border-indigo-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                              isSchedule
                                ? 'bg-blue-100 text-blue-700'
                                : isUrgent
                                ? 'bg-rose-100 text-rose-700'
                                : isImportant
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {isSchedule ? (
                                <CalendarClock className="w-3.5 h-3.5" />
                              ) : isUrgent ? (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              ) : notif.type === 'BROADCAST_ANNOUNCEMENT' ? (
                                <Megaphone className="w-3.5 h-3.5" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {notif.priority && notif.priority !== 'NORMAL' && (
                                    <span className={`px-1 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                                      isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                                    }`}>
                                      {notif.priority}
                                    </span>
                                  )}
                                  <p className="text-xs font-semibold text-slate-900 truncate">
                                    {notif.title}
                                  </p>
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                                  <Clock className="w-3 h-3" />
                                  {formatDateTimeIndonesian(notif.timestamp || notif.createdAt || '').split(' ')[1]}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              {(notif.actionLabel || notif.referenceType) && (
                                <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 hover:underline">
                                  {notif.actionLabel || 'Buka Rincian'} &rarr;
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer: Link to Full Notification Center */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsNotifDropdownOpen(false);
                      if (onNavigate) {
                        onNavigate(role === 'ADMIN' ? 'notifications' : 'guru-notifications');
                      }
                    }}
                    className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer py-1"
                  >
                    Buka Pusat Notifikasi Lengkap &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account & Logout Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 shadow-sm'
                  : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold text-xs">
                {(userProfile?.displayName || userProfile?.name || 'U').substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left leading-none hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                    {role === 'ADMIN' ? 'ADMINISTRATOR' : 'GURU'}
                  </span>
                  {activeTeacherId && (
                    <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-800 rounded-sm">
                      {activeTeacherId}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold truncate max-w-[120px] block mt-0.5">
                  {userProfile?.displayName || userProfile?.name || 'Pengguna'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Account Details Header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Akun Login Aktif
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {userProfile?.displayName || userProfile?.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    {userProfile?.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      ROLE: {role}
                    </span>
                    {role === 'GURU' && linkedTeacher && (
                      <span className="text-[10px] text-slate-600 truncate">
                        • {linkedTeacher.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Shortcut if Guru */}
                {role === 'GURU' && onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate('guru-profile');
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Lihat Profil Pengajar</span>
                  </button>
                )}

                {/* Users Management Shortcut if Admin */}
                {role === 'ADMIN' && onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate('users');
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Kelola Pengguna Sistem</span>
                  </button>
                )}

                {/* Logout Button */}
                <div className="pt-2 border-t border-slate-100 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
