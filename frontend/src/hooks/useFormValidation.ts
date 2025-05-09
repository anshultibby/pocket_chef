import { useState, useCallback } from 'react';

// Define the validation rule type
type ValidationRule<T> = (value: T) => string | undefined;

// Define the validation rules type
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

// Define a base type constraint for the form values
type FormValues = Record<string, unknown>;

// Main hook definition with improved type safety
export function useFormValidation<T extends FormValues>(
  rules: ValidationRules<T>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback((values: T): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(rules).forEach((key) => {
      const rule = rules[key as keyof T];
      const value = values[key as keyof T];
      
      if (rule) {
        const error = rule(value);
        if (error) {
          newErrors[key as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    clearErrors
  };
}
