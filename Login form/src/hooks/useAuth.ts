import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useState, useCallback, useEffect } from "react";
import { 
  AuthState, 
  User, 
  AuthActions, 
  UseAuthReturn,
  AuthProvider,
  LoginFormData,
  SignUpFormData,
  ChangePasswordFormData
} from "../types/auth";

/**
 * Main authentication hook that provides all auth functionality
 * 
 * @returns Authentication state and actions
 */
export function useAuth(): UseAuthReturn {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  
  // Get current user data
  const user = useQuery(api.users.current) as User | null;

  // Clear error when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      setError(null);
    }
  }, [isAuthenticated]);

  const signIn = useCallback(async (provider: AuthProvider, data?: LoginFormData) => {
    try {
      setError(null);
      
      if (provider === 'password' && data) {
        await convexSignIn('password', {
          email: data.email,
          password: data.password,
        });
      } else if (provider === 'google') {
        await convexSignIn('google');
      } else if (provider === 'github') {
        await convexSignIn('github');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    }
  }, [convexSignIn]);

  const signUp = useCallback(async (data: SignUpFormData) => {
    try {
      setError(null);
      
      // Validate passwords match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await convexSignIn('password', {
        email: data.email,
        password: data.password,
        name: data.name,
        flow: 'signUp',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    }
  }, [convexSignIn]);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await convexSignOut();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      throw err;
    }
  }, [convexSignOut]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      // Implement password reset logic here
      // This would typically involve calling a Convex mutation
      throw new Error('Password reset not implemented yet');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordFormData) => {
    try {
      setError(null);
      
      if (data.newPassword !== data.confirmNewPassword) {
        throw new Error('New passwords do not match');
      }

      // Implement password change logic here
      // This would typically involve calling a Convex mutation
      throw new Error('Password change not implemented yet');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password change failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      setError(null);
      // Implement profile update logic here
      // This would typically involve calling a Convex mutation
      throw new Error('Profile update not implemented yet');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    try {
      setError(null);
      // Implement email verification logic here
      // This would typically involve calling a Convex mutation
      throw new Error('Email verification not implemented yet');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Email verification failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    isLoading,
    isAuthenticated,
    user,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    changePassword,
    updateProfile,
    verifyEmail,
  };
}