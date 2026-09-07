export type UserRole = 'ADMIN' | 'GURU' | 'SISWA';

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';

export type MeetingStatus = 
  | 'TERJADWAL' 
  | 'BERLANGSUNG' 
  | 'SELESAI' 
  | 'DIBATALKAN' 
  | 'SCHEDULED' 
  | 'ONGOING' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type ScheduleStatus = 'AKTIF' | 'NONAKTIF' | 'SELESAI' | 'DIBATALKAN' | 'ACTIVE' | 'INACTIVE';

export type PaymentStatus = 'BELUM_BAYAR' | 'SEBAGIAN' | 'LUNAS';

export type HonorStatus = 'BELUM_DIBAYAR' | 'SEBAGIAN' | 'LUNAS';

export type PaymentMethod = 
  | 'TUNAI' 
  | 'CASH'
  | 'TRANSFER' 
  | 'TRANSFER_BANK' 
  | 'QRIS' 
  | 'E_WALLET' 
  | 'OTHER'
  | 'LAINNYA';

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';

export type ExpenseCategory = 
  | 'OPERASIONAL' 
  | 'LISTRIK' 
  | 'INTERNET' 
  | 'ATK' 
  | 'SEWA' 
  | 'TRANSPORTASI' 
  | 'LAINNYA'
  | 'ATK_DAN_MODUL'
  | 'LISTRIK_DAN_AIR'
  | 'INTERNET_DAN_WIFI'
  | 'SEWA_TEMPAT'
  | 'KONSUMSI'
  | 'MARKETING_PROMOSI'
  | 'PERAWATAN_INVENTARIS'
  | 'LAIN_LAIN';

export interface User {
  id: string;
  uid?: string;
  authUid?: string;
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  teacherId?: string | null; // If role is GURU, foreign key to teachers/{teacherId}
  phone?: string;
  phoneNumber?: string;
  photoUrl?: string;
  photoURL?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'AKTIF' | 'NONAKTIF';
  isActive: boolean;
  notificationPreferences?: TeacherNotificationPreferences;
  institutionName?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface Student {
  id: string;
  studentCode?: string;
  nis: string;
  name: string;
  gender?: 'L' | 'P' | 'Laki-laki' | 'Perempuan';
  birthDate?: string;
  school?: string;
  grade: string; // e.g., 'Kelas 5 SD', 'Kelas 8 SMP'
  programIds: string[]; // Enrolled programs
  parentName: string;
  parentPhone: string;
  phone?: string;
  studentPhone?: string;
  schoolOrigin?: string;
  address?: string;
  status: 'AKTIF' | 'NONAKTIF' | 'ACTIVE' | 'INACTIVE';
  notes?: string;
  registeredAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  teacherCode?: string;
  code: string; // e.g., 'KDG-001' or 'TCH-001'
  userId?: string;
  name: string;
  phone: string;
  email: string;
  specialtyPrograms?: string[]; // Program names or IDs
  specializations?: string[];
  specialization?: string;
  subjectSpecialization?: string;
  status: 'AKTIF' | 'NONAKTIF' | 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
  notes?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder?: string;
  };
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  honorScheme?: 'PER_SISWA' | 'PER_SESI' | 'BULANAN'; // Skema honor: per siswa, flat per sesi, atau bulanan
  customHonorRate?: number; // Override honor rate per siswa-sesi atau per sesi untuk guru ini
  monthlySalary?: number; // Gaji bulanan jika honorScheme === 'BULANAN'
  transportFeePerMeeting?: number; // Uang transport kehadiran per sesi mengajar
  teacherLevel?: 'JUNIOR' | 'STANDAR' | 'SENIOR' | 'MASTER' | string;
  experienceLevel?: 'JUNIOR' | 'STANDAR' | 'SENIOR' | 'MASTER' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  programCode?: string;
  code: string;
  name: string;
  description: string;
  category: 'SD' | 'SMP' | 'SMA' | 'UMUM' | string;
  targetGrade?: string;
  classType?: 'REGULER' | 'PRIVAT' | 'SEMI_PRIVAT' | 'INTENSIF_UTBK' | 'KEDINASAN' | string;

  // Model Tagihan Siswa
  billingModel?: 'PER_PERTEMUAN' | 'PER_MINGGU' | 'PER_BULAN' | 'PAKET';
  studentRate?: number; // Tarif les siswa per sesi/pertemuan
  weeklyRate?: number; // Tarif les per minggu
  monthlyRate?: number; // Tarif les per bulan (SPP)

  // Paket Spesifik (contoh: paket 12 pertemuan satu bulan biaya 300000)
  packageSessions?: number; // Jumlah sesi/pertemuan dalam paket (misal: 12)
  packageValidityDuration?: string; // Masa berlaku paket (misal: "1 Bulan", "30 Hari", "3 Bulan")
  packagePrice?: number; // Biaya total paket (misal: 300000)

  // Diskon / Promo Program
  hasDiscount?: boolean;
  discountType?: 'NONE' | 'NOMINAL' | 'PERSEN';
  discountValue?: number; // Nominal Rp atau Persentase %
  discountName?: string; // Nama promo / alasan diskon (misal: "Promo Pendaftaran Awal")

  // Skema Honor Tentor pada Program
  teacherHonorScheme?: 'PER_SISWA' | 'PER_SESI' | 'BULANAN' | 'FOLLOW_TEACHER';
  teacherHonorRate?: number; // Honor tentor per siswa-sesi ATAU flat per sesi
  monthlyHonorRate?: number; // Honor bulanan jika program bulanan
  transportAllowance?: number; // Tunjangan transport per kehadiran sesi

  monthlyPackageRate?: number; // Biaya paket bulanan (kompatibilitas)
  sessionDurationMinutes?: number; // Durasi belajar menit (misal 60, 90, 120)
  maxStudents?: number; // Kapasitas maks siswa per rombel
  status: 'AKTIF' | 'NONAKTIF' | 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  id: string;
  scheduleCode?: string;
  code: string;
  teacherId: string;
  programId: string;
  dayOfWeek: DayOfWeek | string;
  date?: string;
  startTime: string; // '15:00'
  endTime: string; // '16:00'
  room?: string;
  studentIds: string[];
  startDate?: string;
  endDate?: string;
  status: 'AKTIF' | 'NONAKTIF' | ScheduleStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Meeting {
  id: string;
  meetingCode: string; // e.g., 'MTG-2026-0902-01'
  scheduleId?: string;
  teacherId: string;
  programId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // '15:00'
  endTime: string; // '16:00'
  room?: string;
  status: MeetingStatus;
  totalStudents?: number;
  totalPresent?: number;
  totalAbsent?: number;
  registeredStudentCount: number;
  presentStudentCount: number;
  validationStatus?: 'MENUNGGU_VALIDASI' | 'DISETUJUI' | 'DITOLAK';
  validatedAt?: string;
  validatedBy?: string;
  validationNotes?: string;
  completedAt?: string;
  completedByTeacherId?: string;
  topic?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingStudent {
  id: string;
  meetingId: string;
  studentId: string;
  attendanceStatus: AttendanceStatus;
  attendanceTime: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentCharge {
  id: string;
  chargeCode?: string;
  chargeNumber: string; // e.g., 'INV-202609-001' or 'TAG-001'
  studentId: string;
  meetingId?: string;
  scheduleId?: string;
  programId?: string;
  date: string; // YYYY-MM-DD
  period: string; // 'September 2026'
  quantity?: number;
  rate?: number;
  rateApplied: number; // e.g. 8000
  
  // Model Tagihan & Paket
  billingModel?: 'PER_PERTEMUAN' | 'PER_MINGGU' | 'PER_BULAN' | 'PAKET';
  packageName?: string;
  packageSessions?: number;
  description?: string;

  // Diskon & Potongan Harga
  subtotal?: number; // Nominal sebelum diskon
  discountType?: 'NONE' | 'NOMINAL' | 'PERSEN';
  discountValue?: number; // Nilai potongan (Rp atau %)
  discountAmount?: number; // Total potongan dalam Rp
  discountReason?: string; // Alasan diskon (misal: "Promo Awal Tahun", "Diskon Saudara Kandung")

  amount: number; // Nilai netto setelah diskon yang wajib dibayar
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  chargeId: string;
  amount: number;
  createdAt: string;
}

export interface StudentPayment {
  id: string;
  paymentCode?: string;
  paymentNumber: string; // e.g., 'PAY-202609-001' or 'KW-001'
  studentId: string;
  chargeId?: string;
  chargeIds?: string[]; // Allocations
  paymentDate?: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status?: 'BERHASIL' | 'DIBATALKAN' | 'PAID' | 'VOID' | 'ACTIVE';
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  receivedBy: string; // Admin name
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherHonor {
  id: string;
  honorCode?: string;
  honorNumber: string;
  teacherId: string;
  meetingId?: string;
  programId?: string;
  date?: string;
  period: string; // 'September 2026'
  studentCount?: number;
  meetingCount: number;
  studentMeetingCount: number;
  honorScheme?: 'PER_SISWA' | 'PER_SESI' | 'BULANAN';
  rate?: number;
  ratePerStudentMeeting: number; // e.g., 2000
  sessionHonorTotal?: number;
  transportTotal?: number;
  monthlySalary?: number;
  amount?: number;
  totalHonor: number;
  paidAmount: number;
  remainingAmount: number;
  status: HonorStatus;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherPayment {
  id: string;
  paymentCode?: string;
  paymentNumber: string; // e.g., 'HONPAY-202609-001'
  teacherId: string;
  paymentDate?: string;
  date: string; // YYYY-MM-DD
  period: string; // 'September 2026'
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status?: 'BERHASIL' | 'DIBATALKAN' | 'PAID' | 'VOID' | 'ACTIVE';
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  processedBy: string; // Admin name
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  expenseCode?: string;
  expenseNumber: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  recordedBy: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type StudentBillingScheme = 'persesi' | 'perbulan' | 'pertahun';
export type TeacherHonorSchemeType = 'sesi' | 'siswa' | 'bulan';

export interface BimbelPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  studentRate: number;
  studentBillingScheme?: StudentBillingScheme;
  teacherRate: number;
  teacherHonorSchemeType?: TeacherHonorSchemeType;
  transportAllowance: number;
  sampleProgram?: string;
  tagline?: string;
  isCustom?: boolean;
}

export interface InstitutionSetting {
  id?: string;
  organizationName?: string;
  organizationAddress?: string;
  organizationPhone?: string;
  organizationEmail?: string;
  name: string;
  tagline?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  studentRate: number; // Nominal tarif siswa (default 8000)
  studentBillingScheme?: StudentBillingScheme; // 'persesi' | 'perbulan' | 'pertahun'
  teacherRate: number; // Nominal honor tentor (default 2000)
  teacherHonorSchemeType?: TeacherHonorSchemeType; // 'sesi' | 'siswa' | 'bulan'
  defaultTransportAllowance?: number; // Uang transport default per sesi
  defaultBillingModel?: 'PER_PERTEMUAN' | 'PER_MINGGU' | 'PER_BULAN' | 'PAKET';
  defaultTeacherHonorScheme?: 'PER_SISWA' | 'PER_SESI' | 'BULANAN';
  defaultHonorRatePerSession?: number;
  defaultMonthlySalary?: number;
  
  // Banking & Payment Details for Invoices & Receipts
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  qrisInfo?: string;
  
  // Billing Operations Policy
  billingDueDay?: number; // Tanggal jatuh tempo tagihan (default 10)
  billingInstructions?: string; // Petunjuk pembayaran pada invoice/kuitansi
  principalName?: string; // Nama Kepala Cabang / Pimpinan Bimbel
  principalNip?: string; // NIP atau No Registrasi Lembaga

  // WhatsApp Notification Templates
  waBillingTemplate?: string;
  waScheduleReminderTemplate?: string;

  // Notification Automation & Reminder Settings
  notificationSettings?: NotificationSettings;

  // Preset Template Bimbel
  bimbelPreset?: 'REGULER' | 'PRIVAT' | 'CAMPUS_UTBK' | 'CUSTOM' | string;
  customBimbelPresets?: BimbelPreset[];

  academicYear?: string;
  currency?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationSettings {
  enableTeacherScheduleReminder: boolean;
  enableReceivableReminder: boolean;
  enableHonorReminder: boolean;
  enablePaymentNotification: boolean;
  enableAttendanceNotification: boolean;
  enableUpcomingMeetingReminder?: boolean;
  lastReceivableReminderDate?: string;
  lastHonorReminderDate?: string;
}

export interface TeacherNotificationPreferences {
  schedules: boolean;
  attendance: boolean;
  honor: boolean;
  honorPayments: boolean;
}

export type NotificationType =
  | 'PAYMENT_RECEIVED'
  | 'NEW_MEETING'
  | 'ATTENDANCE_COMPLETED'
  | 'RECEIVABLE_REMINDER'
  | 'HONOR_GENERATED'
  | 'HONOR_PAID'
  | 'SCHEDULE_REMINDER'
  | 'SCHEDULE_CREATED'
  | 'BROADCAST_ANNOUNCEMENT'
  | 'SYSTEM';

export type NotificationReferenceType =
  | 'STUDENT_PAYMENT'
  | 'TEACHER_HONOR'
  | 'MEETING'
  | 'STUDENT_CHARGE'
  | 'RECEIVABLE'
  | 'SCHEDULE'
  | 'SYSTEM'
  | string;

export interface SystemNotification {
  id: string;
  userId?: string;
  role?: UserRole | 'ALL';
  recipientUserId?: string;
  recipientTeacherId?: string; // 'ALL' or specific teacherId like 'TCH-001'
  targetTeacherName?: string;
  senderName?: string;
  senderRole?: string;
  timestamp: string;
  type: NotificationType | string;
  category?: 'PENGUMUMAN' | 'PENGINGAT_JADWAL' | 'SISTEM' | 'TAGIHAN' | 'HONOR';
  priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  title: string;
  message: string;
  referenceType?: NotificationReferenceType;
  referenceId?: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  readAt?: string;
  idempotencyKey?: string;
  metadata?: {
    meetingId?: string;
    teacherId?: string;
    studentId?: string;
    scheduleId?: string;
    amount?: number;
    room?: string;
    time?: string;
    dayOfWeek?: string;
    programName?: string;
    [key: string]: any;
  };
}

export interface RateHistory {
  id: string;
  type?: 'STUDENT' | 'TEACHER' | 'STUDENT_CHARGE' | 'TEACHER_HONOR';
  rateType?: 'STUDENT_CHARGE' | 'TEACHER_HONOR';
  rateName?: string;
  rate?: number;
  value?: number;
  studentRate?: number;
  teacherRate?: number;
  studentBillingScheme?: StudentBillingScheme;
  teacherHonorSchemeType?: TeacherHonorSchemeType;
  effectiveDate: string;
  endDate?: string;
  status?: 'AKTIF' | 'HISTORIS' | 'ACTIVE' | 'INACTIVE';
  notes?: string;
  reason?: string;
  setBy?: string;
  createdBy?: string;
  changedBy?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  role?: UserRole;
  userRole: UserRole;
  action: string;
  entity?: string;
  entityId?: string;
  targetId?: string;
  targetEntity?: string;
  description?: string;
  details: string;
  timestamp: string;
  relatedEntity?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}
