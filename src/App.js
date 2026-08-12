import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/pages/Login';
import Signup from './components/pages/Signup';
import Dashboard from './components/pages/Dashboard';
import ChatHistory from './components/pages/ChatHistory';
import Settings from './components/pages/Settings';
import Voice from './components/pages/Voice';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import TitleBar from './components/layout/TitleBar';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, hasApiKey } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const publicRoutes = ['/', '/signup'];
    const isPublic = publicRoutes.includes(location.pathname);

    if (!isAuthenticated) {
      if (!isPublic) navigate('/');
      return;
    }

    // Logged in but no API key → go to settings (unless already there)
    if (!hasApiKey && location.pathname !== '/settings') {
      navigate('/settings');
      return;
    }

    // Logged in with API key on login page → go to dashboard
    if (isPublic && hasApiKey) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, hasApiKey, location.pathname, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const ProtectedLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setSidebarCollapsed(true);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <TitleBar />
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-[220px]'}`} style={{ paddingTop: '40px' }}>
        <Topbar onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="pt-16" style={{ height: 'calc(100vh - 56px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const PageTransitions = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const PublicLayout = ({ children }) => (
  <PageTransitions>{children}</PageTransitions>
);

function App() {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout><PublicRoute><Login /></PublicRoute></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><PublicRoute><Signup /></PublicRoute></PublicLayout>} />
        <Route
          path="/dashboard"
          element={<AuthGuard><ProtectedLayout><Dashboard /></ProtectedLayout></AuthGuard>}
        />
        <Route
          path="/chat"
          element={<AuthGuard><ProtectedLayout><ChatHistory /></ProtectedLayout></AuthGuard>}
        />
        <Route
          path="/chat/:conversationId"
          element={<AuthGuard><ProtectedLayout><ChatHistory /></ProtectedLayout></AuthGuard>}
        />
        <Route
          path="/voice"
          element={<AuthGuard><ProtectedLayout><Voice /></ProtectedLayout></AuthGuard>}
        />
        <Route
          path="/history"
          element={<AuthGuard><ProtectedLayout><ChatHistory /></ProtectedLayout></AuthGuard>}
        />
        <Route
          path="/settings"
          element={<AuthGuard><ProtectedLayout><Settings /></ProtectedLayout></AuthGuard>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;