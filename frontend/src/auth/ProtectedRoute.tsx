import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type Role } from './AuthContext';

interface Props {
  children: ReactNode;
  requireRole?: Role;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requireRole && user.role !== requireRole) return <Navigate to="/" replace />;

  return <>{children}</>;
}
