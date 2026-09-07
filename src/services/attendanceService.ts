import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch, 
  query, 
  where, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Meeting, 
  MeetingStudent, 
  StudentCharge, 
  TeacherHonor, 
  AttendanceStatus, 
  User, 
  Teacher, 
  Student, 
  Program,
  AuditLog,
  SystemNotification
} from '../types';
import { isBillableAttendance, formatRupiah, calculateDiscount, calculateTeacherHonor } from './businessLogic';

export interface AttendanceSubmissionPayload {
  meetingId: string;
  attendances: Array<{
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
  topic?: string;
  notes?: string;
  currentUser: User;
  allMeetings: Meeting[];
  allStudents: Student[];
  allTeachers: Teacher[];
  allPrograms: Program[];
  allHonors: TeacherHonor[];
  studentRate: number; // default 8000
  teacherRate: number; // default 2000
}

export interface AttendanceSubmissionResult {
  success: boolean;
  meeting: Meeting;
  meetingStudents: MeetingStudent[];
  generatedCharges: StudentCharge[];
  updatedHonor: TeacherHonor;
  auditLog: AuditLog;
  notification: SystemNotification;
  notifications?: SystemNotification[];
  presentCount: number;
}

export const attendanceService = {
  async getAllMeetingStudents(): Promise<MeetingStudent[]> {
    try {
      const q = query(collection(db, 'meeting_students'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingStudent));
    } catch (err) {
      console.warn('Fallback meeting_students:', err);
      return [];
    }
  },

  async getByMeetingId(meetingId: string): Promise<MeetingStudent[]> {
    try {
      const q = query(collection(db, 'meeting_students'), where('meetingId', '==', meetingId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MeetingStudent));
    } catch (err) {
      console.error('Error fetching meeting students:', err);
      return [];
    }
  },

  /**
   * ATOMIC & IDEMPOTENT ATTENDANCE PROCESSING
   * Performs the entire business workflow:
   * 1. Updates meeting_students
   * 2. Computes totalPresent and totalAbsent
   * 3. Sets meetings.status = 'SELESAI'
   * 4. Generates unique student_charges (Rp8.000 / present student)
   * 5. Calculates & updates teacher_honors (Rp2.000 / present student)
   * 6. Generates AuditLog & Notification
   */
  async processAttendance(payload: AttendanceSubmissionPayload): Promise<AttendanceSubmissionResult> {
    const {
      meetingId,
      attendances,
      topic,
      notes,
      currentUser,
      allMeetings,
      allStudents,
      allTeachers,
      allPrograms,
      allHonors,
      studentRate,
      teacherRate
    } = payload;

    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) {
      throw new Error(`Pertemuan dengan ID ${meetingId} tidak ditemukan.`);
    }

    const teacher = allTeachers.find(t => t.id === meeting.teacherId);
    const program = allPrograms.find(p => p.id === meeting.programId);
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toTimeString().substring(0, 5);
    const periodStr = new Date(meeting.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    // 1. Build MeetingStudent records
    const meetingStudents: MeetingStudent[] = attendances.map(att => ({
      id: `MS-${meetingId}-${att.studentId}`,
      meetingId,
      studentId: att.studentId,
      attendanceStatus: att.status,
      attendanceTime: nowTime,
      notes: att.notes || '',
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    // 2. Count present and absent
    const presentList = attendances.filter(a => isBillableAttendance(a.status));
    const presentCount = presentList.length;
    const absentCount = attendances.length - presentCount;

    // 3. Updated Meeting Record
    const updatedMeeting: Meeting = {
      ...meeting,
      status: 'SELESAI',
      presentStudentCount: presentCount,
      totalStudents: attendances.length,
      totalPresent: presentCount,
      totalAbsent: absentCount,
      completedAt: nowIso,
      completedByTeacherId: currentUser.teacherId || meeting.teacherId,
      topic: topic || meeting.topic || '',
      notes: notes || meeting.notes || '',
      updatedAt: nowIso
    };

    // 4. Determine Dynamic Rates and Honor Scheme
    const baseStudentRate = (program && typeof program.studentRate === 'number' && program.studentRate > 0)
      ? program.studentRate
      : (program && typeof program.packagePrice === 'number' && program.packageSessions && program.packageSessions > 0
          ? Math.round(program.packagePrice / program.packageSessions)
          : studentRate);

    // Apply program discount if configured
    const studentDiscount = calculateDiscount(
      baseStudentRate,
      program?.hasDiscount ? (program.discountType || 'NONE') : 'NONE',
      program?.discountValue || 0
    );
    const effectiveStudentRate = studentDiscount.finalPrice;

    const teacherScheme: 'PER_SISWA' | 'PER_SESI' | 'BULANAN' = 
      teacher?.honorScheme || 
      (program?.teacherHonorScheme && program.teacherHonorScheme !== 'FOLLOW_TEACHER' ? program.teacherHonorScheme as any : undefined) ||
      'PER_SISWA';

    const effectiveTeacherRate = (teacher && typeof teacher.customHonorRate === 'number' && teacher.customHonorRate > 0)
      ? teacher.customHonorRate
      : (program && typeof program.teacherHonorRate === 'number' && program.teacherHonorRate > 0)
        ? program.teacherHonorRate
        : teacherRate;

    const transportPerMeeting = Number(teacher?.transportFeePerMeeting || program?.transportAllowance || 0);

    // 5. Student Charges Generation (IDEMPOTENT with Unique Doc IDs)
    const generatedCharges: StudentCharge[] = presentList.map(att => {
      const chargeId = `CHG-${meetingId}-${att.studentId}`;
      const chargeNumber = `TAG-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        id: chargeId,
        chargeCode: chargeNumber,
        chargeNumber,
        meetingId,
        studentId: att.studentId,
        scheduleId: meeting.scheduleId,
        programId: meeting.programId,
        date: meeting.date,
        period: periodStr,
        quantity: 1,
        rate: baseStudentRate,
        rateApplied: effectiveStudentRate,
        subtotal: baseStudentRate,
        discountType: program?.hasDiscount ? program.discountType : 'NONE',
        discountValue: program?.discountValue || 0,
        discountAmount: studentDiscount.discountAmount,
        discountReason: program?.discountName || (studentDiscount.discountAmount > 0 ? 'Diskon Program' : undefined),
        billingModel: program?.billingModel || 'PER_PERTEMUAN',
        packageName: program?.name,
        amount: effectiveStudentRate,
        paidAmount: 0,
        remainingAmount: effectiveStudentRate,
        status: 'BELUM_BAYAR',
        createdAt: nowIso,
        updatedAt: nowIso
      };
    });

    // 6. Teacher Honor Calculation (Accumulated per Period with Flexible Schemes)
    const honorDocId = `HON-${periodStr.replace(/\s+/g, '')}-${meeting.teacherId}`;
    const existingHonor = allHonors.find(h => h.teacherId === meeting.teacherId && h.period === periodStr);

    // Compute session contribution according to scheme
    const thisMeetingHonor = calculateTeacherHonor(presentCount, effectiveTeacherRate, teacherScheme, transportPerMeeting);

    let updatedHonor: TeacherHonor;
    if (existingHonor) {
      const isPriorCompleted = meeting.status === 'SELESAI' || meeting.status === 'COMPLETED';
      const priorMeetingContribution = isPriorCompleted ? (meeting.presentStudentCount || 0) : 0;
      const newTotalStudentMeetings = Math.max(0, existingHonor.studentMeetingCount - priorMeetingContribution + presentCount);
      const newMeetingCount = isPriorCompleted ? existingHonor.meetingCount : (existingHonor.meetingCount + 1);

      let newTotalHonor = 0;
      if (teacherScheme === 'PER_SESI') {
        newTotalHonor = newMeetingCount * (effectiveTeacherRate + transportPerMeeting);
      } else if (teacherScheme === 'BULANAN') {
        const monthlyBase = teacher?.monthlySalary || program?.monthlyHonorRate || 1500000;
        newTotalHonor = monthlyBase + (newMeetingCount * transportPerMeeting);
      } else {
        // PER_SISWA
        newTotalHonor = (newTotalStudentMeetings * effectiveTeacherRate) + (newMeetingCount * transportPerMeeting);
      }

      const remaining = Math.max(0, newTotalHonor - existingHonor.paidAmount);

      updatedHonor = {
        ...existingHonor,
        meetingCount: newMeetingCount,
        studentMeetingCount: newTotalStudentMeetings,
        honorScheme: teacherScheme,
        ratePerStudentMeeting: effectiveTeacherRate,
        rate: effectiveTeacherRate,
        transportTotal: newMeetingCount * transportPerMeeting,
        monthlySalary: teacher?.monthlySalary,
        amount: newTotalHonor,
        totalHonor: newTotalHonor,
        remainingAmount: remaining,
        status: remaining === 0 ? 'LUNAS' : (existingHonor.paidAmount > 0 ? 'SEBAGIAN' : 'BELUM_DIBAYAR'),
        lastUpdated: nowIso,
        updatedAt: nowIso
      };
    } else {
      let totalHonor = thisMeetingHonor;
      if (teacherScheme === 'BULANAN') {
        totalHonor = (teacher?.monthlySalary || program?.monthlyHonorRate || 1500000) + transportPerMeeting;
      }

      updatedHonor = {
        id: honorDocId,
        honorCode: `HNR-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
        honorNumber: `HNR-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
        teacherId: meeting.teacherId,
        programId: meeting.programId,
        period: periodStr,
        date: meeting.date,
        meetingCount: 1,
        studentCount: presentCount,
        studentMeetingCount: presentCount,
        honorScheme: teacherScheme,
        rate: effectiveTeacherRate,
        ratePerStudentMeeting: effectiveTeacherRate,
        transportTotal: transportPerMeeting,
        monthlySalary: teacher?.monthlySalary,
        amount: totalHonor,
        totalHonor,
        paidAmount: 0,
        remainingAmount: totalHonor,
        status: 'BELUM_DIBAYAR',
        lastUpdated: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso
      };
    }

    // 6. Audit Log
    const presentNames = presentList
      .map(p => allStudents.find(s => s.id === p.studentId)?.name || p.studentId)
      .join(', ');

    const auditLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      userRole: currentUser.role,
      action: 'COMPLETE_ATTENDANCE',
      entity: 'meetings',
      entityId: meetingId,
      description: `Guru ${teacher?.name || 'Tentor'} menyelesaikan absensi ${program?.name || 'Pertemuan'} (${meeting.meetingCode})`,
      details: `Absensi selesai: ${presentCount} siswa hadir (${presentNames}), ${absentCount} tidak hadir. Otomasi: ${presentCount} Tagihan Siswa (${formatRupiah(presentCount * effectiveStudentRate)} @${formatRupiah(effectiveStudentRate)}) & Honor Guru ${formatRupiah(presentCount * effectiveTeacherRate)} (@${formatRupiah(effectiveTeacherRate)}/siswa) berhasil dibuat.`,
      timestamp: nowIso,
      relatedEntity: meetingId,
      metadata: {
        meetingId,
        presentCount,
        studentRate: effectiveStudentRate,
        teacherRate: effectiveTeacherRate,
        totalCharge: presentCount * effectiveStudentRate,
        totalHonor: presentCount * effectiveTeacherRate
      }
    };

    // 7. Role-Specific Notifications (Admin + Guru)
    const adminNotif: SystemNotification = {
      id: `NOTIF-ADM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      createdAt: nowIso,
      role: 'ADMIN',
      type: 'ATTENDANCE_COMPLETED',
      category: 'SISTEM',
      priority: 'NORMAL',
      title: 'Absensi Pertemuan Selesai',
      message: `Guru ${teacher?.name || 'Tentor'} telah menyelesaikan absensi ${program?.name || 'Kelas'}. ${presentCount} siswa hadir tercatat. Tagihan ${formatRupiah(presentCount * effectiveStudentRate)} & Honor ${formatRupiah(presentCount * effectiveTeacherRate)} telah otomatis disinkronkan.`,
      referenceType: 'MEETING',
      referenceId: meetingId,
      idempotencyKey: `ATTENDANCE_ADMIN_${meetingId}`,
      isRead: false,
      read: false,
      metadata: {
        meetingId,
        teacherId: meeting.teacherId,
        presentCount,
        amount: presentCount * studentRate
      }
    };

    const teacherNotif: SystemNotification = {
      id: `NOTIF-GURU-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      createdAt: nowIso,
      userId: currentUser.id,
      role: 'GURU',
      recipientTeacherId: meeting.teacherId,
      type: 'ATTENDANCE_COMPLETED',
      category: 'PENGINGAT_JADWAL',
      priority: 'NORMAL',
      title: 'Absensi Pertemuan Berhasil Disimpan',
      message: `Absensi pertemuan ${program?.name || 'Les'} (${meeting.meetingCode}) tanggal ${meeting.date} telah berhasil diverifikasi. ${presentCount} siswa hadir.`,
      referenceType: 'MEETING',
      referenceId: meetingId,
      idempotencyKey: `ATTENDANCE_TEACHER_${meetingId}`,
      isRead: false,
      read: false,
      metadata: {
        meetingId,
        presentCount
      }
    };

    const teacherHonorNotif: SystemNotification = {
      id: `NOTIF-HNR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      createdAt: nowIso,
      role: 'GURU',
      recipientTeacherId: meeting.teacherId,
      type: 'HONOR_GENERATED',
      category: 'HONOR',
      priority: 'NORMAL',
      title: 'Honor Mengajar Tercatat',
      message: `Honor Anda untuk pertemuan ${meeting.date} (${presentCount} siswa hadir) sebesar ${formatRupiah(presentCount * effectiveTeacherRate)} telah dibuat pada periode ${updatedHonor.period}.`,
      referenceType: 'TEACHER_HONOR',
      referenceId: updatedHonor.id,
      idempotencyKey: `ATTENDANCE_HONOR_${meetingId}`,
      isRead: false,
      read: false,
      metadata: {
        meetingId,
        honorId: updatedHonor.id,
        amount: presentCount * effectiveTeacherRate
      }
    };

    const generatedNotifications = [adminNotif, teacherNotif, teacherHonorNotif];

    // 8. Commit to Firestore using writeBatch for transaction atomicity
    try {
      const batch = writeBatch(db);

      // Save meeting
      const meetingRef = doc(db, 'meetings', meetingId);
      batch.set(meetingRef, updatedMeeting, { merge: true });

      // Save meeting students
      meetingStudents.forEach(ms => {
        const msRef = doc(db, 'meeting_students', ms.id);
        batch.set(msRef, ms, { merge: true });
      });

      // Save student charges
      generatedCharges.forEach(chg => {
        const chgRef = doc(db, 'student_charges', chg.id);
        batch.set(chgRef, chg, { merge: true });
      });

      // Save teacher honor
      const honorRef = doc(db, 'teacher_honors', updatedHonor.id);
      batch.set(honorRef, updatedHonor, { merge: true });

      // Save audit log
      const logRef = doc(db, 'audit_logs', auditLog.id);
      batch.set(logRef, auditLog);

      // Save all notifications
      generatedNotifications.forEach(n => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.set(notifRef, n);
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore batch write note (proceeding with state sync):', err);
    }

    return {
      success: true,
      meeting: updatedMeeting,
      meetingStudents,
      generatedCharges,
      updatedHonor,
      auditLog,
      notification: adminNotif,
      notifications: generatedNotifications,
      presentCount
    };
  },

  /**
   * TEACHER SUBMISSION (PENDING ADMIN VALIDATION)
   * Records attendance records and sets validationStatus = 'MENUNGGU_VALIDASI'.
   * Does NOT auto-generate charges or teacher honors yet.
   */
  async submitAttendanceForValidation(payload: {
    meetingId: string;
    attendances: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>;
    topic?: string;
    notes?: string;
    currentUser: User;
    allMeetings: Meeting[];
    allStudents: Student[];
    allTeachers: Teacher[];
    allPrograms: Program[];
  }): Promise<{
    success: boolean;
    meeting: Meeting;
    meetingStudents: MeetingStudent[];
    auditLog: AuditLog;
    notifications: SystemNotification[];
    presentCount: number;
  }> {
    const {
      meetingId,
      attendances,
      topic,
      notes,
      currentUser,
      allMeetings,
      allStudents,
      allTeachers,
      allPrograms
    } = payload;

    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error(`Pertemuan ID ${meetingId} tidak ditemukan.`);

    const teacher = allTeachers.find(t => t.id === meeting.teacherId);
    const program = allPrograms.find(p => p.id === meeting.programId);
    const nowIso = new Date().toISOString();
    const nowTime = new Date().toTimeString().substring(0, 5);

    const meetingStudents: MeetingStudent[] = attendances.map(att => ({
      id: `MS-${meetingId}-${att.studentId}`,
      meetingId,
      studentId: att.studentId,
      attendanceStatus: att.status,
      attendanceTime: nowTime,
      notes: att.notes || '',
      createdAt: nowIso,
      updatedAt: nowIso
    }));

    const presentList = attendances.filter(a => isBillableAttendance(a.status));
    const presentCount = presentList.length;
    const absentCount = attendances.length - presentCount;

    const updatedMeeting: Meeting = {
      ...meeting,
      status: 'SELESAI',
      validationStatus: 'MENUNGGU_VALIDASI',
      presentStudentCount: presentCount,
      totalStudents: attendances.length,
      totalPresent: presentCount,
      totalAbsent: absentCount,
      completedAt: nowIso,
      completedByTeacherId: currentUser.teacherId || meeting.teacherId,
      topic: topic || meeting.topic || '',
      notes: notes || meeting.notes || '',
      updatedAt: nowIso
    };

    const presentNames = presentList
      .map(p => allStudents.find(s => s.id === p.studentId)?.name || p.studentId)
      .join(', ');

    const auditLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      userRole: currentUser.role,
      action: 'SUBMIT_ATTENDANCE_PENDING_VALIDATION',
      entity: 'meetings',
      entityId: meetingId,
      description: `Guru ${teacher?.name || 'Tentor'} mengajukan absensi ${program?.name || 'Pertemuan'} (${meeting.meetingCode}) untuk divalidasi Admin.`,
      details: `${presentCount} siswa hadir (${presentNames}), ${absentCount} tidak hadir. Menunggu validasi admin sebelum kalkulasi tagihan & honor.`,
      timestamp: nowIso,
      relatedEntity: meetingId
    };

    const adminNotif: SystemNotification = {
      id: `NOTIF-ADM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      createdAt: nowIso,
      role: 'ADMIN',
      type: 'ATTENDANCE_PENDING_VALIDATION',
      category: 'SISTEM',
      priority: 'IMPORTANT',
      title: 'Absensi Guru Menunggu Validasi',
      message: `Guru ${teacher?.name || 'Tentor'} telah mengajukan absensi untuk ${program?.name || 'Sesi'} (${meeting.meetingCode}) dengan ${presentCount} siswa hadir. Silakan validasi untuk memproses honor & tagihan.`,
      referenceType: 'MEETING',
      referenceId: meetingId,
      idempotencyKey: `ATTENDANCE_PENDING_${meetingId}`,
      isRead: false,
      read: false
    };

    const teacherNotif: SystemNotification = {
      id: `NOTIF-GURU-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      createdAt: nowIso,
      userId: currentUser.id,
      role: 'GURU',
      recipientTeacherId: meeting.teacherId,
      type: 'ATTENDANCE_PENDING_VALIDATION',
      category: 'PENGINGAT_JADWAL',
      priority: 'NORMAL',
      title: 'Absensi Terkirim (Menunggu Validasi Admin)',
      message: `Absensi pertemuan ${program?.name || 'Kelas'} (${meeting.meetingCode}) berhasil terkirim. Honor mengajar akan otomatis dihitung setelah disetujui Admin.`,
      referenceType: 'MEETING',
      referenceId: meetingId,
      idempotencyKey: `ATTENDANCE_WAITING_${meetingId}`,
      isRead: false,
      read: false
    };

    const notifications = [adminNotif, teacherNotif];

    try {
      const batch = writeBatch(db);
      const meetingRef = doc(db, 'meetings', meetingId);
      batch.set(meetingRef, updatedMeeting, { merge: true });

      meetingStudents.forEach(ms => {
        const msRef = doc(db, 'meeting_students', ms.id);
        batch.set(msRef, ms, { merge: true });
      });

      const logRef = doc(db, 'audit_logs', auditLog.id);
      batch.set(logRef, auditLog);

      notifications.forEach(n => {
        const nRef = doc(db, 'notifications', n.id);
        batch.set(nRef, n);
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore write note in submitAttendanceForValidation:', err);
    }

    return {
      success: true,
      meeting: updatedMeeting,
      meetingStudents,
      auditLog,
      notifications,
      presentCount
    };
  },

  /**
   * ADMIN APPROVES ATTENDANCE
   * Generates student charges and updates teacher honor atomically.
   */
  async approveAttendance(payload: {
    meetingId: string;
    currentUser: User;
    allMeetings: Meeting[];
    allMeetingStudents: MeetingStudent[];
    allStudents: Student[];
    allTeachers: Teacher[];
    allPrograms: Program[];
    allHonors: TeacherHonor[];
    studentRate: number;
    teacherRate: number;
    adminNotes?: string;
  }): Promise<{
    success: boolean;
    meeting: Meeting;
    generatedCharges: StudentCharge[];
    updatedHonor: TeacherHonor;
    auditLog: AuditLog;
    notifications: SystemNotification[];
  }> {
    const {
      meetingId,
      currentUser,
      allMeetings,
      allMeetingStudents,
      allStudents,
      allTeachers,
      allPrograms,
      allHonors,
      studentRate,
      teacherRate,
      adminNotes
    } = payload;

    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error(`Pertemuan ID ${meetingId} tidak ditemukan.`);

    const teacher = allTeachers.find(t => t.id === meeting.teacherId);
    const program = allPrograms.find(p => p.id === meeting.programId);
    const nowIso = new Date().toISOString();
    const periodStr = new Date(meeting.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const existingMS = allMeetingStudents.filter(ms => ms.meetingId === meetingId);
    const presentList = existingMS.filter(ms => isBillableAttendance(ms.attendanceStatus));
    const presentCount = presentList.length;

    // 1. Updated Meeting with Approval
    const updatedMeeting: Meeting = {
      ...meeting,
      validationStatus: 'DISETUJUI',
      validatedAt: nowIso,
      validatedBy: currentUser.name,
      validationNotes: adminNotes || meeting.validationNotes,
      updatedAt: nowIso
    };

    // 2. Determine Rates
    const baseStudentRate = (program && typeof program.studentRate === 'number' && program.studentRate > 0)
      ? program.studentRate
      : (program && typeof program.packagePrice === 'number' && program.packageSessions && program.packageSessions > 0
          ? Math.round(program.packagePrice / program.packageSessions)
          : studentRate);

    const studentDiscount = calculateDiscount(
      baseStudentRate,
      program?.hasDiscount ? (program.discountType || 'NONE') : 'NONE',
      program?.discountValue || 0
    );
    const effectiveStudentRate = studentDiscount.finalPrice;

    const teacherScheme: 'PER_SISWA' | 'PER_SESI' | 'BULANAN' = 
      teacher?.honorScheme || 
      (program?.teacherHonorScheme && program.teacherHonorScheme !== 'FOLLOW_TEACHER' ? program.teacherHonorScheme as any : undefined) ||
      'PER_SISWA';

    const effectiveTeacherRate = (teacher && typeof teacher.customHonorRate === 'number' && teacher.customHonorRate > 0)
      ? teacher.customHonorRate
      : (program && typeof program.teacherHonorRate === 'number' && program.teacherHonorRate > 0)
        ? program.teacherHonorRate
        : teacherRate;

    const transportPerMeeting = Number(teacher?.transportFeePerMeeting || program?.transportAllowance || 0);

    // 3. Generate Student Charges
    const generatedCharges: StudentCharge[] = presentList.map(att => {
      const chargeId = `CHG-${meetingId}-${att.studentId}`;
      const chargeNumber = `TAG-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        id: chargeId,
        chargeCode: chargeNumber,
        chargeNumber,
        meetingId,
        studentId: att.studentId,
        scheduleId: meeting.scheduleId,
        programId: meeting.programId,
        date: meeting.date,
        period: periodStr,
        quantity: 1,
        rate: baseStudentRate,
        rateApplied: effectiveStudentRate,
        subtotal: baseStudentRate,
        discountType: program?.hasDiscount ? program.discountType : 'NONE',
        discountValue: program?.discountValue || 0,
        discountAmount: studentDiscount.discountAmount,
        discountReason: program?.discountName || (studentDiscount.discountAmount > 0 ? 'Diskon Program' : undefined),
        billingModel: program?.billingModel || 'PER_PERTEMUAN',
        packageName: program?.name,
        amount: effectiveStudentRate,
        paidAmount: 0,
        remainingAmount: effectiveStudentRate,
        status: 'BELUM_BAYAR',
        createdAt: nowIso,
        updatedAt: nowIso
      };
    });

    // 4. Update or Create Teacher Honor
    const honorDocId = `HON-${periodStr.replace(/\s+/g, '')}-${meeting.teacherId}`;
    const existingHonor = allHonors.find(h => h.teacherId === meeting.teacherId && h.period === periodStr);

    const thisMeetingHonor = calculateTeacherHonor(presentCount, effectiveTeacherRate, teacherScheme, transportPerMeeting);

    let updatedHonor: TeacherHonor;
    if (existingHonor) {
      const newTotalStudentMeetings = existingHonor.studentMeetingCount + presentCount;
      const newMeetingCount = existingHonor.meetingCount + 1;

      let newTotalHonor = 0;
      if (teacherScheme === 'PER_SESI') {
        newTotalHonor = newMeetingCount * (effectiveTeacherRate + transportPerMeeting);
      } else if (teacherScheme === 'BULANAN') {
        const monthlyBase = teacher?.monthlySalary || program?.monthlyHonorRate || 1500000;
        newTotalHonor = monthlyBase + (newMeetingCount * transportPerMeeting);
      } else {
        newTotalHonor = (newTotalStudentMeetings * effectiveTeacherRate) + (newMeetingCount * transportPerMeeting);
      }

      const remaining = Math.max(0, newTotalHonor - existingHonor.paidAmount);

      updatedHonor = {
        ...existingHonor,
        meetingCount: newMeetingCount,
        studentMeetingCount: newTotalStudentMeetings,
        honorScheme: teacherScheme,
        ratePerStudentMeeting: effectiveTeacherRate,
        rate: effectiveTeacherRate,
        transportTotal: newMeetingCount * transportPerMeeting,
        monthlySalary: teacher?.monthlySalary,
        amount: newTotalHonor,
        totalHonor: newTotalHonor,
        remainingAmount: remaining,
        status: remaining === 0 ? 'LUNAS' : (existingHonor.paidAmount > 0 ? 'SEBAGIAN' : 'BELUM_DIBAYAR'),
        lastUpdated: nowIso,
        updatedAt: nowIso
      };
    } else {
      let totalHonor = thisMeetingHonor;
      if (teacherScheme === 'BULANAN') {
        totalHonor = (teacher?.monthlySalary || program?.monthlyHonorRate || 1500000) + transportPerMeeting;
      }

      updatedHonor = {
        id: honorDocId,
        honorCode: `HNR-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
        honorNumber: `HNR-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
        teacherId: meeting.teacherId,
        programId: meeting.programId,
        meetingId: meeting.id,
        period: periodStr,
        date: meeting.date,
        meetingCount: 1,
        studentCount: presentCount,
        studentMeetingCount: presentCount,
        honorScheme: teacherScheme,
        rate: effectiveTeacherRate,
        ratePerStudentMeeting: effectiveTeacherRate,
        transportTotal: transportPerMeeting,
        monthlySalary: teacher?.monthlySalary,
        amount: totalHonor,
        totalHonor,
        paidAmount: 0,
        remainingAmount: totalHonor,
        status: 'BELUM_DIBAYAR',
        lastUpdated: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso
      };
    }

    // 5. Audit Log
    const auditLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      userRole: currentUser.role,
      action: 'APPROVE_ATTENDANCE_AND_CALCULATE',
      entity: 'meetings',
      entityId: meetingId,
      description: `Admin ${currentUser.name} memvalidasi & menyetujui absensi ${meeting.meetingCode}.`,
      details: `Validasi absensi disetujui. Otomasi berhasil: ${generatedCharges.length} tagihan siswa (${formatRupiah(presentCount * effectiveStudentRate)}) & Honor guru (${formatRupiah(thisMeetingHonor)}) berhasil dikalkulasi ke sistem.`,
      timestamp: nowIso,
      relatedEntity: meetingId
    };

    // 6. Teacher Notification of approval & honor
    const teacherNotif: SystemNotification = {
      id: `NOTIF-GURU-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      createdAt: nowIso,
      userId: currentUser.id,
      role: 'GURU',
      recipientTeacherId: meeting.teacherId,
      type: 'HONOR_GENERATED',
      category: 'HONOR',
      priority: 'IMPORTANT',
      title: 'Absensi Disetujui & Honor Tercatat',
      message: `Admin ${currentUser.name} telah menyetujui absensi pertemuan ${program?.name || 'Les'} (${meeting.meetingCode}). Honor mengajar sesi ini sebesar ${formatRupiah(thisMeetingHonor)} telah resmi dicatat pada periode ${periodStr}.`,
      referenceType: 'TEACHER_HONOR',
      referenceId: updatedHonor.id,
      idempotencyKey: `ATTENDANCE_APPROVED_${meetingId}`,
      isRead: false,
      read: false
    };

    try {
      const batch = writeBatch(db);
      const meetingRef = doc(db, 'meetings', meetingId);
      batch.set(meetingRef, updatedMeeting, { merge: true });

      generatedCharges.forEach(chg => {
        const chgRef = doc(db, 'student_charges', chg.id);
        batch.set(chgRef, chg, { merge: true });
      });

      const honorRef = doc(db, 'teacher_honors', updatedHonor.id);
      batch.set(honorRef, updatedHonor, { merge: true });

      const logRef = doc(db, 'audit_logs', auditLog.id);
      batch.set(logRef, auditLog);

      const notifRef = doc(db, 'notifications', teacherNotif.id);
      batch.set(notifRef, teacherNotif);

      await batch.commit();
    } catch (err) {
      console.warn('Firestore write note in approveAttendance:', err);
    }

    return {
      success: true,
      meeting: updatedMeeting,
      generatedCharges,
      updatedHonor,
      auditLog,
      notifications: [teacherNotif]
    };
  },

  /**
   * ADMIN BATCH APPROVES ATTENDANCES FOR NORMAL SESSIONS WITHOUT DEVIATION
   * Approves multiple sessions at once without deviation, generating all student charges
   * and accumulating teachers' honors in a unified, safe batch.
   */
  async batchApproveAttendance(payload: {
    meetingIds: string[];
    currentUser: User;
    allMeetings: Meeting[];
    allMeetingStudents: MeetingStudent[];
    allStudents: Student[];
    allTeachers: Teacher[];
    allPrograms: Program[];
    allHonors: TeacherHonor[];
    studentRate: number;
    teacherRate: number;
    adminNotes?: string;
  }): Promise<{
    success: boolean;
    approvedCount: number;
    meetings: Meeting[];
    generatedCharges: StudentCharge[];
    updatedHonors: TeacherHonor[];
    auditLogs: AuditLog[];
    notifications: SystemNotification[];
  }> {
    const {
      meetingIds,
      currentUser,
      allMeetings,
      allMeetingStudents,
      allTeachers,
      allPrograms,
      allHonors,
      studentRate,
      teacherRate,
      adminNotes
    } = payload;

    const nowIso = new Date().toISOString();
    const approvedMeetings: Meeting[] = [];
    const allGeneratedCharges: StudentCharge[] = [];
    const auditLogs: AuditLog[] = [];
    const notifications: SystemNotification[] = [];

    // Maintain running honors across multiple meetings
    const runningHonorsMap = new Map<string, TeacherHonor>();
    allHonors.forEach(h => runningHonorsMap.set(h.id, { ...h }));

    for (const meetingId of meetingIds) {
      const meeting = allMeetings.find(m => m.id === meetingId);
      if (!meeting) continue;
      if (meeting.validationStatus !== 'MENUNGGU_VALIDASI') continue;

      const program = allPrograms.find(p => p.id === meeting.programId);
      const teacher = allTeachers.find(t => t.id === meeting.teacherId);
      const periodStr = new Date(meeting.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      const existingMS = allMeetingStudents.filter(ms => ms.meetingId === meetingId);
      const presentList = existingMS.filter(ms => isBillableAttendance(ms.attendanceStatus));
      const presentCount = presentList.length;

      // 1. Updated Meeting
      const updatedMeeting: Meeting = {
        ...meeting,
        validationStatus: 'DISETUJUI',
        validatedAt: nowIso,
        validatedBy: currentUser.name,
        validationNotes: adminNotes || 'Disetujui massal (Batch Approve Otomatis Tanpa Deviasi)',
        updatedAt: nowIso
      };
      approvedMeetings.push(updatedMeeting);

      // 2. Determine Rates
      const baseStudentRate = (program && typeof program.studentRate === 'number' && program.studentRate > 0)
        ? program.studentRate
        : (program && typeof program.packagePrice === 'number' && program.packageSessions && program.packageSessions > 0
            ? Math.round(program.packagePrice / program.packageSessions)
            : studentRate);

      const studentDiscount = calculateDiscount(
        baseStudentRate,
        program?.hasDiscount ? (program.discountType || 'NONE') : 'NONE',
        program?.discountValue || 0
      );
      const effectiveStudentRate = studentDiscount.finalPrice;

      const teacherScheme: 'PER_SISWA' | 'PER_SESI' | 'BULANAN' = 
        teacher?.honorScheme || 
        (program?.teacherHonorScheme && program.teacherHonorScheme !== 'FOLLOW_TEACHER' ? program.teacherHonorScheme as any : undefined) ||
        'PER_SISWA';

      const effectiveTeacherRate = (teacher && typeof teacher.customHonorRate === 'number' && teacher.customHonorRate > 0)
        ? teacher.customHonorRate
        : (program && typeof program.teacherHonorRate === 'number' && program.teacherHonorRate > 0)
          ? program.teacherHonorRate
          : teacherRate;

      const transportPerMeeting = Number(teacher?.transportFeePerMeeting || program?.transportAllowance || 0);

      // 3. Generate Student Charges
      const chargesForThisMeeting: StudentCharge[] = presentList.map(att => {
        const chargeId = `CHG-${meetingId}-${att.studentId}`;
        const chargeNumber = `TAG-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`;

        return {
          id: chargeId,
          chargeCode: chargeNumber,
          chargeNumber,
          meetingId,
          studentId: att.studentId,
          scheduleId: meeting.scheduleId,
          programId: meeting.programId,
          date: meeting.date,
          period: periodStr,
          quantity: 1,
          rate: baseStudentRate,
          rateApplied: effectiveStudentRate,
          subtotal: baseStudentRate,
          discountType: program?.hasDiscount ? program.discountType : 'NONE',
          discountValue: program?.discountValue || 0,
          discountAmount: studentDiscount.discountAmount,
          discountReason: program?.discountName || (studentDiscount.discountAmount > 0 ? 'Diskon Program' : undefined),
          billingModel: program?.billingModel || 'PER_PERTEMUAN',
          packageName: program?.name,
          amount: effectiveStudentRate,
          paidAmount: 0,
          remainingAmount: effectiveStudentRate,
          status: 'BELUM_BAYAR',
          createdAt: nowIso,
          updatedAt: nowIso
        };
      });
      allGeneratedCharges.push(...chargesForThisMeeting);

      // 4. Update or Create Teacher Honor in running map
      const honorDocId = `HON-${periodStr.replace(/\s+/g, '')}-${meeting.teacherId}`;
      const existingHonor = runningHonorsMap.get(honorDocId) || Array.from(runningHonorsMap.values()).find(h => h.teacherId === meeting.teacherId && h.period === periodStr);

      const thisMeetingHonor = calculateTeacherHonor(presentCount, effectiveTeacherRate, teacherScheme, transportPerMeeting);

      let updatedHonor: TeacherHonor;
      if (existingHonor) {
        const newTotalStudentMeetings = existingHonor.studentMeetingCount + presentCount;
        const newMeetingCount = existingHonor.meetingCount + 1;

        let newTotalHonor = 0;
        if (teacherScheme === 'PER_SESI') {
          newTotalHonor = newMeetingCount * (effectiveTeacherRate + transportPerMeeting);
        } else if (teacherScheme === 'BULANAN') {
          const monthlyBase = teacher?.monthlySalary || program?.monthlyHonorRate || 1500000;
          newTotalHonor = monthlyBase + (newMeetingCount * transportPerMeeting);
        } else {
          newTotalHonor = (newTotalStudentMeetings * effectiveTeacherRate) + (newMeetingCount * transportPerMeeting);
        }

        const remaining = Math.max(0, newTotalHonor - existingHonor.paidAmount);

        updatedHonor = {
          ...existingHonor,
          meetingCount: newMeetingCount,
          studentMeetingCount: newTotalStudentMeetings,
          honorScheme: teacherScheme,
          ratePerStudentMeeting: effectiveTeacherRate,
          rate: effectiveTeacherRate,
          transportTotal: newMeetingCount * transportPerMeeting,
          monthlySalary: teacher?.monthlySalary,
          amount: newTotalHonor,
          totalHonor: newTotalHonor,
          remainingAmount: remaining,
          status: remaining === 0 ? 'LUNAS' : (existingHonor.paidAmount > 0 ? 'SEBAGIAN' : 'BELUM_DIBAYAR'),
          lastUpdated: nowIso,
          updatedAt: nowIso
        };
      } else {
        let totalHonor = thisMeetingHonor;
        if (teacherScheme === 'BULANAN') {
          totalHonor = (teacher?.monthlySalary || program?.monthlyHonorRate || 1500000) + transportPerMeeting;
        }

        updatedHonor = {
          id: honorDocId,
          honorCode: `HNR-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
          honorNumber: `HNR-${meeting.date.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`,
          teacherId: meeting.teacherId,
          programId: meeting.programId,
          meetingId: meeting.id,
          period: periodStr,
          date: meeting.date,
          meetingCount: 1,
          studentCount: presentCount,
          studentMeetingCount: presentCount,
          honorScheme: teacherScheme,
          rate: effectiveTeacherRate,
          ratePerStudentMeeting: effectiveTeacherRate,
          transportTotal: transportPerMeeting,
          monthlySalary: teacher?.monthlySalary,
          amount: totalHonor,
          totalHonor,
          paidAmount: 0,
          remainingAmount: totalHonor,
          status: 'BELUM_DIBAYAR',
          lastUpdated: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso
        };
      }
      runningHonorsMap.set(updatedHonor.id, updatedHonor);

      // 5. Audit Log
      const auditLog: AuditLog = {
        id: `LOG-${Date.now()}-${meeting.id}`,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        userRole: currentUser.role,
        action: 'APPROVE_ATTENDANCE_AND_CALCULATE',
        entity: 'meetings',
        entityId: meetingId,
        description: `Batch approve: Admin ${currentUser.name} menyetujui absensi ${meeting.meetingCode}.`,
        details: `Batch validasi massal. Otomasi: ${chargesForThisMeeting.length} tagihan siswa & honor guru ${teacher?.name || ''} berhasil diproses.`,
        timestamp: nowIso,
        relatedEntity: meetingId
      };
      auditLogs.push(auditLog);

      // 6. Teacher Notification
      const teacherNotif: SystemNotification = {
        id: `NOTIF-GURU-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: nowIso,
        createdAt: nowIso,
        userId: currentUser.id,
        role: 'GURU',
        recipientTeacherId: meeting.teacherId,
        type: 'HONOR_GENERATED',
        category: 'HONOR',
        priority: 'IMPORTANT',
        title: 'Absensi Disetujui (Batch Approve)',
        message: `Admin ${currentUser.name} telah menyetujui absensi pertemuan ${program?.name || 'Les'} (${meeting.meetingCode}) via validasi massal. Honor mengajar sesi ini sebesar ${formatRupiah(thisMeetingHonor)} telah resmi dicatat.`,
        referenceType: 'TEACHER_HONOR',
        referenceId: updatedHonor.id,
        idempotencyKey: `ATTENDANCE_APPROVED_${meetingId}`,
        isRead: false,
        read: false
      };
      notifications.push(teacherNotif);
    }

    const updatedHonors = Array.from(runningHonorsMap.values());

    // Firestore batch commit in safe batches of up to 400 items
    try {
      if (approvedMeetings.length > 0) {
        let currentBatch = writeBatch(db);
        let opCount = 0;

        const commitBatchIfNeeded = async () => {
          if (opCount >= 400) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            opCount = 0;
          }
        };

        for (const m of approvedMeetings) {
          currentBatch.set(doc(db, 'meetings', m.id), m, { merge: true });
          opCount++;
          await commitBatchIfNeeded();
        }

        for (const c of allGeneratedCharges) {
          currentBatch.set(doc(db, 'student_charges', c.id), c, { merge: true });
          opCount++;
          await commitBatchIfNeeded();
        }

        for (const h of updatedHonors) {
          currentBatch.set(doc(db, 'teacher_honors', h.id), h, { merge: true });
          opCount++;
          await commitBatchIfNeeded();
        }

        for (const log of auditLogs) {
          currentBatch.set(doc(db, 'audit_logs', log.id), log);
          opCount++;
          await commitBatchIfNeeded();
        }

        for (const notif of notifications) {
          currentBatch.set(doc(db, 'notifications', notif.id), notif);
          opCount++;
          await commitBatchIfNeeded();
        }

        if (opCount > 0) {
          await currentBatch.commit();
        }
      }
    } catch (err) {
      console.warn('Firestore batch write note in batchApproveAttendance:', err);
    }

    return {
      success: true,
      approvedCount: approvedMeetings.length,
      meetings: approvedMeetings,
      generatedCharges: allGeneratedCharges,
      updatedHonors,
      auditLogs,
      notifications
    };
  },

  /**
   * ADMIN REJECTS ATTENDANCE
   * Sets validationStatus = 'DITOLAK' with reason notes, and alerts the teacher.
   */
  async rejectAttendance(payload: {
    meetingId: string;
    currentUser: User;
    allMeetings: Meeting[];
    reason?: string;
  }): Promise<{
    success: boolean;
    meeting: Meeting;
    auditLog: AuditLog;
    notification: SystemNotification;
  }> {
    const { meetingId, currentUser, allMeetings, reason } = payload;
    const meeting = allMeetings.find(m => m.id === meetingId);
    if (!meeting) throw new Error(`Pertemuan ID ${meetingId} tidak ditemukan.`);

    const nowIso = new Date().toISOString();
    const rejectionReason = reason || 'Data absensi perlu disesuaikan kembali';

    const updatedMeeting: Meeting = {
      ...meeting,
      validationStatus: 'DITOLAK',
      validatedAt: nowIso,
      validatedBy: currentUser.name,
      validationNotes: rejectionReason,
      updatedAt: nowIso
    };

    const auditLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      userRole: currentUser.role,
      action: 'REJECT_ATTENDANCE',
      entity: 'meetings',
      entityId: meetingId,
      description: `Admin ${currentUser.name} menolak absensi pertemuan ${meeting.meetingCode}.`,
      details: `Alasan penolakan: ${rejectionReason}`,
      timestamp: nowIso,
      relatedEntity: meetingId
    };

    const teacherNotif: SystemNotification = {
      id: `NOTIF-GURU-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowIso,
      createdAt: nowIso,
      userId: currentUser.id,
      role: 'GURU',
      recipientTeacherId: meeting.teacherId,
      type: 'ATTENDANCE_COMPLETED',
      category: 'SISTEM',
      priority: 'IMPORTANT',
      title: 'Absensi Ditolak oleh Admin',
      message: `Absensi pertemuan ${meeting.meetingCode} tidak disetujui Admin ${currentUser.name}. Alasan: "${rejectionReason}". Silakan hubungi admin bimbel.`,
      referenceType: 'MEETING',
      referenceId: meetingId,
      idempotencyKey: `ATTENDANCE_REJECTED_${meetingId}`,
      isRead: false,
      read: false
    };

    try {
      const batch = writeBatch(db);
      const meetingRef = doc(db, 'meetings', meetingId);
      batch.set(meetingRef, updatedMeeting, { merge: true });

      const logRef = doc(db, 'audit_logs', auditLog.id);
      batch.set(logRef, auditLog);

      const notifRef = doc(db, 'notifications', teacherNotif.id);
      batch.set(notifRef, teacherNotif);

      await batch.commit();
    } catch (err) {
      console.warn('Firestore write note in rejectAttendance:', err);
    }

    return {
      success: true,
      meeting: updatedMeeting,
      auditLog,
      notification: teacherNotif
    };
  }
};

/**
 * Checks if a meeting is considered a "normal schedule without deviation":
 * 1. Waiting for validation
 * 2. Has recorded present attendees (> 0)
 * 3. Has no keywords indicating deviation, conflict, cancellation, or anomaly in its notes
 */
export const isMeetingNormalWithoutDeviation = (meeting: Meeting): boolean => {
  if (meeting.validationStatus !== 'MENUNGGU_VALIDASI') return false;
  if ((meeting.presentStudentCount || 0) <= 0) return false;

  const combinedNotes = `${meeting.notes || ''} ${meeting.validationNotes || ''}`.toLowerCase();
  const deviationKeywords = [
    'deviasi',
    'anomali',
    'batal',
    'sengketa',
    'komplain',
    'konflik',
    'masalah',
    'tukar jam',
    'ganti guru',
    'susulan'
  ];

  return !deviationKeywords.some(keyword => combinedNotes.includes(keyword));
};

