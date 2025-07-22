/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Custom hook that combines React Hook Form with Zod validation
 * 
 * @param schema - Zod schema for form validation
 * @param defaultValues - Default values for the form
 * @returns React Hook Form methods and state
 */
export function useZodForm<T extends z.ZodType<any, any, any>>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>
) {
  type FormData = z.infer<T>;
  
  return useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as FormData,
  });
}

/**
 * Common validation patterns
 */
export const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[0-9\s\-()]{10,20}$/,
  // Add more patterns as needed
};

/**
 * Error messages for common validation errors
 */
export const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must not exceed ${max} characters`,
  // Add more messages as needed
};

/**
 * Base form field types for client-side validation
 */
export const formFields = {
  id: z.number().positive().optional(),
  email: z.string().email(errorMessages.email),
  phone: z.string().regex(validationPatterns.phone, errorMessages.phone),
  name: z.string().min(2, errorMessages.minLength(2)).max(100, errorMessages.maxLength(100)),
  password: z.string().min(6, errorMessages.minLength(6)).max(100, errorMessages.maxLength(100)),
  // Add more field types as needed
};