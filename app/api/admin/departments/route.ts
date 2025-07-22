import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Department from '../../../../lib/db/models/department';
import { successResponse, errorResponse, createPagination, HTTP_STATUS } from '../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole } from '../../../../lib/auth/session';
import { z } from 'zod';

// Validation schemas
const departmentCreateSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  floor: z.string().max(50).trim().optional(),
  building: z.string().max(100).trim().optional(),
});

const departmentSearchSchema = z.object({
  name: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

/**
 * GET /api/admin/departments
 * Get all departments with pagination and filtering
 * SuperAdmin only
 */
export async function GET(request: NextRequest) {
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
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const { name, page, limit } = departmentSearchSchema.parse(queryParams);
    
    // Build search query
    const query: Record<string, unknown> = {};
    if (name) query.name = { $regex: name, $options: 'i' };

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const [departments, total] = await Promise.all([
      Department.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      Department.countDocuments(query)
    ]);
    
    // Return response with pagination
    return successResponse(
      departments,
      'Departments retrieved successfully',
      HTTP_STATUS.OK,
      createPagination(total, page, limit)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/admin/departments
 * Create a new department
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
    const validatedData = departmentCreateSchema.parse(body);
    const { name, description, floor, building } = validatedData;
    
    // Check if department already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return errorResponse(
        `Department "${name}" already exists`,
        HTTP_STATUS.CONFLICT
      );
    }
    
    // Create new department
    const department = new Department({
      name,
      description,
      floor,
      building
    });
    
    // Save to database
    await department.save();
    
    // Return response
    return successResponse(
      department,
      'Department created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error);
  }
}