import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { AuditLog, UserRole } from '../types';
import { INITIAL_AUDIT_LOGS } from '../data/initialData';

const COLLECTION_NAME = 'audit_logs';
const LOCAL_AUDIT_LOGS_KEY = 'educendikia_local_audit_logs';

export const auditLogService = {
  getLocalLogs(): AuditLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLocalLog(log: AuditLog): void {
    if (typeof window === 'undefined') return;
    try {
      const logs = this.getLocalLogs();
      logs.unshift(log);
      // Keep up to 100 recent local logs
      localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
    } catch {
      // Non-blocking
    }
  },

  async getAll(): Promise<AuditLog[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        const localLogs = this.getLocalLogs();
        return localLogs.length > 0 ? [...localLogs, ...INITIAL_AUDIT_LOGS] : INITIAL_AUDIT_LOGS;
      }
      const remoteLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      return remoteLogs.sort((a, b) => new Date(b.timestamp || b.createdAt || 0).getTime() - new Date(a.timestamp || a.createdAt || 0).getTime());
    } catch (err) {
      console.warn('Fallback audit logs:', err);
      const localLogs = this.getLocalLogs();
      return localLogs.length > 0 ? [...localLogs, ...INITIAL_AUDIT_LOGS] : INITIAL_AUDIT_LOGS;
    }
  },

  async create(log: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): Promise<AuditLog> {
    const id = log.id || `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = log.timestamp || new Date().toISOString();
    const newLog: AuditLog = {
      ...log,
      id,
      timestamp,
      createdAt: timestamp
    };

    // Save to local cache first
    this.saveLocalLog(newLog);

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, newLog);
    } catch (err) {
      console.warn('Notice saving audit log to Firestore:', err);
    }

    return newLog;
  }
};
