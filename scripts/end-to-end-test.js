/**
 * End-to-End Testing Script for Visitor Management System
 * 
 * This script performs a comprehensive test of all major functionalities:
 * - Authentication
 * - Department management
 * - Host management
 * - Visitor management
 * - Visit management
 * - Analytics
 * - Dashboard data
 * 
 * Run with: node scripts/end-to-end-test.js [base_url] [admin_email] [admin_password]
 */

import axios from 'axios';
import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:4000';
const ADMIN_EMAIL = process.argv[3] || 'admin@example.com';
const ADMIN_PASSWORD = process.argv[4] || 'Admin@123';

// Test data
const TEST_DATA = {
  department: {
    name: `Test Department ${Date.now()}`,
    description: 'Department created during E2E testing',
    floor: '3rd Floor',
    building: 'East Wing'
  },
  host: {
    email: `host.${Date.now()}@example.com`,
    password: 'Host@123',
    fullName: 'Test Host',
    role: 'Host'
  },
  visitor: {
    aadhaarNumber: `${Date.now()}`.substring(0, 12).padStart(12, '9'),
    fullName: 'Test Visitor',
    imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  },
  visit: {
    purposeOfVisit: 'E2E Testing'
  }
};

// State to store created data IDs
const STATE = {
  token: null,
  departmentId: null,
  hostId: null,
  visitorId: null,
  visitId: null
};

// HTTP client with auth header injection
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: status => status < 500 // Don't throw on 4xx
});

client.interceptors.request.use(config => {
  if (STATE.token) {
    config.headers.Authorization = `Bearer ${STATE.token}`;
  }
  return config;
});

// Helper functions
const log = (message, isError = false) => {
  console.log(`${isError ? '❌' : '✅'} ${message}`);
};

const logSection = title => {
  console.log('\n' + '='.repeat(50));
  console.log(`TESTING: ${title}`);
  console.log('='.repeat(50));
};

const runTest = async (title, testFn) => {
  try {
    await testFn();
    log(`PASSED: ${title}`);
    return true;
  } catch (error) {
    log(`FAILED: ${title} - ${error.message}`, true);
    console.error(error);
    return false;
  }
};

// Test Cases
const testAuthentication = async () => {
  logSection('Authentication');
  
  // Get CSRF token
  const csrfResponse = await client.get('/api/auth/csrf');
  const csrfToken = csrfResponse.data.csrfToken;
  
  // Login
  const loginResponse = await client.post('/api/auth/callback/credentials', {
    csrfToken,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    callbackUrl: `${BASE_URL}/dashboard`
  });
  
  // Get session
  const sessionResponse = await client.get('/api/auth/session');
  assert.ok(sessionResponse.data.user, 'Authentication failed');
  
  // Store token if available
  STATE.token = sessionResponse.data.token;
  
  // Test auth status
  const statusResponse = await client.get('/api/auth/status');
  assert.strictEqual(statusResponse.status, 200);
  assert.strictEqual(statusResponse.data.isAuthenticated, true);
};

const testDepartmentManagement = async () => {
  logSection('Department Management');
  
  // Create department
  const createResponse = await client.post('/api/admin/departments', TEST_DATA.department);
  assert.strictEqual(createResponse.status, 201);
  STATE.departmentId = createResponse.data._id;
  
  // Get all departments
  const listResponse = await client.get('/api/admin/departments');
  assert.strictEqual(listResponse.status, 200);
  assert.ok(Array.isArray(listResponse.data));
  
  // Get specific department
  const getResponse = await client.get(`/api/admin/departments/${STATE.departmentId}`);
  assert.strictEqual(getResponse.status, 200);
  assert.strictEqual(getResponse.data.name, TEST_DATA.department.name);
  
  // Update department
  const updateResponse = await client.put(`/api/admin/departments/${STATE.departmentId}`, {
    ...TEST_DATA.department,
    description: 'Updated description'
  });
  assert.strictEqual(updateResponse.status, 200);
  assert.strictEqual(updateResponse.data.description, 'Updated description');
};

const testHostManagement = async () => {
  logSection('Host Management');
  
  // Create host with department
  const createResponse = await client.post('/api/admin/hosts', {
    ...TEST_DATA.host,
    departmentId: STATE.departmentId
  });
  assert.strictEqual(createResponse.status, 201);
  STATE.hostId = createResponse.data._id;
  
  // Get all hosts
  const listResponse = await client.get('/api/admin/hosts');
  assert.strictEqual(listResponse.status, 200);
  assert.ok(Array.isArray(listResponse.data));
  
  // Get specific host
  const getResponse = await client.get(`/api/admin/hosts/${STATE.hostId}`);
  assert.strictEqual(getResponse.status, 200);
  assert.strictEqual(getResponse.data.email, TEST_DATA.host.email);
  
  // Update host
  const updateResponse = await client.put(`/api/admin/hosts/${STATE.hostId}`, {
    ...TEST_DATA.host,
    departmentId: STATE.departmentId,
    fullName: 'Updated Host Name'
  });
  assert.strictEqual(updateResponse.status, 200);
  assert.strictEqual(updateResponse.data.fullName, 'Updated Host Name');
};

const testVisitorManagement = async () => {
  logSection('Visitor Management');
  
  // Create visitor
  const createResponse = await client.post('/api/visitors', TEST_DATA.visitor);
  assert.strictEqual(createResponse.status, 201);
  STATE.visitorId = createResponse.data._id;
  
  // Get all visitors
  const listResponse = await client.get('/api/visitors');
  assert.strictEqual(listResponse.status, 200);
  assert.ok(Array.isArray(listResponse.data));
  
  // Get specific visitor
  const getResponse = await client.get(`/api/visitors/${STATE.visitorId}`);
  assert.strictEqual(getResponse.status, 200);
  assert.strictEqual(getResponse.data.aadhaarNumber, TEST_DATA.visitor.aadhaarNumber);
};

const testVisitManagement = async () => {
  logSection('Visit Management');
  
  // Create visit
  const visitData = {
    ...TEST_DATA.visit,
    visitorId: STATE.visitorId,
    hostId: STATE.hostId,
    departmentId: STATE.departmentId
  };
  
  const createResponse = await client.post('/api/visits', visitData);
  assert.strictEqual(createResponse.status, 201);
  STATE.visitId = createResponse.data._id;
  
  // Get all visits
  const listResponse = await client.get('/api/visits');
  assert.strictEqual(listResponse.status, 200);
  assert.ok(Array.isArray(listResponse.data));
  
  // Get specific visit
  const getResponse = await client.get(`/api/visits/${STATE.visitId}`);
  assert.strictEqual(getResponse.status, 200);
  assert.strictEqual(getResponse.data.visitorId, STATE.visitorId);
  
  // Update visit status to Approved
  const approveResponse = await client.put(`/api/visits/${STATE.visitId}/status`, {
    status: 'Approved'
  });
  assert.strictEqual(approveResponse.status, 200);
  assert.strictEqual(approveResponse.data.status, 'Approved');
  
  // Update visit status to CheckedIn
  const checkInResponse = await client.put(`/api/visits/${STATE.visitId}/status`, {
    status: 'CheckedIn'
  });
  assert.strictEqual(checkInResponse.status, 200);
  assert.strictEqual(checkInResponse.data.status, 'CheckedIn');
  
  // Update visit status to CheckedOut
  const checkOutResponse = await client.put(`/api/visits/${STATE.visitId}/status`, {
    status: 'CheckedOut'
  });
  assert.strictEqual(checkOutResponse.status, 200);
  assert.strictEqual(checkOutResponse.data.status, 'CheckedOut');
};

const testAnalytics = async () => {
  logSection('Analytics');
  
  // Test visits analytics
  const visitsResponse = await client.get('/api/analytics/visits?period=daily&days=30');
  assert.strictEqual(visitsResponse.status, 200);
  assert.ok(Array.isArray(visitsResponse.data));
  
  // Test department analytics
  const deptResponse = await client.get('/api/analytics/departments?period=month');
  assert.strictEqual(deptResponse.status, 200);
  assert.ok(Array.isArray(deptResponse.data));
};

const testDashboard = async () => {
  logSection('Dashboard Data');
  
  // Test dashboard summary
  const summaryResponse = await client.get('/api/dashboard/summary');
  assert.strictEqual(summaryResponse.status, 200);
  assert.ok(summaryResponse.data.totalVisits !== undefined);
  
  // Test recent visits
  const recentResponse = await client.get('/api/dashboard/recent-visits');
  assert.strictEqual(recentResponse.status, 200);
  assert.ok(Array.isArray(recentResponse.data));
};

const cleanupTestData = async () => {
  logSection('Cleanup');
  
  // Delete visit
  if (STATE.visitId) {
    await client.delete(`/api/visits/${STATE.visitId}`);
    log('Deleted test visit');
  }
  
  // Delete visitor
  if (STATE.visitorId) {
    await client.delete(`/api/visitors/${STATE.visitorId}`);
    log('Deleted test visitor');
  }
  
  // Delete host
  if (STATE.hostId) {
    await client.delete(`/api/admin/hosts/${STATE.hostId}`);
    log('Deleted test host');
  }
  
  // Delete department
  if (STATE.departmentId) {
    await client.delete(`/api/admin/departments/${STATE.departmentId}`);
    log('Deleted test department');
  }
};

// Run all tests sequentially
const runAllTests = async () => {
  console.log(`\nTesting Visitor Management System at ${BASE_URL}`);
  console.log('Starting End-to-End Tests...\n');
  
  let allPassed = true;
  
  try {
    // Core functionality tests
    allPassed &= await runTest('Authentication', testAuthentication);
    allPassed &= await runTest('Department Management', testDepartmentManagement);
    allPassed &= await runTest('Host Management', testHostManagement);
    allPassed &= await runTest('Visitor Management', testVisitorManagement);
    allPassed &= await runTest('Visit Management', testVisitManagement);
    allPassed &= await runTest('Analytics', testAnalytics);
    allPassed &= await runTest('Dashboard Data', testDashboard);
    
    // Clean up test data
    await cleanupTestData();
    
    // Final report
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! The system is working correctly.');
    } else {
      console.log('⚠️ SOME TESTS FAILED! Please check the logs above.');
    }
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  }
};

// Execute tests
runAllTests();