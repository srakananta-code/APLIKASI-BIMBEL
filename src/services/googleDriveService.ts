import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { GoogleDriveFile, GoogleDriveAbout } from '../types';

export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.scripts'
];

export const GOOGLE_DRIVE_SCOPES = GOOGLE_WORKSPACE_SCOPES;

// In-memory token storage (MANDATORY: Never persist to localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: FirebaseUser | null = null;
let tokenListeners: Array<(token: string | null) => void> = [];

// Setup Google Auth Provider with full requested Drive scopes
const createDriveProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  GOOGLE_DRIVE_SCOPES.forEach(scope => {
    provider.addScope(scope);
  });
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline'
  });
  return provider;
};

// Clear cached token if user signs out from Firebase
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedGoogleUser = null;
    tokenListeners.forEach(listener => listener(null));
  }
});

export const googleDriveService = {
  /**
   * Subscribe to Drive auth changes
   */
  onDriveAuthStateChanged(callback: (token: string | null) => void): () => void {
    tokenListeners.push(callback);
    callback(cachedAccessToken);
    return () => {
      tokenListeners = tokenListeners.filter(l => l !== callback);
    };
  },

  /**
   * Mengambil access token yang sedang aktif di memori
   */
  getAccessToken(): string | null {
    return cachedAccessToken;
  },

  /**
   * Mengecek apakah Google Drive saat ini terhubung
   */
  isConnected(): boolean {
    return Boolean(cachedAccessToken);
  },

  /**
   * Mengambil data profil user Google yang terhubung
   */
  getConnectedUser(): FirebaseUser | null {
    return cachedGoogleUser || auth.currentUser;
  },

  /**
   * Menghubungkan akun Google Drive via Google Popup Auth
   */
  async connect(): Promise<{ user: FirebaseUser; accessToken: string }> {
    try {
      const provider = createDriveProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Gagal mendapatkan token akses Google Drive. Pastikan izin telah diberikan.');
      }

      cachedAccessToken = credential.accessToken;
      cachedGoogleUser = result.user;
      tokenListeners.forEach(listener => listener(cachedAccessToken));

      return {
        user: result.user,
        accessToken: cachedAccessToken
      };
    } catch (error: any) {
      console.error('Error connecting Google Drive:', error);
      throw error;
    }
  },

  /**
   * Memutuskan sambungan Google Drive (hapus token dari memori)
   */
  disconnect(): void {
    cachedAccessToken = null;
    cachedGoogleUser = null;
    tokenListeners.forEach(listener => listener(null));
  },

  /**
   * Mengambil informasi kuota & akun Google Drive
   */
  async getAbout(): Promise<GoogleDriveAbout> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.disconnect();
        throw new Error('Sesi Google Drive telah berakhir. Silakan hubungkan kembali.');
      }
      throw new Error(`Gagal memuat profil Google Drive: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Mengambil daftar file dan folder dari Google Drive
   */
  async listFiles(options: {
    folderId?: string;
    searchQuery?: string;
    mimeTypeFilter?: 'all' | 'folders' | 'documents' | 'spreadsheets' | 'pdf' | 'images';
    pageSize?: number;
    pageToken?: string;
  } = {}): Promise<{ files: GoogleDriveFile[]; nextPageToken?: string }> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const queryParts: string[] = ['trashed = false'];

    // Filter by parent folder (or root)
    if (options.folderId) {
      queryParts.push(`'${options.folderId}' in parents`);
    } else {
      // By default show root files or general list if not specified
      // queryParts.push(`'root' in parents`);
    }

    // Filter by search name
    if (options.searchQuery?.trim()) {
      const cleanQ = options.searchQuery.replace(/'/g, "\\'");
      queryParts.push(`name contains '${cleanQ}'`);
    }

    // Filter by mime type
    if (options.mimeTypeFilter) {
      switch (options.mimeTypeFilter) {
        case 'folders':
          queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
          break;
        case 'documents':
          queryParts.push("(mimeType = 'application/vnd.google-apps.document' or mimeType contains 'word' or mimeType contains 'text')");
          break;
        case 'spreadsheets':
          queryParts.push("(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType contains 'sheet' or mimeType = 'text/csv')");
          break;
        case 'pdf':
          queryParts.push("mimeType = 'application/pdf'");
          break;
        case 'images':
          queryParts.push("mimeType contains 'image/'");
          break;
      }
    }

    const qParam = encodeURIComponent(queryParts.join(' and '));
    const pageSize = options.pageSize || 50;
    const pageTokenParam = options.pageToken ? `&pageToken=${encodeURIComponent(options.pageToken)}` : '';
    const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,webContentLink,iconLink,thumbnailLink,parents,owners)');
    const orderBy = encodeURIComponent('folder,modifiedTime desc');

    const url = `https://www.googleapis.com/drive/v3/files?q=${qParam}&pageSize=${pageSize}&fields=${fields}&orderBy=${orderBy}${pageTokenParam}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.disconnect();
        throw new Error('Sesi Google Drive berakhir. Silakan hubungkan kembali.');
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Gagal mengambil daftar file: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken
    };
  },

  /**
   * Membuat folder baru di Google Drive
   */
  async createFolder(name: string, parentFolderId?: string): Promise<GoogleDriveFile> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const body: Record<string, any> = {
      name: name.trim(),
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentFolderId) {
      body.parents = [parentFolderId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink,modifiedTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat folder: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Mencari atau membuat folder jika belum ada (misal folder "Bimbel EduCendikia")
   */
  async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<GoogleDriveFile> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const cleanName = folderName.replace(/'/g, "\\'");
    let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${cleanName}' and trashed = false`;
    if (parentFolderId) {
      q += ` and '${parentFolderId}' in parents`;
    }

    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,modifiedTime)`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
    }

    // Jika belum ada, buat baru
    return await this.createFolder(folderName, parentFolderId);
  },

  /**
   * Mengunggah file dari input File browser ke Google Drive (Multipart upload)
   */
  async uploadFile(
    file: File,
    parentFolderId?: string,
    description?: string
  ): Promise<GoogleDriveFile> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const metadata: Record<string, any> = {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      description: description || 'Diupload melalui Aplikasi Administrasi Les'
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const mediaPartHeader = `${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

    const fileBuffer = await file.arrayBuffer();
    const encoder = new TextEncoder();

    const part1 = encoder.encode(metadataPart);
    const part2 = encoder.encode(mediaPartHeader);
    const part3 = new Uint8Array(fileBuffer);
    const part4 = encoder.encode(closeDelimiter);

    // Gabungkan binary parts
    const totalLength = part1.length + part2.length + part3.length + part4.length;
    const body = new Uint8Array(totalLength);
    let offset = 0;
    body.set(part1, offset); offset += part1.length;
    body.set(part2, offset); offset += part2.length;
    body.set(part3, offset); offset += part3.length;
    body.set(part4, offset);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,modifiedTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: body
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengunggah file: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Mengunggah konten teks (misal CSV data siswa, ringkasan laporan, JSON backup)
   */
  async uploadTextContent(
    fileName: string,
    content: string,
    mimeType: string = 'text/csv;charset=utf-8;',
    parentFolderId?: string
  ): Promise<GoogleDriveFile> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: mimeType.split(';')[0]
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}` +
      `${delimiter}Content-Type: ${mimeType}\r\n\r\n${content}` +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,modifiedTime', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menyimpan ke Drive: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Mengambil isi file (misal file CSV untuk diimpor ke sistem)
   */
  async getFileTextContent(fileId: string): Promise<string> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Gagal membaca file dari Google Drive (${res.statusText})`);
    }

    return await res.text();
  },

  /**
   * Menghapus file dari Google Drive
   * PERHATIAN: Wajib melalui modal konfirmasi user sebelum memanggil fungsi ini!
   */
  async deleteFile(fileId: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Drive belum terhubung.');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menghapus file: ${res.statusText}`);
    }
  }
};
