# Developer Onboarding Guide

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [.env.example](file://.env.example)
- [package.json](file://package.json)
- [next.config.mjs](file://next.config.mjs)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/server.ts](file://lib/supabase/server.ts)
- [lib/supabase/types.ts](file://lib/supabase/types.ts)
- [lib/supabase/queries.ts](file://lib/supabase/queries.ts)
- [lib/student-integration.test.ts](file://lib/student-integration.test.ts)
- [lib/student-validation.test.ts](file://lib/student-validation.test.ts)
- [SECURITY.md](file://SECURITY.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Configuration](#project-configuration)
4. [Database Setup with Supabase](#database-setup-with-supabase)
5. [Running the Application](#running-the-application)
6. [Testing Strategy](#testing-strategy)
7. [Code Contribution Guidelines](#code-contribution-guidelines)
8. [Troubleshooting Common Issues](#troubleshooting-common-issues)
9. [Quick Start Checklist](#quick-start-checklist)

## Introduction

The School-Management-System is a comprehensive educational platform featuring role-based dashboards for administrators, teachers, students, and parents. Built with Next.js 16 and TypeScript 5, the system provides robust functionality including assignment management, attendance tracking, grade reporting, and parent communication.

This onboarding guide provides new developers with step-by-step instructions for setting up the development environment, configuring the application, and becoming productive quickly. The system uses Supabase as its backend database with Row Level Security (RLS) for data protection, and follows modern development practices with comprehensive testing and security features.

**Section sources**
- [README.md](file://README.md#L1-L301)

## Development Environment Setup

### Required Software

Before setting up the project, ensure you have the following software installed:

- **Node.js 18+**: The application requires Node.js version 18 or higher
- **pnpm**: The recommended package manager (can also use npm)
- **Supabase CLI**: For local database management and migration operations

### Installation Process

Follow these steps to install the required software and dependencies:

```bash
# Install Node.js 18+ using your preferred method
# Using nvm (Node Version Manager)
nvm install 18
nvm use 18

# Install pnpm globally
npm install -g pnpm

# Install Supabase CLI
# Using Homebrew (macOS)
brew install supabase/tap/supabase

# Or using npm
npm install -g @supabase/supabase-cli

# Clone the repository
git clone <repository-url>
cd School-Management-System

# Install project dependencies
pnpm install
```

The package.json file contains all project dependencies, including Next.js 16.1.1, React 19.2.1, TypeScript 5, and various UI libraries such as shadcn/ui and Lucide React.

**Section sources**
- [README.md](file://README.md#L53-L67)
- [package.json](file://package.json#L1-L90)

## Project Configuration

### Environment Variables Setup

The application uses environment variables for configuration. Follow these steps to set up your environment:

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit the `.env.local` file with your configuration values. The `.env.example` file contains all required variables with descriptions:

```env
# QR Attendance Security
QR_SECRET=your-qr-secret-here

# IP Address Hashing Salt (for privacy-preserving abuse detection)
IP_HASH_SALT=your-ip-hash-salt-here

# Fingerprint Hashing Salt (for session security)
FINGERPRINT_SALT=your-fingerprint-salt-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Analytics (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Environment
NODE_ENV=development

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

3. Generate secure secrets for QR_SECRET, IP_HASH_SALT, and FINGERPRINT_SALT using OpenSSL:
```bash
openssl rand -hex 32
```

**Section sources**
- [.env.example](file://.env.example#L1-L50)

## Database Setup with Supabase

### Supabase Configuration

The application uses Supabase as its backend database with PostgreSQL and Row Level Security (RLS). Follow these steps to set up the database:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Configure the environment variables in `.env.local` with your project credentials:
   - NEXT_PUBLIC_SUPABASE_URL: Found in Project Settings > API
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Found in Project Settings > API
   - SUPABASE_SERVICE_ROLE_KEY: Found in Project Settings > API (keep this secret)

3. Run database migrations from the `supabase/migrations/` directory:
```bash
# Apply all migrations
supabase db push

# Or use the Supabase CLI to manage migrations
supabase migration list
supabase migration up
```

The database schema includes tables for users, classes, attendance, grades, quizzes, lessons, and announcements, with comprehensive RLS policies for security.

### Database Client Configuration

The application uses two Supabase clients:
- **Browser client**: For client-side operations with RLS enforcement
- **Server client**: For server-side operations with cookie-based authentication
- **Admin client**: For administrative operations that bypass RLS

The client configuration is located in `lib/supabase/client.ts` and `lib/supabase/server.ts`, providing type-safe database access with generated TypeScript types.

**Section sources**
- [README.md](file://README.md#L250-L257)
- [lib/supabase/client.ts](file://lib/supabase/client.ts#L1-L9)
- [lib/supabase/server.ts](file://lib/supabase/server.ts#L1-L51)
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L1-L253)

## Running the Application

### Development Mode

To run the application in development mode:

```bash
# Start the development server
pnpm dev

# The application will be available at http://localhost:3000
```

The development server provides hot reloading and fast refresh for an efficient development experience.

### Production Build

To build and run the application in production mode:

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

### Available Scripts

The following scripts are available in the package.json file:

- `pnpm dev`: Start the development server
- `pnpm build`: Build the application for production
- `pnpm start`: Start the production server
- `pnpm lint`: Run ESLint for code quality checking
- `pnpm test`: Run tests using Vitest
- `pnpm test:watch`: Run tests in watch mode

The application is configured with security headers in `next.config.mjs`, including Content Security Policy, X-Frame-Options, and Strict-Transport-Security to protect against common web vulnerabilities.

**Section sources**
- [README.md](file://README.md#L73-L84)
- [package.json](file://package.json#L5-L12)
- [next.config.mjs](file://next.config.mjs#L1-L79)

## Testing Strategy

### Testing Framework

The application uses Vitest as its testing framework with the following configuration:

- **Integration tests**: Located in `lib/student-integration.test.ts`
- **Property-based tests**: Located in `lib/student-validation.test.ts`
- **Test runner**: Vitest with fast-check for property-based testing

### Running Tests

To run the tests:

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Test Coverage

The testing strategy includes:

1. **Integration tests** for the complete student registration flow and profile view/edit functionality, validating all DepEd student profile requirements (1.1-8.5).

2. **Property-based tests** for student validation, ensuring that:
   - LRN format is exactly 12 numeric digits
   - Guardian contact validation requires at least one contact
   - Form validation handles edge cases correctly

3. **Security tests** that validate:
   - Authentication flows
   - Authorization rules
   - Input validation
   - Error handling

The tests use realistic sample data and validate both success and error conditions to ensure robust application behavior.

**Section sources**
- [lib/student-integration.test.ts](file://lib/student-integration.test.ts#L1-L603)
- [lib/student-validation.test.ts](file://lib/student-validation.test.ts#L1-L83)

## Code Contribution Guidelines

### Branching Strategy

The project follows a standard Git branching model:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/\***: Feature branches
- **bugfix/\***: Bug fix branches
- **hotfix/\***: Critical production fixes

### Commit Conventions

Follow conventional commit messages:

- `feat: ` for new features
- `fix: ` for bug fixes
- `docs: ` for documentation changes
- `style: ` for code formatting
- `refactor: ` for code refactoring
- `test: ` for test additions
- `chore: ` for maintenance tasks

### Pull Request Process

1. Create a feature branch from develop
2. Implement your changes with appropriate tests
3. Push your branch and create a pull request
4. Request review from team members
5. Address feedback and make necessary changes
6. Merge after approval

### Security Best Practices

Contributors should follow these security best practices:

- Never commit secrets or credentials
- Use environment variables for sensitive configuration
- Validate all user input server-side
- Follow the principle of least privilege for RLS policies
- Test authentication flows thoroughly

The security policy is documented in SECURITY.md, which outlines supported versions, security features, and vulnerability reporting procedures.

**Section sources**
- [SECURITY.md](file://SECURITY.md#L1-L70)

## Troubleshooting Common Issues

### Database Connection Errors

If you encounter database connection issues:

1. Verify your Supabase credentials in `.env.local`
2. Ensure the Supabase project is running
3. Check that the database migrations have been applied
4. Verify network connectivity to the Supabase endpoint

### Authentication Problems

For authentication issues:

1. Ensure the Supabase URL and keys are correct
2. Verify that the service role key is properly configured
3. Check that the JWT tokens are being handled correctly
4. Ensure the RLS policies are properly set up

### Environment Configuration Issues

Common environment issues and solutions:

- **Missing environment variables**: Ensure all required variables are set in `.env.local`
- **Incorrect Supabase configuration**: Verify the Supabase URL and keys match your project
- **Migration failures**: Run `supabase db push` to apply migrations
- **Type generation issues**: Regenerate types with `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts`

### Development Server Issues

If the development server fails to start:

1. Clear the Next.js cache: `rm -rf .next/`
2. Reinstall dependencies: `pnpm install`
3. Verify Node.js version is 18+
4. Check for port conflicts on port 3000

**Section sources**
- [README.md](file://README.md#L270-L283)
- [.env.example](file://.env.example#L1-L50)

## Quick Start Checklist

Use this checklist to quickly set up your development environment:

- [ ] Install Node.js 18+ and verify with `node --version`
- [ ] Install pnpm with `npm install -g pnpm`
- [ ] Install Supabase CLI
- [ ] Clone the repository
- [ ] Run `pnpm install` to install dependencies
- [ ] Copy `.env.example` to `.env.local`
- [ ] Create a Supabase project and obtain API credentials
- [ ] Configure environment variables in `.env.local`
- [ ] Generate secure secrets for QR_SECRET, IP_HASH_SALT, and FINGERPRINT_SALT
- [ ] Apply database migrations with `supabase db push`
- [ ] Start the development server with `pnpm dev`
- [ ] Verify the application runs at http://localhost:3000
- [ ] Run tests with `pnpm test` to verify the setup

Following this checklist will ensure you have a fully functional development environment and can begin contributing to the project immediately.

**Section sources**
- [README.md](file://README.md#L53-L84)
- [.env.example](file://.env.example#L1-L50)
- [package.json](file://package.json#L1-L90)