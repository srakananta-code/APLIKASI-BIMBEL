import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { InstitutionSetting } from '../types';
import { INITIAL_INSTITUTION_SETTING } from '../data/initialData';

const SETTING_DOC_ID = 'institution_main';

export const settingsService = {
  async getSettings(): Promise<InstitutionSetting> {
    try {
      const docRef = doc(db, 'settings', SETTING_DOC_ID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...INITIAL_INSTITUTION_SETTING, ...docSnap.data() } as InstitutionSetting;
      }
      return INITIAL_INSTITUTION_SETTING;
    } catch (err) {
      console.warn('Fallback settings:', err);
      return INITIAL_INSTITUTION_SETTING;
    }
  },

  async updateSettings(settings: Partial<InstitutionSetting>): Promise<void> {
    try {
      const docRef = doc(db, 'settings', SETTING_DOC_ID);
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating settings in Firestore:', err);
      throw err;
    }
  }
};
