import React from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';


export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-container-lowest text-primary font-mono text-xs">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          <span>Authenticating telemetry session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Redirect to the user's primary dashboard based on their role
    const roleLower = String(user.role).toLowerCase();
    if (roleLower === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (roleLower === 'pm') {
      return <Navigate to="/pm" replace />;
    } else {
      return <Navigate to="/developer" replace />;
    }
  }

  return children;
};
