import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  DollarSign,
  History,
  Users,
  Save,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  MessageCircle,
  Sparkles,
  Sliders,
  TrendingUp,
  Landmark,
  FileText,
  Copy,
  Info,
  ExternalLink,
  Award,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Check,
  BookmarkPlus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { Modal } from '../../components/common/Modal';
import { StudentBillingScheme, TeacherHonorSchemeType, BimbelPreset } from '../../types';

// Preset configurations for default standard tutoring business models
const DEFAULT_BIMBEL_PRESETS: BimbelPreset[] = [
  {
    id: 'REGULER',
    name: 'Bimbel Reguler Klasikal (SD/SMP/SMA)',
    description: 'Format kelas kelompok belajar 8–15 siswa per rombel di gedung bimbel.',
    badge: 'Paling Populer',
    studentRate: 8000,
    studentBillingScheme: 'persesi',
    teacherRate: 2000,
    teacherHonorSchemeType: 'siswa',
    transportAllowance: 0,
    sampleProgram: 'Matematika & IPA Terpadu Kelas',
    tagline: 'Mencerdaskan Generasi Bangsa dengan Metode Belajar Menyenangkan'
  },
  {
    id: 'PRIVAT',
    name: 'Bimbel Les Privat Eksklusif (1-on-1)',
    description: 'Guru datang langsung ke rumah siswa (door-to-door) atau 1 tentor 1 siswa.',
    badge: 'High Value',
    studentRate: 65000,
    studentBillingScheme: 'persesi',
    teacherRate: 40000,
    teacherHonorSchemeType: 'sesi',
    transportAllowance: 10000,
    sampleProgram: 'Les Privat Semua Mapel ke Rumah',
    tagline: 'Pendampingan Belajar Privat 1-on-1 Intensif Bergaransi'
  },
  {
    id: 'SEMI_PRIVAT',
    name: 'Bimbel Semi-Privat (Kelompok Kecil 3-5 Siswa)',
    description: 'Fokus interaksi maksimal, teman sekelas sebaya dengan biaya terjangkau.',
    badge: 'Keluarga & Sahabat',
    studentRate: 25000,
    studentBillingScheme: 'persesi',
    teacherRate: 10000,
    teacherHonorSchemeType: 'siswa',
    transportAllowance: 5000,
    sampleProgram: 'Kelompok Semi-Privat 3 Siswa',
    tagline: 'Belajar Lebih Fokus Bersama Sahabat Sebaya'
  },
  {
    id: 'UTBK_KEDINASAN',
    name: 'Bimbel Intensif UTBK / SNBT & Kedinasan',
    description: 'Bedah materi TPS, TKA, drill bank soal, tryout berkala bagi siswa SMA & alumni.',
    badge: 'Spesialis Kampus',
    studentRate: 35000,
    studentBillingScheme: 'persesi',
    teacherRate: 15000,
    teacherHonorSchemeType: 'sesi',
    transportAllowance: 10000,
    sampleProgram: 'Super Camp Sukses UTBK PTN',
    tagline: 'Jalan Pasti Lolos PTN Impian & Sekolah Kedinasan'
  },
  {
    id: 'BULANAN_SPP',
    name: 'Bimbel Paket SPP Bulanan & Tentor Gaji Tetap',
    description: 'Model pembayaran SPP bulanan bagi siswa dan gaji honor bulanan tetap untuk tentor.',
    badge: 'Langganan Bulanan',
    studentRate: 250000,
    studentBillingScheme: 'perbulan',
    teacherRate: 1500000,
    teacherHonorSchemeType: 'bulan',
    transportAllowance: 0,
    sampleProgram: 'Paket Belajar Bulanan Terpadu',
    tagline: 'Biaya Terjangkau dengan Pembayaran Rutin Bulanan'
  },
  {
    id: 'CALISTUNG_ANAK',
    name: 'Bimbel Calistung & Mengaji Anak',
    description: 'Baca, tulis, hitung dasar dan tahsin anak usia dini (TK / SD Kelas Awal).',
    badge: 'Usia Dini',
    studentRate: 12000,
    studentBillingScheme: 'persesi',
    teacherRate: 4500,
    teacherHonorSchemeType: 'siswa',
    transportAllowance: 0,
    sampleProgram: 'Calistung Cepat & Mengaji Ceria',
    tagline: 'Membangun Minat Baca dan Belajar Sejak Dini'
  }
];

export const SettingsPage: React.FC = () => {
  const {
    settings,
    rateHistories,
    currentUser,
    updateInstitutionSettings,
    updateRates,
    showToast,
    clearAllDemoData,
    resetToDefaultData,
    isDemoCleaned
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rates' | 'profile' | 'billing' | 'whatsapp' | 'history' | 'users'>('rates');

  // Interactive margin simulation slider
  const [simulatedStudents, setSimulatedStudents] = useState<number>(5);

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: settings.name || '',
    tagline: settings.tagline || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    logoUrl: settings.logoUrl || '',
    principalName: settings.principalName || 'Drs. H. Mulyadi, M.Pd.',
    principalNip: settings.principalNip || 'NIP. 19780412 200312 1 004',
    academicYear: settings.academicYear || '2026/2027'
  });

  // Rates Form
  const [ratesForm, setRatesForm] = useState<{
    studentRate: number;
    studentBillingScheme: StudentBillingScheme;
    teacherRate: number;
    teacherHonorSchemeType: TeacherHonorSchemeType;
    defaultTransportAllowance: number;
    reason: string;
  }>({
    studentRate: settings.studentRate || 8000,
    studentBillingScheme: (settings.studentBillingScheme || 'persesi') as StudentBillingScheme,
    teacherRate: settings.teacherRate || 2000,
    teacherHonorSchemeType: (settings.teacherHonorSchemeType || 'siswa') as TeacherHonorSchemeType,
    defaultTransportAllowance: settings.defaultTransportAllowance || 0,
    reason: ''
  });

  // Custom Bimbel Model Presets State (stored in localStorage & settings)
  const [customPresets, setCustomPresets] = useState<BimbelPreset[]>(() => {
    try {
      const saved = localStorage.getItem('educendikia_custom_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return settings.customBimbelPresets || [];
  });

  // Synchronize custom presets when settings loads
  useEffect(() => {
    if (settings.customBimbelPresets && settings.customBimbelPresets.length > 0) {
      setCustomPresets(settings.customBimbelPresets);
      try {
        localStorage.setItem('educendikia_custom_presets', JSON.stringify(settings.customBimbelPresets));
      } catch (e) {
        // ignore
      }
    }
  }, [settings.customBimbelPresets]);

  const allPresets: BimbelPreset[] = [...DEFAULT_BIMBEL_PRESETS, ...customPresets];

  // Modal State for Manual Model Bimbel Input & Edit
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [presetForm, setPresetForm] = useState<{
    name: string;
    badge: string;
    description: string;
    studentRate: number;
    studentBillingScheme: StudentBillingScheme;
    teacherRate: number;
    teacherHonorSchemeType: TeacherHonorSchemeType;
    transportAllowance: number;
    sampleProgram: string;
    tagline: string;
    applyImmediately: boolean;
  }>({
    name: '',
    badge: 'Model Kustom',
    description: '',
    studentRate: 15000,
    studentBillingScheme: 'persesi',
    teacherRate: 5000,
    teacherHonorSchemeType: 'siswa',
    transportAllowance: 0,
    sampleProgram: '',
    tagline: '',
    applyImmediately: true
  });

  const [isClearingData, setIsClearingData] = useState(false);

  const handleClearDemoData = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data demo?\n\nSemua siswa dummy, guru demo, jadwal, pertemuan, dan tagihan demo akan dihapus permanen sehingga Anda memulai dari database yang 100% bersih untuk bimbel Anda.')) {
      return;
    }
    setIsClearingData(true);
    try {
      await clearAllDemoData();
    } finally {
      setIsClearingData(false);
    }
  };

  const handleOpenAddPreset = () => {
    setEditingPresetId(null);
    setPresetForm({
      name: '',
      badge: 'Model Kustom',
      description: '',
      studentRate: ratesForm.studentRate || 15000,
      studentBillingScheme: ratesForm.studentBillingScheme || 'persesi',
      teacherRate: ratesForm.teacherRate || 5000,
      teacherHonorSchemeType: ratesForm.teacherHonorSchemeType || 'siswa',
      transportAllowance: ratesForm.defaultTransportAllowance || 0,
      sampleProgram: '',
      tagline: '',
      applyImmediately: true
    });
    setIsPresetModalOpen(true);
  };

  const handleSaveCurrentAsPreset = () => {
    const schemeLabel = ratesForm.studentBillingScheme === 'perbulan' ? 'Bulanan' : ratesForm.studentBillingScheme === 'pertahun' ? 'Tahunan' : 'Per Sesi';
    setEditingPresetId(null);
    setPresetForm({
      name: `Bimbel Model ${schemeLabel} (Kustom)`,
      badge: 'Kustom Baru',
      description: `Model bimbel kustom dengan tarif siswa ${formatRupiah(ratesForm.studentRate)} dan honor tentor ${formatRupiah(ratesForm.teacherRate)}.`,
      studentRate: ratesForm.studentRate,
      studentBillingScheme: ratesForm.studentBillingScheme,
      teacherRate: ratesForm.teacherRate,
      teacherHonorSchemeType: ratesForm.teacherHonorSchemeType,
      transportAllowance: ratesForm.defaultTransportAllowance || 0,
      sampleProgram: '',
      tagline: profileForm.tagline || '',
      applyImmediately: false
    });
    setIsPresetModalOpen(true);
  };

  const handleOpenEditPreset = (preset: BimbelPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPresetId(preset.id);
    setPresetForm({
      name: preset.name,
      badge: preset.badge,
      description: preset.description,
      studentRate: preset.studentRate,
      studentBillingScheme: preset.studentBillingScheme || 'persesi',
      teacherRate: preset.teacherRate,
      teacherHonorSchemeType: preset.teacherHonorSchemeType || 'siswa',
      transportAllowance: preset.transportAllowance || 0,
      sampleProgram: preset.sampleProgram || '',
      tagline: preset.tagline || '',
      applyImmediately: false
    });
    setIsPresetModalOpen(true);
  };

  const handleDeletePreset = async (presetId: string, presetName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Hapus model bimbel kustom "${presetName}"?`)) {
      const updated = customPresets.filter(p => p.id !== presetId);
      setCustomPresets(updated);
      try {
        localStorage.setItem('educendikia_custom_presets', JSON.stringify(updated));
        await updateInstitutionSettings({ customBimbelPresets: updated });
      } catch (err) {
        console.warn('Failed saving custom presets:', err);
      }
      showToast('Model Dihapus', `Model kustom "${presetName}" telah dihapus.`, 'info');
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetForm.name.trim()) {
      showToast('Validasi Gagal', 'Nama model bimbel wajib diisi.', 'warning');
      return;
    }

    let updatedList: BimbelPreset[];
    let targetPreset: BimbelPreset;

    if (editingPresetId) {
      const existingIndex = customPresets.findIndex(p => p.id === editingPresetId);
      targetPreset = {
        id: editingPresetId,
        name: presetForm.name.trim(),
        badge: presetForm.badge.trim() || 'Model Kustom',
        description: presetForm.description.trim() || 'Model bimbingan belajar kustom yang disesuaikan.',
        studentRate: Number(presetForm.studentRate) || 0,
        studentBillingScheme: presetForm.studentBillingScheme,
        teacherRate: Number(presetForm.teacherRate) || 0,
        teacherHonorSchemeType: presetForm.teacherHonorSchemeType,
        transportAllowance: Number(presetForm.transportAllowance) || 0,
        sampleProgram: presetForm.sampleProgram.trim(),
        tagline: presetForm.tagline.trim(),
        isCustom: true
      };

      if (existingIndex >= 0) {
        updatedList = [...customPresets];
        updatedList[existingIndex] = targetPreset;
      } else {
        // If it was editing a built-in template, save as new customized template
        const newCustomId = `CUSTOM_${Date.now()}`;
        targetPreset.id = newCustomId;
        updatedList = [...customPresets, targetPreset];
      }
    } else {
      const newId = `CUSTOM_${Date.now()}`;
      targetPreset = {
        id: newId,
        name: presetForm.name.trim(),
        badge: presetForm.badge.trim() || 'Model Kustom',
        description: presetForm.description.trim() || 'Model bimbingan belajar kustom yang diinput manual oleh admin.',
        studentRate: Number(presetForm.studentRate) || 0,
        studentBillingScheme: presetForm.studentBillingScheme,
        teacherRate: Number(presetForm.teacherRate) || 0,
        teacherHonorSchemeType: presetForm.teacherHonorSchemeType,
        transportAllowance: Number(presetForm.transportAllowance) || 0,
        sampleProgram: presetForm.sampleProgram.trim(),
        tagline: presetForm.tagline.trim(),
        isCustom: true
      };
      updatedList = [...customPresets, targetPreset];
    }

    setCustomPresets(updatedList);
    try {
      localStorage.setItem('educendikia_custom_presets', JSON.stringify(updatedList));
      await updateInstitutionSettings({ customBimbelPresets: updatedList });
    } catch (err) {
      console.warn('Failed saving custom presets:', err);
    }

    if (presetForm.applyImmediately) {
      handleApplyPreset(targetPreset);
    }

    setIsPresetModalOpen(false);
    showToast(
      'Model Bimbel Berhasil Disimpan',
      `Model "${targetPreset.name}" telah disimpan${presetForm.applyImmediately ? ' dan langsung diterapkan ke formulir' : ''}.`,
      'success'
    );
  };

  // Billing & Bank Form
  const [billingForm, setBillingForm] = useState({
    bankName: settings.bankName || 'Bank Central Asia (BCA)',
    bankAccountNumber: settings.bankAccountNumber || '8735-0921-88',
    bankAccountHolder: settings.bankAccountHolder || settings.name || 'Yayasan Bimbingan Belajar',
    qrisInfo: settings.qrisInfo || 'QRIS Rekening Resmi Bimbel (NMID: ID1020039485)',
    billingDueDay: settings.billingDueDay || 10,
    billingInstructions: settings.billingInstructions || 'Pembayaran tagihan les paling lambat tanggal 10 setiap bulan. Mohon sertakan Nama & NIS siswa pada bukti transfer.'
  });

  // WhatsApp Template Form
  const [waTemplate, setWaTemplate] = useState<string>(
    settings.waBillingTemplate ||
`Yth. Bapak/Ibu Wali dari *{nama_siswa}* (NIS: {nis_siswa}),

Salam hangat dari *{nama_bimbel}*.

Melalui pesan ini, kami menyampaikan rincian tagihan bimbingan belajar per tanggal *{tanggal}*:
• Siswa: *{nama_siswa}* ({kelas})
• Sesi Hadir Belum Lunas: {jumlah_sesi} Pertemuan
• *Total Tagihan: {total_tagihan}*

💳 *Informasi Pembayaran:*
• Bank: *{nama_bank}*
• No. Rekening: *{no_rekening}*
• Atas Nama: *{atas_nama}*
• Jatuh Tempo: *Tanggal {jatuh_tempo} setiap bulan*

{instruksi_pembayaran}

Mohon konfirmasi bukti transfer jika sudah membayar. Terima kasih atas kepercayaan Bapak/Ibu.
_{nama_bimbel}_`
  );

  const handleApplyPreset = (preset: BimbelPreset) => {
    setRatesForm({
      ...ratesForm,
      studentRate: preset.studentRate,
      studentBillingScheme: preset.studentBillingScheme || 'persesi',
      teacherRate: preset.teacherRate,
      teacherHonorSchemeType: preset.teacherHonorSchemeType || 'siswa',
      defaultTransportAllowance: preset.transportAllowance,
      reason: `Menerapkan skema standar: ${preset.name}`
    });

    // Optionally suggest tagline
    if (!profileForm.tagline) {
      setProfileForm(prev => ({ ...prev, tagline: preset.tagline }));
    }

    showToast(
      'Skema Preset Diterapkan',
      `${preset.name} dipilih: Siswa ${formatRupiah(preset.studentRate)} (${preset.studentBillingScheme || 'persesi'}), Tentor ${formatRupiah(preset.teacherRate)} (${preset.teacherHonorSchemeType || 'siswa'}). Klik "Simpan Perubahan Tarif" untuk mengaktifkan.`,
      'info'
    );
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratesForm.studentRate <= 0) {
      showToast('Tarif Tidak Valid', 'Tarif les siswa harus lebih besar dari 0.', 'warning');
      return;
    }
    if (ratesForm.teacherRate < 0) {
      showToast('Honor Tidak Valid', 'Honor guru tidak boleh negatif.', 'warning');
      return;
    }

    updateRates(
      Number(ratesForm.studentRate),
      Number(ratesForm.teacherRate),
      ratesForm.reason || 'Penyesuaian master tarif bimbingan belajar',
      {
        studentBillingScheme: ratesForm.studentBillingScheme,
        teacherHonorSchemeType: ratesForm.teacherHonorSchemeType,
        defaultTransportAllowance: Number(ratesForm.defaultTransportAllowance)
      }
    );

    // Save transport allowance
    updateInstitutionSettings({
      defaultTransportAllowance: Number(ratesForm.defaultTransportAllowance)
    });

    setRatesForm(prev => ({ ...prev, reason: '' }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast('Nama Wajib Diisi', 'Nama bimbel/lembaga tidak boleh kosong.', 'warning');
      return;
    }
    updateInstitutionSettings(profileForm);
  };

  const handleSaveBilling = (e: React.FormEvent) => {
    e.preventDefault();
    updateInstitutionSettings(billingForm);
  };

  const handleSaveWaTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    updateInstitutionSettings({ waBillingTemplate: waTemplate });
    showToast('Template Disimpan', 'Template pesan WhatsApp tagihan berhasil diperbarui.', 'success');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Teks Disalin', 'Teks telah disalin ke clipboard.', 'success');
  };

  // Calculations for simulated margin
  const simStudentRate = Number(ratesForm.studentRate) || 8000;
  const simTeacherRate = Number(ratesForm.teacherRate) || 2000;
  const simTransport = Number(ratesForm.defaultTransportAllowance) || 0;

  // Gross Revenue calculation based on studentBillingScheme
  let simGrossRevenue = 0;
  let simRevenueFormulaLabel = '';
  if (ratesForm.studentBillingScheme === 'persesi') {
    simGrossRevenue = simStudentRate * simulatedStudents;
    simRevenueFormulaLabel = `${simulatedStudents} siswa × ${formatRupiah(simStudentRate)}/sesi`;
  } else if (ratesForm.studentBillingScheme === 'perbulan') {
    // Estimasi per pertemuan (basis 12 sesi/bulan)
    const perSessionEquiv = Math.round(simStudentRate / 12);
    simGrossRevenue = perSessionEquiv * simulatedStudents;
    simRevenueFormulaLabel = `${simulatedStudents} siswa × ${formatRupiah(perSessionEquiv)} (est. ${formatRupiah(simStudentRate)}/bln ÷ 12 sesi)`;
  } else {
    // pertahun (basis 96 sesi/tahun)
    const perSessionEquiv = Math.round(simStudentRate / 96);
    simGrossRevenue = perSessionEquiv * simulatedStudents;
    simRevenueFormulaLabel = `${simulatedStudents} siswa × ${formatRupiah(perSessionEquiv)} (est. ${formatRupiah(simStudentRate)}/thn ÷ 96 sesi)`;
  }

  // Teacher Honor calculation based on teacherHonorSchemeType
  let simTotalTeacherHonor = 0;
  let simTeacherHonorFormulaLabel = '';
  if (ratesForm.teacherHonorSchemeType === 'sesi') {
    simTotalTeacherHonor = simTeacherRate + simTransport;
    simTeacherHonorFormulaLabel = `Flat ${formatRupiah(simTeacherRate)}/sesi ${simTransport > 0 ? `+ Transport ${formatRupiah(simTransport)}` : ''}`;
  } else if (ratesForm.teacherHonorSchemeType === 'siswa') {
    simTotalTeacherHonor = (simTeacherRate * simulatedStudents) + simTransport;
    simTeacherHonorFormulaLabel = `${simulatedStudents} siswa × ${formatRupiah(simTeacherRate)} ${simTransport > 0 ? `+ Transport ${formatRupiah(simTransport)}` : ''}`;
  } else {
    // bulan (basis 16 sesi/bulan)
    const perSessionSalary = Math.round(simTeacherRate / 16);
    simTotalTeacherHonor = perSessionSalary + simTransport;
    simTeacherHonorFormulaLabel = `Est. ${formatRupiah(perSessionSalary)}/sesi (${formatRupiah(simTeacherRate)}/bln) ${simTransport > 0 ? `+ Transport ${formatRupiah(simTransport)}` : ''}`;
  }

  const simNetInstitutionMargin = simGrossRevenue - simTotalTeacherHonor;
  const simMarginPercentage = simGrossRevenue > 0 ? (simNetInstitutionMargin / simGrossRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Pusat Pengaturan Bimbel (Multi-Lembaga)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sesuaikan identitas, harga les, honor guru, rekening penagihan, dan template pesan agar siap digunakan bimbel manapun
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-bold text-indigo-800 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-indigo-600" />
            <span className="truncate max-w-[180px]">{settings.name}</span>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rates'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Master Tarif & Skema Bimbel</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Profil & Legalitas Bimbel</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'billing'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekening & Kebijakan Tagihan</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'whatsapp'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Template WhatsApp Tagihan</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Tarif</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Hak Akses Pengguna</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MASTER TARIF & SKEMA BIMBEL */}
      {/* ========================================================================= */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          {/* Quick Preset Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Preset Model Bisnis Bimbel (Terapkan 1-Klik & Input Manual)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih model bimbel bawaan atau tambahkan model kustom Anda sendiri untuk mengatur standar tarif & honor:
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveCurrentAsPreset}
                  title="Simpan pengaturan tarif yang ada di formulir bawah sebagai model preset baru"
                  className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Simpan Tarif Aktif</span>
                  <span className="sm:hidden">Salin Tarif</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddPreset}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Input Manual Model</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {allPresets.map(preset => {
                const isCurrentActive =
                  ratesForm.studentRate === preset.studentRate &&
                  ratesForm.teacherRate === preset.teacherRate &&
                  ratesForm.studentBillingScheme === (preset.studentBillingScheme || 'persesi') &&
                  ratesForm.teacherHonorSchemeType === (preset.teacherHonorSchemeType || 'siswa');

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-xs flex flex-col justify-between group relative ${
                      isCurrentActive
                        ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-[13px] leading-tight">
                              {preset.name}
                            </span>
                            {preset.isCustom && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                Kustom
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              preset.isCustom
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {preset.badge}
                          </span>

                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={e => handleOpenEditPreset(preset, e)}
                              title="Edit model bimbel ini"
                              className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/60 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {preset.isCustom && (
                              <button
                                type="button"
                                onClick={e => handleDeletePreset(preset.id, preset.name, e)}
                                title="Hapus model kustom ini"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {isCurrentActive && (
                        <div className="mb-2 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3" />
                          <span>Sedang Dipilih di Formulir</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">
                          Tarif Siswa ({preset.studentBillingScheme === 'perbulan' ? 'Per Bulan' : preset.studentBillingScheme === 'pertahun' ? 'Per Tahun' : 'Per Sesi'}):
                        </span>
                        <strong className="text-emerald-700 font-black">
                          {formatRupiah(preset.studentRate)}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">
                          Honor Guru ({preset.teacherHonorSchemeType === 'sesi' ? 'Per Sesi' : preset.teacherHonorSchemeType === 'bulan' ? 'Per Bulan' : 'Per Siswa'}):
                        </span>
                        <strong className="text-indigo-700 font-black">
                          {formatRupiah(preset.teacherRate)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Interactive Card: Add New Custom Bimbel Model */}
              <button
                type="button"
                onClick={handleOpenAddPreset}
                className="p-4 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/70 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[130px] group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-700 flex items-center justify-center mb-2 transition-colors shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-700">
                  + Input Manual Model Baru
                </span>
                <span className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-tight">
                  Tentukan tarif siswa, honor tentor & skema sesuai kebutuhan unik bimbel Anda
                </span>
              </button>
            </div>
          </div>

          {/* Rate Form & Live Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Custom Edit Form */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span>Kustomisasi Master Tarif & Skema Lembaga</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur nominal dan skema perhitungan untuk siswa (persesi/perbulan/pertahun) dan tentor (sesi/siswa/bulan).
                </p>
              </div>

              <form onSubmit={handleSaveRates} className="space-y-4 text-xs">
                {/* 1. SKEMA TARIF SISWA */}
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold text-emerald-950 text-xs sm:text-sm block">
                        Tarif Iuran Siswa
                      </label>
                      <span className="text-[11px] text-emerald-700">
                        Pilihan skema: nominal dan periode tagihan
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold px-2 py-0.5 bg-emerald-100/90 rounded-md border border-emerald-200">
                      Aktif: {formatRupiah(settings.studentRate)} (
                      {settings.studentBillingScheme === 'perbulan' 
                        ? 'Per Bulan' 
                        : settings.studentBillingScheme === 'pertahun' 
                          ? 'Per Tahun' 
                          : 'Per Sesi'}
                      )
                    </span>
                  </div>

                  {/* Skema Siswa: persesi / perbulan / pertahun */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Pilihan Skema Periode Tagihan Siswa:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRatesForm({ ...ratesForm, studentBillingScheme: 'persesi' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          ratesForm.studentBillingScheme === 'persesi'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold">Per Sesi</div>
                        <div className={`text-[10px] mt-0.5 ${ratesForm.studentBillingScheme === 'persesi' ? 'text-emerald-100' : 'text-slate-500'}`}>
                          tiap pertemuan
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRatesForm({ ...ratesForm, studentBillingScheme: 'perbulan' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          ratesForm.studentBillingScheme === 'perbulan'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold">Per Bulan</div>
                        <div className={`text-[10px] mt-0.5 ${ratesForm.studentBillingScheme === 'perbulan' ? 'text-emerald-100' : 'text-slate-500'}`}>
                          SPP bulanan
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRatesForm({ ...ratesForm, studentBillingScheme: 'pertahun' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          ratesForm.studentBillingScheme === 'pertahun'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold">Per Tahun</div>
                        <div className={`text-[10px] mt-0.5 ${ratesForm.studentBillingScheme === 'pertahun' ? 'text-emerald-100' : 'text-slate-500'}`}>
                          paket tahunan
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Input Nominal Siswa */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nominal Tarif Siswa ({ratesForm.studentBillingScheme === 'persesi' ? 'per sesi' : ratesForm.studentBillingScheme === 'perbulan' ? 'per bulan' : 'per tahun'}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                      <input
                        type="number"
                        step="500"
                        value={ratesForm.studentRate}
                        onChange={e => setRatesForm({ ...ratesForm, studentRate: Number(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Quick Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="text-[10px] text-slate-500 self-center">Pilihan Cepat:</span>
                      {(ratesForm.studentBillingScheme === 'persesi'
                        ? [8000, 10000, 15000, 25000, 50000, 75000]
                        : ratesForm.studentBillingScheme === 'perbulan'
                          ? [150000, 250000, 350000, 500000, 750000, 1000000]
                          : [1500000, 2500000, 3500000, 5000000, 7500000]
                      ).map(val => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setRatesForm({ ...ratesForm, studentRate: val })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                            ratesForm.studentRate === val
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          {formatRupiah(val)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. SKEMA HONOR TENTOR */}
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-bold text-indigo-950 text-xs sm:text-sm block">
                        Honor Pengajar / Tentor
                      </label>
                      <span className="text-[11px] text-indigo-700">
                        Pilihan skema: nominal dan dasar kompensasi
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-800 font-bold px-2 py-0.5 bg-indigo-100/90 rounded-md border border-indigo-200">
                      Aktif: {formatRupiah(settings.teacherRate)} (
                      {settings.teacherHonorSchemeType === 'sesi' 
                        ? 'Per Sesi' 
                        : settings.teacherHonorSchemeType === 'bulan' 
                          ? 'Per Bulan' 
                          : 'Per Siswa'}
                      )
                    </span>
                  </div>

                  {/* Skema Tentor: sesi / siswa / bulan */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Pilihan Skema Perhitungan Honor Tentor:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRatesForm({ ...ratesForm, teacherHonorSchemeType: 'sesi' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          ratesForm.teacherHonorSchemeType === 'sesi'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold">Per Sesi</div>
                        <div className={`text-[10px] mt-0.5 ${ratesForm.teacherHonorSchemeType === 'sesi' ? 'text-indigo-100' : 'text-slate-500'}`}>
                          flat per pertemuan
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRatesForm({ ...ratesForm, teacherHonorSchemeType: 'siswa' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          ratesForm.teacherHonorSchemeType === 'siswa'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold">Per Siswa</div>
                        <div className={`text-[10px] mt-0.5 ${ratesForm.teacherHonorSchemeType === 'siswa' ? 'text-indigo-100' : 'text-slate-500'}`}>
                          per siswa hadir
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRatesForm({ ...ratesForm, teacherHonorSchemeType: 'bulan' })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          ratesForm.teacherHonorSchemeType === 'bulan'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="text-xs font-bold">Per Bulan</div>
                        <div className={`text-[10px] mt-0.5 ${ratesForm.teacherHonorSchemeType === 'bulan' ? 'text-indigo-100' : 'text-slate-500'}`}>
                          gaji bulanan tetap
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Input Nominal Tentor */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nominal Honor Tentor ({ratesForm.teacherHonorSchemeType === 'sesi' ? 'flat per sesi' : ratesForm.teacherHonorSchemeType === 'siswa' ? 'per siswa-sesi' : 'gaji bulanan tetap'}) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                      <input
                        type="number"
                        step="500"
                        value={ratesForm.teacherRate}
                        onChange={e => setRatesForm({ ...ratesForm, teacherRate: Number(e.target.value) })}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-indigo-300 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Quick Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="text-[10px] text-slate-500 self-center">Pilihan Cepat:</span>
                      {(ratesForm.teacherHonorSchemeType === 'sesi'
                        ? [25000, 35000, 40000, 50000, 75000, 100000]
                        : ratesForm.teacherHonorSchemeType === 'siswa'
                          ? [2000, 3500, 5000, 7500, 10000, 15000]
                          : [1200000, 1500000, 2000000, 2500000, 3000000]
                      ).map(val => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setRatesForm({ ...ratesForm, teacherRate: val })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                            ratesForm.teacherRate === val
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                          }`}
                        >
                          {formatRupiah(val)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transport allowance */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uang Transportasi Tentor per Kehadiran Sesi (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">Rp</span>
                    <input
                      type="number"
                      step="1000"
                      value={ratesForm.defaultTransportAllowance}
                      onChange={e => setRatesForm({ ...ratesForm, defaultTransportAllowance: Number(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      placeholder="0 (Jika tidak ada uang transport terpisah)"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Bermanfaat untuk bimbel privat yang memberikan tambahan transport per sesi kunjungan guru ke rumah.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alasan / Catatan Perubahan (Tercatat di Audit Log) *
                  </label>
                  <input
                    type="text"
                    value={ratesForm.reason}
                    onChange={e => setRatesForm({ ...ratesForm, reason: e.target.value })}
                    placeholder="Contoh: Penyesuaian tarif tahun ajaran baru atau promo semester"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Tarif & Skema Master</span>
                </button>
              </form>
            </div>

            {/* Right: Real-time Margin & Profit Simulator */}
            <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Simulasi Finansial & Margin Lembaga</span>
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    Real-time
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Uji proyeksi pendapatan, beban honor pengajar, dan keuntungan bersih bimbel untuk setiap sesi pertemuan:
                </p>

                {/* Slider */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 my-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      Simulasi Jumlah Siswa Hadir per Pertemuan:
                    </span>
                    <strong className="text-indigo-700 text-sm font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {simulatedStudents} Siswa
                    </strong>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={simulatedStudents}
                    onChange={e => setSimulatedStudents(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>1 Siswa (Privat)</span>
                    <span>5 Siswa (Semi-Privat)</span>
                    <span>10 Siswa (Reguler)</span>
                    <span>20 Siswa (Maks)</span>
                  </div>
                </div>

                {/* Calculation Breakdown Cards */}
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-emerald-800">
                        Total Omset Masuk dari Siswa
                      </p>
                      <p className="text-[10px] text-emerald-600">
                        {simRevenueFormulaLabel}
                      </p>
                    </div>
                    <strong className="text-base font-black text-emerald-900">
                      +{formatRupiah(simGrossRevenue)}
                    </strong>
                  </div>

                  <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-800">
                        Total Beban Honor Guru
                      </p>
                      <p className="text-[10px] text-indigo-600">
                        {simTeacherHonorFormulaLabel}
                      </p>
                    </div>
                    <strong className="text-base font-black text-indigo-900">
                      -{formatRupiah(simTotalTeacherHonor)}
                    </strong>
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-300">
                        Margin Bersih Lembaga (Gross Profit)
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Pendapatan Kotor dikurangi Beban Honor Tentor
                      </p>
                    </div>
                    <div className="text-right">
                      <strong className="text-lg font-black text-emerald-400 block">
                        ={formatRupiah(simNetInstitutionMargin)}
                      </strong>
                      <span className="text-[10px] font-bold text-slate-300">
                        Margin: {simMarginPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips & Guidance */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1 mt-4">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  Tips Fleksibilitas Harga:
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Selain tarif master di atas, Anda juga dapat menetapkan <strong>Tarif Khusus per Program</strong> (misal: Les Privat vs Kelas Reguler) pada menu <em>Program Belajar</em>, atau <strong>Honor Khusus per Tentor</strong> pada menu <em>Tentor & Guru</em>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROFIL & LEGALITAS BIMBEL */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span>Identitas Resmi Lembaga / Bimbel</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Data ini akan tercetak otomatis pada kop surat, invoice tagihan, kuitansi pembayaran, dan laporan keuangan resmi.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lembaga / Bimbel *
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Contoh: Bimbingan Belajar Insan Cerdas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Slogan / Tagline Lembaga
                </label>
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={e => setProfileForm({ ...profileForm, tagline: e.target.value })}
                  placeholder="Contoh: Solusi Meraih Prestasi Akademik & Sukses Ujian"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pimpinan / Kepala Cabang *
                  </label>
                  <input
                    type="text"
                    value={profileForm.principalName}
                    onChange={e => setProfileForm({ ...profileForm, principalName: e.target.value })}
                    placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP / No. Izin Operasional
                  </label>
                  <input
                    type="text"
                    value={profileForm.principalNip}
                    onChange={e => setProfileForm({ ...profileForm, principalNip: e.target.value })}
                    placeholder="Contoh: NIP. 19800512 200501 1 002"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Gedung / Kantor Bimbel
                </label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Contoh: Jl. Pemuda No. 45, Kompleks Ruko Pelajar, Jakarta Selatan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon Kantor
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Administrasi
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="admin@bimbel.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tahun Ajaran Aktif
                  </label>
                  <input
                    type="text"
                    value={profileForm.academicYear}
                    onChange={e => setProfileForm({ ...profileForm, academicYear: e.target.value })}
                    placeholder="2026/2027"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Website Resmi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={profileForm.website}
                    onChange={e => setProfileForm({ ...profileForm, website: e.target.value })}
                    placeholder="https://bimbel.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil Lembaga</span>
              </button>
            </form>
          </div>

          {/* Live Kop Surat / Invoice Header Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Pratinjau Kop Surat & Kuitansi Resmi</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tampilan header yang dicetak saat mengekspor kuitansi siswa atau slip honor pengajar:
              </p>

              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 text-center">
                <div className="border-b-2 border-slate-800 pb-3">
                  <h2 className="font-black text-slate-900 text-base uppercase tracking-wider">
                    {profileForm.name || 'NAMA BIMBINGAN BELAJAR'}
                  </h2>
                  <p className="text-[11px] text-indigo-600 font-semibold italic">
                    {profileForm.tagline || 'Slogan Bimbel Anda'}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {profileForm.address || 'Alamat Lembaga'} • Telp/WA: {profileForm.phone || '-'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Email: {profileForm.email || '-'} • TA: {profileForm.academicYear}
                  </p>
                </div>

                <div className="text-left text-[11px] text-slate-700 pt-1 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>CONTOH INVOICE TAGIHAN</span>
                    <span className="font-mono text-indigo-700">INV-2026-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nama Siswa:</span>
                    <span>Kevin Sanjaya (SMP)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Kewajiban:</span>
                    <strong className="text-emerald-700 font-black">
                      {formatRupiah(ratesForm.studentRate * 4)}
                    </strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 text-right text-[10px] text-slate-600">
                  <p>Mengetahui,</p>
                  <p className="font-bold text-slate-900 mt-4 underline">
                    {profileForm.principalName || 'Nama Pimpinan'}
                  </p>
                  <p className="text-[9px]">{profileForm.principalNip || '-'}</p>
                </div>
              </div>
            </div>

            {/* Pengelolaan Data & Pembersihan Database */}
            <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Pengelolaan Data & Pembersihan Database</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pastikan bimbel Anda bebas dari data demo contoh sebelum digunakan untuk operasional nyata.
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto ${
                  isDemoCleaned 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {isDemoCleaned ? 'Database Bersih (Aktif)' : 'Data Demo Terdeteksi'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Status Database Bimbel Anda:</p>
                <p>
                  {isDemoCleaned 
                    ? 'Database Anda saat ini dalam kondisi bersih 100% tanpa sisa data demo. Anda dapat langsung memasukkan siswa, guru, jadwal, dan transaksi asli bimbel Anda.'
                    : 'Sistem saat ini masih memuat data contoh/demo. Jika Anda ingin mengosongkan seluruh data siswa, tentor, dan jadwal agar bersih tanpa sisa, klik tombol Kosongkan Data Demo di bawah.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClearDemoData}
                  disabled={isClearingData}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isClearingData ? 'Sedang Mengosongkan Data...' : 'Kosongkan Seluruh Data Demo (Mulai Dari Bersih)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset database kembali ke dataset demo awal? Semua data saat ini akan ditimpa dengan data contoh.')) {
                      resetToDefaultData();
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>Isi Data Demo Awal (Untuk Uji Coba)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REKENING & KEBIJAKAN TAGIHAN */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span>Pengaturan Rekening Pembayaran Siswa</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekening resmi untuk pembayaran iuran les siswa, otomatis tertera pada kuitansi dan pesan WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSaveBilling} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Bank Penerima *
                  </label>
                  <input
                    type="text"
                    value={billingForm.bankName}
                    onChange={e => setBillingForm({ ...billingForm, bankName: e.target.value })}
                    placeholder="BCA / Mandiri / BRI / BNI / BSI"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Rekening Bank *
                  </label>
                  <input
                    type="text"
                    value={billingForm.bankAccountNumber}
                    onChange={e => setBillingForm({ ...billingForm, bankAccountNumber: e.target.value })}
                    placeholder="Contoh: 8735-0921-88"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Atas Nama Pemilik Rekening *
                </label>
                <input
                  type="text"
                  value={billingForm.bankAccountHolder}
                  onChange={e => setBillingForm({ ...billingForm, bankAccountHolder: e.target.value })}
                  placeholder="Contoh: Yayasan EduCendikia Utama atau Nama Pengelola"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Jatuh Tempo Bulanan
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Tanggal</span>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={billingForm.billingDueDay}
                      onChange={e => setBillingForm({ ...billingForm, billingDueDay: Number(e.target.value) })}
                      className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <span className="text-slate-500">setiap bulan</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Info QRIS / E-Wallet (Opsional)
                  </label>
                  <input
                    type="text"
                    value={billingForm.qrisInfo}
                    onChange={e => setBillingForm({ ...billingForm, qrisInfo: e.target.value })}
                    placeholder="NMID / DANA / OVO / GoPay"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Petunjuk & Catatan Pembayaran Siswa
                </label>
                <textarea
                  rows={3}
                  value={billingForm.billingInstructions}
                  onChange={e => setBillingForm({ ...billingForm, billingInstructions: e.target.value })}
                  placeholder="Tulis instruksi konfirmasi bukti transfer atau catatan administrasi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Rekening & Kebijakan Tagihan</span>
              </button>
            </form>
          </div>

          {/* Card Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase">
                  REKENING RESMI LEMBAGA
                </span>
                <Landmark className="w-5 h-5 text-indigo-300" />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400">Nama Bank:</p>
                <p className="text-base font-bold text-white tracking-wide">
                  {billingForm.bankName || 'BANK BELUM DIATUR'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400">Nomor Rekening:</p>
                <p className="text-xl font-mono font-black text-amber-300 tracking-wider">
                  {billingForm.bankAccountNumber || 'xxxx-xxxx-xxxx'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400">Atas Nama:</p>
                  <p className="font-semibold text-white">
                    {billingForm.bankAccountHolder || settings.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Jatuh Tempo:</p>
                  <p className="font-semibold text-emerald-400">
                    Tgl {billingForm.billingDueDay} tiap bulan
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Otomasi Terintegrasi
              </p>
              <p className="text-[11px] leading-relaxed">
                Informasi rekening ini langsung tampil di halaman <strong>Piutang Siswa</strong> dan otomatis disisipkan saat admin menekan tombol <em>Kirim Pengingat WhatsApp</em> kepada orang tua siswa.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEMPLATE WHATSAPP TAGIHAN */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Kustomisasi Template Pengingat Tagihan WhatsApp</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sesuaikan gaya bahasa dan format pesan penagihan yang ramah dan profesional untuk dikirimkan ke wali murid.
              </p>
            </div>

            <form onSubmit={handleSaveWaTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tag / Variabel Dinamis yang Tersedia:
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 font-mono text-[10px] text-indigo-700">
                  <span className="bg-white px-2 py-0.5 rounded border">{"{nama_siswa}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{nis_siswa}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{kelas}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{nama_bimbel}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{tanggal}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{jumlah_sesi}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{total_tagihan}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{nama_bank}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{no_rekening}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{atas_nama}"}</span>
                  <span className="bg-white px-2 py-0.5 rounded border">{"{jatuh_tempo}"}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Format Teks Pesan Template:
                </label>
                <textarea
                  rows={12}
                  value={waTemplate}
                  onChange={e => setWaTemplate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Template WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(waTemplate)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-300 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Salin Template</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Live Preview of simulated WhatsApp bubble */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#ECE5DD] p-4 rounded-2xl border border-slate-300 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D4CEB8]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    WA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Pratinjau Chat WhatsApp Wali Murid
                    </p>
                    <p className="text-[10px] text-slate-500">Online • Notifikasi Resmi</p>
                  </div>
                </div>
              </div>

              {/* Chat bubble */}
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-xs text-xs text-slate-800 space-y-2 whitespace-pre-wrap leading-relaxed font-sans border border-slate-200/60">
                <p>
                  Yth. Bapak/Ibu Wali dari <strong>Andi Saputra</strong> (NIS: NIS-2026-001),
                </p>
                <p>
                  Salam hangat dari <strong>{settings.name}</strong>.
                </p>
                <p>
                  Melalui pesan ini, kami menyampaikan rincian tagihan bimbingan belajar per tanggal <strong>{formatDateIndonesian(new Date().toISOString().split('T')[0])}</strong>:
                </p>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[11px] space-y-0.5">
                  <p>• Siswa: <strong>Andi Saputra</strong> (Kelas 8 SMP)</p>
                  <p>• Sesi Hadir Belum Lunas: 4 Pertemuan</p>
                  <p className="text-emerald-700 font-bold">• <strong>Total Tagihan: {formatRupiah(ratesForm.studentRate * 4)}</strong></p>
                </div>
                <div className="p-2 bg-indigo-50/70 rounded-lg border border-indigo-100 text-[11px] space-y-0.5">
                  <p className="font-bold text-indigo-900">💳 Informasi Pembayaran:</p>
                  <p>• Bank: <strong>{billingForm.bankName}</strong></p>
                  <p>• No. Rekening: <strong>{billingForm.bankAccountNumber}</strong></p>
                  <p>• Atas Nama: <strong>{billingForm.bankAccountHolder}</strong></p>
                  <p>• Jatuh Tempo: <strong>Tanggal {billingForm.billingDueDay} setiap bulan</strong></p>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  {billingForm.billingInstructions}
                </p>
                <div className="text-right text-[9px] text-slate-400 pt-1">
                  10:15 ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT TRAIL RIWAYAT PERUBAHAN TARIF */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Audit Trail Riwayat Perubahan Tarif Lembaga</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap pergantian tarif tercatat permanen untuk akuntabilitas transparansi yayasan / pemilik bimbel
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
              {rateHistories.length} Log Perubahan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Waktu Efektif</th>
                  <th className="px-4 py-3 font-semibold text-right">Tarif Siswa</th>
                  <th className="px-4 py-3 font-semibold text-right">Honor Guru</th>
                  <th className="px-4 py-3 font-semibold">Tipe Tarif</th>
                  <th className="px-4 py-3 font-semibold">Diubah Oleh</th>
                  <th className="px-4 py-3 font-semibold">Alasan / Catatan Penyesuaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rateHistories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Belum ada riwayat perubahan tarif.
                    </td>
                  </tr>
                ) : (
                  rateHistories.map(hist => {
                    const stdRateVal = hist.studentRate || hist.value || (hist.rateType === 'STUDENT_CHARGE' ? hist.value : undefined);
                    const tchRateVal = hist.teacherRate || hist.value || (hist.rateType === 'TEACHER_HONOR' ? hist.value : undefined);

                    return (
                      <tr key={hist.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                          {formatDateIndonesian(hist.effectiveDate || hist.createdAt?.split('T')[0] || '2026-01-01')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {stdRateVal ? formatRupiah(stdRateVal) : '-'}
                          {hist.studentBillingScheme && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({hist.studentBillingScheme === 'perbulan' ? 'Per Bulan' : hist.studentBillingScheme === 'pertahun' ? 'Per Tahun' : 'Per Sesi'})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-700 whitespace-nowrap">
                          {tchRateVal ? formatRupiah(tchRateVal) : '-'}
                          {hist.teacherHonorSchemeType && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({hist.teacherHonorSchemeType === 'sesi' ? 'Per Sesi' : hist.teacherHonorSchemeType === 'bulan' ? 'Per Bulan' : 'Per Siswa'})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {hist.rateType || hist.type || 'TARIF_MASTER'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {hist.setBy || hist.changedBy || 'Administrator'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {hist.notes || hist.reason || 'Penyesuaian tarif bimbingan belajar'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: HAK AKSES & PENGGUNA */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Matriks Pemisahan Hak Akses & Operasional</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem memisahkan secara ketat kewenangan Administrator Lembaga dan Tentor Pengajar demi menjaga integritas keuangan bimbel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 uppercase text-[11px] flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  1. Peran Administrator Lembaga
                </span>
                <span className="px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded text-[10px] font-bold">
                  Full Access
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-700 text-[11px] list-disc pl-4 leading-relaxed">
                <li>Mengubah nama bimbel, logo, alamat, dan nomor kontak resmi.</li>
                <li>Menentukan dan mengubah Master Tarif Siswa & Honor Pengajar.</li>
                <li>Menyetel tarif kustom per program atau per tentor senior.</li>
                <li>Menerima pembayaran iuran siswa dan mencetak kuitansi resmi.</li>
                <li>Menyalurkan pembayaran honor guru bulanan beserta slip transfer.</li>
                <li>Mencatat pengeluaran operasional (sewa ruko, listrik, ATK, modul).</li>
                <li>Mengirim broadcast pengumuman atau pengingat jadwal langsung ke tentor.</li>
              </ul>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 uppercase text-[11px] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  2. Peran Tentor / Guru Pengajar
                </span>
                <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded text-[10px] font-bold">
                  Khusus Mengajar
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-700 text-[11px] list-disc pl-4 leading-relaxed">
                <li>Melihat jadwal mengajar pribadi dan daftar siswa yang diampu.</li>
                <li>Membuka sesi pertemuan kelas les saat jam mengajar dimulai.</li>
                <li>Menandai absensi kehadiran siswa (Hadir, Sakit, Izin, Alpa).</li>
                <li>Satu klik simpan absensi otomatis memicu tagihan siswa & honor guru.</li>
                <li>Menerima pengumuman broadcast dan pengingat jadwal dari admin bimbel.</li>
                <li>Melihat transparansi akumulasi honor mengajar dan riwayat pembayaran.</li>
                <li>Tidak dapat mengubah tarif master maupun menghapus riwayat audit.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INPUT MANUAL / EDIT MODEL BIMBEL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        title={editingPresetId ? 'Edit Model Bimbel' : 'Input Manual Model Bimbel Baru'}
        description="Atur nama, label kategori, serta kombinasi tarif siswa & honor guru untuk disimpan sebagai model bimbel siap pakai."
        maxWidth="lg"
      >
        <form onSubmit={handleSavePreset} className="space-y-4">
          {/* Identitas Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Nama Model Bimbel *
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Bimbel Bahasa Asing Intensif"
                value={presetForm.name}
                onChange={e => setPresetForm({ ...presetForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Label Kategori / Badge
              </label>
              <input
                type="text"
                placeholder="Misal: High Value, Weekend"
                value={presetForm.badge}
                onChange={e => setPresetForm({ ...presetForm, badge: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Deskripsi Ringkas Format Kelas
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Format privat 1 guru 1 siswa atau kelompok kecil 3 siswa dengan modul intensif..."
              value={presetForm.description}
              onChange={e => setPresetForm({ ...presetForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Skema & Tarif Siswa */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950">
                1. Skema & Nominal Tarif Iuran Siswa *
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Tagihan ke orang tua/siswa
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['persesi', 'perbulan', 'pertahun'] as StudentBillingScheme[]).map(scheme => (
                <button
                  type="button"
                  key={scheme}
                  onClick={() => setPresetForm({ ...presetForm, studentBillingScheme: scheme })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                    presetForm.studentBillingScheme === scheme
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  {scheme === 'persesi' ? 'Per Sesi' : scheme === 'perbulan' ? 'Per Bulan' : 'Per Tahun'}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">Rp</span>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={presetForm.studentRate}
                onChange={e => setPresetForm({ ...presetForm, studentRate: Number(e.target.value) })}
                className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] text-slate-500 self-center">Pilihan cepat:</span>
              {(presetForm.studentBillingScheme === 'persesi'
                ? [8000, 15000, 25000, 35000, 50000, 65000]
                : presetForm.studentBillingScheme === 'perbulan'
                  ? [150000, 200000, 250000, 350000, 500000]
                  : [1500000, 2500000, 3500000, 5000000]
              ).map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setPresetForm({ ...presetForm, studentRate: val })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    presetForm.studentRate === val
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Skema & Honor Tentor */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-950">
                2. Skema & Nominal Honor Tentor / Guru *
              </label>
              <span className="text-[10px] text-indigo-700 font-semibold">
                Kompensasi pengajar
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['sesi', 'siswa', 'bulan'] as TeacherHonorSchemeType[]).map(scheme => (
                <button
                  type="button"
                  key={scheme}
                  onClick={() => setPresetForm({ ...presetForm, teacherHonorSchemeType: scheme })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                    presetForm.teacherHonorSchemeType === scheme
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {scheme === 'sesi' ? 'Per Sesi (Flat)' : scheme === 'siswa' ? 'Per Siswa' : 'Per Bulan'}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">Rp</span>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={presetForm.teacherRate}
                onChange={e => setPresetForm({ ...presetForm, teacherRate: Number(e.target.value) })}
                className="w-full pl-9 pr-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] text-slate-500 self-center">Pilihan cepat:</span>
              {(presetForm.teacherHonorSchemeType === 'sesi'
                ? [15000, 25000, 40000, 50000, 75000]
                : presetForm.teacherHonorSchemeType === 'siswa'
                  ? [2000, 3500, 5000, 10000, 15000]
                  : [1000000, 1500000, 2000000, 2500000]
              ).map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setPresetForm({ ...presetForm, teacherRate: val })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                    presetForm.teacherRate === val
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {formatRupiah(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Transport & Program Pendukung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Uang Transport Tentor per Sesi
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={presetForm.transportAllowance}
                  onChange={e => setPresetForm({ ...presetForm, transportAllowance: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Contoh Program Terkait (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Paket Privat TOEFL Camp"
                value={presetForm.sampleProgram}
                onChange={e => setPresetForm({ ...presetForm, sampleProgram: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Slogan / Catatan */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Slogan / Catatan Model (Opsional)
            </label>
            <input
              type="text"
              placeholder="Misal: Pendampingan intensif bergaransi nilai memuaskan"
              value={presetForm.tagline}
              onChange={e => setPresetForm({ ...presetForm, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Toggle Apply Immediately */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={presetForm.applyImmediately}
                onChange={e => setPresetForm({ ...presetForm, applyImmediately: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Langsung terapkan model ini ke formulir Master Tarif saat disimpan
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPresetModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingPresetId ? 'Perbarui Model' : 'Simpan Model Bimbel'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
