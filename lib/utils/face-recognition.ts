/**
 * Face Recognition API Integration Utilities
 *
 * Provides functions to interact with the face recognition API
 * for adding subjects, uploading face images, and verifying faces.
 */

// Response interfaces for type safety
interface FaceApiResponse {
  id?: string;
  subject?: string;
  message?: string;
  status?: string;
  [key: string]: unknown;
}

// Recognition result interface
interface RecognitionResult {
  subjects?: Array<{
    subject: string;
    similarity: number;
  }>;
  [key: string]: unknown;
}

// Verification result interface
export interface VerificationResult {
  success: boolean;
  matchFound: boolean;
  similarity?: number;
  visitorId?: string;
  error?: string;
}

// Base configuration for the face recognition API
const FACE_API_CONFIG = {
  baseUrl: 'http://52.66.95.208:8000/api/v1/recognition',
  headers: {
    'x-api-token': '00000000-0000-0000-0000-000000000002',
    'Content-Type': 'application/json',
  }
};

/**
 * Add a subject (visitor) to the face recognition system
 * 
 * @param visitorId - The visitor ID to use as the subject identifier
 * @returns Promise with the result of the API call
 */
export async function addSubjectToFaceRecognition(visitorId: string): Promise<{ success: boolean; data?: FaceApiResponse; error?: string }> {
  try {
    const response = await fetch(`${FACE_API_CONFIG.baseUrl}/subjects`, {
      method: 'POST',
      headers: FACE_API_CONFIG.headers,
      body: JSON.stringify({ subject: visitorId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to add subject to face recognition:', errorData);
      return { 
        success: false, 
        error: `Failed to add subject: ${errorData.message || response.statusText}` 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error adding subject to face recognition:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Add a face image for a subject in the face recognition system
 * 
 * @param visitorId - The visitor ID (subject identifier)
 * @param imageBase64 - The base64-encoded image (without data URI prefix)
 * @returns Promise with the result of the API call
 */
export async function addFaceImageToSubject(visitorId: string, imageBase64: string): Promise<{ success: boolean; data?: FaceApiResponse; error?: string }> {
  try {
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const pureBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const response = await fetch(`${FACE_API_CONFIG.baseUrl}/faces?subject=${visitorId}`, {
      method: 'POST',
      headers: FACE_API_CONFIG.headers,
      body: JSON.stringify({ file: pureBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to add face image:', errorData);
      return { 
        success: false, 
        error: `Failed to add face image: ${errorData.message || response.statusText}` 
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error adding face image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Register a visitor's face in the face recognition system
 * This is a combined function that adds the subject and then uploads the face image
 * 
 * @param visitorId - The visitor ID to use as the subject
 * @param imageBase64 - The base64-encoded image
 * @returns Promise with the result of the registration process
 */
export async function registerVisitorFace(visitorId: string, imageBase64: string): Promise<{ success: boolean; error?: string }> {
  // First add the subject
  const subjectResult = await addSubjectToFaceRecognition(visitorId);
  
  if (!subjectResult.success) {
    return { 
      success: false, 
      error: `Failed to register subject: ${subjectResult.error}` 
    };
  }
  
  // Then add the face image
  const imageResult = await addFaceImageToSubject(visitorId, imageBase64);
  
  if (!imageResult.success) {
    return { 
      success: false, 
      error: `Failed to register face image: ${imageResult.error}` 
    };
  }
  
  return { success: true };
}

/**
 * Verify a face against the recognition system
 *
 * @param imageBase64 - The base64-encoded image (without data URI prefix)
 * @returns Promise with the result of the verification
 */
export async function verifyFace(imageBase64: string): Promise<VerificationResult> {
  try {
    // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
    const pureBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const response = await fetch(`${FACE_API_CONFIG.baseUrl}/recognize`, {
      method: 'POST',
      headers: FACE_API_CONFIG.headers,
      body: JSON.stringify({ file: pureBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to verify face:', errorData);
      return {
        success: false,
        matchFound: false,
        error: `Failed to verify face: ${errorData.message || response.statusText}`
      };
    }

    const data = await response.json();
    
    // Check if we have any subjects in the result
    if (data.result &&
        Array.isArray(data.result) &&
        data.result.length > 0 &&
        data.result[0].subjects &&
        data.result[0].subjects.length > 0) {
      
      const bestMatch = data.result[0].subjects[0];
      const similarity = bestMatch.similarity;
      const visitorId = bestMatch.subject;
      
      return {
        success: true,
        matchFound: true,
        similarity,
        visitorId
      };
    }
    
    // No match found
    return {
      success: true,
      matchFound: false
    };
  } catch (error) {
    console.error('Error verifying face:', error);
    return {
      success: false,
      matchFound: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}