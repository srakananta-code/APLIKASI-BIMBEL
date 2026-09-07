import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch, 
  query 
} from 'firebase/firestore';
import { TeacherPayment, TeacherHonor, PaymentMethod, User } from '../types';
import { INITIAL_TEACHER_PAYMENTS } from '../data/initialData';
import { formatRupiah } from './businessLogic';

const COLLECTION_NAME = 'teacher_payments';

export interface RecordTeacherPaymentParams {
  teacherId: string;
  period: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  date?: string;
  currentUser: User;
  teacherName: string;
  allHonors: TeacherHonor[];
}

export const teacherPaymentService = {
  async getAll(): Promise<TeacherPayment[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_TEACHER_PAYMENTS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherPayment));
    } catch (err) {
      console.warn('Fallback teacher payments:', err);
      return INITIAL_TEACHER_PAYMENTS;
    }
  },

  async recordPayment(params: RecordTeacherPaymentParams): Promise<{
    payment: TeacherPayment;
    updatedHonors: TeacherHonor[];
  }> {
    const { teacherId, period, amount, paymentMethod, notes, date, currentUser, teacherName, allHonors } = params;
    const paymentDate = date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const paymentId = `HPAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const paymentNumber = `VOUC-${paymentDate.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;

    const updatedHonors = allHonors.map(honor => {
      if (honor.teacherId === teacherId && (!period || honor.period === period)) {
        const newPaid = (honor.paidAmount || 0) + amount;
        const newRemaining = Math.max(0, honor.totalHonor - newPaid);
        return {
          ...honor,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? ('LUNAS' as const) : (newPaid > 0 ? ('SEBAGIAN' as const) : ('BELUM_DIBAYAR' as const)),
          lastUpdated: nowIso,
          updatedAt: nowIso
        };
      }
      return honor;
    });

    const payment: TeacherPayment = {
      id: paymentId,
      paymentCode: paymentNumber,
      paymentNumber,
      teacherId,
      period,
      paymentDate,
      date: paymentDate,
      amount,
      paymentMethod,
      notes: notes || `Pembayaran honor periode ${period}`,
      status: 'BERHASIL',
      processedBy: currentUser.name,
      createdBy: currentUser.id,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const batch = writeBatch(db);
      const payRef = doc(db, COLLECTION_NAME, paymentId);
      batch.set(payRef, payment);

      // Update honor in batch
      const targetHonor = updatedHonors.find(h => h.teacherId === teacherId && (!period || h.period === period));
      if (targetHonor) {
        const honorRef = doc(db, 'teacher_honors', targetHonor.id);
        batch.set(honorRef, targetHonor, { merge: true });
      }

      // Audit log
      const logRef = doc(db, 'audit_logs', `LOG-${Date.now()}`);
      batch.set(logRef, {
        id: logRef.id,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        userRole: currentUser.role,
        action: 'PAY_TEACHER_HONOR',
        entity: 'teacher_payments',
        entityId: paymentId,
        details: `Membayar honor ${formatRupiah(amount)} kepada ${teacherName} periode ${period} via ${paymentMethod}.`,
        timestamp: nowIso
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore teacher payment record note:', err);
    }

    return { payment, updatedHonors };
  },

  async voidPayment(params: {
    paymentId: string;
    reason: string;
    currentUser: User;
    allPayments: TeacherPayment[];
    allHonors: TeacherHonor[];
  }): Promise<{
    updatedPayment: TeacherPayment;
    updatedHonors: TeacherHonor[];
  }> {
    const { paymentId, reason, currentUser, allPayments, allHonors } = params;
    const payment = allPayments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Voucher pembayaran honor tidak ditemukan');
    }

    if (payment.status === 'DIBATALKAN' || payment.status === 'VOID') {
      throw new Error('Voucher ini sudah dibatalkan sebelumnya');
    }

    const nowIso = new Date().toISOString();
    const updatedPayment: TeacherPayment = {
      ...payment,
      status: 'DIBATALKAN',
      voidReason: reason || 'Dibatalkan oleh Admin',
      voidedAt: nowIso,
      voidedBy: currentUser.name,
      updatedAt: nowIso
    };

    // Recalculate honor paid amount
    const targetHonor = allHonors.find(
      h => h.teacherId === payment.teacherId && (!payment.period || h.period === payment.period)
    );

    let recalculatedHonor: TeacherHonor | null = null;
    if (targetHonor) {
      const newPaid = Math.max(0, (targetHonor.paidAmount || 0) - payment.amount);
      const newRemaining = Math.max(0, targetHonor.totalHonor - newPaid);
      const newStatus = newRemaining === 0 ? 'LUNAS' : (newPaid > 0 ? 'SEBAGIAN' : 'BELUM_DIBAYAR');

      recalculatedHonor = {
        ...targetHonor,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
        lastUpdated: nowIso,
        updatedAt: nowIso
      };
    }

    const updatedHonors = allHonors.map(h => {
      if (recalculatedHonor && h.id === recalculatedHonor.id) {
        return recalculatedHonor;
      }
      return h;
    });

    try {
      const batch = writeBatch(db);
      const payRef = doc(db, COLLECTION_NAME, paymentId);
      batch.set(payRef, updatedPayment, { merge: true });

      if (recalculatedHonor) {
        const honorRef = doc(db, 'teacher_honors', recalculatedHonor.id);
        batch.set(honorRef, recalculatedHonor, { merge: true });
      }

      // Audit log
      const logRef = doc(db, 'audit_logs', `LOG-${Date.now()}`);
      batch.set(logRef, {
        id: logRef.id,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        userRole: currentUser.role,
        action: 'VOID_TEACHER_PAYMENT',
        entity: 'teacher_payments',
        entityId: paymentId,
        details: `Membatalkan (VOID) voucher honor ${payment.paymentNumber} sebesar ${formatRupiah(payment.amount)}. Alasan: ${reason || 'Tidak ada alasan'}`,
        timestamp: nowIso
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore void teacher payment note:', err);
    }

    return { updatedPayment, updatedHonors };
  }
};
