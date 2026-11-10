import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loading } from './components/Feedback';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import { AdminCategoriesPage, AdminHomePage, AdminStatisticsPage, AdminUsersPage } from './pages/AdminPages';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import CreateTicketPage from './pages/CreateTicketPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import TicketDetailPage from './pages/TicketDetailPage';
import TicketsPage from './pages/TicketsPage';
import type { Role } from './types';

/** Пускает только авторизованных (и, если указаны roles, только нужные роли). Реальные права проверяет сервер. */
function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading text="Проверяем сессию…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/tickets/create" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/staff/dashboard" element={<Protected roles={['STAFF', 'ADMIN']}><StaffDashboardPage /></Protected>} />
        <Route path="/admin" element={<Protected roles={['ADMIN']}><AdminHomePage /></Protected>} />
        <Route path="/admin/users" element={<Protected roles={['ADMIN']}><AdminUsersPage /></Protected>} />
        <Route path="/admin/categories" element={<Protected roles={['ADMIN']}><AdminCategoriesPage /></Protected>} />
        <Route path="/admin/statistics" element={<Protected roles={['ADMIN']}><AdminStatisticsPage /></Protected>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
