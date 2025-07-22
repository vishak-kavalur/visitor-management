import { NextRequest } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Visitor from '../../../../lib/db/models/visitor';
import { visitorUpdateSchema } from '../../../../lib/api/schemas';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../lib/api/response';
import { getServerSession } from 'next-auth/next';
import { authOptions, hasRole } from '../../../../lib/auth/session';
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
 * GET /api/visitors/[id]
 * Get a single visitor by ID
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
      return errorResponse('Invalid visitor ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find visitor by ID
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return errorResponse('Visitor not found', HTTP_STATUS.NOT_FOUND);
    }

    // Return visitor data
    return successResponse({
      _id: visitor._id,
      aadhaarNumber: visitor.aadhaarNumber,
      fullName: visitor.fullName,
      imageBase64: visitor.imageBase64,
      firstVisit: visitor.firstVisit,
      lastVisit: visitor.lastVisit,
      createdTime: visitor.createdTime
    }, 'Visitor retrieved successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * PUT /api/visitors/[id]
 * Update a visitor by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !hasRole(session.user?.role, 'Admin')) {
      return errorResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate ID
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid visitor ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find visitor by ID
    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return errorResponse('Visitor not found', HTTP_STATUS.NOT_FOUND);
    }

    // Parse and validate request body
    const body = await request.json();
    const { fullName, imageBase64 } = visitorUpdateSchema.parse(body);

    // Update visitor fields
    if (fullName !== undefined) visitor.fullName = fullName;
    if (imageBase64 !== undefined) visitor.imageBase64 = imageBase64;

    // Save changes
    await visitor.save();

    // Return updated visitor data
    return successResponse({
      _id: visitor._id,
      aadhaarNumber: visitor.aadhaarNumber,
      fullName: visitor.fullName,
      imageBase64: visitor.imageBase64,
      firstVisit: visitor.firstVisit,
      lastVisit: visitor.lastVisit,
      createdTime: visitor.createdTime
    }, 'Visitor updated successfully');
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/visitors/[id]
 * Delete a visitor by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !hasRole(session.user?.role, 'SuperAdmin')) {
      return errorResponse('Unauthorized - requires SuperAdmin', HTTP_STATUS.UNAUTHORIZED);
    }

    // Validate ID
    const id = (await params).id;
    if (!isValidObjectId(id)) {
      return errorResponse('Invalid visitor ID', HTTP_STATUS.BAD_REQUEST);
    }

    // Connect to database
    await dbConnect();

    // Find visitor by ID and delete
    const visitor = await Visitor.findByIdAndDelete(id);
    if (!visitor) {
      return errorResponse('Visitor not found', HTTP_STATUS.NOT_FOUND);
    }

    // Return success message
    return successResponse(
      { id },
      'Visitor deleted successfully'
    );
  } catch (error) {
    return errorResponse(error);
  }
}