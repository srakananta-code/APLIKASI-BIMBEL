import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  query 
} from 'firebase/firestore';
import { Teacher } from '../types';
import { INITIAL_TEACHERS } from '../data/initialData';

const COLLECTION_NAME = 'teachers';

export const teacherService = {
  async getAll(): Promise<Teacher[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_TEACHERS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
    } catch (err) {
      console.warn('Fallback teacher data:', err);
      return INITIAL_TEACHERS;
    }
  },

  async getById(id: string): Promise<Teacher | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Teacher;
      }
      return null;
    } catch (err) {
      console.error('Error fetching teacher by ID:', err);
      return null;
    }
  },

  async create(teacherData: Omit<Teacher, 'id' | 'joinedAt'> & { id?: string }): Promise<Teacher> {
    const teacherId = teacherData.id || `TCH-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const newTeacher: Teacher = {
      ...teacherData,
      id: teacherId,
      code: teacherData.code || teacherId,
      teacherCode: teacherData.teacherCode || teacherData.code || teacherId,
      specializations: teacherData.specializations || teacherData.specialtyPrograms || ['Umum'],
      joinedAt: nowIso.split('T')[0],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, teacherId);
      await setDoc(docRef, newTeacher);
    } catch (err) {
      console.error('Error creating teacher in Firestore:', err);
    }

    return newTeacher;
  },

  async update(id: string, updates: Partial<Teacher>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating teacher in Firestore:', err);
    }
  },

  async toggleStatus(id: string, currentStatus: string): Promise<'AKTIF' | 'NONAKTIF'> {
    const nextStatus = (currentStatus === 'AKTIF' || currentStatus === 'ACTIVE') ? 'NONAKTIF' : 'AKTIF';
    await this.update(id, { status: nextStatus });
    return nextStatus;
  }
};
