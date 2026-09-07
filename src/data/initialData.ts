import {
  Student,
  Teacher,
  Program,
  Schedule,
  Meeting,
  MeetingStudent,
  StudentCharge,
  StudentPayment,
  TeacherHonor,
  TeacherPayment,
  Expense,
  InstitutionSetting,
  RateHistory,
  AuditLog,
  SystemNotification,
  User
} from '../types';

export const INITIAL_INSTITUTION_SETTING: InstitutionSetting = {
  name: 'Bimbingan Belajar EduCendikia',
  tagline: 'Solusi Terpercaya Meraih Prestasi Akademik & Sukses Ujian',
  address: 'Jl. Pemuda No. 45, Kompleks Ruko Pelajar, Jakarta Selatan',
  phone: '0812-3456-7890',
  email: 'info@educendikia.com',
  website: 'https://educendikia.id',
  studentRate: 8000,
  studentBillingScheme: 'persesi',
  teacherRate: 2000,
  teacherHonorSchemeType: 'siswa',
  defaultTransportAllowance: 0,
  bankName: 'Bank Central Asia (BCA)',
  bankAccountNumber: '8735-0921-88',
  bankAccountHolder: 'Yayasan EduCendikia Utama',
  qrisInfo: 'QRIS Rekening Resmi EduCendikia (NMID: ID1020039485)',
  billingDueDay: 10,
  billingInstructions: 'Pembayaran tagihan les paling lambat tanggal 10 setiap bulan. Mohon cantumkan Nama & NIS Siswa pada berita transfer.',
  principalName: 'Drs. H. Mulyadi, M.Pd.',
  principalNip: 'NIP. 19780412 200312 1 004',
  bimbelPreset: 'REGULER',
  academicYear: '2026/2027',
  currency: 'IDR',
  notificationSettings: {
    enableTeacherScheduleReminder: true,
    enableReceivableReminder: true,
    enableHonorReminder: true,
    enablePaymentNotification: true,
    enableAttendanceNotification: true,
    enableUpcomingMeetingReminder: true
  }
};

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-ADMIN',
    name: 'Administrator Lembaga',
    email: 'admin@educendikia.com',
    role: 'ADMIN',
    phoneNumber: '0812-9988-7766',
    isActive: true
  },
  {
    id: 'USR-BUDI',
    name: 'Budi Pratama, S.Pd.',
    email: 'budi.guru@educendikia.com',
    role: 'GURU',
    teacherId: 'TCH-001',
    phoneNumber: '0813-1122-3344',
    isActive: true
  },
  {
    id: 'USR-SITI',
    name: 'Siti Rahma, M.Si.',
    email: 'siti.guru@educendikia.com',
    role: 'GURU',
    teacherId: 'TCH-002',
    phoneNumber: '0813-2233-4455',
    isActive: true
  },
  {
    id: 'USR-AHMAD',
    name: 'Ahmad Fauzi, S.Pd.',
    email: 'ahmad.guru@educendikia.com',
    role: 'GURU',
    teacherId: 'TCH-003',
    phoneNumber: '0813-3344-5566',
    isActive: true
  },
  {
    id: 'USR-DEWI',
    name: 'Dewi Lestari, S.S.',
    email: 'dewi.guru@educendikia.com',
    role: 'GURU',
    teacherId: 'TCH-004',
    phoneNumber: '0813-4455-6677',
    isActive: true
  },
  {
    id: 'USR-HENDRA',
    name: 'Hendra Wijaya, M.Pd.',
    email: 'hendra.guru@educendikia.com',
    role: 'GURU',
    teacherId: 'TCH-005',
    phoneNumber: '0813-5566-7788',
    isActive: true
  }
];

export const INITIAL_PROGRAMS: Program[] = [
  {
    id: 'PRG-001',
    name: 'Matematika Terpadu',
    code: 'MTK-01',
    description: 'Bimbingan matematika logika, aljabar, dan pemecahan masalah cepat.',
    category: 'SMP',
    classType: 'REGULER',
    studentRate: 8000,
    teacherHonorRate: 2000,
    sessionDurationMinutes: 60,
    maxStudents: 15,
    status: 'AKTIF'
  },
  {
    id: 'PRG-002',
    name: 'IPA Terpadu & Eksperimen',
    code: 'IPA-01',
    description: 'Konsep dasar fisika dan biologi dengan metode visual dan aplikatif.',
    category: 'SMP',
    classType: 'REGULER',
    studentRate: 8000,
    teacherHonorRate: 2000,
    sessionDurationMinutes: 60,
    maxStudents: 15,
    status: 'AKTIF'
  },
  {
    id: 'PRG-003',
    name: 'Bahasa Inggris Communicative',
    code: 'BIG-01',
    description: 'Grammar, vocabulary, active reading, dan speaking practice.',
    category: 'SMP',
    classType: 'REGULER',
    studentRate: 8000,
    teacherHonorRate: 2000,
    sessionDurationMinutes: 60,
    maxStudents: 15,
    status: 'AKTIF'
  },
  {
    id: 'PRG-004',
    name: 'Bahasa Indonesia & Literasi',
    code: 'BIN-01',
    description: 'Pemahaman teks, ejaan yang disempurnakan, dan penulisan paragraf.',
    category: 'SD',
    classType: 'REGULER',
    studentRate: 8000,
    teacherHonorRate: 2000,
    sessionDurationMinutes: 60,
    maxStudents: 15,
    status: 'AKTIF'
  },
  {
    id: 'PRG-005',
    name: 'Persiapan Ujian & Sukses Tes (Intensif UTBK)',
    code: 'TPU-01',
    description: 'Bedah soal intensif, bank soal prediksi, TPS/TKA, dan tryout berkala.',
    category: 'SMA',
    classType: 'INTENSIF_UTBK',
    studentRate: 25000,
    teacherHonorRate: 10000,
    sessionDurationMinutes: 90,
    maxStudents: 12,
    status: 'AKTIF'
  },
  {
    id: 'PRG-006',
    name: 'Les Privat Intensif (1-on-1)',
    code: 'PRV-01',
    description: 'Pendampingan 1-on-1 eksklusif guru datang ke rumah dengan kurikulum kustom.',
    category: 'UMUM',
    classType: 'PRIVAT',
    studentRate: 65000,
    teacherHonorRate: 40000,
    transportAllowance: 10000,
    sessionDurationMinutes: 90,
    maxStudents: 1,
    status: 'AKTIF'
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'TCH-001',
    code: 'KDG-001',
    name: 'Budi Pratama, S.Pd.',
    phone: '0813-1122-3344',
    email: 'budi.guru@educendikia.com',
    specialtyPrograms: ['PRG-001', 'PRG-005'],
    specializations: ['Matematika SD', 'Matematika SMP', 'Olimpiade Sains'],
    status: 'AKTIF',
    joinedAt: '2025-01-15',
    bankAccount: {
      bankName: 'BCA',
      accountNumber: '8830192831',
      accountHolder: 'Budi Pratama'
    }
  },
  {
    id: 'TCH-002',
    code: 'KDG-002',
    name: 'Siti Rahma, M.Si.',
    phone: '0813-2233-4455',
    email: 'siti.guru@educendikia.com',
    specialtyPrograms: ['PRG-002'],
    specializations: ['IPA Terpadu SMP', 'Fisika Dasar'],
    status: 'AKTIF',
    joinedAt: '2025-02-01',
    bankAccount: {
      bankName: 'Mandiri',
      accountNumber: '1370019283741',
      accountHolder: 'Siti Rahma'
    }
  },
  {
    id: 'TCH-003',
    code: 'KDG-003',
    name: 'Ahmad Fauzi, S.Pd.',
    phone: '0813-3344-5566',
    email: 'ahmad.guru@educendikia.com',
    specialtyPrograms: ['PRG-003'],
    specializations: ['Bahasa Indonesia', 'Literasi & Menulis'],
    status: 'AKTIF',
    joinedAt: '2025-03-10',
    bankAccount: {
      bankName: 'BRI',
      accountNumber: '020601092837502',
      accountHolder: 'Ahmad Fauzi'
    }
  },
  {
    id: 'TCH-004',
    code: 'KDG-004',
    name: 'Dewi Lestari, S.S.',
    phone: '0813-4455-6677',
    email: 'dewi.guru@educendikia.com',
    specialtyPrograms: ['PRG-004'],
    specializations: ['Bahasa Inggris SD/SMP', 'Conversation'],
    status: 'AKTIF',
    joinedAt: '2025-04-05',
    bankAccount: {
      bankName: 'BNI',
      accountNumber: '0981726354',
      accountHolder: 'Dewi Lestari'
    }
  },
  {
    id: 'TCH-005',
    code: 'KDG-005',
    name: 'Hendra Wijaya, M.Pd.',
    phone: '0813-5566-7788',
    email: 'hendra.guru@educendikia.com',
    specialtyPrograms: ['PRG-005', 'PRG-006'],
    specializations: ['Matematika SMA', 'Fisika SMA', 'UTBK/SNBT'],
    status: 'AKTIF',
    joinedAt: '2025-05-12',
    bankAccount: {
      bankName: 'BSI',
      accountNumber: '7192837465',
      accountHolder: 'Hendra Wijaya'
    }
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'STD-001',
    nis: 'NIS-2026-001',
    name: 'Andi Saputra',
    grade: 'Kelas 8 SMP',
    programIds: ['PRG-001', 'PRG-002'],
    parentName: 'Rudi Saputra',
    parentPhone: '0812-8877-6655',
    studentPhone: '0857-1122-3344',
    address: 'Jl. Melati No. 12, Kebayoran Baru',
    status: 'AKTIF',
    registeredAt: '2026-01-10'
  },
  {
    id: 'STD-002',
    nis: 'NIS-2026-002',
    name: 'Budi Santoso',
    grade: 'Kelas 8 SMP',
    programIds: ['PRG-001', 'PRG-003'],
    parentName: 'Bambang Santoso',
    parentPhone: '0812-7766-5544',
    studentPhone: '0857-2233-4455',
    address: 'Jl. Mawar No. 4, Tebet',
    status: 'AKTIF',
    registeredAt: '2026-01-12'
  },
  {
    id: 'STD-003',
    nis: 'NIS-2026-003',
    name: 'Citra Dewi',
    grade: 'Kelas 8 SMP',
    programIds: ['PRG-001', 'PRG-004'],
    parentName: 'Wawan Gunawan',
    parentPhone: '0812-6655-4433',
    studentPhone: '0857-3344-5566',
    address: 'Jl. Cempaka No. 8, Cilandak',
    status: 'AKTIF',
    registeredAt: '2026-01-15'
  },
  {
    id: 'STD-004',
    nis: 'NIS-2026-004',
    name: 'Deni Pratama',
    grade: 'Kelas 8 SMP',
    programIds: ['PRG-001', 'PRG-002', 'PRG-003'],
    parentName: 'Surya Pratama',
    parentPhone: '0812-5544-3322',
    studentPhone: '0857-4455-6677',
    address: 'Jl. Kenanga No. 19, Pancoran',
    status: 'AKTIF',
    registeredAt: '2026-01-20'
  },
  {
    id: 'STD-005',
    nis: 'NIS-2026-005',
    name: 'Eko Kurniawan',
    grade: 'Kelas 8 SMP',
    programIds: ['PRG-001', 'PRG-005'],
    parentName: 'Haryanto Kurniawan',
    parentPhone: '0812-4433-2211',
    studentPhone: '0857-5566-7788',
    address: 'Jl. Anggrek No. 22, Pasar Minggu',
    status: 'AKTIF',
    registeredAt: '2026-01-22'
  },
  {
    id: 'STD-006',
    nis: 'NIS-2026-006',
    name: 'Farhan Ali',
    grade: 'Kelas 9 SMP',
    programIds: ['PRG-002', 'PRG-005'],
    parentName: 'Ali Hasan',
    parentPhone: '0812-3322-1100',
    studentPhone: '0857-6677-8899',
    address: 'Jl. Dahlia No. 15, Kalibata',
    status: 'AKTIF',
    registeredAt: '2026-02-01'
  },
  {
    id: 'STD-007',
    nis: 'NIS-2026-007',
    name: 'Gita Safitri',
    grade: 'Kelas 9 SMP',
    programIds: ['PRG-003', 'PRG-004'],
    parentName: 'Agus Salim',
    parentPhone: '0812-2211-0099',
    studentPhone: '0857-7788-9900',
    address: 'Jl. Flamboyan No. 7, Jagakarsa',
    status: 'AKTIF',
    registeredAt: '2026-02-05'
  },
  {
    id: 'STD-008',
    nis: 'NIS-2026-008',
    name: 'Hani Indah',
    grade: 'Kelas 6 SD',
    programIds: ['PRG-004', 'PRG-006'],
    parentName: 'Indra Kusuma',
    parentPhone: '0812-1100-9988',
    studentPhone: '0857-8899-0011',
    address: 'Jl. Teratai No. 31, Pejaten',
    status: 'AKTIF',
    registeredAt: '2026-02-10'
  },
  {
    id: 'STD-009',
    nis: 'NIS-2026-009',
    name: 'Ivan Putra',
    grade: 'Kelas 12 SMA',
    programIds: ['PRG-005', 'PRG-006'],
    parentName: 'Gunawan Putra',
    parentPhone: '0812-0099-8877',
    studentPhone: '0857-9900-1122',
    address: 'Jl. Bougenville No. 9, Gandaria',
    status: 'AKTIF',
    registeredAt: '2026-02-15'
  },
  {
    id: 'STD-010',
    nis: 'NIS-2026-010',
    name: 'Joko Widodo Jr.',
    grade: 'Kelas 8 SMP',
    programIds: ['PRG-001', 'PRG-002'],
    parentName: 'Widodo M.',
    parentPhone: '0812-9988-1122',
    studentPhone: '0857-0011-2233',
    address: 'Jl. Sakura No. 14, Fatmawati',
    status: 'AKTIF',
    registeredAt: '2026-02-20'
  },
  {
    id: 'STD-011',
    nis: 'NIS-2026-011',
    name: 'Kevin Sanjaya',
    grade: 'Kelas 9 SMP',
    programIds: ['PRG-001', 'PRG-003', 'PRG-005'],
    parentName: 'Sanjaya L.',
    parentPhone: '0813-8877-2233',
    studentPhone: '0858-1122-3344',
    address: 'Jl. Tulip No. 5, Pondok Indah',
    status: 'AKTIF',
    registeredAt: '2026-03-01'
  },
  {
    id: 'STD-012',
    nis: 'NIS-2026-012',
    name: 'Laila Sari',
    grade: 'Kelas 6 SD',
    programIds: ['PRG-004'],
    parentName: 'Rahmat Hidayat',
    parentPhone: '0813-7766-3344',
    studentPhone: '0858-2233-4455',
    address: 'Jl. Melur No. 17, Kemang',
    status: 'AKTIF',
    registeredAt: '2026-03-05'
  }
];

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'SCH-001',
    code: 'JAD-MTK-01',
    teacherId: 'TCH-001', // Budi Pratama
    programId: 'PRG-001', // Matematika
    dayOfWeek: 'Senin',
    startTime: '15:00',
    endTime: '16:00',
    room: 'Ruang A1 - Newton',
    studentIds: ['STD-001', 'STD-002', 'STD-003', 'STD-004', 'STD-005'],
    status: 'AKTIF',
    notes: 'Kelas Reguler Matematika SMP Kelas 8'
  },
  {
    id: 'SCH-002',
    code: 'JAD-MTK-02',
    teacherId: 'TCH-001', // Budi Pratama
    programId: 'PRG-001', // Matematika
    dayOfWeek: 'Rabu',
    startTime: '15:00',
    endTime: '16:00',
    room: 'Ruang A1 - Newton',
    studentIds: ['STD-001', 'STD-002', 'STD-003', 'STD-004', 'STD-005'],
    status: 'AKTIF',
    notes: 'Kelas Reguler Matematika SMP Kelas 8 sesi lanjutan'
  },
  {
    id: 'SCH-003',
    code: 'JAD-IPA-01',
    teacherId: 'TCH-002', // Siti Rahma
    programId: 'PRG-002', // IPA Terpadu
    dayOfWeek: 'Selasa',
    startTime: '15:00',
    endTime: '16:00',
    room: 'Ruang B1 - Einstein',
    studentIds: ['STD-001', 'STD-004', 'STD-006', 'STD-010'],
    status: 'AKTIF',
    notes: 'Praktikum & Teori IPA Terpadu'
  },
  {
    id: 'SCH-004',
    code: 'JAD-IPA-02',
    teacherId: 'TCH-002', // Siti Rahma
    programId: 'PRG-002', // IPA Terpadu
    dayOfWeek: 'Kamis',
    startTime: '15:00',
    endTime: '16:00',
    room: 'Ruang B1 - Einstein',
    studentIds: ['STD-001', 'STD-004', 'STD-006', 'STD-010'],
    status: 'AKTIF',
    notes: 'Pembahasan Soal IPA Terpadu'
  },
  {
    id: 'SCH-005',
    code: 'JAD-BIG-01',
    teacherId: 'TCH-003', // Ahmad Fauzi
    programId: 'PRG-003', // Bahasa Inggris
    dayOfWeek: 'Senin',
    startTime: '16:30',
    endTime: '17:30',
    room: 'Ruang C1 - Shakespeare',
    studentIds: ['STD-002', 'STD-004', 'STD-007', 'STD-011'],
    status: 'AKTIF',
    notes: 'English Grammar & Conversation'
  },
  {
    id: 'SCH-006',
    code: 'JAD-BIG-02',
    teacherId: 'TCH-003', // Ahmad Fauzi
    programId: 'PRG-003', // Bahasa Inggris
    dayOfWeek: 'Jumat',
    startTime: '15:00',
    endTime: '16:00',
    room: 'Ruang C1 - Shakespeare',
    studentIds: ['STD-002', 'STD-004', 'STD-007', 'STD-011'],
    status: 'AKTIF',
    notes: 'English Reading & Writing Practice'
  },
  {
    id: 'SCH-007',
    code: 'JAD-BIN-01',
    teacherId: 'TCH-004', // Dewi Lestari
    programId: 'PRG-004', // Bahasa Indonesia
    dayOfWeek: 'Rabu',
    startTime: '16:30',
    endTime: '17:30',
    room: 'Ruang D1 - Chairil Anwar',
    studentIds: ['STD-003', 'STD-007', 'STD-008', 'STD-012'],
    status: 'AKTIF',
    notes: 'Pemantapan Bahasa Indonesia & Literasi'
  },
  {
    id: 'SCH-008',
    code: 'JAD-TPU-01',
    teacherId: 'TCH-005', // Hendra Wijaya
    programId: 'PRG-005', // Persiapan Ujian
    dayOfWeek: 'Sabtu',
    startTime: '09:00',
    endTime: '11:00',
    room: 'Ruang Aula Utama',
    studentIds: ['STD-005', 'STD-006', 'STD-009', 'STD-011'],
    status: 'AKTIF',
    notes: 'Drilling Soal dan Simulasi Ujian Nasional / UTBK'
  },
  {
    id: 'SCH-009',
    code: 'JAD-PRV-01',
    teacherId: 'TCH-005', // Hendra Wijaya
    programId: 'PRG-006', // Les Privat Intensif
    dayOfWeek: 'Sabtu',
    startTime: '13:00',
    endTime: '14:30',
    room: 'Ruang Privat 1',
    studentIds: ['STD-008', 'STD-009'],
    status: 'AKTIF',
    notes: 'Privat Mentoring Intensif'
  },
  {
    id: 'SCH-010',
    code: 'JAD-MTK-03',
    teacherId: 'TCH-001', // Budi Pratama
    programId: 'PRG-001', // Matematika
    dayOfWeek: 'Jumat',
    startTime: '16:30',
    endTime: '17:30',
    room: 'Ruang A1 - Newton',
    studentIds: ['STD-010', 'STD-011'],
    status: 'AKTIF',
    notes: 'Klinik Matematika & Konsultasi PR'
  }
];

// 20+ Realistic Meetings with specific test scenario on 02 September 2026
export const INITIAL_MEETINGS: Meeting[] = [
  // Historical Completed Meetings in August 2026
  {
    id: 'MTG-2026-0810-01',
    meetingCode: 'MTG-0810-01',
    scheduleId: 'SCH-001',
    teacherId: 'TCH-001',
    programId: 'PRG-001',
    date: '2026-08-10',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 5,
    presentStudentCount: 5,
    notes: 'Materi: Pola Bilangan dan Barisan Aritmatika',
    completedAt: '2026-08-10T16:05:00Z',
    completedByTeacherId: 'TCH-001',
    topic: 'Pola Bilangan'
  },
  {
    id: 'MTG-2026-0812-01',
    meetingCode: 'MTG-0812-01',
    scheduleId: 'SCH-002',
    teacherId: 'TCH-001',
    programId: 'PRG-001',
    date: '2026-08-12',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 5,
    presentStudentCount: 4,
    notes: 'Latihan soal barisan geometri',
    completedAt: '2026-08-12T16:02:00Z',
    completedByTeacherId: 'TCH-001',
    topic: 'Barisan Geometri'
  },
  {
    id: 'MTG-2026-0811-01',
    meetingCode: 'MTG-0811-01',
    scheduleId: 'SCH-003',
    teacherId: 'TCH-002',
    programId: 'PRG-002',
    date: '2026-08-11',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 4,
    presentStudentCount: 4,
    notes: 'Materi: Sistem Gerak pada Manusia',
    completedAt: '2026-08-11T16:04:00Z',
    completedByTeacherId: 'TCH-002',
    topic: 'Sistem Gerak'
  },
  {
    id: 'MTG-2026-0813-01',
    meetingCode: 'MTG-0813-01',
    scheduleId: 'SCH-004',
    teacherId: 'TCH-002',
    programId: 'PRG-002',
    date: '2026-08-13',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 4,
    presentStudentCount: 3,
    notes: 'Praktikum mikroskop virtual',
    completedAt: '2026-08-13T16:05:00Z',
    completedByTeacherId: 'TCH-002',
    topic: 'Struktur Sel'
  },
  {
    id: 'MTG-2026-0810-02',
    meetingCode: 'MTG-0810-02',
    scheduleId: 'SCH-005',
    teacherId: 'TCH-003',
    programId: 'PRG-003',
    date: '2026-08-10',
    startTime: '16:30',
    endTime: '17:30',
    status: 'SELESAI',
    registeredStudentCount: 4,
    presentStudentCount: 4,
    notes: 'Simple Present vs Continuous',
    completedAt: '2026-08-10T17:35:00Z',
    completedByTeacherId: 'TCH-003',
    topic: 'Tenses Review'
  },
  {
    id: 'MTG-2026-0817-01',
    meetingCode: 'MTG-0817-01',
    scheduleId: 'SCH-001',
    teacherId: 'TCH-001',
    programId: 'PRG-001',
    date: '2026-08-17',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 5,
    presentStudentCount: 5,
    notes: 'Sistem Koordinat Kartesius',
    completedAt: '2026-08-17T16:00:00Z',
    completedByTeacherId: 'TCH-001',
    topic: 'Koordinat Kartesius'
  },
  {
    id: 'MTG-2026-0819-01',
    meetingCode: 'MTG-0819-01',
    scheduleId: 'SCH-007',
    teacherId: 'TCH-004',
    programId: 'PRG-004',
    date: '2026-08-19',
    startTime: '16:30',
    endTime: '17:30',
    status: 'SELESAI',
    registeredStudentCount: 4,
    presentStudentCount: 4,
    notes: 'Menganalisis Teks Narasi',
    completedAt: '2026-08-19T17:32:00Z',
    completedByTeacherId: 'TCH-004',
    topic: 'Teks Narasi'
  },
  {
    id: 'MTG-2026-0822-01',
    meetingCode: 'MTG-0822-01',
    scheduleId: 'SCH-008',
    teacherId: 'TCH-005',
    programId: 'PRG-005',
    date: '2026-08-22',
    startTime: '09:00',
    endTime: '11:00',
    status: 'SELESAI',
    registeredStudentCount: 4,
    presentStudentCount: 4,
    notes: 'Tryout Mandiri Seri 1',
    completedAt: '2026-08-22T11:05:00Z',
    completedByTeacherId: 'TCH-005',
    topic: 'Simulasi Tryout 1'
  },
  {
    id: 'MTG-2026-0824-01',
    meetingCode: 'MTG-0824-01',
    scheduleId: 'SCH-001',
    teacherId: 'TCH-001',
    programId: 'PRG-001',
    date: '2026-08-24',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 5,
    presentStudentCount: 4,
    notes: 'Relasi dan Fungsi',
    completedAt: '2026-08-24T16:03:00Z',
    completedByTeacherId: 'TCH-001',
    topic: 'Relasi & Fungsi'
  },

  // KEY PROMPT TEST CASE: 02 September 2026 Guru Budi Matematika
  // Guru Budi: 5 students enrolled (Andi, Budi, Citra, Deni, Eko)
  // Attendance: Andi HADIR, Budi HADIR, Citra ALPA, Deni HADIR, Eko HADIR => 4 Hadir
  // Generates 4 student charges (Rp8.000 each = Rp32.000) & Teacher honor (4 * Rp2.000 = Rp8.000)
  {
    id: 'MTG-2026-0902-01',
    meetingCode: 'MTG-0902-01',
    scheduleId: 'SCH-001',
    teacherId: 'TCH-001', // Budi Pratama
    programId: 'PRG-001', // Matematika
    date: '2026-09-02',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 5,
    presentStudentCount: 4,
    notes: 'Persamaan Garis Lurus dan Gradien',
    completedAt: '2026-09-02T16:02:00Z',
    completedByTeacherId: 'TCH-001',
    topic: 'Persamaan Garis Lurus'
  },

  // More September 2026 Meetings
  {
    id: 'MTG-2026-0902-02',
    meetingCode: 'MTG-0902-02',
    scheduleId: 'SCH-005',
    teacherId: 'TCH-003', // Ahmad Fauzi
    programId: 'PRG-003', // Bahasa Inggris
    date: '2026-09-02',
    startTime: '16:30',
    endTime: '17:30',
    status: 'SELESAI',
    registeredStudentCount: 4,
    presentStudentCount: 4,
    notes: 'Descriptive Text and Adjectives',
    completedAt: '2026-09-02T17:30:00Z',
    completedByTeacherId: 'TCH-003',
    topic: 'Descriptive Text'
  },
  {
    id: 'MTG-2026-0903-01',
    meetingCode: 'MTG-0903-01',
    scheduleId: 'SCH-004',
    teacherId: 'TCH-002', // Siti Rahma
    programId: 'PRG-002', // IPA Terpadu
    date: '2026-09-03',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    registeredStudentCount: 4,
    presentStudentCount: 3,
    notes: 'Hukum Newton I, II, dan III',
    completedAt: '2026-09-03T16:01:00Z',
    completedByTeacherId: 'TCH-002',
    topic: 'Hukum Newton'
  },
  {
    id: 'MTG-2026-0904-01',
    meetingCode: 'MTG-0904-01',
    scheduleId: 'SCH-006',
    teacherId: 'TCH-003', // Ahmad Fauzi
    programId: 'PRG-003', // Bahasa Inggris
    date: '2026-09-04',
    startTime: '15:00',
    endTime: '16:00',
    status: 'SELESAI',
    validationStatus: 'MENUNGGU_VALIDASI',
    registeredStudentCount: 4,
    presentStudentCount: 4,
    notes: 'Passive Voice in Context',
    completedAt: '2026-09-04T16:00:00Z',
    completedByTeacherId: 'TCH-003',
    topic: 'Passive Voice'
  },
  {
    id: 'MTG-2026-0905-01',
    meetingCode: 'MTG-0905-01',
    scheduleId: 'SCH-008',
    teacherId: 'TCH-005', // Hendra Wijaya
    programId: 'PRG-005', // Persiapan Ujian
    date: '2026-09-05',
    startTime: '09:00',
    endTime: '11:00',
    status: 'SELESAI',
    validationStatus: 'MENUNGGU_VALIDASI',
    registeredStudentCount: 4,
    presentStudentCount: 4,
    notes: 'Bedah TPA & Literasi Skolastik',
    completedAt: '2026-09-05T11:05:00Z',
    completedByTeacherId: 'TCH-005',
    topic: 'Penalaran Umum'
  },

  // Upcoming / In-Progress meetings ready for teacher action testing
  {
    id: 'MTG-2026-0907-01',
    meetingCode: 'MTG-0907-01',
    scheduleId: 'SCH-001',
    teacherId: 'TCH-001', // Budi Pratama
    programId: 'PRG-001', // Matematika
    date: '2026-09-07',
    startTime: '15:00',
    endTime: '16:00',
    status: 'TERJADWAL',
    registeredStudentCount: 5,
    presentStudentCount: 0,
    notes: 'Sistem Persamaan Linear Dua Variabel (SPLDV)',
    topic: 'SPLDV Dasar'
  },
  {
    id: 'MTG-2026-0908-01',
    meetingCode: 'MTG-0908-01',
    scheduleId: 'SCH-003',
    teacherId: 'TCH-002', // Siti Rahma
    programId: 'PRG-002', // IPA
    date: '2026-09-08',
    startTime: '15:00',
    endTime: '16:00',
    status: 'TERJADWAL',
    registeredStudentCount: 4,
    presentStudentCount: 0,
    notes: 'Usaha, Energi, dan Pesawat Sederhana',
    topic: 'Pesawat Sederhana'
  },
  {
    id: 'MTG-2026-0909-01',
    meetingCode: 'MTG-0909-01',
    scheduleId: 'SCH-007',
    teacherId: 'TCH-004', // Dewi Lestari
    programId: 'PRG-004', // Bahasa Indonesia
    date: '2026-09-09',
    startTime: '16:30',
    endTime: '17:30',
    status: 'TERJADWAL',
    registeredStudentCount: 4,
    presentStudentCount: 0,
    notes: 'Menulis Teks Persuasi dan Iklan',
    topic: 'Teks Persuasi'
  },
  {
    id: 'MTG-2026-0911-01',
    meetingCode: 'MTG-0911-01',
    scheduleId: 'SCH-010',
    teacherId: 'TCH-001', // Budi Pratama
    programId: 'PRG-001', // Matematika
    date: '2026-09-11',
    startTime: '16:30',
    endTime: '17:30',
    status: 'TERJADWAL',
    registeredStudentCount: 2,
    presentStudentCount: 0,
    notes: 'Klinik Soal Olimpiade Matematika',
    topic: 'Olimpiade Teori Bilangan'
  }
];

export const INITIAL_MEETING_STUDENTS: MeetingStudent[] = [
  // Meeting MTG-2026-0810-01 (5 Hadir)
  { id: 'MS-0810-01', meetingId: 'MTG-2026-0810-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:02' },
  { id: 'MS-0810-02', meetingId: 'MTG-2026-0810-01', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '15:03' },
  { id: 'MS-0810-03', meetingId: 'MTG-2026-0810-01', studentId: 'STD-003', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0810-04', meetingId: 'MTG-2026-0810-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:05' },
  { id: 'MS-0810-05', meetingId: 'MTG-2026-0810-01', studentId: 'STD-005', attendanceStatus: 'HADIR', attendanceTime: '15:01' },

  // Meeting MTG-2026-0812-01 (4 Hadir, 1 Izin)
  { id: 'MS-0812-01', meetingId: 'MTG-2026-0812-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:01' },
  { id: 'MS-0812-02', meetingId: 'MTG-2026-0812-01', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '15:02' },
  { id: 'MS-0812-03', meetingId: 'MTG-2026-0812-01', studentId: 'STD-003', attendanceStatus: 'IZIN', attendanceTime: '14:30', notes: 'Izin acara keluarga' },
  { id: 'MS-0812-04', meetingId: 'MTG-2026-0812-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0812-05', meetingId: 'MTG-2026-0812-01', studentId: 'STD-005', attendanceStatus: 'HADIR', attendanceTime: '15:04' },

  // Meeting MTG-2026-0811-01 (4 Hadir)
  { id: 'MS-0811-01', meetingId: 'MTG-2026-0811-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0811-02', meetingId: 'MTG-2026-0811-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:01' },
  { id: 'MS-0811-03', meetingId: 'MTG-2026-0811-01', studentId: 'STD-006', attendanceStatus: 'HADIR', attendanceTime: '15:02' },
  { id: 'MS-0811-04', meetingId: 'MTG-2026-0811-01', studentId: 'STD-010', attendanceStatus: 'HADIR', attendanceTime: '15:04' },

  // Meeting MTG-2026-0813-01 (3 Hadir, 1 Sakit)
  { id: 'MS-0813-01', meetingId: 'MTG-2026-0813-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:01' },
  { id: 'MS-0813-02', meetingId: 'MTG-2026-0813-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0813-03', meetingId: 'MTG-2026-0813-01', studentId: 'STD-006', attendanceStatus: 'SAKIT', attendanceTime: '13:00', notes: 'Demam' },
  { id: 'MS-0813-04', meetingId: 'MTG-2026-0813-01', studentId: 'STD-010', attendanceStatus: 'HADIR', attendanceTime: '15:02' },

  // Meeting MTG-2026-0810-02 (4 Hadir)
  { id: 'MS-0810B-01', meetingId: 'MTG-2026-0810-02', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '16:32' },
  { id: 'MS-0810B-02', meetingId: 'MTG-2026-0810-02', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '16:30' },
  { id: 'MS-0810B-03', meetingId: 'MTG-2026-0810-02', studentId: 'STD-007', attendanceStatus: 'HADIR', attendanceTime: '16:31' },
  { id: 'MS-0810B-04', meetingId: 'MTG-2026-0810-02', studentId: 'STD-011', attendanceStatus: 'HADIR', attendanceTime: '16:33' },

  // Meeting MTG-2026-0817-01 (5 Hadir)
  { id: 'MS-0817-01', meetingId: 'MTG-2026-0817-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0817-02', meetingId: 'MTG-2026-0817-01', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0817-03', meetingId: 'MTG-2026-0817-01', studentId: 'STD-003', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0817-04', meetingId: 'MTG-2026-0817-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0817-05', meetingId: 'MTG-2026-0817-01', studentId: 'STD-005', attendanceStatus: 'HADIR', attendanceTime: '15:00' },

  // Meeting MTG-2026-0819-01 (4 Hadir)
  { id: 'MS-0819-01', meetingId: 'MTG-2026-0819-01', studentId: 'STD-003', attendanceStatus: 'HADIR', attendanceTime: '16:30' },
  { id: 'MS-0819-02', meetingId: 'MTG-2026-0819-01', studentId: 'STD-007', attendanceStatus: 'HADIR', attendanceTime: '16:30' },
  { id: 'MS-0819-03', meetingId: 'MTG-2026-0819-01', studentId: 'STD-008', attendanceStatus: 'HADIR', attendanceTime: '16:30' },
  { id: 'MS-0819-04', meetingId: 'MTG-2026-0819-01', studentId: 'STD-012', attendanceStatus: 'HADIR', attendanceTime: '16:30' },

  // Meeting MTG-2026-0822-01 (4 Hadir)
  { id: 'MS-0822-01', meetingId: 'MTG-2026-0822-01', studentId: 'STD-005', attendanceStatus: 'HADIR', attendanceTime: '09:00' },
  { id: 'MS-0822-02', meetingId: 'MTG-2026-0822-01', studentId: 'STD-006', attendanceStatus: 'HADIR', attendanceTime: '09:00' },
  { id: 'MS-0822-03', meetingId: 'MTG-2026-0822-01', studentId: 'STD-009', attendanceStatus: 'HADIR', attendanceTime: '09:00' },
  { id: 'MS-0822-04', meetingId: 'MTG-2026-0822-01', studentId: 'STD-011', attendanceStatus: 'HADIR', attendanceTime: '09:00' },

  // Meeting MTG-2026-0824-01 (4 Hadir, 1 Izin)
  { id: 'MS-0824-01', meetingId: 'MTG-2026-0824-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0824-02', meetingId: 'MTG-2026-0824-01', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0824-03', meetingId: 'MTG-2026-0824-01', studentId: 'STD-003', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0824-04', meetingId: 'MTG-2026-0824-01', studentId: 'STD-004', attendanceStatus: 'IZIN', attendanceTime: '14:00' },
  { id: 'MS-0824-05', meetingId: 'MTG-2026-0824-01', studentId: 'STD-005', attendanceStatus: 'HADIR', attendanceTime: '15:00' },

  // KEY TEST CASE: Meeting MTG-2026-0902-01 (Andi: HADIR, Budi: HADIR, Citra: ALPA, Deni: HADIR, Eko: HADIR)
  { id: 'MS-0902-01', meetingId: 'MTG-2026-0902-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:02' },
  { id: 'MS-0902-02', meetingId: 'MTG-2026-0902-01', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '15:01' },
  { id: 'MS-0902-03', meetingId: 'MTG-2026-0902-01', studentId: 'STD-003', attendanceStatus: 'ALPA', attendanceTime: '15:15', notes: 'Tidak hadir tanpa keterangan' },
  { id: 'MS-0902-04', meetingId: 'MTG-2026-0902-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0902-05', meetingId: 'MTG-2026-0902-01', studentId: 'STD-005', attendanceStatus: 'HADIR', attendanceTime: '15:03' },

  // Meeting MTG-2026-0902-02 (4 Hadir)
  { id: 'MS-0902B-01', meetingId: 'MTG-2026-0902-02', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '16:30' },
  { id: 'MS-0902B-02', meetingId: 'MTG-2026-0902-02', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '16:30' },
  { id: 'MS-0902B-03', meetingId: 'MTG-2026-0902-02', studentId: 'STD-007', attendanceStatus: 'HADIR', attendanceTime: '16:30' },
  { id: 'MS-0902B-04', meetingId: 'MTG-2026-0902-02', studentId: 'STD-011', attendanceStatus: 'HADIR', attendanceTime: '16:30' },

  // Meeting MTG-2026-0903-01 (3 Hadir, 1 Sakit)
  { id: 'MS-0903-01', meetingId: 'MTG-2026-0903-01', studentId: 'STD-001', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0903-02', meetingId: 'MTG-2026-0903-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0903-03', meetingId: 'MTG-2026-0903-01', studentId: 'STD-006', attendanceStatus: 'SAKIT', attendanceTime: '14:00' },
  { id: 'MS-0903-04', meetingId: 'MTG-2026-0903-01', studentId: 'STD-010', attendanceStatus: 'HADIR', attendanceTime: '15:00' },

  // Meeting MTG-2026-0904-01 (4 Hadir)
  { id: 'MS-0904-01', meetingId: 'MTG-2026-0904-01', studentId: 'STD-002', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0904-02', meetingId: 'MTG-2026-0904-01', studentId: 'STD-004', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0904-03', meetingId: 'MTG-2026-0904-01', studentId: 'STD-007', attendanceStatus: 'HADIR', attendanceTime: '15:00' },
  { id: 'MS-0904-04', meetingId: 'MTG-2026-0904-01', studentId: 'STD-011', attendanceStatus: 'HADIR', attendanceTime: '15:00' },

  // Meeting MTG-2026-0905-01 (4 Hadir)
  { id: 'MS-0905-01', meetingId: 'MTG-2026-0905-01', studentId: 'STD-005', attendanceStatus: 'HADIR', attendanceTime: '09:00' },
  { id: 'MS-0905-02', meetingId: 'MTG-2026-0905-01', studentId: 'STD-006', attendanceStatus: 'HADIR', attendanceTime: '09:00' },
  { id: 'MS-0905-03', meetingId: 'MTG-2026-0905-01', studentId: 'STD-009', attendanceStatus: 'HADIR', attendanceTime: '09:00' },
  { id: 'MS-0905-04', meetingId: 'MTG-2026-0905-01', studentId: 'STD-011', attendanceStatus: 'HADIR', attendanceTime: '09:00' }
];

// Seeded student charges derived strictly from billable attendances (Rp8.000 each)
export const INITIAL_STUDENT_CHARGES: StudentCharge[] = [
  // August 2026 Charges
  { id: 'CHG-0810-01', chargeNumber: 'TAG-202608-001', meetingId: 'MTG-2026-0810-01', studentId: 'STD-001', date: '2026-08-10', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-10T16:05:00Z' },
  { id: 'CHG-0810-02', chargeNumber: 'TAG-202608-002', meetingId: 'MTG-2026-0810-01', studentId: 'STD-002', date: '2026-08-10', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-10T16:05:00Z' },
  { id: 'CHG-0810-03', chargeNumber: 'TAG-202608-003', meetingId: 'MTG-2026-0810-01', studentId: 'STD-003', date: '2026-08-10', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-10T16:05:00Z' },
  { id: 'CHG-0810-04', chargeNumber: 'TAG-202608-004', meetingId: 'MTG-2026-0810-01', studentId: 'STD-004', date: '2026-08-10', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-10T16:05:00Z' },
  { id: 'CHG-0810-05', chargeNumber: 'TAG-202608-005', meetingId: 'MTG-2026-0810-01', studentId: 'STD-005', date: '2026-08-10', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-10T16:05:00Z' },

  { id: 'CHG-0812-01', chargeNumber: 'TAG-202608-006', meetingId: 'MTG-2026-0812-01', studentId: 'STD-001', date: '2026-08-12', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-12T16:02:00Z' },
  { id: 'CHG-0812-02', chargeNumber: 'TAG-202608-007', meetingId: 'MTG-2026-0812-01', studentId: 'STD-002', date: '2026-08-12', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-12T16:02:00Z' },
  { id: 'CHG-0812-04', chargeNumber: 'TAG-202608-008', meetingId: 'MTG-2026-0812-01', studentId: 'STD-004', date: '2026-08-12', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-12T16:02:00Z' },
  { id: 'CHG-0812-05', chargeNumber: 'TAG-202608-009', meetingId: 'MTG-2026-0812-01', studentId: 'STD-005', date: '2026-08-12', period: 'Agustus 2026', rateApplied: 8000, amount: 8000, paidAmount: 8000, remainingAmount: 0, status: 'LUNAS', createdAt: '2026-08-12T16:02:00Z' },

  // KEY TEST CASE: September 02, 2026 Meeting MTG-2026-0902-01 Charges
  // Andi = Rp8.000, Budi = Rp8.000, Deni = Rp8.000, Eko = Rp8.000 (Citra ALPA -> No Charge)
  { id: 'CHG-0902-01', chargeNumber: 'TAG-202609-001', meetingId: 'MTG-2026-0902-01', studentId: 'STD-001', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T16:02:00Z' },
  { id: 'CHG-0902-02', chargeNumber: 'TAG-202609-002', meetingId: 'MTG-2026-0902-01', studentId: 'STD-002', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T16:02:00Z' },
  { id: 'CHG-0902-04', chargeNumber: 'TAG-202609-003', meetingId: 'MTG-2026-0902-01', studentId: 'STD-004', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T16:02:00Z' },
  { id: 'CHG-0902-05', chargeNumber: 'TAG-202609-004', meetingId: 'MTG-2026-0902-01', studentId: 'STD-005', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T16:02:00Z' },

  // Additional September Charges
  { id: 'CHG-0902B-01', chargeNumber: 'TAG-202609-005', meetingId: 'MTG-2026-0902-02', studentId: 'STD-002', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T17:30:00Z' },
  { id: 'CHG-0902B-02', chargeNumber: 'TAG-202609-006', meetingId: 'MTG-2026-0902-02', studentId: 'STD-004', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T17:30:00Z' },
  { id: 'CHG-0902B-03', chargeNumber: 'TAG-202609-007', meetingId: 'MTG-2026-0902-02', studentId: 'STD-007', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T17:30:00Z' },
  { id: 'CHG-0902B-04', chargeNumber: 'TAG-202609-008', meetingId: 'MTG-2026-0902-02', studentId: 'STD-011', date: '2026-09-02', period: 'September 2026', rateApplied: 8000, amount: 8000, paidAmount: 0, remainingAmount: 8000, status: 'BELUM_BAYAR', createdAt: '2026-09-02T17:30:00Z' }
];

export const INITIAL_STUDENT_PAYMENTS: StudentPayment[] = [
  {
    id: 'PAY-0825-01',
    paymentNumber: 'KW-202608-001',
    date: '2026-08-25',
    studentId: 'STD-001',
    amount: 16000,
    paymentMethod: 'TRANSFER',
    notes: 'Pembayaran les bulan Agustus sesi 1 & 2',
    receivedBy: 'Administrator Lembaga',
    chargeIds: ['CHG-0810-01', 'CHG-0812-01']
  },
  {
    id: 'PAY-0825-02',
    paymentNumber: 'KW-202608-002',
    date: '2026-08-25',
    studentId: 'STD-002',
    amount: 16000,
    paymentMethod: 'QRIS',
    notes: 'Pelunasan tagihan sesi Agustus',
    receivedBy: 'Administrator Lembaga',
    chargeIds: ['CHG-0810-02', 'CHG-0812-02']
  },
  {
    id: 'PAY-0826-01',
    paymentNumber: 'KW-202608-003',
    date: '2026-08-26',
    studentId: 'STD-003',
    amount: 8000,
    paymentMethod: 'TUNAI',
    notes: 'Pembayaran tunai di resepsionis',
    receivedBy: 'Administrator Lembaga',
    chargeIds: ['CHG-0810-03']
  },
  {
    id: 'PAY-0826-02',
    paymentNumber: 'KW-202608-004',
    date: '2026-08-26',
    studentId: 'STD-004',
    amount: 16000,
    paymentMethod: 'TRANSFER',
    notes: 'Transfer via BCA',
    receivedBy: 'Administrator Lembaga',
    chargeIds: ['CHG-0810-04', 'CHG-0812-04']
  },
  {
    id: 'PAY-0827-01',
    paymentNumber: 'KW-202608-005',
    date: '2026-08-27',
    studentId: 'STD-005',
    amount: 16000,
    paymentMethod: 'TUNAI',
    notes: 'Pembayaran tunai oleh orang tua',
    receivedBy: 'Administrator Lembaga',
    chargeIds: ['CHG-0810-05', 'CHG-0812-05']
  }
];

export const INITIAL_TEACHER_HONORS: TeacherHonor[] = [
  // Budi Pratama (August 2026): 4 meetings, 18 student-meetings => 18 * 2000 = Rp36.000 (Paid in full)
  {
    id: 'HON-202608-001',
    honorNumber: 'HNR-202608-001',
    teacherId: 'TCH-001',
    period: 'Agustus 2026',
    meetingCount: 4,
    studentMeetingCount: 18,
    ratePerStudentMeeting: 2000,
    totalHonor: 36000,
    paidAmount: 36000,
    remainingAmount: 0,
    status: 'LUNAS',
    lastUpdated: '2026-08-31T18:00:00Z'
  },
  // Siti Rahma (August 2026)
  {
    id: 'HON-202608-002',
    honorNumber: 'HNR-202608-002',
    teacherId: 'TCH-002',
    period: 'Agustus 2026',
    meetingCount: 2,
    studentMeetingCount: 7,
    ratePerStudentMeeting: 2000,
    totalHonor: 14000,
    paidAmount: 14000,
    remainingAmount: 0,
    status: 'LUNAS',
    lastUpdated: '2026-08-31T18:00:00Z'
  },
  // Ahmad Fauzi (August 2026)
  {
    id: 'HON-202608-003',
    honorNumber: 'HNR-202608-003',
    teacherId: 'TCH-003',
    period: 'Agustus 2026',
    meetingCount: 1,
    studentMeetingCount: 4,
    ratePerStudentMeeting: 2000,
    totalHonor: 8000,
    paidAmount: 8000,
    remainingAmount: 0,
    status: 'LUNAS',
    lastUpdated: '2026-08-31T18:00:00Z'
  },

  // Budi Pratama (September 2026) - After MTG-2026-0902-01 (4 student-meetings => Rp8.000)
  {
    id: 'HON-202609-001',
    honorNumber: 'HNR-202609-001',
    teacherId: 'TCH-001',
    period: 'September 2026',
    meetingCount: 1,
    studentMeetingCount: 4,
    ratePerStudentMeeting: 2000,
    totalHonor: 8000,
    paidAmount: 0,
    remainingAmount: 8000,
    status: 'BELUM_DIBAYAR',
    lastUpdated: '2026-09-02T16:02:00Z'
  },
  // Ahmad Fauzi (September 2026) - 2 meetings, 8 student-meetings => Rp16.000
  {
    id: 'HON-202609-002',
    honorNumber: 'HNR-202609-002',
    teacherId: 'TCH-003',
    period: 'September 2026',
    meetingCount: 2,
    studentMeetingCount: 8,
    ratePerStudentMeeting: 2000,
    totalHonor: 16000,
    paidAmount: 0,
    remainingAmount: 16000,
    status: 'BELUM_DIBAYAR',
    lastUpdated: '2026-09-04T16:00:00Z'
  },
  // Siti Rahma (September 2026) - 1 meeting, 3 student-meetings => Rp6.000
  {
    id: 'HON-202609-003',
    honorNumber: 'HNR-202609-003',
    teacherId: 'TCH-002',
    period: 'September 2026',
    meetingCount: 1,
    studentMeetingCount: 3,
    ratePerStudentMeeting: 2000,
    totalHonor: 6000,
    paidAmount: 0,
    remainingAmount: 6000,
    status: 'BELUM_DIBAYAR',
    lastUpdated: '2026-09-03T16:01:00Z'
  },
  // Hendra Wijaya (September 2026) - 1 meeting, 4 student-meetings => Rp8.000
  {
    id: 'HON-202609-004',
    honorNumber: 'HNR-202609-004',
    teacherId: 'TCH-005',
    period: 'September 2026',
    meetingCount: 1,
    studentMeetingCount: 4,
    ratePerStudentMeeting: 2000,
    totalHonor: 8000,
    paidAmount: 0,
    remainingAmount: 8000,
    status: 'BELUM_DIBAYAR',
    lastUpdated: '2026-09-05T11:05:00Z'
  }
];

export const INITIAL_TEACHER_PAYMENTS: TeacherPayment[] = [
  {
    id: 'HPAY-0831-01',
    paymentNumber: 'VOUC-202608-001',
    date: '2026-08-31',
    teacherId: 'TCH-001',
    period: 'Agustus 2026',
    amount: 36000,
    paymentMethod: 'TRANSFER',
    notes: 'Transfer honor mengajar Agustus ke BCA 8830192831',
    processedBy: 'Administrator Lembaga'
  },
  {
    id: 'HPAY-0831-02',
    paymentNumber: 'VOUC-202608-002',
    date: '2026-08-31',
    teacherId: 'TCH-002',
    period: 'Agustus 2026',
    amount: 14000,
    paymentMethod: 'TRANSFER',
    notes: 'Transfer honor mengajar Agustus ke Mandiri',
    processedBy: 'Administrator Lembaga'
  },
  {
    id: 'HPAY-0831-03',
    paymentNumber: 'VOUC-202608-003',
    date: '2026-08-31',
    teacherId: 'TCH-003',
    period: 'Agustus 2026',
    amount: 8000,
    paymentMethod: 'TRANSFER',
    notes: 'Transfer honor mengajar Agustus ke BRI',
    processedBy: 'Administrator Lembaga'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-0801-01',
    expenseNumber: 'EXP-202608-001',
    date: '2026-08-01',
    category: 'SEWA',
    description: 'Sewa Gedung Ruko Bimbel Bulan Agustus 2026',
    amount: 1500000,
    paymentMethod: 'TRANSFER',
    notes: 'Dibayarkan ke pemilik ruko Bpk. Hendarto',
    recordedBy: 'Administrator Lembaga'
  },
  {
    id: 'EXP-0805-01',
    expenseNumber: 'EXP-202608-002',
    date: '2026-08-05',
    category: 'LISTRIK',
    description: 'Tagihan Listrik PLN Bimbel Agustus',
    amount: 350000,
    paymentMethod: 'TRANSFER',
    notes: 'Token listrik 2200 VA',
    recordedBy: 'Administrator Lembaga'
  },
  {
    id: 'EXP-0805-02',
    expenseNumber: 'EXP-202608-003',
    date: '2026-08-05',
    category: 'INTERNET',
    description: 'Tagihan Wi-Fi Biznet Fiber 100 Mbps',
    amount: 275000,
    paymentMethod: 'TRANSFER',
    notes: 'Langganan internet kantor',
    recordedBy: 'Administrator Lembaga'
  },
  {
    id: 'EXP-0810-01',
    expenseNumber: 'EXP-202608-004',
    date: '2026-08-10',
    category: 'ATK',
    description: 'Pembelian Spidol Whiteboard, Kertas HVS & Penghapus',
    amount: 125000,
    paymentMethod: 'TUNAI',
    notes: 'Toko Buku Gramedia',
    recordedBy: 'Administrator Lembaga'
  },
  {
    id: 'EXP-0820-01',
    expenseNumber: 'EXP-202608-005',
    date: '2026-08-20',
    category: 'OPERASIONAL',
    description: 'Air Minum Galon & Konsumsi Ruang Guru',
    amount: 85000,
    paymentMethod: 'TUNAI',
    notes: 'Isi ulang 4 galon Aqua + snack',
    recordedBy: 'Administrator Lembaga'
  },
  {
    id: 'EXP-0901-01',
    expenseNumber: 'EXP-202609-001',
    date: '2026-09-01',
    category: 'SEWA',
    description: 'Sewa Gedung Ruko Bimbel Bulan September 2026',
    amount: 1500000,
    paymentMethod: 'TRANSFER',
    notes: 'Sewa bulan September',
    recordedBy: 'Administrator Lembaga'
  },
  {
    id: 'EXP-0902-01',
    expenseNumber: 'EXP-202609-002',
    date: '2026-09-02',
    category: 'LISTRIK',
    description: 'Tagihan Listrik PLN Bulan September',
    amount: 320000,
    paymentMethod: 'TRANSFER',
    notes: 'PLN Pasca bayar',
    recordedBy: 'Administrator Lembaga'
  }
];

export const INITIAL_RATE_HISTORIES: RateHistory[] = [
  {
    id: 'RATE-001',
    rateType: 'STUDENT_CHARGE',
    rateName: 'Tarif Siswa per Pertemuan',
    value: 8000,
    effectiveDate: '2026-01-01',
    status: 'AKTIF',
    notes: 'Standar tarif reguler bimbel per siswa per pertemuan',
    setBy: 'Administrator Lembaga'
  },
  {
    id: 'RATE-002',
    rateType: 'TEACHER_HONOR',
    rateName: 'Tarif Honor Guru per Siswa-Pertemuan',
    value: 2000,
    effectiveDate: '2026-01-01',
    status: 'AKTIF',
    notes: 'Standar honor guru per siswa-pertemuan (Student-Meeting)',
    setBy: 'Administrator Lembaga'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-09-02T16:02:00Z',
    userName: 'Budi Pratama, S.Pd.',
    userRole: 'GURU',
    action: 'Menyelesaikan Absensi',
    details: 'Menyimpan absensi Pertemuan MTG-0902-01 (Matematika). 4 siswa hadir (Andi, Budi, Deni, Eko), 1 Alpa (Citra). Otomasi: Tagihan Rp32.000 & Honor Rp8.000 dibuat.',
    relatedEntity: 'MTG-2026-0902-01'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-09-02T16:10:00Z',
    userName: 'Administrator Lembaga',
    userRole: 'ADMIN',
    action: 'Monitoring Pertemuan',
    details: 'Memeriksa ringkasan absensi Guru Budi Pratama untuk kelas Matematika.',
    relatedEntity: 'MTG-2026-0902-01'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-09-02T17:30:00Z',
    userName: 'Ahmad Fauzi, S.Pd.',
    userRole: 'GURU',
    action: 'Menyelesaikan Absensi',
    details: 'Menyimpan absensi Pertemuan MTG-0902-02 (Bahasa Inggris). 4 siswa hadir. Otomasi: Tagihan Rp32.000 & Honor Rp8.000 dibuat.',
    relatedEntity: 'MTG-2026-0902-02'
  },
  {
    id: 'LOG-004',
    timestamp: '2026-09-01T09:00:00Z',
    userName: 'Administrator Lembaga',
    userRole: 'ADMIN',
    action: 'Membuat Pengeluaran',
    details: 'Mencatat pengeluaran sewa ruko September Rp1.500.000.',
    relatedEntity: 'EXP-202609-001'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOTIF-001',
    timestamp: '2026-09-02T17:30:00Z',
    type: 'ATTENDANCE_COMPLETED',
    title: 'Pertemuan Baru Selesai',
    message: 'Guru Ahmad Fauzi telah menyelesaikan absensi Bahasa Inggris. 4 siswa hadir. Tagihan Rp32.000 otomatis tercatat.',
    read: false,
    metadata: { meetingId: 'MTG-2026-0902-02', teacherId: 'TCH-003', amount: 32000 }
  },
  {
    id: 'NOTIF-002',
    timestamp: '2026-09-02T16:02:00Z',
    type: 'ATTENDANCE_COMPLETED',
    title: 'Pertemuan Baru Selesai',
    message: 'Guru Budi Pratama telah menyelesaikan absensi Matematika. 4 siswa hadir (Andi, Budi, Deni, Eko). Honor guru Rp8.000 & Tagihan siswa Rp32.000 siap di admin.',
    read: false,
    metadata: { meetingId: 'MTG-2026-0902-01', teacherId: 'TCH-001', amount: 32000 }
  },
  {
    id: 'NOTIF-003',
    timestamp: '2026-08-31T18:00:00Z',
    type: 'HONOR_PAID',
    title: 'Honor Guru Dibayarkan',
    message: 'Pembayaran honor periode Agustus 2026 untuk 3 Guru telah selesai diproses.',
    read: true
  }
];
