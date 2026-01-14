# Admin API

<cite>
**Referenced Files in This Document**   
- [create-user/route.ts](file://app/api/admin/create-user/route.ts)
- [get-users/route.ts](file://app/api/admin/get-users/route.ts)
- [toggle-user-status/route.ts](file://app/api/admin/toggle-user-status/route.ts)
- [create-class/route.ts](file://app/api/admin/create-class/route.ts)
- [classes/route.ts](file://app/api/admin/classes/route.ts)
- [classes/[id]/route.ts](file://app/api/admin/classes/[id]/route.ts)
- [enroll-student/route.ts](file://app/api/admin/enroll-student/route.ts)
- [unenroll-student/route.ts](file://app/api/admin/unenroll-student/route.ts)
- [link-parent-child/route.ts](file://app/api/admin/link-parent-child/route.ts)
- [unlink-parent-child/route.ts](file://app/api/admin/unlink-parent-child/route.ts)
- [grades/route.ts](file://app/api/admin/grades/route.ts)
- [quizzes/route.ts](file://app/api/admin/quizzes/route.ts)
- [schedule/route.ts](file://app/api/admin/schedule/route.ts)
- [settings/update/route.ts](file://app/api/admin/settings/update/route.ts)
- [types.ts](file://lib/supabase/types.ts)
- [admin-session-guard.tsx](file://components/admin-session-guard.tsx)
- [student-form.tsx](file://components/student-form.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication and Security](#authentication-and-security)
3. [User Management](#user-management)
4. [Class Operations](#class-operations)
5. [Student Enrollment](#student-enrollment)
6. [Parent-Child Linking](#parent-child-linking)
7. [Academic Data Access](#academic-data-access)
8. [Settings Management](#settings-management)
9. [Error Handling](#error-handling)
10. [Data Transfer Objects and Sanitization](#data-transfer-objects-and-sanitization)
11. [Frontend Integration](#frontend-integration)

## Introduction
The Admin API provides a comprehensive set of RESTful endpoints for managing school operations in the School-Management-System. These endpoints are accessible only to authenticated users with the "admin" role and are designed to handle critical administrative functions including user management, class operations, student enrollment, parent-child relationships, academic data access, and system settings. All endpoints implement robust security measures including role-based access control, rate limiting, and data sanitization through the DTO pattern.

**Section sources**
- [create-user/route.ts](file://app/api/admin/create-user/route.ts)
- [get-users/route.ts](file://app/api/admin/get-users/route.ts)
- [toggle-user-status/route.ts](file://app/api/admin/toggle-user-status/route.ts)

## Authentication and Security
All Admin API endpoints require authentication and enforce strict security measures. The system uses Supabase authentication with role-based access control. Only users with the "admin" role can access these endpoints. Each request is validated server-side to prevent privilege escalation attacks.

Security features implemented across all endpoints:
- **Role Verification**: Server-side verification of admin role in the users table
- **Rate Limiting**: Protection against abuse using IP-based rate limiting
- **CSRF Protection**: Origin validation for state-changing operations
- **Input Validation**: Schema validation using Zod for critical endpoints
- **IP Anonymization**: Client IP extraction with privacy considerations

The AdminSessionGuard component enforces session timeout policies with a 30-minute inactivity timeout and 8-hour absolute timeout, providing an additional layer of security for admin sessions.

**Section sources**
- [create-user/route.ts](file://app/api/admin/create-user/route.ts#L10-L12)
- [get-users/route.ts](file://app/api/admin/get-users/route.ts#L7-L18)
- [admin-session-guard.tsx](file://components/admin-session-guard.tsx)

## User Management
The user management endpoints provide CRUD operations for system users with appropriate security controls.

### Create User Endpoint
Creates a new user account with role-specific profile information.

**Endpoint**: `POST /api/admin/create-user`  
**Authentication**: Admin role required  
**Rate Limiting**: 10 requests per minute per IP

**Request Body**:
```json
{
  "email": "string",
  "password": "string (optional)",
  "name": "string",
  "role": "admin|teacher|student",
  "lrn": "string (student only)",
  "subject": "string (teacher only)",
  "department": "string (teacher only)",
  "phone": "string",
  "address": "string"
}
```

**Security Features**:
- Server-side password generation if not provided
- Password complexity enforcement (12+ characters with uppercase, lowercase, number, special character)
- Transactional user creation (auth + database + profile)
- Role-specific profile creation

When successful, returns the generated password to the admin for secure distribution.

**Section sources**
- [create-user/route.ts](file://app/api/admin/create-user/route.ts)

### Get Users Endpoint
Retrieves a paginated list of all users in the system.

**Endpoint**: `GET /api/admin/get-users`  
**Authentication**: Admin role required  
**Rate Limiting**: Not explicitly limited

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response Schema**:
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "string",
      "created_at": "string",
      "is_active": "boolean"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

Implements pagination and DTO pattern to sanitize response data.

**Section sources**
- [get-users/route.ts](file://app/api/admin/get-users/route.ts)

### Toggle User Status Endpoint
Activates or deactivates a user account.

**Endpoint**: `POST /api/admin/toggle-user-status`  
**Authentication**: Admin role required  
**Rate Limiting**: Not explicitly limited

**Request Body**:
```json
{
  "userId": "string (UUID)",
  "status": "boolean"
}
```

**Security Features**:
- Zod schema validation
- Prevention of self-account modification
- Input sanitization

**Section sources**
- [toggle-user-status/route.ts](file://app/api/admin/toggle-user-status/route.ts)

## Class Operations
Endpoints for managing class entities including creation, listing, and modification.

### Create Class Endpoint
Creates a new class with schedule information.

**Endpoint**: `POST /api/admin/create-class`  
**Authentication**: Admin role required  
**Rate Limiting**: 10 requests per minute per IP

**Request Body**:
```json
{
  "name": "string",
  "grade": "string",
  "section": "string",
  "subject": "string",
  "teacher_id": "string (optional)",
  "room": "string (optional)",
  "scheduleDays": "MWF|TTh|Daily|MF|MW|WF",
  "scheduleTime": "HH:MM AM/PM"
}
```

Automatically creates corresponding schedule entries in the schedules table. Implements transactional integrity by rolling back class creation if schedule insertion fails.

**Section sources**
- [create-class/route.ts](file://app/api/admin/create-class/route.ts)

### List Classes Endpoint
Retrieves a paginated list of all classes with enrollment counts.

**Endpoint**: `GET /api/admin/classes`  
**Authentication**: Admin role required  
**Rate Limiting**: 30 requests per minute per IP

**Query Parameters**:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 50)
- `search`: Search term for name or subject

**Response Schema**:
```json
{
  "classes": [
    {
      "id": "string",
      "name": "string",
      "grade": "string",
      "section": "string",
      "subject": "string",
      "room": "string",
      "schedule": "string",
      "teacher_id": "string",
      "teacher_name": "string",
      "student_count": "number"
    }
  ],
  "pagination": {
    "page": "number",
    "pageSize": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

Uses database aggregation to efficiently retrieve student counts and implements DTO pattern for data sanitization.

**Section sources**
- [classes/route.ts](file://app/api/admin/classes/route.ts)

### Class Detail Operations
Provides update and delete operations for individual classes.

**Endpoints**:
- `PUT /api/admin/classes/[id]` - Update class
- `DELETE /api/admin/classes/[id]` - Delete class

Both require admin authentication and perform cascading operations:
- PUT: Updates class information and schedule
- DELETE: Removes related schedule and enrollment records before deleting the class

**Section sources**
- [classes/[id]/route.ts](file://app/api/admin/classes/[id]/route.ts)

## Student Enrollment
Endpoints for managing student enrollment in classes.

### Enroll Student Endpoint
Enrolls a student in a class.

**Endpoint**: `POST /api/admin/enroll-student`  
**Authentication**: Admin role required

**Request Body**:
```json
{
  "studentId": "string",
  "classId": "string"
}
```

Creates a record in the class_students junction table to establish the enrollment relationship.

**Section sources**
- [enroll-student/route.ts](file://app/api/admin/enroll-student/route.ts)

### Unenroll Student Endpoint
Removes a student from a class.

**Endpoint**: `POST /api/admin/unenroll-student`  
**Authentication**: Admin role required

**Request Body**:
```json
{
  "enrollmentId": "string"
}
```

Deletes the enrollment record by its ID rather than by student and class IDs for security.

**Section sources**
- [unenroll-student/route.ts](file://app/api/admin/unenroll-student/route.ts)

## Parent-Child Linking
Endpoints for establishing and removing relationships between parents and students.

### Link Parent-Child Endpoint
Creates a parent-child relationship.

**Endpoint**: `POST /api/admin/link-parent-child`  
**Authentication**: Admin role required

**Request Body**:
```json
{
  "parentId": "string",
  "studentId": "string",
  "relationship": "string (optional, default: 'guardian')"
}
```

Enforces uniqueness constraint to prevent duplicate relationships. Returns specific error for duplicate entries.

**Section sources**
- [link-parent-child/route.ts](file://app/api/admin/link-parent-child/route.ts)

### Unlink Parent-Child Endpoint
Removes a parent-child relationship.

**Endpoint**: `POST /api/admin/unlink-parent-child`  
**Authentication**: Admin role required

**Request Body**:
```json
{
  "parentId": "string",
  "studentId": "string"
}
```

Deletes the relationship record based on the parent and student IDs.

**Section sources**
- [unlink-parent-child/route.ts](file://app/api/admin/unlink-parent-child/route.ts)

## Academic Data Access
Endpoints for retrieving academic information across the system.

### Grades Endpoint
Retrieves all grade records with related student and class information.

**Endpoint**: `GET /api/admin/grades`  
**Authentication**: Admin role required

**Response Schema**:
```json
{
  "grades": [
    {
      "id": "string",
      "student_id": "string",
      "student_name": "string",
      "class_id": "string",
      "class_name": "string",
      "subject": "string",
      "score": "number",
      "max_score": "number",
      "percentage": "number",
      "grade": "number",
      "type": "exam|quiz|assignment|project",
      "date": "string"
    }
  ]
}
```

Implements DTO pattern to sanitize and enrich the response data with related entity information.

**Section sources**
- [grades/route.ts](file://app/api/admin/grades/route.ts)

### Quizzes Endpoint
Retrieves all quiz records with related class and teacher information.

**Endpoint**: `GET /api/admin/quizzes`  
**Authentication**: Admin role required

Includes related class name, teacher name, and question count in the response.

**Section sources**
- [quizzes/route.ts](file://app/api/admin/quizzes/route.ts)

### Schedule Endpoint
Retrieves all schedule entries with related class and teacher information.

**Endpoint**: `GET /api/admin/schedule`  
**Authentication**: Admin role required

Returns schedule data ordered by day and start time for easy display in calendar views.

**Section sources**
- [schedule/route.ts](file://app/api/admin/schedule/route.ts)

## Settings Management
Endpoint for updating system-wide school settings.

### Update Settings Endpoint
Updates the school's configuration settings.

**Endpoint**: `POST /api/admin/settings/update`  
**Authentication**: Admin role required

**Request Body**:
```json
{
  "name": "string",
  "latitude": "number (-90 to 90)",
  "longitude": "number (-180 to 180)",
  "radiusMeters": "number (10 to 5000)"
}
```

**Security Features**:
- Zod schema validation with bounds checking
- Fixed ID ("1") for the single settings record
- UPSERT operation to ensure exactly one settings record exists

**Section sources**
- [settings/update/route.ts](file://app/api/admin/settings/update/route.ts)

## Error Handling
The Admin API implements comprehensive error handling with appropriate HTTP status codes and security-conscious error messages.

### Standard Error Responses
- **401 Unauthorized**: No valid authentication session
- **403 Forbidden**: User authenticated but lacks admin role
- **400 Bad Request**: Invalid request parameters or body
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected server error

Security considerations:
- Generic error messages to prevent information leakage
- Specific error codes only when necessary for client functionality
- Detailed logging on server side for debugging
- Input validation errors returned with specific field information

**Section sources**
- [create-user/route.ts](file://app/api/admin/create-user/route.ts#L77-L79)
- [toggle-user-status/route.ts](file://app/api/admin/toggle-user-status/route.ts#L40)
- [link-parent-child/route.ts](file://app/api/admin/link-parent-child/route.ts#L43-L47)

## Data Transfer Objects and Sanitization
The Admin API employs the DTO (Data Transfer Object) pattern to ensure data sanitization and security.

### DTO Implementation
All GET endpoints transform database records into sanitized DTOs before response:
- Removal of sensitive fields
- Consistent field naming
- Data type enforcement
- Inclusion of computed properties (e.g., student_count)

This prevents accidental exposure of database implementation details and ensures consistent API responses.

### Pagination Implementation
List endpoints implement cursor-based pagination using Supabase's range() method:
- Client specifies page and limit/pageSize parameters
- Server calculates from/to indices
- Database query limited to requested range
- Total count returned for pagination controls

This approach is efficient and prevents excessive data transfer.

**Section sources**
- [get-users/route.ts](file://app/api/admin/get-users/route.ts#L40-L48)
- [classes/route.ts](file://app/api/admin/classes/route.ts#L64-L75)

## Frontend Integration
The Admin API is consumed by various frontend components that provide the administrative interface.

### Student Form Integration
The StudentForm component uses the create-user endpoint to create new student accounts. It collects comprehensive student information including:
- Basic information (name, birthdate, sex)
- Address information (current and permanent)
- Parent/guardian details
- Academic information (grade, section, enrollment status)
- DepEd-mandated fields (LRN, 4Ps beneficiary, indigenous status)
- Health information (disabilities, medical conditions)

The form implements client-side validation that complements the server-side validation in the API.

**Section sources**
- [student-form.tsx](file://components/student-form.tsx)
- [create-user/route.ts](file://app/api/admin/create-user/route.ts)

### Admin Session Guard
The AdminSessionGuard component wraps admin routes to enforce session security policies:
- 30-minute inactivity timeout
- 8-hour absolute session duration
- 2-minute warning before timeout
- Session extension capability
- Automatic logout on timeout

This enhances security by limiting the window of opportunity for session hijacking.

**Section sources**
- [admin-session-guard.tsx](file://components/admin-session-guard.tsx)