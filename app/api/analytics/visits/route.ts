import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Visit from '../../../../lib/db/models/visit';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth/session';
import { Types } from 'mongoose';

/**
 * GET /api/analytics/visits
 * Get visits analytics grouped by time period (daily, weekly, monthly)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Connect to database
    await dbConnect();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'daily';
    const days = parseInt(searchParams.get('days') || '30', 10);
    
    // Limit maximum days to prevent heavy queries
    const maxDays = Math.min(days, 90);
    
    // Get the user's department for filtering if not SuperAdmin
    const departmentFilter: Record<string, unknown> = {};
    if (session.user?.role !== 'SuperAdmin' && session.user?.departmentId) {
      departmentFilter.departmentId = new Types.ObjectId(session.user.departmentId);
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxDays);
    
    // Base query with time range and department filter
    const baseQuery = {
      ...departmentFilter,
      submissionTimestamp: { $gte: startDate, $lte: endDate }
    };
    
    // Different aggregation based on period
    let timeGrouping: Record<string, unknown>;
    
    switch (period) {
      case 'weekly':
        // Group by week
        timeGrouping = {
          year: { $year: '$submissionTimestamp' },
          week: { $week: '$submissionTimestamp' }
        };
        break;
        
      case 'monthly':
        // Group by month
        timeGrouping = {
          year: { $year: '$submissionTimestamp' },
          month: { $month: '$submissionTimestamp' }
        };
        break;
        
      case 'daily':
      default:
        // Group by day
        timeGrouping = {
          year: { $year: '$submissionTimestamp' },
          month: { $month: '$submissionTimestamp' },
          day: { $dayOfMonth: '$submissionTimestamp' }
        };
        break;
    }
    
    // Run aggregation pipeline
    const visitAnalytics = await Visit.aggregate([
      { $match: baseQuery },
      { 
        $group: {
          _id: timeGrouping,
          totalVisits: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          checkedIn: { $sum: { $cond: [{ $eq: ['$status', 'CheckedIn'] }, 1, 0] } },
          checkedOut: { $sum: { $cond: [{ $eq: ['$status', 'CheckedOut'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          date: { $first: '$submissionTimestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$date',
          totalVisits: 1,
          approved: 1,
          rejected: 1,
          checkedIn: 1,
          checkedOut: 1,
          pending: 1,
          completionRate: { 
            $multiply: [
              { $divide: ['$checkedOut', { $max: ['$totalVisits', 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // Calculate aggregated metrics
    const totalVisits = visitAnalytics.reduce((sum, item) => sum + item.totalVisits, 0);
    const totalCompletions = visitAnalytics.reduce((sum, item) => sum + item.checkedOut, 0);
    const overallCompletionRate = totalVisits > 0 ? (totalCompletions / totalVisits) * 100 : 0;
    
    // Return analytics data
    return successResponse({
      period,
      days: maxDays,
      data: visitAnalytics,
      summary: {
        totalVisits,
        totalCompletions,
        overallCompletionRate
      }
    }, 'Visit analytics retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}