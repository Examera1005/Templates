import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthWrapperProps } from '../types/auth';

/**
 * Authentication Wrapper Component
 * 
 * Provides authentication context and conditional rendering
 * based on authentication state and user roles.
 * 
 * Features:
 * - Conditional rendering based on auth state
 * - Role-based access control
 * - Loading states
 * - Fallback components
 */
export function AuthWrapper({
  children,
  fallback,
  requireAuth = false,
  requiredRole,
}: AuthWrapperProps) {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner">
          <svg
            className="auth-loading__icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2V6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 18V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.93 4.93L7.76 7.76"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.24 16.24L19.07 19.07"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12H6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 12H22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.93 19.07L7.76 16.24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.24 7.76L19.07 4.93"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="auth-fallback">
        <h2>Authentication Required</h2>
        <p>Please sign in to access this content.</p>
      </div>
    );
  }

  // Check role requirement
  if (requiredRole && (!user || user.role !== requiredRole)) {
    return fallback || (
      <div className="auth-fallback">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this content.</p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Protected Route Component
 * 
 * Higher-order component for protecting routes based on authentication
 * and user roles.
 */
export function ProtectedRoute({
  children,
  fallback,
  allowedRoles = [],
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading__spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="auth-fallback">
        <h2>Authentication Required</h2>
        <p>Please sign in to access this page.</p>
      </div>
    );
  }

  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role || 'user'))) {
    return fallback || (
      <div className="auth-fallback">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Conditional Auth Content Component
 * 
 * Renders different content based on authentication state.
 */
export function ConditionalAuthContent({
  authenticated,
  unauthenticated,
  loading,
}: {
  authenticated?: React.ReactNode;
  unauthenticated?: React.ReactNode;
  loading?: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <>{loading || <div>Loading...</div>}</>;
  }

  if (isAuthenticated) {
    return <>{authenticated}</>;
  }

  return <>{unauthenticated}</>;
}