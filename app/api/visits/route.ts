import { NextRequest } from 'next/server';
import dbConnect from '../../../lib/db/mongoose';
import Visit from '../../../lib/db/models/visit';
import Visitor from '../../../lib/db/models/visitor';
import { visitCreateSchema, visitSearchSchema } from '../../../lib/api/schemas';
import { successResponse, errorResponse, createPagination, HTTP_STATUS } from '../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole, hasDepartmentAccess } from '../../../lib/auth/session';
import { Types } from 'mongoose';

/**
 * GET /api/visits
 * Get visits with pagination and filtering
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
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const { 
      status, visitorId, hostId, departmentId, 
      dateFrom, dateTo, page, limit 
    } = visitSearchSchema.parse(queryParams);
    
    // Build search query
    const query: Record<string, unknown> = {};
    
    // Filter by status if provided
    if (status) query.status = status;
    
    // Filter by IDs if provided
    if (visitorId && Types.ObjectId.isValid(visitorId)) query.visitorId = new Types.ObjectId(visitorId);
    if (hostId && Types.ObjectId.isValid(hostId)) query.hostId = new Types.ObjectId(hostId);
    
    // Handle department access control
    if (departmentId && Types.ObjectId.isValid(departmentId)) {
      // If user is not SuperAdmin, check department access
      if (session.user?.role !== 'SuperAdmin' && 
          !hasDepartmentAccess(session.user?.role, session.user?.departmentId, departmentId)) {
        return errorResponse('You do not have access to this department', HTTP_STATUS.FORBIDDEN);
      }
      query.departmentId = new Types.ObjectId(departmentId);
    } else if (session.user?.role !== 'SuperAdmin' && session.user?.departmentId) {
      // If not SuperAdmin and no specific department requested, limit to user's department
      query.departmentId = new Types.ObjectId(session.user.departmentId);
    }
    
    // Date range filtering
    if (dateFrom || dateTo) {
      query.submissionTimestamp = {};
      if (dateFrom) (query.submissionTimestamp as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (query.submissionTimestamp as Record<string, Date>).$lte = dateTo;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries with population
    const [visits, total] = await Promise.all([
      Visit.find(query)
        .sort({ submissionTimestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('visitorId')
        .populate('hostId')
        .populate('departmentId'),
      Visit.countDocuments(query)
    ]);
    
    // Format response data
    const visitsData = visits.map(visit => ({
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
    }));
    
    // Return response with pagination
    return successResponse(
      visitsData,
      'Visits retrieved successfully',
      HTTP_STATUS.OK,
      createPagination(total, page, limit)
    );
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/visits
 * Create a new visit request
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (even kiosk access requires basic auth)
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Connect to database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    const { visitorId, hostId, departmentId, purposeOfVisit } = visitCreateSchema.parse(body);
    
    // Validate visitor exists
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return errorResponse('Visitor not found', HTTP_STATUS.BAD_REQUEST);
    }
    
    // Create new visit
    const visit = new Visit({
      visitorId: new Types.ObjectId(visitorId),
      hostId: new Types.ObjectId(hostId),
      departmentId: new Types.ObjectId(departmentId),
      purposeOfVisit,
      status: 'Pending',
      submissionTimestamp: new Date()
    });
    
    // Save to database
    await visit.save();
    
    // Return response
    return successResponse(
      {
        _id: visit._id,
        status: visit.status,
        visitorId: visit.visitorId,
        hostId: visit.hostId,
        departmentId: visit.departmentId,
        purposeOfVisit: visit.purposeOfVisit,
        submissionTimestamp: visit.submissionTimestamp
      },
      'Visit request created successfully',
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    return errorResponse(error);
  }
}