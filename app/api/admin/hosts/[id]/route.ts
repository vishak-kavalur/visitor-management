import { NextRequest } from 'next/server';
import dbConnect from '../../../../../lib/db/mongoose';
import Host from '../../../../../lib/db/models/host';
import Department from '../../../../../lib/db/models/department';
import Visit from '../../../../../lib/db/models/visit';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole } from '../../../../../lib/auth/session';
import { z } from 'zod';
import { Types } from 'mongoose';

// Validation schema
const hostUpdateSchema = z.object({
  email: z.string().email().trim().toLowerCase().optional(),
  password: z.string().min(6).max(100).optional(),
  fullName: z.string().min(2).max(100).trim().optional(),
  departmentId: z.string().refine(
    id => Types.ObjectId.isValid(id),
    { message: 'Invalid department ID format' }
  ).nullable().optional(),
  role: z.enum(['SuperAdmin', 'Admin', 'Host']).optional(),
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
 * GET /api/admin/hosts/[id]
 * Get a single host by ID
 * SuperAdmin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const id = params.id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid host ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find host by ID and exclude password
    const host = await Host.findById(id)
      .select('-password')
      .populate('departmentId');
      
    if (!host) {
      return errorResponse('Host not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get pending approval count for this host
    const pendingApprovalCount = await Visit.countDocuments({
      hostId: id,
      status: 'Pending'
    });

    // Return host with additional counts
    return successResponse({
      ...host.toObject(),
      pendingApprovalCount
    }, 'Host retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/admin/hosts/[id]
 * Update a host
 * SuperAdmin only
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const id = params.id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid host ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Check if host exists
    const host = await Host.findById(id);
    if (!host) {
      return errorResponse('Host not found', HTTP_STATUS.NOT_FOUND);
    }

    // Parse and validate request body
    const body = await request.json();
    const updates = hostUpdateSchema.parse(body);

    // Check if email already exists
    if (updates.email) {
      const existingHost = await Host.findOne({ 
        email: updates.email, 
        _id: { $ne: id } 
      });
      
      if (existingHost) {
        return errorResponse(
          `Email "${updates.email}" is already in use`,
          HTTP_STATUS.CONFLICT
        );
      }
    }

    // Verify department exists if provided
    if (updates.departmentId) {
      const department = await Department.findById(updates.departmentId);
      if (!department) {
        return errorResponse('Department not found', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Prevent removing the last SuperAdmin
    if (host.role === 'SuperAdmin' && updates.role && updates.role !== 'SuperAdmin') {
      const superAdminCount = await Host.countDocuments({ role: 'SuperAdmin' });
      if (superAdminCount <= 1) {
        return errorResponse(
          'Cannot demote the last SuperAdmin user',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    // Update host with provided fields
    if (updates.email) host.email = updates.email;
    if (updates.password) host.password = updates.password; // Should be hashed in production
    if (updates.fullName) host.fullName = updates.fullName;
    if (updates.role) host.role = updates.role;
    
    // Handle departmentId update (can be null)
    if ('departmentId' in updates) {
      host.departmentId = updates.departmentId 
        ? new Types.ObjectId(updates.departmentId) 
        : null;
    }

    // Save changes
    await host.save();

    // Remove password from response
    const hostObj = host.toObject();
    const { password: _, ...hostResponse } = hostObj;

    // Return updated host
    return successResponse(
      hostResponse,
      'Host updated successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/admin/hosts/[id]
 * Delete a host
 * SuperAdmin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const id = params.id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid host ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Prevent deleting yourself
    if (session.user?.id === id) {
      return errorResponse(
        'Cannot delete your own account',
        HTTP_STATUS.CONFLICT
      );
    }

    // Connect to database
    await dbConnect();

    // Find host to check role
    const host = await Host.findById(id);
    if (!host) {
      return errorResponse('Host not found', HTTP_STATUS.NOT_FOUND);
    }

    // Prevent deleting the last SuperAdmin
    if (host.role === 'SuperAdmin') {
      const superAdminCount = await Host.countDocuments({ role: 'SuperAdmin' });
      if (superAdminCount <= 1) {
        return errorResponse(
          'Cannot delete the last SuperAdmin user',
          HTTP_STATUS.CONFLICT
        );
      }
    }

    // Check if host has any assigned visits
    const visitsCount = await Visit.countDocuments({ hostId: id });
    if (visitsCount > 0) {
      return errorResponse(
        `Cannot delete host with ${visitsCount} visits assigned. Reassign visits first.`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Delete host
    await Host.findByIdAndDelete(id);

    // Return success message
    return successResponse(
      { id },
      'Host deleted successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}