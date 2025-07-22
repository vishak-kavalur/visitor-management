import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth/session';

/**
 * GET /api/auth/status
 * 
 * Returns the current authentication status and user information
 * This endpoint is useful for client-side components to check auth status
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null
      }, { status: 200 });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Failed to get authentication status'
    }, { status: 500 });
  }
}