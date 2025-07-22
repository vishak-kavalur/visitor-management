import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth/session';
import dbConnect from '../../../../lib/db/mongoose';
import Visit from '../../../../lib/db/models/visit';
import Department from '../../../../lib/db/models/department';
import { createAuthError } from '../../../../lib/auth/session';
import mongoose from 'mongoose';

/**
 * GET /api/dashboard/pending-approvals
 * 
 * Returns pending visit approvals based on user role and department:
 * - SuperAdmin: All pending approvals across departments
 * - Admin: Pending approvals for their department
 * - Host: Pending approvals assigned to them
 */
export async function GET(req: NextRequest) {
  try {
    // Get current user from session
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(createAuthError(), { status: 401 });
    }
    
    // Connect to database
    await dbConnect();
    
    // Prepare filter based on role and department
    const filter: Record<string, any> = {
      status: 'Pending' // Only get pending visits
    };
    
    // Filter by department or host based on user role
    if (user.role === 'Host') {
      // Hosts only see their own pending approvals
      filter.hostId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'Admin' && user.departmentId) {
      // Admins see pending approvals for their department
      filter.departmentId = new mongoose.Types.ObjectId(user.departmentId);
    }
    // SuperAdmins see all pending approvals (no additional filter)
    
    // Get pending approvals
    const pendingVisits = await Visit.find(filter)
      .sort({ submissionTimestamp: 1 }) // Oldest first
      .populate('visitorId', 'fullName email phone')
      .populate('hostId', 'fullName')
      .populate('departmentId', 'name')
      .lean();
    
    // Format the results
    const formattedVisits = pendingVisits.map(visit => ({
      id: visit._id.toString(),
      visitorName: visit.visitorId && typeof visit.visitorId === 'object' && 'fullName' in visit.visitorId 
        ? visit.visitorId.fullName 
        : 'Unknown Visitor',
      visitorEmail: visit.visitorId && typeof visit.visitorId === 'object' && 'email' in visit.visitorId 
        ? visit.visitorId.email 
        : '',
      visitorPhone: visit.visitorId && typeof visit.visitorId === 'object' && 'phone' in visit.visitorId 
        ? visit.visitorId.phone 
        : '',
      purpose: visit.purposeOfVisit || '',
      hostName: visit.hostId && typeof visit.hostId === 'object' && 'fullName' in visit.hostId 
        ? visit.hostId.fullName 
        : 'Unknown Host',
      hostId: visit.hostId && typeof visit.hostId === 'object' && '_id' in visit.hostId 
        ? visit.hostId._id.toString() 
        : '',
      departmentName: visit.departmentId && typeof visit.departmentId === 'object' && 'name' in visit.departmentId 
        ? visit.departmentId.name 
        : 'Unknown Department',
      departmentId: visit.departmentId && typeof visit.departmentId === 'object' && '_id' in visit.departmentId 
        ? visit.departmentId._id.toString() 
        : '',
      submissionTime: visit.submissionTimestamp ? visit.submissionTimestamp.toISOString() : new Date().toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedVisits
    });
    
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals', success: false },
      { status: 500 }
    );
  }
}