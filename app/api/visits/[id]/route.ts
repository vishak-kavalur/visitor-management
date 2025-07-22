import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Visit from '../../../../lib/db/models/visit';
import { visitUpdateStatusSchema } from '../../../../lib/api/schemas';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole, hasDepartmentAccess } from '../../../../lib/auth/session';
import { Types } from 'mongoose';

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
 * GET /api/visits/[id]
 * Get a single visit by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate ID
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid visit ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find visit by ID with populated references
    const visit = await Visit.findById(id)
      .populate('visitorId')
      .populate('hostId')
      .populate('departmentId');
      
    if (!visit) {
      return errorResponse('Visit not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check department access
    if (session.user?.role !== 'SuperAdmin' && 
        !hasDepartmentAccess(
          session.user?.role, 
          session.user?.departmentId, 
          visit.departmentId._id.toString()
        )) {
      return errorResponse('You do not have access to this visit', HTTP_STATUS.FORBIDDEN);
    }

    // Return visit data
    return successResponse({
      _id: visit._id,
      status: visit.status,
      visitorId: visit.visitorId,
      hostId: visit.hostId,
      departmentId: visit.departmentId,
      purposeOfVisit: visit.purposeOfVisit,
      submissionTimestamp: visit.submissionTimestamp,
      approval: visit.approval,
      checkInTimestamp: visit.checkInTimestamp,
      checkOutTimestamp: visit.checkOutTimestamp
    }, 'Visit retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/visits/[id]
 * Update a visit status (approve or reject)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate ID
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid visit ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find visit by ID
    const visit = await Visit.findById(id).populate('departmentId');
    if (!visit) {
      return errorResponse('Visit not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check department access for approval/rejection
    if (session.user?.role !== 'SuperAdmin' && 
        !hasDepartmentAccess(
          session.user?.role, 
          session.user?.departmentId, 
          visit.departmentId._id.toString()
        )) {
      return errorResponse('You do not have access to modify this visit', HTTP_STATUS.FORBIDDEN);
    }

    // Parse and validate request body
    const body = await request.json();
    const { status, approvedBy } = visitUpdateStatusSchema.parse(body);
    
    // Handle status update based on requested status
    switch (status) {
      case 'Approved':
        if (!hasRole(session.user?.role, 'Admin')) {
          return errorResponse('Only Admins or SuperAdmins can approve visits', HTTP_STATUS.FORBIDDEN);
        }
        // Direct method calls aren't recognized by TypeScript, so we use the defined methods as functions
        if (approvedBy) {
          visit.status = 'Approved';
          visit.approval = {
            approvedBy: new Types.ObjectId(approvedBy),
            timestamp: new Date()
          };
        } else {
          visit.status = 'Approved';
          visit.approval = {
            approvedBy: new Types.ObjectId(session.user?.id),
            timestamp: new Date()
          };
        }
        await visit.save();
        break;
        
      case 'Rejected':
        if (!hasRole(session.user?.role, 'Admin')) {
          return errorResponse('Only Admins or SuperAdmins can reject visits', HTTP_STATUS.FORBIDDEN);
        }
        // Reject visit
        if (approvedBy) {
          visit.status = 'Rejected';
          visit.approval = {
            approvedBy: new Types.ObjectId(approvedBy),
            timestamp: new Date()
          };
        } else {
          visit.status = 'Rejected';
          visit.approval = {
            approvedBy: new Types.ObjectId(session.user?.id),
            timestamp: new Date()
          };
        }
        await visit.save();
        break;
        
      case 'CheckedIn':
        if (visit.status !== 'Approved') {
          return errorResponse('Visit must be approved before check-in', HTTP_STATUS.BAD_REQUEST);
        }
        // Check in visitor
        if (visit.status !== 'Approved') {
          return errorResponse('Visit must be approved before check-in', HTTP_STATUS.BAD_REQUEST);
        }
        
        visit.status = 'CheckedIn';
        visit.checkInTimestamp = new Date();
        
        // Update the visitor's last visit time
        const Visitor = (await import('../../../../lib/db/models/visitor')).default;
        await Visitor.findByIdAndUpdate(visit.visitorId, {
          lastVisit: new Date()
        });
        
        await visit.save();
        break;
        
      case 'CheckedOut':
        if (visit.status !== 'CheckedIn') {
          return errorResponse('Visit must be checked in before check-out', HTTP_STATUS.BAD_REQUEST);
        }
        // Check out visitor
        if (visit.status !== 'CheckedIn') {
          return errorResponse('Visit must be checked in before check-out', HTTP_STATUS.BAD_REQUEST);
        }
        
        visit.status = 'CheckedOut';
        visit.checkOutTimestamp = new Date();
        await visit.save();
        break;
        
      default:
        return errorResponse(`Cannot manually set status to ${status}`, HTTP_STATUS.BAD_REQUEST);
    }

    // Refresh visit data after update
    const updatedVisit = await Visit.findById(id)
      .populate('visitorId')
      .populate('hostId')
      .populate('departmentId');

    // Return updated visit data
    if (!updatedVisit) {
      return errorResponse('Failed to retrieve updated visit', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return successResponse({
      _id: updatedVisit._id,
      status: updatedVisit.status,
      visitorId: updatedVisit.visitorId,
      hostId: updatedVisit.hostId,
      departmentId: updatedVisit.departmentId,
      purposeOfVisit: updatedVisit.purposeOfVisit,
      submissionTimestamp: updatedVisit.submissionTimestamp,
      approval: updatedVisit.approval,
      checkInTimestamp: updatedVisit.checkInTimestamp,
      checkOutTimestamp: updatedVisit.checkOutTimestamp
    }, `Visit ${status.toLowerCase()} successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/visits/[id]
 * Delete a visit (SuperAdmin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || !hasRole(session.user?.role, 'SuperAdmin')) {
      return errorResponse('Unauthorized - requires SuperAdmin', HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate ID
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid visit ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find visit by ID and delete
    const visit = await Visit.findByIdAndDelete(id);
    if (!visit) {
      return errorResponse('Visit not found', HTTP_STATUS.NOT_FOUND);
    }

    // Return success message
    return successResponse(
      { id },
      'Visit deleted successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}