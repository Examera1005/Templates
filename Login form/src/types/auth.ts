import { ReactNode, ComponentType } from 'react';

/**
 * Authentication Types for Convex Auth Template
 * 
 * These types provide type safety for your authentication system
 */

// User data structure
export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: 'user' | 'admin' | 'moderator';
  createdAt?: number;
  lastLoginAt?: number;
  isEmailVerified?: boolean;
  preferences?: UserPreferences;
}

// User preferences structure
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
  };
}

// Authentication state
export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ResetPasswordFormData {
  email: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Form validation errors
export interface FormErrors {
  [key: string]: string;
}

// Authentication provider types
export type AuthProvider = 'password' | 'google' | 'github';

// OAuth provider data
export interface OAuthProviderData {
  name: string;
  displayName: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

// Authentication actions
export interface AuthActions {
  signIn: (provider: AuthProvider, data?: LoginFormData) => Promise<void>;
  signUp: (data: SignUpFormData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (data: ChangePasswordFormData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

// Component props
export interface AuthFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
}

export interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requiredRole?: User['role'];
}

export interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  allowedRoles?: User['role'][];
}

// Hook return types
export interface UseAuthReturn extends AuthState, AuthActions {}

export interface UseFormValidationReturn<T> {
  values: T;
  errors: FormErrors;
  touched: { [K in keyof T]?: boolean };
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: keyof T, value: string | boolean) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (callback: (values: T) => Promise<void>) => Promise<void>;
  reset: () => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
}

// API response types
export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Session types
export interface Session {
  user: User;
  expiresAt: number;
  refreshToken?: string;
}

// Configuration types
export interface AuthConfig {
  providers: {
    password: boolean;
    google: boolean;
    github: boolean;
  };
  features: {
    rememberMe: boolean;
    emailVerification: boolean;
    passwordReset: boolean;
    profileUpdate: boolean;
  };
  ui: {
    showProviderIcons: boolean;
    allowProviderSwitching: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  security: {
    minPasswordLength: number;
    requireStrongPassword: boolean;
    sessionTimeout: number;
  };
}

// Events
export interface AuthEvent {
  type: 'sign-in' | 'sign-up' | 'sign-out' | 'password-reset' | 'profile-update';
  user?: User;
  provider?: AuthProvider;
  timestamp: number;
}