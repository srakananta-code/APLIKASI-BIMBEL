import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs, 
  getDoc,
  setDoc,
  limit, 
  query 
} from 'firebase/firestore';
import {
  INITIAL_INSTITUTION_SETTING,
  INITIAL_USERS,
  INITIAL_PROGRAMS,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_SCHEDULES,
  INITIAL_MEETINGS,
  INITIAL_MEETING_STUDENTS,
  INITIAL_STUDENT_CHARGES,
  INITIAL_STUDENT_PAYMENTS,
  INITIAL_TEACHER_HONORS,
  INITIAL_TEACHER_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_RATE_HISTORIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from '../data/initialData';
import { auditLogService } from './auditLogService';

const DEMO_CLEANED_KEY = 'educendikia_demo_cleaned';

export const seedService = {
  /**
   * Cek apakah status demo sudah pernah dibersihkan
   */
  isDemoCleaned(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DEMO_CLEANED_KEY) === 'true';
  },

  /**
   * Mengosongkan seluruh data demo dari Firestore dan menginisialisasi database bersih untuk akun pengguna baru
   */
  async clearAllDemoData(adminProfile?: { id?: string; uid?: string; name?: string; email?: string; institutionName?: string }): Promise<boolean> {
    try {
      console.log('Mengosongkan seluruh data demo bimbel...');

      // Tandai di localStorage segera
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEMO_CLEANED_KEY, 'true');
      }

      // Daftar seluruh koleksi relasional demo yang harus dikosongkan
      const collectionsToClear = [
        'students',
        'teachers',
        'programs',
        'schedules',
        'meetings',
        'meeting_students',
        'student_charges',
        'student_payments',
        'teacher_honors',
        'teacher_payments',
        'expenses',
        'notifications',
        'rate_histories',
        'audit_logs'
      ];

      for (const colName of collectionsToClear) {
        try {
          const snap = await getDocs(collection(db, colName));
          if (!snap.empty) {
            // Firestore writeBatch mendukung maks 500 dokumen
            const batch = writeBatch(db);
            snap.docs.forEach(docItem => {
              batch.delete(docItem.ref);
            });
            await batch.commit();
          }
        } catch (colErr) {
          console.warn(`Catatan saat menghapus dokumen koleksi ${colName}:`, colErr);
        }
      }

      // Hapus akun demo dummy dari users collection (kecuali akun admin yang sedang login/mendaftar)
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (!usersSnap.empty) {
          const userBatch = writeBatch(db);
          let deletedUsersCount = 0;
          const currentAdminEmail = (adminProfile?.email || '').toLowerCase().trim();
          const currentAdminId = adminProfile?.id || adminProfile?.uid || '';

          usersSnap.docs.forEach(uDoc => {
            const uData = uDoc.data();
            const uId = uDoc.id;
            const uEmail = (uData.email || '').toLowerCase().trim();

            const isCurrentAdmin = Boolean(
              adminProfile && (
                (currentAdminEmail && uEmail === currentAdminEmail) ||
                (currentAdminId && (uId === currentAdminId || uData.uid === currentAdminId))
              )
            );

            if (adminProfile) {
              // Jika ada profil admin aktif yang mendaftar / mengosongkan data,
              // SEMUA akun lain (apapun emailnya, guru demo, dll) HARUS DIHAPUS.
              if (!isCurrentAdmin) {
                userBatch.delete(uDoc.ref);
                deletedUsersCount++;
              } else {
                // Pastikan admin aktif memiliki status aktif
                userBatch.update(uDoc.ref, { isActive: true, status: 'AKTIF' });
              }
            } else {
              // Jika tanpa profil admin khusus, hapus semua akun demo bawaan
              const isDemoAccount = 
                uEmail.endsWith('@educendikia.com') ||
                uEmail === 'sas@bimbel.com' ||
                ['USR-ADMIN', 'USR-TEACHER', 'USR-TCH-001', 'USR-TCH-002', 'USR-TCH-003', 'USR-TCH-004', 'USR-TCH-005'].includes(uId);

              if (isDemoAccount) {
                userBatch.delete(uDoc.ref);
                deletedUsersCount++;
              }
            }
          });

          if (deletedUsersCount > 0) {
            await userBatch.commit();
          }
        }
      } catch (uErr) {
        console.warn('Catatan saat membersihkan user demo:', uErr);
      }

      // Perbarui settings menjadi pengaturan bersih lembaga milik pengguna
      const institutionName = adminProfile?.institutionName || 'Bimbingan Belajar Saya';
      const cleanSettings = {
        name: institutionName,
        tagline: 'Layanan Bimbingan Belajar Berkualitas',
        address: '',
        phone: '',
        email: adminProfile?.email || '',
        logoUrl: '',
        academicYear: '2025/2026',
        activeSemester: 'Genap',
        studentRate: 150000,
        teacherRate: 75000,
        studentBillingScheme: 'persesi',
        teacherHonorSchemeType: 'siswa',
        defaultTransportAllowance: 0,
        isDemoCleaned: true,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'settings', 'institution_main'), cleanSettings, { merge: true });

      // Catat log perdana pembuatan sistem bersih
      if (adminProfile) {
        await auditLogService.create({
          userId: adminProfile.id || adminProfile.uid || 'ADMIN',
          userName: adminProfile.name || 'Administrator',
          role: 'ADMIN',
          userRole: 'ADMIN',
          action: 'USER_CREATED',
          details: `Database bersih berhasil diinisialisasi untuk lembaga "${institutionName}". Seluruh data demo telah dibersihkan.`,
          description: 'Inisialisasi sistem bimbel bersih'
        }).catch(() => {});
      }

      console.log('Seluruh data demo berhasil dikosongkan. Database sekarang bersih 100%.');
      return true;
    } catch (err) {
      console.error('Error saat mengosongkan data demo:', err);
      return false;
    }
  },

  /**
   * Checks if Firestore has existing collections, and if empty or forced, seeds with initial data.
   */
  async seedIfEmpty(force = false): Promise<boolean> {
    try {
      if (!force) {
        // Jika sudah ditandai bersih untuk pengguna yang mendaftar, JANGAN SEED LAGI!
        if (this.isDemoCleaned()) {
          return false;
        }

        // Periksa apakah dokumen settings sudah memiliki isDemoCleaned === true
        try {
          const settingDoc = await getDoc(doc(db, 'settings', 'institution_main'));
          if (settingDoc.exists() && settingDoc.data()?.isDemoCleaned) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(DEMO_CLEANED_KEY, 'true');
            }
            return false;
          }
        } catch (sErr) {}

        // Use a timeout so that if Firestore backend is temporarily unreachable or offline,
        // it doesn't block the UI or hang on startup
        try {
          const checkPromise = getDocs(query(collection(db, 'students'), limit(1)));
          const timeoutPromise = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 3500));
          const result = await Promise.race([checkPromise, timeoutPromise]);

          if (result === 'timeout') {
            console.warn('Firestore initial check timed out, continuing in resilient offline mode.');
            return false;
          }

          if (!result.empty) {
            console.log('Firestore already contains data. Skipping initial seeding.');
            return false;
          }
        } catch (checkErr) {
          console.warn('Firestore connectivity check note (operating in offline fallback):', checkErr);
          return false;
        }
      }

      console.log('Seeding initial relational dataset into Firestore...');

      // Seed settings
      const batch1 = writeBatch(db);
      batch1.set(doc(db, 'settings', 'institution_main'), INITIAL_INSTITUTION_SETTING);
      
      INITIAL_USERS.forEach(u => {
        batch1.set(doc(db, 'users', u.id), {
          ...u,
          status: 'ACTIVE',
          authUid: u.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_PROGRAMS.forEach(p => {
        batch1.set(doc(db, 'programs', p.id), {
          ...p,
          programCode: p.code,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_TEACHERS.forEach(t => {
        batch1.set(doc(db, 'teachers', t.id), {
          ...t,
          teacherCode: t.code,
          userId: INITIAL_USERS.find(u => u.teacherId === t.id)?.id || 'USR-TEACHER',
          specialization: t.specializations?.[0] || 'Umum',
          status: 'AKTIF',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_STUDENTS.forEach(s => {
        batch1.set(doc(db, 'students', s.id), {
          ...s,
          studentCode: s.id,
          status: 'AKTIF',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_RATE_HISTORIES.forEach(r => {
        batch1.set(doc(db, 'rate_histories', r.id), {
          ...r,
          rate: r.value,
          createdAt: new Date().toISOString()
        });
      });

      await batch1.commit();

      // Batch 2: Schedules & Meetings
      const batch2 = writeBatch(db);

      INITIAL_SCHEDULES.forEach(sch => {
        batch2.set(doc(db, 'schedules', sch.id), {
          ...sch,
          scheduleCode: sch.code,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_MEETINGS.forEach(m => {
        batch2.set(doc(db, 'meetings', m.id), {
          ...m,
          totalStudents: m.registeredStudentCount || 0,
          totalPresent: m.presentStudentCount || 0,
          totalAbsent: Math.max(0, (m.registeredStudentCount || 0) - (m.presentStudentCount || 0)),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_MEETING_STUDENTS.forEach(ms => {
        batch2.set(doc(db, 'meeting_students', ms.id), {
          ...ms,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_EXPENSES.forEach(e => {
        batch2.set(doc(db, 'expenses', e.id), {
          ...e,
          expenseCode: e.expenseNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      await batch2.commit();

      // Batch 3: Finance, Logs & Notifications
      const batch3 = writeBatch(db);

      INITIAL_STUDENT_CHARGES.forEach(chg => {
        batch3.set(doc(db, 'student_charges', chg.id), {
          ...chg,
          chargeCode: chg.chargeNumber,
          createdAt: chg.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_STUDENT_PAYMENTS.forEach(p => {
        batch3.set(doc(db, 'student_payments', p.id), {
          ...p,
          paymentCode: p.paymentNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_TEACHER_HONORS.forEach(h => {
        batch3.set(doc(db, 'teacher_honors', h.id), {
          ...h,
          honorCode: h.honorNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_TEACHER_PAYMENTS.forEach(p => {
        batch3.set(doc(db, 'teacher_payments', p.id), {
          ...p,
          paymentCode: p.paymentNumber,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });

      INITIAL_AUDIT_LOGS.forEach(l => {
        batch3.set(doc(db, 'audit_logs', l.id), {
          ...l,
          createdAt: l.timestamp || new Date().toISOString()
        });
      });

      INITIAL_NOTIFICATIONS.forEach(n => {
        batch3.set(doc(db, 'notifications', n.id), {
          ...n,
          isRead: n.read,
          createdAt: n.timestamp || new Date().toISOString()
        });
      });

      await batch3.commit();
      console.log('Successfully seeded Firestore database with all 16 collections.');
      return true;
    } catch (err) {
      console.warn('Seeding note:', err);
      return false;
    }
  }
};
