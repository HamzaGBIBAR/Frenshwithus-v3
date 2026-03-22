import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

// Shared Global UI components
import AnimatedBackground from './components/AnimatedBackground';
import FireParticles from './components/FireParticles';
import FloatingLetters from './components/FloatingLetters';
import CustomCursor from './components/CustomCursor';
import SkeletonLoader from './components/SkeletonLoader';
import ErrorBoundary from './components/ErrorBoundary';
import CookieBanner from './components/CookieBanner';

// Lazy-loaded Pages & Layouts
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const ReservationChoice = lazy(() => import('./pages/ReservationChoice'));
const Reservation = lazy(() => import('./pages/Reservation'));
const Live = lazy(() => import('./pages/Live'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const ProfessorLayout = lazy(() => import('./layouts/ProfessorLayout'));
const StudentLayout = lazy(() => import('./layouts/StudentLayout'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

function GlobalAnimations() {
  const location = useLocation();
  // We only show heavy animations on landing and login pages so Dashboards remain clean
  const showHeavyAnimations = ['/', '/login'].includes(location.pathname);
  
  return (
    <>
      <CustomCursor />
      {showHeavyAnimations && (
        <>
          <AnimatedBackground />
          <FireParticles />
          <FloatingLetters />
        </>
      )}
    </>
  );
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white/80 dark:bg-[#111111]/95 text-text dark:text-[#f5f5f5]">
        <SkeletonLoader className="max-w-4xl" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-8 bg-white/80 dark:bg-[#111111]/95">
        <SkeletonLoader className="max-w-4xl pt-16" />
      </div>
    }>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reservation" element={<ReservationChoice />} />
        <Route path="/reservation/form" element={<Reservation />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
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
    </Suspense>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <GlobalAnimations />
              <div className="relative z-10 transition-all duration-500">
                <AppRoutes />
              </div>
              <CookieBanner />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
