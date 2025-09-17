import { useState, useCallback } from 'react';
import { FormErrors, UseFormValidationReturn } from '../types/auth';

/**
 * Generic form validation hook
 * 
 * @param initialValues - Initial form values
 * @param validationRules - Validation rules for each field
 * @returns Form state and handlers
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, (value: any) => string | null>>
): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [K in keyof T]?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = validationRules[field];
    return rule ? rule(value) : null;
  }, [validationRules]);

  const handleChange = useCallback((field: keyof T, value: string | boolean) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const error = validateField(field, values[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field as string]: error }));
    }
  }, [values, validateField]);

  const handleSubmit = useCallback(async (callback: (values: T) => Promise<void>) => {
    setIsSubmitting(true);
    
    // Validate all fields
    const newErrors: FormErrors = {};
    let hasErrors = false;

    Object.keys(values).forEach(key => {
      const error = validateField(key as keyof T, values[key as keyof T]);
      if (error) {
        newErrors[key] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (hasErrors) {
      setIsSubmitting(false);
      return;
    }

    try {
      await callback(values);
    } catch (error) {
      // Handle submission errors
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldError,
    clearErrors,
  };
}

/**
 * Validation rules for login form
 */
export const loginValidationRules = {
  email: (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return null;
  },
};

/**
 * Validation rules for signup form
 */
export const signupValidationRules = {
  name: (value: string) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return null;
  },
  email: (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  },
  confirmPassword: (value: string, values?: any) => {
    if (!value) return 'Please confirm your password';
    if (values && value !== values.password) return 'Passwords do not match';
    return null;
  },
  acceptTerms: (value: boolean) => {
    if (!value) return 'You must accept the terms and conditions';
    return null;
  },
};