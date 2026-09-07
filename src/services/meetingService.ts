import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { Meeting } from '../types';
import { INITIAL_MEETINGS } from '../data/initialData';

const COLLECTION_NAME = 'meetings';

export const meetingService = {
  async getAll(): Promise<Meeting[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_MEETINGS;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting));
    } catch (err) {
      console.warn('Fallback meeting data:', err);
      return INITIAL_MEETINGS;
    }
  },

  async getById(id: string): Promise<Meeting | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Meeting;
      }
      return null;
    } catch (err) {
      console.error('Error fetching meeting by ID:', err);
      return null;
    }
  },

  async create(meetingData: Omit<Meeting, 'id' | 'meetingCode' | 'presentStudentCount'> & { id?: string; meetingCode?: string }): Promise<Meeting> {
    const count = Date.now().toString().slice(-4);
    const dateFormatted = meetingData.date.replace(/-/g, '').substring(4);
    const meetingCode = meetingData.meetingCode || `MTG-${dateFormatted}-${count.slice(-2)}`;
    const newId = meetingData.id || `MTG-${meetingData.date}-${count}`;
    const nowIso = new Date().toISOString();

    const newMeeting: Meeting = {
      ...meetingData,
      id: newId,
      meetingCode,
      registeredStudentCount: meetingData.registeredStudentCount || 0,
      presentStudentCount: 0,
      totalStudents: meetingData.registeredStudentCount || 0,
      totalPresent: 0,
      totalAbsent: 0,
      status: meetingData.status || 'TERJADWAL',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, newId);
      await setDoc(docRef, newMeeting);
    } catch (err) {
      console.error('Error creating meeting in Firestore:', err);
    }

    return newMeeting;
  },

  async update(id: string, updates: Partial<Meeting>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating meeting in Firestore:', err);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Error deleting meeting in Firestore:', err);
    }
  }
};
