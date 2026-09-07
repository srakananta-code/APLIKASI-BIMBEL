import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { RateHistory, InstitutionSetting } from '../types';
import { INITIAL_RATE_HISTORIES, INITIAL_INSTITUTION_SETTING } from '../data/initialData';

const COLLECTION_NAME = 'rate_histories';

export const rateService = {
  async getAll(): Promise<RateHistory[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('effectiveDate', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return INITIAL_RATE_HISTORIES;
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RateHistory));
    } catch (err) {
      console.warn('Using fallback rate histories:', err);
      return INITIAL_RATE_HISTORIES;
    }
  },

  getActiveStudentRate(dateStr?: string, rateHistories: RateHistory[] = [], defaultRate = 8000): number {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const match = rateHistories.find(r => 
      (r.rateType === 'STUDENT_CHARGE' || r.type === 'STUDENT') &&
      r.effectiveDate <= targetDate &&
      (!r.endDate || r.endDate >= targetDate) &&
      (r.status === 'AKTIF' || r.status === 'ACTIVE' || !r.status)
    );
    if (match) {
      return match.value || match.rate || match.studentRate || defaultRate;
    }
    return defaultRate;
  },

  getActiveTeacherRate(dateStr?: string, rateHistories: RateHistory[] = [], defaultRate = 2000): number {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const match = rateHistories.find(r => 
      (r.rateType === 'TEACHER_HONOR' || r.type === 'TEACHER') &&
      r.effectiveDate <= targetDate &&
      (!r.endDate || r.endDate >= targetDate) &&
      (r.status === 'AKTIF' || r.status === 'ACTIVE' || !r.status)
    );
    if (match) {
      return match.value || match.rate || match.teacherRate || defaultRate;
    }
    return defaultRate;
  }
};
