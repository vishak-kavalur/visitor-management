import { z } from 'zod';
import { validationPatterns, errorMessages, baseSchemas } from './validation-utils';

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

/**
 * Helper function to extract error message from field error
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An error occurred';
}