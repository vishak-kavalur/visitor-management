/**
 * Database seed utility
 * 
 * This file contains functions to seed the database with initial data
 * for testing and development purposes.
 */

import dbConnect from './mongoose';
import Department from './models/department';
import Host from './models/host';
import { ObjectId } from 'mongodb';

/**
 * Seed the database with initial departments and hosts
 */
export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Connect to the database
    await dbConnect();
    
    // Clear existing data
    await Department.deleteMany({});
    await Host.deleteMany({});
    
    // Create departments
    console.log('Creating departments...');
    const departments = await Department.create([
      { name: 'IT Department' },
      { name: 'HR Department' },
      { name: 'Finance Department' },
      { name: 'Executive' }
    ]);
    
    console.log(`Created ${departments.length} departments`);
    
    // Create hosts with roles
    console.log('Creating hosts...');
    
    // Super Admin (no department)
    await Host.create({
      email: 'superadmin@example.com',
      password: 'password123', // WARNING: plaintext for PoC only
      fullName: 'Super Admin User',
      role: 'SuperAdmin'
    });
    
    // Department Admins
    for (const dept of departments) {
      await Host.create({
        email: `admin-${dept.name.toLowerCase().replace(/\s+/g, '-')}@example.com`,
        password: 'password123', // WARNING: plaintext for PoC only
        fullName: `${dept.name} Admin`,
        departmentId: dept._id,
        role: 'Admin'
      });
    }
    
    // Regular Hosts
    for (const dept of departments) {
      await Host.create({
        email: `host-${dept.name.toLowerCase().replace(/\s+/g, '-')}@example.com`,
        password: 'password123', // WARNING: plaintext for PoC only
        fullName: `${dept.name} Host`,
        departmentId: dept._id,
        role: 'Host'
      });
    }
    
    const hostCount = await Host.countDocuments();
    console.log(`Created ${hostCount} hosts`);
    
    console.log('Database seeding completed successfully!');
    return {
      success: true,
      departments: departments.length,
      hosts: hostCount
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Command line interface for seeding
 * This function will be executed when this file is run directly
 */
async function main() {
  try {
    const result = await seedDatabase();
    console.log('Seed result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Execute main function if this file is run directly
if (require.main === module) {
  main();
}