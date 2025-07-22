import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../lib/auth/session';
import { hasRole, canAccessResource, createAuthError, createPermissionError } from '../../../../../lib/auth/session';
import dbConnect from '../../../../../lib/db/mongoose';
import Visit from '../../../../../lib/db/models/visit';
import mongoose from 'mongoose';

/**
 * POST /api/visits/[id]/reject
 * 
 * Rejects a pending visit request
 * Only hosts assigned to the visit or admins/superadmins can reject
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visitId = params.id;
    
    // Validate visit ID
    if (!visitId || !mongoose.Types.ObjectId.isValid(visitId)) {
      return NextResponse.json(
        { error: 'Invalid visit ID', success: false },
        { status: 400 }
      );
    }
    
    // Get current user from session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(createAuthError(), { status: 401 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Find the visit
    const visit = await Visit.findById(visitId)
      .populate('departmentId')
      .exec();
    
    if (!visit) {
      return NextResponse.json(
        { error: 'Visit not found', success: false },
        { status: 404 }
      );
    }
    
    // Check if visit is already processed
    if (visit.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Visit is already processed', success: false },
        { status: 400 }
      );
    }
    
    // Check permissions
    const hasAccess = 
      // The assigned host can always reject their own visits
      (visit.hostId.toString() === user.id) || 
      // Admins can reject visits in their department
      (hasRole(user.role, 'Admin') && 
        canAccessResource(
          user.role, 
          user.departmentId, 
          visit.departmentId ? visit.departmentId.toString() : null,
          'Admin'
        ));
    
    if (!hasAccess) {
      return NextResponse.json(
        createPermissionError('You do not have permission to reject this visit'),
        { status: 403 }
      );
    }
    
    // Reject the visit
    visit.status = 'Rejected';
    visit.approval = {
      approvedBy: new mongoose.Types.ObjectId(user.id),
      timestamp: new Date()
    };
    await visit.save();
    
    return NextResponse.json({
      success: true,
      message: 'Visit rejected successfully',
      data: {
        id: visit._id,
        status: visit.status
      }
    });
    
  } catch (error) {
    console.error('Error rejecting visit:', error);
    return NextResponse.json(
      { error: 'Failed to reject visit', success: false },
      { status: 500 }
    );
  }
}