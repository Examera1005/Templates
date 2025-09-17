/**
 * Convex Auth Template - Component Exports
 * 
 * This file exports all the authentication components for easy importing
 */

// Main authentication components
export { LoginForm } from './LoginForm';
export { SignUpForm } from './SignUpForm';
export { AuthWrapper, ProtectedRoute, ConditionalAuthContent } from './AuthWrapper';

// Re-export hooks for convenience
export { useAuth } from '../hooks/useAuth';
export { useFormValidation, loginValidationRules, signupValidationRules } from '../hooks/useFormValidation';

// Re-export types for convenience
export type {
  User,
  AuthState,
  LoginFormData,
  SignUpFormData,
  AuthFormProps,
  AuthWrapperProps,
  ProtectedRouteProps,
  UseAuthReturn,
  AuthProvider,
  AuthConfig,
} from '../types/auth';

/**
 * Example usage:
 * 
 * import { LoginForm, SignUpForm, AuthWrapper, useAuth } from './path/to/auth-template';
 * 
 * function App() {
 *   return (
 *     <AuthWrapper requireAuth>
 *       <Dashboard />
 *     </AuthWrapper>
 *   );
 * }
 */