import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Host from '../../../../lib/db/models/host';
import Department from '../../../../lib/db/models/department';
import { successResponse, errorResponse, createPagination, HTTP_STATUS } from '../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole } from '../../../../lib/auth/session';
import { z } from 'zod';
import { Types } from 'mongoose';

// Validation schemas
const hostCreateSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(6).max(100),
  fullName: z.string().min(2).max(100).trim(),
  departmentId: z.string().refine(
    id => Types.ObjectId.isValid(id),
    { message: 'Invalid department ID format' }
  ).nullable().optional(),
  role: z.enum(['SuperAdmin', 'Admin', 'Host']),
});

const hostSearchSchema = z.object({
  email: z.string().optional(),
  fullName: z.string().optional(),
  departmentId: z.string().optional(),
  role: z.enum(['SuperAdmin', 'Admin', 'Host']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

/**
 * GET /api/admin/hosts
 * Get all hosts with pagination and filtering
 * SuperAdmin can see all hosts
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Verify SuperAdmin role
    if (!hasRole(session.user?.role, 'SuperAdmin')) {
      return errorResponse('Access denied - SuperAdmin role required', HTTP_STATUS.FORBIDDEN);
    }

    // Connect to database
    await dbConnect();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const { email, fullName, departmentId, role, page, limit } = hostSearchSchema.parse(queryParams);
    
    // Build search query
    const query: Record<string, unknown> = {};
    if (email) query.email = { $regex: email, $options: 'i' };
    if (fullName) query.fullName = { $regex: fullName, $options: 'i' };
    if (role) query.role = role;
    if (departmentId && Types.ObjectId.isValid(departmentId)) {
      query.departmentId = new Types.ObjectId(departmentId);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [hosts, total] = await Promise.all([
      Host.find(query)
        .select('-password') // Exclude password field
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .populate('departmentId'),
      Host.countDocuments(query)
    ]);
    
    // Return response with pagination
    return successResponse(
      hosts,
      'Hosts retrieved successfully',
      HTTP_STATUS.OK,
      createPagination(total, page, limit)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/admin/hosts
 * Create a new host
 * SuperAdmin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Verify SuperAdmin role
    if (!hasRole(session.user?.role, 'SuperAdmin')) {
      return errorResponse('Access denied - SuperAdmin role required', HTTP_STATUS.FORBIDDEN);
    }

    // Connect to database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const { email, password, fullName, departmentId, role } = hostCreateSchema.parse(body);
    
    // Check if host with email already exists
    const existingHost = await Host.findOne({ email });
    if (existingHost) {
      return errorResponse(
        `Host with email "${email}" already exists`,
        HTTP_STATUS.CONFLICT
      );
    }
    
    // Verify department exists if provided
    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return errorResponse('Department not found', HTTP_STATUS.BAD_REQUEST);
      }
    }
    
    // Create new host
    const host = new Host({
      email,
      password,  // Note: In production, this should be hashed
      fullName,
      departmentId: departmentId ? new Types.ObjectId(departmentId) : null,
      role
    });
    
    // Save to database
    await host.save();
    
    // Remove password from response
    const hostObj = host.toObject();
    const { password: _, ...hostResponse } = hostObj;
    
    // Return response
    return successResponse(
      hostResponse,
      'Host created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error);
  }
}