import { 
  StudentCharge, 
  StudentPayment, 
  TeacherHonor, 
  TeacherPayment, 
  Expense, 
  Meeting, 
  MeetingStudent,
  Teacher,
  Student
} from '../types';

export interface FinancialReportSummary {
  totalStudentCharges: number;
  totalStudentPayments: number;
  totalStudentOutstanding: number;
  totalTeacherHonors: number;
  totalTeacherPayments: number;
  totalTeacherOutstanding: number;
  totalExpenses: number;
  grossRevenue: number;
  netIncome: number;
  totalMeetingsCompleted: number;
  totalStudentAttendances: number;
}

export const reportService = {
  calculateFinancialSummary(
    charges: StudentCharge[],
    studentPayments: StudentPayment[],
    honors: TeacherHonor[],
    teacherPayments: TeacherPayment[],
    expenses: Expense[],
    meetings: Meeting[]
  ): FinancialReportSummary {
    const totalStudentCharges = charges.reduce((acc, c) => acc + (c.amount || 0), 0);
    const totalStudentPayments = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalStudentOutstanding = Math.max(0, totalStudentCharges - totalStudentPayments);

    const totalTeacherHonors = honors.reduce((acc, h) => acc + (h.totalHonor || h.amount || 0), 0);
    const totalTeacherPayments = teacherPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalTeacherOutstanding = Math.max(0, totalTeacherHonors - totalTeacherPayments);

    const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const grossRevenue = totalStudentPayments;
    const netIncome = grossRevenue - totalTeacherPayments - totalExpenses;

    const completedMeetings = meetings.filter(m => m.status === 'SELESAI' || m.status === 'COMPLETED');
    const totalStudentAttendances = completedMeetings.reduce((acc, m) => acc + (m.presentStudentCount || m.totalPresent || 0), 0);

    return {
      totalStudentCharges,
      totalStudentPayments,
      totalStudentOutstanding,
      totalTeacherHonors,
      totalTeacherPayments,
      totalTeacherOutstanding,
      totalExpenses,
      grossRevenue,
      netIncome,
      totalMeetingsCompleted: completedMeetings.length,
      totalStudentAttendances
    };
  }
};
