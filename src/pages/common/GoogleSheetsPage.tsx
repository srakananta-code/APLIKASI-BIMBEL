import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Table,
  Layers,
  ArrowRight,
  Sparkles,
  DollarSign,
  Users,
  LogOut,
  ChevronRight,
  Eye
} from 'lucide-react';
import { googleSheetsService } from '../../services/googleSheetsService';
import { googleDriveService } from '../../services/googleDriveService';
import { studentService } from '../../services/studentService';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { GoogleSpreadsheetMetadata, Student } from '../../types';

interface GoogleSheetsPageProps {
  onNavigate?: (page: string) => void;
}

export const GoogleSheetsPage: React.FC<GoogleSheetsPageProps> = ({ onNavigate }) => {
  const {
    students,
    studentCharges,
    studentPayments,
    expenses,
    addToast,
    refreshData
  } = useApp();
  const { userProfile } = useAuth();

  // Connection State
  const [isConnected, setIsConnected] = useState<boolean>(googleSheetsService.isConnected());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Spreadsheets List
  const [spreadsheets, setSpreadsheets] = useState<Array<{
    id: string;
    name: string;
    modifiedTime?: string;
    webViewLink?: string;
  }>>([]);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Action States
  const [isExportStudentsModalOpen, setIsExportStudentsModalOpen] = useState<boolean>(false);
  const [studentsExportTitle, setStudentsExportTitle] = useState<string>('');
  const [isExportingStudents, setIsExportingStudents] = useState<boolean>(false);

  const [isExportFinanceModalOpen, setIsExportFinanceModalOpen] = useState<boolean>(false);
  const [financeExportTitle, setFinanceExportTitle] = useState<string>('');
  const [isExportingFinance, setIsExportingFinance] = useState<boolean>(false);

  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState<boolean>(false);
  const [newSheetTitle, setNewSheetTitle] = useState<string>('');
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);

  // Success Feedback after export
  const [lastExportedSheet, setLastExportedSheet] = useState<{
    title: string;
    url: string;
    id: string;
  } | null>(null);

  // Import from Google Sheet
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importSourceType, setImportSourceType] = useState<'picker' | 'url'>('picker');
  const [selectedSheetForImport, setSelectedSheetForImport] = useState<string>('');
  const [sheetUrlInput, setSheetUrlInput] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [selectedSpreadsheetMeta, setSelectedSpreadsheetMeta] = useState<GoogleSpreadsheetMetadata | null>(null);
  const [selectedTabName, setSelectedTabName] = useState<string>('');
  const [previewStudents, setPreviewStudents] = useState<Array<Partial<Student>>>([]);
  const [rawPreviewHeaders, setRawPreviewHeaders] = useState<string[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isImportingStudents, setIsImportingStudents] = useState<boolean>(false);

  // Quick Sheet Preview
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewingSheetTitle, setPreviewingSheetTitle] = useState<string>('');
  const [previewTableValues, setPreviewTableValues] = useState<any[][]>([]);
  const [loadingTablePreview, setLoadingTablePreview] = useState<boolean>(false);

  // Listen to drive auth state changes
  useEffect(() => {
    const unsub = googleDriveService.onDriveAuthStateChanged(token => {
      setIsConnected(Boolean(token));
      if (token) {
        const u = googleDriveService.getConnectedUser();
        setUserEmail(u?.email || u?.displayName || 'Akun Google Terhubung');
        loadSpreadsheets();
      } else {
        setSpreadsheets([]);
        setUserEmail(null);
      }
    });
    return () => unsub();
  }, []);

  const loadSpreadsheets = useCallback(async (query?: string) => {
    if (!googleSheetsService.isConnected()) return;
    setLoadingList(true);
    try {
      const list = await googleSheetsService.listSpreadsheets(query);
      setSpreadsheets(list);
    } catch (err: any) {
      console.error('Error loading spreadsheets:', err);
      addToast('error', err.message || 'Gagal mengambil daftar spreadsheet');
    } finally {
      setLoadingList(false);
    }
  }, [addToast]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await googleSheetsService.connect();
      setUserEmail(res.user.email || res.user.displayName || 'Akun Google');
      addToast('success', 'Google Sheets & Drive berhasil terhubung!');
      loadSpreadsheets();
    } catch (err: any) {
      console.error('Connection error:', err);
      addToast('error', err.message || 'Gagal menghubungkan Google Sheets');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    googleSheetsService.disconnect();
    setUserEmail(null);
    setSpreadsheets([]);
    addToast('info', 'Koneksi Google Sheets telah diputuskan.');
  };

  // 1. Export Students to Google Sheets
  const handleExportStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExportingStudents(true);
    try {
      const result = await googleSheetsService.exportStudentsToGoogleSheets(
        students,
        studentsExportTitle || undefined
      );
      setLastExportedSheet({
        title: result.title,
        url: result.spreadsheetUrl,
        id: result.spreadsheetId
      });
      setIsExportStudentsModalOpen(false);
      setStudentsExportTitle('');
      addToast('success', `Berhasil membuat spreadsheet "${result.title}" di Google Sheets!`);
      loadSpreadsheets();
    } catch (err: any) {
      console.error('Export students error:', err);
      addToast('error', err.message || 'Gagal mengekspor data siswa ke Google Sheets.');
    } finally {
      setIsExportingStudents(false);
    }
  };

  // 2. Export Financial Report to Google Sheets
  const handleExportFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExportingFinance(true);
    try {
      const totalIncome = studentPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const totalExpense = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const netBalance = totalIncome - totalExpense;

      const studentNames = Object.fromEntries(students.map(s => [s.id, s.name]));
      const result = await googleSheetsService.exportFinancialReportToGoogleSheets({
        charges: studentCharges,
        payments: studentPayments,
        expenses: expenses,
        totalIncome,
        totalExpense,
        netBalance,
        studentNames,
        title: financeExportTitle || undefined
      });

      setLastExportedSheet({
        title: result.title,
        url: result.spreadsheetUrl,
        id: result.spreadsheetId
      });
      setIsExportFinanceModalOpen(false);
      setFinanceExportTitle('');
      addToast('success', `Spreadsheet keuangan "${result.title}" berhasil dibuat dengan multi-tab!`);
      loadSpreadsheets();
    } catch (err: any) {
      console.error('Export finance error:', err);
      addToast('error', err.message || 'Gagal mengekspor laporan keuangan.');
    } finally {
      setIsExportingFinance(false);
    }
  };

  // 3. Create Blank / Custom Sheet
  const handleCreateNewSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;

    setIsCreatingSheet(true);
    try {
      const res = await googleSheetsService.createSpreadsheet(newSheetTitle.trim());
      setIsNewSheetModalOpen(false);
      setNewSheetTitle('');
      setLastExportedSheet({
        title: res.properties.title,
        url: res.spreadsheetUrl,
        id: res.spreadsheetId
      });
      addToast('success', `Google Spreadsheet "${res.properties.title}" berhasil dibuat.`);
      loadSpreadsheets();
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membuat Google Spreadsheet.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Helper extracting spreadsheet ID from URL or ID string
  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('/spreadsheets/d/')) {
      const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) return match[1];
    }
    return trimmed;
  };

  // 4. Fetch metadata for import
  const handleFetchSheetForImport = async (targetId: string) => {
    const cleanId = extractSpreadsheetId(targetId);
    if (!cleanId) {
      addToast('error', 'ID atau URL Google Sheets tidak valid.');
      return;
    }

    setIsLoadingMetadata(true);
    setSelectedSpreadsheetMeta(null);
    setPreviewStudents([]);
    try {
      const meta = await googleSheetsService.getSpreadsheet(cleanId);
      setSelectedSpreadsheetMeta(meta);
      if (meta.sheets.length > 0) {
        const firstTab = meta.sheets[0].properties.title;
        setSelectedTabName(firstTab);
        handleLoadPreview(cleanId, firstTab);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengambil informasi Google Sheet.');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Load preview data from tab
  const handleLoadPreview = async (spreadsheetId: string, tabName: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await googleSheetsService.readStudentsFromSheet(spreadsheetId, tabName);
      setPreviewStudents(res.students);
      setRawPreviewHeaders(res.headers);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membaca isi tab spreadsheet.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Execute Batch Import Students into App
  const handleExecuteImport = async () => {
    if (previewStudents.length === 0) return;
    setIsImportingStudents(true);
    let successCount = 0;

    try {
      for (const st of previewStudents) {
        if (!st.name) continue;
        await studentService.create({
          name: st.name,
          grade: st.grade || 'Kelas 1 SD',
          nis: st.nis || `NIS-${new Date().getFullYear()}-${String(students.length + successCount + 1).padStart(3, '0')}`,
          gender: st.gender || 'L',
          school: st.school || '',
          parentName: st.parentName || '',
          parentPhone: st.parentPhone || '',
          phone: st.phone || '',
          address: st.address || '',
          programIds: [],
          programNames: st.programNames || [],
          status: 'AKTIF'
        });
        successCount++;
      }

      await refreshData();
      addToast('success', `Berhasil mengimpor ${successCount} siswa dari Google Sheets ke sistem!`);
      setIsImportModalOpen(false);
      setSelectedSpreadsheetMeta(null);
      setPreviewStudents([]);
    } catch (err: any) {
      console.error('Import error:', err);
      addToast('error', `Terjadi kendala saat impor: ${err.message}`);
    } finally {
      setIsImportingStudents(false);
    }
  };

  // 5. Quick Preview Spreadsheet Modal
  const handleOpenPreviewTable = async (sheet: { id: string; name: string }) => {
    setPreviewingSheetTitle(sheet.name);
    setPreviewModalOpen(true);
    setLoadingTablePreview(true);
    try {
      // Get first tab values
      const meta = await googleSheetsService.getSpreadsheet(sheet.id);
      const tabTitle = meta.sheets[0]?.properties.title || 'Sheet1';
      const values = await googleSheetsService.getValues(sheet.id, `${tabTitle}!A1:Z50`);
      setPreviewTableValues(values);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal memuat pratinjau tabel.');
      setPreviewTableValues([]);
    } finally {
      setLoadingTablePreview(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Google Sheets Spreadsheet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Ekspor data siswa dan rekapitulasi kas langsung ke lembar kerja Google Sheets secara langsung, atau impor data dari Google Spreadsheet Anda.
          </p>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsExportStudentsModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Ekspor Siswa</span>
            </button>

            <button
              onClick={() => setIsExportFinanceModalOpen(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Ekspor Keuangan</span>
            </button>

            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setSelectedSpreadsheetMeta(null);
                setPreviewStudents([]);
              }}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Impor Siswa</span>
            </button>

            <button
              onClick={() => setIsNewSheetModalOpen(true)}
              className="px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Buat Spreadsheet Kosong Baru"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* JIKA BELUM TERHUBUNG: PROMINENT GOOGLE SIGN IN CARD */}
      {!isConnected ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/50 border border-emerald-100 shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center mx-auto text-emerald-600">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Hubungkan Akun Google Sheets
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Sinkronisasikan data bimbingan belajar dengan Google Sheets. Buat lembar kerja otomatis, baca rekapitulasi, dan ekspor pembukuan kas bimbel secara instan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="p-3.5 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-xs mb-2">
                1
              </span>
              <h4 className="font-bold text-slate-800 text-xs">Ekspor Instan</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Kirim data siswa & tagihan SPP ke Google Spreadsheet baru.</p>
            </div>
            <div className="p-3.5 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs mb-2">
                2
              </span>
              <h4 className="font-bold text-slate-800 text-xs">Format Otomatis</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Baris judul otomatis di-freeze dan diberi warna profesional.</p>
            </div>
            <div className="p-3.5 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs mb-2">
                3
              </span>
              <h4 className="font-bold text-slate-800 text-xs">Impor Fleksibel</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Tarik data calon siswa langsung dari Google Form/Sheet.</p>
            </div>
          </div>

          {/* Official Google Sign-In Button as required by workspace-integration skill */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              <span>{isConnecting ? 'Menghubungkan ke Google...' : 'Hubungkan dengan Akun Google'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Aplikasi meminta akses baca dan tulis ke Google Sheets dengan persetujuan Anda.
          </p>
        </div>
      ) : (
        /* SAAT TERHUBUNG */
        <div className="space-y-4">
          {/* USER INFO BAR */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Google Sheets Terhubung</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Siap Digunakan
                  </span>
                </div>
                <p className="text-xs text-slate-500">{userEmail || 'Akun Google Aktif'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('google-drive')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  Buka Google Drive
                </button>
              )}
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan</span>
              </button>
            </div>
          </div>

          {/* BANNER HASIL EKSPOR TERBARU */}
          {lastExportedSheet && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">
                    Spreadsheet Berhasil Dibuat: {lastExportedSheet.title}
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    File telah tersimpan di Google Drive Anda dan dapat langsung diedit bersama tim pengajar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={lastExportedSheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Buka di Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setLastExportedSheet(null)}
                  className="px-2.5 py-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* DAFTAR FILE GOOGLE SHEETS USER */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daftar Spreadsheet Google Sheets Anda</h3>
                <p className="text-xs text-slate-500">
                  Daftar lembar kerja yang tersedia di akun Google Drive Anda.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
                  <input
                    type="text"
                    placeholder="Cari nama spreadsheet..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadSpreadsheets(searchQuery)}
                    className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => loadSpreadsheets(searchQuery)}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Muat Ulang Berkas"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>

            {loadingList ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Memuat spreadsheet dari Google Drive...</p>
              </div>
            ) : spreadsheets.length === 0 ? (
              <div className="py-12 text-center space-y-2 max-w-sm mx-auto">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Belum ada file Google Sheets ditemukan</p>
                <p className="text-[11px] text-slate-400">
                  Gunakan tombol "Ekspor Siswa" atau "Ekspor Keuangan" di atas untuk membuat lembar kerja otomatis pertama Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {spreadsheets.map(sheet => (
                  <div
                    key={sheet.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenPreviewTable(sheet)}
                            title="Pratinjau Data Tabel"
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {sheet.webViewLink && (
                            <a
                              href={sheet.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Buka langsung di Google Sheets"
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={sheet.name}>
                          {sheet.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Diperbarui: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => {
                          setSelectedSheetForImport(sheet.id);
                          setImportSourceType('picker');
                          setIsImportModalOpen(true);
                          handleFetchSheetForImport(sheet.id);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Impor ke Siswa</span>
                      </button>

                      {sheet.webViewLink && (
                        <a
                          href={sheet.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-500 hover:text-emerald-700 font-semibold"
                        >
                          Buka Sheet →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL EKSPOR DATA SISWA */}
      <Modal
        isOpen={isExportStudentsModalOpen}
        onClose={() => setIsExportStudentsModalOpen(false)}
        title="Ekspor Data Siswa ke Google Sheets"
        description="Akan membuat file spreadsheet baru di Google Drive dengan format rapi dan judul kolom yang sudah teratur."
        maxWidth="md"
      >
        <form onSubmit={handleExportStudents} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Spreadsheet
            </label>
            <input
              type="text"
              value={studentsExportTitle}
              onChange={e => setStudentsExportTitle(e.target.value)}
              placeholder={`Data Siswa Bimbel - ${new Date().toLocaleDateString('id-ID')}`}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Data yang akan diekspor: {students.length} siswa aktif dan data orang tua/wali.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
            <p className="font-bold text-slate-800">Kolom yang disertakan:</p>
            <p>No, Nama Siswa, Tingkat / Kelas, NIS, Jenis Kelamin, Asal Sekolah, Program Belajar, Nama Orang Tua, No HP Orang Tua, No HP Siswa, Alamat, Status.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsExportStudentsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isExportingStudents}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExportingStudents && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isExportingStudents ? 'Membuat Spreadsheet...' : 'Buat di Google Sheets'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL EKSPOR KEUANGAN */}
      <Modal
        isOpen={isExportFinanceModalOpen}
        onClose={() => setIsExportFinanceModalOpen(false)}
        title="Ekspor Laporan Keuangan ke Google Sheets"
        description="Akan membuat file spreadsheet multi-tab (Ringkasan Keuangan, Tagihan & SPP, serta Pengeluaran Operasional)."
        maxWidth="md"
      >
        <form onSubmit={handleExportFinance} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Spreadsheet Keuangan
            </label>
            <input
              type="text"
              value={financeExportTitle}
              onChange={e => setFinanceExportTitle(e.target.value)}
              placeholder={`Laporan Keuangan Bimbel - ${new Date().toLocaleDateString('id-ID')}`}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-[10px] text-indigo-600 font-bold uppercase">Tagihan Siswa</p>
              <p className="text-sm font-black text-indigo-900 mt-0.5">{studentCharges.length}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[10px] text-emerald-600 font-bold uppercase">Pembayaran</p>
              <p className="text-sm font-black text-emerald-900 mt-0.5">{studentPayments.length}</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-[10px] text-rose-600 font-bold uppercase">Pengeluaran</p>
              <p className="text-sm font-black text-rose-900 mt-0.5">{expenses.length}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsExportFinanceModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isExportingFinance}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExportingFinance && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isExportingFinance ? 'Membuat Spreadsheet...' : 'Ekspor ke Google Sheets'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL BUAT SPREADSHEET BARU */}
      <Modal
        isOpen={isNewSheetModalOpen}
        onClose={() => setIsNewSheetModalOpen(false)}
        title="Buat Google Spreadsheet Baru"
        description="Buat lembar kerja kosong baru langsung di Google Drive Anda."
        maxWidth="sm"
      >
        <form onSubmit={handleCreateNewSheet} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Spreadsheet *
            </label>
            <input
              type="text"
              required
              value={newSheetTitle}
              onChange={e => setNewSheetTitle(e.target.value)}
              placeholder="Contoh: Jadwal Ujian Semester 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewSheetModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreatingSheet || !newSheetTitle.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isCreatingSheet && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isCreatingSheet ? 'Membuat...' : 'Buat Spreadsheet'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL IMPOR SISWA DARI GOOGLE SHEET */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Data Siswa dari Google Sheets"
        description="Pilih spreadsheet atau masukkan tautan Google Sheet untuk menarik data calon siswa."
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Switch Source: Dari daftar file atau Masukkan URL */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-xs">
            <button
              onClick={() => setImportSourceType('picker')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                importSourceType === 'picker'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pilih dari Drive
            </button>
            <button
              onClick={() => setImportSourceType('url')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                importSourceType === 'url'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tautan / ID Sheet
            </button>
          </div>

          {importSourceType === 'picker' ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih File Spreadsheet:
              </label>
              <select
                value={selectedSheetForImport}
                onChange={e => {
                  setSelectedSheetForImport(e.target.value);
                  if (e.target.value) handleFetchSheetForImport(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih salah satu spreadsheet --</option>
                {spreadsheets.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrlInput}
                onChange={e => setSheetUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR.../edit atau Sheet ID"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleFetchSheetForImport(sheetUrlInput)}
                disabled={isLoadingMetadata || !sheetUrlInput.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
              >
                {isLoadingMetadata ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Muat'}
              </button>
            </div>
          )}

          {/* JIKA METADATA SUDAH DIMUAT */}
          {selectedSpreadsheetMeta && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">{selectedSpreadsheetMeta.properties.title}</h4>
                  <p className="text-[11px] text-emerald-700">
                    Pilih lembar (tab) yang memuat data siswa:
                  </p>
                </div>
                <select
                  value={selectedTabName}
                  onChange={e => {
                    setSelectedTabName(e.target.value);
                    handleLoadPreview(selectedSpreadsheetMeta.spreadsheetId, e.target.value);
                  }}
                  className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900"
                >
                  {selectedSpreadsheetMeta.sheets.map(sh => (
                    <option key={sh.properties.sheetId} value={sh.properties.title}>
                      {sh.properties.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRATINJAU BARIS DATA YANG TERDETEKSI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-bold text-slate-800 text-xs">
                    Pratinjau Calon Siswa Terdeteksi ({previewStudents.length} siswa)
                  </h5>
                  <span className="text-[10px] text-slate-500">
                    Hanya kolom Nama dan Kelas yang wajib
                  </span>
                </div>

                {isLoadingPreview ? (
                  <div className="py-8 text-center space-y-2">
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">Membaca baris lembar kerja...</p>
                  </div>
                ) : previewStudents.length === 0 ? (
                  <p className="p-4 text-center bg-slate-50 text-slate-400 rounded-xl text-xs">
                    Tidak ditemukan baris data siswa yang valid pada tab ini.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-56">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">No</th>
                          <th className="p-2">Nama Siswa</th>
                          <th className="p-2">Tingkat/Kelas</th>
                          <th className="p-2">NIS</th>
                          <th className="p-2">Asal Sekolah</th>
                          <th className="p-2">Orang Tua</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewStudents.slice(0, 20).map((st, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800">{st.name}</td>
                            <td className="p-2 text-slate-600">{st.grade}</td>
                            <td className="p-2 text-slate-500">{st.nis || '-'}</td>
                            <td className="p-2 text-slate-500">{st.school || '-'}</td>
                            <td className="p-2 text-slate-500">{st.parentName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImportingStudents || previewStudents.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isImportingStudents && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isImportingStudents
                  ? 'Menyimpan Siswa...'
                  : `Simpan ${previewStudents.length} Siswa ke Database`}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL PRATINJAU TABEL SPREADSHEET */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Pratinjau: ${previewingSheetTitle}`}
        description="Melihat 50 baris pertama lembar kerja."
        maxWidth="3xl"
      >
        <div className="space-y-3 text-xs">
          {loadingTablePreview ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Membaca sel tabel...</p>
            </div>
          ) : previewTableValues.length === 0 ? (
            <p className="text-center py-8 text-slate-400">Lembar kerja ini tidak memiliki nilai isi.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
              <table className="w-full text-left text-[11px] border-collapse">
                <tbody>
                  {previewTableValues.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx === 0 ? 'bg-slate-100 font-bold text-slate-800' : 'hover:bg-slate-50 border-t border-slate-100'}
                    >
                      <td className="p-1.5 bg-slate-50 text-slate-400 text-center font-mono text-[10px] border-r border-slate-200">
                        {rIdx + 1}
                      </td>
                      {row.map((cell: any, cIdx: number) => (
                        <td key={cIdx} className="p-2 text-slate-700 whitespace-nowrap border-r border-slate-100">
                          {String(cell ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
