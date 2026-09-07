import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  HelpCircle,
  Sparkles,
  ClipboardList,
  Check,
  ChevronRight
} from 'lucide-react';
import { Student, Program } from '../../types';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: Student[];
  programs: Program[];
  onImport: (students: Array<Omit<Student, 'id' | 'registeredAt'> & { id?: string }>) => Promise<{ success: boolean; count: number }>;
}

interface ParsedStudentRow {
  index: number;
  name: string;
  nis: string;
  isAutoNis: boolean;
  gender: 'L' | 'P';
  school: string;
  grade: string;
  programNames: string[];
  programIds: string[];
  parentName: string;
  parentPhone: string;
  studentPhone: string;
  address: string;
  notes: string;
  isValid: boolean;
  errors: string[];
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  existingStudents,
  programs,
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [defaultProgramId, setDefaultProgramId] = useState<string>(programs[0]?.id || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download template function
  const handleDownloadTemplate = () => {
    const defaultProgramName = programs[0]?.name || 'Reguler SD';
    const secondaryProgramName = programs[1]?.name || 'Privat SMP';

    const headers = [
      'nama',
      'nis',
      'jenis_kelamin',
      'kelas',
      'asal_sekolah',
      'program',
      'nama_orang_tua',
      'no_hp_orang_tua',
      'no_hp_siswa',
      'alamat',
      'catatan'
    ];

    const sampleRows = [
      [
        'Ahmad Fauzan',
        'NIS-2026-101',
        'L',
        'Kelas 8 SMP',
        'SMP Negeri 1',
        defaultProgramName,
        'Bambang Fauzan',
        '081234567890',
        '081234567891',
        'Jl. Melati No. 12, Jakarta',
        'Fokus persiapan ujian sekolah'
      ],
      [
        'Siti Nurhaliza',
        'NIS-2026-102',
        'P',
        'Kelas 5 SD',
        'SDIT Harapan Bangsa',
        secondaryProgramName,
        'Dewi Sartika',
        '082198765432',
        '',
        'Jl. Kenanga Blok C4',
        'Belajar Matematika & IPA'
      ],
      [
        'Rian Pratama',
        '',
        'L',
        'Kelas 11 SMA',
        'SMA Negeri 3',
        defaultProgramName,
        'Hendra Pratama',
        '085678901234',
        '085678901235',
        'Perumahan Indah Asri',
        'NIS kosong akan di-generate otomatis'
      ]
    ];

    // Format as CSV with BOM for proper Excel UTF-8 display
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_import_siswa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to resolve program IDs from names
  const resolveProgramIds = (progStr: string): { ids: string[]; names: string[] } => {
    if (!progStr || !progStr.trim()) {
      return {
        ids: defaultProgramId ? [defaultProgramId] : (programs[0] ? [programs[0].id] : []),
        names: [programs.find(p => p.id === defaultProgramId)?.name || programs[0]?.name || 'Program Standar']
      };
    }

    const rawNames = progStr.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
    const matchedIds: string[] = [];
    const matchedNames: string[] = [];

    rawNames.forEach(raw => {
      const match = programs.find(
        p => p.name.toLowerCase() === raw.toLowerCase() ||
             p.code?.toLowerCase() === raw.toLowerCase() ||
             p.id.toLowerCase() === raw.toLowerCase()
      );
      if (match) {
        matchedIds.push(match.id);
        matchedNames.push(match.name);
      } else {
        matchedNames.push(raw);
      }
    });

    if (matchedIds.length === 0 && defaultProgramId) {
      matchedIds.push(defaultProgramId);
    }

    return { ids: matchedIds, names: matchedNames.length > 0 ? matchedNames : [programs[0]?.name || ''] };
  };

  // Parse CSV text
  const parseCSVData = (text: string) => {
    const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Detect delimiter: comma, semicolon, or tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === delimiter && !insideQuote) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerCells = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    
    // Map column indices
    let nameIdx = headerCells.findIndex(h => h.includes('nama') && !h.includes('ortu') && !h.includes('orang'));
    if (nameIdx === -1) nameIdx = headerCells.findIndex(h => h === 'name' || h === 'siswa' || h === 'namasiswa');
    if (nameIdx === -1) nameIdx = 0; // fallback

    const nisIdx = headerCells.findIndex(h => h === 'nis' || h.includes('nomorinduk') || h === 'nisn');
    const genderIdx = headerCells.findIndex(h => h.includes('kelamin') || h === 'gender' || h === 'jk');
    const gradeIdx = headerCells.findIndex(h => h.includes('kelas') || h === 'grade' || h === 'tingkat');
    const schoolIdx = headerCells.findIndex(h => h.includes('sekolah') || h === 'school');
    const programIdx = headerCells.findIndex(h => h.includes('program') || h === 'paket');
    const parentNameIdx = headerCells.findIndex(h => h.includes('orang') || h.includes('ortu') || h === 'wali' || h === 'parent');
    const parentPhoneIdx = headerCells.findIndex(h => (h.includes('hp') || h.includes('telp') || h.includes('telepon') || h.includes('wa') || h.includes('phone')) && (h.includes('ortu') || h.includes('orang') || h.includes('wali')));
    const studentPhoneIdx = headerCells.findIndex(h => (h.includes('hp') || h.includes('telp') || h.includes('telepon') || h.includes('wa') || h.includes('phone')) && (h.includes('siswa') || h.includes('anak')));
    const addressIdx = headerCells.findIndex(h => h.includes('alamat') || h === 'address');
    const notesIdx = headerCells.findIndex(h => h.includes('catatan') || h === 'notes' || h === 'keterangan');

    const startIndex = (lines[0].toLowerCase().includes('nama') || lines[0].toLowerCase().includes('nis')) ? 1 : 0;
    const existingNisSet = new Set(existingStudents.map(s => s.nis.trim().toLowerCase()));
    const generatedNisSet = new Set<string>();

    let autoNisCounter = existingStudents.length + 1;

    const parsed: ParsedStudentRow[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const cells = parseLine(lines[i]);
      if (cells.every(c => !c.trim())) continue;

      const rawName = nameIdx !== -1 ? (cells[nameIdx] || '') : '';
      let rawNis = nisIdx !== -1 ? (cells[nisIdx] || '').trim() : '';
      const rawGender = genderIdx !== -1 ? (cells[genderIdx] || '').toUpperCase() : 'L';
      const rawGrade = gradeIdx !== -1 ? (cells[gradeIdx] || 'Kelas 8 SMP') : 'Kelas 8 SMP';
      const rawSchool = schoolIdx !== -1 ? (cells[schoolIdx] || '') : '';
      const rawProgram = programIdx !== -1 ? (cells[programIdx] || '') : '';
      const rawParentName = parentNameIdx !== -1 ? (cells[parentNameIdx] || '') : '';
      let rawParentPhone = parentPhoneIdx !== -1 ? (cells[parentPhoneIdx] || '') : '';
      const rawStudentPhone = studentPhoneIdx !== -1 ? (cells[studentPhoneIdx] || '') : '';
      const rawAddress = addressIdx !== -1 ? (cells[addressIdx] || '') : '';
      const rawNotes = notesIdx !== -1 ? (cells[notesIdx] || '') : '';

      let isAutoNis = false;
      if (!rawNis) {
        while (
          existingNisSet.has(`nis-2026-${String(autoNisCounter).padStart(3, '0')}`) ||
          generatedNisSet.has(`nis-2026-${String(autoNisCounter).padStart(3, '0')}`)
        ) {
          autoNisCounter++;
        }
        rawNis = `NIS-2026-${String(autoNisCounter).padStart(3, '0')}`;
        autoNisCounter++;
        isAutoNis = true;
      }

      generatedNisSet.add(rawNis.toLowerCase());

      // Normalize Gender
      let gender: 'L' | 'P' = 'L';
      if (rawGender.startsWith('P') || rawGender.includes('PEREMPUAN') || rawGender === 'WANITA' || rawGender === 'F') {
        gender = 'P';
      }

      // Format Phone Numbers
      rawParentPhone = rawParentPhone.replace(/[^0-9+]/g, '');

      // Program resolution
      const programInfo = resolveProgramIds(rawProgram);

      // Validation
      const errors: string[] = [];
      if (!rawName.trim()) {
        errors.push('Nama siswa wajib diisi');
      }

      if (!isAutoNis && existingNisSet.has(rawNis.toLowerCase())) {
        errors.push(`NIS "${rawNis}" sudah terdaftar di sistem`);
      }

      if (!rawParentName.trim()) {
        errors.push('Nama orang tua wajib diisi');
      }

      if (!rawParentPhone.trim()) {
        errors.push('No HP orang tua wajib diisi');
      }

      parsed.push({
        index: parsed.length + 1,
        name: rawName.trim(),
        nis: rawNis,
        isAutoNis,
        gender,
        school: rawSchool.trim(),
        grade: rawGrade.trim() || 'Kelas 8 SMP',
        programNames: programInfo.names,
        programIds: programInfo.ids,
        parentName: rawParentName.trim(),
        parentPhone: rawParentPhone,
        studentPhone: rawStudentPhone.replace(/[^0-9+]/g, ''),
        address: rawAddress.trim(),
        notes: rawNotes.trim(),
        isValid: errors.length === 0,
        errors
      });
    }

    setParsedRows(parsed);
  };

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        parseCSVData(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        handleFileUpload(file);
      } else {
        alert('Mohon unggah file format CSV (.csv) atau Teks (.txt)');
      }
    }
  };

  const handlePasteChange = (val: string) => {
    setPastedText(val);
    if (val.trim()) {
      parseCSVData(val);
    } else {
      setParsedRows([]);
    }
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;

    setIsProcessing(true);
    try {
      const studentsToInsert = validRows.map(r => ({
        name: r.name,
        nis: r.nis,
        gender: r.gender,
        grade: r.grade,
        school: r.school || undefined,
        schoolOrigin: r.school || undefined,
        programIds: r.programIds.length > 0 ? r.programIds : [defaultProgramId],
        parentName: r.parentName,
        parentPhone: r.parentPhone,
        studentPhone: r.studentPhone || undefined,
        phone: r.studentPhone || undefined,
        address: r.address || undefined,
        notes: r.notes || undefined,
        status: 'AKTIF' as const
      }));

      await onImport(studentsToInsert);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memproses impor data.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Impor Data Siswa Masal</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-extrabold">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Unggah data ratusan siswa sekaligus menggunakan template spreadsheet standar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* STEP 1: Unduh Template */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Unduh Template Spreadsheet (.CSV)
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed pl-7">
                Gunakan template resmi agar susunan kolom nama, NIS, kelas, nomor HP, dan program langsung cocok otomatis.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 text-xs font-bold border border-indigo-200 shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template CSV</span>
            </button>
          </div>

          {/* STEP 2: Input Method (Upload vs Paste) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Pilih Cara Masukkan Data
                </h3>
              </div>

              {/* Tab Selector */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unggah File (.CSV)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'paste'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Salin-Tempel (Excel)
                </button>
              </div>
            </div>

            {/* TAB UPLOAD */}
            {activeTab === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className={`p-3 rounded-2xl ${selectedFile ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : 'Tarik & Lepaskan File CSV di Sini atau Klik untuk Memilih'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mendukung format file .CSV atau .TXT berpemisah koma / titik koma
                    </p>
                  </div>
                  {selectedFile && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      File terpilih: {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* TAB PASTE */}
            {activeTab === 'paste' && (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={pastedText}
                  onChange={e => handlePasteChange(e.target.value)}
                  placeholder="Salin baris dari Microsoft Excel atau Google Spreadsheet, lalu tempel (Ctrl+V) di sini..."
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Tip: Anda dapat memilih blok sel langsung di Excel/Sheets termasuk baris judul, tekan Ctrl+C, lalu tempel di kotak di atas.
                </p>
              </div>
            )}
          </div>

          {/* Program Default Fallback */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-600 font-medium">
              Program Bimbingan Default (Bila kolom program kosong):
            </span>
            <select
              value={defaultProgramId}
              onChange={e => setDefaultProgramId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {programs.map(prog => (
                <option key={prog.id} value={prog.id}>
                  {prog.name}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 3: Preview Data & Validasi */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Pratinjau &amp; Validasi Data ({parsedRows.length} Baris Terbaca)
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{validRows.length} Siap Diimpor</span>
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{invalidRows.length} Perlu Diperbaiki</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2.5 text-center w-10">No</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5">NIS</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5">Program</th>
                      <th className="p-2.5">Orang Tua</th>
                      <th className="p-2.5">No HP Ortu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map(row => (
                      <tr key={row.index} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}>
                        <td className="p-2.5 text-center text-slate-400 font-mono">{row.index}</td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3" />
                              Valid
                            </span>
                          ) : (
                            <span
                              title={row.errors.join(', ')}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {row.name || <span className="text-rose-500 italic">Kosong</span>}
                          {row.errors.length > 0 && (
                            <span className="block text-[10px] text-rose-600 font-normal">
                              {row.errors[0]}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[11px]">
                          {row.nis}
                          {row.isAutoNis && (
                            <span className="block text-[9px] text-indigo-600 font-sans">
                              (Auto)
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600">{row.grade}</td>
                        <td className="p-2.5">
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                            {row.programNames.join(', ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700">{row.parentName || '-'}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-700">{row.parentPhone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={validRows.length === 0 || isProcessing}
            onClick={handleExecuteImport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Menyimpan ke Database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Proses Impor {validRows.length > 0 ? `(${validRows.length} Siswa Valid)` : ''}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
