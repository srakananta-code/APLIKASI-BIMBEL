import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { StudentCharge } from '../types';
import { INITIAL_STUDENT_CHARGES } from '../data/initialData';

const COLLECTION_NAME = 'student_charges';

export const studentChargeService = {
  async getAll(): Promise<StudentCharge[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_STUDENT_CHARGES;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentCharge));
    } catch (err) {
      console.warn('Fallback student charges:', err);
      return INITIAL_STUDENT_CHARGES;
    }
  },

  async getByStudent(studentId: string): Promise<StudentCharge[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('studentId', '==', studentId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentCharge));
    } catch (err) {
      console.error('Error fetching charges by student:', err);
      return [];
    }
  },

  async save(charge: StudentCharge): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, charge.id);
      await setDoc(docRef, {
        ...charge,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving student charge in Firestore:', err);
    }
  },

  async create(chargeData: Omit<StudentCharge, 'id'>): Promise<StudentCharge> {
    const id = `CHG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newCharge: StudentCharge = {
      ...chargeData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.save(newCharge);
    return newCharge;
  },

  async delete(chargeId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, chargeId);
      await setDoc(docRef, { status: 'VOID', updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error('Error deleting/voiding student charge in Firestore:', err);
    }
  }
};
