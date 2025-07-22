import { useForm, UseFormProps, FieldValues, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { formatZodErrors } from './validation-utils';

/**
 * Custom hook that integrates React Hook Form with Zod validation
 * @param schema Zod schema for validation
 * @param options Additional React Hook Form options
 * @returns Form methods, state and error handling utilities
 */
export function useZodForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  options: Omit<UseFormProps<T>, 'resolver'> = {}
) {
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const form = useForm<T>({
    ...options,
    resolver: zodResolver(schema),
  });

  const handleSubmit = async <R>(
    onValid: (data: T) => Promise<R> | R,
    onInvalid?: (errors: Record<string, string>) => void
  ) => {
    // Clear previous errors
    setFormError(null);
    setFieldErrors({});

    return form.handleSubmit(
      // Success handler
      async (data) => {
        try {
          return await onValid(data);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors = formatZodErrors(error);
            setFieldErrors(errors);
            onInvalid?.(errors);
          } else if (error instanceof Error) {
            setFormError(error.message);
          } else {
            setFormError('An unexpected error occurred');
            console.error('Form submission error:', error);
          }
        }
      },
      // Error handler for validation errors
      (errors) => {
        console.log('Form validation errors:', errors);
        const fieldErrorMap: Record<string, string> = {};
        Object.entries(errors).forEach(([field, error]) => {
          if (error?.message) {
            fieldErrorMap[field] = error.message as string;
          }
        });
        setFieldErrors(fieldErrorMap);
        onInvalid?.(fieldErrorMap);
      }
    )();
  };

  return {
    ...form,
    handleSubmit,
    formError,
    fieldErrors,
    setFormError,
    clearErrors: () => {
      setFormError(null);
      setFieldErrors({});
      form.clearErrors();
    }
  };
}