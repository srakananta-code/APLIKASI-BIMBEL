import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Power,
  Users,
  Calendar,
  Search,
  Eye,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
  Tag,
  Percent,
  Gift,
  BadgePercent,
  Check,
  CalendarDays,
  ShieldCheck,
  HelpCircle,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, calculateDiscount } from '../../services/businessLogic';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Program } from '../../types';

export const ProgramsPage: React.FC = () => {
  const {
    programs,
    students,
    teachers,
    schedules,
    settings,
    createProgram,
    updateProgram,
    toggleProgramStatus
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassType, setFilterClassType] = useState<string>('ALL');
  const [filterBillingModel, setFilterBillingModel] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [selectedProgramDetail, setSelectedProgramDetail] = useState<Program | null>(null);
  const [deactivatingProgram, setDeactivatingProgram] = useState<Program | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'SMP',
    classType: 'REGULER',
    description: '',
    targetGrade: 'Kelas 7, 8, 9 SMP',

    // Billing Model Siswa
    billingModel: 'PER_PERTEMUAN' as 'PER_PERTEMUAN' | 'PER_MINGGU' | 'PER_BULAN' | 'PAKET',
    studentRate: settings.studentRate || 8000,
    weeklyRate: 25000,
    monthlyRate: 150000,
    packageSessions: 12,
    packageValidityDuration: '1 Bulan',
    packagePrice: 300000,

    // Diskon
    hasDiscount: false,
    discountType: 'NOMINAL' as 'NONE' | 'NOMINAL' | 'PERSEN',
    discountValue: 30000,
    discountName: 'Promo Pendaftaran Awal',

    // Skema Honor Tentor
    teacherHonorScheme: 'PER_SISWA' as 'PER_SISWA' | 'PER_SESI' | 'BULANAN',
    teacherHonorRate: settings.teacherRate || 2000,
    monthlyHonorRate: 1500000,
    transportAllowance: 0,

    sessionDurationMinutes: 60,
    maxStudents: 15,
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredPrograms = programs.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.classType || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchClassType = filterClassType === 'ALL' || (p.classType || 'REGULER') === filterClassType;
    const matchBilling = filterBillingModel === 'ALL' || (p.billingModel || 'PER_PERTEMUAN') === filterBillingModel;
    const matchCategory = filterCategory === 'ALL' || p.category === filterCategory;

    return matchSearch && matchClassType && matchBilling && matchCategory;
  });

  const handleOpenCreateModal = () => {
    const nextCode = `PRG-${String(programs.length + 1).padStart(2, '0')}`;
    setEditingProgram(null);
    setFormData({
      name: '',
      code: nextCode,
      category: 'SMP',
      classType: 'REGULER',
      description: '',
      targetGrade: 'Kelas 7, 8, 9 SMP',
      billingModel: 'PER_PERTEMUAN',
      studentRate: settings.studentRate || 8000,
      weeklyRate: 25000,
      monthlyRate: 150000,
      packageSessions: 12,
      packageValidityDuration: '1 Bulan',
      packagePrice: 300000,
      hasDiscount: false,
      discountType: 'NOMINAL',
      discountValue: 30000,
      discountName: 'Promo Pendaftaran Awal',
      teacherHonorScheme: 'PER_SISWA',
      teacherHonorRate: settings.teacherRate || 2000,
      monthlyHonorRate: 1500000,
      transportAllowance: 0,
      sessionDurationMinutes: 60,
      maxStudents: 15,
      status: 'AKTIF'
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (prog: Program) => {
    setEditingProgram(prog);
    setFormData({
      name: prog.name,
      code: prog.code,
      category: prog.category,
      classType: prog.classType || 'REGULER',
      description: prog.description || '',
      targetGrade: prog.targetGrade || '',
      billingModel: prog.billingModel || 'PER_PERTEMUAN',
      studentRate: prog.studentRate ?? settings.studentRate ?? 8000,
      weeklyRate: prog.weeklyRate ?? 25000,
      monthlyRate: prog.monthlyRate ?? 150000,
      packageSessions: prog.packageSessions ?? 12,
      packageValidityDuration: prog.packageValidityDuration || '1 Bulan',
      packagePrice: prog.packagePrice ?? 300000,
      hasDiscount: !!prog.hasDiscount,
      discountType: prog.discountType || 'NONE',
      discountValue: prog.discountValue || 0,
      discountName: prog.discountName || '',
      teacherHonorScheme: prog.teacherHonorScheme || 'PER_SISWA',
      teacherHonorRate: prog.teacherHonorRate ?? settings.teacherRate ?? 2000,
      monthlyHonorRate: prog.monthlyHonorRate ?? 1500000,
      transportAllowance: prog.transportAllowance ?? 0,
      sessionDurationMinutes: prog.sessionDurationMinutes ?? 60,
      maxStudents: prog.maxStudents ?? 15,
      status: prog.status
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Preset Template Quick Fillers
  const applyPresetTemplate = (type: 'PAKET_12' | 'BULANAN_SPP' | 'REGULER_SESI' | 'PRIVAT_FLAT') => {
    if (type === 'PAKET_12') {
      setFormData(prev => ({
        ...prev,
        name: prev.name || 'Paket 12 Pertemuan Sukses Ujian',
        billingModel: 'PAKET',
        packageSessions: 12,
        packageValidityDuration: '1 Bulan',
        packagePrice: 300000,
        hasDiscount: true,
        discountType: 'NOMINAL',
        discountValue: 30000,
        discountName: 'Diskon Pendaftaran Awal',
        teacherHonorScheme: 'PER_SESI',
        teacherHonorRate: 15000,
        transportAllowance: 5000
      }));
    } else if (type === 'BULANAN_SPP') {
      setFormData(prev => ({
        ...prev,
        name: prev.name || 'Bimbel Reguler SPP Bulanan',
        billingModel: 'PER_BULAN',
        monthlyRate: 150000,
        hasDiscount: false,
        teacherHonorScheme: 'BULANAN',
        monthlyHonorRate: 1500000,
        transportAllowance: 5000
      }));
    } else if (type === 'REGULER_SESI') {
      setFormData(prev => ({
        ...prev,
        name: prev.name || 'Kelas Reguler Per Pertemuan',
        billingModel: 'PER_PERTEMUAN',
        studentRate: 8000,
        hasDiscount: false,
        teacherHonorScheme: 'PER_SISWA',
        teacherHonorRate: 2000,
        transportAllowance: 0
      }));
    } else if (type === 'PRIVAT_FLAT') {
      setFormData(prev => ({
        ...prev,
        name: prev.name || 'Les Privat 1-on-1 Intensif',
        classType: 'PRIVAT',
        billingModel: 'PER_PERTEMUAN',
        studentRate: 65000,
        hasDiscount: false,
        teacherHonorScheme: 'PER_SESI',
        teacherHonorRate: 40000,
        transportAllowance: 10000,
        maxStudents: 1
      }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Nama program wajib diisi';
    if (!formData.code.trim()) errors.code = 'Kode program wajib diisi';

    // Check code uniqueness
    const duplicate = programs.find(
      p => p.code.trim().toLowerCase() === formData.code.trim().toLowerCase() && p.id !== editingProgram?.id
    );
    if (duplicate) {
      errors.code = `Kode program ${formData.code} sudah digunakan oleh ${duplicate.name}`;
    }

    if (formData.billingModel === 'PER_PERTEMUAN' && formData.studentRate <= 0) {
      errors.studentRate = 'Tarif per sesi harus lebih besar dari Rp 0';
    }
    if (formData.billingModel === 'PER_MINGGU' && formData.weeklyRate <= 0) {
      errors.weeklyRate = 'Tarif mingguan harus lebih besar dari Rp 0';
    }
    if (formData.billingModel === 'PER_BULAN' && formData.monthlyRate <= 0) {
      errors.monthlyRate = 'Tarif bulanan harus lebih besar dari Rp 0';
    }
    if (formData.billingModel === 'PAKET') {
      if (formData.packagePrice <= 0) errors.packagePrice = 'Biaya paket harus lebih besar dari Rp 0';
      if (formData.packageSessions <= 0) errors.packageSessions = 'Jumlah pertemuan harus minimal 1 sesi';
    }

    if (formData.hasDiscount) {
      if (formData.discountValue <= 0) {
        errors.discountValue = 'Nominal diskon harus lebih besar dari 0';
      }
      if (formData.discountType === 'PERSEN' && formData.discountValue > 100) {
        errors.discountValue = 'Diskon persen tidak boleh melebihi 100%';
      }
    }

    if (formData.teacherHonorScheme === 'BULANAN' && formData.monthlyHonorRate < 0) {
      errors.monthlyHonorRate = 'Gaji bulanan tidak boleh negatif';
    } else if (formData.teacherHonorRate < 0) {
      errors.teacherHonorRate = 'Honor guru tidak boleh negatif';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Derived effective session price for student
    let effectiveSessionRate = formData.studentRate;
    if (formData.billingModel === 'PAKET' && formData.packageSessions > 0) {
      effectiveSessionRate = Math.round(formData.packagePrice / formData.packageSessions);
    } else if (formData.billingModel === 'PER_BULAN') {
      effectiveSessionRate = Math.round(formData.monthlyRate / 12);
    } else if (formData.billingModel === 'PER_MINGGU') {
      effectiveSessionRate = Math.round(formData.weeklyRate / 3);
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      category: formData.category,
      classType: formData.classType,
      description: formData.description.trim(),
      targetGrade: formData.targetGrade.trim(),

      // Billing model
      billingModel: formData.billingModel,
      studentRate: effectiveSessionRate,
      weeklyRate: Number(formData.weeklyRate) || 0,
      monthlyRate: Number(formData.monthlyRate) || 0,
      packageSessions: Number(formData.packageSessions) || 12,
      packageValidityDuration: formData.packageValidityDuration || '1 Bulan',
      packagePrice: Number(formData.packagePrice) || 0,

      // Discount
      hasDiscount: formData.hasDiscount,
      discountType: formData.hasDiscount ? formData.discountType : 'NONE',
      discountValue: formData.hasDiscount ? Number(formData.discountValue) : 0,
      discountName: formData.hasDiscount ? formData.discountName.trim() : '',

      // Teacher Honor
      teacherHonorScheme: formData.teacherHonorScheme,
      teacherHonorRate: Number(formData.teacherHonorRate) || 0,
      monthlyHonorRate: Number(formData.monthlyHonorRate) || 0,
      transportAllowance: Number(formData.transportAllowance) || 0,

      sessionDurationMinutes: Number(formData.sessionDurationMinutes) || 60,
      maxStudents: Number(formData.maxStudents) || 15,
      status: formData.status
    };

    if (editingProgram) {
      updateProgram(editingProgram.id, payload);
    } else {
      createProgram(payload);
    }
    setIsFormModalOpen(false);
  };

  // Helper labels
  const getClassTypeBadge = (classType?: string) => {
    switch (classType) {
      case 'PRIVAT':
        return { label: 'Les Privat (1-on-1)', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'SEMI_PRIVAT':
        return { label: 'Semi-Privat (2-5)', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'INTENSIF_UTBK':
        return { label: 'Intensif UTBK / SNBT', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'KEDINASAN':
        return { label: 'Persiapan Kedinasan', color: 'bg-sky-100 text-sky-800 border-sky-200' };
      default:
        return { label: 'Kelas Reguler', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
  };

  const getBillingBadge = (prog: Partial<Program>) => {
    switch (prog.billingModel) {
      case 'PAKET':
        return {
          label: `Paket ${prog.packageSessions || 12} Sesi (${prog.packageValidityDuration || '1 Bulan'})`,
          color: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
        };
      case 'PER_BULAN':
        return {
          label: 'Bulanan / SPP',
          color: 'bg-blue-50 text-blue-900 border-blue-300 font-semibold'
        };
      case 'PER_MINGGU':
        return {
          label: 'Tagihan Mingguan',
          color: 'bg-teal-50 text-teal-900 border-teal-300 font-semibold'
        };
      default:
        return {
          label: 'Per Pertemuan / Kehadiran',
          color: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
        };
    }
  };

  const getTeacherSchemeBadge = (scheme?: string) => {
    switch (scheme) {
      case 'PER_SESI':
        return { label: 'Honor Flat / Sesi', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'BULANAN':
        return { label: 'Gaji Bulanan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: 'Per Siswa / Sesi', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Live simulation for form
  const getBaseStudentPrice = () => {
    if (formData.billingModel === 'PAKET') return formData.packagePrice;
    if (formData.billingModel === 'PER_BULAN') return formData.monthlyRate;
    if (formData.billingModel === 'PER_MINGGU') return formData.weeklyRate;
    return formData.studentRate;
  };

  const currentBasePrice = getBaseStudentPrice();
  const currentDiscountCalc = calculateDiscount(
    currentBasePrice,
    formData.hasDiscount ? formData.discountType : 'NONE',
    formData.discountValue
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Program Belajar & Paket Bimbel
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {programs.length} Program
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Atur siklus tagihan (per pertemuan, mingguan, bulanan, paket sesi), diskon promo, dan skema honor tentor.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Program & Paket Baru</span>
        </button>
      </div>

      {/* Quick Feature Banner for Admin */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-indigo-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Fleksibilitas Penuh Skema Bimbel
            </span>
          </div>
          <h2 className="text-base font-black text-white">
            Konfigurasi Mudah untuk Beragam Model Kursus & Bimbel
          </h2>
          <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
            Mendukung tagihan <strong>per pertemuan</strong>, <strong>per minggu</strong>, <strong>bulanan (SPP)</strong>, atau <strong>paket kuota</strong> (contoh: paket 12 pertemuan Rp300.000), diskon nominal/persen, serta honor tentor per siswa, per sesi, atau gaji bulanan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => {
              handleOpenCreateModal();
              applyPresetTemplate('PAKET_12');
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 text-white text-xs font-bold border border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Preset Paket 12 Sesi</span>
          </button>
          <button
            onClick={() => {
              handleOpenCreateModal();
              applyPresetTemplate('BULANAN_SPP');
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 text-white text-xs font-bold border border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-sky-300" />
            <span>Preset SPP Bulanan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari program, kode, jenjang..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={filterBillingModel}
            onChange={e => setFilterBillingModel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="ALL">Semua Model Tagihan</option>
            <option value="PER_PERTEMUAN">Per Pertemuan</option>
            <option value="PAKET">Paket Kuota</option>
            <option value="PER_BULAN">Bulanan (SPP)</option>
            <option value="PER_MINGGU">Per Minggu</option>
          </select>

          <select
            value={filterClassType}
            onChange={e => setFilterClassType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="ALL">Semua Tipe Kelas</option>
            <option value="REGULER">Kelas Reguler</option>
            <option value="PRIVAT">Les Privat (1-on-1)</option>
            <option value="SEMI_PRIVAT">Semi-Privat</option>
            <option value="INTENSIF_UTBK">Intensif UTBK</option>
            <option value="KEDINASAN">Kedinasan</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="ALL">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
            <option value="UMUM">Umum</option>
          </select>
        </div>
      </div>

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPrograms.map(prog => {
          const enrolledCount = students.filter(s => (s.programIds || []).includes(prog.id)).length;
          const scheduleCount = schedules.filter(s => s.programId === prog.id).length;
          const classBadge = getClassTypeBadge(prog.classType);
          const billingBadge = getBillingBadge(prog);
          const teacherSchemeBadge = getTeacherSchemeBadge(prog.teacherHonorScheme);

          // Pricing calculation with discount
          let baseDisplayPrice = prog.studentRate ?? settings.studentRate ?? 8000;
          let unitLabel = '/ sesi';
          if (prog.billingModel === 'PAKET') {
            baseDisplayPrice = prog.packagePrice ?? 300000;
            unitLabel = `/ paket (${prog.packageSessions || 12} sesi)`;
          } else if (prog.billingModel === 'PER_BULAN') {
            baseDisplayPrice = prog.monthlyRate ?? 150000;
            unitLabel = '/ bulan';
          } else if (prog.billingModel === 'PER_MINGGU') {
            baseDisplayPrice = prog.weeklyRate ?? 25000;
            unitLabel = '/ minggu';
          }

          const discountInfo = calculateDiscount(
            baseDisplayPrice,
            prog.hasDiscount ? (prog.discountType || 'NONE') : 'NONE',
            prog.discountValue || 0
          );

          return (
            <div
              key={prog.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                      {prog.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${classBadge.color}`}>
                      {classBadge.label}
                    </span>
                  </div>
                  <StatusBadge status={prog.status} size="sm" />
                </div>

                {/* Billing Model Badge */}
                <div className="mb-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border ${billingBadge.color}`}>
                    <CalendarDays className="w-3 h-3" />
                    <span>{billingBadge.label}</span>
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base tracking-tight mb-1.5">
                  {prog.name}
                </h3>

                <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                  {prog.description || 'Program bimbingan belajar terpadu dengan kurikulum terarah & tentor pilihan.'}
                </p>

                {/* Pricing & Honor Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-4 space-y-2.5 text-xs">
                  {/* Student Fee with Discount Support */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Biaya Les Siswa:</span>
                      <span className="text-[10px] text-slate-400">{unitLabel}</span>
                    </div>
                    <div className="text-right">
                      {prog.hasDiscount && discountInfo.discountAmount > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatRupiah(baseDisplayPrice)}
                          </span>
                          <strong className="text-emerald-700 font-black text-sm">
                            {formatRupiah(discountInfo.finalPrice)}
                          </strong>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 flex items-center gap-0.5 mt-0.5">
                            <Tag className="w-2.5 h-2.5" />
                            Hemat {formatRupiah(discountInfo.discountAmount)}
                          </span>
                        </div>
                      ) : (
                        <strong className="text-emerald-700 font-black text-sm">
                          {formatRupiah(baseDisplayPrice)}
                        </strong>
                      )}
                    </div>
                  </div>

                  {/* Teacher Honor Scheme */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Skema Honor Guru:</span>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border mt-0.5 ${teacherSchemeBadge.color}`}>
                        {teacherSchemeBadge.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <strong className="text-indigo-700 font-black text-sm">
                        {prog.teacherHonorScheme === 'BULANAN'
                          ? formatRupiah(prog.monthlyHonorRate || 1500000)
                          : formatRupiah(prog.teacherHonorRate ?? settings.teacherRate ?? 2000)}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">
                        {prog.teacherHonorScheme === 'BULANAN'
                          ? '/ bulan'
                          : (prog.teacherHonorScheme === 'PER_SESI' ? '/ sesi flat' : '/ siswa-sesi')}
                      </span>
                    </div>
                  </div>

                  {prog.transportAllowance ? (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Transport Tentor:</span>
                      <span className="font-semibold text-slate-700">+{formatRupiah(prog.transportAllowance)} / kehadiran</span>
                    </div>
                  ) : null}
                </div>

                {/* Details list */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Target Jenjang:</span>
                    <span className="text-slate-800 font-medium">{prog.targetGrade || prog.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Durasi & Kapasitas:</span>
                    <span className="text-slate-800">
                      {prog.sessionDurationMinutes || 60} Menit • Maks {prog.maxStudents || 15} Siswa
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Jadwal & Siswa:</span>
                    <span className="font-semibold text-indigo-700">
                      {scheduleCount} Jadwal Aktif • {enrolledCount} Siswa
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProgramDetail(prog)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detail & Margin</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(prog)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Program & Skema Tarif"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeactivatingProgram(prog)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      prog.status === 'AKTIF'
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={prog.status === 'AKTIF' ? 'Nonaktifkan Program' : 'Aktifkan Program'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            Tidak Ada Program Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Coba ubah kata kunci pencarian atau filter yang Anda gunakan untuk melihat daftar program bimbel.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
          >
            Buat Program Baru
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAIL PROGRAM MODAL */}
      {/* ========================================================================= */}
      {selectedProgramDetail && (
        <Modal
          isOpen={!!selectedProgramDetail}
          onClose={() => setSelectedProgramDetail(null)}
          title={`Detail Program: ${selectedProgramDetail.name}`}
          description={`Kode: ${selectedProgramDetail.code} • Kategori: ${selectedProgramDetail.category}`}
          maxWidth="2xl"
        >
          {(() => {
            const prog = selectedProgramDetail;
            const enrolledStudents = students.filter(s => (s.programIds || []).includes(prog.id));
            const progSchedules = schedules.filter(s => s.programId === prog.id);

            let baseDisplayPrice = prog.studentRate ?? settings.studentRate ?? 8000;
            if (prog.billingModel === 'PAKET') baseDisplayPrice = prog.packagePrice ?? 300000;
            else if (prog.billingModel === 'PER_BULAN') baseDisplayPrice = prog.monthlyRate ?? 150000;
            else if (prog.billingModel === 'PER_MINGGU') baseDisplayPrice = prog.weeklyRate ?? 25000;

            const disc = calculateDiscount(
              baseDisplayPrice,
              prog.hasDiscount ? (prog.discountType || 'NONE') : 'NONE',
              prog.discountValue || 0
            );

            return (
              <div className="space-y-5 text-xs">
                {/* Financial Structure Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Biaya Siswa ({prog.billingModel || 'PER_PERTEMUAN'})
                    </span>
                    <strong className="text-xl font-black text-emerald-900 block mt-1">
                      {formatRupiah(disc.finalPrice)}
                    </strong>
                    {prog.hasDiscount && disc.discountAmount > 0 && (
                      <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">
                        Harga Normal: {formatRupiah(baseDisplayPrice)} (-{formatRupiah(disc.discountAmount)})
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase block">
                      Honor Pengajar ({prog.teacherHonorScheme || 'PER_SISWA'})
                    </span>
                    <strong className="text-xl font-black text-indigo-900 block mt-1">
                      {prog.teacherHonorScheme === 'BULANAN'
                        ? formatRupiah(prog.monthlyHonorRate || 1500000)
                        : formatRupiah(prog.teacherHonorRate ?? settings.teacherRate ?? 2000)}
                    </strong>
                    <span className="text-[10px] text-indigo-700">
                      Transport: {formatRupiah(prog.transportAllowance || 0)} / sesi
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-xl">
                    <span className="text-[10px] font-bold text-slate-300 uppercase block">
                      Format & Kapasitas
                    </span>
                    <strong className="text-lg font-black text-amber-400 block mt-1">
                      {prog.classType || 'REGULER'}
                    </strong>
                    <span className="text-[10px] text-slate-400">
                      Maks: {prog.maxStudents || 15} Siswa • {prog.sessionDurationMinutes || 60} Menit
                    </span>
                  </div>
                </div>

                {/* Schedules */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Jadwal Pertemuan Aktif ({progSchedules.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {progSchedules.length === 0 ? (
                      <p className="text-slate-400 italic">Belum ada jadwal untuk program ini.</p>
                    ) : (
                      progSchedules.map(sch => {
                        const tch = teachers.find(t => t.id === sch.teacherId);
                        return (
                          <div key={sch.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-slate-900 block">{sch.dayOfWeek}, {sch.startTime} - {sch.endTime}</span>
                              <span className="text-[11px] text-slate-500">Tentor: {tch?.name || sch.teacherId}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border">
                              {sch.room || 'Ruang Kelas'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Enrolled Students */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Siswa Terdaftar ({enrolledStudents.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {enrolledStudents.length === 0 ? (
                      <p className="text-slate-400 italic">Belum ada siswa yang memilih program ini.</p>
                    ) : (
                      enrolledStudents.map(std => (
                        <div key={std.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{std.name}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({std.nis}) • {std.grade}</span>
                          </div>
                          <StatusBadge status={std.status} size="sm" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT PROGRAM MODAL WITH MULTI-CYCLE & DISCOUNT SUPPORT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingProgram ? 'Edit Program & Skema Tarif' : 'Tambah Program & Paket Baru'}
        description="Atur nama program, model tagihan siswa (per pertemuan, mingguan, bulanan, paket), diskon promo, dan honor tentor."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
          {/* Quick Preset Buttons (if creating new) */}
          {!editingProgram && (
            <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/80 space-y-2">
              <span className="text-[11px] font-bold text-indigo-900 block">
                ⚡ Template Siap Pakai (Klik untuk Isi Otomatis):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('PAKET_12')}
                  className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-left hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-indigo-900 block text-[10px]">Paket 12 Sesi</span>
                  <span className="text-[9px] text-slate-500">Rp300rb (Diskon 30rb)</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('BULANAN_SPP')}
                  className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-left hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-indigo-900 block text-[10px]">SPP Bulanan</span>
                  <span className="text-[9px] text-slate-500">Rp150rb/bulan</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('REGULER_SESI')}
                  className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-left hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-indigo-900 block text-[10px]">Reguler Sesi</span>
                  <span className="text-[9px] text-slate-500">Rp8rb / pertemuan</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('PRIVAT_FLAT')}
                  className="px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-left hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-indigo-900 block text-[10px]">Privat 1-on-1</span>
                  <span className="text-[9px] text-slate-500">Honor flat sesi</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Program Identity */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs pb-1 border-b border-slate-200">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              1. Identitas Program & Format Kelas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Program Belajar *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Paket 12 Pertemuan Sukses Ujian"
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                    formErrors.name ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {formErrors.name && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Program *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="PRG-01"
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                    formErrors.code ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {formErrors.code && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.code}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tipe Format Les
                </label>
                <select
                  value={formData.classType}
                  onChange={e => setFormData({ ...formData, classType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-900"
                >
                  <option value="REGULER">Kelas Reguler (Kelompok)</option>
                  <option value="PRIVAT">Les Privat (1-on-1)</option>
                  <option value="SEMI_PRIVAT">Semi-Privat (2-5 Siswa)</option>
                  <option value="INTENSIF_UTBK">Intensif UTBK / SNBT</option>
                  <option value="KEDINASAN">Persiapan Kedinasan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Jenjang
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                >
                  <option value="SD">Jenjang SD</option>
                  <option value="SMP">Jenjang SMP</option>
                  <option value="SMA">Jenjang SMA</option>
                  <option value="UMUM">Umum / Semua Jenjang</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Siswa
                </label>
                <input
                  type="text"
                  value={formData.targetGrade}
                  onChange={e => setFormData({ ...formData, targetGrade: e.target.value })}
                  placeholder="Kelas 7, 8, 9 SMP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Durasi Sesi (Menit)
                </label>
                <input
                  type="number"
                  step="15"
                  value={formData.sessionDurationMinutes}
                  onChange={e => setFormData({ ...formData, sessionDurationMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kapasitas Maksimal Siswa
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxStudents}
                  onChange={e => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Billing Model Siswa */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                2. Model Siklus Tagihan Siswa
              </h3>
              <span className="text-[10px] text-emerald-800 font-semibold">Pilih cara siswa ditagih</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'PER_PERTEMUAN', title: 'Per Pertemuan', desc: 'Sesuai sesi hadir' },
                { id: 'PAKET', title: 'Paket Sesi', desc: 'Kuota pertemuan' },
                { id: 'PER_BULAN', title: 'Bulanan (SPP)', desc: 'Tagihan per bulan' },
                { id: 'PER_MINGGU', title: 'Per Minggu', desc: 'Tagihan mingguan' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, billingModel: opt.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.billingModel === opt.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <span className="font-bold block text-xs">{opt.title}</span>
                  <span className={`text-[10px] ${formData.billingModel === opt.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Inputs based on selected billing model */}
            {formData.billingModel === 'PAKET' && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jumlah Pertemuan (Sesi) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.packageSessions}
                      onChange={e => setFormData({ ...formData, packageSessions: Number(e.target.value) })}
                      placeholder="12"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                    {formErrors.packageSessions && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.packageSessions}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Masa Berlaku Paket
                    </label>
                    <input
                      type="text"
                      value={formData.packageValidityDuration}
                      onChange={e => setFormData({ ...formData, packageValidityDuration: e.target.value })}
                      placeholder="Contoh: 1 Bulan / 30 Hari"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Biaya Paket (Rp) *
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={formData.packagePrice}
                      onChange={e => setFormData({ ...formData, packagePrice: Number(e.target.value) })}
                      placeholder="300000"
                      className="w-full px-3 py-2 border border-emerald-400 rounded-xl text-xs font-bold text-emerald-900"
                    />
                    {formErrors.packagePrice && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.packagePrice}</p>}
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Rata-rata per pertemuan:</span>
                  <strong className="text-slate-800">
                    {formData.packageSessions > 0
                      ? formatRupiah(Math.round(formData.packagePrice / formData.packageSessions))
                      : 'Rp 0'} / sesi
                  </strong>
                </div>
              </div>
            )}

            {formData.billingModel === 'PER_BULAN' && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tarif SPP Bulanan (Rp) *
                </label>
                <input
                  type="number"
                  step="5000"
                  value={formData.monthlyRate}
                  onChange={e => setFormData({ ...formData, monthlyRate: Number(e.target.value) })}
                  placeholder="150000"
                  className="w-full px-3 py-2 border border-emerald-400 rounded-xl text-xs font-bold text-emerald-900"
                />
                {formErrors.monthlyRate && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.monthlyRate}</p>}
              </div>
            )}

            {formData.billingModel === 'PER_MINGGU' && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tarif Mingguan (Rp) *
                </label>
                <input
                  type="number"
                  step="2500"
                  value={formData.weeklyRate}
                  onChange={e => setFormData({ ...formData, weeklyRate: Number(e.target.value) })}
                  placeholder="25000"
                  className="w-full px-3 py-2 border border-emerald-400 rounded-xl text-xs font-bold text-emerald-900"
                />
                {formErrors.weeklyRate && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.weeklyRate}</p>}
              </div>
            )}

            {formData.billingModel === 'PER_PERTEMUAN' && (
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tarif Siswa per Sesi Kehadiran (Rp) *
                </label>
                <input
                  type="number"
                  step="500"
                  value={formData.studentRate}
                  onChange={e => setFormData({ ...formData, studentRate: Number(e.target.value) })}
                  placeholder="8000"
                  className="w-full px-3 py-2 border border-emerald-400 rounded-xl text-xs font-bold text-emerald-900"
                />
                {formErrors.studentRate && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.studentRate}</p>}
              </div>
            )}
          </div>

          {/* Section 3: Diskon & Promo */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.hasDiscount}
                  onChange={e => setFormData({ ...formData, hasDiscount: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1.5">
                  <BadgePercent className="w-4 h-4 text-amber-600" />
                  3. Aktifkan Diskon / Potongan Promo Program
                </span>
              </label>
              {formData.hasDiscount && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                  Diskon Aktif
                </span>
              )}
            </div>

            {formData.hasDiscount && (
              <div className="pt-2 border-t border-amber-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama / Keterangan Promo
                    </label>
                    <input
                      type="text"
                      value={formData.discountName}
                      onChange={e => setFormData({ ...formData, discountName: e.target.value })}
                      placeholder="Contoh: Promo Pendaftaran Awal"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jenis Diskon
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="NOMINAL">Nominal Rupiah (Rp)</option>
                      <option value="PERSEN">Persentase (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nilai Potongan {formData.discountType === 'PERSEN' ? '(%)' : '(Rp)'} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.discountType === 'PERSEN' ? 100 : undefined}
                      value={formData.discountValue}
                      onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-amber-400 rounded-xl text-xs font-bold text-amber-900"
                    />
                    {formErrors.discountValue && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.discountValue}</p>}
                  </div>
                </div>

                {/* Calculation simulation */}
                <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Harga Normal:</span>
                    <span className="text-slate-700 font-semibold">{formatRupiah(currentBasePrice)}</span>
                  </div>
                  <div>
                    <span className="text-rose-600 block">Potongan Diskon:</span>
                    <span className="font-bold text-rose-700">
                      -{formatRupiah(currentDiscountCalc.discountAmount)} ({currentDiscountCalc.savingsPercentage}%)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-700 font-semibold block">Harga Akhir Siswa:</span>
                    <strong className="text-sm font-black text-emerald-800">
                      {formatRupiah(currentDiscountCalc.finalPrice)}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Skema Honor Tentor */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                <Users className="w-4 h-4 text-indigo-600" />
                4. Skema Honor Tentor / Pengajar
              </h3>
              <span className="text-[10px] text-indigo-800 font-semibold">Tentukan metode pembayaran honor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'PER_SISWA', title: 'Per Siswa / Sesi', desc: 'Dikalikan siswa hadir' },
                { id: 'PER_SESI', title: 'Flat per Sesi', desc: 'Berapa pun jumlah siswa' },
                { id: 'BULANAN', title: 'Gaji Bulanan', desc: 'Honor bulanan tetap' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, teacherHonorScheme: opt.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.teacherHonorScheme === opt.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span className="font-bold block text-xs">{opt.title}</span>
                  <span className={`text-[10px] ${formData.teacherHonorScheme === opt.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {formData.teacherHonorScheme === 'BULANAN' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gaji Pokok Bulanan Tentor (Rp)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.monthlyHonorRate}
                    onChange={e => setFormData({ ...formData, monthlyHonorRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-900"
                  />
                  {formErrors.monthlyHonorRate && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.monthlyHonorRate}</p>}
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {formData.teacherHonorScheme === 'PER_SESI'
                      ? 'Honor Flat per Sesi Mengajar (Rp)'
                      : 'Honor per Siswa yang Hadir (Rp)'}
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={formData.teacherHonorRate}
                    onChange={e => setFormData({ ...formData, teacherHonorRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-900"
                  />
                  {formErrors.teacherHonorRate && <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.teacherHonorRate}</p>}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Uang Transport per Kehadiran Sesi (Rp)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={formData.transportAllowance}
                  onChange={e => setFormData({ ...formData, transportAllowance: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingProgram ? 'Simpan Perubahan Program' : 'Buat Program Baru'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DEACTIVATION MODAL */}
      <ConfirmDialog
        isOpen={!!deactivatingProgram}
        onClose={() => setDeactivatingProgram(null)}
        onConfirm={() => {
          if (deactivatingProgram) {
            toggleProgramStatus(deactivatingProgram.id);
            setDeactivatingProgram(null);
          }
        }}
        title={deactivatingProgram?.status === 'AKTIF' ? 'Nonaktifkan Program' : 'Aktifkan Program'}
        message={`Apakah Anda yakin ingin mengubah status program "${deactivatingProgram?.name}" menjadi ${
          deactivatingProgram?.status === 'AKTIF' ? 'Nonaktif' : 'Aktif'
        }?`}
        confirmText={deactivatingProgram?.status === 'AKTIF' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        type={deactivatingProgram?.status === 'AKTIF' ? 'danger' : 'info'}
      />
    </div>
  );
};
