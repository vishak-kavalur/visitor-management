# Visitor Management System - Testing Procedure

This document outlines the comprehensive testing procedures for the Visitor Management System to ensure its functionality, security, performance, and reliability.

## 1. Types of Testing

### 1.1 Functional Testing
- Verify all user flows work as expected
- Test all CRUD operations
- Validate form inputs and error handling
- Test integration between components

### 1.2 Authentication Testing
- Test login/logout functionality
- Verify role-based access control
- Test token-based authentication (JWT) without cookies
- Validate permission boundaries

### 1.3 API Testing
- Validate all API endpoints (which no longer require authentication)
- Check error handling and status codes
- Test request payload validation
- Verify response formats

### 1.4 UI/UX Testing
- Test responsive design
- Cross-browser compatibility
- Accessibility testing
- Visual consistency

### 1.5 Performance Testing
- Load testing for concurrent users
- Response time measurements
- Database query optimization
- Resource utilization

### 1.6 Security Testing
- Input validation and sanitization
- Authentication and authorization
- Data encryption
- Protection against common vulnerabilities (XSS, CSRF, etc.)

### 1.7 Integration Testing
- Test interaction between system components
- Test Socket.IO real-time communication
- Database connection and operations

## 2. Test Environment Setup

### 2.1 Local Development Environment
- Node.js 18.x or later
- MongoDB 7.0 or later (running locally on port 27017)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 2.2 Testing Environment
- Dedicated testing database
- Mock data generation scripts
- Environment variables configuration
- Network conditions similar to production

### 2.3 CI/CD Pipeline
- Automated testing in GitHub Actions
- Test execution on pull requests
- Report generation and notification

## 3. Manual Testing Procedures

### 3.1 User Registration and Authentication
1. Test user registration with valid data
2. Test login with valid credentials
3. Test login with invalid credentials
4. Test token-based authentication flow
5. Test account lockout after multiple failed attempts
6. Test token expiration and renewal

### 3.2 Visitor Management
1. Test visitor registration with valid data
2. Test visitor check-in process
3. Test visitor check-out process
4. Test visitor history viewing
5. Test visitor search functionality
6. Test visitor approval workflow

### 3.3 Host Management
1. Test host account creation
2. Test host profile management
3. Test host department assignment
4. Test host visitor approval process
5. Test host notification system

### 3.4 Department Management
1. Test department creation
2. Test department update
3. Test department deletion
4. Test assigning hosts to departments
5. Test department-based statistics

### 3.5 Admin Dashboard
1. Test dashboard data accuracy
2. Test analytics charts and reports
3. Test system configuration options
4. Test user management capabilities
5. Test audit log functionality

### 3.6 Real-time Communication
1. Test Socket.IO server connection on port 4001
2. Test real-time notifications for visit status changes
3. Test room-based event subscription
4. Test event broadcasting to relevant clients
5. Test connection resilience (reconnection, error handling)

### 3.7 Cross-Browser Testing
Test the application on:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Safari (latest)
- Microsoft Edge (latest)
- Mobile browsers (Chrome for Android, Safari for iOS)

## 4. Automated Testing Procedures

### 4.1 Unit Testing
- Run unit tests for all components
- Verify code coverage (aim for >80%)
- Run tests in isolation to catch component-level issues

### 4.2 Integration Testing
- Test interactions between components
- Verify data flow between modules
- Test database operations
- Test Socket.IO event handling

### 4.3 End-to-End Testing
Execute the end-to-end testing script:
```bash
cd scripts
npm install
npm run test:e2e
```

This script tests:
- Authentication flow
- Department management
- Host management
- Visitor management
- Visit lifecycle
- Analytics data
- Dashboard functionality
- Real-time communication

### 4.4 API Testing
Test all API endpoints for:
- Correct status codes
- Proper response structure
- Error handling
- Proper data access without authentication
- Rate limiting behavior

### 4.5 Socket.IO Testing
Test the Socket.IO server functionality:
```bash
npm run test:socket
```

This script tests:
- Connection and disconnection handling
- Event emission and reception
- Room-based subscriptions
- Error handling
- Connection resilience

### 4.6 Deployment Testing
Execute the deployment testing script:
```bash
./scripts/test-deployment.sh [base_url] [admin_email] [admin_password]
```

This script validates:
- Application health on port 4000
- Socket.IO server health on port 4001
- Database connectivity
- Authentication
- Core API functionality
- Static asset delivery

## 5. Regression Testing

Perform regression testing when:
- New features are added
- Bugs are fixed
- Dependencies are updated
- Configuration changes are made

Regression test checklist:
1. Run all automated tests
2. Manually test core user flows
3. Verify fixed bugs don't reappear
4. Check for unintended side effects
5. Test real-time functionality

## 6. Performance Testing

### 6.1 Load Testing
- Simulate concurrent users (start with 50, increase to 200)
- Measure response times under load
- Identify bottlenecks
- Test database query performance
- Test Socket.IO server performance under load

### 6.2 Stress Testing
- Push the system beyond normal operation
- Test recovery from overload
- Verify error handling under stress
- Monitor resource utilization

### 6.3 Endurance Testing
- Run the system for extended periods (24+ hours)
- Monitor for memory leaks
- Check database connection stability
- Verify scheduled tasks execute properly
- Monitor Socket.IO server stability

## 7. Security Testing

### 7.1 Authentication Security
- Test token-based authentication
- Verify token validation and expiration
- Test proper token storage and transmission
- Check authorization based on token payload

### 7.2 Authorization Testing
- Verify role-based permissions
- Test access to protected resources
- Verify department-based restrictions
- Check for privilege escalation possibilities

### 7.3 Input Validation
- Test for SQL injection
- Test for XSS vulnerabilities
- Test for CSRF protection
- Verify input sanitization

### 7.4 Data Protection
- Verify sensitive data encryption
- Test secure transmission (HTTPS)
- Verify proper error handling (no sensitive info in errors)
- Test backup and restore procedures

## 8. Acceptance Criteria

The testing is considered successful when:

1. All automated tests pass with no failures
2. Manual test procedures complete without critical issues
3. Performance meets the following criteria:
   - Page load time < 2 seconds
   - API response time < 500ms
   - Socket.IO event latency < 200ms
   - System handles 100+ concurrent users
   - No memory leaks detected
4. Security testing reveals no critical or high vulnerabilities
5. The application works correctly on all supported browsers
6. The system can run stably for at least 48 hours
7. All deployment procedures work as expected

## 9. Bug Reporting Procedure

When issues are found during testing:

1. Document the issue with clear steps to reproduce
2. Include environment details (browser, OS, etc.)
3. Add screenshots or video if applicable
4. Classify the severity:
   - **Critical**: System unusable, data loss, security breach
   - **High**: Major feature broken, significant impact on users
   - **Medium**: Feature partially broken, workaround exists
   - **Low**: Minor issue, cosmetic problems, rare edge cases
5. Assign to the appropriate team member
6. Track resolution in the issue tracking system

## 10. Test Documentation

Maintain the following test documentation:
- Test plans and procedures (this document)
- Test case specifications
- Test logs and results
- Bug reports and resolution status
- Test coverage reports
- Performance test results

Update this documentation as the system evolves to ensure testing procedures remain current and effective.

## 11. Port Testing

The application now runs on specific ports that need to be verified:

1. Test web application on port 4000
   - Verify application starts successfully on this port
   - Check all routes and API endpoints are accessible
   - Ensure environment variables are correctly configured for this port

2. Test Socket.IO server on port 4001
   - Verify Socket.IO server starts successfully
   - Test client connections to this port
   - Validate event transmission and reception
   - Test room-based event subscription

3. Test MongoDB connection on port 27017
   - Verify application connects to local MongoDB instance
   - Test database operations (create, read, update, delete)
   - Check connection resilience (reconnection on failure)