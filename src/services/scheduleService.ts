import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  query 
} from 'firebase/firestore';
import { Schedule } from '../types';
import { INITIAL_SCHEDULES } from '../data/initialData';

const COLLECTION_NAME = 'schedules';

export const scheduleService = {
  async getAll(): Promise<Schedule[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_SCHEDULES;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule));
    } catch (err) {
      console.warn('Fallback schedule data:', err);
      return INITIAL_SCHEDULES;
    }
  },

  async create(scheduleData: Omit<Schedule, 'id' | 'code'> & { id?: string; code?: string }): Promise<Schedule> {
    const scheduleId = scheduleData.id || `SCH-${Date.now().toString().slice(-4)}`;
    const scheduleCode = scheduleData.code || scheduleData.scheduleCode || `JAD-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();

    const newSchedule: Schedule = {
      ...scheduleData,
      id: scheduleId,
      code: scheduleCode,
      scheduleCode,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, scheduleId);
      await setDoc(docRef, newSchedule);
    } catch (err) {
      console.error('Error creating schedule in Firestore:', err);
    }

    return newSchedule;
  },

  async update(id: string, updates: Partial<Schedule>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating schedule in Firestore:', err);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting schedule in Firestore:', err);
    }
  },

  async toggleStatus(id: string, currentStatus: string): Promise<'AKTIF' | 'NONAKTIF'> {
    const nextStatus = (currentStatus === 'AKTIF' || currentStatus === 'ACTIVE') ? 'NONAKTIF' : 'AKTIF';
    await this.update(id, { status: nextStatus });
    return nextStatus;
  }
};
