import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

interface AdminRouteProps {
  children: ReactNode;
  onRedirectToGuru?: () => void;
  onNavigateToLogin?: () => void;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  onRedirectToGuru,
  onNavigateToLogin 
}) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg">Memeriksa Hak Akses Admin</h3>
          <p className="text-slate-400 text-xs mt-2">
            Verifikasi otorisasi tingkat Administrator...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (onNavigateToLogin) {
      onNavigateToLogin();
      return null;
    }
  }

  if (role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-rose-200">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Akses Ditolak (403)</h2>
          <p className="text-slate-600 text-sm mt-2">
            Anda tidak memiliki izin untuk mengakses halaman Administrator. Halaman ini dikhususkan bagi staf administrasi lembaga.
          </p>
          <div className="mt-6">
            <button
              onClick={onRedirectToGuru}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard Guru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
