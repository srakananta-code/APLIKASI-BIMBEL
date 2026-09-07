import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  query, 
  orderBy 
} from 'firebase/firestore';
import { Student } from '../types';
import { INITIAL_STUDENTS } from '../data/initialData';

const COLLECTION_NAME = 'students';

export const studentService = {
  async getAll(): Promise<Student[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_STUDENTS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    } catch (err) {
      console.warn('Fallback student data:', err);
      return INITIAL_STUDENTS;
    }
  },

  async getById(id: string): Promise<Student | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Student;
      }
      return null;
    } catch (err) {
      console.error('Error fetching student by ID:', err);
      return null;
    }
  },

  async create(studentData: Omit<Student, 'id' | 'registeredAt'> & { id?: string }): Promise<Student> {
    const studentId = studentData.id || `STD-${Date.now().toString().slice(-4)}`;
    const nowIso = new Date().toISOString();
    const newStudent: Student = {
      ...studentData,
      id: studentId,
      studentCode: studentData.studentCode || studentId,
      registeredAt: nowIso.split('T')[0],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, studentId);
      await setDoc(docRef, newStudent);
    } catch (err) {
      console.error('Error creating student in Firestore:', err);
    }

    return newStudent;
  },

  async update(id: string, updates: Partial<Student>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating student in Firestore:', err);
    }
  },

  async toggleStatus(id: string, currentStatus: string): Promise<'AKTIF' | 'NONAKTIF'> {
    const nextStatus = (currentStatus === 'AKTIF' || currentStatus === 'ACTIVE') ? 'NONAKTIF' : 'AKTIF';
    await this.update(id, { status: nextStatus });
    return nextStatus;
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting student in Firestore:', err);
    }
  },

  async createBatch(studentsData: Array<Omit<Student, 'id' | 'registeredAt'> & { id?: string }>): Promise<Student[]> {
    const nowIso = new Date().toISOString();
    const createdStudents: Student[] = [];

    const chunkSize = 400;
    for (let i = 0; i < studentsData.length; i += chunkSize) {
      const chunk = studentsData.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (let j = 0; j < chunk.length; j++) {
        const item = chunk[j];
        const studentId = item.id || `STD-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newStudent: Student = {
          ...item,
          id: studentId,
          studentCode: item.studentCode || studentId,
          registeredAt: nowIso.split('T')[0],
          createdAt: nowIso,
          updatedAt: nowIso
        };
        createdStudents.push(newStudent);
        const docRef = doc(db, COLLECTION_NAME, studentId);
        batch.set(docRef, newStudent);
      }

      try {
        await batch.commit();
      } catch (err) {
        console.error('Error committing student batch to Firestore:', err);
      }
    }

    return createdStudents;
  }
};
