import React, { useState } from 'react';
import {
  ArrowDownCircle,
  Plus,
  Search,
  Trash2,
  Calendar,
  DollarSign,
  PieChart,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatDateIndonesian } from '../../services/businessLogic';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExpenseCategory, Expense } from '../../types';

export const ExpensesPage: React.FC = () => {
  const { expenses, createExpense, deleteExpense } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'ATK_DAN_MODUL' as ExpenseCategory,
    description: '',
    amount: 50000,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories: ExpenseCategory[] = [
    'SEWA_TEMPAT',
    'LISTRIK_DAN_AIR',
    'INTERNET_DAN_WIFI',
    'ATK_DAN_MODUL',
    'KONSUMSI',
    'MARKETING_PROMOSI',
    'PERAWATAN_INVENTARIS',
    'LAIN_LAIN'
  ];

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const filteredExpenses = expenses.filter(exp => {
    const matchSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'ALL' || exp.category === filterCategory;
    return matchSearch && matchCat;
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.description.trim()) errors.description = 'Keterangan pengeluaran wajib diisi';
    if (!formData.amount || formData.amount <= 0) errors.amount = 'Nominal harus lebih dari 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    createExpense({
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      notes: formData.notes
    });

    setIsFormModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ArrowDownCircle className="w-6 h-6 text-indigo-600" />
            <span>Pengeluaran Operasional Bimbel</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Catat biaya operasional, ATK, modul belajar, sewa, listrik, dan inventaris lembaga
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              category: 'ATK_DAN_MODUL',
              description: '',
              amount: 50000,
              date: new Date().toISOString().split('T')[0],
              notes: ''
            });
            setFormErrors({});
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Semua Pengeluaran
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatRupiah(totalExpense)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{expenses.length} transaksi pengeluaran</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ATK & Modul Belajar
          </p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {formatRupiah(
              expenses
                .filter(e => e.category === 'ATK_DAN_MODUL')
                .reduce((sum, e) => sum + e.amount, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Buku, fotokopi, alat tulis</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Utilitas & Operasional
          </p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {formatRupiah(
              expenses
                .filter(e => e.category === 'LISTRIK_DAN_AIR' || e.category === 'INTERNET_DAN_WIFI' || e.category === 'SEWA_TEMPAT')
                .reduce((sum, e) => sum + e.amount, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Listrik, internet, sewa gedung</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari deskripsi pengeluaran..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="w-full md:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
        >
          <option value="ALL">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* SECTION AD: Table Pengeluaran */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-center w-10">No</th>
                <th className="px-4 py-3.5 font-semibold">No. Bukti</th>
                <th className="px-4 py-3.5 font-semibold">Tanggal</th>
                <th className="px-4 py-3.5 font-semibold">Kategori</th>
                <th className="px-4 py-3.5 font-semibold">Deskripsi Pengeluaran</th>
                <th className="px-4 py-3.5 font-semibold">Dicatat Oleh</th>
                <th className="px-4 py-3.5 font-semibold text-right">Nominal</th>
                <th className="px-4 py-3.5 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp, idx) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
                    {exp.expenseNumber}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {formatDateIndonesian(exp.date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {exp.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <p>{exp.description}</p>
                    {exp.notes && <p className="text-[10px] text-slate-400">{exp.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {exp.recordedBy}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-rose-600 text-sm whitespace-nowrap">
                    {formatRupiah(exp.amount)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => setDeletingExpenseId(exp.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Catat Pengeluaran Operasional"
        description="Masukkan rincian pengeluaran kas lembaga bimbel"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kategori Pengeluaran *
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deskripsi Pengeluaran *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Beli Spidol Whiteboard & Kertas HVS"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs ${
                formErrors.description ? 'border-rose-300' : 'border-slate-200'
              }`}
            />
            {formErrors.description && (
              <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nominal Biaya (Rp) *
              </label>
              <input
                type="number"
                step="1000"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-bold text-slate-900"
              />
              {formErrors.amount && (
                <p className="text-rose-500 text-[10px] mt-0.5">{formErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan / Referensi Nota (Opsional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="No. Struk Toko Gramedia"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
            />
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Simpan Pengeluaran
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog
        isOpen={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={() => {
          if (deletingExpenseId) {
            deleteExpense(deletingExpenseId);
            setDeletingExpenseId(null);
          }
        }}
        title="Hapus Catatan Pengeluaran"
        message="Apakah Anda yakin ingin menghapus catatan pengeluaran ini?"
        variant="danger"
        confirmText="Hapus Pengeluaran"
      />
    </div>
  );
};
