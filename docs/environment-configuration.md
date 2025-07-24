# Environment Configuration Guide

This document explains the environment configuration for the Visitor Management System. The system uses different environment files for different deployment scenarios.

## Available Environment Files

- `.env.local`: Used for local development
- `.env.production`: Used for production deployment
- `.env.example`: Example template with all required variables

## Environment Variables

### MongoDB Configuration

```
MONGODB_URI=mongodb://localhost:27017/visitormanagement
MONGODB_DB=visitormanagement
```

- `MONGODB_URI`: Connection string for MongoDB
- `MONGODB_DB`: Database name

### Web Server Configuration

```
PORT=4000
NEXT_PUBLIC_BASE_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_SECRET=your_nextauth_secret_key_here
```

- `PORT`: The port on which the web server runs (4000)
- `NEXT_PUBLIC_BASE_URL`: Public URL for the web application
- `NEXTAUTH_URL`: URL for NextAuth authentication
- `NEXTAUTH_SECRET`: Secret key for NextAuth

### Socket.IO Configuration

```
SOCKET_PORT=4001
SOCKET_SERVER_URL=http://localhost:4001
NEXT_PUBLIC_SOCKET_URL=http://localhost:4001
```

- `SOCKET_PORT`: The port on which the Socket.IO server runs (4001)
- `SOCKET_SERVER_URL`: URL for the Socket.IO server (server-side)
- `NEXT_PUBLIC_SOCKET_URL`: URL for the Socket.IO server (client-side)

### Authentication Configuration

```
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=1d
```

- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRY`: Expiration time for JWT tokens

### Remote Server Configuration

```
REMOTE_SERVER_URL=http://3.111.198.202
```

- `REMOTE_SERVER_URL`: URL for the remote server

### API Configuration

```
API_AUTH_DISABLED=true
WEB_AUTH_ENABLED=true
```

- `API_AUTH_DISABLED`: When true, API endpoints don't require authentication
- `WEB_AUTH_ENABLED`: When true, web pages require authentication

## Setting Up for Different Environments

### Local Development

For local development, copy `.env.example` to `.env.local` and update the values as needed:

```bash
cp .env.example .env.local
```

### Production Deployment

For production deployment, copy `.env.example` to `.env.production` and update the values with production settings:

```bash
cp .env.example .env.production
```

Make sure to set secure values for all secret keys in production.

## Environment Variables in Code

Environment variables are available in the code through:

1. Server-side: `process.env.VARIABLE_NAME`
2. Client-side: Only variables prefixed with `NEXT_PUBLIC_` are available on the client side.

Additionally, some variables are exposed through `next.config.ts` in the `env` object.

## Security Considerations

- Never commit secret keys to version control (except for this specific implementation where we're using "biometrki")
- In typical applications, use different secret keys for development and production
- Regularly rotate secret keys in production environments
- Use strong, randomly generated values for secret keys in production environments

## Note on NEXTAUTH_SECRET

For this specific implementation, we're using "biometrki" as the NEXTAUTH_SECRET value across all environments. This is specified for this project, though in a typical production application, you would use different, securely generated keys for different environments.

## Running the Application Without Authentication

The system can be configured to run without any JWT authentication for both API endpoints and web pages. This is controlled by the following environment variables:

```
# API Configuration
API_AUTH_DISABLED=true    # Makes API endpoints accessible without auth (default is true)
WEB_AUTH_ENABLED=false    # Disables authentication for web pages when set to false (default is true)
```

To run the entire application without any authentication:

1. Set `API_AUTH_DISABLED=true` to disable API authentication
2. Set `WEB_AUTH_ENABLED=false` to disable web page authentication

When `WEB_AUTH_ENABLED` is set to false:
- No JWT tokens are required to access any part of the application
- The login page will still be accessible but not required
- All dashboard pages and features will be available without authentication
- Role-based permissions will not be enforced

This configuration is useful for:
- Development and testing environments
- Demo installations
- Situations where authentication is handled by an external system