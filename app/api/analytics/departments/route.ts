import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Visit from '../../../../lib/db/models/visit';
import Department from '../../../../lib/db/models/department';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole } from '../../../../lib/auth/session';

/**
 * GET /api/analytics/departments
 * Get visit analytics grouped by department
 * This endpoint is for SuperAdmin users only
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }
    
    // Only SuperAdmin can access all departments' analytics
    if (!hasRole(session.user?.role, 'SuperAdmin')) {
      return errorResponse('Access denied - SuperAdmin role required', HTTP_STATUS.FORBIDDEN);
    }

    // Connect to database
    await dbConnect();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'year', 'all'
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        // Set to a very old date to include all records
        startDate.setFullYear(2000);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1); // Default to month
    }
    
    // First get all departments for reference
    const departments = await Department.find({}).lean();
    
    // Create a map of department IDs to names for easy lookup
    const departmentMap = new Map();
    departments.forEach(dept => {
      departmentMap.set(dept._id.toString(), dept.name);
    });
    
    // Query to match visits within the selected time period
    const timeQuery = period !== 'all' 
      ? { submissionTimestamp: { $gte: startDate, $lte: endDate } }
      : {};
    
    // Run aggregation pipeline to get stats by department
    const departmentStats = await Visit.aggregate([
      { $match: timeQuery },
      { 
        $group: {
          _id: '$departmentId',
          totalVisits: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
          checkedIn: { $sum: { $cond: [{ $eq: ['$status', 'CheckedIn'] }, 1, 0] } },
          checkedOut: { $sum: { $cond: [{ $eq: ['$status', 'CheckedOut'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 1,
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
      { $sort: { totalVisits: -1 } } // Sort by total visits descending
    ]);
    
    // Add department name to each result
    const departmentAnalytics = departmentStats.map(stat => ({
      ...stat,
      departmentName: departmentMap.get(stat._id.toString()) || 'Unknown Department'
    }));
    
    // Calculate overall stats
    const totalVisits = departmentAnalytics.reduce((sum, dept) => sum + dept.totalVisits, 0);
    const totalCheckedOut = departmentAnalytics.reduce((sum, dept) => sum + dept.checkedOut, 0);
    const overallCompletionRate = totalVisits > 0 ? (totalCheckedOut / totalVisits) * 100 : 0;
    
    // Return analytics data
    return successResponse({
      period,
      startDate,
      endDate,
      data: departmentAnalytics,
      summary: {
        totalDepartments: departments.length,
        totalVisits,
        totalCheckedOut,
        overallCompletionRate
      }
    }, 'Department analytics retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}