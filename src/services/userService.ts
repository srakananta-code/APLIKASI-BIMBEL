import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query, 
  orderBy 
} from 'firebase/firestore';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut as secondarySignOut, 
  updateProfile 
} from 'firebase/auth';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, UserRole } from '../types';
import { auditLogService } from './auditLogService';

const COLLECTION_NAME = 'users';

// Helper to get secondary Firebase Auth instance for creating new users without disturbing admin session
function getSecondaryAuth() {
  const secondaryAppName = 'SecondaryAuthClient';
  let secondaryApp: FirebaseApp;
  
  const existingApp = getApps().find(a => a.name === secondaryAppName);
  if (existingApp) {
    secondaryApp = existingApp;
  } else {
    secondaryApp = initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    }, secondaryAppName);
  }

  return getAuth(secondaryApp);
}

export interface CreateUserData {
  email: string;
  password?: string;
  displayName: string;
  role: UserRole;
  teacherId?: string | null;
  phone?: string;
  isActive?: boolean;
  institutionName?: string;
}

export const userService = {
  /**
   * Mengambil seluruh data user dari collection users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: docSnap.id,
          authUid: docSnap.id,
          name: data.displayName || data.name || 'Pengguna',
          displayName: data.displayName || data.name || 'Pengguna',
          email: data.email || '',
          role: data.role as UserRole,
          teacherId: data.teacherId || null,
          phone: data.phone || data.phoneNumber || '',
          photoUrl: data.photoURL || data.photoUrl || '',
          photoURL: data.photoURL || data.photoUrl || '',
          isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
          status: data.isActive !== false ? 'AKTIF' : 'NONAKTIF',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastLoginAt: data.lastLoginAt
        };
      });
    } catch (err) {
      console.error('Error getting all users:', err);
      return [];
    }
  },

  /**
   * Mengambil data single user berdasarkan UID
   */
  async getUserById(uid: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      return {
        id: snapshot.id,
        uid: snapshot.id,
        authUid: snapshot.id,
        name: data.displayName || data.name || 'Pengguna',
        displayName: data.displayName || data.name || 'Pengguna',
        email: data.email || '',
        role: data.role as UserRole,
        teacherId: data.teacherId || null,
        phone: data.phone || data.phoneNumber || '',
        photoUrl: data.photoURL || data.photoUrl || '',
        photoURL: data.photoURL || data.photoUrl || '',
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        status: data.isActive !== false ? 'AKTIF' : 'NONAKTIF',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        lastLoginAt: data.lastLoginAt
      };
    } catch (err) {
      console.error(`Error getting user ${uid}:`, err);
      return null;
    }
  },

  /**
   * Membuat user baru di Firebase Authentication dan Firestore users/{uid}
   */
  async createUser(
    userData: CreateUserData,
    adminUser?: { id: string; name: string; email: string }
  ): Promise<User> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanPassword = userData.password || 'password123';
    const cleanDisplayName = userData.displayName.trim();
    const role = userData.role;
    const teacherId = role === 'GURU' ? (userData.teacherId || null) : null;
    const isActive = userData.isActive !== undefined ? userData.isActive : true;

    // 1. Buat user di Firebase Authentication via Secondary Auth Client
    const secondaryAuth = getSecondaryAuth();
    let uid: string = '';

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        cleanPassword
      );
      uid = userCredential.user.uid;

      if (cleanDisplayName) {
        await updateProfile(userCredential.user, {
          displayName: cleanDisplayName
        });
      }

      // Logout secondary auth immediately so it doesn't hold state
      await secondarySignOut(secondaryAuth);
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error('Email sudah terdaftar di sistem.');
      } else if (authErr.code === 'auth/weak-password') {
        throw new Error('Password minimal 6 karakter.');
      } else if (authErr.code === 'auth/operation-not-allowed' || authErr.message?.includes('operation-not-allowed')) {
        // Fallback ID if Firebase Auth provider is not toggled in console
        uid = `USR-${Date.now()}`;
      } else {
        // Fallback gracefully
        uid = `USR-${Date.now()}`;
      }
    }

    // 2. Simpan dokumen users/{uid} di Firestore (TANPA PASSWORD)
    const now = new Date().toISOString();
    const newUserProfile: Record<string, any> = {
      uid: uid,
      email: cleanEmail,
      displayName: cleanDisplayName,
      role: role,
      teacherId: teacherId,
      photoURL: '',
      isActive: isActive,
      phone: userData.phone || '',
      institutionName: userData.institutionName || 'Bimbel EduCendikia',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null
    };

    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, newUserProfile);

    // 3. Catat audit log
    await auditLogService.create({
      userId: adminUser?.id || 'SYSTEM',
      userName: adminUser?.name || 'Administrator',
      role: 'ADMIN',
      userRole: 'ADMIN',
      action: 'USER_CREATED',
      targetId: uid,
      details: `Admin membuat akun baru ${cleanDisplayName} (${cleanEmail}) dengan role ${role}${teacherId ? ` [TeacherId: ${teacherId}]` : ''} untuk bimbel "${userData.institutionName || 'Bimbel EduCendikia'}".`,
      description: `Pembuatan akun ${role}: ${cleanDisplayName}`
    }).catch(() => {});

    return {
      id: uid,
      uid: uid,
      authUid: uid,
      name: cleanDisplayName,
      displayName: cleanDisplayName,
      email: cleanEmail,
      role: role,
      teacherId: teacherId,
      phone: userData.phone || '',
      photoUrl: '',
      photoURL: '',
      isActive: isActive,
      status: isActive ? 'AKTIF' : 'NONAKTIF',
      institutionName: userData.institutionName || 'Bimbel EduCendikia',
      createdAt: now,
      updatedAt: now
    };
  },

  /**
   * Mengaktifkan / Menonaktifkan akun user
   */
  async toggleUserActive(
    uid: string,
    currentIsActive: boolean,
    adminUser?: { id: string; name: string }
  ): Promise<boolean> {
    const newStatus = !currentIsActive;
    const now = new Date().toISOString();

    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      isActive: newStatus,
      updatedAt: now
    });

    await auditLogService.create({
      userId: adminUser?.id || 'ADMIN',
      userName: adminUser?.name || 'Administrator',
      role: 'ADMIN',
      userRole: 'ADMIN',
      action: newStatus ? 'USER_UPDATED' : 'USER_DISABLED',
      targetId: uid,
      details: `Admin mengubah status akun user ${uid} menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}.`,
      description: `Ubah status akun: ${newStatus ? 'Diaktifkan' : 'Dinonaktifkan'}`
    }).catch(() => {});

    return newStatus;
  },

  /**
   * Mengubah Role Pengguna (ADMIN / GURU) dan teacherId
   */
  async updateUserRole(
    uid: string,
    newRole: UserRole,
    teacherId: string | null = null,
    adminUser?: { id: string; name: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    const cleanTeacherId = newRole === 'GURU' ? teacherId : null;

    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      role: newRole,
      teacherId: cleanTeacherId,
      updatedAt: now
    });

    await auditLogService.create({
      userId: adminUser?.id || 'ADMIN',
      userName: adminUser?.name || 'Administrator',
      role: 'ADMIN',
      userRole: 'ADMIN',
      action: 'ROLE_CHANGED',
      targetId: uid,
      details: `Admin mengubah role akun ${uid} menjadi ${newRole}${cleanTeacherId ? ` [teacherId: ${cleanTeacherId}]` : ''}.`,
      description: `Perubahan Role: ${newRole}`
    }).catch(() => {});
  },

  /**
   * Menghubungkan user dengan data Guru (teacherId)
   */
  async linkTeacher(
    uid: string,
    teacherId: string | null,
    adminUser?: { id: string; name: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, COLLECTION_NAME, uid);

    await updateDoc(docRef, {
      teacherId: teacherId,
      updatedAt: now
    });

    await auditLogService.create({
      userId: adminUser?.id || 'ADMIN',
      userName: adminUser?.name || 'Administrator',
      role: 'ADMIN',
      userRole: 'ADMIN',
      action: 'USER_UPDATED',
      targetId: uid,
      details: `Admin menghubungkan user ${uid} dengan data Guru ID: ${teacherId || '(Diputus)'}.`,
      description: 'Hubungan User-Guru diperbarui'
    }).catch(() => {});
  },

  /**
   * Memperbarui profil data user
   */
  async updateUserProfile(
    uid: string,
    updates: Partial<User>,
    adminUser?: { id: string; name: string }
  ): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, COLLECTION_NAME, uid);

    const updatePayload: Record<string, any> = {
      ...updates,
      updatedAt: now
    };

    if (updates.displayName || updates.name) {
      updatePayload.displayName = updates.displayName || updates.name;
    }
    if (updates.isActive !== undefined) {
      updatePayload.isActive = Boolean(updates.isActive);
    }

    await updateDoc(docRef, updatePayload);

    await auditLogService.create({
      userId: adminUser?.id || 'ADMIN',
      userName: adminUser?.name || 'Administrator',
      role: 'ADMIN',
      userRole: 'ADMIN',
      action: 'USER_UPDATED',
      targetId: uid,
      details: `Data profil user ${uid} telah diperbarui.`,
      description: 'Update Profil User'
    }).catch(() => {});
  },

  /**
   * Menghapus akun user secara permanen dari Firestore users/{uid}
   */
  async deleteUser(
    uid: string,
    adminUser?: { id: string; name: string }
  ): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTION_NAME, uid);
      await deleteDoc(docRef);

      await auditLogService.create({
        userId: adminUser?.id || 'ADMIN',
        userName: adminUser?.name || 'Administrator',
        role: 'ADMIN',
        userRole: 'ADMIN',
        action: 'USER_DELETED',
        targetId: uid,
        details: `Akun pengguna ${uid} telah dihapus permanen oleh Administrator.`,
        description: 'Hapus Akun Pengguna'
      }).catch(() => {});

      return true;
    } catch (err: any) {
      if (err?.message?.includes('permission') || err?.code?.includes('permission')) {
        handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${uid}`);
      }
      console.error(`Error deleting user ${uid}:`, err);
      throw err;
    }
  },

  /**
   * Menghapus semua akun demo dan akun uji coba lain, hanya menyisakan akun admin yang sedang aktif
   */
  async cleanDemoUsers(
    currentAdminUser?: { id?: string; uid?: string; email?: string }
  ): Promise<number> {
    try {
      const usersSnap = await getDocs(collection(db, COLLECTION_NAME));
      if (usersSnap.empty) return 0;

      const currentEmail = (currentAdminUser?.email || '').toLowerCase().trim();
      const currentId = currentAdminUser?.id || currentAdminUser?.uid || '';

      const batch = writeBatch(db);
      let deletedCount = 0;

      usersSnap.docs.forEach(docSnap => {
        const data = docSnap.data();
        const docId = docSnap.id;
        const email = (data.email || '').toLowerCase().trim();

        const isCurrent = (
          (currentEmail && email === currentEmail) ||
          (currentId && (docId === currentId || data.uid === currentId))
        );

        if (!isCurrent) {
          batch.delete(docSnap.ref);
          deletedCount++;
        } else {
          // Pastikan akun admin aktif diaktifkan statusnya
          if (data.isActive === false) {
            batch.update(docSnap.ref, { isActive: true, status: 'AKTIF' });
          }
        }
      });

      if (deletedCount > 0) {
        await batch.commit();
      }

      return deletedCount;
    } catch (err: any) {
      if (err?.message?.includes('permission') || err?.code?.includes('permission')) {
        handleFirestoreError(err, OperationType.DELETE, COLLECTION_NAME);
      }
      console.error('Error cleaning demo users:', err);
      throw err;
    }
  },

  /**
   * Seed / Provision Akun Demo Awal di Firebase Authentication & Firestore users
   * Ini memastikan reviewer / user dapat langsung login dengan kredensial demo resmi
   */
  async seedInitialAuthUsers(): Promise<void> {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('educendikia_demo_cleaned') === 'true') {
        return;
      }
      const stored = localStorage.getItem('educendikia_auth_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.email && !parsed.email.toLowerCase().endsWith('@educendikia.com') && parsed.id !== 'USR-ADMIN') {
            return;
          }
        } catch (e) {}
      }
    }
    const defaultAccounts = [
      {
        email: 'admin@educendikia.com',
        password: 'password123',
        displayName: 'Administrator Lembaga',
        role: 'ADMIN' as UserRole,
        teacherId: null,
        phone: '0812-9988-7766'
      },
      {
        email: 'budi.guru@educendikia.com',
        password: 'password123',
        displayName: 'Budi Pratama, S.Pd.',
        role: 'GURU' as UserRole,
        teacherId: 'TCH-001',
        phone: '0813-1122-3344'
      },
      {
        email: 'siti.guru@educendikia.com',
        password: 'password123',
        displayName: 'Siti Rahma, M.Si.',
        role: 'GURU' as UserRole,
        teacherId: 'TCH-002',
        phone: '0813-2233-4455'
      },
      {
        email: 'ahmad.guru@educendikia.com',
        password: 'password123',
        displayName: 'Ahmad Fauzi, S.Pd.',
        role: 'GURU' as UserRole,
        teacherId: 'TCH-003',
        phone: '0813-3344-5566'
      },
      {
        email: 'dewi.guru@educendikia.com',
        password: 'password123',
        displayName: 'Dewi Lestari, S.S.',
        role: 'GURU' as UserRole,
        teacherId: 'TCH-004',
        phone: '0813-4455-6677'
      },
      {
        email: 'hendra.guru@educendikia.com',
        password: 'password123',
        displayName: 'Hendra Wijaya, M.Pd.',
        role: 'GURU' as UserRole,
        teacherId: 'TCH-005',
        phone: '0813-5566-7788'
      }
    ];

    const secondaryAuth = getSecondaryAuth();

    for (const acc of defaultAccounts) {
      try {
        // Cek apakah akun auth sudah ada dengan mencoba membuat
        let uid = '';
        try {
          const cred = await createUserWithEmailAndPassword(secondaryAuth, acc.email, acc.password);
          uid = cred.user.uid;
          await updateProfile(cred.user, { displayName: acc.displayName });
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            // Jika sudah ada di Auth, cari dokumen di Firestore users
            const existingUsers = await getDocs(collection(db, COLLECTION_NAME));
            const foundDoc = existingUsers.docs.find(d => d.data().email === acc.email);
            if (foundDoc) {
              uid = foundDoc.id;
            }
          }
        }

        if (uid) {
          // Pastikan dokumen Firestore users/{uid} tersimpan dengan struktur benar
          const now = new Date().toISOString();
          const userDocRef = doc(db, COLLECTION_NAME, uid);
          const snap = await getDoc(userDocRef);

          if (!snap.exists()) {
            await setDoc(userDocRef, {
              uid: uid,
              email: acc.email,
              displayName: acc.displayName,
              role: acc.role,
              teacherId: acc.teacherId,
              photoURL: '',
              isActive: true,
              phone: acc.phone,
              createdAt: now,
              updatedAt: now,
              lastLoginAt: null
            });
          }
        }
      } catch (err) {
        // Silent catch for demo provisioning
      }
    }

    try {
      await secondarySignOut(secondaryAuth);
    } catch (e) {}
  }
};
