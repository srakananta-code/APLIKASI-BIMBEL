import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface GuardProps {
  children: ReactNode;
  onNavigateToLogin?: () => void;
}

export const ProtectedRoute: React.FC<GuardProps> = ({ children, onNavigateToLogin }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg">Memeriksa Sesi Pengguna</h3>
          <p className="text-slate-400 text-xs mt-2">
            Menghubungkan ke sistem otentikasi Firebase...
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
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Akses Dibatasi</h2>
          <p className="text-slate-600 text-sm mt-2">
            Silakan masuk terlebih dahulu untuk mengakses halaman administrasi.
          </p>
          <button
            onClick={onNavigateToLogin}
            className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
          >
            Menuju Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
