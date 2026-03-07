import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import AnimatedBackground from './components/AnimatedBackground';
import FloatingLetters from './components/FloatingLetters';
import CustomCursor from './components/CustomCursor';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Live from './pages/Live';
import AdminLayout from './layouts/AdminLayout';
import ProfessorLayout from './layouts/ProfessorLayout';
import StudentLayout from './layouts/StudentLayout';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white/80 dark:bg-[#111111]/95 text-text dark:text-[#f5f5f5]">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/live"
        element={
          <ProtectedRoute roles={['STUDENT', 'PROFESSOR']}>
            <Live />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/*"
        element={
          <ProtectedRoute roles={['PROFESSOR']}>
            <ProfessorLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
        <CustomCursor />
        <AnimatedBackground />
        <FloatingLetters />
        <div className="relative z-10 transition-all duration-500">
          <AppRoutes />
        </div>
      </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
