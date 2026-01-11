# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Features

LessonGo implements multiple layers of security:

### Authentication & Session Management
- Supabase Auth with secure password hashing
- Session timeout with configurable inactivity and absolute limits
- Forced password change for new accounts (`must_change_password`)
- Account deactivation support (`is_active` flag)
- Generic error messages to prevent user enumeration

### Authorization
- Role-based access control (Admin, Teacher, Student, Parent)
- Row Level Security (RLS) policies on all database tables
- Server-side role validation via JWT metadata

### Rate Limiting
- Database-backed rate limiting with atomic RPC
- Fail-closed for authentication endpoints (prevents brute force during outages)
- Configurable limits per endpoint

### Data Protection
- IP address hashing for privacy-preserving audit logs
- Input validation with Zod schemas
- XSS prevention via URL protocol validation
- Origin/Referer validation for CSRF protection

### Infrastructure
- HTTPS enforced in production
- Secure client IP extraction (platform-provided, not spoofable headers)
- Service role key isolation for admin operations

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability:

1. **Do NOT** open a public GitHub issue
2. Email security concerns to the project maintainers privately
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline
- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Target**: Within 30 days for critical issues

### What to Expect
- We will keep you informed of our progress
- Credit will be given in release notes (unless you prefer anonymity)
- We may ask for additional information or clarification

## Security Best Practices for Contributors

1. Never commit secrets or credentials
2. Use environment variables for sensitive configuration
3. Validate all user input server-side
4. Follow the principle of least privilege for RLS policies
5. Test authentication flows thoroughly
