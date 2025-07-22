import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiResponse } from './schemas';

/**
 * HTTP Status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

/**
 * Creates a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = HTTP_STATUS.OK,
  pagination?: ApiResponse['pagination']
): NextResponse {
  const response: ApiResponse = {
    success: true,
    data,
    message,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return NextResponse.json(response, { status });
}

/**
 * Creates an error response
 */
export function errorResponse(
  error: string | Error | ZodError | unknown,
  status: number = HTTP_STATUS.BAD_REQUEST
): NextResponse {
  let errorMessage: string;

  if (error instanceof ZodError) {
    // Format Zod validation errors
    errorMessage = error.format()._errors.join(', ');
    status = HTTP_STATUS.UNPROCESSABLE_ENTITY;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'An unexpected error occurred';
    status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    console.error('Unexpected error:', error);
  }

  const response: ApiResponse = {
    success: false,
    error: errorMessage,
  };

  return NextResponse.json(response, { status });
}

/**
 * Create pagination data
 */
export function createPagination(total: number, page: number, limit: number): ApiResponse['pagination'] {
  const pages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    pages,
  };
}