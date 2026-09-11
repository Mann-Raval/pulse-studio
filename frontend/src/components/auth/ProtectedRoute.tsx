import React from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '../../types';
import { mockCurrentUser } from '../../data/mockData';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

/**
 * Structural placeholder for Role-Based Access Control (RBAC).
 * In future iterations, this will read the authenticated user and token
 * from AuthContext / React Query auth state.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  // TODO: Replace with useAuth() hook: const { user, isAuthenticated, isLoading } = useAuth();
  const user = mockCurrentUser;
  const isAuthenticated = true; // Placeholder auth state

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // TODO: Verify user.role is in allowedRoles
    const hasRole = allowedRoles.includes(user.role) || allowedRoles.includes('Admin');
    if (!hasRole) {
      // In real implementation, redirect to 403 Forbidden or default dashboard
      // return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
