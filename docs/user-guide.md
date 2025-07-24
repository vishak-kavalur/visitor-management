# Visitor Management System - User Guide

This guide provides instructions for using the Visitor Management System based on your role within the organization.

## Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [SuperAdmin Guide](#superadmin-guide)
4. [Admin Guide](#admin-guide)
5. [Host Guide](#host-guide)
6. [Common Tasks](#common-tasks)
7. [Troubleshooting](#troubleshooting)

## System Overview

The Visitor Management System (VMS) is designed to streamline the process of managing visitors within your organization. Key features include:

- Visitor registration and tracking
- Visit request and approval workflow
- Department and host management
- Real-time dashboard with analytics
- Role-based access control
- Real-time notifications via Socket.IO

The system runs on the following components:
- Main web application: Port 4000
- Socket.IO real-time server: Port 4001
- MongoDB database: Local instance on port 27017

The system has three main user roles, each with different permissions:

1. **SuperAdmin**: Full system access including department management
2. **Admin**: Can manage hosts, visitors, and visits but not departments
3. **Host**: Limited to managing visitors and their own visits

## Getting Started

### Logging In

1. Navigate to the login page at `http://localhost:4000/login`
2. Enter your email address and password
3. Click "Sign In"
4. If you've forgotten your password, contact your system administrator

**Note**: The system uses token-based authentication without cookies. Your authentication token is stored securely and automatically managed by the application.

### Dashboard Overview

After logging in, you'll be directed to the main dashboard, which provides:

- Summary statistics
- Real-time visit information
- Pending approvals (if applicable to your role)
- Navigation to different system sections

The sidebar navigation shows options available to your role.

### Real-time Updates

The system now features real-time updates for:
- New visitor registrations
- Visit status changes
- Approval notifications
- Check-in and check-out events

These updates appear automatically without needing to refresh the page.

## SuperAdmin Guide

As a SuperAdmin, you have full access to all system functionality.

### Managing Departments

#### Viewing Departments
1. Navigate to "Departments" in the sidebar
2. View the list of all departments
3. Use search and filter options to find specific departments

#### Creating a Department
1. Click the "Add" button on the Departments page
2. Fill in the required information:
   - Department Name (required)
   - Description (optional)
   - Floor (optional)
   - Building (optional)
3. Click "Save" to create the department

#### Editing a Department
1. Locate the department in the list
2. Click the "Edit" icon in the Actions column
3. Modify the department details
4. Click "Save" to update the department

#### Deleting a Department
1. Locate the department in the list
2. Click the "Delete" icon in the Actions column
3. Confirm the deletion
   - Note: Departments with associated hosts or visits cannot be deleted

### Managing Hosts

#### Viewing Hosts
1. Navigate to "Hosts" in the sidebar
2. View the list of all hosts
3. Use search and filter options to find specific hosts

#### Creating a Host
1. Click the "Add" button on the Hosts page
2. Fill in the required information:
   - Email (required)
   - Password (required)
   - Full Name (required)
   - Department (required)
   - Role (required)
3. Click "Save" to create the host

#### Editing a Host
1. Locate the host in the list
2. Click the "Edit" icon in the Actions column
3. Modify the host details
4. Click "Save" to update the host

#### Deleting a Host
1. Locate the host in the list
2. Click the "Delete" icon in the Actions column
3. Confirm the deletion
   - Note: Hosts with associated visits cannot be deleted

### System Analytics

1. Navigate to "Analytics" in the sidebar
2. View various charts and statistics:
   - Visit trends over time
   - Department visit distribution
   - Visit status breakdown
   - Completion rates

### Approving Visits

1. Navigate to "Dashboard" or "Visits" in the sidebar
2. Locate pending visits in the list
3. Click the "Approve" or "Reject" button for each visit
4. For approved visits, the visitor and host will receive real-time notifications

## Admin Guide

As an Admin, you can manage hosts, visitors, and visits, but not departments.

### Managing Hosts

Follow the same steps as in the SuperAdmin guide, with these limitations:
- You can only assign hosts to departments you have access to
- You cannot assign the "SuperAdmin" role to any host

### Managing Visits

#### Viewing All Visits
1. Navigate to "Visits" in the sidebar
2. View the list of all visits
3. Use search and filter options to find specific visits

#### Approving or Rejecting Visits
1. Locate pending visits in the list
2. Click the "Approve" or "Reject" button for each visit
3. For approved visits, the visitor and host will receive real-time notifications

#### Check-In and Check-Out
1. When a visitor arrives, locate their approved visit
2. Click the "Check In" button to record their arrival
3. When they leave, click the "Check Out" button
4. These status changes are updated in real-time across all connected devices

### Managing Visitors

#### Viewing Visitors
1. Navigate to "Visitors" in the sidebar
2. View the list of all visitors
3. Use search and filter options to find specific visitors

#### Creating a Visitor
1. Click the "Add" button on the Visitors page
2. Fill in the required information:
   - Aadhaar Number (required)
   - Full Name (required)
   - Upload photo (required)
3. Click "Save" to create the visitor

#### Editing a Visitor
1. Locate the visitor in the list
2. Click the "Edit" icon in the Actions column
3. Modify the visitor details
4. Click "Save" to update the visitor

## Host Guide

As a Host, you can manage visitors and your own visits.

### Managing Your Visitors

#### Viewing Visitors
1. Navigate to "Visitors" in the sidebar
2. View the list of visitors
3. Use search and filter options to find specific visitors

#### Creating a Visit Request
1. Navigate to "Visits" in the sidebar
2. Click the "Add" button
3. Fill in the required information:
   - Select or create a visitor
   - Purpose of visit (required)
   - Additional notes (optional)
4. Click "Submit" to create the visit request
5. The request will be sent for approval
6. You'll receive a real-time notification when the request is approved or rejected

#### Tracking Your Visits
1. Navigate to "Visits" in the sidebar
2. View the list of your visits
3. Check the status of each visit (Pending, Approved, Rejected, CheckedIn, CheckedOut)
4. Status changes are updated in real-time

### Notifications

1. The system now provides real-time notifications for important events
2. Notifications appear in the notification bell in the top navigation bar
3. You'll receive notifications for:
   - Visit request approvals or rejections
   - Visitor check-ins and check-outs
   - New visit requests (for admins)
   - System announcements

## Common Tasks

### Searching for Information

1. Use the search box at the top of each data table
2. Enter keywords related to what you're looking for
3. The table will filter to show matching results

### Filtering and Sorting

1. Click the filter icon in any column header to filter by that column
2. Click on a column header to sort by that column
3. Click again to toggle between ascending and descending order

### Exporting Data

1. On any data table, look for the "Export" option
2. Select your preferred format (CSV, PDF, etc.)
3. The file will be downloaded to your device

### Changing Your Password

1. Click on your profile name in the top-right corner
2. Select "Account Settings"
3. Enter your current password and new password
4. Click "Save Changes"

## Troubleshooting

### Common Issues

#### Login Problems
- Ensure you're using the correct email and password
- Check if Caps Lock is enabled
- If you've forgotten your password, contact your system administrator
- Clear browser cache and cookies if you experience persistent login issues

#### Missing Access
- If you can't access a feature you believe you should have access to, check with your administrator about your assigned role

#### Slow Performance
- Try refreshing the page
- Check your internet connection
- Clear your browser cache

#### Real-time Updates Not Working
- Ensure your browser supports WebSockets
- Check if a firewall is blocking port 4001
- Try refreshing the page to reestablish the connection
- Verify that both application servers (port 4000 and 4001) are running

### Getting Help

If you encounter any issues not covered in this guide:

1. Check the FAQ section (if available)
2. Contact your system administrator
3. Submit a support ticket through the system

### System Requirements

The Visitor Management System works best with:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- WebSockets enabled
- Stable internet connection

### Network Requirements

The system requires the following network access:
- Web application: Port 4000
- Socket.IO server: Port 4001
- MongoDB database: Port 27017 (server-side only)