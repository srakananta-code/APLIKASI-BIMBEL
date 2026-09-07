import { googleDriveService } from './googleDriveService';
import { GoogleSpreadsheetMetadata, GoogleSheetTab, Student, StudentCharge, StudentPayment, Expense } from '../types';

export const googleSheetsService = {
  /**
   * Cek apakah user sudah terhubung dengan Google Workspace (Drive + Sheets)
   */
  isConnected(): boolean {
    return googleDriveService.isConnected();
  },

  /**
   * Mengambil token akses aktif dari memori
   */
  getAccessToken(): string | null {
    return googleDriveService.getAccessToken();
  },

  /**
   * Hubungkan akun Google (jika belum terhubung)
   */
  async connect() {
    return await googleDriveService.connect();
  },

  /**
   * Putuskan koneksi
   */
  disconnect() {
    googleDriveService.disconnect();
  },

  /**
   * Ambil daftar file spreadsheet Google Sheets milik user
   */
  async listSpreadsheets(searchQuery?: string): Promise<Array<{
    id: string;
    name: string;
    modifiedTime?: string;
    webViewLink?: string;
  }>> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Sheets belum terhubung. Silakan hubungkan akun Google Anda.');

    let q = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
    if (searchQuery?.trim()) {
      const cleanQ = searchQuery.replace(/'/g, "\\'");
      q += ` and name contains '${cleanQ}'`;
    }

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=30&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.disconnect();
        throw new Error('Sesi Google Sheets telah kedaluwarsa. Silakan hubungkan kembali.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengambil daftar spreadsheet: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Mendapatkan metadata spreadsheet (judul, daftar sheets / tabs)
   */
  async getSpreadsheet(spreadsheetId: string): Promise<GoogleSpreadsheetMetadata> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Sheets belum terhubung.');

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal memuat detail spreadsheet: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Mengambil data sel dari range tertentu
   */
  async getValues(spreadsheetId: string, range: string): Promise<any[][]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Sheets belum terhubung.');

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membaca isi spreadsheet: ${res.statusText}`);
    }

    const data = await res.json();
    return data.values || [];
  },

  /**
   * Menulis nilai ke rentang sel
   */
  async updateValues(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Sheets belum terhubung.');

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menyimpan data ke spreadsheet: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Menambahkan baris ke rentang
   */
  async appendValues(spreadsheetId: string, range: string, values: any[][]): Promise<any> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Sheets belum terhubung.');

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menambahkan baris: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Membuat file spreadsheet baru di Google Sheets
   */
  async createSpreadsheet(
    title: string,
    sheetTitles: string[] = ['Sheet1']
  ): Promise<GoogleSpreadsheetMetadata> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Google Sheets belum terhubung.');

    const sheets = sheetTitles.map((st, idx) => ({
      properties: {
        sheetId: idx,
        title: st,
        index: idx
      }
    }));

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: title.trim(),
          locale: 'id_ID',
          timeZone: 'Asia/Jakarta'
        },
        sheets
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat Google Spreadsheet: ${res.statusText}`);
    }

    return await res.json();
  },

  /**
   * Menjalankan batch formatting (warna header, freeze row 1, tebal)
   */
  async formatHeader(spreadsheetId: string, sheetId: number, columnCount: number): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;

    const requests = [
      // Freeze row 1
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: {
              frozenRowCount: 1
            }
          },
          fields: 'gridProperties.frozenRowCount'
        }
      },
      // Format header row: bold, background indigo/blue, text white
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: columnCount
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.28,
                green: 0.35,
                blue: 0.85 // Indigo/Royal Blue
              },
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
                fontSize: 10
              },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
        }
      }
    ];

    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
    } catch (e) {
      console.warn('Could not apply batch formatting to sheet:', e);
    }
  },

  /**
   * Ekspor Data Siswa ke Google Spreadsheet baru
   */
  async exportStudentsToGoogleSheets(
    students: Student[],
    customTitle?: string
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const title = customTitle?.trim() || `Data Siswa Bimbel - ${dateStr}`;

    // 1. Buat Spreadsheet baru
    const spreadsheet = await this.createSpreadsheet(title, ['Data Siswa']);
    const sheetId = spreadsheet.sheets[0]?.properties.sheetId || 0;

    // 2. Siapkan data baris
    const headers = [
      'No',
      'Nama Siswa',
      'Tingkat / Kelas',
      'NIS',
      'Jenis Kelamin',
      'Asal Sekolah',
      'Program Bimbingan',
      'Nama Orang Tua / Wali',
      'No HP Orang Tua',
      'No HP Siswa',
      'Alamat',
      'Status Siswa'
    ];

    const rows = students.map((s, idx) => [
      idx + 1,
      s.name,
      s.grade,
      s.nis || '-',
      s.gender === 'P' ? 'Perempuan' : 'Laki-laki',
      s.school || '-',
      (s.programNames || []).join(', ') || '-',
      s.parentName || '-',
      s.parentPhone || '-',
      s.phone || '-',
      s.address || '-',
      s.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'
    ]);

    const values = [headers, ...rows];

    // 3. Tulis nilai ke Google Sheet
    await this.updateValues(spreadsheet.spreadsheetId, 'Data Siswa!A1', values);

    // 4. Format baris header
    await this.formatHeader(spreadsheet.spreadsheetId, sheetId, headers.length);

    return {
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      title
    };
  },

  /**
   * Ekspor Laporan Keuangan Lengkap ke Google Spreadsheet (Multi-Tab)
   */
  async exportFinancialReportToGoogleSheets(params: {
    charges: StudentCharge[];
    payments: StudentPayment[];
    expenses: Expense[];
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    studentNames?: Record<string, string>;
    title?: string;
  }): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> {
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const title = params.title?.trim() || `Laporan Keuangan Bimbel - ${dateStr}`;

    // 1. Buat Spreadsheet dengan 3 Tab
    const spreadsheet = await this.createSpreadsheet(title, [
      'Ringkasan Keuangan',
      'Tagihan & SPP',
      'Pengeluaran Operasional'
    ]);

    // TAB 1: Ringkasan Keuangan
    const summaryValues = [
      ['LAPORAN KEUANGAN BIMBINGAN BELAJAR'],
      ['Tanggal Dibuat', dateStr],
      [''],
      ['Ringkasan Kas', 'Nominal (Rp)'],
      ['Total Pemasukan (SPP & Tagihan Siswa)', params.totalIncome],
      ['Total Pengeluaran Operasional', params.totalExpense],
      ['Saldo Bersih / Laba Bersih', params.netBalance],
      [''],
      ['Statistik Transaksi', 'Jumlah Data'],
      ['Total Data Tagihan Siswa', params.charges.length],
      ['Total Transaksi Pembayaran Siswa', params.payments.length],
      ['Total Transaksi Pengeluaran', params.expenses.length]
    ];
    await this.updateValues(spreadsheet.spreadsheetId, "'Ringkasan Keuangan'!A1", summaryValues);

    // TAB 2: Tagihan & SPP Siswa
    const chargeHeaders = [
      'No',
      'No Tagihan',
      'Nama Siswa',
      'Bulan / Periode',
      'Total Tagihan (Rp)',
      'Sudah Dibayar (Rp)',
      'Sisa Piutang (Rp)',
      'Status Pembayaran',
      'Tanggal Tagihan'
    ];
    const chargeRows = params.charges.map((c, idx) => [
      idx + 1,
      c.chargeNumber || '-',
      params.studentNames?.[c.studentId] || c.studentId || '-',
      c.period || '-',
      c.amount || 0,
      c.paidAmount || 0,
      c.remainingAmount !== undefined ? c.remainingAmount : Math.max(0, (c.amount || 0) - (c.paidAmount || 0)),
      c.status === 'LUNAS' ? 'Lunas' : c.status === 'SEBAGIAN' ? 'Sebagian' : 'Belum Bayar',
      c.date ? new Date(c.date).toLocaleDateString('id-ID') : '-'
    ]);
    await this.updateValues(spreadsheet.spreadsheetId, "'Tagihan & SPP'!A1", [chargeHeaders, ...chargeRows]);
    await this.formatHeader(spreadsheet.spreadsheetId, spreadsheet.sheets[1]?.properties.sheetId || 1, chargeHeaders.length);

    // TAB 3: Pengeluaran Operasional
    const expenseHeaders = [
      'No',
      'Tanggal',
      'Kategori',
      'Deskripsi Pengeluaran',
      'Nominal (Rp)',
      'Metode Pembayaran',
      'Dicatat Oleh'
    ];
    const expenseRows = params.expenses.map((e, idx) => [
      idx + 1,
      e.date ? new Date(e.date).toLocaleDateString('id-ID') : '-',
      e.category || 'Lain-lain',
      e.description || '-',
      e.amount || 0,
      e.paymentMethod || 'Tunai',
      e.createdBy || 'Admin'
    ]);
    await this.updateValues(spreadsheet.spreadsheetId, "'Pengeluaran Operasional'!A1", [expenseHeaders, ...expenseRows]);
    await this.formatHeader(spreadsheet.spreadsheetId, spreadsheet.sheets[2]?.properties.sheetId || 2, expenseHeaders.length);

    return {
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      title
    };
  },

  /**
   * Parsing dan membaca data siswa dari Google Sheet untuk impor ke sistem
   */
  async readStudentsFromSheet(
    spreadsheetId: string,
    sheetTabName: string = 'Sheet1'
  ): Promise<{
    students: Array<Partial<Student>>;
    rawRows: any[][];
    headers: string[];
  }> {
    const rawRows = await this.getValues(spreadsheetId, `${sheetTabName}!A1:Z500`);
    if (rawRows.length < 2) {
      throw new Error('Lembar spreadsheet tidak memiliki data siswa (minimal 1 baris judul dan 1 baris data).');
    }

    const headers = rawRows[0].map(h => String(h).trim().toLowerCase());

    // Petakan indeks kolom berdasarkan header
    const nameIdx = headers.findIndex(h => h.includes('nama') || h.includes('student'));
    const gradeIdx = headers.findIndex(h => h.includes('kelas') || h.includes('tingkat') || h.includes('grade'));
    const nisIdx = headers.findIndex(h => h.includes('nis'));
    const genderIdx = headers.findIndex(h => h.includes('kelamin') || h.includes('gender') || h.includes('jk'));
    const schoolIdx = headers.findIndex(h => h.includes('sekolah') || h.includes('school'));
    const programIdx = headers.findIndex(h => h.includes('program') || h.includes('kursus') || h.includes('paket'));
    const parentNameIdx = headers.findIndex(h => h.includes('orang tua') || h.includes('wali') || h.includes('parent'));
    const parentPhoneIdx = headers.findIndex(h => (h.includes('hp') || h.includes('wa') || h.includes('telepon')) && (h.includes('orang tua') || h.includes('wali')));
    const phoneIdx = headers.findIndex(h => (h.includes('hp') || h.includes('telepon') || h.includes('wa')) && !h.includes('orang tua') && !h.includes('wali'));
    const addressIdx = headers.findIndex(h => h.includes('alamat') || h.includes('address'));

    if (nameIdx === -1) {
      throw new Error('Kolom "Nama" siswa tidak ditemukan pada baris header spreadsheet.');
    }

    const students: Array<Partial<Student>> = [];

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      const name = row[nameIdx] ? String(row[nameIdx]).trim() : '';
      if (!name) continue; // Skip empty rows

      const grade = gradeIdx !== -1 && row[gradeIdx] ? String(row[gradeIdx]).trim() : 'Kelas 1 SD';
      const nis = nisIdx !== -1 && row[nisIdx] ? String(row[nisIdx]).trim() : '';
      const genderRaw = genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim().toUpperCase() : 'L';
      const gender = genderRaw.startsWith('P') ? 'P' : 'L';
      const school = schoolIdx !== -1 && row[schoolIdx] ? String(row[schoolIdx]).trim() : '';
      const programRaw = programIdx !== -1 && row[programIdx] ? String(row[programIdx]).trim() : '';
      const programNames = programRaw ? programRaw.split(/[,;]/).map(p => p.trim()).filter(Boolean) : [];
      const parentName = parentNameIdx !== -1 && row[parentNameIdx] ? String(row[parentNameIdx]).trim() : '';
      const parentPhone = parentPhoneIdx !== -1 && row[parentPhoneIdx] ? String(row[parentPhoneIdx]).trim() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
      const address = addressIdx !== -1 && row[addressIdx] ? String(row[addressIdx]).trim() : '';

      students.push({
        name,
        grade,
        nis,
        gender,
        school,
        programNames,
        parentName,
        parentPhone,
        phone,
        address,
        status: 'ACTIVE'
      });
    }

    return {
      students,
      rawRows,
      headers: rawRows[0].map(h => String(h).trim())
    };
  }
};
