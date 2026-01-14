# Assignments Workflow

<cite>
**Referenced Files in This Document**   
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql)
- [20260108112143_performance_indexes.sql](file://supabase/migrations/20260108112143_performance_indexes.sql)
- [create-quiz/route.ts](file://app/api/teacher/create-quiz/route.ts)
- [submit/route.ts](file://app/api/assignments/submit/route.ts)
- [grade/route.ts](file://app/api/assignments/grade/route.ts)
- [page.tsx](file://app/student/assignments/page.tsx)
- [page.tsx](file://app/teacher/assignments/page.tsx)
- [database.types.ts](file://lib/database.types.ts)
- [database-helpers.ts](file://lib/database-helpers.ts)
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Database Schema](#database-schema)
3. [Assignment Lifecycle](#assignment-lifecycle)
4. [Role-Based Access Control](#role-based-access-control)
5. [Submission Workflow](#submission-workflow)
6. [Grading Workflow](#grading-workflow)
7. [Performance Optimization](#performance-optimization)
8. [Frontend Implementation](#frontend-implementation)
9. [Conclusion](#conclusion)

## Introduction
The Assignments Workflow in the School Management System provides a comprehensive solution for managing academic assignments throughout their lifecycle. This documentation details the complete workflow from assignment creation to submission and grading, covering the database schema, access controls, business logic, and user interfaces. The system supports teachers in creating and managing assignments while enabling students to submit their work and receive feedback.

## Database Schema

### Assignments Table
The assignments table serves as the central entity for managing academic assignments with the following schema:

```mermaid
erDiagram
assignments {
uuid id PK
string title
text description
uuid class_id FK
uuid teacher_id FK
date due_date
integer max_score
boolean allow_late_submission
string status
timestamp created_at
timestamp updated_at
}
assignments ||--o{ assignment_attachments : "has"
assignments ||--o{ assignment_submissions : "receives"
assignments }o--|| classes : "belongs to"
assignments }o--|| users : "created by"
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L2-L14)
- [database.types.ts](file://lib/database.types.ts#L157-L196)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L2-L14)
- [database.types.ts](file://lib/database.types.ts#L157-L196)

### Assignment Attachments Table
The assignment_attachments table stores supporting materials for assignments with the following structure:

```mermaid
erDiagram
assignment_attachments {
uuid id PK
uuid assignment_id FK
string name
string type
string url
string size
timestamp created_at
}
assignment_attachments }o--|| assignments : "belongs to"
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L17-L25)
- [database.types.ts](file://lib/database.types.ts#L58-L85)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L17-L25)
- [database.types.ts](file://lib/database.types.ts#L58-L85)

### Assignment Submissions Table
The assignment_submissions table tracks student submissions with comprehensive status tracking:

```mermaid
erDiagram
assignment_submissions {
uuid id PK
uuid assignment_id FK
uuid student_id FK
timestamp submitted_at
string status
text comment
integer score
text feedback
timestamp graded_at
uuid graded_by FK
}
assignment_submissions }o--|| assignments : "for"
assignment_submissions }o--|| users : "submitted by"
assignment_submissions }o--|| users : "graded by"
assignment_submissions ||--o{ submission_files : "contains"
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L28-L40)
- [database.types.ts](file://lib/database.types.ts#L96-L155)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L28-L40)
- [database.types.ts](file://lib/database.types.ts#L96-L155)

### Submission Files Table
The submission_files table manages uploaded student work with secure access controls:

```mermaid
erDiagram
submission_files {
uuid id PK
uuid submission_id FK
string name
string type
string url
string size
timestamp created_at
}
submission_files }o--|| assignment_submissions : "belongs to"
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L43-L51)
- [database.types.ts](file://lib/database.types.ts#L133-L155)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L43-L51)
- [database.types.ts](file://lib/database.types.ts#L133-L155)

## Assignment Lifecycle

### Status Transitions
The assignment lifecycle is managed through a state machine with three primary states:

```mermaid
stateDiagram-v2
[*] --> draft
draft --> published : "Publish"
published --> closed : "Close"
closed --> [*]
note right of draft
Initial state when created
Only visible to teacher
end note
note right of published
Visible to enrolled students
Accepts submissions
end note
note right of closed
No new submissions accepted
Grading still possible
end note
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L11)
- [database.types.ts](file://lib/database.types.ts#L166)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L11)
- [database.types.ts](file://lib/database.types.ts#L166)

### Creation Process
The assignment creation process follows a structured workflow:

```mermaid
sequenceDiagram
participant Teacher as "Teacher"
participant Frontend as "Frontend UI"
participant API as "API Endpoint"
participant Database as "Database"
Teacher->>Frontend : Fill assignment details
Frontend->>API : POST /api/assignments
API->>API : Validate user role (teacher/admin)
API->>API : Validate input data
API->>Database : Insert into assignments table
Database-->>API : Return assignment ID
API->>Database : Insert attachments (if any)
Database-->>API : Success
API-->>Frontend : Return success response
Frontend-->>Teacher : Show success message
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L68-L75)
- [database.types.ts](file://lib/database.types.ts#L171-L183)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L68-L75)
- [database.types.ts](file://lib/database.types.ts#L171-L183)

## Role-Based Access Control

### Row Level Security Policies
The system implements comprehensive Row Level Security (RLS) policies to enforce role-based access:

```mermaid
classDiagram
class RLS_Policies {
+Teachers can manage their assignments
+Students can view published assignments
+Teachers can manage attachments
+Students can submit and view submissions
+Teachers can view and grade submissions
+Users can view their own submission files
+Students can upload submission files
}
RLS_Policies --> assignments : "applied to"
RLS_Policies --> assignment_attachments : "applied to"
RLS_Policies --> assignment_submissions : "applied to"
RLS_Policies --> submission_files : "applied to"
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L59-L116)
- [database.types.ts](file://lib/database.types.ts#L197-L212)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L59-L116)
- [database.types.ts](file://lib/database.types.ts#L197-L212)

### Access Matrix
The following table summarizes the access permissions for different user roles:

| Resource | Teacher Access | Student Access | Admin Access |
|---------|---------------|---------------|-------------|
| **Create Assignment** | Yes | No | Yes |
| **View Own Assignments** | Yes | Draft: No<br>Published: Yes | Yes |
| **Manage Attachments** | Yes | View Only | Yes |
| **Submit Assignment** | No | Yes | No |
| **View Submissions** | Own Students: Yes<br>Others: No | Own: Yes<br>Others: No | Yes |
| **Grade Submissions** | Yes | No | Yes |
| **View Submission Files** | Yes | Own: Yes<br>Others: No | Yes |

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L59-L116)
- [database.types.ts](file://lib/database.types.ts#L197-L212)

## Submission Workflow

### Submission Process
The student submission workflow ensures data integrity and proper validation:

```mermaid
sequenceDiagram
participant Student as "Student"
participant Frontend as "Frontend UI"
participant API as "API Endpoint"
participant Database as "Database"
Student->>Frontend : Select assignment
Frontend->>API : GET /api/assignments/{id}
API->>Database : Verify assignment exists and is published
Database-->>API : Return assignment data
API-->>Frontend : Return assignment details
Frontend->>Student : Display assignment
Student->>Frontend : Upload files and add comment
Frontend->>API : POST /api/assignments/submit
API->>API : Validate user role (student)
API->>API : Verify enrollment in class
API->>API : Check for existing submission
API->>API : Determine if late submission
API->>Database : Insert into assignment_submissions
Database-->>API : Return submission ID
API->>Database : Insert submission_files (if any)
Database-->>API : Success
API-->>Frontend : Return success response
Frontend-->>Student : Show submission confirmation
```

**Diagram sources**
- [submit/route.ts](file://app/api/assignments/submit/route.ts#L40-L138)
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L86-L87)

**Section sources**
- [submit/route.ts](file://app/api/assignments/submit/route.ts#L40-L138)
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L86-L87)

### Late Submission Logic
The system implements flexible late submission handling based on assignment configuration:

```mermaid
flowchart TD
Start([Submission Attempt]) --> CheckPublished["Verify Assignment Published?"]
CheckPublished --> |No| Reject["Reject Submission"]
CheckPublished --> |Yes| CheckEnrollment["Verify Student Enrollment?"]
CheckEnrollment --> |No| Reject
CheckEnrollment --> |Yes| CheckExisting["Check Existing Submission?"]
CheckExisting --> |Yes| Reject
CheckExisting --> |No| CheckDueDate["Is Current Date > Due Date?"]
CheckDueDate --> |No| MarkSubmitted["Mark as 'submitted'"]
CheckDueDate --> |Yes| CheckLateAllowed["Is Late Submission Allowed?"]
CheckLateAllowed --> |No| Reject
CheckLateAllowed --> |Yes| MarkLate["Mark as 'late'"]
MarkSubmitted --> Complete([Submission Complete])
MarkLate --> Complete
Reject --> Error([Error Response])
```

**Diagram sources**
- [submit/route.ts](file://app/api/assignments/submit/route.ts#L105-L108)
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L33)

**Section sources**
- [submit/route.ts](file://app/api/assignments/submit/route.ts#L105-L108)
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L33)

## Grading Workflow

### Grading Process
The grading workflow enables teachers to evaluate student submissions efficiently:

```mermaid
sequenceDiagram
participant Teacher as "Teacher"
participant Frontend as "Frontend UI"
participant API as "API Endpoint"
participant Database as "Database"
Teacher->>Frontend : Open grading interface
Frontend->>API : GET /api/assignments
API->>Database : Filter assignments by teacher
Database-->>API : Return teacher's assignments
API-->>Frontend : Return assignments
Frontend->>API : GET /api/submissions?assignmentId={id}
API->>Database : Verify teacher owns assignment
Database-->>API : Return submissions
API-->>Frontend : Return submissions
Frontend->>Teacher : Display submissions to grade
Teacher->>Frontend : Enter score and feedback
Frontend->>API : POST /api/assignments/grade
API->>API : Validate user role (teacher/admin)
API->>API : Verify teacher owns assignment
API->>Database : Update assignment_submissions
Database-->>API : Success
API-->>Frontend : Return success response
Frontend-->>Teacher : Show grading confirmation
```

**Diagram sources**
- [grade/route.ts](file://app/api/assignments/grade/route.ts#L5-L42)
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx#L111-L123)

**Section sources**
- [grade/route.ts](file://app/api/assignments/grade/route.ts#L5-L42)
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx#L111-L123)

### Submission Status Transitions
The submission status evolves through the grading process:

```mermaid
stateDiagram-v2
[*] --> pending
pending --> submitted : "Student submits"
submitted --> graded : "Teacher grades"
submitted --> late : "Late submission"
late --> graded : "Teacher grades"
graded --> [*]
note right of pending
Initial state
Assignment created but not submitted
end note
note right of submitted
On-time submission
Awaiting grading
end note
note right of late
Late submission
Awaiting grading
end note
note right of graded
Grading completed
Score and feedback provided
end note
```

**Diagram sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L33)
- [database.types.ts](file://lib/database.types.ts#L105)

**Section sources**
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L33)
- [database.types.ts](file://lib/database.types.ts#L105)

## Performance Optimization

### Database Indexing Strategy
The system implements targeted indexing to optimize query performance:

```mermaid
erDiagram
assignments {
uuid id PK
string title
uuid class_id FK
uuid teacher_id FK
date due_date
string status
}
assignment_submissions {
uuid id PK
uuid assignment_id FK
uuid student_id FK
timestamp submitted_at
string status
}
assignments ||--o{ assignment_submissions : "1:N"
classIndex["idx_assignments_class_due(class_id, due_date DESC)"]
teacherIndex["idx_assignments_teacher(teacher_id, created_at DESC)"]
submissionAssignmentIndex["idx_submissions_assignment(assignment_id, submitted_at DESC)"]
submissionStudentIndex["idx_submissions_student(student_id, submitted_at DESC)"]
assignments --> classIndex
assignments --> teacherIndex
assignment_submissions --> submissionAssignmentIndex
assignment_submissions --> submissionStudentIndex
```

**Diagram sources**
- [20260108112143_performance_indexes.sql](file://supabase/migrations/20260108112143_performance_indexes.sql#L58-L63)
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L119-L122)

**Section sources**
- [20260108112143_performance_indexes.sql](file://supabase/migrations/20260108112143_performance_indexes.sql#L58-L63)
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L119-L122)

### Index Usage Scenarios
The following table outlines the primary use cases for each index:

| Index Name | Columns | Primary Use Case | Query Pattern |
|------------|--------|------------------|---------------|
| idx_assignments_class_due | class_id, due_date DESC | Student assignment listing | Get assignments for a specific class ordered by due date |
| idx_assignments_teacher | teacher_id, created_at DESC | Teacher assignment management | Get assignments created by a specific teacher ordered by creation date |
| idx_submissions_assignment | assignment_id, submitted_at DESC | Assignment grading | Get all submissions for a specific assignment ordered by submission time |
| idx_submissions_student | student_id, submitted_at DESC | Student submission history | Get all submissions by a specific student ordered by submission time |

**Section sources**
- [20260108112143_performance_indexes.sql](file://supabase/migrations/20260108112143_performance_indexes.sql#L58-L63)
- [20260105082224_create_assignments_table.sql](file://supabase/migrations/20260105082224_create_assignments_table.sql#L119-L122)

## Frontend Implementation

### Student Assignment Interface
The student assignment interface provides a streamlined experience for viewing and submitting assignments:

```mermaid
flowchart TD
A[Student Dashboard] --> B[Assignments Page]
B --> C{Filter by Class}
C --> D[Assignment List]
D --> E{Assignment Status}
E --> |Draft| F[Not Visible]
E --> |Published| G[View Details]
G --> H{Submitted?}
H --> |No| I[Submit Assignment]
H --> |Yes| J[View Submission]
I --> K[Upload Files]
K --> L[Add Comment]
L --> M[Submit]
M --> N[Confirmation]
```

**Diagram sources**
- [page.tsx](file://app/student/assignments/page.tsx#L9-L67)
- [assignment-list.tsx](file://components/assignment-list.tsx)

**Section sources**
- [page.tsx](file://app/student/assignments/page.tsx#L9-L67)

### Teacher Assignment Management
The teacher interface enables comprehensive assignment management and grading:

```mermaid
flowchart TD
A[Teacher Dashboard] --> B[Assignments Manager]
B --> C{Select Class}
C --> D[Tabs]
D --> E[Create Assignment]
D --> F[Manage Assignments]
D --> G[Grade Submissions]
E --> H[Fill Details]
H --> I[Set Due Date]
I --> J[Add Attachments]
J --> K[Save as Draft/Publish]
F --> L{Assignment Status}
L --> |Draft| M[Edit/Publish]
L --> |Published| N[Close/Grade]
L --> |Closed| O[View Only]
G --> P{Submission Status}
P --> |Submitted| Q[Grade]
P --> |Late| R[Grade]
Q --> S[Enter Score]
S --> T[Add Feedback]
T --> U[Submit Grade]
```

**Diagram sources**
- [page.tsx](file://app/teacher/assignments/page.tsx)
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx#L52-L378)

**Section sources**
- [teacher-assignment-manager.tsx](file://components/teacher-assignment-manager.tsx#L52-L378)

## Conclusion
The Assignments Workflow in the School Management System provides a robust and secure solution for managing academic assignments. The system's architecture combines a well-designed database schema with comprehensive Row Level Security policies to ensure proper access control. The workflow supports the complete lifecycle of assignments from creation to grading, with special attention to performance optimization through strategic indexing. Teachers can efficiently create and manage assignments while students can submit their work with confidence in the system's reliability. The implementation demonstrates best practices in web application development, including proper input validation, role-based access control, and efficient data retrieval patterns.