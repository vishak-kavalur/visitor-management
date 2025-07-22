import { z } from 'zod';
import { Types } from 'mongoose';

// Helper to validate MongoDB ObjectId
const objectIdSchema = z.string().refine(
  (value) => {
    try {
      return Types.ObjectId.isValid(value);
    } catch (error) {
      return false;
    }
  },
  {
    message: 'Invalid ObjectId format',
  }
);

// Visitor validation schemas
export const visitorCreateSchema = z.object({
  aadhaarNumber: z.string().min(12).max(12),
  fullName: z.string().min(2).max(100),
  imageBase64: z.string(),
});

export const visitorUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  imageBase64: z.string().optional(),
});

export const visitorSearchSchema = z.object({
  aadhaarNumber: z.string().optional(),
  fullName: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

// Visit validation schemas
export const visitCreateSchema = z.object({
  visitorId: objectIdSchema,
  hostId: objectIdSchema,
  departmentId: objectIdSchema,
  purposeOfVisit: z.string().min(3).max(200),
});

export const visitUpdateStatusSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut']),
  approvedBy: objectIdSchema.optional(),
});

export const visitSearchSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut']).optional(),
  visitorId: objectIdSchema.optional(),
  hostId: objectIdSchema.optional(),
  departmentId: objectIdSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

// Types
export type VisitorCreate = z.infer<typeof visitorCreateSchema>;
export type VisitorUpdate = z.infer<typeof visitorUpdateSchema>;
export type VisitorSearch = z.infer<typeof visitorSearchSchema>;
export type VisitCreate = z.infer<typeof visitCreateSchema>;
export type VisitUpdateStatus = z.infer<typeof visitUpdateStatusSchema>;
export type VisitSearch = z.infer<typeof visitSearchSchema>;

// API response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }).optional(),
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;