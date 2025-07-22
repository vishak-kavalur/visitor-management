import { z } from 'zod';

// Base schemas
export const idSchema = z.number().positive();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(10).max(20);
export const nameSchema = z.string().min(2).max(100);

// Visitor schema
export const visitorSchema = z.object({
  id: idSchema.optional(),
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  company: z.string().min(1).max(100),
  visitsCount: z.number().nonnegative().optional(),
});

export type Visitor = z.infer<typeof visitorSchema>;

// Host schema
export const hostSchema = z.object({
  id: idSchema.optional(),
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  department: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
});

export type Host = z.infer<typeof hostSchema>;

// Department schema
export const departmentSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  floor: z.string().max(50).optional(),
  building: z.string().max(100).optional(),
});

export type Department = z.infer<typeof departmentSchema>;

// Visit schema
export const visitSchema = z.object({
  id: idSchema.optional(),
  visitorId: idSchema,
  hostId: idSchema,
  purpose: z.string().min(3).max(200),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
  status: z.enum(['scheduled', 'checked_in', 'checked_out', 'cancelled']),
  notes: z.string().max(500).optional(),
});

export type Visit = z.infer<typeof visitSchema>;

// Notification schema
export const notificationSchema = z.object({
  id: idSchema.optional(),
  userId: idSchema,
  message: z.string().min(1).max(500),
  isRead: z.boolean().default(false),
  type: z.enum(['info', 'warning', 'error', 'success']),
  createdAt: z.date().default(() => new Date()),
});

export type Notification = z.infer<typeof notificationSchema>;

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6).max(100),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(6).max(100),
  role: z.enum(['admin', 'receptionist', 'host']).default('host'),
});

export type RegisterCredentials = z.infer<typeof registerSchema>;

// API response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

export type ApiResponse = z.infer<typeof apiResponseSchema>;