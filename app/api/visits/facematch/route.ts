import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db/mongoose';
import Visit from '../../../../lib/db/models/visit';
import Visitor from '../../../../lib/db/models/visitor';
import { verifyFace } from '../../../../lib/utils/face-recognition';
import { successResponse, errorResponse, HTTP_STATUS } from '../../../../lib/api/response';
import mongoose from 'mongoose';
import { z } from 'zod';
import { VisitStatus } from '../../../../types/database';

// Interface for the response data structure
interface FaceMatchResponseData {
  visitor: {
    id: unknown;
    name: string;
    imageBase64: string;
  };
  visit: {
    id: unknown;
    status: string;
    checkInTime?: Date;
    checkOutTime?: Date;
  };
  similarity: number;
}

// Schema for validating the request body
const faceMatchSchema = z.object({
  imageBase64: z.string().min(1, "Image data is required"),
  type: z.enum(["CHECKIN", "CHECKOUT"])
    .describe("Type of operation: CHECKIN or CHECKOUT")
});

/**
 * POST /api/visits/facematch
 *
 * Verifies a visitor's face against the registered face in the recognition system
 * If a match is found with sufficient confidence (similarity >= 0.9):
 * - For CHECKIN: Updates the corresponding visit status to "CheckedIn"
 * - For CHECKOUT: Updates the corresponding visit status to "CheckedOut"
 * - Returns visitor details
 *
 * Required parameters:
 * - imageBase64: Base64 encoded image of the visitor's face
 * - type: "CHECKIN" or "CHECKOUT" to specify the operation type
 */
export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = faceMatchSchema.parse(body);
    
    // Verify the face image against the recognition system
    const verificationResult = await verifyFace(validatedData.imageBase64);
    
    if (!verificationResult.success) {
      console.error('Face verification API error:', verificationResult.error);
      return errorResponse('Face verification service unavailable', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    
    // Check if a match was found with sufficient confidence
    if (!verificationResult.matchFound || 
        !verificationResult.similarity || 
        verificationResult.similarity < 0.9 ||
        !verificationResult.visitorId) {
      return errorResponse('NO match found', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    
    // A match was found with high confidence, fetch the visitor details
    const visitorId = verificationResult.visitorId;
    
    // Ensure the visitor ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(visitorId)) {
      return errorResponse('Invalid visitor ID from recognition system', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    
    // Fetch the visitor from the database
    const visitor = await Visitor.findById(visitorId).exec();
    
    if (!visitor) {
      return errorResponse('Visitor not found in database', HTTP_STATUS.NOT_FOUND);
    }
    
    // Determine which status to look for based on operation type
    let validStatus: VisitStatus[];
    const operationType = validatedData.type;
    
    if (operationType === "CHECKIN") {
      validStatus = ['Approved'];
    } else if (operationType === "CHECKOUT") {
      validStatus = ['CheckedIn'];
    } else {
      return errorResponse('Invalid operation type', HTTP_STATUS.BAD_REQUEST);
    }

    // Find the most recent visit with the appropriate status for this visitor
    const recentVisit = await Visit.findOne({
      visitorId: new mongoose.Types.ObjectId(visitorId),
      status: { $in: validStatus }
    })
    .sort({ submissionTimestamp: -1 })
    .exec();
    
    if (!recentVisit) {
      if (operationType === "CHECKIN") {
        return errorResponse('No approved visit found for this visitor', HTTP_STATUS.NOT_FOUND);
      } else {
        return errorResponse('No checked-in visit found for this visitor', HTTP_STATUS.NOT_FOUND);
      }
    }
    
    // Update the visit status based on operation type
    if (operationType === "CHECKIN") {
      recentVisit.status = 'CheckedIn';
      recentVisit.checkInTimestamp = new Date();
    } else {
      recentVisit.status = 'CheckedOut';
      recentVisit.checkOutTimestamp = new Date();
    }
    
    await recentVisit.save();
    
    // Prepare the response data
    const responseData: FaceMatchResponseData = {
      visitor: {
        id: visitor._id,
        name: visitor.fullName,
        imageBase64: visitor.imageBase64
      },
      visit: {
        id: recentVisit._id,
        status: recentVisit.status
      },
      similarity: verificationResult.similarity || 0
    };
    
    // Add appropriate timestamp to response
    if (operationType === "CHECKIN") {
      responseData.visit.checkInTime = recentVisit.checkInTimestamp;
      return successResponse(responseData, 'Visitor successfully checked in');
    } else {
      responseData.visit.checkOutTime = recentVisit.checkOutTimestamp;
      return successResponse(responseData, 'Visitor successfully checked out');
    }
    
  } catch (error) {
    console.error('Error in face verification endpoint:', error);
    
    if (error instanceof z.ZodError) {
      // Handle validation errors
      return errorResponse(error, HTTP_STATUS.BAD_REQUEST);
    }
    
    return errorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}