# Assignments API Endpoints

<cite>
**Referenced Files in This Document**   
- [route.ts](file://app/api/assignments/route.ts)
- [submit/route.ts](file://app/api/assignments/submit/route.ts)
- [grade/route.ts](file://app/api/assignments/grade/route.ts)
- [id]/route.ts](file://app/api/assignments/[id]/route.ts)
- [validation-schemas.ts](file://lib/validation-schemas.ts)
- [client.ts](file://lib/supabase/client.ts)
- [storage.ts](file://lib/supabase/storage.ts)
- [assignment-store.ts](file://lib/assignment-store.ts)
- [api-errors.ts](file://lib/api-errors.ts)
- [assignment-list.tsx](file://components/assignment-list.tsx)
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive API documentation for the assignment management system in the School-Management-System. It details all endpoints related to assignment creation, retrieval, submission, and grading. The system supports role-based access control for teachers, students, and administrators, with robust validation, file handling, and real-time capabilities through Supabase integration.

## Project Structure
The assignment management system is organized within the Next.js app directory structure, with API routes under `/app/api/assignments`. The system follows a modular architecture with clear separation between frontend components, backend API routes, and shared utilities.

```mermaid
graph TB
subgraph "Frontend Components"
A[assignment-list.tsx]
B[teacher-assignment-manager.tsx]
C[assignment-store.ts]
end
subgraph "API Endpoints"
D[GET /api/assignments]
E[POST /api/assignments]
F[GET /api/assignments/[id]]
G[POST /api/assignments/submit]
H[POST /api/assignments/grade]
end
subgraph "Backend Services"
I[Supabase Client]
J[Storage Service]
K[Validation Schemas]
end
A --> C
B --> C
C --> D
C --> E
C --> F
C --> G
C --> H
D --> I
E --> I
F --> I
G --> I
H --> I
G --> J
E --> K
G --> K
```

**Diagram sources**
- [assignment-list.tsx](file://components/assignment-list.tsx)
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx)
- [assignment-store.ts](file://lib/assignment-store.ts)
- [route.ts](file://app/api/assignments/route.ts)
- [submit/route.ts](file://app/api/assignments/submit/route.ts)
- [grade/route.ts](file://app/api/assignments/grade/route.ts)
- [client.ts](file://lib/supabase/client.ts)
- [storage.ts](file://lib/supabase/storage.ts)
- [validation-schemas.ts](file://lib/validation-schemas.ts)

**Section sources**
- [app/api/assignments](file://app/api/assignments)
- [components](file://components)
- [lib](file://lib)

## Core Components
The assignment management system consists of several core components that work together to provide a complete solution for educational assignments. These include API endpoints for CRUD operations, frontend components for user interaction, state management via Zustand store, and integration with Supabase for database and storage operations.

**Section sources**
- [route.ts](file://app/api/assignments/route.ts)
- [submit/route.ts](file://app/api/assignments/submit/route.ts)
- [grade/route.ts](file://app/api/assignments/grade/route.ts)
- [id]/route.ts](file://app/api/assignments/[id]/route.ts)
- [assignment-store.ts](file://lib/assignment-store.ts)

## Architecture Overview
The assignment management system follows a client-server architecture with Next.js API routes serving as the backend and React components forming the frontend. The system uses Supabase as the backend-as-a-service for database operations, authentication, and file storage.

```mermaid
graph TD
Client[Frontend Client] --> API[Next.js API Routes]
API --> Supabase[Supabase Backend]
Supabase --> DB[(PostgreSQL Database)]
Supabase --> Storage[(Supabase Storage)]
Supabase --> Auth[Authentication]
Client --> Store[assignment-store.ts]
Store --> API
API -.-> Realtime[Supabase Realtime]
style Client fill:#f9f,stroke:#333
style API fill:#bbf,stroke:#333
style Supabase fill:#f96,stroke:#333
style DB fill:#69f,stroke:#333
style Storage fill:#69f,stroke:#333
style Auth fill:#69f,stroke:#333
style Store fill:#9f9,stroke:#333
style Realtime fill:#ff6,stroke:#333
```

**Diagram sources**
- [client.ts](file://lib/supabase/client.ts)
- [route.ts](file://app/api/assignments/route.ts)
- [assignment-store.ts](file://lib/assignment-store.ts)

## Detailed Component Analysis

### Assignment API Endpoints
The assignment API provides comprehensive endpoints for managing assignments throughout their lifecycle, from creation to grading.

#### Assignment Creation and Retrieval
The main assignment endpoint supports both creation and retrieval of assignments with role-based access control.

```mermaid
sequenceDiagram
participant Student
participant Teacher
participant API
participant Supabase
Teacher->>API : POST /api/assignments
API->>API : Validate request origin
API->>API : Authenticate user
API->>API : Verify teacher/admin role
API->>API : Validate input with Zod schema
API->>Supabase : Insert assignment record
Supabase-->>API : Return created assignment
API-->>Teacher : 200 OK with assignment data
Student->>API : GET /api/assignments?classId=...
API->>API : Authenticate user
API->>API : Verify student role
API->>Supabase : Select published assignments
Supabase-->>API : Return assignments
API-->>Student : 200 OK with assignments array
```

**Diagram sources**
- [route.ts](file://app/api/assignments/route.ts#L68-L134)

#### Assignment Submission Flow
The submission endpoint handles student submissions with validation for enrollment, deadlines, and file security.

```mermaid
flowchart TD
Start([Student submits assignment]) --> ValidateAuth["Authenticate student"]
ValidateAuth --> CheckEnrollment["Verify student enrollment in class"]
CheckEnrollment --> CheckPublished["Verify assignment is published"]
CheckPublished --> CheckDuplicate["Check for existing submission"]
CheckDuplicate --> CheckDeadline["Evaluate submission deadline"]
CheckDeadline --> |On time| CreateSubmission["Create submission record"]
CheckDeadline --> |Late| CheckPolicy["Verify late submission policy"]
CheckPolicy --> |Allowed| CreateSubmission
CheckPolicy --> |Not allowed| ReturnError["Return 400: Late submissions not allowed"]
CreateSubmission --> HandleFiles["Process and validate file URLs"]
HandleFiles --> StoreFiles["Insert file records into submission_files"]
StoreFiles --> Complete["Return success response"]
style ReturnError fill:#f99,stroke:#333
```

**Diagram sources**
- [submit/route.ts](file://app/api/assignments/submit/route.ts#L39-L143)

#### Assignment Grading Process
The grading endpoint enables teachers to evaluate student submissions with proper authorization checks.

```mermaid
sequenceDiagram
participant Teacher
participant API
participant Supabase
Teacher->>API : POST /api/assignments/grade
API->>API : Authenticate user
API->>API : Verify teacher/admin role
API->>Supabase : Retrieve submission with assignment
Supabase-->>API : Return submission data
API->>API : Verify teacher owns assignment
API->>API : Validate score range
API->>Supabase : Update submission with score and feedback
Supabase-->>API : Return updated submission
API-->>Teacher : 200 OK with graded submission
```

**Diagram sources**
- [grade/route.ts](file://app/api/assignments/grade/route.ts#L5-L75)

#### Individual Assignment Management
The individual assignment endpoint supports retrieval, updating, and deletion of specific assignments.

```mermaid
classDiagram
class AssignmentAPI {
+GET /api/assignments/[id]
+PATCH /api/assignments/[id]
+DELETE /api/assignments/[id]
}
class Assignment {
+id : string
+title : string
+description : string
+class_id : string
+teacher_id : string
+due_date : string
+max_score : number
+allow_late_submission : boolean
+status : string
+created_at : string
+updated_at : string
}
class Submission {
+id : string
+assignment_id : string
+student_id : string
+comment : string
+status : string
+score : number
+feedback : string
+graded_at : string
+graded_by : string
+submitted_at : string
}
AssignmentAPI --> Assignment : "retrieves"
AssignmentAPI --> Submission : "retrieves"
Assignment --> Submission : "has many"
```

**Diagram sources**
- [id]/route.ts](file://app/api/assignments/[id]/route.ts#L5-L108)

### Frontend Components Analysis
The frontend components provide user interfaces for interacting with the assignment system, leveraging state management and API integration.

#### Student Assignment Interface
The student assignment list component displays assignments and enables submission functionality.

```mermaid
flowchart TD
A[StudentAssignmentList] --> B[Fetch assignments via store]
B --> C{Has assignments?}
C --> |No| D[Display empty state]
C --> |Yes| E[Display assignment cards]
E --> F{Has submission?}
F --> |No| G[Show submit button]
F --> |Yes| H[Show view button]
G --> I[Open submission dialog]
I --> J[Upload files and add comment]
J --> K[Submit to API]
K --> L[Update local store]
L --> M[Close dialog and refresh]
style D fill:#f9f,stroke:#333
style M fill:#9f9,stroke:#333
```

**Diagram sources**
- [assignment-list.tsx](file://components/assignment-list.tsx#L40-L271)

#### Teacher Assignment Management
The teacher assignment manager provides tools for creating assignments and grading submissions.

```mermaid
graph TD
A[TeacherAssignmentManager] --> B[Class selection]
B --> C[Create assignment button]
C --> D[Create assignment dialog]
D --> E[Input assignment details]
E --> F[Submit to API]
F --> G[Update local store]
G --> H[Display assignments]
H --> I[View submissions button]
I --> J[Submissions dialog]
J --> K[Grade button]
K --> L[Grade dialog]
L --> M[Enter score and feedback]
M --> N[Submit to API]
N --> O[Update local store]
style D fill:#f9f,stroke:#333
style J fill:#f9f,stroke:#333
style L fill:#f9f,stroke:#333
```

**Diagram sources**
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx#L52-L485)

### State Management System
The assignment store provides client-side state management for assignment data, synchronizing with the backend API.

```mermaid
classDiagram
class AssignmentStore {
+assignments : Assignment[]
+submissions : AssignmentSubmission[]
+createAssignment()
+updateAssignment()
+deleteAssignment()
+submitAssignment()
+gradeSubmission()
+getAssignmentsByClass()
+getSubmissionsByAssignment()
}
class Assignment {
+id : string
+title : string
+description : string
+classId : string
+className : string
+teacherId : string
+teacherName : string
+dueDate : string
+maxScore : number
+allowLateSubmission : boolean
+attachments : AssignmentAttachment[]
+status : AssignmentStatus
+createdAt : string
}
class AssignmentSubmission {
+id : string
+assignmentId : string
+studentId : string
+studentName : string
+submittedAt : string
+status : SubmissionStatus
+files : SubmissionFile[]
+comment? : string
+score? : number
+feedback? : string
+gradedAt? : string
+gradedBy? : string
}
AssignmentStore --> Assignment : "manages"
AssignmentStore --> AssignmentSubmission : "manages"
Assignment --> AssignmentSubmission : "contains"
```

**Diagram sources**
- [assignment-store.ts](file://lib/assignment-store.ts#L9-L174)

## Dependency Analysis
The assignment management system has a well-defined dependency structure that ensures separation of concerns and maintainability.

```mermaid
graph LR
A[assignment-list.tsx] --> B[assignment-store.ts]
C[teacher-assignment-manager.tsx] --> B
B --> D[Supabase Client]
D --> E[Supabase Backend]
F[API Routes] --> D
F --> G[Validation Schemas]
F --> H[API Error Handlers]
I[Storage Service] --> E
style A fill:#9f9,stroke:#333
style C fill:#9f9,stroke:#333
style B fill:#9f9,stroke:#333
style D fill:#bbf,stroke:#333
style E fill:#f96,stroke:#333
style F fill:#bbf,stroke:#333
style G fill:#f9f,stroke:#333
style H fill:#f9f,stroke:#333
style I fill:#bbf,stroke:#333
```

**Diagram sources**
- [assignment-list.tsx](file://components/assignment-list.tsx)
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx)
- [assignment-store.ts](file://lib/assignment-store.ts)
- [client.ts](file://lib/supabase/client.ts)
- [route.ts](file://app/api/assignments/route.ts)
- [validation-schemas.ts](file://lib/validation-schemas.ts)
- [api-errors.ts](file://lib/api-errors.ts)
- [storage.ts](file://lib/supabase/storage.ts)

**Section sources**
- [components](file://components)
- [lib](file://lib)
- [app/api/assignments](file://app/api/assignments)

## Performance Considerations
The assignment management system includes several performance optimizations to ensure responsiveness and scalability.

### Database Indexing
The system leverages database indexing on critical fields to optimize query performance:

- Index on `assignments.class_id` for efficient class-based filtering
- Index on `assignments.teacher_id` for teacher-specific queries
- Index on `assignments.due_date` for chronological sorting
- Index on `assignment_submissions.assignment_id` for submission retrieval
- Composite index on `class_students(class_id, student_id)` for enrollment checks

### File Upload Optimization
For large file uploads, the system implements the following optimizations:

- Client-side file validation to prevent unnecessary uploads
- Direct-to-storage uploads via Supabase to reduce server load
- File URL validation to ensure security without downloading files
- Progress tracking for user feedback during uploads
- Concurrent upload processing for multiple files

### Caching Strategy
The system employs a multi-layer caching strategy:

- Client-side state caching via Zustand store
- Supabase query caching for frequently accessed data
- Browser caching of static assets and API responses
- Real-time subscriptions to minimize polling

**Section sources**
- [supabase/migrations](file://supabase/migrations)
- [client.ts](file://lib/supabase/client.ts)
- [storage.ts](file://lib/supabase/storage.ts)
- [assignment-store.ts](file://lib/assignment-store.ts)

## Troubleshooting Guide
This section addresses common issues and edge cases in the assignment management system.

### Common Error Scenarios
The system handles various error conditions with appropriate responses:

```mermaid
flowchart TD
A[Error Scenarios] --> B[Unauthorized Access]
A --> C[Invalid Input]
A --> D[Resource Not Found]
A --> E[Forbidden Operations]
A --> F[Duplicate Submissions]
A --> G[Late Submissions]
A --> H[File Validation]
B --> I["401 Unauthorized: Missing or invalid authentication"]
C --> J["400 Bad Request: Invalid input data"]
D --> K["404 Not Found: Assignment or submission not found"]
E --> L["403 Forbidden: Insufficient permissions"]
F --> M["400 Bad Request: Already submitted"]
G --> N["400 Bad Request: Late submissions not allowed"]
H --> O["400 Bad Request: Invalid file URL or type"]
style I fill:#f99,stroke:#333
style J fill:#f99,stroke:#333
style K fill:#f99,stroke:#333
style L fill:#f99,stroke:#333
style M fill:#f99,stroke:#333
style N fill:#f99,stroke:#333
style O fill:#f99,stroke:#333
```

**Diagram sources**
- [api-errors.ts](file://lib/api-errors.ts)
- [route.ts](file://app/api/assignments/route.ts)
- [submit/route.ts](file://app/api/assignments/submit/route.ts)
- [grade/route.ts](file://app/api/assignments/grade/route.ts)

### Edge Case Handling
The system properly handles various edge cases:

- **Late submissions**: Checked against assignment policy and current time
- **Resubmissions**: Prevented by checking for existing submissions
- **Permission enforcement**: Verified at both API and database levels
- **Concurrent edits**: Handled by Supabase row-level security
- **Network failures**: Addressed with client-side retry logic
- **Large file uploads**: Managed through direct Supabase storage

**Section sources**
- [submit/route.ts](file://app/api/assignments/submit/route.ts)
- [grade/route.ts](file://app/api/assignments/grade/route.ts)
- [id]/route.ts](file://app/api/assignments/[id]/route.ts)
- [security.ts](file://lib/security.ts)

## Conclusion
The assignment management system in the School-Management-System provides a comprehensive solution for educational assignments with robust API endpoints, intuitive frontend components, and secure data handling. The system leverages Supabase for database operations, authentication, and file storage, while implementing proper role-based access control and validation. Key features include assignment creation and management, student submissions with file uploads, teacher grading, and real-time updates. The architecture follows best practices with clear separation of concerns, proper error handling, and performance optimizations for scalability.