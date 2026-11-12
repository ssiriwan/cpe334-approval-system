import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { NewRequestPage } from './pages/NewRequestPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import { PendingReviewsPage } from './pages/PendingReviewsPage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';
import { ForbiddenPage, NotFoundPage } from './pages/ErrorPages';
import type { Role } from './lib/api';

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Layout>
        <ForbiddenPage />
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

function PublicLoginRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Checking session...
      </div>
    );
  }
  if (user) {
    return <Navigate to={user.role === 'REVIEWER' ? '/reviewer/pending' : '/requests/my'} replace />;
  }
  return <LoginPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicLoginRoute />} />
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute allowedRoles={['REQUESTER', 'REVIEWER']}>
            <NewRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/my"
        element={
          <ProtectedRoute>
            <MyRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <RequestDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/pending"
        element={
          <ProtectedRoute allowedRoles={['REVIEWER']}>
            <PendingReviewsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/requests/:id"
        element={
          <ProtectedRoute allowedRoles={['REVIEWER']}>
            <ReviewDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/403"
        element={
          <Layout>
            <ForbiddenPage />
          </Layout>
        }
      />
      <Route path="/" element={<Navigate to="/requests/my" replace />} />
      <Route
        path="*"
        element={
          <Layout>
            <NotFoundPage />
          </Layout>
        }
      />
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
