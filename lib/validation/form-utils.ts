import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldError } from 'react-hook-form';
import { validationPatterns, errorMessages, baseSchemas } from './validation-utils';

/**
 * Helper to use with React Hook Form
 * @param schema Zod schema
 */
export const getZodResolver = (schema: z.ZodSchema) => {
  return zodResolver(schema);
};

/**
 * Extract field validation errors from form state errors
 * @param errors React Hook Form errors object
 * @returns Simplified object with field names as keys and error messages as values
 */
export function extractFieldErrors(
  errors: Record<string, FieldError | undefined>
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  Object.entries(errors).forEach(([field, error]) => {
    if (error?.message) {
      fieldErrors[field] = error.message;
    }
  });
  
  return fieldErrors;
}

/**
 * Common form schemas for reuse across the application
 */
export const formSchemas = {
  // Login form schema
  login: z.object({
    email: baseSchemas.email,
    password: baseSchemas.password,
    rememberMe: z.boolean().optional(),
  }),
  
  // Visitor form schema
  visitor: z.object({
    name: baseSchemas.name,
    email: baseSchemas.email,
    phone: baseSchemas.phone,
    company: z.string().min(1, errorMessages.required).max(100, errorMessages.maxLength(100)),
  }),
  
  // Host form schema
  host: z.object({
    name: baseSchemas.name,
    email: baseSchemas.email,
    phone: baseSchemas.phone,
    department: z.string().min(1, errorMessages.required),
    title: z.string().min(1, errorMessages.required).max(100, errorMessages.maxLength(100)),
  }),
  
  // Department form schema
  department: z.object({
    name: z.string().min(2, errorMessages.minLength(2)).max(100, errorMessages.maxLength(100)),
    description: z.string().max(500, errorMessages.maxLength(500)).optional(),
    floor: z.string().max(50, errorMessages.maxLength(50)).optional(),
    building: z.string().max(100, errorMessages.maxLength(100)).optional(),
  }),
  
  // Visit form schema
  visit: z.object({
    visitorId: z.string().min(1, errorMessages.required),
    hostId: z.string().min(1, errorMessages.required),
    purpose: z.string().min(3, errorMessages.minLength(3)).max(200, errorMessages.maxLength(200)),
    scheduledTime: z.date().optional(),
    notes: z.string().max(500, errorMessages.maxLength(500)).optional(),
  }),

  // Add more form schemas as needed
};

// Type exports for schemas
export type LoginFormData = z.infer<typeof formSchemas.login>;
export type VisitorFormData = z.infer<typeof formSchemas.visitor>;
export type HostFormData = z.infer<typeof formSchemas.host>;
export type DepartmentFormData = z.infer<typeof formSchemas.department>;
export type VisitFormData = z.infer<typeof formSchemas.visit>;