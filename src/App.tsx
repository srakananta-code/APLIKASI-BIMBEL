import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { AdminRoute } from './guards/AdminRoute';
import { GuruRoute } from './guards/GuruRoute';
import { Loader2 } from 'lucide-react';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentsPage } from './pages/admin/StudentsPage';
import { TeachersPage } from './pages/admin/TeachersPage';
import { ProgramsPage } from './pages/admin/ProgramsPage';
import { SchedulesPage } from './pages/admin/SchedulesPage';
import { MeetingsPage } from './pages/admin/MeetingsPage';
import { StudentChargesPage } from './pages/admin/StudentChargesPage';
import { StudentPaymentsPage } from './pages/admin/StudentPaymentsPage';
import { ReceivablesPage } from './pages/admin/ReceivablesPage';
import { FinancialSummaryPage } from './pages/admin/FinancialSummaryPage';
import { TeacherHonorPage } from './pages/admin/TeacherHonorPage';
import { TeacherPaymentsPage } from './pages/admin/TeacherPaymentsPage';
import { ExpensesPage } from './pages/admin/ExpensesPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { NotificationsPage } from './pages/common/NotificationsPage';
import { GoogleDrivePage } from './pages/common/GoogleDrivePage';
import { GoogleSheetsPage } from './pages/common/GoogleSheetsPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherSchedulesPage } from './pages/teacher/TeacherSchedulesPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { TeacherMeetingsHistoryPage } from './pages/teacher/TeacherMeetingsHistoryPage';
import { TeacherStudentsPage } from './pages/teacher/TeacherStudentsPage';
import { TeacherHonorViewPage } from './pages/teacher/TeacherHonorViewPage';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, role, userProfile } = useAuth();
  const { addToast } = useApp();

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync initial page according to authenticated role
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'GURU') {
        if (!currentPage.startsWith('guru-')) {
          setCurrentPage('guru-dashboard');
        }
      } else if (role === 'ADMIN') {
        if (currentPage.startsWith('guru-')) {
          setCurrentPage('dashboard');
        }
      }
    }
  }, [isAuthenticated, role]);

  const handleNavigate = (page: string) => {
    // Role Authorization Guard check on client navigation
    if (role === 'GURU' && !page.startsWith('guru-')) {
      addToast('error', 'Akses Ditolak: Anda tidak memiliki izin untuk membuka halaman Administrator.');
      setCurrentPage('guru-dashboard');
      return;
    }

    setCurrentPage(page);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Loading State Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg">Memeriksa Sesi Pengguna...</h3>
          <p className="text-slate-400 text-xs mt-2">
            Mengamankan koneksi & memverifikasi otorisasi akun...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Show Login Page
  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <LoginPage
          onSuccessRedirect={(userRole) => {
            if (userRole === 'ADMIN') {
              setCurrentPage('dashboard');
            } else {
              setCurrentPage('guru-dashboard');
            }
          }}
        />
      </>
    );
  }

  // 3. Authenticated -> Render Role-Protected Page
  const renderCurrentPage = () => {
    switch (currentPage) {
      // Admin Routes (Guarded by AdminRoute)
      case 'dashboard':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <AdminDashboard onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'students':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <StudentsPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'teachers':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <TeachersPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'programs':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <ProgramsPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'schedules':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <SchedulesPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'meetings':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <MeetingsPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'financial-summary':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <FinancialSummaryPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'receivables':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <ReceivablesPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'student-charges':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <StudentChargesPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'student-payments':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <StudentPaymentsPage />
          </AdminRoute>
        );
      case 'teacher-honor':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <TeacherHonorPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'teacher-payments':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <TeacherPaymentsPage />
          </AdminRoute>
        );
      case 'expenses':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <ExpensesPage />
          </AdminRoute>
        );
      case 'reports':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <ReportsPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'users':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <UsersPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'settings':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <SettingsPage />
          </AdminRoute>
        );
      case 'audit-logs':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <AuditLogsPage />
          </AdminRoute>
        );
      case 'notifications':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <NotificationsPage onNavigate={handleNavigate} />
          </AdminRoute>
        );
      case 'google-drive':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <GoogleDrivePage
              onNavigate={handleNavigate}
            />
          </AdminRoute>
        );
      case 'google-sheets':
        return (
          <AdminRoute onRedirectToGuru={() => setCurrentPage('guru-dashboard')}>
            <GoogleSheetsPage
              onNavigate={handleNavigate}
            />
          </AdminRoute>
        );

      // Guru Routes (Guarded by GuruRoute)
      case 'guru-dashboard':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <TeacherDashboard onNavigate={handleNavigate} />
          </GuruRoute>
        );
      case 'guru-schedules':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <TeacherSchedulesPage onNavigate={handleNavigate} />
          </GuruRoute>
        );
      case 'guru-attendance':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <TeacherAttendancePage onNavigate={handleNavigate} />
          </GuruRoute>
        );
      case 'guru-meetings':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <TeacherMeetingsHistoryPage onNavigate={handleNavigate} />
          </GuruRoute>
        );
      case 'guru-students':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <TeacherStudentsPage />
          </GuruRoute>
        );
      case 'guru-honor':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <TeacherHonorViewPage />
          </GuruRoute>
        );
      case 'guru-profile':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <TeacherProfilePage />
          </GuruRoute>
        );
      case 'guru-notifications':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <NotificationsPage onNavigate={handleNavigate} />
          </GuruRoute>
        );
      case 'guru-drive':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <GoogleDrivePage onNavigate={handleNavigate} />
          </GuruRoute>
        );
      case 'guru-sheets':
        return (
          <GuruRoute onRedirectToAdmin={() => setCurrentPage('dashboard')}>
            <GoogleSheetsPage onNavigate={handleNavigate} />
          </GuruRoute>
        );

      default:
        return role === 'ADMIN' ? (
          <AdminDashboard onNavigate={handleNavigate} />
        ) : (
          <TeacherDashboard onNavigate={handleNavigate} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      <Navbar onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)} onNavigate={handleNavigate} />
      <ToastContainer />

      <div className="flex-1 flex w-full">
        {/* Sidebar Navigation */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
