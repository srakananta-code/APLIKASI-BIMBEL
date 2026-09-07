import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch, 
  query 
} from 'firebase/firestore';
import { StudentPayment, StudentCharge, PaymentMethod, User } from '../types';
import { INITIAL_STUDENT_PAYMENTS } from '../data/initialData';
import { formatRupiah } from './businessLogic';

const COLLECTION_NAME = 'student_payments';

export interface RecordStudentPaymentParams {
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  date?: string;
  currentUser: User;
  studentName: string;
  allCharges: StudentCharge[];
}

export const studentPaymentService = {
  async getAll(): Promise<StudentPayment[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_STUDENT_PAYMENTS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentPayment));
    } catch (err) {
      console.warn('Fallback student payments:', err);
      return INITIAL_STUDENT_PAYMENTS;
    }
  },

  async recordPayment(params: RecordStudentPaymentParams): Promise<{
    payment: StudentPayment;
    updatedCharges: StudentCharge[];
  }> {
    const { studentId, amount, paymentMethod, notes, date, currentUser, studentName, allCharges } = params;
    const paymentDate = date || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const paymentNumber = `KW-${paymentDate.replace(/-/g, '').substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;

    let remainingUnallocated = amount;
    const allocatedChargeIds: string[] = [];
    
    // Sort charges chronologically (FIFO - First In First Out)
    const sortedChargeIndices = allCharges
      .map((c, index) => ({ c, index }))
      .filter(item => item.c.studentId === studentId)
      .sort((a, b) => (a.c.date || '').localeCompare(b.c.date || ''));

    const updatedCharges = [...allCharges];
    for (const item of sortedChargeIndices) {
      const charge = item.c;
      const currentRemaining = charge.remainingAmount !== undefined 
        ? charge.remainingAmount 
        : Math.max(0, charge.amount - (charge.paidAmount || 0));

      if (currentRemaining > 0 && remainingUnallocated > 0) {
        allocatedChargeIds.push(charge.id);
        const payForThis = Math.min(currentRemaining, remainingUnallocated);
        const newPaid = (charge.paidAmount || 0) + payForThis;
        const newRemaining = Math.max(0, charge.amount - newPaid);
        remainingUnallocated -= payForThis;

        updatedCharges[item.index] = {
          ...charge,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newRemaining === 0 ? ('LUNAS' as const) : ('SEBAGIAN' as const),
          updatedAt: nowIso
        };
      }
    }

    const payment: StudentPayment = {
      id: paymentId,
      paymentCode: paymentNumber,
      paymentNumber,
      date: paymentDate,
      paymentDate,
      studentId,
      amount,
      paymentMethod,
      notes: notes || `Pembayaran les oleh ${studentName}`,
      status: 'BERHASIL',
      receivedBy: currentUser.name,
      createdBy: currentUser.id,
      chargeIds: allocatedChargeIds,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const batch = writeBatch(db);
      const payRef = doc(db, COLLECTION_NAME, paymentId);
      batch.set(payRef, payment);

      // Update allocated charges in batch
      updatedCharges
        .filter(c => allocatedChargeIds.includes(c.id))
        .forEach(c => {
          const chgRef = doc(db, 'student_charges', c.id);
          batch.set(chgRef, c, { merge: true });
        });

      // Audit log
      const logRef = doc(db, 'audit_logs', `LOG-${Date.now()}`);
      batch.set(logRef, {
        id: logRef.id,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        userRole: currentUser.role,
        action: 'RECEIVE_STUDENT_PAYMENT',
        entity: 'student_payments',
        entityId: paymentId,
        details: `Menerima pembayaran ${formatRupiah(amount)} dari ${studentName} via ${paymentMethod}.`,
        timestamp: nowIso
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore payment record note:', err);
    }

    return { payment, updatedCharges };
  },

  async voidPayment(params: {
    paymentId: string;
    reason: string;
    currentUser: User;
    allPayments: StudentPayment[];
    allCharges: StudentCharge[];
  }): Promise<{
    updatedPayment: StudentPayment;
    updatedCharges: StudentCharge[];
  }> {
    const { paymentId, reason, currentUser, allPayments, allCharges } = params;
    const payment = allPayments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Pembayaran tidak ditemukan');
    }

    if (payment.status === 'DIBATALKAN' || payment.status === 'VOID') {
      throw new Error('Pembayaran ini sudah dibatalkan sebelumnya');
    }

    const nowIso = new Date().toISOString();
    const updatedPayment: StudentPayment = {
      ...payment,
      status: 'DIBATALKAN',
      voidReason: reason || 'Dibatalkan oleh Admin',
      voidedAt: nowIso,
      voidedBy: currentUser.name,
      updatedAt: nowIso
    };

    // Recalculate charges for this student based on all remaining active payments
    const studentId = payment.studentId;
    const activePayments = allPayments
      .filter(p => p.studentId === studentId && p.id !== paymentId && p.status !== 'DIBATALKAN' && p.status !== 'VOID')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const studentCharges = allCharges
      .filter(c => c.studentId === studentId)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Reset student charges to 0 paid first
    const recalculatedChargesMap = new Map<string, StudentCharge>();
    for (const chg of studentCharges) {
      recalculatedChargesMap.set(chg.id, {
        ...chg,
        paidAmount: 0,
        remainingAmount: chg.amount,
        status: 'BELUM_BAYAR',
        updatedAt: nowIso
      });
    }

    // Re-allocate active payments using FIFO
    for (const pay of activePayments) {
      let unallocated = pay.amount;
      for (const chg of studentCharges) {
        const current = recalculatedChargesMap.get(chg.id)!;
        const currentRemaining = current.remainingAmount;
        if (currentRemaining > 0 && unallocated > 0) {
          const allocate = Math.min(currentRemaining, unallocated);
          const newPaid = current.paidAmount + allocate;
          const newRem = Math.max(0, current.amount - newPaid);
          unallocated -= allocate;

          recalculatedChargesMap.set(chg.id, {
            ...current,
            paidAmount: newPaid,
            remainingAmount: newRem,
            status: newRem === 0 ? 'LUNAS' : 'SEBAGIAN',
            updatedAt: nowIso
          });
        }
      }
    }

    const updatedCharges = allCharges.map(c => recalculatedChargesMap.get(c.id) || c);

    try {
      const batch = writeBatch(db);
      const payRef = doc(db, COLLECTION_NAME, paymentId);
      batch.set(payRef, updatedPayment, { merge: true });

      // Update student charges in Firestore
      for (const chg of studentCharges) {
        const updated = recalculatedChargesMap.get(chg.id);
        if (updated) {
          const chgRef = doc(db, 'student_charges', chg.id);
          batch.set(chgRef, updated, { merge: true });
        }
      }

      // Audit log
      const logRef = doc(db, 'audit_logs', `LOG-${Date.now()}`);
      batch.set(logRef, {
        id: logRef.id,
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        userRole: currentUser.role,
        action: 'VOID_STUDENT_PAYMENT',
        entity: 'student_payments',
        entityId: paymentId,
        details: `Membatalkan (VOID) kuitansi ${payment.paymentNumber} sebesar ${formatRupiah(payment.amount)}. Alasan: ${reason || 'Tidak ada alasan'}`,
        timestamp: nowIso
      });

      await batch.commit();
    } catch (err) {
      console.warn('Firestore void payment record note:', err);
    }

    return { updatedPayment, updatedCharges };
  }
};
