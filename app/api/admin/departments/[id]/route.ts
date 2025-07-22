import { NextRequest } from 'next/server';
import dbConnect from '../../../../../lib/db/mongoose';
import Department from '../../../../../lib/db/models/department';
import Host from '../../../../../lib/db/models/host';
import Visit from '../../../../../lib/db/models/visit';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole } from '../../../../../lib/auth/session';
import { z } from 'zod';
import { Types } from 'mongoose';

// Validation schema
const departmentUpdateSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  floor: z.string().max(50).trim().optional(),
  building: z.string().max(100).trim().optional(),
});

/**
 * Helper to validate MongoDB ObjectId
 */
function isValidObjectId(id: string): boolean {
  try {
    return Types.ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
}

/**
 * GET /api/admin/departments/[id]
 * Get a single department by ID
 * SuperAdmin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate ID
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid department ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find department by ID
    const department = await Department.findById(id);
    if (!department) {
      return errorResponse('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get counts of hosts and visits in this department
    const [hostsCount, visitsCount] = await Promise.all([
      Host.countDocuments({ departmentId: id }),
      Visit.countDocuments({ departmentId: id })
    ]);

    // Return department with additional counts
    return successResponse({
      ...department.toObject(),
      hostsCount,
      visitsCount
    }, 'Department retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/admin/departments/[id]
 * Update a department
 * SuperAdmin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params:  Promise<{ id: string }> }
) {
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

    // Validate ID
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid department ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = departmentUpdateSchema.parse(body);
    const { name, description, floor, building } = validatedData;

    // Check if name already exists in a different department
    const existingDepartment = await Department.findOne({ name, _id: { $ne: id } });
    if (existingDepartment) {
      return errorResponse(
        `Department name "${name}" is already in use`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Find and update department
    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      {
        name,
        description,
        floor,
        building
      },
      { new: true, runValidators: true }
    );

    if (!updatedDepartment) {
      return errorResponse('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // Return updated department
    return successResponse(
      updatedDepartment,
      'Department updated successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/admin/departments/[id]
 * Delete a department
 * SuperAdmin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Validate ID
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid department ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Check if department has any hosts
    const hostsCount = await Host.countDocuments({ departmentId: id });
    if (hostsCount > 0) {
      return errorResponse(
        `Cannot delete department with ${hostsCount} hosts assigned to it. Reassign hosts first.`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Check if department has any visits
    const visitsCount = await Visit.countDocuments({ departmentId: id });
    if (visitsCount > 0) {
      return errorResponse(
        `Cannot delete department with ${visitsCount} visits assigned to it.`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Delete department
    const deletedDepartment = await Department.findByIdAndDelete(id);
    if (!deletedDepartment) {
      return errorResponse('Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // Return success message
    return successResponse(
      { id },
      'Department deleted successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}