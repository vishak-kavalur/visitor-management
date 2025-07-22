import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth/session';
import dbConnect from '../../../../lib/db/mongoose';
import Visit from '../../../../lib/db/models/visit';
import Host from '../../../../lib/db/models/host';
import { createAuthError } from '../../../../lib/auth/session';
import mongoose from 'mongoose';

/**
 * GET /api/dashboard/recent-visits
 * 
 * Returns the most recent visits for the dashboard
 * Filtered by department for Admin and Host users
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
    const filter: Record<string, mongoose.Types.ObjectId> = {};
    
    // Filter by department for Admin and Host users
    if (user.role !== 'SuperAdmin' && user.departmentId) {
      // For Admin and Host users, simply filter by their department
      filter.departmentId = new mongoose.Types.ObjectId(user.departmentId);
    }
    
    // Get the 10 most recent visits
    const recentVisits = await Visit.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('visitorId', 'fullName')
      .populate('hostId', 'fullName')
      .lean();
    
    // Format the results
    const formattedVisits = recentVisits.map(visit => ({
      id: visit._id.toString(),
      visitorName: visit.visitorId ? 
        typeof visit.visitorId === 'object' && 'fullName' in visit.visitorId ? 
          visit.visitorId.fullName : 'Unknown Visitor' 
        : 'Unknown Visitor',
      purpose: visit.purposeOfVisit || '',
      hostName: visit.hostId ? 
        typeof visit.hostId === 'object' && 'fullName' in visit.hostId ? 
          visit.hostId.fullName : 'Unknown Host' 
        : 'Unknown Host',
      checkInTime: visit.checkInTimestamp || visit.submissionTimestamp || new Date(),
      status: visit.status || 'PENDING'
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedVisits
    });
    
  } catch (error) {
    console.error('Error fetching recent visits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent visits', success: false },
      { status: 500 }
    );
  }
}