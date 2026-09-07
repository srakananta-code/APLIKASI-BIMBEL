import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { Expense, User } from '../types';
import { INITIAL_EXPENSES } from '../data/initialData';
import { formatRupiah } from './businessLogic';

const COLLECTION_NAME = 'expenses';

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_EXPENSES;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    } catch (err) {
      console.warn('Fallback expenses:', err);
      return INITIAL_EXPENSES;
    }
  },

  async create(expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'recordedBy'> & { id?: string; expenseNumber?: string }, currentUser: User): Promise<Expense> {
    const expenseId = expenseData.id || `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const dateStr = expenseData.date.replace(/-/g, '').substring(0, 6);
    const expenseNumber = expenseData.expenseNumber || `EXP-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const newExpense: Expense = {
      ...expenseData,
      id: expenseId,
      expenseCode: expenseNumber,
      expenseNumber,
      recordedBy: currentUser.name,
      createdBy: currentUser.id,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, expenseId);
      await setDoc(docRef, newExpense);
    } catch (err) {
      console.error('Error saving expense in Firestore:', err);
    }

    return newExpense;
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting expense in Firestore:', err);
    }
  }
};
