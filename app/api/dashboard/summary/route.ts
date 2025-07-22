import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Visit from '../../../../lib/db/models/visit';
import Visitor from '../../../../lib/db/models/visitor';
import Host from '../../../../lib/db/models/host';
import Department from '../../../../lib/db/models/department';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole, hasDepartmentAccess } from '../../../../lib/auth/session';
import { Types } from 'mongoose';

/**
 * GET /api/dashboard/summary
 * Get summary statistics for the dashboard
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
    
    // Get the user's department for filtering if not SuperAdmin
    const departmentFilter: Record<string, unknown> = {};
    if (session.user?.role !== 'SuperAdmin' && session.user?.departmentId) {
      departmentFilter.departmentId = new Types.ObjectId(session.user.departmentId);
    }
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get yesterday's date range
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get current month's date range
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Get previous month's date range
    const firstDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    
    // Execute queries in parallel for better performance
    const [
      // Today's stats
      todayVisits,
      todayCheckedIn,
      todayCheckedOut,
      todayPending,
      // Yesterday's stats
      yesterdayVisits,
      // This month's stats
      monthVisits,
      monthCheckedIn,
      // Total stats
      totalVisitors,
      totalPendingApprovals,
      // Department stats (only for SuperAdmin)
      departments,
      departmentVisits,
      // Host stats
      hosts,
    ] = await Promise.all([
      // Today's stats
      Visit.countDocuments({
        ...departmentFilter,
        submissionTimestamp: { $gte: today, $lt: tomorrow }
      }),
      Visit.countDocuments({
        ...departmentFilter,
        status: 'CheckedIn',
        checkInTimestamp: { $gte: today, $lt: tomorrow }
      }),
      Visit.countDocuments({
        ...departmentFilter,
        status: 'CheckedOut',
        checkOutTimestamp: { $gte: today, $lt: tomorrow }
      }),
      Visit.countDocuments({
        ...departmentFilter,
        status: 'Pending',
        submissionTimestamp: { $gte: today, $lt: tomorrow }
      }),
      // Yesterday's stats
      Visit.countDocuments({
        ...departmentFilter,
        submissionTimestamp: { $gte: yesterday, $lt: today }
      }),
      // This month's stats
      Visit.countDocuments({
        ...departmentFilter,
        submissionTimestamp: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
      }),
      Visit.countDocuments({
        ...departmentFilter,
        $or: [
          { status: 'CheckedIn', checkInTimestamp: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth } },
          { status: 'CheckedOut', checkInTimestamp: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth } }
        ]
      }),
      // Total stats
      Visitor.countDocuments({}),
      Visit.countDocuments({ ...departmentFilter, status: 'Pending' }),
      // Department stats (only for SuperAdmin)
      session.user?.role === 'SuperAdmin' ? Department.find({}).lean() : [],
      session.user?.role === 'SuperAdmin' ? 
        Visit.aggregate([
          { $group: { 
            _id: '$departmentId', 
            totalVisits: { $sum: 1 },
            checkedIn: { 
              $sum: { $cond: [{ $eq: ['$status', 'CheckedIn'] }, 1, 0] } 
            },
            checkedOut: { 
              $sum: { $cond: [{ $eq: ['$status', 'CheckedOut'] }, 1, 0] } 
            },
            pending: { 
              $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } 
            }
          }},
          { $lookup: { 
            from: 'departments', 
            localField: '_id', 
            foreignField: '_id', 
            as: 'departmentInfo' 
          }},
          { $unwind: '$departmentInfo' },
          { $project: { 
            departmentId: '$_id',
            departmentName: '$departmentInfo.name',
            totalVisits: 1,
            checkedIn: 1,
            checkedOut: 1,
            pending: 1
          }}
        ]) : [],
      // Host stats
      Host.countDocuments(departmentFilter),
    ]);
    
    // Calculate daily growth rate
    const dailyGrowthRate = yesterdayVisits > 0 
      ? ((todayVisits - yesterdayVisits) / yesterdayVisits) * 100 
      : 100; // If yesterday was 0, consider it 100% growth
    
    // Calculate monthly stats
    const monthlyVisitAverage = monthVisits / (today.getDate());
    
    // Define type for department stats
    interface DepartmentStat {
      departmentId: Types.ObjectId;
      departmentName: string;
      totalVisits: number;
      checkedIn: number;
      checkedOut: number;
      pending: number;
    }
    
    // Define type for summary data
    interface SummaryData {
      today: {
        totalVisits: number;
        checkedIn: number;
        checkedOut: number;
        pending: number;
        growthRate: number;
      };
      month: {
        totalVisits: number;
        checkedIn: number;
        dailyAverage: number;
      };
      total: {
        visitors: number;
        pendingApprovals: number;
        hosts: number;
      };
      departments?: DepartmentStat[]; // Optional property for SuperAdmin
    }
    
    // Build response data
    const summaryData: SummaryData = {
      today: {
        totalVisits: todayVisits,
        checkedIn: todayCheckedIn,
        checkedOut: todayCheckedOut,
        pending: todayPending,
        growthRate: dailyGrowthRate
      },
      month: {
        totalVisits: monthVisits,
        checkedIn: monthCheckedIn,
        dailyAverage: monthlyVisitAverage
      },
      total: {
        visitors: totalVisitors,
        pendingApprovals: totalPendingApprovals,
        hosts: hosts
      }
    };
    
    // Add department stats for SuperAdmin
    if (session.user?.role === 'SuperAdmin') {
      summaryData.departments = departmentVisits;
    }
    
    return successResponse(
      summaryData,
      'Dashboard summary retrieved successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}