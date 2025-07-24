import { NextRequest } from 'next/server';
import dbConnect from '../../../lib/db/mongoose';
import Visitor from '../../../lib/db/models/visitor';
import { visitorCreateSchema, visitorSearchSchema } from '../../../lib/api/schemas';
import { successResponse, createPagination, HTTP_STATUS } from '../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth/session';
import { hasRole } from '../../../lib/auth/session';
import {
  handleApiError,
  createErrorResponse,
  ErrorType,
  safeValidateRequest
} from '../../../lib/api/error-handler';

/**
 * GET /api/visitors
 * Get visitors with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check removed for DB API endpoints in POC
    
    // Connect to database
    await dbConnect();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validationResult = safeValidateRequest(visitorSearchSchema, queryParams);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }
    
    const { aadhaarNumber, fullName } = validationResult.data ?? {};
    const page = validationResult.data?.page ?? 1;
    const limit = validationResult.data?.limit ?? 10;
    
    // Build search query
    const query: Record<string, unknown> = {};
    if (aadhaarNumber) query.aadhaarNumber = { $regex: aadhaarNumber, $options: 'i' };
    if (fullName) query.fullName = { $regex: fullName, $options: 'i' };

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries with error handling
    try {
      const [visitors, total] = await Promise.all([
        Visitor.find(query).sort({ createdTime: -1 }).skip(skip).limit(limit),
        Visitor.countDocuments(query)
      ]);
      
      // Map to safe details for response
      const visitorData = visitors.map(visitor => ({
        _id: visitor._id,
        fullName: visitor.fullName,
        firstVisit: visitor.firstVisit,
        lastVisit: visitor.lastVisit
      }));
      
      // Return response with pagination
      return successResponse(
        visitorData,
        'Visitors retrieved successfully',
        HTTP_STATUS.OK,
        createPagination(total, page, limit)
      );
    } catch (dbError) {
      return handleApiError(dbError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/visitors
 * Create a new visitor
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check removed for DB API endpoints in POC
    
    // For role-based checks, we'll bypass them in the POC but keep the code commented
    /*
    // Check authorization
    if (!hasRole(session.user?.role, 'Admin')) {
      return createErrorResponse(
        'Administrator privileges required to create visitors',
        ErrorType.AUTHORIZATION,
        HTTP_STATUS.FORBIDDEN
      );
    }
    */

    // Connect to database
    await dbConnect();
    
    // Parse and validate request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return createErrorResponse(
        'Invalid JSON in request body',
        ErrorType.VALIDATION,
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Validate request body against schema
    const validationResult = safeValidateRequest(visitorCreateSchema, body);
    if (!validationResult.success) {
      return handleApiError(validationResult.error);
    }
    
    const { aadhaarNumber, fullName, imageBase64 } = validationResult.data ?? {};
    
    try {
      // Check if visitor already exists
      const existingVisitor = await Visitor.findOne({ aadhaarNumber });
      if (existingVisitor) {
        return createErrorResponse(
          'Visitor with this Aadhaar number already exists',
          ErrorType.CONFLICT,
          HTTP_STATUS.CONFLICT
        );
      }
      
      // Create new visitor
      const visitor = new Visitor({
        aadhaarNumber,
        fullName,
        imageBase64,
        firstVisit: new Date(),
      });
      
      // Save to database
      await visitor.save();
      
      // Return response
      return successResponse(
        {
          _id: visitor._id,
          aadhaarNumber: visitor.aadhaarNumber,
          fullName: visitor.fullName,
          imageBase64: visitor.imageBase64,
          firstVisit: visitor.firstVisit,
          lastVisit: visitor.lastVisit,
          createdTime: visitor.createdTime
        },
        'Visitor created successfully',
        HTTP_STATUS.CREATED
      );
    } catch (dbError) {
      return handleApiError(dbError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  } catch (error) {
    return handleApiError(error);
  }
}