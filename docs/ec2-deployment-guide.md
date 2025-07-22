# Visitor Management System - EC2 Deployment Guide

This guide provides instructions for deploying the Visitor Management System on an Amazon EC2 instance with existing applications running on ports 3000, 3001, 3003, and a MongoDB server on port 27017.

## Deployment Strategy

Since there are port conflicts with existing applications, we'll modify our deployment approach:

1. Use alternative ports for our application services
2. Configure Nginx as a reverse proxy with path-based routing
3. Either connect to the existing MongoDB instance or run a separate MongoDB container

## Prerequisites

- Amazon EC2 instance with Docker and Docker Compose installed
- Existing applications running on ports 3000, 3001, and 3003
- Existing MongoDB server running on port 27017
- Domain or subdomain for the Visitor Management System
- SSL certificate for secure HTTPS connections

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/vishak-kavalur/visitor-management.git
cd visitor-management-system
```

### 2. Modify Docker Compose Configuration

Create a modified `docker-compose.ec2.yml` file with alternative ports:

```bash
cp docker-compose.yml docker-compose.ec2.yml
```

Edit the file to use available ports. Create `docker-compose.ec2.yml` with the following content:

```yaml
version: '3.8'

services:
  # Next.js application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: vms-app
    restart: unless-stopped
    ports:
      - "3002:3000"  # Map to port 3002 externally
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI:-mongodb://mongodb:27017/visitor_management}
      - NEXTAUTH_URL=https://your-domain.com/vms
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - SOCKET_SERVER_URL=https://your-domain.com/vms-socket
    depends_on:
      - mongodb
    networks:
      - vms-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s

  # Socket.io server for real-time notifications
  socket-server:
    build:
      context: ./socket-server
      dockerfile: Dockerfile
    container_name: vms-socket
    restart: unless-stopped
    ports:
      - "3004:3001"  # Map to port 3004 externally
    environment:
      - MONGODB_URI=${MONGODB_URI:-mongodb://mongodb:27017/visitor_management}
    networks:
      - vms-network
    depends_on:
      - mongodb

  # MongoDB database (Option 1: Run own MongoDB container)
  mongodb:
    image: mongo:7.0
    container_name: vms-mongodb
    restart: unless-stopped
    ports:
      - "27018:27017"  # Map to port 27018 externally
    volumes:
      - mongodb-data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    environment:
      - MONGO_INITDB_DATABASE=visitor_management
    networks:
      - vms-network
    command: ["--wiredTigerCacheSizeGB", "1"]
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/visitor_management --quiet
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 40s

  # Nginx for reverse proxy and SSL termination
  nginx:
    image: nginx:alpine
    container_name: vms-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
      - socket-server
    networks:
      - vms-network

networks:
  vms-network:
    driver: bridge

volumes:
  mongodb-data:
    driver: local
```

### 3. Configure Environment Variables

Create a `.env` file with the appropriate settings:

```bash
cp .env.production.example .env
```

Edit the `.env` file and update these values:

```
# Use this for a separate MongoDB container
MONGODB_URI=mongodb://mongodb:27017/visitor_management

# OR use this to connect to the existing MongoDB (replace with actual credentials)
# MONGODB_URI=mongodb://username:password@host:27017/visitor_management

NEXTAUTH_URL=https://your-domain.com/vms
NEXTAUTH_SECRET=your-strong-secret-key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-admin-password
```

### 4. Update Nginx Configuration

Create a custom Nginx configuration for path-based routing:

```bash
mkdir -p nginx/conf
```

Create a file `nginx/conf/default.conf` with:

```nginx
# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Path-based routing for Visitor Management System
    location /vms/ {
        proxy_pass http://app:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.io server
    location /vms-socket/ {
        proxy_pass http://socket-server:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files caching
    location ~* ^/vms/.*\.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://app:3000;
        proxy_cache_valid 200 7d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 5. Modify Next.js Config for Subpath

Update `next.config.ts` to add the subpath:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/vms',
  assetPrefix: '/vms',
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  env: {
    SOCKET_SERVER_URL: process.env.SOCKET_SERVER_URL || 'https://your-domain.com/vms-socket',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};
```

### 6. Options for MongoDB

#### Option 1: Use a Separate MongoDB Container (as configured above)
- Uses port 27018 for external access
- Creates an isolated database for the Visitor Management System
- Independent from existing MongoDB instance

#### Option 2: Use the Existing MongoDB Server
- Remove the MongoDB service from the docker-compose file
- Set the `MONGODB_URI` environment variable to connect to your existing MongoDB:
  ```
  MONGODB_URI=mongodb://username:password@host:27017/visitor_management_db
  ```
- You'll need to manually initialize your database and create a dedicated database for the VMS

### 7. Deploy the Application

```bash
# Build and start the containers using the EC2-specific config
docker-compose -f docker-compose.ec2.yml up -d
```

### 8. Initialize the System

The system will automatically create a default admin user based on the environment variables provided.

### 9. Access the Application

Access the Visitor Management System at:
- https://your-domain.com/vms

## Security Considerations for EC2

1. Configure AWS Security Groups to allow only necessary traffic:
   - HTTP (80) and HTTPS (443) for web access
   - SSH (22) for server management
   - Restrict MongoDB port (27018) access if exposed

2. Set up an Elastic IP address for your EC2 instance

3. Consider using AWS Certificate Manager for SSL certificates

4. Configure automated backups for MongoDB data

5. Set up CloudWatch monitoring for your EC2 instance

## Troubleshooting EC2 Deployment

1. Check container logs:
   ```
   docker-compose -f docker-compose.ec2.yml logs app
   docker-compose -f docker-compose.ec2.yml logs nginx
   ```

2. Verify port availability:
   ```
   sudo netstat -tulpn | grep LISTEN
   ```

3. Test internal container networking:
   ```
   docker exec vms-app wget -q -O- http://mongodb:27017
   ```

4. Check nginx configuration:
   ```
   docker exec vms-nginx nginx -t
   ```

5. For MongoDB connection issues, verify connectivity:
   ```
   # For own MongoDB container
   docker exec vms-app wget -q -O- http://mongodb:27017
   
   # For existing MongoDB
   docker exec vms-app wget -q -O- http://your-existing-mongodb:27017
