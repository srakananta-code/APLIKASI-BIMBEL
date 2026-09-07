import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';
import { TeacherHonor } from '../types';
import { INITIAL_TEACHER_HONORS } from '../data/initialData';

const COLLECTION_NAME = 'teacher_honors';

export const teacherHonorService = {
  async getAll(): Promise<TeacherHonor[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_TEACHER_HONORS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherHonor));
    } catch (err) {
      console.warn('Fallback teacher honors:', err);
      return INITIAL_TEACHER_HONORS;
    }
  },

  async getByTeacher(teacherId: string): Promise<TeacherHonor[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where('teacherId', '==', teacherId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeacherHonor));
    } catch (err) {
      console.error('Error fetching honors by teacher:', err);
      return [];
    }
  },

  async save(honor: TeacherHonor): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, honor.id);
      await setDoc(docRef, {
        ...honor,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error saving teacher honor in Firestore:', err);
    }
  }
};
