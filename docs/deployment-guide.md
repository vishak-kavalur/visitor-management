# Visitor Management System - Deployment Guide

This guide provides step-by-step instructions for deploying the Visitor Management System (VMS) in production environments using Docker containers.

## Prerequisites

- Docker and Docker Compose installed on the host machine
- Git installed for cloning the repository
- Basic knowledge of Docker, Nginx, and SSL certificates
- A domain name pointing to your server (for production deployments)

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/visitor-management-system.git
cd visitor-management-system
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory based on the example provided:

```bash
cp .env.production.example .env
```

Edit the `.env` file and update the following variables:

- `NEXTAUTH_URL`: Set to your production domain (e.g., https://vms.example.com)
- `NEXTAUTH_SECRET`: Generate a secure random string
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Set credentials for the initial admin user
- Update email configuration if you plan to use email notifications

### 3. SSL Certificates

For production deployment with HTTPS:

1. Create an `nginx/ssl` directory:

```bash
mkdir -p nginx/ssl
```

2. Add your SSL certificates to this directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key

For development or testing, you can generate self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem
```

### 4. Customize Nginx Configuration (Optional)

The default Nginx configuration (`nginx/conf/default.conf`) is already set up for most deployments. You may need to customize it for your specific requirements:

- Update `server_name` with your actual domain name
- Adjust SSL settings if needed
- Modify caching policies for static assets

### 5. Build and Start the Containers

```bash
docker-compose up -d
```

This command will:
- Build the application container
- Start all services defined in `docker-compose.yml`
- Set up the MongoDB database with initial data
- Configure Nginx as a reverse proxy

### 6. Verify the Deployment

1. Check if all containers are running:

```bash
docker-compose ps
```

2. View container logs if needed:

```bash
docker-compose logs -f
```

3. Access the application at your domain or http://localhost (if deployed locally)

### 7. First-time Setup

1. Log in with the default admin credentials defined in your `.env` file:
   - Email: Your configured `ADMIN_EMAIL`
   - Password: Your configured `ADMIN_PASSWORD`

2. Complete the initial setup:
   - Create additional departments
   - Add host users
   - Configure system settings

## Updating the Application

To update the application to a newer version:

1. Pull the latest code:

```bash
git pull origin main
```

2. Rebuild and restart the containers:

```bash
docker-compose down
docker-compose up -d --build
```

## Backup and Restore

### Database Backup

```bash
docker exec vms-mongodb mongodump --archive=/backup/vms-backup-$(date +%Y%m%d).gz --gzip --db visitor_management
docker cp vms-mongodb:/backup/vms-backup-$(date +%Y%m%d).gz ./backups/
```

### Database Restore

```bash
docker cp ./backups/vms-backup-YYYYMMDD.gz vms-mongodb:/backup/
docker exec vms-mongodb mongorestore --archive=/backup/vms-backup-YYYYMMDD.gz --gzip
```

## Monitoring and Maintenance

- Health Check Endpoint: The application provides a health check endpoint at `/api/health`
- Container Healthchecks: All containers are configured with health checks in the docker-compose.yml
- Logs: Application logs are available via `docker-compose logs app`

## Troubleshooting

### Common Issues

1. **Database Connection Failures**
   - Check if the MongoDB container is running
   - Verify the `MONGODB_URI` environment variable is correct
   - Check MongoDB logs for authentication issues

2. **Nginx Proxy Issues**
   - Verify the Nginx configuration
   - Check Nginx logs: `docker-compose logs nginx`
   - Ensure SSL certificates are properly configured

3. **Application Startup Failures**
   - Check application logs: `docker-compose logs app`
   - Verify all required environment variables are set
   - Check for build errors in the container

## Security Considerations

- Regularly update all containers to the latest versions
- Implement proper network security rules to limit access to the application
- Use strong passwords for admin accounts and MongoDB
- Rotate the `NEXTAUTH_SECRET` periodically
- Enable proper firewall rules on the host machine

## Performance Optimization

- Consider setting up MongoDB replication for larger deployments
- Adjust the Node.js memory limits based on server capacity
- Implement a caching layer for frequently accessed data
- Use a CDN for static assets in large-scale deployments