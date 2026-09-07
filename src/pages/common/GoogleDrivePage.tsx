import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HardDrive,
  Folder,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Upload,
  FolderPlus,
  RefreshCw,
  Search,
  ExternalLink,
  Download,
  Trash2,
  ChevronRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { googleDriveService } from '../../services/googleDriveService';
import { GoogleDriveFile, GoogleDriveAbout } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

interface GoogleDrivePageProps {
  onNavigate?: (page: string) => void;
  onImportStudentsFromFile?: (csvContent: string) => void;
}

export const GoogleDrivePage: React.FC<GoogleDrivePageProps> = ({
  onNavigate,
  onImportStudentsFromFile
}) => {
  const { addToast, students, programs, schedules, meetings, studentCharges, studentPayments, expenses } = useApp();
  const { userProfile } = useAuth();

  // Auth & Connection State
  const [isConnected, setIsConnected] = useState<boolean>(googleDriveService.isConnected());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [aboutInfo, setAboutInfo] = useState<GoogleDriveAbout | null>(null);

  // Explorer State
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string } | null>(null);
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mimeFilter, setMimeFilter] = useState<'all' | 'folders' | 'documents' | 'spreadsheets' | 'pdf' | 'images'>('all');

  // Modals
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFileToUpload, setSelectedFileToUpload] = useState<globalThis.File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [fileToDelete, setFileToDelete] = useState<GoogleDriveFile | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to drive auth changes
  useEffect(() => {
    const unsub = googleDriveService.onDriveAuthStateChanged((token) => {
      setIsConnected(Boolean(token));
      if (token) {
        loadAboutAndFiles();
      } else {
        setFiles([]);
        setAboutInfo(null);
      }
    });
    return () => unsub();
  }, []);

  const loadAboutAndFiles = useCallback(async (folderId?: string) => {
    setLoadingFiles(true);
    try {
      const [about, fileList] = await Promise.all([
        googleDriveService.getAbout().catch(() => null),
        googleDriveService.listFiles({
          folderId: folderId || currentFolder?.id,
          searchQuery: searchQuery.trim() || undefined,
          mimeTypeFilter: mimeFilter !== 'all' ? mimeFilter : undefined
        })
      ]);

      if (about) setAboutInfo(about);
      setFiles(fileList.files);
    } catch (err: any) {
      console.error('Error loading Google Drive data:', err);
      addToast('error', err.message || 'Gagal memuat file dari Google Drive');
    } finally {
      setLoadingFiles(false);
    }
  }, [currentFolder, searchQuery, mimeFilter, addToast]);

  useEffect(() => {
    if (isConnected) {
      loadAboutAndFiles(currentFolder?.id);
    }
  }, [currentFolder, mimeFilter, isConnected]);

  // Connect handler
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await googleDriveService.connect();
      addToast('success', 'Google Drive berhasil terhubung!');
    } catch (err: any) {
      console.error('Connect error:', err);
      addToast('error', err.message || 'Gagal menghubungkan Google Drive.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    googleDriveService.disconnect();
    setCurrentFolder(null);
    setFolderHistory([]);
    addToast('info', 'Koneksi Google Drive telah diputuskan.');
  };

  // Folder navigation
  const handleOpenFolder = (folder: GoogleDriveFile) => {
    if (currentFolder) {
      setFolderHistory(prev => [...prev, currentFolder]);
    }
    setCurrentFolder({ id: folder.id, name: folder.name });
  };

  const handleNavigateBack = () => {
    if (folderHistory.length > 0) {
      const prev = folderHistory[folderHistory.length - 1];
      setFolderHistory(folderHistory.slice(0, -1));
      setCurrentFolder(prev);
    } else {
      setCurrentFolder(null);
    }
  };

  const handleNavigateRoot = () => {
    setFolderHistory([]);
    setCurrentFolder(null);
  };

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      const folder = await googleDriveService.createFolder(
        newFolderName.trim(),
        currentFolder?.id
      );
      addToast('success', `Folder "${folder.name}" berhasil dibuat.`);
      setIsNewFolderModalOpen(false);
      setNewFolderName('');
      loadAboutAndFiles(currentFolder?.id);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal membuat folder.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Upload file
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileToUpload) return;

    setIsUploading(true);
    try {
      const uploaded = await googleDriveService.uploadFile(
        selectedFileToUpload,
        currentFolder?.id,
        uploadDescription
      );
      addToast('success', `File "${uploaded.name}" berhasil diunggah ke Google Drive.`);
      setIsUploadModalOpen(false);
      setSelectedFileToUpload(null);
      setUploadDescription('');
      loadAboutAndFiles(currentFolder?.id);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal mengunggah file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete file (Explicit confirmation as required by skill)
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    setIsDeletingFile(true);
    try {
      await googleDriveService.deleteFile(fileToDelete.id);
      addToast('success', `"${fileToDelete.name}" berhasil dihapus dari Google Drive.`);
      setFileToDelete(null);
      loadAboutAndFiles(currentFolder?.id);
    } catch (err: any) {
      addToast('error', err.message || 'Gagal menghapus file.');
    } finally {
      setIsDeletingFile(false);
    }
  };

  // One-click Backup Bimbel Data to Google Drive
  const handleBackupToDrive = async () => {
    setIsBackingUp(true);
    setBackupSuccess(null);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toLocaleTimeString('id-ID').replace(/:/g, '-');
      const backupFolderName = `Bimbel EduCendikia Backup ${dateStr}_${timeStr}`;

      // 1. Create backup folder in current location (or root)
      const folder = await googleDriveService.createFolder(
        backupFolderName,
        currentFolder?.id
      );

      // 2. Generate Data Siswa CSV
      const headers = ['nama', 'kelas', 'nis', 'jenis_kelamin', 'asal_sekolah', 'program', 'nama_orang_tua', 'no_hp_orang_tua', 'alamat'];
      const rows = students.map(s => [
        s.name,
        s.grade,
        s.nis,
        s.gender || 'L',
        s.school || '',
        (s.programNames || []).join('; '),
        s.parentName || '',
        s.parentPhone || '',
        s.address || ''
      ]);
      const csvContent = '\uFEFF' + [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\r\n');

      await googleDriveService.uploadTextContent(
        `Data_Siswa_${dateStr}.csv`,
        csvContent,
        'text/csv;charset=utf-8;',
        folder.id
      );

      // 3. Generate Ringkasan Keuangan JSON
      const financialData = {
        exportedAt: new Date().toISOString(),
        exportedBy: userProfile?.name || 'Administrator',
        tagihanSiswaCount: studentCharges.length,
        pembayaranSiswaCount: studentPayments.length,
        pengeluaranCount: expenses.length,
        totalSiswa: students.length,
        totalJadwal: schedules.length,
        totalPertemuan: meetings.length,
        charges: studentCharges,
        payments: studentPayments,
        expenses: expenses
      };

      await googleDriveService.uploadTextContent(
        `Rekap_Keuangan_Lengkap_${dateStr}.json`,
        JSON.stringify(financialData, null, 2),
        'application/json;charset=utf-8;',
        folder.id
      );

      setBackupSuccess(backupFolderName);
      addToast('success', `Cadangan data bimbel berhasil disimpan ke folder "${backupFolderName}" di Google Drive!`);
      loadAboutAndFiles(currentFolder?.id);
    } catch (err: any) {
      console.error('Backup error:', err);
      addToast('error', err.message || 'Gagal mencadangkan data ke Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Helper file icon & format
  const getFileIcon = (file: GoogleDriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="w-8 h-8 text-amber-500 fill-amber-500/20" />;
    }
    if (file.mimeType.includes('sheet') || file.mimeType === 'text/csv') {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    }
    if (file.mimeType.includes('document') || file.mimeType.includes('word') || file.mimeType.includes('text')) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
    if (file.mimeType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-rose-600" />;
    }
    if (file.mimeType.includes('image/')) {
      return <ImageIcon className="w-8 h-8 text-purple-600" />;
    }
    if (file.mimeType.includes('json') || file.mimeType.includes('code')) {
      return <FileCode className="w-8 h-8 text-amber-600" />;
    }
    return <File className="w-8 h-8 text-slate-500" />;
  };

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '-';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <HardDrive className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Google Drive Cloud Storage
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola modul belajar, slip laporan, dokumen siswa, dan pencadangan database terintegrasi langsung dengan Google Drive Anda.
          </p>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah File</span>
            </button>

            <button
              onClick={() => setIsNewFolderModalOpen(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span>Buat Folder</span>
            </button>

            <button
              onClick={handleBackupToDrive}
              disabled={isBackingUp}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              title="Cadangkan Data Siswa dan Keuangan Bimbel ke Google Drive"
            >
              {isBackingUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              <span>{isBackingUp ? 'Mencadangkan...' : 'Cadangkan Data'}</span>
            </button>
          </div>
        )}
      </div>

      {/* JIKA BELUM TERHUBUNG: PROMINENT GOOGLE SIGN IN CARD */}
      {!isConnected ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/50 border border-indigo-100 shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center mx-auto text-indigo-600">
            <HardDrive className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Hubungkan Akun Google Drive
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Hubungkan akun Google Drive Anda untuk menyimpan modul belajar bimbel, backup data siswa secara otomatis, serta mengunduh dan mengunggah berkas secara aman.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
            <div className="p-3.5 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs mb-2">
                1
              </span>
              <h4 className="font-bold text-slate-800 text-xs">Simpan Modul</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Unggah dan bagikan materi les ke guru dan siswa.</p>
            </div>
            <div className="p-3.5 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-xs mb-2">
                2
              </span>
              <h4 className="font-bold text-slate-800 text-xs">Pencadangan Otomatis</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Simpan salinan data siswa dan laporan keuangan ke cloud.</p>
            </div>
            <div className="p-3.5 bg-white/80 rounded-2xl border border-slate-100 shadow-xs">
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-xs mb-2">
                3
              </span>
              <h4 className="font-bold text-slate-800 text-xs">Aman & Terenkripsi</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Token disimpan hanya di memori sesi aktif Anda.</p>
            </div>
          </div>

          {/* Official Google Sign-In Button as mandated by skill */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
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
            Izin Google Drive diminta dengan persetujuan Anda untuk membaca dan mengelola berkas.
          </p>
        </div>
      ) : (
        /* SAAT TERHUBUNG: STATUS BAR + FILE EXPLORER */
        <div className="space-y-4">
          {/* USER & STORAGE INFO BAR */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {aboutInfo?.user?.photoLink ? (
                <img
                  src={aboutInfo.user.photoLink}
                  alt={aboutInfo.user.displayName}
                  className="w-10 h-10 rounded-full border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {aboutInfo?.user?.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">
                    {aboutInfo?.user?.displayName || 'Google Drive Terhubung'}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500">{aboutInfo?.user?.emailAddress || 'Akun Google'}</p>
              </div>
            </div>

            {aboutInfo?.storageQuota && (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-right">
                  <p className="text-[11px] text-slate-500 font-medium">Kapasitas Google Drive</p>
                  <p className="text-xs font-bold text-slate-800">
                    {formatBytes(aboutInfo.storageQuota.usage)} / {formatBytes(aboutInfo.storageQuota.limit)}
                  </p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Putuskan sambungan Google Drive dari sesi ini"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>
            )}
          </div>

          {backupSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900">
                  Cadangan bimbel baru tersimpan di folder: <strong>{backupSuccess}</strong>
                </p>
              </div>
              <button
                onClick={() => setBackupSuccess(null)}
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                Tutup
              </button>
            </div>
          )}

          {/* EXPLORER TOOLBAR & FILTERS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-600 overflow-x-auto py-1">
                <button
                  onClick={handleNavigateRoot}
                  className={`font-semibold hover:text-indigo-600 flex items-center gap-1 cursor-pointer ${
                    !currentFolder ? 'text-indigo-600 font-bold' : ''
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Drive Saya</span>
                </button>

                {folderHistory.map((f, idx) => (
                  <React.Fragment key={f.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <button
                      onClick={() => {
                        const newHist = folderHistory.slice(0, idx);
                        setFolderHistory(newHist);
                        setCurrentFolder(f);
                      }}
                      className="hover:text-indigo-600 font-medium whitespace-nowrap cursor-pointer"
                    >
                      {f.name}
                    </button>
                  </React.Fragment>
                ))}

                {currentFolder && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {currentFolder.name}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentFolder && (
                  <button
                    onClick={handleNavigateBack}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    ← Kembali
                  </button>
                )}
                <button
                  onClick={() => loadAboutAndFiles(currentFolder?.id)}
                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Muat Ulang Berkas"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search & Filter Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari file atau folder di Drive..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadAboutAndFiles(currentFolder?.id)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: 'folders', label: 'Folder' },
                    { id: 'documents', label: 'Modul & Dokumen' },
                    { id: 'spreadsheets', label: 'Spreadsheet / CSV' },
                    { id: 'pdf', label: 'PDF' },
                    { id: 'images', label: 'Gambar' }
                  ] as const
                ).map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setMimeFilter(chip.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      mimeFilter === chip.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FILE GRID / LIST */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
            {loadingFiles ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Memuat berkas dari Google Drive...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Tidak ada berkas ditemukan</h4>
                <p className="text-xs text-slate-500">
                  {searchQuery ? 'Coba ganti kata kunci pencarian Anda.' : 'Folder ini masih kosong. Klik tombol "Unggah File" atau "Buat Folder" untuk mulai menyimpan berkas.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {files.map(file => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const isCsv = file.mimeType === 'text/csv' || file.name.endsWith('.csv');

                  return (
                    <div
                      key={file.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                        isFolder
                          ? 'border-amber-200/70 bg-amber-50/30 hover:bg-amber-50/70 hover:border-amber-300'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm'
                      }`}
                    >
                      <div
                        onClick={() => isFolder && handleOpenFolder(file)}
                        className={`space-y-2.5 ${isFolder ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka di Google Drive"
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileToDelete(file);
                              }}
                              title="Hapus dari Google Drive"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-xs text-slate-900 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{isFolder ? 'Folder' : formatBytes(file.size)}</span>
                            {file.modifiedTime && (
                              <>
                                <span>•</span>
                                <span>{new Date(file.modifiedTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom actions for CSV or quick open */}
                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        {isFolder ? (
                          <button
                            onClick={() => handleOpenFolder(file)}
                            className="text-amber-700 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <span>Buka Folder</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : isCsv ? (
                          <button
                            onClick={async () => {
                              try {
                                addToast('info', 'Mengunduh data CSV dari Google Drive...');
                                const content = await googleDriveService.getFileTextContent(file.id);
                                if (onImportStudentsFromFile) {
                                  onImportStudentsFromFile(content);
                                } else if (onNavigate) {
                                  onNavigate('students');
                                  addToast('success', 'Buka modal Impor di Data Siswa untuk memasukkan data.');
                                }
                              } catch (err: any) {
                                addToast('error', err.message || 'Gagal membaca CSV.');
                              }
                            }}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>Impor ke Siswa</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 truncate">
                            {file.mimeType.split('/')[1] || 'Berkas'}
                          </span>
                        )}

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-600 hover:underline font-semibold"
                          >
                            Lihat File
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL BUAT FOLDER BARU */}
      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title="Buat Folder Baru di Google Drive"
        description={currentFolder ? `Folder akan dibuat di dalam "${currentFolder.name}"` : 'Folder akan dibuat di Drive Saya'}
        maxWidth="md"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Folder *
            </label>
            <input
              type="text"
              required
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Contoh: Modul Matematika SMP / Slip Honor 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewFolderModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreatingFolder || !newFolderName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isCreatingFolder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isCreatingFolder ? 'Membuat...' : 'Buat Folder'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL UNGGAH FILE */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Unggah File ke Google Drive"
        description={currentFolder ? `File akan diunggah ke folder "${currentFolder.name}"` : 'File akan diunggah ke Drive Saya'}
        maxWidth="md"
      >
        <form onSubmit={handleUploadFile} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Berkas *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl text-center cursor-pointer transition-all"
            >
              <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              {selectedFileToUpload ? (
                <div>
                  <p className="font-bold text-slate-800 text-xs">{selectedFileToUpload.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{formatBytes(String(selectedFileToUpload.size))}</p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-slate-800 text-xs">Klik untuk memilih berkas dari komputer</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dapat berupa PDF, Word, Excel, CSV, Foto, atau Video</p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFileToUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Keterangan / Catatan File (Opsional)
            </label>
            <input
              type="text"
              value={uploadDescription}
              onChange={e => setUploadDescription(e.target.value)}
              placeholder="Contoh: Modul latihan bab pecahan kelas 7"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFileToUpload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isUploading ? 'Mengunggah...' : 'Mulai Unggah'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MANDATORY CONFIRMATION DIALOG FOR DELETION (WORKSPACE INTEGRATION SKILL) */}
      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteFile}
        title="Hapus Berkas dari Google Drive?"
        message={`Apakah Anda yakin ingin menghapus "${fileToDelete?.name}" dari Google Drive Anda? Tindakan ini akan menghapus berkas dari akun Google Drive Anda.`}
        confirmText="Ya, Hapus dari Drive"
        cancelText="Batal"
        type="danger"
        isLoading={isDeletingFile}
      />
    </div>
  );
};
