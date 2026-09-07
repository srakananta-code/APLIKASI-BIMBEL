import React, { useState } from 'react';
import {
  Megaphone,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Bell,
  CheckCheck,
  CalendarClock,
  ShieldCheck,
  Bookmark
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTimeIndonesian, formatDateIndonesian } from '../../services/businessLogic';
import { SystemNotification } from '../../types';

interface TeacherAnnouncementBoardProps {
  onNavigate?: (page: string) => void;
}

export const TeacherAnnouncementBoard: React.FC<TeacherAnnouncementBoardProps> = ({ onNavigate }) => {
  const {
    activeTeacherId,
    teachers,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'SCHEDULE' | 'ANNOUNCEMENT'>('ALL');

  const currentTeacher = teachers.find(t => t.id === activeTeacherId) || teachers[0];

  // Filter notifications relevant to this teacher or broadcast to all
  const teacherNotifs = notifications.filter(n => {
    const isTargeted =
      n.recipientTeacherId === currentTeacher?.id ||
      n.recipientTeacherId === 'ALL' ||
      n.metadata?.teacherId === currentTeacher?.id ||
      (!n.recipientTeacherId && (n.type === 'BROADCAST_ANNOUNCEMENT' || n.type === 'SCHEDULE_REMINDER'));

    return isTargeted;
  });

  const unreadCount = teacherNotifs.filter(n => !n.read && !n.isRead).length;
  const urgentUnread = teacherNotifs.filter(n => (!n.read && !n.isRead) && n.priority === 'URGENT');

  // Filter based on selected tab
  const filteredNotifs = teacherNotifs.filter(n => {
    const isUnread = !n.read && !n.isRead;
    if (activeTab === 'UNREAD') return isUnread;
    if (activeTab === 'SCHEDULE') return n.type === 'SCHEDULE_REMINDER' || n.category === 'PENGINGAT_JADWAL';
    if (activeTab === 'ANNOUNCEMENT') return n.type === 'BROADCAST_ANNOUNCEMENT' || n.category === 'PENGUMUMAN';
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Urgent Alert Banner if any unread urgent message exists */}
      {urgentUnread.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 p-3.5 sm:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <p className="text-xs font-bold text-rose-950">
              Penting: Ada {urgentUnread.length} pengumuman mendesak dari Admin yang perlu Anda perhatikan segera!
            </p>
          </div>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline flex-shrink-0 cursor-pointer"
          >
            Lihat Sekarang
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Papan Pengumuman &amp; Pengingat Admin
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Instruksi operasional, pengingat jam mengajar, dan pengumuman resmi bimbel
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="self-start sm:self-auto text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] opacity-80 font-mono">({teacherNotifs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'UNREAD'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/20 font-bold font-mono">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SCHEDULE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Pengingat Jadwal</span>
          </button>
          <button
            onClick={() => setActiveTab('ANNOUNCEMENT')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ANNOUNCEMENT'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Pengumuman Lembaga</span>
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
        {filteredNotifs.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {activeTab === 'UNREAD'
                ? 'Semua pengumuman & pengingat telah Anda baca!'
                : 'Belum ada notifikasi di kategori ini.'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pengumuman atau jadwal dari administrator akan muncul di sini secara realtime.
            </p>
          </div>
        ) : (
          filteredNotifs.map((item) => {
            const isRead = item.read || item.isRead;
            const isScheduleReminder = item.type === 'SCHEDULE_REMINDER' || item.category === 'PENGINGAT_JADWAL';
            const isUrgent = item.priority === 'URGENT';
            const isImportant = item.priority === 'IMPORTANT';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors ${
                  !isRead
                    ? isUrgent
                      ? 'bg-rose-50/40 border-l-4 border-rose-500'
                      : isImportant
                      ? 'bg-amber-50/40 border-l-4 border-amber-500'
                      : 'bg-indigo-50/30 border-l-4 border-indigo-500'
                    : 'bg-white hover:bg-slate-50/80 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 shadow-2xs ${
                        isScheduleReminder
                          ? 'bg-blue-100 text-blue-700'
                          : isUrgent
                          ? 'bg-rose-100 text-rose-700'
                          : isImportant
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isScheduleReminder ? (
                        <CalendarClock className="w-4 h-4" />
                      ) : isUrgent ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Megaphone className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide ${
                            isUrgent
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isImportant
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-800 text-white'
                          }`}
                        >
                          {item.priority || 'NORMAL'}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {isScheduleReminder ? 'PENGINGAT JADWAL' : 'PENGUMUMAN'}
                        </span>

                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                        {item.message}
                      </p>

                      {/* Optional Schedule Metadata Card */}
                      {item.metadata?.room && (
                        <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-100/90 rounded-lg text-[11px] text-slate-700 font-medium mt-2">
                          <span className="flex items-center gap-1 text-slate-600">
                            <Clock className="w-3 h-3 text-blue-600" />
                            {item.metadata.time || 'Waktu Sesi'}
                          </span>
                          <span>•</span>
                          <span>Ruang: <strong className="text-slate-900">{item.metadata.room}</strong></span>
                          {item.metadata.dayOfWeek && (
                            <>
                              <span>•</span>
                              <span>Hari: <strong>{item.metadata.dayOfWeek}</strong></span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Footer Info & Action */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span>Dari: <strong className="text-slate-700">{item.senderName || 'Admin Lembaga'}</strong></span>
                          <span>•</span>
                          <span>{formatDateTimeIndonesian(item.timestamp)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.actionUrl && onNavigate && (
                            <button
                              onClick={() => {
                                if (!isRead) markNotificationAsRead(item.id);
                                onNavigate(item.actionUrl!);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>{item.actionLabel || 'Buka Halaman'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {!isRead ? (
                            <button
                              onClick={() => markNotificationAsRead(item.id)}
                              className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-slate-500" />
                              <span>Tandai Dibaca</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Sudah dibaca
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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
