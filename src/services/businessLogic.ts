import { 
  AttendanceStatus, 
  MeetingStudent, 
  StudentCharge, 
  StudentPayment, 
  TeacherHonor, 
  TeacherPayment,
  Meeting
} from '../types';

/**
 * Format raw numbers into standard Indonesian Rupiah format.
 * E.g. 8000 -> "Rp8.000", 3250000 -> "Rp3.250.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp0';
  }
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp${formatted}`;
}

/**
 * Parses a numeric input from a string, stripping currency characters
 */
export function parseRupiahInput(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^0-9]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Format ISO date or YYYY-MM-DD into readable Indonesian date string
 * E.g. '2026-09-02' -> '02 September 2026'
 */
export function formatDateIndonesian(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, '0');
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${day} ${months[monthIndex] || ''} ${year}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Format date time string
 */
export function formatDateTimeIndonesian(dateTimeString: string): string {
  if (!dateTimeString) return '-';
  try {
    const d = new Date(dateTimeString);
    const dateFormatted = formatDateIndonesian(dateTimeString.split('T')[0]);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${dateFormatted} ${hours}:${minutes}`;
  } catch {
    return dateTimeString;
  }
}

/**
 * Count the number of students who were marked as 'HADIR' in a meeting
 */
export function countPresentStudents(meetingStudents: MeetingStudent[]): number {
  if (!meetingStudents || !Array.isArray(meetingStudents)) return 0;
  return meetingStudents.filter(ms => ms.attendanceStatus === 'HADIR').length;
}

/**
 * Business Rule Check: Only 'HADIR' generates student billing and teacher honor in Phase 1
 */
export function isBillableAttendance(status: AttendanceStatus): boolean {
  return status === 'HADIR';
}

/**
 * Calculate total student charge for a single meeting session
 * Single student charge = rate (default Rp8.000)
 */
export function calculateStudentCharge(attendanceStatus: AttendanceStatus, studentRate: number = 8000): number {
  return isBillableAttendance(attendanceStatus) ? studentRate : 0;
}

/**
 * Calculate discounted price and net payable amount
 */
export function calculateDiscount(
  basePrice: number,
  discountType: 'NONE' | 'NOMINAL' | 'PERSEN' = 'NONE',
  discountValue: number = 0
): {
  discountAmount: number;
  finalPrice: number;
  savingsPercentage: number;
} {
  if (discountType === 'NONE' || !discountValue || discountValue <= 0) {
    return {
      discountAmount: 0,
      finalPrice: Math.max(0, basePrice),
      savingsPercentage: 0
    };
  }

  let discountAmount = 0;
  if (discountType === 'PERSEN') {
    discountAmount = Math.round((basePrice * Math.min(100, discountValue)) / 100);
  } else {
    discountAmount = Math.min(basePrice, discountValue);
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);
  const savingsPercentage = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

  return {
    discountAmount,
    finalPrice,
    savingsPercentage
  };
}

/**
 * Calculate teacher honor for a single meeting session
 * Schemes:
 * - 'PER_SISWA': presentStudentsCount * teacherRate + transportFee
 * - 'PER_SESI': flat teacherRate per session + transportFee
 * - 'BULANAN': transportFee (base salary counted in monthly payroll)
 */
export function calculateTeacherHonor(
  presentStudentsCount: number,
  teacherRate: number = 2000,
  scheme: 'PER_SISWA' | 'PER_SESI' | 'BULANAN' = 'PER_SISWA',
  transportFee: number = 0
): number {
  if (scheme === 'PER_SESI') {
    return teacherRate + transportFee;
  }
  if (scheme === 'BULANAN') {
    return transportFee;
  }
  return (presentStudentsCount * teacherRate) + transportFee;
}

/**
 * Calculate student total charges, total payments, and outstanding balance (Piutang)
 */
export function calculateStudentOutstanding(
  studentId: string, 
  charges: StudentCharge[], 
  payments: StudentPayment[]
): {
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
  totalMeetingsAttended: number;
} {
  const studentCharges = charges.filter(c => c.studentId === studentId);
  const studentPayments = payments.filter(p => p.studentId === studentId);

  const totalCharges = studentCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalPayments = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstandingBalance = Math.max(0, totalCharges - totalPayments);
  const totalMeetingsAttended = studentCharges.length;

  return {
    totalCharges,
    totalPayments,
    outstandingBalance,
    totalMeetingsAttended
  };
}

/**
 * Calculate teacher honor statistics and outstanding honor (Honor Belum Dibayar)
 */
export function calculateTeacherOutstanding(
  teacherId: string,
  meetings: Meeting[],
  meetingStudents: MeetingStudent[],
  payments: TeacherPayment[],
  teacherRate: number = 2000
): {
  totalMeetings: number;
  totalStudentMeetings: number;
  totalHonor: number;
  totalPaid: number;
  outstandingHonor: number;
} {
  // Get all completed meetings for this teacher
  const completedMeetings = meetings.filter(
    m => m.teacherId === teacherId && m.status === 'SELESAI'
  );
  
  const completedMeetingIds = new Set(completedMeetings.map(m => m.id));

  // Count student-meetings (present students across all meetings taught by this teacher)
  const studentMeetingsCount = meetingStudents.filter(
    ms => completedMeetingIds.has(ms.meetingId) && ms.attendanceStatus === 'HADIR'
  ).length;

  const totalHonor = studentMeetingsCount * teacherRate;

  // Payments to this teacher
  const teacherPayments = payments.filter(p => p.teacherId === teacherId);
  const totalPaid = teacherPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const outstandingHonor = Math.max(0, totalHonor - totalPaid);

  return {
    totalMeetings: completedMeetings.length,
    totalStudentMeetings: studentMeetingsCount,
    totalHonor,
    totalPaid,
    outstandingHonor
  };
}

/**
 * Calculate total student meeting count for a given student
 */
export function calculateStudentMeetingCount(
  studentId: string,
  meetingStudents: MeetingStudent[]
): number {
  return meetingStudents.filter(
    ms => ms.studentId === studentId && ms.attendanceStatus === 'HADIR'
  ).length;
}

/**
 * Calculate student-meetings count for a teacher in a given period or all time
 */
export function calculateTeacherStudentMeetings(
  teacherId: string,
  meetings: Meeting[],
  meetingStudents: MeetingStudent[],
  periodMonthYear?: string // e.g. '2026-09'
): number {
  const teacherMeetings = meetings.filter(m => {
    if (m.teacherId !== teacherId || m.status !== 'SELESAI') return false;
    if (periodMonthYear && !m.date.startsWith(periodMonthYear)) return false;
    return true;
  });

  const meetingIds = new Set(teacherMeetings.map(m => m.id));
  return meetingStudents.filter(
    ms => meetingIds.has(ms.meetingId) && ms.attendanceStatus === 'HADIR'
  ).length;
}

/**
 * Group meetings by date for easy calendar / daily listing
 */
export function groupMeetingsByDate(meetings: Meeting[]): Record<string, Meeting[]> {
  const grouped: Record<string, Meeting[]> = {};
  meetings.forEach(m => {
    if (!grouped[m.date]) {
      grouped[m.date] = [];
    }
    grouped[m.date].push(m);
  });
  return grouped;
}
