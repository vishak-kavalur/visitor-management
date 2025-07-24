# Visitor Management System - Data Seeding Scripts

This directory contains scripts to populate the Visitor Management System database with sample data for testing and demonstration purposes.

## Available Scripts

- `seed-data.js` - Creates departments, hosts, and visitors
- `seed-visits.js` - Creates visits connecting the entities created by seed-data.js

## Requirements

Before running these scripts, ensure you have the following:

1. Node.js 18.x or later installed
2. MongoDB 7.0 or later running on localhost:27017
3. Required npm packages installed:
   ```
   npm install mongodb bcryptjs uuid
   ```

## Usage Instructions

### Step 1: Seed Base Data

First, run the seed-data.js script to create departments, hosts, and visitors:

```bash
node seed-data.js
```

This script will:
- Create 7 departments
- Create approximately 25-30 hosts (including one SuperAdmin, department admins, and regular hosts)
- Create 50 sample visitors with random names and Aadhaar numbers

Sample login credentials will be displayed in the console.

### Step 2: Seed Visits

After creating the base data, run the seed-visits.js script to create visit records:

```bash
node seed-visits.js
```

This script will:
- Create 200 sample visits (configurable in the script)
- Distribute visits across different statuses (Pending, Approved, Rejected, CheckedIn, CheckedOut)
- Connect visitors, hosts, and departments logically
- Generate realistic timestamps for submission, approval, check-in, and check-out

## Customization

You can modify the scripts to adjust:

- The number of entities created
- The distribution of statuses
- The date ranges for visits
- The sample data used for names, purposes, etc.

Simply edit the corresponding variables at the top of each script.

## Data Reset

By default, these scripts will delete existing data in the respective collections before inserting new data. If you want to preserve existing data, comment out the `deleteMany()` calls in the scripts.

## Troubleshooting

### MongoDB Connection Issues

If the scripts cannot connect to MongoDB:

1. Ensure MongoDB is running: `systemctl status mongodb` or `mongod --version`
2. Check that the MongoDB URI in the scripts is correct (`mongodb://localhost:27017/visitor-management`)
3. Verify there are no firewall issues blocking access to port 27017

### Dependencies Missing

If you encounter errors about missing modules:

```bash
npm install mongodb bcryptjs uuid
```

### Script Order

The scripts must be run in the correct order:
1. `seed-data.js` first
2. `seed-visits.js` second

Running them in the wrong order will result in errors because the visits script depends on the existence of departments, hosts, and visitors.