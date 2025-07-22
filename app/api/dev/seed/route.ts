import { NextResponse } from 'next/server';
import { seedDatabase } from '../../../../lib/db/seed';

/**
 * POST /api/dev/seed
 * 
 * Seeds the database with initial test data
 * 
 * SECURITY NOTICE:
 * This endpoint is for development purposes only and should be
 * disabled or protected in production environments.
 */
export async function POST() {
  // Security check - only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }
  
  try {
    const result = await seedDatabase();
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to seed database', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        message: 'Database seeded successfully',
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}