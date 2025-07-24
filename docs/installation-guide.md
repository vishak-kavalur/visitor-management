# Visitor Management System - Installation Guide

This document provides comprehensive instructions for installing and configuring the Visitor Management System (VMS) in both local and remote environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Installation](#local-installation)
3. [Remote Installation](#remote-installation)
4. [Configuration](#configuration)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before installing the Visitor Management System, ensure your environment meets the following requirements:

- Node.js 18.x or later
- MongoDB 7.0 or later
- npm 9.x or later
- Git (for cloning the repository)

## Local Installation

Follow these steps to install the Visitor Management System locally:

### 1. Clone the Repository

```bash
git clone <repository-url>
cd visitor-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with the following content:

```
# Server Configuration
NODE_ENV=development
NEXT_PUBLIC_SERVER_URL=http://localhost:4000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/visitor-management

# Authentication
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_SECRET=your-nextauth-secret-key
JWT_SECRET=your-jwt-secret-key

# Remote Server (for Socket.IO)
REMOTE_SERVER_URL=http://3.111.198.202
```

Replace the secret keys with secure random strings.

### 4. Set Up MongoDB

Start MongoDB locally:

```bash
# Using systemd (Linux)
sudo systemctl start mongod

# Using brew (macOS)
brew services start mongodb-community

# Using MongoDB directly
mongod --dbpath=/path/to/your/data/directory
```

### 5. Run Database Initialization (Optional)

If you need to populate the database with initial data:

```bash
npm run seed
```

### 6. Start the Application

```bash
npm run build
npm start
```

The application will now be running at:
- Web application: http://localhost:4000
- Socket.IO server: http://localhost:4001

## Remote Installation

Follow these steps to install the Visitor Management System on a remote server:

### 1. SSH into Your Server

```bash
ssh user@your-server-ip
```

### 2. Clone the Repository

```bash
git clone <repository-url>
cd visitor-management-system
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root with the following content:

```
# Server Configuration
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=http://your-server-ip:4000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/visitor-management

# Authentication
NEXTAUTH_URL=http://your-server-ip:4000
NEXTAUTH_SECRET=your-nextauth-secret-key
JWT_SECRET=your-jwt-secret-key

# Remote Server (for Socket.IO)
REMOTE_SERVER_URL=http://3.111.198.202
```

Replace `your-server-ip` with your actual server IP address or domain name, and the secret keys with secure random strings.

### 5. Set Up MongoDB

Install MongoDB if not already installed:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
```

### 6. Build and Start the Application

```bash
npm run build
npm start
```

### 7. Configure a Process Manager (Recommended)

To keep the application running after SSH disconnection, use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start the application with PM2
pm2 start npm --name "vms" -- start

# Ensure PM2 starts on system boot
pm2 startup
pm2 save
```

## Configuration

### Environment Variables

The Visitor Management System can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (development/production) | development |
| `NEXT_PUBLIC_SERVER_URL` | URL where the server is accessible | http://localhost:4000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/visitor-management |
| `NEXTAUTH_URL` | URL for NextAuth.js authentication | http://localhost:4000 |
| `NEXTAUTH_SECRET` | Secret key for NextAuth.js | - |
| `JWT_SECRET` | Secret key for JWT token generation | - |
| `REMOTE_SERVER_URL` | URL of the remote server for Socket.IO | http://3.111.198.202 |

### Port Configuration

The Visitor Management System runs on two ports:

- **Port 4000**: Main web application
- **Port 4001**: Socket.IO real-time communication server

Ensure both ports are available and not blocked by firewalls.

## Database Setup

### MongoDB Configuration

The application is configured to use a local MongoDB instance on port 27017. If you need to use a different MongoDB configuration:

1. Update the `MONGODB_URI` in your `.env.local` file
2. Ensure the MongoDB instance is accessible from the application server

### Database Initialization

For a fresh installation, you may want to initialize the database with default data:

```bash
npm run seed
```

This will create:
- A default SuperAdmin user
- Basic department structure
- Essential system settings

### Data Backup and Restore

To backup your MongoDB data:

```bash
mongodump --db visitor-management --out ./backup
```

To restore from backup:

```bash
mongorestore --db visitor-management ./backup/visitor-management
```

## Troubleshooting

### Common Installation Issues

#### Port Already in Use

If you encounter an error that port 4000 or 4001 is already in use:

```bash
# Find the process using the port
lsof -i :4000
# OR
netstat -tuln | grep 4000

# Kill the process
kill -9 <PID>
```

#### MongoDB Connection Issues

If the application fails to connect to MongoDB:

1. Verify MongoDB is running: `systemctl status mongodb` or `brew services list`
2. Check your MongoDB connection string in `.env.local`
3. Ensure MongoDB is listening on the expected port: `netstat -tuln | grep 27017`
4. Check MongoDB logs: `/var/log/mongodb/mongodb.log`

#### Build Failures

If you encounter issues during the build process:

1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Ensure you're using a compatible Node.js version: `node -v`