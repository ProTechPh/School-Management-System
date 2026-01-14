# Admin Dashboard

<cite>
**Referenced Files in This Document**   
- [app/admin/layout.tsx](file://app/admin/layout.tsx)
- [app/admin/page.tsx](file://app/admin/page.tsx)
- [components/dashboard-header.tsx](file://components/dashboard-header.tsx)
- [components/dashboard-sidebar.tsx](file://components/dashboard-sidebar.tsx)
- [lib/hooks/use-optimized-query.ts](file://lib/hooks/use-optimized-query.ts)
- [app/api/admin/dashboard/route.ts](file://app/api/admin/dashboard/route.ts)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/supabase/queries.ts](file://lib/supabase/queries.ts)
- [lib/supabase/queries-optimized.ts](file://lib/supabase/queries-optimized.ts)
- [components/admin-session-guard.tsx](file://components/admin-session-guard.tsx)
- [app/admin/students/page.tsx](file://app/admin/students/page.tsx)
- [app/admin/classes/page.tsx](file://app/admin/classes/page.tsx)
- [app/admin/audit-logs/page.tsx](file://app/admin/audit-logs/page.tsx)
- [lib/supabase/audit-logs.ts](file://lib/supabase/audit-logs.ts)
- [lib/security.ts](file://lib/security.ts)
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
The Admin Dashboard serves as the central management interface for school administrators within the School Management System. It provides comprehensive tools for managing users (students, teachers, parents), classes, attendance, grades, and system auditing. Built using Next.js Server Components and React hooks, the dashboard offers a responsive and secure interface for overseeing school operations. This document details the architecture, components, workflows, and security considerations of the Admin Dashboard.

## Project Structure
The Admin Dashboard is organized within the `app/admin/` directory, following a modular structure with dedicated pages for each management function. The layout is consistent across all admin pages, utilizing shared components for the header and sidebar. API routes in `app/api/admin/` handle secure data operations, while reusable components and hooks in the `components/` and `lib/` directories support functionality across the application.

```mermaid
graph TB
subgraph "Admin Dashboard"
A[app/admin/layout.tsx] --> B[app/admin/page.tsx]
A --> C[app/admin/students/page.tsx]
A --> D[app/admin/classes/page.tsx]
A --> E[app/admin/audit-logs/page.tsx]
A --> F[components/dashboard-header.tsx]
A --> G[components/dashboard-sidebar.tsx]
end
subgraph "API Routes"
H[app/api/admin/dashboard/route.ts] --> I[app/api/admin/classes/route.ts]
H --> J[app/api/admin/students/route.ts]
H --> K[app/api/admin/create-class/route.ts]
end
subgraph "Libraries"
L[lib/hooks/use-optimized-query.ts] --> M[lib/supabase/client.ts]
M --> N[lib/supabase/queries.ts]
M --> O[lib/supabase/queries-optimized.ts]
end
A --> H
B --> L
C --> L
D --> L
E --> L
F --> P[components/ui]
G --> P
```

**Diagram sources**
- [app/admin/layout.tsx](file://app/admin/layout.tsx)
- [app/admin/page.tsx](file://app/admin/page.tsx)
- [app/admin/students/page.tsx](file://app/admin/students/page.tsx)
- [app/admin/classes/page.tsx](file://app/admin/classes/page.tsx)
- [app/admin/audit-logs/page.tsx](file://app/admin/audit-logs/page.tsx)
- [app/api/admin/dashboard/route.ts](file://app/api/admin/dashboard/route.ts)
- [lib/hooks/use-optimized-query.ts](file://lib/hooks/use-optimized-query.ts)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)

**Section sources**
- [app/admin/layout.tsx](file://app/admin/layout.tsx)
- [app/admin/page.tsx](file://app/admin/page.tsx)
- [app/api/admin/dashboard/route.ts](file://app/api/admin/dashboard/route.ts)

## Core Components
The Admin Dashboard is built around several core components that provide the foundation for its functionality. The `dashboard-header` and `dashboard-sidebar` components create a consistent user interface across all admin pages. The `use-optimized-query` hook enables efficient data fetching with caching and deduplication. The `admin-session-guard` component ensures secure session management with timeout warnings. These components work together to create a seamless and secure administrative experience.

**Section sources**
- [components/dashboard-header.tsx](file://components/dashboard-header.tsx)
- [components/dashboard-sidebar.tsx](file://components/dashboard-sidebar.tsx)
- [lib/hooks/use-optimized-query.ts](file://lib/hooks/use-optimized-query.ts)
- [components/admin-session-guard.tsx](file://components/admin-session-guard.tsx)

## Architecture Overview
The Admin Dashboard follows a client-server architecture with Next.js Server Components handling initial rendering and API routes managing data operations. The dashboard uses React hooks for client-side interactivity, with the `use-optimized-query` hook providing efficient data fetching patterns. Supabase integration is achieved through API routes in `app/api/admin/`, ensuring secure access to the database. The architecture emphasizes security, performance, and maintainability.

```mermaid
graph TD
A[Admin Dashboard] --> B[Next.js Server Components]
A --> C[React Hooks]
B --> D[app/admin/page.tsx]
B --> E[app/admin/layout.tsx]
C --> F[use-optimized-query]
C --> G[useSessionTimeout]
D --> H[API Routes]
E --> I[dashboard-header]
E --> J[dashboard-sidebar]
H --> K[Supabase]
K --> L[Database]
F --> M[Caching]
F --> N[Deduplication]
I --> O[UI Components]
J --> O
```

**Diagram sources**
- [app/admin/page.tsx](file://app/admin/page.tsx)
- [app/admin/layout.tsx](file://app/admin/layout.tsx)
- [lib/hooks/use-optimized-query.ts](file://lib/hooks/use-optimized-query.ts)
- [components/dashboard-header.tsx](file://components/dashboard-header.tsx)
- [components/dashboard-sidebar.tsx](file://components/dashboard-sidebar.tsx)
- [app/api/admin/dashboard/route.ts](file://app/api/admin/dashboard/route.ts)

## Detailed Component Analysis

### Dashboard Layout and Header
The Admin Dashboard uses a consistent layout with a sidebar for navigation and a header for user actions. The `dashboard-sidebar` component provides role-based navigation links, while the `dashboard-header` includes search functionality, theme toggling, and notification center access.

```mermaid
classDiagram
class DashboardSidebar {
+role : UserRole
+userName : string
+userAvatar? : string
+adminLinks : Link[]
+teacherLinks : Link[]
+studentLinks : Link[]
+parentLinks : Link[]
+SidebarContent()
+DashboardSidebar()
}
class DashboardHeader {
+title : string
+subtitle? : string
+description? : string
+role? : string
+userId? : string
+DashboardHeader()
}
DashboardSidebar --> DashboardHeader : "uses"
```

**Diagram sources**
- [components/dashboard-sidebar.tsx](file://components/dashboard-sidebar.tsx)
- [components/dashboard-header.tsx](file://components/dashboard-header.tsx)

### Data Fetching and Optimization
The `use-optimized-query` hook provides a robust solution for data fetching with caching, deduplication, and retry logic. It supports various query patterns including paginated, infinite scroll, and debounced search queries. The hook integrates with the application's caching system to minimize redundant API calls and improve performance.

```mermaid
sequenceDiagram
participant Component as "Admin Page Component"
participant Hook as "useOptimizedQuery"
participant Cache as "Application Cache"
participant API as "API Route"
participant Supabase as "Supabase"
Component->>Hook : useOptimizedQuery(key, queryFn)
Hook->>Cache : cachedQuery(key)
alt Cache Hit
Cache-->>Hook : Return cached data
Hook-->>Component : Return data
else Cache Miss
Hook->>API : fetch("/api/admin/...")
API->>Supabase : Supabase query
Supabase-->>API : Return data
API-->>Hook : Return response
Hook->>Cache : Store in cache
Hook-->>Component : Return data
end
```

**Diagram sources**
- [lib/hooks/use-optimized-query.ts](file://lib/hooks/use-optimized-query.ts)
- [app/api/admin/dashboard/route.ts](file://app/api/admin/dashboard/route.ts)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)

### User Management Workflow
The Admin Dashboard provides comprehensive tools for managing users, including students, teachers, and parents. The student management page allows administrators to view, filter, and add students. The workflow for creating a new student involves filling out a form with personal and academic information, which is then submitted to the API for processing.

```mermaid
flowchart TD
A[Start] --> B[Click Add Student]
B --> C[Open Student Form]
C --> D[Fill Student Information]
D --> E[Submit Form]
E --> F[API Validation]
F --> G{Valid?}
G --> |Yes| H[Create Student Record]
G --> |No| I[Show Error Messages]
H --> J[Update Student List]
J --> K[Success Notification]
I --> C
K --> L[End]
```

**Diagram sources**
- [app/admin/students/page.tsx](file://app/admin/students/page.tsx)
- [components/student-form.tsx](file://components/student-form.tsx)
- [app/api/admin/students/create/route.ts](file://app/api/admin/students/create/route.ts)

### Class Management Workflow
The class management system allows administrators to create, edit, and delete classes. Each class is associated with a teacher, subject, grade level, and schedule. The workflow for creating a new class involves specifying class details and assigning a teacher, with validation to ensure data integrity.

```mermaid
flowchart TD
A[Start] --> B[Click Add Class]
B --> C[Open Class Form]
C --> D[Enter Class Details]
D --> E[Select Teacher]
E --> F[Submit Form]
F --> G[API Validation]
G --> H{Valid?}
H --> |Yes| I[Create Class Record]
H --> |No| J[Show Error Messages]
I --> K[Update Class List]
K --> L[Success Notification]
J --> C
L --> M[End]
```

**Diagram sources**
- [app/admin/classes/page.tsx](file://app/admin/classes/page.tsx)
- [app/api/admin/create-class/route.ts](file://app/api/admin/create-class/route.ts)

### Audit Logging and Security
The Admin Dashboard includes comprehensive audit logging to track user activities and system events. The audit logs page displays authentication events and security activities, with filtering and export capabilities. Security considerations include role-based access control, session timeout management, and IP address hashing for privacy.

```mermaid
sequenceDiagram
participant Admin as "Administrator"
participant Dashboard as "Admin Dashboard"
participant API as "API Route"
participant Supabase as "Supabase"
participant Audit as "Audit Logs"
Admin->>Dashboard : Access Audit Logs
Dashboard->>API : fetch("/api/audit-logs")
API->>Supabase : Query audit_logs_with_users
Supabase-->>API : Return audit data
API-->>Dashboard : JSON response
Dashboard->>Admin : Display audit logs
Admin->>Dashboard : Export CSV
Dashboard->>API : fetch("/api/audit-logs/export")
API->>Audit : exportAuditLogsToCSV()
Audit-->>API : CSV content
API-->>Dashboard : Blob response
Dashboard->>Admin : Download file
```

**Diagram sources**
- [app/admin/audit-logs/page.tsx](file://app/admin/audit-logs/page.tsx)
- [lib/supabase/audit-logs.ts](file://lib/supabase/audit-logs.ts)
- [app/api/audit-logs/export/route.ts](file://app/api/audit-logs/export/route.ts)

## Dependency Analysis
The Admin Dashboard has a well-defined dependency structure with clear separation between components, hooks, and API routes. The dashboard components depend on UI components from the `components/ui` directory and utility hooks from the `lib/hooks` directory. Data operations are handled through API routes that interact with Supabase, ensuring secure access to the database. The dependency graph shows a modular architecture with minimal circular dependencies.

```mermaid
graph TD
A[Admin Dashboard] --> B[UI Components]
A --> C[Utility Hooks]
A --> D[API Routes]
B --> E[Shadcn UI]
C --> F[Caching System]
C --> G[Session Management]
D --> H[Supabase Client]
H --> I[Database]
D --> J[Security Utilities]
J --> K[IP Hashing]
J --> L[Origin Validation]
```

**Diagram sources**
- [app/admin/page.tsx](file://app/admin/page.tsx)
- [components/dashboard-header.tsx](file://components/dashboard-header.tsx)
- [components/dashboard-sidebar.tsx](file://components/dashboard-sidebar.tsx)
- [lib/hooks/use-optimized-query.ts](file://lib/hooks/use-optimized-query.ts)
- [lib/supabase/client.ts](file://lib/supabase/client.ts)
- [lib/security.ts](file://lib/security.ts)

## Performance Considerations
The Admin Dashboard implements several performance optimizations to ensure a responsive user experience. The `use-optimized-query` hook provides caching and deduplication to minimize redundant API calls. Data fetching is optimized through the use of paginated queries and server-side caching. The dashboard also implements debounced search to reduce the frequency of filtering operations during user input.

**Section sources**
- [lib/hooks/use-optimized-query.ts](file://lib/hooks/use-optimized-query.ts)
- [app/admin/students/page.tsx](file://app/admin/students/page.tsx)
- [app/admin/classes/page.tsx](file://app/admin/classes/page.tsx)

## Troubleshooting Guide
Common issues with the Admin Dashboard include failed user creation, data loading errors, and authentication problems. For failed user creation, verify that all required fields are filled and that the email address is unique. For data loading errors, check the network connection and ensure that the API routes are accessible. Authentication issues may require clearing browser cookies or resetting the user's password.

**Section sources**
- [app/admin/students/page.tsx](file://app/admin/students/page.tsx)
- [app/admin/classes/page.tsx](file://app/admin/classes/page.tsx)
- [app/admin/audit-logs/page.tsx](file://app/admin/audit-logs/page.tsx)

## Conclusion
The Admin Dashboard provides a comprehensive and secure interface for school administrators to manage users, classes, attendance, grades, and system auditing. Its architecture leverages Next.js Server Components and React hooks to create a responsive and efficient user experience. The dashboard's modular design, with reusable components and optimized data fetching, ensures maintainability and scalability. Security features such as role-based access control, audit logging, and session management protect sensitive data and system integrity.