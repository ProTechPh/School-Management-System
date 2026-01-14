# Users Table and Role-Based Access

<cite>
**Referenced Files in This Document**   
- [20251219043432_create_users_table.sql](file://supabase/migrations/20251219043432_create_users_table.sql)
- [20240101000000_secure_rls.sql](file://supabase/migrations/20240101000000_secure_rls.sql)
- [20250223_strict_rls.sql](file://supabase/migrations/20250223_strict_rls.sql)
- [20251219084313_add_is_active_column.sql](file://supabase/migrations/20251219084313_add_is_active_column.sql)
- [20251219084551_add_must_change_password_column.sql](file://supabase/migrations/20251219084551_add_must_change_password_column.sql)
- [20260105000003_create_parent_tables.sql](file://supabase/migrations/20260105000003_create_parent_tables.sql)
- [create-user/route.ts](file://app/api/admin/create-user/route.ts)
- [toggle-user-status/route.ts](file://app/api/admin/toggle-user-status/route.ts)
- [me/route.ts](file://app/api/auth/me/route.ts)
- [database.types.ts](file://lib/database.types.ts)
- [secure_rls.sql](file://supabase/migrations/20240101000000_secure_rls.sql)
- [strict_rls.sql](file://supabase/migrations/20250223_strict_rls.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Users Table Structure](#users-table-structure)
3. [Core Security Mechanisms](#core-security-mechanisms)
4. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
5. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
6. [User Status Management](#user-status-management)
7. [Parent-Child Relationships](#parent-child-relationships)
8. [API Integration and Application Logic](#api-integration-and-application-logic)
9. [Security Considerations](#security-considerations)
10. [Data Model Diagram](#data-model-diagram)

## Introduction
This document provides comprehensive documentation for the users table and its associated role-based access control system in the School Management System. The system implements a robust security model using Supabase's Row Level Security (RLS) policies, UUID primary keys, and role-based permissions to ensure data privacy and appropriate access control across different user types including administrators, teachers, students, and parents.

**Section sources**
- [20251219043432_create_users_table.sql](file://supabase/migrations/20251219043432_create_users_table.sql)
- [20240101000000_secure_rls.sql](file://supabase/migrations/20240101000000_secure_rls.sql)

## Users Table Structure
The users table serves as the central identity store for the application, containing core user information with a focus on security and extensibility. The table uses UUIDs as primary keys to prevent enumeration attacks and ensure global uniqueness.

Key fields include:
- **id**: UUID primary key, defaulting to `gen_random_uuid()`
- **email**: Unique text field, required for authentication
- **name**: Full name of the user
- **role**: Text field constrained to specific values: 'admin', 'teacher', 'student', or 'parent'
- **is_active**: Boolean flag enabling soft-deletion and user deactivation
- **must_change_password**: Boolean flag enforcing password change on first login
- **avatar**: URL reference to profile image
- **phone** and **address**: Contact information
- **created_at** and **updated_at**: Timestamps for record tracking

The table is linked to role-specific profiles through foreign key relationships, with `student_profiles` and `teacher_profiles` tables referencing the users table via the id field.

**Section sources**
- [20251219043432_create_users_table.sql](file://supabase/migrations/20251219043432_create_users_table.sql)
- [database.types.ts](file://lib/database.types.ts)

## Core Security Mechanisms
The system implements multiple layers of security to protect user data and ensure proper access control. The foundation of this security model is built on UUID primary keys, which provide several advantages over sequential integer IDs:

- **Unpredictability**: UUIDs cannot be easily guessed or enumerated, preventing unauthorized access through ID manipulation
- **Global Uniqueness**: Eliminates conflicts when merging data from different sources
- **Security**: Prevents information leakage about the total number of users or creation patterns

Two critical security columns are implemented:
- **is_active**: Enables soft-deletion functionality, allowing users to be deactivated without permanently removing their data and associated records
- **must_change_password**: Forces new users to change their password upon first login, enhancing security for system-generated passwords

These mechanisms work together to provide a secure foundation for user management while maintaining data integrity.

**Section sources**
- [20251219043432_create_users_table.sql](file://supabase/migrations/20251219043432_create_users_table.sql)
- [20251219084313_add_is_active_column.sql](file://supabase/migrations/20251219084313_add_is_active_column.sql)
- [20251219084551_add_must_change_password_column.sql](file://supabase/migrations/20251219084551_add_must_change_password_column.sql)

## Role-Based Access Control (RBAC)
The system implements a comprehensive role-based access control model with four distinct roles: admin, teacher, student, and parent. Each role has specific permissions and access patterns defined through database policies and application logic.

The role field in the users table is constrained by a CHECK constraint to ensure only valid role values are stored. This constraint was updated to include the 'parent' role, expanding the system's capabilities to support family connections.

Access patterns are designed to follow the principle of least privilege:
- **Admins**: Have broad access to manage users and system settings
- **Teachers**: Can view student information and manage academic records
- **Students**: Can access their own data and submit assignments
- **Parents**: Can view their children's academic performance and attendance

This hierarchical structure ensures that users can only access information appropriate to their role in the educational ecosystem.

**Section sources**
- [20251219043432_create_users_table.sql](file://supabase/migrations/20251219043432_create_users_table.sql)
- [20260105000003_create_parent_tables.sql](file://supabase/migrations/20260105000003_create_parent_tables.sql)

## Row Level Security (RLS) Policies
Row Level Security (RLS) is the cornerstone of the application's data protection strategy. Multiple policy files implement a layered security approach, with policies evolving through the system's migration history.

Key RLS policies include:
- **User Self-Access**: Users can view and update their own profile information
- **Admin Access**: Administrators can view all users and manage system settings
- **Teacher Access**: Teachers can view student profiles and academic records
- **Parent Access**: Parents can view their children's grades, attendance, and class enrollments through relationship-based policies

The system uses both permissive and restrictive policies. For example, the "Admins can view all users" policy allows administrators to see all user records, while the "Teachers can view students" policy restricts teachers to only viewing student accounts.

Policies are implemented in multiple migration files, with `secure_rls.sql` establishing the initial policy framework and subsequent files like `strict_rls.sql` and `security_hardening.sql` refining and tightening security constraints over time.

**Section sources**
- [20240101000000_secure_rls.sql](file://supabase/migrations/20240101000000_secure_rls.sql)
- [20250223_strict_rls.sql](file://supabase/migrations/20250223_strict_rls.sql)
- [20250228_security_hardening.sql](file://supabase/migrations/20250228_security_hardening.sql)

## User Status Management
User status is managed through two key mechanisms: the `is_active` column and dedicated API endpoints that enforce administrative privileges.

The `is_active` column enables soft-deletion functionality, allowing administrators to deactivate users without permanently removing their data. This is critical for maintaining data integrity in an educational system where historical records must be preserved even when users leave the institution.

The `toggle-user-status/route.ts` API endpoint implements strict controls for modifying user status:
- Only users with the 'admin' role can modify user status
- Administrators cannot deactivate their own accounts, preventing system lockout
- Input validation ensures proper UUID format and boolean status values
- The endpoint uses Supabase's service role key for privileged database operations

When a user is deactivated (`is_active = false`), they are prevented from logging in, but their historical data remains intact for reporting and auditing purposes.

**Section sources**
- [20251219084313_add_is_active_column.sql](file://supabase/migrations/20251219084313_add_is_active_column.sql)
- [toggle-user-status/route.ts](file://app/api/admin/toggle-user-status/route.ts)

## Parent-Child Relationships
The system implements a sophisticated parent-child relationship model through the `parent_children` table, which creates associations between parent and student accounts.

Key features of this relationship system:
- **Flexible Relationships**: Supports different relationship types including 'mother', 'father', 'guardian', and 'other'
- **Bidirectional Security**: Parents can view their children's data, while children cannot access parent information
- **Cascade Deletion**: When a user is deleted, their relationships are automatically removed
- **Unique Constraints**: Prevents duplicate parent-child relationships

The relationship table enables targeted RLS policies that allow parents to view specific academic data for their children, including grades, attendance records, and class enrollments. These policies use EXISTS subqueries to verify the parent-child relationship before granting access to sensitive information.

This design supports complex family structures while maintaining strict data privacy boundaries between unrelated users.

**Section sources**
- [20260105000003_create_parent_tables.sql](file://supabase/migrations/20260105000003_create_parent_tables.sql)

## API Integration and Application Logic
Application logic integrates tightly with the database security model through API routes that leverage Supabase's authentication and authorization features.

Key integration points include:
- **User Creation**: The `create-user/route.ts` endpoint verifies the caller is an admin, generates secure passwords, and creates both authentication records and database entries
- **Session Management**: The `me/route.ts` endpoint securely retrieves the authenticated user's profile information, serving as the foundation for personalized experiences
- **Authentication Integration**: The system uses `auth.uid()` to retrieve the current user's ID from JWT tokens, enabling seamless integration between authentication and authorization layers

The `proxy.ts` file demonstrates an optimization pattern where user metadata (role, must_change_password, is_active) is extracted from JWT claims when available, reducing database queries while maintaining security.

API routes implement comprehensive security checks including origin validation, rate limiting, input validation, and role verification to prevent unauthorized access and abuse.

**Section sources**
- [create-user/route.ts](file://app/api/admin/create-user/route.ts)
- [me/route.ts](file://app/api/auth/me/route.ts)
- [proxy.ts](file://proxy.ts)

## Security Considerations
The system implements multiple security best practices to protect sensitive user data:

- **PII Protection**: Column-level SELECT grants restrict access to sensitive fields like phone and address, with only "safe" columns available to general authenticated users
- **Rate Limiting**: API endpoints include rate limiting to prevent brute force attacks and abuse
- **Input Validation**: Zod schemas validate incoming data to prevent injection attacks and ensure data integrity
- **Service Role Security**: Administrative operations use the Supabase service role key, which is kept secret and never exposed to client-side code
- **CSRF Protection**: Origin validation prevents cross-site request forgery attacks
- **Password Security**: Generated passwords meet strict complexity requirements (12+ characters with uppercase, lowercase, numbers, and special characters)

The security model follows a defense-in-depth approach, with multiple layers of protection ensuring that even if one mechanism is compromised, others remain to protect user data.

**Section sources**
- [20250228_security_hardening.sql](file://supabase/migrations/20250228_security_hardening.sql)
- [create-user/route.ts](file://app/api/admin/create-user/route.ts)
- [security.ts](file://lib/security.ts)

## Data Model Diagram

```mermaid
erDiagram
USERS {
uuid id PK
string email UK
string name
string role
boolean is_active
boolean must_change_password
string avatar
string phone
string address
timestamp created_at
timestamp updated_at
}
STUDENT_PROFILES {
uuid id PK FK
string grade
string section
date enrollment_date
string parent_name
string parent_phone
}
TEACHER_PROFILES {
uuid id PK FK
string subject
string department
date join_date
}
PARENT_CHILDREN {
uuid id PK
uuid parent_id FK
uuid student_id FK
string relationship
timestamp created_at
}
USERS ||--o{ STUDENT_PROFILES : "has"
USERS ||--o{ TEACHER_PROFILES : "has"
USERS ||--o{ PARENT_CHILDREN : "as_parent"
USERS ||--o{ PARENT_CHILDREN : "as_student"
```

**Diagram sources**
- [20251219043432_create_users_table.sql](file://supabase/migrations/20251219043432_create_users_table.sql)
- [20260105000003_create_parent_tables.sql](file://supabase/migrations/20260105000003_create_parent_tables.sql)