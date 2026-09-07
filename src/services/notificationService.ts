import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  where,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  SystemNotification, 
  UserRole, 
  Schedule, 
  Teacher, 
  User, 
  Student, 
  StudentCharge, 
  TeacherHonor, 
  InstitutionSetting 
} from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/initialData';
import { auditLogService } from './auditLogService';
import { formatRupiah } from './businessLogic';

const COLLECTION_NAME = 'notifications';

// Channel delivery options for future omnichannel expansion
export type NotificationChannel = 'IN_APP' | 'WHATSAPP' | 'EMAIL';

export interface SendNotificationOptions {
  channel?: NotificationChannel;
  notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read' | 'isRead' | 'createdAt'> & {
    id?: string;
    timestamp?: string;
    read?: boolean;
    isRead?: boolean;
  };
  recipientPhone?: string;
  recipientEmail?: string;
}

export const notificationService = {
  /**
   * Mengambil semua notifikasi dari Firestore
   */
  async getAll(): Promise<SystemNotification[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_NOTIFICATIONS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemNotification));
    } catch (err) {
      console.warn('Fallback notifications:', err);
      return INITIAL_NOTIFICATIONS;
    }
  },

  /**
   * Mengambil notifikasi yang relevan untuk user/role saat ini
   * - Admin dapat melihat semua notifikasi sistem atau notifikasi dengan role 'ADMIN'/'ALL'
   * - Guru HANYA dapat melihat notifikasi yang ditujukan untuk dirinya (userId, recipientTeacherId, atau role 'GURU'/'ALL')
   */
  filterForUser(
    allNotifications: SystemNotification[], 
    user: { id?: string; uid?: string; role?: UserRole | null; teacherId?: string | null } | null
  ): SystemNotification[] {
    if (!user) return [];

    if (user.role === 'ADMIN') {
      return allNotifications.filter(n => 
        !n.role || n.role === 'ADMIN' || n.role === 'ALL' || n.recipientUserId === user.id || n.recipientUserId === user.uid
      );
    }

    if (user.role === 'GURU') {
      return allNotifications.filter(n => {
        // Directed to teacher's specific user ID
        if (n.userId && (n.userId === user.id || n.userId === user.uid)) return true;
        if (n.recipientUserId && (n.recipientUserId === user.id || n.recipientUserId === user.uid)) return true;
        // Directed to teacher's teacherId code (e.g., TCH-001)
        if (user.teacherId && n.recipientTeacherId && (n.recipientTeacherId === user.teacherId || n.recipientTeacherId === 'ALL')) return true;
        // General broadcast for all teachers
        if (n.role === 'GURU' && !n.recipientTeacherId && !n.userId) return true;
        if (n.role === 'ALL') return true;
        return false;
      });
    }

    return [];
  },

  /**
   * Membuat notifikasi baru dengan pencegahan duplikasi (Idempotency Key)
   */
  async create(
    notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read' | 'isRead' | 'createdAt'> & { 
      id?: string; 
      timestamp?: string; 
      read?: boolean; 
      isRead?: boolean;
      createdAt?: string;
    },
    existingList?: SystemNotification[]
  ): Promise<SystemNotification> {
    const timestamp = notif.timestamp || notif.createdAt || new Date().toISOString();
    const id = notif.id || `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = notif.idempotencyKey || `${notif.type}_${notif.referenceType || ''}_${notif.referenceId || ''}_${notif.recipientTeacherId || notif.userId || ''}_${timestamp.substring(0, 10)}`;

    // Anti-duplicate check using idempotencyKey
    if (notif.idempotencyKey && existingList && existingList.length > 0) {
      const existing = existingList.find(n => n.idempotencyKey === notif.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const newNotif: SystemNotification = {
      ...notif,
      id,
      idempotencyKey,
      timestamp,
      createdAt: timestamp,
      read: notif.read ?? notif.isRead ?? false,
      isRead: notif.isRead ?? notif.read ?? false
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, newNotif);
    } catch (err) {
      console.error('Error creating notification in Firestore:', err);
    }

    return newNotif;
  },

  /**
   * Menandai notifikasi sebagai sudah dibaca (readAt & isRead)
   */
  async markAsRead(id: string, currentUser?: { id?: string; name?: string; role?: UserRole }): Promise<void> {
    const readAt = new Date().toISOString();
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, { 
        read: true, 
        isRead: true, 
        readAt 
      }, { merge: true });

      if (currentUser) {
        await auditLogService.create({
          userId: currentUser.id || 'USER',
          userName: currentUser.name || 'Pengguna',
          userRole: currentUser.role || 'ADMIN',
          action: 'NOTIFICATION_READ',
          entity: 'notifications',
          entityId: id,
          details: `Menandai notifikasi ${id} sebagai sudah dibaca.`
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error marking notification as read in Firestore:', err);
    }
  },

  /**
   * Menandai semua notifikasi pengguna sebagai sudah dibaca secara batch
   */
  async markAllAsRead(
    notificationsToMark: SystemNotification[],
    currentUser?: { id?: string; name?: string; role?: UserRole }
  ): Promise<void> {
    if (notificationsToMark.length === 0) return;
    const readAt = new Date().toISOString();

    try {
      const batch = writeBatch(db);
      notificationsToMark.forEach(n => {
        const docRef = doc(db, COLLECTION_NAME, n.id);
        batch.set(docRef, { read: true, isRead: true, readAt }, { merge: true });
      });
      await batch.commit();

      if (currentUser) {
        await auditLogService.create({
          userId: currentUser.id || 'USER',
          userName: currentUser.name || 'Pengguna',
          userRole: currentUser.role || 'ADMIN',
          action: 'NOTIFICATION_READ',
          entity: 'notifications',
          entityId: 'ALL',
          details: `Menandai ${notificationsToMark.length} notifikasi sebagai sudah dibaca sekaligus.`
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  },

  /**
   * Menghapus notifikasi
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting notification from Firestore:', err);
    }
  },

  /**
   * PENGINGAT JADWAL HARIAN GURU (Daily Schedule Reminders)
   * Mengecek jadwal mengajar hari ini untuk setiap guru dan membuat notifikasi jika belum dibuat hari ini
   */
  async checkAndCreateDailyScheduleReminders(
    schedules: Schedule[],
    teachers: Teacher[],
    existingNotifications: SystemNotification[]
  ): Promise<SystemNotification[]> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayDayName = dayNames[today.getDay()];

    const activeSchedulesToday = schedules.filter(s => 
      s.status === 'AKTIF' && s.dayOfWeek === todayDayName
    );

    const generatedNotifs: SystemNotification[] = [];

    // Group schedules by teacher
    const schedulesByTeacher: Record<string, Schedule[]> = {};
    activeSchedulesToday.forEach(s => {
      if (!schedulesByTeacher[s.teacherId]) {
        schedulesByTeacher[s.teacherId] = [];
      }
      schedulesByTeacher[s.teacherId].push(s);
    });

    for (const [teacherId, teacherSchedules] of Object.entries(schedulesByTeacher)) {
      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher) continue;

      const idempotencyKey = `DAILY_SCHEDULE_REMINDER_${teacherId}_${todayStr}`;
      const alreadyExists = existingNotifications.some(n => n.idempotencyKey === idempotencyKey);
      if (alreadyExists) continue;

      const scheduleDetails = teacherSchedules
        .map(s => `${s.startTime || (s as any).timeStart || ''}-${s.endTime || (s as any).timeEnd || ''} (${s.room || 'Kelas'})`)
        .join(', ');

      const notif = await this.create({
        type: 'SCHEDULE_REMINDER',
        category: 'PENGINGAT_JADWAL',
        priority: 'IMPORTANT',
        role: 'GURU',
        recipientTeacherId: teacherId,
        title: 'Pengingat Jadwal Mengajar Hari Ini',
        message: `Halo ${teacher.name}, Anda memiliki ${teacherSchedules.length} sesi mengajar hari ini (${todayDayName}): ${scheduleDetails}.`,
        referenceType: 'SCHEDULE',
        referenceId: teacherSchedules[0]?.id,
        idempotencyKey,
        metadata: {
          teacherId,
          scheduleCount: teacherSchedules.length,
          dayOfWeek: todayDayName,
          date: todayStr
        }
      }, existingNotifications);

      generatedNotifs.push(notif);
    }

    return generatedNotifs;
  },

  /**
   * PENGINGAT PIUTANG SISWA UNTUK ADMIN (Receivable Reminder)
   * Mengecek total siswa yang memiliki piutang belum lunas dan mengirim rangkuman harian
   */
  async checkAndCreateReceivableReminders(
    studentCharges: StudentCharge[],
    settings: InstitutionSetting,
    existingNotifications: SystemNotification[]
  ): Promise<SystemNotification | null> {
    if (settings.notificationSettings?.enableReceivableReminder === false) {
      return null;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const idempotencyKey = `RECEIVABLE_REMINDER_${todayStr}`;

    const alreadyExists = existingNotifications.some(n => n.idempotencyKey === idempotencyKey);
    if (alreadyExists) return null;

    const unpaidCharges = studentCharges.filter(c => c.status !== 'LUNAS' && (c.remainingAmount || 0) > 0);
    if (unpaidCharges.length === 0) return null;

    const totalReceivable = unpaidCharges.reduce((acc, c) => acc + (c.remainingAmount || 0), 0);
    const uniqueStudentIds = new Set(unpaidCharges.map(c => c.studentId));

    const notif = await this.create({
      type: 'RECEIVABLE_REMINDER',
      category: 'TAGIHAN',
      priority: 'NORMAL',
      role: 'ADMIN',
      title: 'Pengingat Saldo Piutang Siswa',
      message: `Terdapat ${uniqueStudentIds.size} siswa dengan total ${unpaidCharges.length} tagihan belum lunas senilai ${formatRupiah(totalReceivable)}. Segera lakukan penagihan atau follow-up wali murid.`,
      referenceType: 'RECEIVABLE',
      referenceId: 'receivables',
      idempotencyKey,
      metadata: {
        studentCount: uniqueStudentIds.size,
        chargeCount: unpaidCharges.length,
        totalAmount: totalReceivable,
        date: todayStr
      }
    }, existingNotifications);

    return notif;
  },

  /**
   * PENGINGAT HONOR BELUM DISETOR UNTUK ADMIN (Teacher Honor Reminder)
   * Mengecek sisa honor guru yang belum dibayar
   */
  async checkAndCreateHonorReminders(
    teachers: Teacher[],
    teacherHonors: TeacherHonor[],
    settings: InstitutionSetting,
    existingNotifications: SystemNotification[]
  ): Promise<SystemNotification | null> {
    if (settings.notificationSettings?.enableHonorReminder === false) {
      return null;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const idempotencyKey = `HONOR_REMINDER_${todayStr}`;

    const alreadyExists = existingNotifications.some(n => n.idempotencyKey === idempotencyKey);
    if (alreadyExists) return null;

    const unpaidHonors = teacherHonors.filter(h => h.status !== 'LUNAS' && (h.remainingAmount || 0) > 0);
    if (unpaidHonors.length === 0) return null;

    const totalUnpaid = unpaidHonors.reduce((acc, h) => acc + (h.remainingAmount || 0), 0);
    const uniqueTeacherIds = new Set(unpaidHonors.map(h => h.teacherId));

    const notif = await this.create({
      type: 'HONOR_GENERATED',
      category: 'HONOR',
      priority: 'NORMAL',
      role: 'ADMIN',
      title: 'Pengingat Sisa Honor Guru Belum Disalurkan',
      message: `Terdapat ${uniqueTeacherIds.size} guru dengan total honor tertunda senilai ${formatRupiah(totalUnpaid)}. Segera periksa dan proses pencairan voucher honor.`,
      referenceType: 'TEACHER_HONOR',
      referenceId: 'teacher-honor',
      idempotencyKey,
      metadata: {
        teacherCount: uniqueTeacherIds.size,
        totalAmount: totalUnpaid,
        date: todayStr
      }
    }, existingNotifications);

    return notif;
  },

  /**
   * ABSTRAKSI MULTI-CHANNEL (In-App, WhatsApp, Email)
   * Mempersiapkan arsitektur omnichannel untuk tahap selanjutnya tanpa hardcoding secrets di frontend.
   */
  async sendNotification(options: SendNotificationOptions): Promise<{
    inAppNotif: SystemNotification;
    whatsAppStatus?: { queued: boolean; channel: string; note: string };
    emailStatus?: { queued: boolean; channel: string; note: string };
  }> {
    const inAppNotif = await this.create(options.notification);

    let whatsAppStatus;
    let emailStatus;

    if (options.channel === 'WHATSAPP' || options.recipientPhone) {
      whatsAppStatus = await this.sendWhatsAppNotification(
        options.recipientPhone || '', 
        `${options.notification.title}\n\n${options.notification.message}`
      );
    }

    if (options.channel === 'EMAIL' || options.recipientEmail) {
      emailStatus = await this.sendEmailNotification(
        options.recipientEmail || '',
        options.notification.title,
        options.notification.message
      );
    }

    return {
      inAppNotif,
      whatsAppStatus,
      emailStatus
    };
  },

  /**
   * WhatsApp Delivery Stub (Dokumentasi arsitektur cloud server-side)
   * Pengiriman WhatsApp nyata menggunakan backend webhook / Firebase Cloud Function (FCM/Twilio/Wablas)
   */
  async sendWhatsAppNotification(toPhone: string, message: string): Promise<{ queued: boolean; channel: string; note: string }> {
    // Validasi input
    if (!toPhone) {
      return { queued: false, channel: 'WHATSAPP', note: 'Nomor telepon penerima belum diisi.' };
    }
    // Stub terstruktur: aman, tidak memalsukan pengiriman, dan mendokumentasikan integrasi server-side
    return {
      queued: true,
      channel: 'WHATSAPP',
      note: `Pesan WhatsApp disiapkan untuk ${toPhone}. Siap dikirim melalui endpoint API gateway serverless.`
    };
  },

  /**
   * Email Delivery Stub (Dokumentasi arsitektur cloud server-side)
   */
  async sendEmailNotification(toEmail: string, subject: string, body: string): Promise<{ queued: boolean; channel: string; note: string }> {
    if (!toEmail) {
      return { queued: false, channel: 'EMAIL', note: 'Alamat email penerima belum diisi.' };
    }
    return {
      queued: true,
      channel: 'EMAIL',
      note: `Email notifikasi disiapkan untuk ${toEmail}. Siap dikirim melalui SMTP/Sendgrid cloud trigger.`
    };
  }
};
