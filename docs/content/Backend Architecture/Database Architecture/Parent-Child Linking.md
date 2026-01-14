# Parent-Child Linking

<cite>
**Referenced Files in This Document**   
- [20260105082250_create_parent_tables.sql](file://supabase/migrations/20260105082250_create_parent_tables.sql)
- [link-parent-child/route.ts](file://app/api/admin/link-parent-child/route.ts)
- [unlink-parent-child/route.ts](file://app/api/admin/unlink-parent-child/route.ts)
- [children/route.ts](file://app/api/parent/children/route.ts)
- [child/[id]/grades/route.ts](file://app/api/parent/child/[id]/grades/route.ts)
- [child/[id]/attendance/route.ts](file://app/api/parent/child/[id]/attendance/route.ts)
- [parents/page.tsx](file://app/admin/parents/page.tsx)
- [parent-store.ts](file://lib/parent-store.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Parent-Children Junction Table](#parent-children-junction-table)
3. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
4. [API Endpoints for Linking and Unlinking](#api-endpoints-for-linking-and-unlinking)
5. [Parent Dashboard Data Access](#parent-dashboard-data-access)
6. [Security Considerations](#security-considerations)

## Introduction
The parent-child linking system enables parents to access their children's academic information while maintaining strict data isolation and security. This document details the implementation of the parent_children junction table, RLS policies, API endpoints, and security mechanisms that govern this relationship in the school management system.

## Parent-Children Junction Table
The parent_children table serves as a junction table that establishes relationships between parent accounts and student accounts. This table uses foreign keys to reference the users table for both parents and students, ensuring referential integrity.

```mermaid
erDiagram
parent_children {
UUID id PK
UUID parent_id FK
UUID student_id FK
TEXT relationship
TIMESTAMPTZ created_at
}
users {
UUID id PK
TEXT name
TEXT email
TEXT role
}
parent_children ||--|| users : "parent_id references users.id"
parent_children ||--|| users : "student_id references users.id"
```

**Diagram sources**
- [20260105082250_create_parent_tables.sql](file://supabase/migrations/20260105082250_create_parent_tables.sql#L6-L13)

**Section sources**
- [20260105082250_create_parent_tables.sql](file://supabase/migrations/20260105082250_create_parent_tables.sql#L6-L13)

### Table Structure
The parent_children table contains the following columns:
- **id**: Primary key (UUID) with default generation
- **parent_id**: Foreign key referencing users(id) with ON DELETE CASCADE
- **student_id**: Foreign key referencing users(id) with ON DELETE CASCADE
- **relationship**: Text field with default value 'guardian' and constraint allowing only 'mother', 'father', 'guardian', or 'other'
- **created_at**: Timestamp with default value of current time
- **UNIQUE constraint** on (parent_id, student_id) to prevent duplicate relationships

The table also includes indexes on parent_id and student_id columns to optimize query performance for relationship lookups.

## Row Level Security (RLS) Policies
The system implements Row Level Security (RLS) policies to enforce data access controls based on user roles and relationships. These policies ensure that data isolation is maintained at the database level.

```mermaid
graph TD
A[User Request] --> B{User Role}
B --> |Admin| C[Full Access to parent_children]
B --> |Parent| D[Access to Own Children Only]
B --> |Student| E[No Access to parent_children]
C --> F[Can Manage All Relationships]
D --> G[Can View Own Children's Data]
E --> H[Unaware of Parent Links]
```

**Diagram sources**
- [20260105082250_create_parent_tables.sql](file://supabase/migrations/20260105082250_create_parent_tables.sql#L19-L48)

**Section sources**
- [20260105082250_create_parent_tables.sql](file://supabase/migrations/20260105082250_create_parent_tables.sql#L19-L48)

### Policy Details
The following RLS policies are implemented:

1. **"Parents can view their own children"**: Allows parents to SELECT from parent_children table only when parent_id matches their authenticated user ID (auth.uid())
2. **"Admin can manage all parent-child relationships"**: Grants administrators full access (FOR ALL) to the parent_children table
3. **Data access policies**: Enable parents to view their children's grades, attendance, and class enrollments through EXISTS subqueries that verify the parent-child relationship

These policies ensure that parents can only access data for students they are linked to, while students have no visibility into parent linking information.

## API Endpoints for Linking and Unlinking
The system provides API endpoints for managing parent-child relationships, with validation to prevent unauthorized access and circular references.

### Linking Endpoint
The POST /api/admin/link-parent-child endpoint allows administrators to create parent-child relationships.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant API as "link-parent-child API"
participant DB as "Database"
Admin->>API : POST /api/admin/link-parent-child
API->>API : Authenticate Admin
API->>API : Validate parentId and studentId
API->>DB : INSERT into parent_children
DB-->>API : Success or Error
API-->>Admin : {success : true} or Error
```

**Diagram sources**
- [link-parent-child/route.ts](file://app/api/admin/link-parent-child/route.ts#L4-L61)

**Section sources**
- [link-parent-child/route.ts](file://app/api/admin/link-parent-child/route.ts#L4-L61)

### Unlinking Endpoint
The POST /api/admin/unlink-parent-child endpoint allows administrators to remove parent-child relationships.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant API as "unlink-parent-child API"
participant DB as "Database"
Admin->>API : POST /api/admin/unlink-parent-child
API->>API : Authenticate Admin
API->>API : Validate parentId and studentId
API->>DB : DELETE from parent_children
DB-->>API : Success or Error
API-->>Admin : {success : true} or Error
```

**Diagram sources**
- [unlink-parent-child/route.ts](file://app/api/admin/unlink-parent-child/route.ts#L4-L51)

**Section sources**
- [unlink-parent-child/route.ts](file://app/api/admin/unlink-parent-child/route.ts#L4-L51)

### Validation and Error Handling
Both endpoints include validation to ensure:
- The requesting user is authenticated
- The requesting user has admin role
- Both parentId and studentId are provided
- The relationship does not already exist (for linking)
- Appropriate error responses are returned for validation failures or database errors

The linking endpoint specifically handles the unique constraint violation (error code "23505") to prevent duplicate relationships.

## Parent Dashboard Data Access
Parent dashboards fetch child data through the parent_children relationship, with data isolation maintained through RLS policies and API validation.

### Children Data Endpoint
The GET /api/parent/children endpoint retrieves a parent's linked children with their basic information.

```mermaid
flowchart TD
A[Parent Request] --> B[Authenticate Parent]
B --> C[Verify Role is Parent]
C --> D[Query parent_children]
D --> E[Join with users table]
E --> F[Get student profiles]
F --> G[Combine data]
G --> H[Return children list]
```

**Diagram sources**
- [children/route.ts](file://app/api/parent/children/route.ts#L5-L74)

**Section sources**
- [children/route.ts](file://app/api/parent/children/route.ts#L5-L74)

### Child Data Endpoints
Specific endpoints allow parents to access their children's academic data:

1. **Grades**: GET /api/parent/child/[id]/grades
2. **Attendance**: GET /api/parent/child/[id]/attendance

Both endpoints follow a similar pattern:
1. Authenticate the parent user
2. Verify the user has parent role
3. Validate the parent-child relationship exists
4. Fetch the requested data with appropriate joins
5. Return the data to the parent

```mermaid
sequenceDiagram
participant Parent as "Parent User"
participant API as "Child Data API"
participant DB as "Database"
Parent->>API : GET /api/parent/child/{id}/data
API->>API : Authenticate Parent
API->>API : Verify Parent Role
API->>DB : Check parent_children relationship
DB-->>API : Relationship Exists
API->>DB : Query requested data
DB-->>API : Data
API-->>Parent : Return data
```

**Diagram sources**
- [child/[id]/grades/route.ts](file://app/api/parent/child/[id]/grades/route.ts#L5-L61)
- [child/[id]/attendance/route.ts](file://app/api/parent/child/[id]/attendance/route.ts#L6-L79)

**Section sources**
- [child/[id]/grades/route.ts](file://app/api/parent/child/[id]/grades/route.ts#L5-L61)
- [child/[id]/attendance/route.ts](file://app/api/parent/child/[id]/attendance/route.ts#L6-L79)

## Security Considerations
The parent-child linking system incorporates several security measures to protect student data and prevent unauthorized access.

### Audit Logging
While not explicitly shown in the analyzed files, the system's architecture includes audit logging capabilities through the audit_logs_with_users view and related utilities. This allows tracking of administrative actions related to parent-child linking for compliance and security monitoring.

### Data Isolation
The system maintains strict data isolation through:
- RLS policies that restrict data access based on relationships
- API-level validation of parent-child relationships
- Role-based access control
- The fact that students have no awareness of parent links to their accounts

### Prevention of Unauthorized Access
The system prevents unauthorized access to student records through:
- Authentication and role verification on all endpoints
- Explicit validation of parent-child relationships before data access
- Use of UUIDs for identifiers to prevent enumeration attacks
- Error messages that do not reveal the existence of records to unauthorized users

### Client-Side Security
The parent-store.ts file implements a client-side store that manages parent-child relationships in the frontend application, ensuring that only authorized data is displayed to parents.

```mermaid
classDiagram
class ParentStore {
+parents : Parent[]
+parentChildLinks : ParentChildLink[]
+getParent(parentId : string) : Parent | undefined
+getParentByEmail(email : string) : Parent | undefined
+getChildrenIds(parentId : string) : string[]
+getParentsForStudent(studentId : string) : Parent[]
+canViewStudent(parentId : string, studentId : string) : boolean
}
class Parent {
+id : string
+name : string
+email : string
+phone : string
+avatar? : string
+address? : string
+childrenIds : string[]
}
class ParentChildLink {
+parentId : string
+studentId : string
+relationship : ParentRelationship
}
ParentStore --> Parent : "contains"
ParentStore --> ParentChildLink : "contains"
```

**Diagram sources**
- [parent-store.ts](file://lib/parent-store.ts#L1-L65)

**Section sources**
- [parent-store.ts](file://lib/parent-store.ts#L1-L65)

The canViewStudent method in the ParentStore ensures that client-side access to student data is consistent with server-side authorization rules.