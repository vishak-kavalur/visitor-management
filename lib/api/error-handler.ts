import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HTTP_STATUS } from './response';

/**
 * Detailed error types for better error handling
 */
export enum ErrorType {
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  DATABASE = 'database_error',
  EXTERNAL_API = 'external_api_error',
  INTERNAL = 'internal_error',
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    details?: Record<string, unknown>;
    code?: string;
  };
}

/**
 * Map of HTTP status codes to error types
 */
const ERROR_TYPE_MAP: Record<number, ErrorType> = {
  [HTTP_STATUS.BAD_REQUEST]: ErrorType.VALIDATION,
  [HTTP_STATUS.UNAUTHORIZED]: ErrorType.AUTHENTICATION,
  [HTTP_STATUS.FORBIDDEN]: ErrorType.AUTHORIZATION,
  [HTTP_STATUS.NOT_FOUND]: ErrorType.NOT_FOUND,
  [HTTP_STATUS.CONFLICT]: ErrorType.CONFLICT,
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: ErrorType.VALIDATION,
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: ErrorType.INTERNAL,
};

/**
 * Create a standard error response
 * @param message Error message
 * @param type Error type
 * @param status HTTP status code
 * @param details Additional error details
 * @param code Custom error code
 * @returns NextResponse with standardized error format
 */
export function createErrorResponse(
  message: string,
  type: ErrorType = ErrorType.INTERNAL,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: Record<string, unknown>,
  code?: string
): NextResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      type,
      message,
      ...(details && { details }),
      ...(code && { code }),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Handles API errors and returns standardized error responses
 * @param error Error to handle
 * @param defaultStatus Default HTTP status code
 * @returns NextResponse with appropriate error details
 */
export function handleApiError(
  error: unknown,
  defaultStatus: number = HTTP_STATUS.BAD_REQUEST
): NextResponse {
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors: Record<string, string[]> = {};
    
    error.issues.forEach((err) => {
      const path = err.path.join('.');
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(err.message);
    });
    
    return createErrorResponse(
      'Validation error',
      ErrorType.VALIDATION,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      { fields: formattedErrors }
    );
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error types based on error name or properties
    if (error.name === 'MongoServerError' && 'code' in error && error.code === 11000) {
      // Handle MongoDB duplicate key error
      return createErrorResponse(
        'A record with this information already exists',
        ErrorType.CONFLICT,
        HTTP_STATUS.CONFLICT
      );
    }
    
    // Handle other standard errors
    return createErrorResponse(
      error.message,
      ERROR_TYPE_MAP[defaultStatus] || ErrorType.INTERNAL,
      defaultStatus
    );
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return createErrorResponse(
      error,
      ERROR_TYPE_MAP[defaultStatus] || ErrorType.INTERNAL,
      defaultStatus
    );
  }
  
  // Handle unknown errors
  return createErrorResponse(
    'An unexpected error occurred',
    ErrorType.INTERNAL,
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}

/**
 * Validate request data against a schema
 * @param schema Zod schema for validation
 * @param data Data to validate
 * @returns Validated data or throws a ZodError
 */
export function validateRequest<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate request data against a schema
 * @param schema Zod schema for validation
 * @param data Data to validate
 * @returns Object with validation result
 */
export function safeValidateRequest<T>(schema: ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  error?: ZodError 
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

// Add type import for ZodSchema
import { ZodSchema } from 'zod';