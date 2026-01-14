# Environment Configuration

<cite>
**Referenced Files in This Document**   
- [.env.example](file://.env.example)
- [next.config.mjs](file://next.config.mjs)
- [tsconfig.json](file://tsconfig.json)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [lib/security.ts](file://lib/security.ts)
- [lib/session-security.ts](file://lib/session-security.ts)
- [lib/zoom/client.ts](file://lib/zoom/client.ts)
- [lib/supabase/middleware.ts](file://lib/supabase/middleware.ts)
- [SECURITY.md](file://SECURITY.md)
- [README.md](file://README.md)
- [proxy.ts](file://proxy.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Environment Variables](#environment-variables)
3. [Supabase Configuration](#supabase-configuration)
4. [Zoom API Integration](#zoom-api-integration)
5. [Security Configuration](#security-configuration)
6. [Next.js Configuration](#nextjs-configuration)
7. [TypeScript Configuration](#typescript-configuration)
8. [Development, Staging, and Production Setup](#development-staging-and-production-setup)
9. [Common Configuration Issues and Solutions](#common-configuration-issues-and-solutions)
10. [Security Best Practices](#security-best-practices)

## Introduction

The School-Management-System is a comprehensive educational platform with role-based access for administrators, teachers, students, and parents. Proper environment configuration is critical for the system's security, performance, and functionality. This document provides detailed guidance on configuring the application's environment variables, security settings, and framework configurations.

The system relies on several key services: Supabase for database and authentication, Zoom for virtual meetings, and Next.js for the frontend framework. Each component requires specific configuration to ensure secure and reliable operation across different deployment environments.

This documentation covers all required environment variables as defined in the `.env.example` file, explains their purpose and impact on system behavior, and provides detailed setup instructions for development, staging, and production environments.

**Section sources**
- [.env.example](file://.env.example)
- [README.md](file://README.md)

## Environment Variables

The School-Management-System uses environment variables to configure application behavior, security settings, and integration with external services. These variables are defined in the `.env.example` file and should be copied to `.env.local` for local development or set in the deployment environment.

### Required Environment Variables

The following environment variables are essential for the application to function properly:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

These Supabase variables provide the connection details for the PostgreSQL database and authentication service. The `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the client-side for direct database access with Row Level Security (RLS) policies, while the `SUPABASE_SERVICE_ROLE_KEY` is used server-side to bypass RLS for administrative operations.

### Security Environment Variables

The system includes several security-related environment variables that must be properly configured:

```env
# QR Attendance Security
QR_SECRET=your-qr-secret-here

# IP Address Hashing Salt (for privacy-preserving abuse detection)
IP_HASH_SALT=your-ip-hash-salt-here

# Fingerprint Hashing Salt (for session security)
FINGERPRINT_SALT=your-fingerprint-salt-here
```

These secrets are used for cryptographic operations to enhance security. The `QR_SECRET` is used to generate secure QR codes for attendance tracking. The `IP_HASH_SALT` and `FINGERPRINT_SALT` are used to hash IP addresses and browser fingerprints respectively, protecting user privacy while enabling abuse detection.

### Zoom API Environment Variables

For Zoom integration, the following variables are required:

```env
# Zoom API - Server-to-Server OAuth (optional)
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# Zoom Meeting SDK (optional - for embedded meetings)
ZOOM_SDK_KEY=
ZOOM_SDK_SECRET=

# Zoom Webhook Secret (optional - for receiving meeting events)
ZOOM_WEBHOOK_SECRET=
```

These credentials enable the system to create and manage Zoom meetings programmatically. The Server-to-Server OAuth credentials are used for backend operations, while the SDK credentials allow embedding Zoom meetings directly in the application.

### Application Settings

Additional application settings include:

```env
# Analytics (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Environment
NODE_ENV=development

# Site URL (for CSRF validation in production)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

The `NODE_ENV` variable determines whether the application runs in development, staging, or production mode, affecting logging, error reporting, and optimization. The `NEXT_PUBLIC_SITE_URL` is used for CSRF protection in production environments.

**Section sources**
- [.env.example](file://.env.example)
- [lib/security.ts](file://lib/security.ts)
- [lib/session-security.ts](file://lib/session-security.ts)
- [lib/zoom/client.ts](file://lib/zoom/client.ts)

## Supabase Configuration

Supabase serves as the primary database and authentication provider for the School-Management-System. Proper configuration is essential for secure data access and user management.

### Connection Configuration

The application requires three Supabase-related environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: The base URL of your Supabase project, available in the Supabase dashboard under Project Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for client-side database access with RLS enforcement
- `SUPABASE_SERVICE_ROLE_KEY`: The service role key that bypasses RLS for server-side administrative operations

These variables are used by the Supabase client libraries to establish connections to the database. The client-side configuration is implemented in `lib/supabase/client.ts`:

```typescript
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

The server-side configuration in `lib/supabase/server.ts` includes additional functionality for creating an admin client that bypasses RLS:

```typescript
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }
  
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
```

### Row Level Security (RLS)

The system implements strict Row Level Security policies to ensure users can only access data they are authorized to view. These policies are defined in SQL migration files in the `supabase/migrations/` directory and enforced by Supabase.

The RLS policies are designed according to the principle of least privilege, where users have the minimum necessary permissions to perform their roles. Administrators have broader access, while teachers, students, and parents have access limited to their respective data.

### Authentication Flow

The authentication system uses Supabase Auth with additional security features:

- **Session Management**: The system implements custom session validation using browser fingerprinting to detect session hijacking attempts
- **Password Policies**: Users are required to change their password on first login (`must_change_password` flag)
- **Account Status**: Accounts can be deactivated using the `is_active` flag without deleting user data
- **MFA Enforcement**: Administrators are required to use multi-factor authentication when accessing admin routes

The authentication flow is protected by CSRF validation through origin checking, as implemented in the security utilities.

**Section sources**
- [.env.example](file://.env.example)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [SECURITY.md](file://SECURITY.md)

## Zoom API Integration

The School-Management-System integrates with Zoom to enable virtual meetings for classes, parent-teacher conferences, and other educational activities.

### Server-to-Server OAuth Configuration

The primary integration method uses Zoom's Server-to-Server OAuth, which requires three environment variables:

- `ZOOM_ACCOUNT_ID`: Your Zoom account ID, available in the Zoom Marketplace
- `ZOOM_CLIENT_ID`: Client ID from your Server-to-Server OAuth app
- `ZOOM_CLIENT_SECRET`: Client secret from your Server-to-Server OAuth app

These credentials are used by the Zoom client in `lib/zoom/client.ts` to obtain access tokens for API operations:

```typescript
async function getAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom API credentials. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET')
  }
  // ... token acquisition logic
}
```

### Meeting Management

The Zoom integration supports creating, updating, and managing meetings through the API. Key features include:

- **Meeting Creation**: The `createZoomMeeting` function creates scheduled meetings with configurable settings
- **Registration System**: Meetings can be configured with registration enabled, allowing participants to register and receive unique join URLs
- **Participant Tracking**: The system can retrieve attendance reports and participant lists for past meetings
- **Batch Registration**: Multiple participants can be registered for a meeting simultaneously

### Meeting SDK Configuration

For embedded meetings within the application, the system supports Zoom's Meeting SDK with:

- `ZOOM_SDK_KEY`: SDK key from your Meeting SDK app
- `ZOOM_SDK_SECRET`: SDK secret from your Meeting SDK app

These credentials are used to generate SDK signatures that authenticate users to join meetings directly within the application interface.

### Webhook Integration

The optional `ZOOM_WEBHOOK_SECRET` enables the system to receive real-time events from Zoom, such as meeting start/end notifications, participant join/leave events, and recording availability.

**Section sources**
- [.env.example](file://.env.example)
- [lib/zoom/client.ts](file://lib/zoom/client.ts)

## Security Configuration

The School-Management-System implements multiple layers of security to protect user data and prevent unauthorized access.

### Session Security

The system includes advanced session security features to prevent session hijacking and unauthorized access:

- **Fingerprint-Based Validation**: Each session is bound to a browser fingerprint that includes userAgent, language, timezone, screen resolution, and other non-PII characteristics
- **IP Address Hashing**: IP addresses are hashed with a salt for privacy-preserving audit logs and abuse detection
- **Session Binding**: A session binding token is stored in cookies and validated on each request
- **Single Session Enforcement**: Only one active session per user is allowed; logging in from a new device invalidates previous sessions

The session security configuration is defined in `lib/session-security.ts`:

```typescript
export const SESSION_CONFIG = {
  FINGERPRINT_STRICTNESS: 0.8,
  ALLOW_IP_CHANGE: true,
  LOG_EVENTS: true,
  SESSION_BINDING_COOKIE: 'sb-session-bind',
}
```

### CSRF Protection

The system implements CSRF protection through origin validation in API routes:

```typescript
export function validateOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  
  const allowedUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  
  if (allowedUrl) {
    try {
      const allowedHost = new URL(allowedUrl).host
      
      if (origin) {
        return new URL(origin).host === allowedHost
      }
      if (referer) {
        return new URL(referer).host === allowedHost
      }
    } catch {
      return false
    }
  }
  // ... fallback validation
}
```

### Input Validation

All user input is validated using Zod schemas to prevent injection attacks and ensure data integrity:

```typescript
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-Z0-9\s\.\-]+$/, "Name contains invalid characters").refine(val => !val.toLowerCase().includes("admin"), "Invalid name").optional(),
  avatar: z.string().url().max(500).refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
    message: "Avatar URL must start with http:// or https://"
  }).optional().nullable(),
  // ... other fields
})
```

### Rate Limiting

The system implements database-backed rate limiting to prevent brute force attacks and abuse:

- Authentication endpoints have strict rate limits
- Limits are configurable per endpoint
- The system fails closed during outages to prevent bypassing rate limits

**Section sources**
- [.env.example](file://.env.example)
- [lib/security.ts](file://lib/security.ts)
- [lib/session-security.ts](file://lib/session-security.ts)
- [SECURITY.md](file://SECURITY.md)

## Next.js Configuration

The application's Next.js configuration in `next.config.mjs` includes several security and optimization settings.

### Security Headers

The configuration sets strict security headers for all responses:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(self), microphone=(), geolocation=(self)',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
          ].join('; ')
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ],
    },
  ]
}
```

These headers protect against common web vulnerabilities:
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer-Policy**: Controls referrer information leakage
- **X-XSS-Protection**: Enables XSS filtering in legacy browsers
- **Permissions-Policy**: Restricts access to sensitive browser features
- **Content-Security-Policy**: Defines allowed sources for content
- **Strict-Transport-Security**: Enforces HTTPS connections

### Image Optimization

The configuration enables image optimization with support for modern formats:

```javascript
images: {
  unoptimized: false,
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
  ],
}
```

This configuration enables automatic image optimization, format conversion to AVIF and WebP, and caching for improved performance.

### Middleware Configuration

The proxy middleware in `proxy.ts` implements additional security and routing logic:

- **CSRF Protection**: Validates origin headers for state-changing API requests
- **Role-Based Access Control**: Enforces role-based access to protected routes
- **Session Validation**: Validates session binding and fingerprint on each request
- **Account Status Enforcement**: Checks if accounts are active before granting access
- **Password Change Enforcement**: Redirects users who need to change their password

The middleware configuration ensures that only authorized users can access protected routes based on their role.

**Section sources**
- [next.config.mjs](file://next.config.mjs)
- [proxy.ts](file://proxy.ts)

## TypeScript Configuration

The TypeScript configuration in `tsconfig.json` ensures type safety and compatibility with the Next.js framework.

```json
{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

Key configuration options include:

- **Strict Type Checking**: The `strict: true` option enables all strict type-checking options, catching potential bugs at compile time
- **ES Module Support**: The configuration uses `module: "esnext"` and `moduleResolution: "bundler"` to support modern JavaScript modules
- **JSX Support**: The `jsx: "react-jsx"` option enables React's new JSX transform
- **Path Aliases**: The `@/*` path mapping allows importing from the root directory using the `@` alias
- **Incremental Compilation**: The `incremental: true` option speeds up compilation by only recompiling changed files

The configuration also includes the Next.js plugin, which provides additional type checking and IntelliSense for Next.js features.

**Section sources**
- [tsconfig.json](file://tsconfig.json)

## Development, Staging, and Production Setup

### Development Environment

For local development, create a `.env.local` file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Then fill in the required values:

```env
# Development configuration
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
QR_SECRET=$(openssl rand -hex 32)
IP_HASH_SALT=$(openssl rand -hex 32)
FINGERPRINT_SALT=$(openssl rand -hex 32)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

Start the development server:

```bash
pnpm dev
```

### Staging Environment

For staging environments, use environment-specific variables:

```env
# Staging configuration
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key
NEXT_PUBLIC_SITE_URL=https://staging.your-school.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

Ensure that the staging database is a copy of production data with sensitive information anonymized.

### Production Environment

For production deployment, set the following environment variables:

```env
# Production configuration
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-production-supabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
NEXT_PUBLIC_SITE_URL=https://your-school.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

Additional production considerations:
- Use strong, randomly generated secrets for all security variables
- Ensure the `NEXT_PUBLIC_SITE_URL` matches your production domain
- Enable analytics for performance monitoring
- Set up proper logging and monitoring
- Configure automated backups for the database

### Deployment Instructions

1. Set environment variables in your deployment platform
2. Install dependencies: `pnpm install`
3. Build the application: `pnpm build`
4. Start the production server: `pnpm start`

For Vercel deployment, the environment variables can be set in the project settings. For other platforms, refer to their documentation for environment variable configuration.

**Section sources**
- [.env.example](file://.env.example)
- [README.md](file://README.md)

## Common Configuration Issues and Solutions

### CORS Errors

**Issue**: "Blocked by CORS policy" errors when making API requests.

**Solution**: Ensure the `NEXT_PUBLIC_SITE_URL` is correctly set in production. The system validates origin headers against this URL. For development, the fallback host header check should work with localhost.

### Authentication Misconfiguration

**Issue**: Users cannot log in or receive "Invalid credentials" errors.

**Solution**: Verify that the Supabase credentials are correct:
- Check that `NEXT_PUBLIC_SUPABASE_URL` points to your Supabase project
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the correct anonymous key
- Verify that the Supabase project has email/password authentication enabled

### Zoom Integration Failures

**Issue**: "Missing Zoom API credentials" error.

**Solution**: Ensure all Zoom environment variables are set:
- For Server-to-Server OAuth: `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`
- For Meeting SDK: `ZOOM_SDK_KEY`, `ZOOM_SDK_SECRET`
- Verify that the Zoom app has the necessary permissions enabled

### Session Validation Errors

**Issue**: Users are logged out unexpectedly or receive "Session invalid" errors.

**Solution**: This may occur if the browser fingerprint changes significantly. Check:
- Ensure the `FINGERPRINT_SALT` is consistent across deployments
- Verify that the `SESSION_BINDING_COOKIE` is being set and sent with requests
- Check that the client-side fingerprint generation is working correctly

### Database Connection Issues

**Issue**: "Connection refused" or "Invalid JWT" errors.

**Solution**: Verify the Supabase service role key:
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set and correct
- Check that the key has not been rotated in the Supabase dashboard
- Verify that the database migrations have been applied

### Image Loading Problems

**Issue**: Images from Supabase storage are not loading.

**Solution**: Check the Next.js image configuration:
- Ensure `remotePatterns` includes `**.supabase.co`
- Verify that the image URLs are correct and accessible
- Check that the Supabase storage bucket policies allow public read access

**Section sources**
- [.env.example](file://.env.example)
- [lib/security.ts](file://lib/security.ts)
- [lib/session-security.ts](file://lib/session-security.ts)
- [lib/zoom/client.ts](file://lib/zoom/client.ts)
- [next.config.mjs](file://next.config.mjs)

## Security Best Practices

### Managing Sensitive Credentials

Never commit sensitive credentials to version control. Always:
- Use `.env.local` for local development and add it to `.gitignore`
- Store production secrets in your deployment platform's environment variables
- Rotate credentials regularly and update them in all environments
- Use strong, randomly generated secrets (32+ characters)

### Environment-Specific Configuration

Use different configuration values for each environment:
- Development: Use test databases and disable production features
- Staging: Mirror production as closely as possible for testing
- Production: Enable all security features and monitoring

### Regular Security Audits

Conduct regular security reviews:
- Review RLS policies to ensure they follow the principle of least privilege
- Check for outdated dependencies with known vulnerabilities
- Test authentication flows for potential bypasses
- Review audit logs for suspicious activity

### Secure Deployment Practices

Follow secure deployment practices:
- Use HTTPS in all environments
- Enable HSTS to enforce secure connections
- Implement proper error handling that doesn't leak sensitive information
- Set up monitoring and alerting for security events
- Regularly back up the database and test restoration procedures

### Compliance Considerations

For educational institutions, consider compliance requirements:
- **FERPA**: Protect student education records and personally identifiable information
- **GDPR**: Handle EU citizen data according to privacy regulations
- **COPPA**: Implement appropriate protections for children's data
- **Accessibility**: Ensure the application is accessible to users with disabilities

The system's IP address hashing and data minimization practices help protect user privacy while enabling necessary functionality.

**Section sources**
- [SECURITY.md](file://SECURITY.md)
- [.env.example](file://.env.example)
- [lib/security.ts](file://lib/security.ts)