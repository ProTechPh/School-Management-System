# API Reference

<cite>
**Referenced Files in This Document**   
- [lib/supabase/types.ts](file://lib/supabase/types.ts)
- [lib/zoom/types.ts](file://lib/zoom/types.ts)
- [app/api/auth/login/route.ts](file://app/api/auth/login/route.ts)
- [app/api/auth/logout/route.ts](file://app/api/auth/logout/route.ts)
- [app/api/auth/me/route.ts](file://app/api/auth/me/route.ts)
- [app/api/admin/classes/route.ts](file://app/api/admin/classes/route.ts)
- [app/api/teacher/classes/route.ts](file://app/api/teacher/classes/route.ts)
- [app/api/student/classes/route.ts](file://app/api/student/classes/route.ts)
- [app/api/parent/children/route.ts](file://app/api/parent/children/route.ts)
- [app/api/assignments/route.ts](file://app/api/assignments/route.ts)
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts)
- [app/api/check-auth/route.ts](file://app/api/check-auth/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Versioning and Compatibility](#api-versioning-and-compatibility)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [User Roles and Permissions](#user-roles-and-permissions)
7. [Core Endpoints by Role](#core-endpoints-by-role)
   - [Admin Endpoints](#admin-endpoints)
   - [Teacher Endpoints](#teacher-endpoints)
   - [Student Endpoints](#student-endpoints)
   - [Parent Endpoints](#parent-endpoints)
8. [Functional Domain Endpoints](#functional-domain-endpoints)
   - [Users](#users)
   - [Classes](#classes)
   - [Attendance](#attendance)
   - [Grades](#grades)
   - [Assignments](#assignments)
   - [Announcements](#announcements)
   - [Calendar](#calendar)
   - [Zoom Integration](#zoom-integration)
9. [Client Implementation Guidelines](#client-implementation-guidelines)
10. [Performance Optimization Tips](#performance-optimization-tips)

## Introduction
This document provides comprehensive reference documentation for the backend API endpoints of the School-Management-System. The API is built using Next.js App Router with Supabase as the backend database and authentication provider. The system supports four user roles: admin, teacher, student, and parent, with role-based access control enforced at the API level.

The API follows RESTful principles with JSON request and response payloads. All endpoints require authentication via JWT tokens managed by Supabase Auth, with additional session binding security measures. The API includes comprehensive error handling, rate limiting, and input validation to ensure system security and reliability.

**Section sources**
- [lib/supabase/types.ts](file://lib/supabase/types.ts)
- [lib/zoom/types.ts](file://lib/zoom/types.ts)

## API Versioning and Compatibility
The School-Management-System API does not currently implement URL-based versioning (e.g., /api/v1/). Instead, the system follows a backward compatibility approach where:

1. **Breaking changes** require a new API implementation with parallel support for the old version during a transition period
2. **Non-breaking additions** (new fields, endpoints) are added without version changes
3. **Deprecated endpoints** are maintained with warning headers for 3 months before removal
4. **Database schema changes** are managed through Supabase migrations with proper RLS (Row Level Security) policies

The system prioritizes backward compatibility to minimize disruption to frontend clients. When changes are necessary, they are communicated through release notes and developer notifications.

**Section sources**
- [supabase/migrations/](file://supabase/migrations/)

## Authentication
The API uses Supabase Auth for authentication with additional security layers including session binding and rate limiting.

### Authentication Endpoints

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate user with email and password
- **Request Schema**:
```json
{
  "email": "string",
  "password": "string",
  "fingerprint": "ClientFingerprint"
}
```
- **Response Schema**:
```json
{
  "user": "DbUser",
  "role": "UserRole",
  "isNewDevice": "boolean"
}
```
- **Authentication**: None (public endpoint)
- **Security**: Rate limited to 5 attempts per minute, generic error messages to prevent user enumeration

**Section sources**
- [app/api/auth/login/route.ts](file://app/api/auth/login/route.ts)

#### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Description**: Sign out current user and invalidate session
- **Request**: Empty POST body
- **Response Schema**:
```json
{
  "success": "boolean"
}
```
- **Authentication**: Bearer token via Supabase Auth
- **Security**: Clears session binding cookie and invalidates server-side session

**Section sources**
- [app/api/auth/logout/route.ts](file://app/api/auth/logout/route.ts)

#### Current User
- **Endpoint**: `GET /api/auth/me`
- **Description**: Get current authenticated user information
- **Response Schema**:
```json
{
  "user": "DbUser",
  "role": "UserRole"
}
```
- **Authentication**: Bearer token via Supabase Auth
- **Security**: Returns user data with role information from database

#### Session Validation
- **Endpoint**: `POST /api/check-auth`
- **Description**: Admin-only endpoint to check if a user ID has valid authentication
- **Request Schema**:
```json
{
  "userId": "string"
}
```
- **Response Schema**:
```json
{
  "hasAuth": "boolean"
}
```
- **Authentication**: Admin role required
- **Security**: Uses Supabase service role key for direct user lookup

**Section sources**
- [app/api/check-auth/route.ts](file://app/api/check-auth/route.ts)

## Rate Limiting
The API implements rate limiting to prevent abuse and ensure system stability:

- **Login attempts**: 5 attempts per minute per IP address
- **Admin endpoints**: 30 requests per minute per IP address
- **General API usage**: 100 requests per minute per authenticated user

Rate limiting is implemented using a Redis-based system with the `check_rate_limit` function in the database. Exceeding rate limits returns a 429 status code with the message "Too many requests. Please try again later."

**Section sources**
- [lib/rate-limit.ts](file://lib/rate-limit.ts)
- [database.types.ts](file://lib/database.types.ts#L415-L417)

## Error Handling
The API returns standardized error responses with appropriate HTTP status codes:

| Status Code | Error Type | Description |
|-----------|----------|-------------|
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions for the operation |
| 404 | Not Found | Requested resource does not exist |
| 409 | Conflict | Request conflicts with current state |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

Error responses follow the format:
```json
{
  "error": "string"
}
```

Specific error messages are designed to avoid information leakage while providing sufficient detail for debugging.

**Section sources**
- [lib/api-errors.ts](file://lib/api-errors.ts)

## User Roles and Permissions
The system supports four user roles with distinct permissions:

- **Admin**: Full system access, user management, configuration
- **Teacher**: Class management, grading, attendance, content creation
- **Student**: View classes, submit assignments, view grades and attendance
- **Parent**: View child's information, grades, and attendance

Role-based access control is enforced at the API level by checking the user's role in the users table against the required permissions for each endpoint.

**Section sources**
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L2)
- [database.types.ts](file://lib/database.types.ts#L379)

## Core Endpoints by Role

### Admin Endpoints
Admin endpoints are prefixed with `/api/admin/` and require admin role authentication.

#### List Classes
- **Endpoint**: `GET /api/admin/classes`
- **Description**: Get paginated list of all classes with enrollment counts
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `pageSize`: Number of items per page (default: 50)
  - `search`: Search term for class name or subject
- **Response Schema**:
```json
{
  "classes": "DbClass[]",
  "pagination": {
    "page": "number",
    "pageSize": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```
- **Authentication**: Admin role required

**Section sources**
- [app/api/admin/classes/route.ts](file://app/api/admin/classes/route.ts)

### Teacher Endpoints
Teacher endpoints are prefixed with `/api/teacher/` and require teacher role authentication.

#### List Teacher Classes
- **Endpoint**: `GET /api/teacher/classes`
- **Description**: Get all classes taught by the authenticated teacher
- **Response Schema**:
```json
{
  "classes": "DbClass[]"
}
```
- **Authentication**: Teacher role required
- **Includes**: Student count for each class

**Section sources**
- [app/api/teacher/classes/route.ts](file://app/api/teacher/classes/route.ts)

### Student Endpoints
Student endpoints are prefixed with `/api/student/` and require student role authentication.

#### List Student Classes
- **Endpoint**: `GET /api/student/classes`
- **Description**: Get all classes the student is enrolled in
- **Response Schema**:
```json
{
  "classes": "DbClass[]"
}
```
- **Authentication**: Student role required
- **Includes**: Teacher name and avatar, student count

**Section sources**
- [app/api/student/classes/route.ts](file://app/api/student/classes/route.ts)

### Parent Endpoints
Parent endpoints are prefixed with `/api/parent/` and require parent role authentication.

#### List Parent's Children
- **Endpoint**: `GET /api/parent/children`
- **Description**: Get all children linked to the parent account
- **Response Schema**:
```json
{
  "children": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatar": "string",
      "grade": "string",
      "section": "string",
      "relationship": "string"
    }
  ]
}
```
- **Authentication**: Parent role required
- **Includes**: Student profile information

**Section sources**
- [app/api/parent/children/route.ts](file://app/api/parent/children/route.ts)

## Functional Domain Endpoints

### Users
User management endpoints handle user creation, retrieval, and updates.

#### Create User
- **Endpoint**: `POST /api/admin/create-user`
- **Description**: Create a new user account
- **Authentication**: Admin role required
- **Request Schema**: Based on `DbUser` type with role specification

### Classes
Class endpoints manage class creation, enrollment, and information.

#### Create Class
- **Endpoint**: `POST /api/admin/create-class`
- **Description**: Create a new class
- **Authentication**: Admin role required
- **Request Schema**: Class name, grade, section, subject, teacher assignment

#### Enroll Student
- **Endpoint**: `POST /api/admin/enroll-student`
- **Description**: Enroll a student in a class
- **Authentication**: Admin role required
- **Request Schema**: Student ID, class ID

### Attendance
Attendance endpoints manage attendance records and QR-based check-in.

#### Save Attendance
- **Endpoint**: `POST /api/teacher/attendance/save`
- **Description**: Save attendance records for a class
- **Authentication**: Teacher role required
- **Request Schema**: Array of student IDs with attendance status

#### QR Check-in
- **Endpoint**: `POST /api/student/check-in`
- **Description**: Student check-in via QR code
- **Authentication**: Student role required
- **Request Schema**: QR code value, geolocation coordinates

### Grades
Grade endpoints manage grade recording and retrieval.

#### Create Grade
- **Endpoint**: `POST /api/teacher/grades/create`
- **Description**: Record a grade for a student
- **Authentication**: Teacher role required
- **Request Schema**: Student ID, class ID, score, max_score, type

#### Get Student Grades
- **Endpoint**: `GET /api/student/grades`
- **Description**: Get all grades for the authenticated student
- **Authentication**: Student role required

### Assignments
Assignment endpoints manage assignment creation, submission, and grading.

#### List Assignments
- **Endpoint**: `GET /api/assignments`
- **Description**: Get assignments filtered by role and class
- **Query Parameters**: `classId` for filtering
- **Authentication**: All authenticated users
- **Behavior**: 
  - Teachers/Admins: See all their assignments
  - Students: See published assignments only

**Section sources**
- [app/api/assignments/route.ts](file://app/api/assignments/route.ts)

#### Create Assignment
- **Endpoint**: `POST /api/assignments`
- **Description**: Create a new assignment
- **Authentication**: Teacher or Admin role required
- **Request Schema**: Based on `createAssignmentSchema` validation
- **Validation**: Title (required), description, classId (UUID), dueDate, maxScore, allowLateSubmission, status

### Announcements
Announcement endpoints manage school-wide and targeted announcements.

#### Create Announcement
- **Endpoint**: `POST /api/announcements/create`
- **Description**: Create a new announcement
- **Authentication**: Admin role required
- **Request Schema**: Title, content, target_audience, priority, expires_at

#### Delete Announcement
- **Endpoint**: `POST /api/announcements/delete`
- **Description**: Remove an announcement
- **Authentication**: Admin role required
- **Request Schema**: Announcement ID

### Calendar
Calendar endpoints manage calendar events and scheduling.

#### List Events
- **Endpoint**: `GET /api/calendar`
- **Description**: Get calendar events with filtering
- **Query Parameters**: Date range, classId, event type
- **Authentication**: All authenticated users
- **Filtering**: By target audience and date

### Zoom Integration
Zoom integration endpoints manage virtual meetings and reporting.

#### List Meetings
- **Endpoint**: `GET /api/zoom/meetings`
- **Description**: Get Zoom meetings with filtering
- **Query Parameters**:
  - `status`: Filter by meeting status
  - `classId`: Filter by class
  - `upcoming`: Only show upcoming meetings
  - `limit`: Number of results
- **Authentication**: All authenticated users
- **Includes**: Host and class information

**Section sources**
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts)

#### Create Meeting
- **Endpoint**: `POST /api/zoom/meetings`
- **Description**: Create a new Zoom meeting
- **Authentication**: Teacher or Admin role required
- **Request Schema**: Based on `CreateZoomMeetingRequest` type
- **Features**: 
  - Automatic registration for enrolled students
  - Calendar event creation
  - Notifications to participants
  - Staff registration to bypass waiting room

#### Meeting Reports
- **Endpoint**: `GET /api/zoom/reports`
- **Description**: Get attendance and participation reports for meetings
- **Authentication**: Teacher or Admin role required
- **Includes**: Participant join/leave times, duration

## Client Implementation Guidelines
When implementing API consumers, follow these guidelines:

1. **Authentication**: Store the JWT token securely and include it in the Authorization header for all requests
2. **Error Handling**: Implement retry logic for 429 responses with exponential backoff
3. **Caching**: Cache responses for GET requests with appropriate TTL based on data volatility
4. **Pagination**: Use pagination parameters for endpoints that return lists to improve performance
5. **Validation**: Validate request payloads against the documented schemas before sending
6. **Rate Limiting**: Monitor rate limit headers and adjust request frequency accordingly

For React clients, use the provided hooks in `lib/hooks/` for optimized queries and session management.

## Performance Optimization Tips
To optimize API performance:

1. **Batch Requests**: Combine multiple operations into single requests when possible
2. **Use Query Parameters**: Filter data at the server side rather than retrieving all data
3. **Implement Caching**: Cache frequently accessed data with appropriate invalidation strategies
4. **Optimize Images**: Use the materials/sign endpoint to generate signed URLs for efficient file access
5. **Use WebSockets**: For real-time updates, use Supabase Realtime instead of polling
6. **Minimize Payloads**: Only request the fields needed for the current view

The API is optimized for performance with database indexing, query optimization, and efficient data retrieval patterns.