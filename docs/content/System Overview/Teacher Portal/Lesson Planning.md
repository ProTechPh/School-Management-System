# Lesson Planning

<cite>
**Referenced Files in This Document**
- [page.tsx](file://app/teacher/lessons/page.tsx)
- [route.ts](file://app/api/teacher/lessons/route.ts)
- [calendar-view.tsx](file://components/calendar-view.tsx)
- [validation-schemas.ts](file://lib/validation-schemas.ts)
- [create_lessons_tables.sql](file://supabase/migrations/20251219043541_create_lessons_tables.sql)
- [add_rls_policies.sql](file://supabase/migrations/20251219044036_add_rls_policies.sql)
- [layout.tsx](file://app/teacher/layout.tsx)
- [utils.ts](file://lib/utils.ts)
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
This document explains the Lesson Planning feature in the Teacher Portal. It covers how teachers create, schedule, and manage lessons aligned with their curriculum, integrates with the calendar view for visual scheduling and iCal export, and documents the backend API and data model in Supabase. It also includes usage examples, validation and error handling, and strategies for resolving common issues such as syncing conflicts or missing lessons.

## Project Structure
The Lesson Planning feature spans the frontend page, the teacher-only API, and the shared calendar component. The data model is defined in Supabase migrations.

```mermaid
graph TB
subgraph "Frontend"
TL["Teacher Lessons Page<br/>app/teacher/lessons/page.tsx"]
CV["Calendar View<br/>components/calendar-view.tsx"]
end
subgraph "Backend API"
API["Teacher Lessons API<br/>app/api/teacher/lessons/route.ts"]
end
subgraph "Data Layer"
DB["Supabase Tables<br/>lessons, lesson_materials"]
MIG["Migrations<br/>create_lessons_tables.sql<br/>add_rls_policies.sql"]
end
TL --> API
TL --> CV
API --> DB
DB --> MIG
```

**Diagram sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L1-L575)
- [route.ts](file://app/api/teacher/lessons/route.ts#L1-L253)
- [calendar-view.tsx](file://components/calendar-view.tsx#L1-L497)
- [create_lessons_tables.sql](file://supabase/migrations/20251219043541_create_lessons_tables.sql#L1-L23)
- [add_rls_policies.sql](file://supabase/migrations/20251219044036_add_rls_policies.sql#L1-L22)

**Section sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L1-L575)
- [route.ts](file://app/api/teacher/lessons/route.ts#L1-L253)
- [calendar-view.tsx](file://components/calendar-view.tsx#L1-L497)
- [create_lessons_tables.sql](file://supabase/migrations/20251219043541_create_lessons_tables.sql#L1-L23)
- [add_rls_policies.sql](file://supabase/migrations/20251219044036_add_rls_policies.sql#L1-L22)

## Core Components
- Teacher Lessons Page: Provides a UI for creating, editing, and viewing lessons, managing learning materials, and displaying a list of lessons per class.
- Teacher Lessons API: Handles GET, POST, and PUT requests for lessons, validates inputs, enforces ownership, and manages lesson materials.
- Calendar View: Renders a monthly calendar, displays events, and exports individual events to iCalendar format.
- Validation Schemas: Defines Zod schemas for lesson creation and updates to enforce constraints on length, types, and URLs.
- Supabase Data Model: Declares lessons and lesson_materials tables with row-level security enabled.

**Section sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L1-L575)
- [route.ts](file://app/api/teacher/lessons/route.ts#L1-L253)
- [calendar-view.tsx](file://components/calendar-view.tsx#L1-L497)
- [validation-schemas.ts](file://lib/validation-schemas.ts#L1-L45)
- [create_lessons_tables.sql](file://supabase/migrations/20251219043541_create_lessons_tables.sql#L1-L23)

## Architecture Overview
The teacher portal’s Lesson Planning feature follows a clear separation of concerns:
- Frontend page orchestrates lesson CRUD and material management.
- API enforces authorization, validates inputs, and persists data to Supabase.
- Calendar view provides a separate scheduling surface and iCal export capability.
- Supabase migrations define the schema and RLS policies.

```mermaid
sequenceDiagram
participant T as "Teacher UI<br/>lessons/page.tsx"
participant API as "API Route<br/>api/teacher/lessons/route.ts"
participant DB as "Supabase DB<br/>lessons, lesson_materials"
T->>API : GET /api/teacher/lessons
API->>DB : SELECT lessons + materials for teacher_id
DB-->>API : lessons + materials
API-->>T : JSON { lessons }
T->>API : POST /api/teacher/lessons (title, classId, materials)
API->>DB : INSERT lesson
API->>DB : INSERT lesson_materials (if provided)
DB-->>API : lesson + materials
API-->>T : JSON { success, lesson }
T->>API : PUT /api/teacher/lessons (id, materials, deletedMaterialIds)
API->>DB : UPDATE lesson
API->>DB : DELETE lesson_materials (by ids)
API->>DB : INSERT/UPDATE lesson_materials
DB-->>API : OK
API-->>T : JSON { success }
```

**Diagram sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L80-L114)
- [route.ts](file://app/api/teacher/lessons/route.ts#L56-L108)
- [route.ts](file://app/api/teacher/lessons/route.ts#L110-L170)
- [route.ts](file://app/api/teacher/lessons/route.ts#L172-L253)

## Detailed Component Analysis

### Teacher Lessons Page (lessons/page.tsx)
Responsibilities:
- Fetches classes and lessons for the logged-in teacher.
- Presents forms to create and edit lessons with optional learning materials.
- Validates materials locally before submission.
- Displays lessons with class, description, materials count, and last updated date.
- Opens dialogs to view lesson details and edit materials.

Key behaviors:
- Fetches classes via a dedicated API endpoint and lessons via the lessons API.
- Local validation ensures URLs start with http:// or https://.
- Supports adding/removing materials and toggling material types (pdf, video, link, document).
- On successful create/update, refreshes the lessons list.

```mermaid
flowchart TD
Start(["Open Lessons Page"]) --> LoadData["Fetch Classes + Lessons"]
LoadData --> RenderList["Render Lesson Cards"]
RenderList --> Create["Open Create Dialog"]
Create --> AddMaterial["Add Material (PDF/Video/Link)"]
AddMaterial --> Validate["Validate URLs"]
Validate --> |Valid| SubmitCreate["POST /api/teacher/lessons"]
Validate --> |Invalid| Error["Show Toast Error"]
SubmitCreate --> Refresh["Refresh Lessons List"]
RenderList --> Edit["Open Edit Dialog"]
Edit --> ManageMaterial["Add/Edit/Delete Materials"]
ManageMaterial --> SubmitUpdate["PUT /api/teacher/lessons"]
SubmitUpdate --> Refresh
Refresh --> End(["Done"])
```

**Diagram sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L80-L114)
- [page.tsx](file://app/teacher/lessons/page.tsx#L153-L184)
- [page.tsx](file://app/teacher/lessons/page.tsx#L235-L266)

**Section sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L1-L575)

### Teacher Lessons API (api/teacher/lessons/route.ts)
Responsibilities:
- GET: Returns lessons for the authenticated teacher, including class and materials.
- POST: Creates a lesson and associated materials; validates URLs and ownership.
- PUT: Updates a lesson and its materials; deletes removed materials and inserts/updates existing ones; enforces ownership.

Security and validation:
- Enforces role checks (teacher/admin for GET).
- Validates required fields and URL safety using DNS resolution and private IP checks.
- Ensures deletion and updates apply only to the lesson owner by verifying teacher_id.
- Uses Supabase RLS to protect data.

```mermaid
sequenceDiagram
participant C as "Client"
participant S as "Server Route"
participant RL as "RLS Policy"
participant DB as "Supabase"
C->>S : POST /api/teacher/lessons
S->>S : Validate role (teacher)
S->>S : Validate required fields
S->>S : Validate URLs (protocol/IP/DNS)
S->>DB : INSERT lessons
S->>DB : INSERT lesson_materials (if provided)
DB->>RL : Apply policies
DB-->>S : OK
S-->>C : { success, lesson }
C->>S : PUT /api/teacher/lessons
S->>DB : SELECT teacher_id by id
S->>S : Validate URLs
S->>DB : UPDATE lessons
S->>DB : DELETE lesson_materials (ids)
S->>DB : INSERT/UPDATE lesson_materials
DB->>RL : Apply policies
DB-->>S : OK
S-->>C : { success }
```

**Diagram sources**
- [route.ts](file://app/api/teacher/lessons/route.ts#L56-L108)
- [route.ts](file://app/api/teacher/lessons/route.ts#L110-L170)
- [route.ts](file://app/api/teacher/lessons/route.ts#L172-L253)

**Section sources**
- [route.ts](file://app/api/teacher/lessons/route.ts#L1-L253)

### Calendar View Integration (components/calendar-view.tsx)
Responsibilities:
- Renders a month grid calendar and lists events for a selected date.
- Exports individual events to iCalendar (.ics) format for download.
- Fetches events from a calendar API endpoint and displays them with color-coded types.

Integration with Lesson Planning:
- While lessons and calendar events are separate entities, the calendar view supports exporting any event to iCal. Teachers can use this to share schedules externally.

```mermaid
sequenceDiagram
participant U as "User"
participant CV as "CalendarView"
participant API as "Calendar API"
participant DL as "Browser"
U->>CV : Open Calendar
CV->>API : GET /api/calendar?startDate&endDate
API-->>CV : { events }
U->>CV : Click Export Event
CV->>DL : Create Blob + a.download
DL-->>U : Download .ics
```

**Diagram sources**
- [calendar-view.tsx](file://components/calendar-view.tsx#L66-L86)
- [calendar-view.tsx](file://components/calendar-view.tsx#L169-L203)

**Section sources**
- [calendar-view.tsx](file://components/calendar-view.tsx#L1-L497)

### Data Model and Access Controls (Supabase)
Tables:
- lessons: Stores lesson metadata and links to classes and teachers.
- lesson_materials: Stores associated materials (pdf, video, link, document) linked to lessons.

Row Level Security:
- Tables enable RLS; policies are defined in migrations to control access.

```mermaid
erDiagram
USERS {
uuid id PK
string role
}
CLASSES {
uuid id PK
string name
}
LESSONS {
uuid id PK
string title
uuid class_id FK
uuid teacher_id FK
text description
text content
timestamptz created_at
timestamptz updated_at
}
LESSON_MATERIALS {
uuid id PK
uuid lesson_id FK
string name
string type
string url
string size
}
USERS ||--o{ LESSONS : "teacher_id"
CLASSES ||--o{ LESSONS : "class_id"
LESSONS ||--o{ LESSON_MATERIALS : "lesson_id"
```

**Diagram sources**
- [create_lessons_tables.sql](file://supabase/migrations/20251219043541_create_lessons_tables.sql#L1-L23)
- [add_rls_policies.sql](file://supabase/migrations/20251219044036_add_rls_policies.sql#L1-L22)

**Section sources**
- [create_lessons_tables.sql](file://supabase/migrations/20251219043541_create_lessons_tables.sql#L1-L23)
- [add_rls_policies.sql](file://supabase/migrations/20251219044036_add_rls_policies.sql#L1-L22)

### Validation and Error Handling
- Client-side validation in the lessons page ensures URLs start with http:// or https:// and prevents invalid submissions.
- Server-side validation in the API route:
  - Role checks for teacher/admin on GET.
  - Required fields for POST.
  - URL validation using protocol checks, private IP filtering, and DNS resolution to prevent SSRF and local network access.
  - Ownership verification for PUT operations.
- Error responses return structured messages and appropriate HTTP status codes.
- The lessons page shows user-friendly toasts for failures.

**Section sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L143-L151)
- [route.ts](file://app/api/teacher/lessons/route.ts#L21-L54)
- [route.ts](file://app/api/teacher/lessons/route.ts#L110-L170)
- [route.ts](file://app/api/teacher/lessons/route.ts#L172-L253)

### Usage Examples
- Creating a new lesson:
  - Open the Create Lesson dialog, select a class, enter title and optional description/content, add materials (PDF, video, link), and submit.
  - The page validates URLs and shows a success toast; the list refreshes automatically.
- Setting objectives:
  - Enter objectives in the lesson content field; these appear when viewing lesson details.
- Linking to assignments or materials:
  - Add materials with names and URLs; the page opens external links safely and displays icons per material type.
- Scheduling and iCal export:
  - Use the calendar view to export events to iCal for sharing with students or external calendars.

**Section sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L153-L184)
- [page.tsx](file://app/teacher/lessons/page.tsx#L235-L266)
- [calendar-view.tsx](file://components/calendar-view.tsx#L169-L203)

## Dependency Analysis
- The lessons page depends on:
  - Supabase client for auth and data fetching.
  - Utility functions for URL safety.
  - The teacher lessons API for CRUD operations.
- The lessons API depends on:
  - Supabase server client for database access.
  - DNS resolution for URL validation.
  - Supabase RLS policies for access control.
- The calendar view depends on:
  - A calendar API endpoint for events.
  - iCalendar export helpers.

```mermaid
graph LR
P["lessons/page.tsx"] --> U["utils.ts (getSafeUrl)"]
P --> A["api/teacher/lessons/route.ts"]
A --> S["Supabase (RLS-enabled tables)"]
CV["calendar-view.tsx"] --> CA["/api/calendar (external)"]
```

**Diagram sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L1-L575)
- [utils.ts](file://lib/utils.ts#L1-L107)
- [route.ts](file://app/api/teacher/lessons/route.ts#L1-L253)
- [calendar-view.tsx](file://components/calendar-view.tsx#L1-L497)

**Section sources**
- [page.tsx](file://app/teacher/lessons/page.tsx#L1-L575)
- [route.ts](file://app/api/teacher/lessons/route.ts#L1-L253)
- [calendar-view.tsx](file://components/calendar-view.tsx#L1-L497)
- [utils.ts](file://lib/utils.ts#L1-L107)

## Performance Considerations
- Minimize re-renders by consolidating state updates in the lessons page.
- Batch material operations (insert/update/delete) in a single PUT request to reduce round-trips.
- Use pagination or lazy loading for large lesson lists if needed.
- Cache calendar events for short periods to reduce API calls.

## Troubleshooting Guide
Common issues and resolutions:
- Syncing conflicts:
  - Cause: Concurrent edits by multiple users or rapid refresh cycles.
  - Resolution: Ensure the UI refreshes lessons after each operation and avoids manual polling; rely on the API responses to update state.
- Missing lessons:
  - Cause: Unauthorized or forbidden responses if the user role is not teacher/admin for GET.
  - Resolution: Verify authentication and role checks; ensure the teacher layout guards access.
- Invalid URL errors:
  - Cause: Non-http/https URLs or private/local network links.
  - Resolution: Use public URLs; the client and server validate URLs and reject unsafe links.
- Material deletion failures:
  - Cause: Attempting to delete materials not owned by the lesson.
  - Resolution: The API verifies ownership before deletions; ensure deletedMaterialIds correspond to the lesson’s materials.

**Section sources**
- [route.ts](file://app/api/teacher/lessons/route.ts#L56-L108)
- [route.ts](file://app/api/teacher/lessons/route.ts#L172-L253)
- [page.tsx](file://app/teacher/lessons/page.tsx#L143-L151)
- [layout.tsx](file://app/teacher/layout.tsx#L1-L60)

## Conclusion
The Lesson Planning feature provides a robust, secure, and user-friendly way for teachers to create, manage, and visualize lessons. The frontend integrates seamlessly with the teacher-only lessons API, which enforces strict validation and access control. The calendar view complements scheduling and export capabilities. By following the documented usage patterns and troubleshooting steps, teachers can efficiently align their lesson plans with curriculum and share schedules via iCal.