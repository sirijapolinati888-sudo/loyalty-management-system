import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <span className="text-sm text-[var(--text-3)]">Verifying session…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If user's role is not authorized for this specific route, redirect them to their home route
    const defaultRouteMap: Record<UserRole, string> = {
      OPERATIONS_MANAGER: '/',
      STORE_OPERATOR: '/orders',
      ANALYST: '/validation',
      CUSTOMER: '/ledger',
    };
    return <Navigate to={defaultRouteMap[user.role] || '/'} replace />;
  }

  return <>{children}</>;
};
