import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading…</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
