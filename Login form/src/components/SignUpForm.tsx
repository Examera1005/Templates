import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFormValidation, signupValidationRules } from '../hooks/useFormValidation';
import { SignUpFormData, AuthFormProps } from '../types/auth';
import styles from '../styles/AuthForm.module.css';

/**
 * Sign Up Form Component
 * 
 * Features:
 * - Email/password registration
 * - OAuth providers (Google, GitHub)
 * - Form validation with confirmation
 * - Loading states
 * - Error handling
 * - Terms acceptance
 */
export function SignUpForm({ onSuccess, onError, redirectTo, className }: AuthFormProps) {
  const { signUp, signIn, isLoading, error } = useAuth();

  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
  } = useFormValidation<SignUpFormData>(
    { 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '', 
      acceptTerms: false 
    },
    signupValidationRules
  );

  const handleFormSubmit = async (formData: SignUpFormData) => {
    try {
      await signUp(formData);
      onSuccess?.(null as any); // User will be available through useAuth hook
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setFieldError('email', errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      await signIn(provider);
      onSuccess?.(null as any);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${provider} sign up failed`;
      onError?.(errorMessage);
    }
  };

  return (
    <div className={`${styles.authForm} ${className || ''}`}>
      <div className={styles.authForm__header}>
        <h1 className={styles.authForm__title}>Create your account</h1>
        <p className={styles.authForm__subtitle}>Get started with your free account</p>
      </div>

      {error && (
        <div className={styles.authForm__error} role="alert">
          <svg className={styles.authForm__errorIcon} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(handleFormSubmit); }}>
        <div className={styles.authForm__group}>
          <label htmlFor="name" className={styles.authForm__label}>
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            className={`${styles.authForm__input} ${
              errors.name && touched.name ? styles['authForm__input--error'] : ''
            }`}
            placeholder="Enter your full name"
            disabled={isSubmitting}
            autoComplete="name"
            aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
          />
          {errors.name && touched.name && (
            <div id="name-error" className={styles.authForm__error} role="alert">
              <svg className={styles.authForm__errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </div>
          )}
        </div>

        <div className={styles.authForm__group}>
          <label htmlFor="email" className={styles.authForm__label}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`${styles.authForm__input} ${
              errors.email && touched.email ? styles['authForm__input--error'] : ''
            }`}
            placeholder="Enter your email"
            disabled={isSubmitting}
            autoComplete="email"
            aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
          />
          {errors.email && touched.email && (
            <div id="email-error" className={styles.authForm__error} role="alert">
              <svg className={styles.authForm__errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.email}
            </div>
          )}
        </div>

        <div className={styles.authForm__group}>
          <label htmlFor="password" className={styles.authForm__label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            className={`${styles.authForm__input} ${
              errors.password && touched.password ? styles['authForm__input--error'] : ''
            }`}
            placeholder="Create a password"
            disabled={isSubmitting}
            autoComplete="new-password"
            aria-describedby={errors.password && touched.password ? 'password-error' : undefined}
          />
          {errors.password && touched.password && (
            <div id="password-error" className={styles.authForm__error} role="alert">
              <svg className={styles.authForm__errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </div>
          )}
        </div>

        <div className={styles.authForm__group}>
          <label htmlFor="confirmPassword" className={styles.authForm__label}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={values.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            className={`${styles.authForm__input} ${
              errors.confirmPassword && touched.confirmPassword ? styles['authForm__input--error'] : ''
            }`}
            placeholder="Confirm your password"
            disabled={isSubmitting}
            autoComplete="new-password"
            aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          {errors.confirmPassword && touched.confirmPassword && (
            <div id="confirmPassword-error" className={styles.authForm__error} role="alert">
              <svg className={styles.authForm__errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.confirmPassword}
            </div>
          )}
        </div>

        <div className={styles.authForm__group}>
          <div className={styles.authForm__checkbox}>
            <input
              id="acceptTerms"
              type="checkbox"
              checked={values.acceptTerms}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              className={styles.authForm__checkboxInput}
            />
            <label htmlFor="acceptTerms" className={styles.authForm__checkboxLabel}>
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
            </label>
          </div>
          {errors.acceptTerms && touched.acceptTerms && (
            <div className={styles.authForm__error} role="alert">
              <svg className={styles.authForm__errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.acceptTerms}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={`${styles.authForm__button} ${styles['authForm__button--primary']}`}
        >
          {isSubmitting ? (
            <>
              <span className={styles.authForm__spinner} />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className={styles.authForm__divider}>or continue with</div>

      <div className={styles.authForm__group}>
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={isSubmitting}
          className={`${styles.authForm__button} ${styles['authForm__button--google']}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      <div className={styles.authForm__group}>
        <button
          type="button"
          onClick={() => handleOAuthSignIn('github')}
          disabled={isSubmitting}
          className={`${styles.authForm__button} ${styles['authForm__button--github']}`}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>
      </div>

      <div className={styles.authForm__footer}>
        <p className={styles.authForm__footerText}>
          Already have an account?{' '}
          <a href="/login" className={styles.authForm__footerLink}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}