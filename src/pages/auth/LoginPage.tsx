import React, { useState } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  UserCheck,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  Building2,
  Phone,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onSuccessRedirect?: (role: 'ADMIN' | 'GURU') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessRedirect }) => {
  const { login, registerAdmin, authError, clearAuthError } = useAuth();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state (Admin baru)
  const [regName, setRegName] = useState('');
  const [regInstitution, setRegInstitution] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (onSuccessRedirect) {
        onSuccessRedirect(result.profile.role);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!regName.trim()) {
      setLocalError('Nama lengkap administrator wajib diisi.');
      return;
    }

    if (!regEmail.trim()) {
      setLocalError('Alamat email administrator wajib diisi.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setLocalError('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak sesuai dengan kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerAdmin({
        displayName: regName.trim(),
        institutionName: regInstitution.trim() || 'Bimbingan Belajar EduCendikia',
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword
      });

      setRegSuccessMessage(`Akun Administrator ${result.profile.name} berhasil dibuat! Mengalihkan ke dashboard...`);
      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect('ADMIN');
        }
      }, 700);
    } catch (err: any) {
      setLocalError(err.message || 'Gagal mendaftarkan administrator baru.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string = 'password123') => {
    setAuthMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setLocalError(null);
    clearAuthError();
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-xl">
            L
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              EduCendikia <span className="text-blue-400">Admin</span>
            </h1>
            <p className="text-xs text-slate-400">Sistem Administrasi Bimbingan Belajar</p>
          </div>
        </div>

        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-100">
          {authMode === 'login' ? 'Masuk ke Portal Bimbel' : 'Pendaftaran Administrator Bimbel'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          {authMode === 'login'
            ? 'Autentikasi Terintegrasi Firebase • Akses Role Admin & Guru'
            : 'Buat akun Admin lembaga Anda untuk mengelola bimbel, tentor, dan murid'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <div className="bg-slate-900/90 border border-slate-800 py-6 px-6 shadow-2xl rounded-2xl sm:px-8 backdrop-blur-xl">
          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLocalError(null);
                clearAuthError();
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setLocalError(null);
                clearAuthError();
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Admin Baru</span>
            </button>
          </div>

          {/* Success Message Box */}
          {regSuccessMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{regSuccessMessage}</span>
            </div>
          )}

          {/* Error Message Box */}
          {displayError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <p className="font-semibold">{authMode === 'login' ? 'Otentikasi Gagal' : 'Pendaftaran Gagal'}</p>
                <p className="mt-0.5 text-rose-200/90">{displayError}</p>
              </div>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {authMode === 'login' && (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@educendikia.com"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 h-4" /> : <Eye className="h-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memeriksa Kredensial...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER ADMIN BARU */}
          {authMode === 'register' && (
            <form className="space-y-3.5" onSubmit={handleRegisterAdminSubmit}>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>
                  Akun ini akan dibuat dengan hak akses penuh <strong>Administrator Lembaga</strong>. Anda dapat membuat akun Tentor dan Admin lainnya setelah masuk.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lengkap Administrator <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="cth: Bambang Santoso, M.Pd."
                  className="block w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Lembaga / Bimbel <span className="text-rose-400">*</span>
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="h-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    placeholder="Bimbingan Belajar EduCendikia"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Tentor dan Admin lain yang Anda buat akan tergabung dalam bimbel ini.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Alamat Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="admin@bimbel.com"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    No. WhatsApp / Telepon
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="h-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kata Sandi <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-3.5 h-3.5" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 karakter"
                      className="block w-full pl-9 pr-9 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="h-3.5 h-3.5" /> : <Eye className="h-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Konfirmasi Sandi <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-3.5 h-3.5" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi sandi"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Jaminan Database Bersih */}
              <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-white">Database Bersih 100%:</span> Seluruh data contoh/demo akan otomatis dikosongkan saat akun Anda dibuat, sehingga sistem siap langsung diisi data asli bimbel Anda.
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mendaftarkan Admin Bimbel...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Daftar & Masuk Sebagai Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Credentials Autofill (Always helpful for testing) */}
          <div className="mt-8 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Akun Uji Coba Cepat (Demo Presets):</span>
            </div>

            <div className="space-y-2">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleQuickFill('admin@educendikia.com', 'password123')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                      Administrator Lembaga (Default)
                    </p>
                    <p className="text-[10px] text-slate-400">admin@educendikia.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Role: ADMIN
                </span>
              </button>

              {/* Guru Budi Button */}
              <button
                type="button"
                onClick={() => handleQuickFill('budi.guru@educendikia.com', 'password123')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      Budi Pratama, S.Pd. (Tentor Matematika)
                    </p>
                    <p className="text-[10px] text-slate-400">budi.guru@educendikia.com • ID: TCH-001</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Role: GURU
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Info Footer */}
        <div className="mt-5 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Sesi terenkripsi Firebase Auth & Firestore • Satu Bimbel Terintegrasi</span>
        </div>
      </div>
    </div>
  );
};
