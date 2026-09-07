import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Filter, 
  ExternalLink, 
  CalendarClock, 
  AlertTriangle, 
  Megaphone, 
  Sparkles, 
  RefreshCw, 
  Receipt, 
  Award, 
  CheckCheck,
  CreditCard,
  Layers,
  Inbox
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { formatDateTimeIndonesian } from '../../services/businessLogic';
import { SystemNotification } from '../../types';

interface NotificationsPageProps {
  onNavigate: (page: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    checkReminders 
  } = useApp();
  const { userProfile, role, activeTeacherId } = useAuth();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter notifications appropriate for this user & role
  const userNotifications = notificationService.filterForUser(
    notifications, 
    userProfile || { role, teacherId: activeTeacherId }
  );

  const unreadCount = userNotifications.filter(n => !n.read && !n.isRead).length;
  const readCount = userNotifications.filter(n => n.read || n.isRead).length;

  const filteredNotifications = userNotifications.filter(n => {
    const isUnread = !n.read && !n.isRead;
    if (activeTab === 'UNREAD' && !isUnread) return false;
    if (activeTab === 'READ' && isUnread) return false;

    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'TAGIHAN') {
        const isTagihan = n.category === 'TAGIHAN' || 
          n.type === 'PAYMENT_RECEIVED' || 
          n.type === 'RECEIVABLE_REMINDER' || 
          n.referenceType === 'STUDENT_PAYMENT' || 
          n.referenceType === 'STUDENT_CHARGE' || 
          n.referenceType === 'RECEIVABLE';
        if (!isTagihan) return false;
      } else if (selectedCategory === 'JADWAL') {
        const isJadwal = n.category === 'PENGINGAT_JADWAL' || 
          n.type === 'SCHEDULE_REMINDER' || 
          n.type === 'NEW_MEETING' || 
          n.type === 'ATTENDANCE_COMPLETED' || 
          n.referenceType === 'SCHEDULE' || 
          n.referenceType === 'MEETING';
        if (!isJadwal) return false;
      } else if (selectedCategory === 'HONOR') {
        const isHonor = n.category === 'HONOR' || 
          n.type === 'HONOR_GENERATED' || 
          n.type === 'HONOR_PAID' || 
          n.referenceType === 'TEACHER_HONOR';
        if (!isHonor) return false;
      } else if (selectedCategory === 'SISTEM') {
        const isSistem = n.category === 'SISTEM' || 
          n.category === 'PENGUMUMAN' || 
          n.type === 'BROADCAST_ANNOUNCEMENT' || 
          n.type === 'SYSTEM';
        if (!isSistem) return false;
      }
    }

    return true;
  });

  const handleRefreshReminders = async () => {
    setIsRefreshing(true);
    try {
      await checkReminders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenTransaction = (notif: SystemNotification) => {
    if (!notif.read && !notif.isRead) {
      markNotificationAsRead(notif.id);
    }

    // Direct routing based on referenceType or actionUrl
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
      onNavigate(role === 'ADMIN' ? 'dashboard' : 'guru-dashboard');
    }
  };

  const getCategoryBadge = (notif: SystemNotification) => {
    const type = notif.type || '';
    const cat = notif.category || '';

    if (cat === 'TAGIHAN' || type === 'PAYMENT_RECEIVED' || type === 'RECEIVABLE_REMINDER') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <CreditCard className="w-3 h-3" />
          Tagihan & Bayar
        </span>
      );
    }
    if (cat === 'PENGINGAT_JADWAL' || type === 'SCHEDULE_REMINDER' || type === 'NEW_MEETING' || type === 'ATTENDANCE_COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
          <CalendarClock className="w-3 h-3" />
          Jadwal & Absensi
        </span>
      );
    }
    if (cat === 'HONOR' || type === 'HONOR_GENERATED' || type === 'HONOR_PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
          <Award className="w-3 h-3" />
          Honor Pengajar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
        <Sparkles className="w-3 h-3" />
        Sistem & Info
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-blue-600" />
            <span>Pusat Notifikasi & Pengingat Sistem</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'ADMIN'
              ? 'Kelola notifikasi pembayaran siswa, absensi, pengingat piutang, dan pencairan honor guru.'
              : 'Pantau jadwal mengajar hari ini, konfirmasi absensi pertemuan, dan riwayat penerimaan honor Anda.'}
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefreshReminders}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Cek ulang dan segarkan reminder jadwal, piutang, dan honor hari ini"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memeriksa...' : 'Cek Pengingat Hari Ini'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({userNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'UNREAD'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('READ')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'READ'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sudah Dibaca ({readCount})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="JADWAL">Jadwal & Absensi</option>
            <option value="TAGIHAN">Tagihan & Pembayaran</option>
            <option value="HONOR">Honor Pengajar</option>
            <option value="SISTEM">Sistem & Pengumuman</option>
          </select>
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 mx-auto flex items-center justify-center mb-3">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak ada notifikasi</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'UNREAD'
                ? 'Luar biasa! Seluruh notifikasi pada filter ini telah Anda baca.'
                : 'Belum ada notifikasi atau aktivitas yang tercatat untuk filter yang Anda pilih.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notif, idx) => {
              const isUnread = !notif.read && !notif.isRead;
              const isUrgent = notif.priority === 'URGENT';
              const isImportant = notif.priority === 'IMPORTANT';

              return (
                <div
                  key={notif.id || `notif-item-${idx}`}
                  className={`p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isUnread
                      ? isUrgent
                        ? 'bg-rose-50/40 border-l-4 border-rose-500'
                        : isImportant
                        ? 'bg-amber-50/40 border-l-4 border-amber-500'
                        : 'bg-blue-50/30 border-l-4 border-blue-500'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs ${
                      notif.category === 'TAGIHAN' || notif.type === 'PAYMENT_RECEIVED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : notif.category === 'PENGINGAT_JADWAL' || notif.type === 'SCHEDULE_REMINDER'
                        ? 'bg-blue-100 text-blue-700'
                        : notif.category === 'HONOR' || notif.type === 'HONOR_PAID'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {notif.category === 'TAGIHAN' || notif.type === 'PAYMENT_RECEIVED' ? (
                        <CreditCard className="w-5 h-5" />
                      ) : notif.category === 'PENGINGAT_JADWAL' || notif.type === 'SCHEDULE_REMINDER' ? (
                        <CalendarClock className="w-5 h-5" />
                      ) : notif.category === 'HONOR' || notif.type === 'HONOR_PAID' ? (
                        <Award className="w-5 h-5" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {getCategoryBadge(notif)}
                        {notif.priority && notif.priority !== 'NORMAL' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {notif.priority}
                          </span>
                        )}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-ping"></span>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatDateTimeIndonesian(notif.timestamp || notif.createdAt || '')}
                        </span>
                      </div>

                      <h4 className={`text-sm tracking-tight ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                        {notif.message}
                      </p>

                      {notif.readAt && (
                        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Dibaca: {formatDateTimeIndonesian(notif.readAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {isUnread && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                        title="Tandai sebagai sudah dibaca"
                      >
                        Tandai Dibaca
                      </button>
                    )}

                    {(notif.referenceType || notif.actionUrl) && (
                      <button
                        onClick={() => handleOpenTransaction(notif)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Buka data transaksi atau halaman terkait"
                      >
                        <span>{notif.actionLabel || 'Buka Transaksi'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Omnichannel Notice Card (WhatsApp & Email Architecture) */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Arsitektur Otomatisasi Notifikasi Multi-Channel
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sistem saat ini aktif mengirimkan internal notifikasi realtime ke Firestore dan portal pengguna. Untuk pengiriman WhatsApp & Email eksternal ke wali murid dan guru, sistem dirancang dengan server-side abstraction interface (<code className="bg-white px-1.5 py-0.5 rounded text-blue-700 border border-blue-200 font-mono text-[11px]">sendNotification</code>) yang siap diintegrasikan melalui Firebase Cloud Functions atau API Gateway tanpa mengekspos kredensial rahasia di sisi browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
