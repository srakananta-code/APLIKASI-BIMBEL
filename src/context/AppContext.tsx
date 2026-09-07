import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  User,
  UserRole,
  Student,
  Teacher,
  Program,
  Schedule,
  Meeting,
  MeetingStudent,
  StudentCharge,
  StudentPayment,
  TeacherHonor,
  TeacherPayment,
  Expense,
  InstitutionSetting,
  RateHistory,
  AuditLog,
  SystemNotification,
  AttendanceStatus,
  PaymentMethod,
  ExpenseCategory,
  StudentBillingScheme,
  TeacherHonorSchemeType
} from '../types';

import {
  INITIAL_INSTITUTION_SETTING,
  INITIAL_USERS,
  INITIAL_PROGRAMS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_SCHEDULES,
  INITIAL_MEETINGS,
  INITIAL_MEETING_STUDENTS,
  INITIAL_STUDENT_CHARGES,
  INITIAL_STUDENT_PAYMENTS,
  INITIAL_TEACHER_HONORS,
  INITIAL_TEACHER_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_RATE_HISTORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';

import { 
  formatRupiah, 
  calculateStudentCharge, 
  calculateTeacherHonor, 
  isBillableAttendance 
} from '../services/businessLogic';

import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';

import { studentService } from '../services/studentService';
import { teacherService } from '../services/teacherService';
import { programService } from '../services/programService';
import { scheduleService } from '../services/scheduleService';
import { meetingService } from '../services/meetingService';
import { attendanceService } from '../services/attendanceService';
import { studentChargeService } from '../services/studentChargeService';
import { studentPaymentService } from '../services/studentPaymentService';
import { teacherHonorService } from '../services/teacherHonorService';
import { teacherPaymentService } from '../services/teacherPaymentService';
import { expenseService } from '../services/expenseService';
import { settingsService } from '../services/settingsService';
import { rateService } from '../services/rateService';
import { auditLogService } from '../services/auditLogService';
import { notificationService } from '../services/notificationService';
import { seedService } from '../services/seedService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Current session & role switching
  currentUser: User;
  activeRole: UserRole;
  currentRole: UserRole;
  activeTeacherId: string;
  setActiveRole: (role: UserRole, teacherId?: string) => void;
  setActiveTeacherId: (teacherId: string) => void;

  // Connection & Sync status
  isFirestoreConnected: boolean;
  isInitialLoading: boolean;

  // Master Data
  settings: InstitutionSetting;
  updateSettings: (newSettings: Partial<InstitutionSetting>) => void;
  updateInstitutionSettings: (newSettings: Partial<InstitutionSetting>) => void;
  updateRates: (
    newStudentRate: number, 
    newTeacherRate: number, 
    notes: string,
    options?: {
      studentBillingScheme?: StudentBillingScheme;
      teacherHonorSchemeType?: TeacherHonorSchemeType;
      defaultTransportAllowance?: number;
    }
  ) => Promise<void>;
  rateHistories: RateHistory[];

  students: Student[];
  createStudent: (student: Omit<Student, 'id' | 'registeredAt'>) => void;
  batchCreateStudents: (studentsData: Array<Omit<Student, 'id' | 'registeredAt'> & { id?: string }>) => Promise<{ success: boolean; count: number }>;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => Promise<boolean>;
  toggleStudentStatus: (id: string) => void;

  teachers: Teacher[];
  createTeacher: (teacher: Omit<Teacher, 'id' | 'joinedAt'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  toggleTeacherStatus: (id: string) => void;

  programs: Program[];
  createProgram: (program: Omit<Program, 'id'>) => void;
  updateProgram: (id: string, program: Partial<Program>) => void;
  toggleProgramStatus: (id: string) => void;

  schedules: Schedule[];
  createSchedule: (schedule: Omit<Schedule, 'id' | 'code'>) => void;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleScheduleStatus: (id: string) => void;

  // Teaching & Attendance
  meetings: Meeting[];
  meetingStudents: MeetingStudent[];
  createMeeting: (meeting: Omit<Meeting, 'id' | 'meetingCode' | 'presentStudentCount'>) => string;
  updateMeeting: (id: string, meeting: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  submitAttendance: (
    meetingId: string, 
    attendances: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
    topic?: string,
    notes?: string
  ) => boolean;
  validateMeetingAttendance: (
    meetingId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ) => Promise<boolean>;
  batchValidateAttendance: (
    meetingIds: string[],
    notes?: string
  ) => Promise<{ success: boolean; count: number }>;

  // Finance
  studentCharges: StudentCharge[];
  studentPayments: StudentPayment[];
  createStudentCharge: (data: {
    studentId: string;
    programId?: string;
    billingModel?: 'PER_PERTEMUAN' | 'PER_MINGGU' | 'PER_BULAN' | 'PAKET';
    packageName?: string;
    packageSessions?: number;
    description?: string;
    subtotal: number;
    discountType?: 'NONE' | 'NOMINAL' | 'PERSEN';
    discountValue?: number;
    discountAmount?: number;
    discountReason?: string;
    amount: number;
    date?: string;
    period?: string;
  }) => Promise<StudentCharge | null>;
  deleteStudentCharge: (id: string) => Promise<boolean>;
  recordStudentPayment: (data: {
    studentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    date?: string;
  }) => void;
  voidStudentPayment: (paymentId: string, reason: string) => Promise<boolean>;

  teacherHonors: TeacherHonor[];
  teacherPayments: TeacherPayment[];
  recordTeacherPayment: (data: {
    teacherId: string;
    period: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    date?: string;
  }) => void;
  voidTeacherPayment: (paymentId: string, reason: string) => Promise<boolean>;

  expenses: Expense[];
  createExpense: (expense: Omit<Expense, 'id' | 'expenseNumber' | 'recordedBy'>) => void;
  deleteExpense: (id: string) => void;

  // Audit & Notifications
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  checkReminders: () => Promise<void>;
  createNotification: (notifData: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => Promise<SystemNotification>;
  broadcastAnnouncement: (payload: {
    title: string;
    message: string;
    type?: 'BROADCAST_ANNOUNCEMENT' | 'SCHEDULE_REMINDER' | 'SYSTEM' | string;
    category?: 'PENGUMUMAN' | 'PENGINGAT_JADWAL' | 'SISTEM' | 'TAGIHAN' | 'HONOR';
    priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT';
    targetTeacherId?: string;
    scheduleId?: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }) => Promise<{ count: number; success: boolean }>;
  deleteNotification: (id: string) => Promise<void>;

  // Toast
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => void;
  removeToast: (id: string) => void;

  // Reset demo
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userProfile, role: authRole, activeTeacherId: authTeacherId } = useAuth();

  // Session State - dynamically synchronized with AuthContext
  const [currentUser, setCurrentUser] = useState<User>(userProfile || INITIAL_USERS[0]);
  const [activeRole, setActiveRoleState] = useState<UserRole>(authRole || 'ADMIN');
  const [activeTeacherId, setActiveTeacherId] = useState<string>(authTeacherId || 'TCH-001');

  useEffect(() => {
    if (userProfile) {
      setCurrentUser(userProfile);
    }
    if (authRole) {
      setActiveRoleState(authRole);
    }
    if (authTeacherId) {
      setActiveTeacherId(authTeacherId);
    }
  }, [userProfile, authRole, authTeacherId]);

  // Connection & loading state
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Core Data States (Initialized with rich defaults for instant snappy rendering)
  const [settings, setSettings] = useState<InstitutionSetting>(INITIAL_INSTITUTION_SETTING);
  const [rateHistories, setRateHistories] = useState<RateHistory[]>(INITIAL_RATE_HISTORIES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [meetingStudents, setMeetingStudents] = useState<MeetingStudent[]>(INITIAL_MEETING_STUDENTS);
  const [studentCharges, setStudentCharges] = useState<StudentCharge[]>(INITIAL_STUDENT_CHARGES);
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>(INITIAL_STUDENT_PAYMENTS);
  const [teacherHonors, setTeacherHonors] = useState<TeacherHonor[]>(INITIAL_TEACHER_HONORS);
  const [teacherPayments, setTeacherPayments] = useState<TeacherPayment[]>(INITIAL_TEACHER_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Deduplication helper to prevent duplicate React keys
  const dedupById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }
    return result;
  };

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    const defaultTitle = 
      type === 'success' ? 'Sukses' :
      type === 'error' ? 'Kesalahan' :
      type === 'warning' ? 'Perhatian' : 'Informasi';
    showToast(title || defaultTitle, message, type);
  };

  // Seed and Realtime Firestore Sync
  useEffect(() => {
    let unsubs: Array<() => void> = [];

    const initializeFirestore = async () => {
      try {
        await seedService.seedIfEmpty();
        setIsFirestoreConnected(true);
      } catch (err) {
        console.warn('Initial seed error:', err);
      } finally {
        setIsInitialLoading(false);
      }

      // 1. Settings listener
      try {
        const unsubSettings = onSnapshot(doc(db, 'settings', 'institution_main'), (docSnap) => {
          if (docSnap.exists()) {
            setSettings({ ...INITIAL_INSTITUTION_SETTING, ...docSnap.data() } as InstitutionSetting);
          }
        }, (err) => console.warn('Settings listener note:', err));
        unsubs.push(unsubSettings);
      } catch (e) {}

      // 2. Students listener
      try {
        const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
          if (!snap.empty) {
            setStudents(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student))));
          }
        }, (err) => console.warn('Students listener note:', err));
        unsubs.push(unsubStudents);
      } catch (e) {}

      // 3. Teachers listener
      try {
        const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
          if (!snap.empty) {
            setTeachers(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher))));
          }
        }, (err) => console.warn('Teachers listener note:', err));
        unsubs.push(unsubTeachers);
      } catch (e) {}

      // 4. Programs listener
      try {
        const unsubPrograms = onSnapshot(collection(db, 'programs'), (snap) => {
          if (!snap.empty) {
            setPrograms(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as Program))));
          }
        }, (err) => console.warn('Programs listener note:', err));
        unsubs.push(unsubPrograms);
      } catch (e) {}

      // 5. Schedules listener
      try {
        const unsubSchedules = onSnapshot(collection(db, 'schedules'), (snap) => {
          if (!snap.empty) {
            setSchedules(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as Schedule))));
          }
        }, (err) => console.warn('Schedules listener note:', err));
        unsubs.push(unsubSchedules);
      } catch (e) {}

      // 6. Meetings listener
      try {
        const unsubMeetings = onSnapshot(collection(db, 'meetings'), (snap) => {
          if (!snap.empty) {
            setMeetings(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as Meeting))));
          }
        }, (err) => console.warn('Meetings listener note:', err));
        unsubs.push(unsubMeetings);
      } catch (e) {}

      // 7. Meeting Students listener
      try {
        const unsubMS = onSnapshot(collection(db, 'meeting_students'), (snap) => {
          if (!snap.empty) {
            setMeetingStudents(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as MeetingStudent))));
          }
        }, (err) => console.warn('MeetingStudents listener note:', err));
        unsubs.push(unsubMS);
      } catch (e) {}

      // 8. Student Charges listener
      try {
        const unsubCharges = onSnapshot(collection(db, 'student_charges'), (snap) => {
          if (!snap.empty) {
            setStudentCharges(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentCharge))));
          }
        }, (err) => console.warn('StudentCharges listener note:', err));
        unsubs.push(unsubCharges);
      } catch (e) {}

      // 9. Student Payments listener
      try {
        const unsubPay = onSnapshot(collection(db, 'student_payments'), (snap) => {
          if (!snap.empty) {
            setStudentPayments(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentPayment))));
          }
        }, (err) => console.warn('StudentPayments listener note:', err));
        unsubs.push(unsubPay);
      } catch (e) {}

      // 10. Teacher Honors listener
      try {
        const unsubHonors = onSnapshot(collection(db, 'teacher_honors'), (snap) => {
          if (!snap.empty) {
            setTeacherHonors(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as TeacherHonor))));
          }
        }, (err) => console.warn('TeacherHonors listener note:', err));
        unsubs.push(unsubHonors);
      } catch (e) {}

      // 11. Teacher Payments listener
      try {
        const unsubTPay = onSnapshot(collection(db, 'teacher_payments'), (snap) => {
          if (!snap.empty) {
            setTeacherPayments(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as TeacherPayment))));
          }
        }, (err) => console.warn('TeacherPayments listener note:', err));
        unsubs.push(unsubTPay);
      } catch (e) {}

      // 12. Expenses listener
      try {
        const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
          if (!snap.empty) {
            setExpenses(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))));
          }
        }, (err) => console.warn('Expenses listener note:', err));
        unsubs.push(unsubExpenses);
      } catch (e) {}

      // 13. Audit logs listener
      try {
        const unsubLogs = onSnapshot(collection(db, 'audit_logs'), (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
            list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            setAuditLogs(dedupById(list));
          }
        }, (err) => console.warn('AuditLogs listener note:', err));
        unsubs.push(unsubLogs);
      } catch (e) {}

      // 14. Notifications listener
      try {
        const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
          if (!snap.empty) {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemNotification));
            list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            setNotifications(dedupById(list));
          }
        }, (err) => console.warn('Notifications listener note:', err));
        unsubs.push(unsubNotifs);
      } catch (e) {}

      // 15. Rate Histories listener
      try {
        const unsubRates = onSnapshot(collection(db, 'rate_histories'), (snap) => {
          if (!snap.empty) {
            setRateHistories(dedupById(snap.docs.map(d => ({ id: d.id, ...d.data() } as RateHistory))));
          }
        }, (err) => console.warn('RateHistories listener note:', err));
        unsubs.push(unsubRates);
      } catch (e) {}
    };

    initializeFirestore();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Role switching
  const setActiveRole = (role: UserRole, teacherId?: string) => {
    setActiveRoleState(role);
    if (role === 'ADMIN') {
      setCurrentUser(INITIAL_USERS[0]);
    } else if (role === 'GURU') {
      const tid = teacherId || activeTeacherId || 'TCH-001';
      setActiveTeacherId(tid);
      const matchedUser = INITIAL_USERS.find(u => u.teacherId === tid) || {
        id: `USR-${tid}`,
        name: teachers.find(t => t.id === tid)?.name || 'Guru EduCendikia',
        email: teachers.find(t => t.id === tid)?.email || 'guru@educendikia.com',
        role: 'GURU' as const,
        teacherId: tid
      };
      setCurrentUser(matchedUser);
    }
  };

  // 1. Settings & Rate Updates
  const updateSettings = async (newSettings: Partial<InstitutionSetting>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await settingsService.updateSettings(newSettings);
      
      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'UPDATE_SETTINGS',
        entity: 'settings',
        entityId: 'institution_main',
        details: 'Memperbarui konfigurasi identitas dan tarif bimbingan belajar.'
      });
      setAuditLogs(prev => [log, ...prev]);

      showToast('Pengaturan Disimpan', 'Konfigurasi lembaga dan sistem berhasil diperbarui.', 'success');
    } catch (err) {
      showToast('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    }
  };

  const updateInstitutionSettings = updateSettings;

  const updateRates = async (
    newStudentRate: number, 
    newTeacherRate: number, 
    notes: string,
    options?: {
      studentBillingScheme?: StudentBillingScheme;
      teacherHonorSchemeType?: TeacherHonorSchemeType;
      defaultTransportAllowance?: number;
    }
  ) => {
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const studentScheme = options?.studentBillingScheme || settings.studentBillingScheme || 'persesi';
    const teacherScheme = options?.teacherHonorSchemeType || settings.teacherHonorSchemeType || 'siswa';
    const transportAllowance = options?.defaultTransportAllowance ?? settings.defaultTransportAllowance ?? 0;

    const studentSchemeLabel = studentScheme === 'persesi' 
      ? 'per sesi/pertemuan' 
      : studentScheme === 'perbulan' 
        ? 'per bulan' 
        : 'per tahun';

    const teacherSchemeLabel = teacherScheme === 'sesi' 
      ? 'per sesi' 
      : teacherScheme === 'siswa' 
        ? 'per siswa' 
        : 'per bulan';

    const studentHistory: RateHistory = {
      id: `RATE-STD-${Date.now()}`,
      rateType: 'STUDENT_CHARGE',
      rateName: `Tarif Les Siswa (${studentSchemeLabel})`,
      value: newStudentRate,
      rate: newStudentRate,
      studentRate: newStudentRate,
      studentBillingScheme: studentScheme,
      effectiveDate: today,
      status: 'AKTIF',
      notes,
      setBy: currentUser.name,
      createdAt: nowIso
    };

    const teacherHistory: RateHistory = {
      id: `RATE-TCH-${Date.now() + 1}`,
      rateType: 'TEACHER_HONOR',
      rateName: `Honor Tentor (${teacherSchemeLabel})`,
      value: newTeacherRate,
      rate: newTeacherRate,
      teacherRate: newTeacherRate,
      teacherHonorSchemeType: teacherScheme,
      effectiveDate: today,
      status: 'AKTIF',
      notes,
      setBy: currentUser.name,
      createdAt: nowIso
    };

    try {
      const updatedFields = {
        studentRate: newStudentRate,
        studentBillingScheme: studentScheme,
        teacherRate: newTeacherRate,
        teacherHonorSchemeType: teacherScheme,
        defaultTransportAllowance: transportAllowance
      };

      await settingsService.updateSettings(updatedFields);

      const batch = writeBatch(db);
      batch.set(doc(db, 'rate_histories', studentHistory.id), studentHistory);
      batch.set(doc(db, 'rate_histories', teacherHistory.id), teacherHistory);
      await batch.commit();

      setSettings(prev => ({ 
        ...prev, 
        ...updatedFields
      }));
      setRateHistories(prev => dedupById([studentHistory, teacherHistory, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'UPDATE_RATES',
        entity: 'rate_histories',
        details: `Memperbarui skema tarif: Siswa = ${formatRupiah(newStudentRate)} (${studentSchemeLabel}), Tentor = ${formatRupiah(newTeacherRate)} (${teacherSchemeLabel}).`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Tarif Berhasil Diperbarui', `Siswa: ${formatRupiah(newStudentRate)} (${studentSchemeLabel}), Tentor: ${formatRupiah(newTeacherRate)} (${teacherSchemeLabel})`, 'success');
    } catch (err) {
      showToast('Gagal Memperbarui Tarif', 'Terjadi kesalahan sistem saat memperbarui tarif.', 'error');
    }
  };

  // 2. Student CRUD
  const createStudent = async (studentData: Omit<Student, 'id' | 'registeredAt'>) => {
    try {
      const newStudent = await studentService.create(studentData);
      setStudents(prev => dedupById([newStudent, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STUDENT_CREATED',
        entity: 'students',
        entityId: newStudent.id,
        details: `Mendaftarkan siswa baru: ${newStudent.name} (${newStudent.nis}) - ${newStudent.grade}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Siswa Ditambahkan', `${newStudent.name} berhasil didaftarkan ke sistem.`, 'success');
    } catch (err) {
      showToast('Gagal Menambah Siswa', 'Terjadi kesalahan saat menambahkan siswa.', 'error');
    }
  };

  const batchCreateStudents = async (
    studentsData: Array<Omit<Student, 'id' | 'registeredAt'> & { id?: string }>
  ): Promise<{ success: boolean; count: number }> => {
    try {
      if (!studentsData || studentsData.length === 0) {
        showToast('Pemberitahuan', 'Tidak ada data siswa yang diimpor.', 'info');
        return { success: false, count: 0 };
      }

      const created = await studentService.createBatch(studentsData);
      setStudents(prev => dedupById([...created, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STUDENT_CREATED',
        entity: 'students',
        entityId: `BATCH-${Date.now()}`,
        details: `Impor massal: ${created.length} siswa baru berhasil ditambahkan ke database.`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast(
        'Impor Siswa Berhasil',
        `${created.length} data siswa berhasil diimpor ke sistem.`,
        'success'
      );
      return { success: true, count: created.length };
    } catch (err: any) {
      console.error('Error in batchCreateStudents:', err);
      showToast('Gagal Impor Siswa', err.message || 'Terjadi kesalahan saat impor data siswa.', 'error');
      return { success: false, count: 0 };
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      await studentService.update(id, updates);
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STUDENT_UPDATED',
        entity: 'students',
        entityId: id,
        details: `Memperbarui data siswa ID: ${id}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Data Siswa Diperbarui', 'Perubahan data siswa berhasil disimpan.', 'success');
    } catch (err) {
      showToast('Gagal Memperbarui', 'Terjadi kesalahan saat memperbarui siswa.', 'error');
    }
  };

  const toggleStudentStatus = async (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    const nextStatus = await studentService.toggleStatus(id, student.status);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));

    const isDeactivated = nextStatus === 'NONAKTIF';
    const log = await auditLogService.create({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: isDeactivated ? 'STUDENT_DEACTIVATED' : 'STUDENT_ACTIVATED',
      entity: 'students',
      entityId: id,
      details: `${isDeactivated ? 'Menonaktifkan' : 'Mengaktifkan kembali'} siswa: ${student.name} (${student.nis})`
    });
    setAuditLogs(prev => dedupById([log, ...prev]));

    showToast('Status Siswa Berubah', `Status siswa ${student.name} kini ${nextStatus}.`, 'info');
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    const student = students.find(s => s.id === id);
    if (!student) return false;

    // Check if student has outstanding debt
    const charges = studentCharges.filter(c => c.studentId === id);
    const payments = studentPayments.filter(p => p.studentId === id && p.status !== 'DIBATALKAN' && p.status !== 'VOID');
    const totalTagihan = charges.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalDibayar = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const sisaTagihan = Math.max(0, totalTagihan - totalDibayar);

    if (sisaTagihan > 0) {
      showToast(
        'Siswa Tidak Dapat Dihapus',
        `Siswa ${student.name} masih memiliki sisa tagihan sebesar ${formatRupiah(sisaTagihan)}. Lunasi tagihan terlebih dahulu sebelum menghapus data siswa.`,
        'error'
      );
      return false;
    }

    try {
      await studentService.delete(id);
      setStudents(prev => prev.filter(s => s.id !== id));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STUDENT_DELETED',
        entity: 'students',
        entityId: id,
        details: `Menghapus siswa tanpa tunggakan tagihan: ${student.name} (${student.nis})`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Siswa Berhasil Dihapus', `Data siswa ${student.name} telah dihapus dari sistem.`, 'success');
      return true;
    } catch (err) {
      showToast('Gagal Menghapus', 'Terjadi kesalahan saat menghapus data siswa.', 'error');
      return false;
    }
  };

  // 3. Teacher CRUD
  const createTeacher = async (teacherData: Omit<Teacher, 'id' | 'joinedAt'>) => {
    try {
      const newTeacher = await teacherService.create(teacherData);
      setTeachers(prev => dedupById([newTeacher, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'TEACHER_CREATED',
        entity: 'teachers',
        entityId: newTeacher.id,
        details: `Menambahkan guru/tentor baru: ${newTeacher.name} (${newTeacher.code})`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Guru Ditambahkan', `Guru ${newTeacher.name} berhasil ditambahkan.`, 'success');
    } catch (err) {
      showToast('Gagal Menambah Guru', 'Terjadi kesalahan saat menambahkan guru.', 'error');
    }
  };

  const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
    try {
      await teacherService.update(id, updates);
      setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'TEACHER_UPDATED',
        entity: 'teachers',
        entityId: id,
        details: `Memperbarui profil guru ID: ${id}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Data Guru Diperbarui', 'Perubahan profil guru berhasil disimpan.', 'success');
    } catch (err) {
      showToast('Gagal Memperbarui', 'Terjadi kesalahan saat memperbarui guru.', 'error');
    }
  };

  const toggleTeacherStatus = async (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;
    const nextStatus = await teacherService.toggleStatus(id, teacher.status);
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));

    const isDeactivated = nextStatus === 'NONAKTIF';
    const log = await auditLogService.create({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: isDeactivated ? 'TEACHER_DEACTIVATED' : 'TEACHER_ACTIVATED',
      entity: 'teachers',
      entityId: id,
      details: `${isDeactivated ? 'Menonaktifkan' : 'Mengaktifkan kembali'} guru: ${teacher.name} (${teacher.code})`
    });
    setAuditLogs(prev => dedupById([log, ...prev]));

    showToast('Status Guru Berubah', `Status ${teacher.name} kini ${nextStatus}.`, 'info');
  };

  // 4. Program CRUD
  const createProgram = async (programData: Omit<Program, 'id'>) => {
    try {
      const newProg = await programService.create(programData);
      setPrograms(prev => dedupById([newProg, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'PROGRAM_CREATED',
        entity: 'programs',
        entityId: newProg.id,
        details: `Menambahkan program belajar baru: ${newProg.name} (${newProg.code})`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Program Ditambahkan', `Program ${newProg.name} berhasil dibuat.`, 'success');
    } catch (err) {
      showToast('Gagal Menambah Program', 'Terjadi kesalahan saat menambahkan program.', 'error');
    }
  };

  const updateProgram = async (id: string, updates: Partial<Program>) => {
    try {
      await programService.update(id, updates);
      setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'PROGRAM_UPDATED',
        entity: 'programs',
        entityId: id,
        details: `Memperbarui data program ID: ${id}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Program Diperbarui', 'Perubahan program belajar berhasil disimpan.', 'success');
    } catch (err) {
      showToast('Gagal Memperbarui', 'Terjadi kesalahan saat memperbarui program.', 'error');
    }
  };

  const toggleProgramStatus = async (id: string) => {
    const prog = programs.find(p => p.id === id);
    if (!prog) return;
    const nextStatus = await programService.toggleStatus(id, prog.status);
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p));

    const isDeactivated = nextStatus === 'NONAKTIF';
    const log = await auditLogService.create({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: isDeactivated ? 'PROGRAM_DEACTIVATED' : 'PROGRAM_ACTIVATED',
      entity: 'programs',
      entityId: id,
      details: `${isDeactivated ? 'Menonaktifkan' : 'Mengaktifkan kembali'} program: ${prog.name} (${prog.code})`
    });
    setAuditLogs(prev => dedupById([log, ...prev]));

    showToast('Status Program Berubah', `Status ${prog.name} kini ${nextStatus}.`, 'info');
  };

  // 5. Schedule CRUD
  const createSchedule = async (scheduleData: Omit<Schedule, 'id' | 'code'>) => {
    try {
      const newSchedule = await scheduleService.create(scheduleData);
      setSchedules(prev => dedupById([newSchedule, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SCHEDULE_CREATED',
        entity: 'schedules',
        entityId: newSchedule.id,
        details: `Membuat jadwal rutin baru: ${newSchedule.code} (${newSchedule.dayOfWeek} ${newSchedule.startTime}-${newSchedule.endTime})`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      // Notification for assigned Teacher
      try {
        const prog = programs.find(p => p.id === newSchedule.programId);
        const timeDisplay = `${newSchedule.startTime || ''} - ${newSchedule.endTime || ''}`;
        const teacherNotif = await notificationService.create({
          type: 'NEW_MEETING',
          category: 'PENGINGAT_JADWAL',
          priority: 'NORMAL',
          role: 'GURU',
          recipientTeacherId: newSchedule.teacherId,
          title: 'Jadwal Mengajar Baru Ditugaskan',
          message: `Anda memiliki jadwal mengajar baru untuk ${prog?.name || 'Program Belajar'} setiap hari ${newSchedule.dayOfWeek} pukul ${timeDisplay} (${newSchedule.room || 'Kelas'}).`,
          referenceType: 'SCHEDULE',
          referenceId: newSchedule.id,
          idempotencyKey: `SCHEDULE_ASSIGNED_${newSchedule.id}`
        }, notifications);
        setNotifications(prev => dedupById([teacherNotif, ...prev]));
      } catch (err) {
        console.warn('Teacher notification note:', err);
      }

      showToast('Jadwal Ditambahkan', `Jadwal ${newSchedule.code} berhasil disimpan.`, 'success');
    } catch (err) {
      showToast('Gagal Menambah Jadwal', 'Terjadi kesalahan saat membuat jadwal.', 'error');
    }
  };

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    try {
      await scheduleService.update(id, updates);
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SCHEDULE_UPDATED',
        entity: 'schedules',
        entityId: id,
        details: `Memperbarui jadwal les ID: ${id}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Jadwal Diperbarui', 'Perubahan jadwal berhasil disimpan.', 'success');
    } catch (err) {
      showToast('Gagal Memperbarui', 'Terjadi kesalahan saat memperbarui jadwal.', 'error');
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      const sch = schedules.find(s => s.id === id);
      await scheduleService.delete(id);
      setSchedules(prev => prev.filter(s => s.id !== id));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SCHEDULE_DELETED',
        entity: 'schedules',
        entityId: id,
        details: `Menghapus jadwal les ${sch?.code || id}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Jadwal Dihapus', 'Jadwal belajar telah dihapus dari sistem.', 'info');
    } catch (err) {
      showToast('Gagal Menghapus', 'Terjadi kesalahan saat menghapus jadwal.', 'error');
    }
  };

  const toggleScheduleStatus = async (id: string) => {
    const sch = schedules.find(s => s.id === id);
    if (!sch) return;
    const nextStatus = await scheduleService.toggleStatus(id, sch.status);
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));

    const isDeactivated = nextStatus === 'NONAKTIF';
    const log = await auditLogService.create({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: isDeactivated ? 'SCHEDULE_DEACTIVATED' : 'SCHEDULE_ACTIVATED',
      entity: 'schedules',
      entityId: id,
      details: `${isDeactivated ? 'Menonaktifkan' : 'Mengaktifkan kembali'} jadwal: ${sch.code} (${sch.dayOfWeek})`
    });
    setAuditLogs(prev => dedupById([log, ...prev]));

    showToast('Status Jadwal Berubah', `Status jadwal ${sch.code} kini ${nextStatus}.`, 'info');
  };

  // 6. Meeting CRUD
  const createMeeting = (meetingData: Omit<Meeting, 'id' | 'meetingCode' | 'presentStudentCount'>): string => {
    const count = Date.now().toString().slice(-4);
    const dateFormatted = meetingData.date.replace(/-/g, '').substring(4);
    const meetingCode = `MTG-${dateFormatted}-${count.slice(-2)}`;
    const newId = `MTG-${meetingData.date}-${count}`;

    const newMeeting: Meeting = {
      ...meetingData,
      id: newId,
      meetingCode,
      registeredStudentCount: meetingData.registeredStudentCount || 0,
      presentStudentCount: 0,
      totalStudents: meetingData.registeredStudentCount || 0,
      totalPresent: 0,
      totalAbsent: 0,
      status: meetingData.status || 'TERJADWAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    meetingService.create(newMeeting);
    setMeetings(prev => dedupById([newMeeting, ...prev]));

    showToast('Pertemuan Dibuat', `Pertemuan ${newMeeting.meetingCode} siap dilaksanakan.`, 'success');
    return newId;
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    try {
      await meetingService.update(id, updates);
      setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      showToast('Pertemuan Diperbarui', 'Data pertemuan berhasil disimpan.', 'success');
    } catch (err) {
      showToast('Gagal Memperbarui', 'Terjadi kesalahan saat memperbarui pertemuan.', 'error');
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      await meetingService.delete(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      showToast('Pertemuan Dihapus', 'Pertemuan berhasil dihapus.', 'info');
    } catch (err) {
      showToast('Gagal Menghapus', 'Terjadi kesalahan saat menghapus pertemuan.', 'error');
    }
  };

  // 7. ATTENDANCE SUBMISSION (TEACHER PENDING VALIDATION & ADMIN VALIDATION)
  const submitAttendance = (
    meetingId: string, 
    attendances: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
    topic?: string,
    notes?: string
  ): boolean => {
    try {
      attendanceService.submitAttendanceForValidation({
        meetingId,
        attendances,
        topic,
        notes,
        currentUser,
        allMeetings: meetings,
        allStudents: students,
        allTeachers: teachers,
        allPrograms: programs
      }).then(result => {
        // Synchronize local state
        setMeetings(prev => prev.map(m => m.id === meetingId ? result.meeting : m));
        
        // Update meeting students
        setMeetingStudents(prev => {
          const filtered = prev.filter(ms => ms.meetingId !== meetingId);
          return dedupById([...result.meetingStudents, ...filtered]);
        });

        // Append log & notifications
        setAuditLogs(prev => dedupById([result.auditLog, ...prev]));
        setNotifications(prev => dedupById([...result.notifications, ...prev]));

        showToast(
          'Absensi Berhasil Diajukan',
          `${result.presentCount} siswa hadir tercatat. Absensi kini menunggu validasi Admin untuk penghitungan honor guru dan tagihan siswa.`,
          'success'
        );
      }).catch(err => {
        console.error('Error in submitAttendanceForValidation:', err);
        showToast('Gagal Mengajukan Absensi', err.message || 'Terjadi kesalahan sistem.', 'error');
      });

      return true;
    } catch (err: any) {
      console.error('submitAttendance error:', err);
      showToast('Gagal Menyimpan Absensi', err.message || 'Terjadi kesalahan.', 'error');
      return false;
    }
  };

  const validateMeetingAttendance = async (
    meetingId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
  ): Promise<boolean> => {
    try {
      if (action === 'APPROVE') {
        const effectiveStudentRate = rateService.getActiveStudentRate(undefined, rateHistories, settings.studentRate || 8000);
        const effectiveTeacherRate = rateService.getActiveTeacherRate(undefined, rateHistories, settings.teacherRate || 2000);

        const result = await attendanceService.approveAttendance({
          meetingId,
          currentUser,
          allMeetings: meetings,
          allMeetingStudents: meetingStudents,
          allStudents: students,
          allTeachers: teachers,
          allPrograms: programs,
          allHonors: teacherHonors,
          studentRate: effectiveStudentRate,
          teacherRate: effectiveTeacherRate,
          adminNotes: notes
        });

        // Update state
        setMeetings(prev => prev.map(m => m.id === meetingId ? result.meeting : m));
        
        // Update student charges
        setStudentCharges(prev => {
          const newChargeIds = result.generatedCharges.map(c => c.id);
          const filtered = prev.filter(c => !newChargeIds.includes(c.id));
          return dedupById([...result.generatedCharges, ...filtered]);
        });

        // Update teacher honor
        setTeacherHonors(prev => {
          const filtered = prev.filter(h => h.id !== result.updatedHonor.id);
          return dedupById([result.updatedHonor, ...filtered]);
        });

        setAuditLogs(prev => dedupById([result.auditLog, ...prev]));
        setNotifications(prev => dedupById([...result.notifications, ...prev]));

        showToast(
          'Absensi Disetujui & Dihitung',
          `Sesi ${result.meeting.meetingCode} telah divalidasi. Tagihan siswa (${result.generatedCharges.length} siswa) & honor guru telah otomatis diperbarui.`,
          'success'
        );
        return true;
      } else {
        const result = await attendanceService.rejectAttendance({
          meetingId,
          currentUser,
          allMeetings: meetings,
          reason: notes
        });

        setMeetings(prev => prev.map(m => m.id === meetingId ? result.meeting : m));
        setAuditLogs(prev => dedupById([result.auditLog, ...prev]));
        setNotifications(prev => dedupById([result.notification, ...prev]));

        showToast(
          'Absensi Ditolak',
          `Absensi pertemuan ${result.meeting.meetingCode} telah ditolak. Guru terkait telah dikirimi notifikasi.`,
          'info'
        );
        return true;
      }
    } catch (err: any) {
      console.error('Error validating attendance:', err);
      showToast('Gagal Validasi Absensi', err.message || 'Terjadi kesalahan sistem.', 'error');
      return false;
    }
  };

  const batchValidateAttendance = async (
    meetingIds: string[],
    notes?: string
  ): Promise<{ success: boolean; count: number }> => {
    try {
      if (!meetingIds || meetingIds.length === 0) {
        showToast('Pemberitahuan', 'Tidak ada sesi yang dipilih untuk divalidasi.', 'info');
        return { success: false, count: 0 };
      }

      const effectiveStudentRate = rateService.getActiveStudentRate(undefined, rateHistories, settings.studentRate || 8000);
      const effectiveTeacherRate = rateService.getActiveTeacherRate(undefined, rateHistories, settings.teacherRate || 2000);

      const result = await attendanceService.batchApproveAttendance({
        meetingIds,
        currentUser,
        allMeetings: meetings,
        allMeetingStudents: meetingStudents,
        allStudents: students,
        allTeachers: teachers,
        allPrograms: programs,
        allHonors: teacherHonors,
        studentRate: effectiveStudentRate,
        teacherRate: effectiveTeacherRate,
        adminNotes: notes || 'Disetujui massal (Batch Approve Otomatis Tanpa Deviasi)'
      });

      if (!result.success || result.approvedCount === 0) {
        showToast('Tidak Ada Sesi Diproses', 'Tidak ditemukan sesi normal yang memenuhi syarat validasi.', 'info');
        return { success: false, count: 0 };
      }

      // Update state meetings
      const updatedMeetingMap = new Map(result.meetings.map(m => [m.id, m]));
      setMeetings(prev => prev.map(m => updatedMeetingMap.get(m.id) || m));

      // Update student charges
      if (result.generatedCharges.length > 0) {
        const newChargeIds = new Set(result.generatedCharges.map(c => c.id));
        setStudentCharges(prev => {
          const filtered = prev.filter(c => !newChargeIds.has(c.id));
          return dedupById([...result.generatedCharges, ...filtered]);
        });
      }

      // Update teacher honors
      if (result.updatedHonors.length > 0) {
        const updatedHonorIds = new Set(result.updatedHonors.map(h => h.id));
        setTeacherHonors(prev => {
          const filtered = prev.filter(h => !updatedHonorIds.has(h.id));
          return dedupById([...result.updatedHonors, ...filtered]);
        });
      }

      setAuditLogs(prev => dedupById([...result.auditLogs, ...prev]));
      setNotifications(prev => dedupById([...result.notifications, ...prev]));

      showToast(
        'Batch Approve Berhasil!',
        `${result.approvedCount} sesi pertemuan normal berhasil disetujui sekaligus. Tagihan siswa & honor guru otomatis diperbarui.`,
        'success'
      );
      return { success: true, count: result.approvedCount };
    } catch (err: any) {
      console.error('Error in batchValidateAttendance:', err);
      showToast('Gagal Batch Approve', err.message || 'Terjadi kesalahan sistem.', 'error');
      return { success: false, count: 0 };
    }
  };

  // 8. Finance - Student Charge & Billing
  const createStudentCharge = async (data: {
    studentId: string;
    programId?: string;
    billingModel?: 'PER_PERTEMUAN' | 'PER_MINGGU' | 'PER_BULAN' | 'PAKET';
    packageName?: string;
    packageSessions?: number;
    description?: string;
    subtotal: number;
    discountType?: 'NONE' | 'NOMINAL' | 'PERSEN';
    discountValue?: number;
    discountAmount?: number;
    discountReason?: string;
    amount: number;
    date?: string;
    period?: string;
  }): Promise<StudentCharge | null> => {
    try {
      const student = students.find(s => s.id === data.studentId);
      const studentName = student?.name || 'Siswa';
      const chargeDate = data.date || new Date().toISOString().split('T')[0];
      const periodStr = data.period || new Date(chargeDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const chargeNumber = `TAG-${chargeDate.replace(/-/g, '').substring(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newCharge = await studentChargeService.create({
        chargeCode: chargeNumber,
        chargeNumber,
        studentId: data.studentId,
        meetingId: '',
        programId: data.programId,
        date: chargeDate,
        period: periodStr,
        quantity: data.packageSessions || 1,
        rate: data.subtotal,
        rateApplied: data.amount,
        subtotal: data.subtotal,
        discountType: data.discountType || 'NONE',
        discountValue: data.discountValue || 0,
        discountAmount: data.discountAmount || 0,
        discountReason: data.discountReason,
        billingModel: data.billingModel || 'PAKET',
        packageName: data.packageName,
        packageSessions: data.packageSessions,
        description: data.description,
        amount: data.amount,
        paidAmount: 0,
        remainingAmount: data.amount,
        status: 'BELUM_BAYAR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setStudentCharges(prev => dedupById([newCharge, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STUDENT_CHARGE_CREATED',
        entity: 'student_charges',
        entityId: newCharge.id,
        details: `Menerbitkan tagihan paket/program ${newCharge.chargeNumber} untuk ${studentName}: ${formatRupiah(data.amount)} (${data.packageName || data.billingModel || 'Tagihan'})`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast(
        'Tagihan Berhasil Dibuat',
        `Tagihan ${newCharge.chargeNumber} sebesar ${formatRupiah(data.amount)} diterbitkan untuk ${studentName}.`,
        'success'
      );

      return newCharge;
    } catch (err: any) {
      console.error('createStudentCharge error:', err);
      showToast('Gagal Membuat Tagihan', err.message || 'Terjadi kesalahan sistem.', 'error');
      return null;
    }
  };

  const deleteStudentCharge = async (id: string): Promise<boolean> => {
    try {
      const charge = studentCharges.find(c => c.id === id);
      if (!charge) return false;

      if ((charge.paidAmount || 0) > 0) {
        showToast('Tidak Bisa Dihapus', 'Tagihan yang sudah memiliki riwayat pembayaran tidak dapat dihapus.', 'warning');
        return false;
      }

      await studentChargeService.delete(id);
      setStudentCharges(prev => prev.filter(c => c.id !== id));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'STUDENT_CHARGE_DELETED',
        entity: 'student_charges',
        entityId: id,
        details: `Membatalkan/menghapus tagihan ${charge.chargeNumber} (${formatRupiah(charge.amount)})`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Tagihan Dihapus', `Tagihan ${charge.chargeNumber} berhasil dibatalkan.`, 'info');
      return true;
    } catch (err: any) {
      showToast('Gagal Menghapus Tagihan', err.message || 'Terjadi kesalahan.', 'error');
      return false;
    }
  };

  // 9. Finance - Student Payment
  const recordStudentPayment = async (data: {
    studentId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    date?: string;
  }) => {
    try {
      const student = students.find(s => s.id === data.studentId);
      const studentName = student?.name || 'Siswa';

      const result = await studentPaymentService.recordPayment({
        studentId: data.studentId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        date: data.date,
        currentUser,
        studentName,
        allCharges: studentCharges
      });

      setStudentPayments(prev => dedupById([result.payment, ...prev]));
      setStudentCharges(dedupById(result.updatedCharges));

      // Notification for Admin
      const notif = await notificationService.create({
        type: 'PAYMENT_RECEIVED',
        category: 'TAGIHAN',
        priority: 'NORMAL',
        role: 'ADMIN',
        title: 'Pembayaran Siswa Diterima',
        message: `Siswa ${studentName} melakukan pembayaran sebesar ${formatRupiah(data.amount)} via ${data.paymentMethod}. Kuitansi: ${result.payment.paymentNumber}.`,
        referenceType: 'STUDENT_PAYMENT',
        referenceId: result.payment.id,
        idempotencyKey: `PAYMENT_STUDENT_${result.payment.id}`,
        metadata: { studentId: data.studentId, amount: data.amount, paymentId: result.payment.id }
      }, notifications);
      setNotifications(prev => dedupById([notif, ...prev]));

      showToast('Pembayaran Berhasil Dicatat', `Kuitansi ${result.payment.paymentNumber} sebesar ${formatRupiah(data.amount)} tercatat untuk ${studentName}.`, 'success');
    } catch (err) {
      showToast('Gagal Mencatat Pembayaran', 'Terjadi kesalahan saat memproses pembayaran siswa.', 'error');
    }
  };

  const voidStudentPayment = async (paymentId: string, reason: string): Promise<boolean> => {
    try {
      const result = await studentPaymentService.voidPayment({
        paymentId,
        reason,
        currentUser,
        allPayments: studentPayments,
        allCharges: studentCharges
      });

      setStudentPayments(prev => prev.map(p => p.id === paymentId ? result.updatedPayment : p));
      setStudentCharges(dedupById(result.updatedCharges));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'VOID_STUDENT_PAYMENT',
        entity: 'student_payments',
        entityId: paymentId,
        details: `Membatalkan (VOID) kuitansi ${result.updatedPayment.paymentNumber}. Alasan: ${reason}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Kuitansi Dibatalkan (VOID)', `Kuitansi ${result.updatedPayment.paymentNumber} berhasil dibatalkan dan saldo tagihan siswa telah dikoreksi.`, 'warning');
      return true;
    } catch (err: any) {
      showToast('Gagal Membatalkan Pembayaran', err.message || 'Terjadi kesalahan sistem.', 'error');
      return false;
    }
  };

  // 9. Finance - Teacher Payment
  const recordTeacherPayment = async (data: {
    teacherId: string;
    period: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    date?: string;
  }) => {
    try {
      const teacher = teachers.find(t => t.id === data.teacherId);
      const teacherName = teacher?.name || 'Guru';

      const result = await teacherPaymentService.recordPayment({
        teacherId: data.teacherId,
        period: data.period,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        date: data.date,
        currentUser,
        teacherName,
        allHonors: teacherHonors
      });

      setTeacherPayments(prev => dedupById([result.payment, ...prev]));
      setTeacherHonors(dedupById(result.updatedHonors));

      // Role-Specific Notifications (Admin + Guru)
      const adminNotif = await notificationService.create({
        type: 'HONOR_PAID',
        category: 'HONOR',
        priority: 'NORMAL',
        role: 'ADMIN',
        title: 'Pencairan Honor Guru Selesai',
        message: `Pencairan honor mengajar ${formatRupiah(data.amount)} kepada ${teacherName} (${data.period}) telah diproses via ${data.paymentMethod}. Voucher: ${result.payment.paymentNumber}.`,
        referenceType: 'TEACHER_HONOR',
        referenceId: result.payment.id,
        idempotencyKey: `HONOR_PAID_ADMIN_${result.payment.id}`,
        metadata: { teacherId: data.teacherId, amount: data.amount, paymentId: result.payment.id }
      }, notifications);

      const teacherNotif = await notificationService.create({
        type: 'HONOR_PAID',
        category: 'HONOR',
        priority: 'NORMAL',
        role: 'GURU',
        recipientTeacherId: data.teacherId,
        title: 'Pembayaran Honor Diterima',
        message: `Pembayaran honor mengajar sebesar ${formatRupiah(data.amount)} untuk periode ${data.period} telah dicatat dan disalurkan via ${data.paymentMethod}.`,
        referenceType: 'TEACHER_HONOR',
        referenceId: result.payment.id,
        idempotencyKey: `HONOR_PAID_TEACHER_${result.payment.id}`,
        metadata: { teacherId: data.teacherId, amount: data.amount, paymentId: result.payment.id }
      }, notifications);

      setNotifications(prev => dedupById([adminNotif, teacherNotif, ...prev]));

      showToast('Pencairan Honor Berhasil', `Voucher ${result.payment.paymentNumber} sebesar ${formatRupiah(data.amount)} telah diproses untuk ${teacherName}.`, 'success');
    } catch (err) {
      showToast('Gagal Memproses Honor', 'Terjadi kesalahan saat memproses pencairan honor guru.', 'error');
    }
  };

  const voidTeacherPayment = async (paymentId: string, reason: string): Promise<boolean> => {
    try {
      const result = await teacherPaymentService.voidPayment({
        paymentId,
        reason,
        currentUser,
        allPayments: teacherPayments,
        allHonors: teacherHonors
      });

      setTeacherPayments(prev => prev.map(p => p.id === paymentId ? result.updatedPayment : p));
      setTeacherHonors(dedupById(result.updatedHonors));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'VOID_TEACHER_PAYMENT',
        entity: 'teacher_payments',
        entityId: paymentId,
        details: `Membatalkan (VOID) voucher honor ${result.updatedPayment.paymentNumber}. Alasan: ${reason}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Voucher Honor Dibatalkan (VOID)', `Voucher ${result.updatedPayment.paymentNumber} berhasil dibatalkan dan status honor guru telah disesuaikan.`, 'warning');
      return true;
    } catch (err: any) {
      showToast('Gagal Membatalkan Voucher', err.message || 'Terjadi kesalahan sistem.', 'error');
      return false;
    }
  };

  // 10. Finance - Expenses
  const createExpense = async (expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'recordedBy'>) => {
    try {
      const newExpense = await expenseService.create(expenseData, currentUser);
      setExpenses(prev => dedupById([newExpense, ...prev]));

      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'CREATE_EXPENSE',
        entity: 'expenses',
        entityId: newExpense.id,
        details: `Mencatat pengeluaran operasional: ${newExpense.description} (${formatRupiah(newExpense.amount)}) - Kategori ${newExpense.category}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast('Pengeluaran Dicatat', `Pengeluaran ${formatRupiah(newExpense.amount)} berhasil disimpan.`, 'success');
    } catch (err) {
      showToast('Gagal Mencatat Pengeluaran', 'Terjadi kesalahan saat menyimpan data pengeluaran.', 'error');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await expenseService.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast('Pengeluaran Dihapus', 'Data pengeluaran telah dihapus.', 'info');
    } catch (err) {
      showToast('Gagal Menghapus', 'Terjadi kesalahan saat menghapus data.', 'error');
    }
  };

  // 11. Notifications
  const markNotificationAsRead = async (id: string) => {
    await notificationService.markAsRead(id, currentUser);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true, readAt: new Date().toISOString() } : n));
  };

  const markAllNotificationsAsRead = async () => {
    const userNotifs = notificationService.filterForUser(notifications, currentUser);
    const unread = userNotifs.filter(n => !n.read && !n.isRead);
    if (unread.length === 0) return;

    await notificationService.markAllAsRead(unread, currentUser);
    const unreadIds = new Set(unread.map(n => n.id));
    setNotifications(prev => prev.map(n => unreadIds.has(n.id) ? { ...n, read: true, isRead: true, readAt: new Date().toISOString() } : n));
    showToast('Notifikasi Dibaca', 'Semua notifikasi telah ditandai sebagai sudah dibaca.', 'info');
  };

  const checkReminders = async () => {
    try {
      const generated: SystemNotification[] = [];

      // 1. Daily schedule reminders for teachers
      const scheduleReminders = await notificationService.checkAndCreateDailyScheduleReminders(
        schedules,
        teachers,
        notifications
      );
      generated.push(...scheduleReminders);

      // 2. Unpaid student charges reminder for Admin
      const receivableReminder = await notificationService.checkAndCreateReceivableReminders(
        studentCharges,
        settings,
        notifications
      );
      if (receivableReminder) {
        generated.push(receivableReminder);
      }

      // 3. Unpaid teacher honors reminder for Admin
      const honorReminder = await notificationService.checkAndCreateHonorReminders(
        teachers,
        teacherHonors,
        settings,
        notifications
      );
      if (honorReminder) {
        generated.push(honorReminder);
      }

      if (generated.length > 0) {
        setNotifications(prev => dedupById([...generated, ...prev]));
        showToast('Pengingat Otomatis Diperbarui', `${generated.length} pengingat baru telah disinkronkan ke sistem.`, 'info');
      }
    } catch (err) {
      console.warn('Error checking reminders:', err);
    }
  };

  // Automatically check scheduled reminders on initial data load
  useEffect(() => {
    if (!isInitialLoading && schedules.length > 0) {
      checkReminders().catch(() => {});
    }
  }, [isInitialLoading, schedules.length, studentCharges.length, teacherHonors.length]);

  const createNotification = async (notifData: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>): Promise<SystemNotification> => {
    const newNotif = await notificationService.create(notifData);
    setNotifications(prev => dedupById([newNotif, ...prev]));
    return newNotif;
  };

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notifikasi Dihapus', 'Notifikasi berhasil dihapus dari sistem.', 'info');
    } catch (err) {
      showToast('Gagal Menghapus Notifikasi', 'Terjadi kesalahan sistem saat menghapus.', 'error');
    }
  };

  const broadcastAnnouncement = async (payload: {
    title: string;
    message: string;
    type?: 'BROADCAST_ANNOUNCEMENT' | 'SCHEDULE_REMINDER' | 'SYSTEM' | string;
    category?: 'PENGUMUMAN' | 'PENGINGAT_JADWAL' | 'SISTEM' | 'TAGIHAN' | 'HONOR';
    priority?: 'NORMAL' | 'IMPORTANT' | 'URGENT';
    targetTeacherId?: string;
    scheduleId?: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
  }): Promise<{ count: number; success: boolean }> => {
    try {
      const isBroadcastToAll = !payload.targetTeacherId || payload.targetTeacherId === 'ALL';
      const targetTeachers = isBroadcastToAll
        ? teachers.filter(t => t.status === 'AKTIF')
        : teachers.filter(t => t.id === payload.targetTeacherId);

      if (targetTeachers.length === 0) {
        showToast('Gagal Broadcast', 'Tidak ada guru target yang ditemukan.', 'error');
        return { count: 0, success: false };
      }

      const broadcastGroupId = `BC-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const createdNotifs: SystemNotification[] = [];

      for (const teacher of targetTeachers) {
        const notifPayload: Omit<SystemNotification, 'id' | 'timestamp' | 'read'> = {
          recipientTeacherId: teacher.id,
          targetTeacherName: teacher.name,
          senderName: currentUser.name || 'Administrator Lembaga',
          senderRole: currentUser.role || 'ADMIN',
          type: payload.type || (payload.category === 'PENGINGAT_JADWAL' ? 'SCHEDULE_REMINDER' : 'BROADCAST_ANNOUNCEMENT'),
          category: payload.category || 'PENGUMUMAN',
          priority: payload.priority || 'NORMAL',
          title: payload.title,
          message: payload.message,
          actionUrl: payload.actionUrl || (payload.category === 'PENGINGAT_JADWAL' ? 'guru-attendance' : 'guru-dashboard'),
          actionLabel: payload.actionLabel || (payload.category === 'PENGINGAT_JADWAL' ? 'Lihat Jadwal / Absensi' : 'Buka Pengumuman'),
          metadata: {
            broadcastGroupId,
            teacherId: teacher.id,
            teacherName: teacher.name,
            scheduleId: payload.scheduleId,
            ...(payload.metadata || {})
          },
          createdAt: nowIso
        };

        const created = await notificationService.create(notifPayload);
        createdNotifs.push(created);
      }

      // Update local state immediately
      setNotifications(prev => dedupById([...createdNotifs, ...prev]));

      // Record Audit Log
      const targetLabel = isBroadcastToAll ? `Semua Guru Aktif (${targetTeachers.length} Guru)` : `${targetTeachers[0].name} (${targetTeachers[0].code})`;
      const log = await auditLogService.create({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: payload.category === 'PENGINGAT_JADWAL' ? 'SEND_SCHEDULE_REMINDER' : 'BROADCAST_ANNOUNCEMENT',
        entity: 'notifications',
        details: `Mengirim ${payload.category === 'PENGINGAT_JADWAL' ? 'Pengingat Jadwal' : 'Broadcast Pengumuman'} [Prioritas: ${payload.priority || 'NORMAL'}]: "${payload.title}" kepada ${targetLabel}`
      });
      setAuditLogs(prev => dedupById([log, ...prev]));

      showToast(
        payload.category === 'PENGINGAT_JADWAL' ? 'Pengingat Terkirim' : 'Broadcast Pengumuman Berhasil',
        `Pesan in-app berhasil disalurkan kepada ${targetTeachers.length} guru secara realtime.`,
        'success'
      );

      return { count: targetTeachers.length, success: true };
    } catch (err: any) {
      console.error('Error broadcasting announcement:', err);
      showToast('Gagal Mengirim Broadcast', err.message || 'Terjadi kesalahan sistem.', 'error');
      return { count: 0, success: false };
    }
  };

  // 12. Reset Demo & Force Seed
  const resetToDefaultData = async () => {
    try {
      await seedService.seedIfEmpty(true);
      setSettings(INITIAL_INSTITUTION_SETTING);
      setRateHistories(INITIAL_RATE_HISTORIES);
      setStudents(INITIAL_STUDENTS);
      setTeachers(INITIAL_TEACHERS);
      setPrograms(INITIAL_PROGRAMS);
      setSchedules(INITIAL_SCHEDULES);
      setMeetings(INITIAL_MEETINGS);
      setMeetingStudents(INITIAL_MEETING_STUDENTS);
      setStudentCharges(INITIAL_STUDENT_CHARGES);
      setStudentPayments(INITIAL_STUDENT_PAYMENTS);
      setTeacherHonors(INITIAL_TEACHER_HONORS);
      setTeacherPayments(INITIAL_TEACHER_PAYMENTS);
      setExpenses(INITIAL_EXPENSES);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setNotifications(INITIAL_NOTIFICATIONS);

      showToast('Database Berhasil Direset', 'Seluruh koleksi Firestore telah direset dan diisi dengan data master komprehensif.', 'success');
    } catch (err) {
      showToast('Gagal Reset', 'Terjadi kesalahan saat mereset database.', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeRole,
        currentRole: activeRole,
        activeTeacherId,
        setActiveRole,
        setActiveTeacherId,
        isFirestoreConnected,
        isInitialLoading,
        settings,
        updateSettings,
        updateInstitutionSettings,
        updateRates,
        rateHistories,
        students,
        createStudent,
        batchCreateStudents,
        updateStudent,
        deleteStudent,
        toggleStudentStatus,
        teachers,
        createTeacher,
        updateTeacher,
        toggleTeacherStatus,
        programs,
        createProgram,
        updateProgram,
        toggleProgramStatus,
        schedules,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        toggleScheduleStatus,
        meetings,
        meetingStudents,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        submitAttendance,
        validateMeetingAttendance,
        batchValidateAttendance,
        studentCharges,
        studentPayments,
        createStudentCharge,
        deleteStudentCharge,
        recordStudentPayment,
        voidStudentPayment,
        teacherHonors,
        teacherPayments,
        recordTeacherPayment,
        voidTeacherPayment,
        expenses,
        createExpense,
        deleteExpense,
        auditLogs,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        checkReminders,
        createNotification,
        broadcastAnnouncement,
        deleteNotification,
        toasts,
        showToast,
        addToast,
        removeToast,
        resetToDefaultData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
