import { z } from 'zod';

/**
 * Common validation patterns
 */
export const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[0-9\s\-()]{10,20}$/,
  aadhaarNumber: /^\d{12}$/,
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
  invalidAadhaar: 'Aadhaar number must be 12 digits',
  invalidObjectId: 'Invalid ID format',
  // Add more messages as needed
};

/**
 * Base schema building blocks for reuse
 */
export const baseSchemas = {
  id: z.number().positive(),
  email: z.string().email(errorMessages.email),
  phone: z.string().regex(validationPatterns.phone, errorMessages.phone),
  name: z.string().min(2, errorMessages.minLength(2)).max(100, errorMessages.maxLength(100)),
  password: z.string().min(6, errorMessages.minLength(6)).max(100, errorMessages.maxLength(100)),
  aadhaarNumber: z.string().regex(validationPatterns.aadhaarNumber, errorMessages.invalidAadhaar),
  date: z.date(),
  optionalText: z.string().max(500).optional(),
  // Add more base schemas as needed
};

/**
 * Format Zod errors into a user-friendly object
 * @param error Zod error to format
 * @returns Object with field names as keys and error messages as values
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  error.issues.forEach((err) => {
    if (err.path.length > 0) {
      const fieldName = err.path.join('.');
      formattedErrors[fieldName] = err.message;
    }
  });
  
  return formattedErrors;
}