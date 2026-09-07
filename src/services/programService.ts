import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  query 
} from 'firebase/firestore';
import { Program } from '../types';
import { INITIAL_PROGRAMS } from '../data/initialData';

const COLLECTION_NAME = 'programs';

export const programService = {
  async getAll(): Promise<Program[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_PROGRAMS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
    } catch (err) {
      console.warn('Fallback program data:', err);
      return INITIAL_PROGRAMS;
    }
  },

  async create(programData: Omit<Program, 'id'> & { id?: string }): Promise<Program> {
    const programId = programData.id || `PRG-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const newProgram: Program = {
      ...programData,
      id: programId,
      programCode: programData.programCode || programData.code || programId,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, programId);
      await setDoc(docRef, newProgram);
    } catch (err) {
      console.error('Error creating program in Firestore:', err);
    }

    return newProgram;
  },

  async update(id: string, updates: Partial<Program>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating program in Firestore:', err);
    }
  },

  async toggleStatus(id: string, currentStatus: string): Promise<'AKTIF' | 'NONAKTIF'> {
    const nextStatus = (currentStatus === 'AKTIF' || currentStatus === 'ACTIVE') ? 'NONAKTIF' : 'AKTIF';
    await this.update(id, { status: nextStatus });
    return nextStatus;
  }
};
