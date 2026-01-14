# Academic Data API

<cite>
**Referenced Files in This Document**   
- [grades/route.ts](file://app/api/admin/grades/route.ts)
- [quizzes/route.ts](file://app/api/admin/quizzes/route.ts)
- [schedule/route.ts](file://app/api/admin/schedule/route.ts)
- [lessons/route.ts](file://app/api/admin/lessons/route.ts)
- [attendance/route.ts](file://app/api/admin/attendance/route.ts)
- [types.ts](file://lib/supabase/types.ts)
- [performance_indexes.sql](file://supabase/migrations/20260108_performance_indexes.sql)
- [cache.ts](file://lib/cache.ts)
- [rate-limit.ts](file://lib/rate-limit.ts)
- [assignment-list.tsx](file://components/assignment-list.tsx)
- [calendar-view.tsx](file://components/calendar-view.tsx)
- [queries-optimized.ts](file://lib/supabase/queries-optimized.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Endpoints](#api-endpoints)
3. [Query Parameters](#query-parameters)
4. [Response Format](#response-format)
5. [Data Aggregation and Joins](#data-aggregation-and-joins)
6. [RLS Policies and Security](#rls-policies-and-security)
7. [Frontend Integration](#frontend-integration)
8. [Performance Optimizations](#performance-optimizations)
9. [Error Handling](#error-handling)
10. [Security Measures](#security-measures)

## Introduction
The Academic Data API provides administrators with secure access to academic records including grades, quizzes, schedules, lessons, and attendance. These endpoints are designed to aggregate data from multiple related tables while enforcing strict Row Level Security (RLS) policies to ensure data isolation. The API supports filtering through query parameters and returns paginated responses for efficient data retrieval. This documentation details the implementation, integration, and security aspects of these endpoints.

## API Endpoints

The Academic Data API exposes the following GET endpoints for admin access:

- **GET /api/admin/grades**: Retrieves academic grades with student and class information
- **GET /api/admin/quizzes**: Retrieves quiz data including associated classes and teachers
- **GET /api/admin/schedule**: Retrieves class schedules with teacher assignments
- **GET /api/admin/lessons**: Retrieves lesson plans with associated materials
- **GET /api/admin/attendance**: Retrieves attendance records with student details

All endpoints require admin authentication and follow a consistent response pattern with error handling and data transformation.

**Section sources**
- [grades/route.ts](file://app/api/admin/grades/route.ts#L4-L57)
- [quizzes/route.ts](file://app/api/admin/quizzes/route.ts#L4-L39)
- [schedule/route.ts](file://app/api/admin/schedule/route.ts#L4-L40)
- [lessons/route.ts](file://app/api/admin/lessons/route.ts#L4-L39)
- [attendance/route.ts](file://app/api/admin/attendance/route.ts#L4-L49)

## Query Parameters

The Academic Data API supports various query parameters for filtering and data retrieval. While the current implementation focuses on retrieving all records with proper joins, the architecture supports filtering by:

- **Class ID**: Filter academic data by specific class
- **Date range**: Filter records within a specific date range
- **Student ID**: Filter data for a specific student
- **Pagination**: Control data volume with page and pageSize parameters

These parameters can be extended to support more granular filtering based on administrative needs.

```mermaid
flowchart TD
A["API Request"] --> B{Query Parameters}
B --> C["class_id: Filter by class"]
B --> D["student_id: Filter by student"]
B --> E["date_range: Filter by date"]
B --> F["page/pageSize: Pagination"]
C --> G["Filtered Response"]
D --> G
E --> G
F --> G
```

**Diagram sources**
- [queries-optimized.ts](file://lib/supabase/queries-optimized.ts#L9-L22)
- [grades/route.ts](file://app/api/admin/grades/route.ts#L24-L35)

## Response Format

The API returns paginated responses with a consistent structure across all endpoints. The response format is defined by types in lib/supabase/types.ts and follows a Data Transfer Object (DTO) pattern to ensure security and consistency.

```mermaid
classDiagram
class PaginatedResponse {
+data : T[]
+pagination : PaginationInfo
}
class PaginationInfo {
+page : number
+pageSize : number
+total : number
+totalPages : number
}
class GradeResponse {
+id : string
+student_id : string
+student_name : string
+class_id : string
+class_name : string
+subject : string
+score : number
+max_score : number
+percentage : number
+grade : number
+type : "exam"|"quiz"|"assignment"|"project"
+date : string
}
class AttendanceResponse {
+id : string
+student_id : string
+student_name : string
+class_id : string
+class_name : string
+date : string
+status : "present"|"absent"|"late"|"excused"
}
class QuizResponse {
+id : string
+title : string
+description : string
+duration : number
+due_date : string
+status : "draft"|"published"|"closed"
+class_id : string
+class_name : string
+teacher_name : string
+question_count : number
}
class LessonResponse {
+id : string
+title : string
+description : string
+class_id : string
+class_name : string
+teacher_name : string
+material_count : number
}
class ScheduleResponse {
+id : string
+day : string
+start_time : string
+end_time : string
+room : string
+class_name : string
+subject : string
+teacher_name : string
}
PaginatedResponse <|-- GradeResponse
PaginatedResponse <|-- AttendanceResponse
PaginatedResponse <|-- QuizResponse
PaginatedResponse <|-- LessonResponse
PaginatedResponse <|-- ScheduleResponse
```

**Diagram sources**
- [types.ts](file://lib/supabase/types.ts#L135-L155)
- [queries-optimized.ts](file://lib/supabase/queries-optimized.ts#L14-L22)

**Section sources**
- [types.ts](file://lib/supabase/types.ts#L135-L155)
- [grades/route.ts](file://app/api/admin/grades/route.ts#L37-L50)
- [attendance/route.ts](file://app/api/admin/attendance/route.ts#L35-L43)

## Data Aggregation and Joins

The Academic Data API endpoints aggregate data from multiple tables using Supabase's relational queries. Each endpoint performs joins to combine data from related tables, providing comprehensive information in a single response.

```mermaid
erDiagram
USERS ||--o{ GRADES : "student_id"
USERS ||--o{ ATTENDANCE_RECORDS : "student_id"
USERS ||--o{ QUIZZES : "teacher_id"
USERS ||--o{ LESSONS : "teacher_id"
USERS ||--o{ SCHEDULES : "teacher_id"
CLASSES ||--o{ GRADES : "class_id"
CLASSES ||--o{ ATTENDANCE_RECORDS : "class_id"
CLASSES ||--o{ QUIZZES : "class_id"
CLASSES ||--o{ LESSONS : "class_id"
CLASSES ||--o{ SCHEDULES : "class_id"
QUIZZES ||--o{ QUIZ_QUESTIONS : "quiz_id"
LESSONS ||--o{ LESSON_MATERIALS : "lesson_id"
USERS {
string id PK
string email
string name
string role
}
CLASSES {
string id PK
string name
string subject
string teacher_id FK
}
GRADES {
string id PK
string student_id FK
string class_id FK
number score
number max_score
number percentage
number grade
string type
string date
}
ATTENDANCE_RECORDS {
string id PK
string student_id FK
string class_id FK
string date
string status
}
QUIZZES {
string id PK
string title
string class_id FK
string teacher_id FK
string description
number duration
string due_date
string status
}
LESSONS {
string id PK
string title
string class_id FK
string teacher_id FK
string description
}
SCHEDULES {
string id PK
string class_id FK
string day
string start_time
string end_time
string room
}
```

**Diagram sources**
- [grades/route.ts](file://app/api/admin/grades/route.ts#L27-L31)
- [quizzes/route.ts](file://app/api/admin/quizzes/route.ts#L25-L30)
- [schedule/route.ts](file://app/api/admin/schedule/route.ts#L25-L31)
- [lessons/route.ts](file://app/api/admin/lessons/route.ts#L25-L30)
- [attendance/route.ts](file://app/api/admin/attendance/route.ts#L25-L29)

## RLS Policies and Security

The Academic Data API enforces strict Row Level Security (RLS) policies to ensure data isolation and prevent unauthorized access. All endpoints verify the admin role before processing requests, and the underlying database implements RLS at the table level.

```mermaid
sequenceDiagram
participant Admin as Admin User
participant API as API Endpoint
participant Supabase as Supabase
participant RLS as RLS Policy
Admin->>API : GET Request
API->>Supabase : Get User Auth
Supabase-->>API : User Data
API->>Supabase : Verify Admin Role
Supabase-->>API : Role Verification
API->>RLS : Query Data with Joins
RLS-->>API : Filtered Results
API->>Admin : Transformed Response
alt Unauthorized Access
API->>Admin : 401 Unauthorized
end
alt Forbidden Access
API->>Admin : 403 Forbidden
end
```

The RLS policies are implemented in the database migrations and ensure that:
- Only authenticated users can access data
- Admins have full access to academic records
- Data is properly isolated by user roles
- Sensitive information is protected

**Diagram sources**
- [grades/route.ts](file://app/api/admin/grades/route.ts#L13-L22)
- [security_hardening.sql](file://supabase/migrations/20250228_security_hardening.sql#L25-L32)
- [tighten_rls_policies.sql](file://supabase/migrations/20260107115657_tighten_rls_policies.sql#L1-L116)

**Section sources**
- [grades/route.ts](file://app/api/admin/grades/route.ts#L13-L22)
- [security_hardening.sql](file://supabase/migrations/20250228_security_hardening.sql#L25-L32)
- [secure_rls.sql](file://supabase/migrations/20240101000000_secure_rls.sql#L40-L43)

## Frontend Integration

The Academic Data API integrates with frontend components to provide a seamless user experience. Key components include assignment-list.tsx and calendar-view.tsx, which consume the API data and handle loading states and error conditions.

```mermaid
sequenceDiagram
participant Frontend as assignment-list.tsx
participant Store as Assignment Store
participant API as Academic Data API
participant Supabase as Supabase Backend
Frontend->>Store : Request Student Assignments
Store->>API : Fetch Data
API->>Supabase : Query Database
Supabase-->>API : Return Data
API-->>Store : Processed Response
Store-->>Frontend : Assignment Data
Frontend->>Frontend : Render UI
alt Loading State
Frontend->>Frontend : Show Skeleton
end
alt Error State
API-->>Frontend : Error Response
Frontend->>Frontend : Show Error Message
end
```

The integration includes:
- Loading states with skeleton screens
- Error handling with user-friendly messages
- Data caching to reduce API calls
- Type safety through TypeScript interfaces

**Diagram sources**
- [assignment-list.tsx](file://components/assignment-list.tsx#L46-L48)
- [calendar-view.tsx](file://components/calendar-view.tsx#L66-L86)

**Section sources**
- [assignment-list.tsx](file://components/assignment-list.tsx#L1-L271)
- [calendar-view.tsx](file://components/calendar-view.tsx#L1-L497)

## Performance Optimizations

The Academic Data API implements several performance optimizations to ensure fast response times and efficient database queries. These include database indexing, query optimization, and response caching.

```mermaid
flowchart TD
A["API Request"] --> B[Check Cache]
B --> C{Cached?}
C --> |Yes| D[Return Cached Data]
C --> |No| E[Execute Database Query]
E --> F[Apply Indexes]
F --> G[Optimize Joins]
G --> H[Transform Response]
H --> I[Cache Response]
I --> J[Return Data]
style D fill:#d4edda,stroke:#c3e6cb
style J fill:#d4edda,stroke:#c3e6cb
```

Key performance optimizations include:

- **Database Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Efficient joins and proper query structure
- **Response Caching**: In-memory and server-side caching
- **Pagination**: Limiting data volume in responses

The database indexes are defined in supabase/migrations/20260108_performance_indexes.sql and target key columns for academic data queries.

**Diagram sources**
- [performance_indexes.sql](file://supabase/migrations/20260108_performance_indexes.sql#L1-L104)
- [cache.ts](file://lib/cache.ts#L6-L39)

**Section sources**
- [performance_indexes.sql](file://supabase/migrations/20260108_performance_indexes.sql#L1-L104)
- [cache.ts](file://lib/cache.ts#L6-L39)
- [queries-optimized.ts](file://lib/supabase/queries-optimized.ts#L204-L227)

## Error Handling

The Academic Data API implements comprehensive error handling to provide meaningful feedback for various error conditions. Errors are handled at multiple levels including authentication, authorization, database queries, and response processing.

Common error responses include:
- **401 Unauthorized**: When the user is not authenticated
- **403 Forbidden**: When the user lacks admin privileges
- **500 Internal Server Error**: For unexpected server errors
- **400 Bad Request**: For invalid query parameters

The error handling follows a consistent pattern across all endpoints, with proper logging and user-friendly error messages.

**Section sources**
- [grades/route.ts](file://app/api/admin/grades/route.ts#L53-L56)
- [quizzes/route.ts](file://app/api/admin/quizzes/route.ts#L36-L38)
- [schedule/route.ts](file://app/api/admin/schedule/route.ts#L37-L39)

## Security Measures

The Academic Data API implements multiple security measures to protect sensitive academic data and prevent abuse. These include role-based access control, rate limiting, and secure data handling practices.

```mermaid
flowchart TD
A[API Request] --> B{Authentication}
B --> |Valid| C{Authorization}
B --> |Invalid| D[401 Unauthorized]
C --> |Admin| E[Process Request]
C --> |Not Admin| F[403 Forbidden]
E --> G{Rate Limit Check}
G --> |Within Limit| H[Execute Query]
G --> |Exceeded| I[429 Too Many Requests]
H --> J[Return Data]
style D fill:#f8d7da,stroke:#f5c6cb
style F fill:#f8d7da,stroke:#f5c6cb
style I fill:#f8d7da,stroke:#f5c6cb
```

Security measures include:
- **Role Verification**: All endpoints verify admin role
- **Rate Limiting**: Protection against bulk data export abuse
- **DTO Pattern**: Secure data transformation
- **RLS Policies**: Database-level data isolation

The rate limiting is implemented using the service role key to bypass RLS for the rate limiting table, ensuring reliable enforcement.

**Diagram sources**
- [rate-limit.ts](file://lib/rate-limit.ts#L25-L56)
- [grades/route.ts](file://app/api/admin/grades/route.ts#L13-L22)

**Section sources**
- [rate-limit.ts](file://lib/rate-limit.ts#L1-L56)
- [grades/route.ts](file://app/api/admin/grades/route.ts#L13-L22)
- [security_hardening.sql](file://supabase/migrations/20250228_security_hardening.sql#L1-L32)