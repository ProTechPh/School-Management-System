# Business Components

<cite>
**Referenced Files in This Document**   
- [data-table.tsx](file://components/data-table.tsx)
- [audit-log-table.tsx](file://components/audit-log-table.tsx)
- [qr-scanner.tsx](file://components/qr-scanner.tsx)
- [qr-code-generator.tsx](file://components/qr-code-generator.tsx)
- [zoom-meeting-card.tsx](file://components/zoom-meeting-card.tsx)
- [audit-log-analytics.tsx](file://components/audit-log-analytics.tsx)
- [progress-analytics.tsx](file://components/progress-analytics.tsx)
- [analytics-store.ts](file://lib/analytics-store.ts)
- [qr-attendance-store.ts](file://lib/qr-attendance-store.ts)
- [audit-logs.ts](file://lib/supabase/audit-logs.ts)
- [route.ts](file://app/api/audit-logs/route.ts)
- [export/route.ts](file://app/api/audit-logs/export/route.ts)
- [stats/route.ts](file://app/api/audit-logs/stats/route.ts)
- [analytics/student/[id]/route.ts](file://app/api/analytics/student/[id]/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Data Table Components](#data-table-components)
3. [QR-Based Attendance Components](#qr-based-attendance-components)
4. [Zoom Meeting Components](#zoom-meeting-components)
5. [Analytics Components](#analytics-components)
6. [State Management and Data Flow](#state-management-and-data-flow)
7. [API Integration and Security](#api-integration-and-security)
8. [Real-World Usage Examples](#real-world-usage-examples)
9. [Error Handling and User Experience](#error-handling-and-user-experience)
10. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive documentation for the business logic-driven components in the School Management System. The components covered encapsulate specific domain functionality related to data presentation, attendance workflows, meeting management, and analytics visualization. These components are designed to provide robust, user-friendly interfaces for administrators, teachers, students, and parents, with proper integration to backend services and state management systems.

## Data Table Components

The data table components provide a flexible and reusable solution for rendering paginated, sortable tabular data with filtering and export capabilities. The implementation consists of a base `DataTable` component and specialized implementations for specific use cases.

```mermaid
classDiagram
class DataTable~T~ {
+columns : Column<T>[]
+data : T[]
+onRowClick : (item : T) => void
-renderHeader(header : string | React.ReactNode | () => React.ReactNode) : React.ReactNode
}
class Column~T~ {
+key : keyof T | string
+header : string | React.ReactNode | (() => React.ReactNode)
+render : (item : T) => React.ReactNode
+className : string
}
class DataTableProps~T~ {
+columns : Column<T>[]
+data : T[]
+onRowClick : (item : T) => void
}
DataTable <|-- AuditLogTable : "extends"
DataTable <|-- CustomTable : "generic usage"
```

**Diagram sources**
- [data-table.tsx](file://components/data-table.tsx#L1-L60)

**Section sources**
- [data-table.tsx](file://components/data-table.tsx#L1-L60)

### Audit Log Table Implementation

The `AuditLogTable` component is a specialized implementation of the `DataTable` component designed specifically for displaying audit log entries. It includes custom rendering for date/time, user information, roles, actions, and IP addresses, with appropriate formatting and styling based on the data type.

```mermaid
classDiagram
class AuditLogTable {
+logs : AuditLogEntry[]
+onRowClick : (log : AuditLogEntry) => void
-getSeverityVariant(severity : string) : "destructive" | "default" | "secondary"
}
class AuditLogEntry {
+id : string
+user_id : string | null
+action : string
+ip_address : string | null
+created_at : string
+payload : any
+email : string
+name : string
+role : string
}
class AuditLogTableProps {
+logs : AuditLogEntry[]
+onRowClick : (log : AuditLogEntry) => void
}
AuditLogTable --> DataTable : "uses"
AuditLogTable --> AuditLogEntry : "displays"
AuditLogTable --> audit-logs.ts : "imports utilities"
```

**Diagram sources**
- [audit-log-table.tsx](file://components/audit-log-table.tsx#L1-L84)
- [data-table.tsx](file://components/data-table.tsx#L1-L60)
- [audit-logs.ts](file://lib/supabase/audit-logs.ts#L8-L18)

**Section sources**
- [audit-log-table.tsx](file://components/audit-log-table.tsx#L1-L84)

## QR-Based Attendance Components

The QR-based attendance components enable secure and efficient attendance tracking through QR code scanning and generation. These components support both student check-in and teacher-initiated attendance sessions, with integration to state management and backend services.

### QR Scanner Component

The `QRScanner` component provides a full-screen interface for scanning QR codes using the device's camera. It handles camera initialization, error management, and provides fallback options for manual code entry when camera access is unavailable or problematic.

```mermaid
sequenceDiagram
participant Student as "Student Device"
participant QRScanner as "QRScanner Component"
participant Store as "QRAttendanceStore"
participant API as "API Route"
Student->>QRScanner : Opens QR check-in page
QRScanner->>QRScanner : Initializes camera (html5-qrcode)
alt Camera access successful
QRScanner->>QRScanner : Displays live camera feed
Student->>QRScanner : Scans QR code
QRScanner->>QRScanner : Decodes QR data
QRScanner->>Store : Validates QR code and session
Store-->>QRScanner : Returns validation result
QRScanner->>API : Sends check-in request
API-->>QRScanner : Returns check-in confirmation
QRScanner->>Student : Shows success message
else Camera access denied
QRScanner->>Student : Shows error message
Student->>QRScanner : Enters code manually
QRScanner->>Store : Validates manual code
Store-->>QRScanner : Returns validation result
QRScanner->>API : Sends check-in request
API-->>QRScanner : Returns check-in confirmation
QRScanner->>Student : Shows success message
end
```

**Diagram sources**
- [qr-scanner.tsx](file://components/qr-scanner.tsx#L1-L161)
- [qr-attendance-store.ts](file://lib/qr-attendance-store.ts#L1-L100)

**Section sources**
- [qr-scanner.tsx](file://components/qr-scanner.tsx#L1-L161)

### QR Code Generator Component

The `QRCodeGenerator` component creates dynamic QR codes for attendance sessions initiated by teachers. The generated QR codes contain session-specific information and are updated periodically for security purposes. The component uses the QRCodeStyling library to create visually appealing QR codes with custom styling.

```mermaid
classDiagram
class QRCodeGenerator {
+data : string
+size : number
-qrCodeRef : QRCodeStyling | null
}
class QRCodeGeneratorProps {
+data : string
+size : number
}
class QRAttendanceSession {
+id : string
+classId : string
+className : string
+teacherId : string
+teacherName : string
+date : string
+startTime : string
+endTime : string
+qrCode : string
+status : "active" | "expired"
+checkedInStudents : string[]
+requireLocation : boolean
}
QRCodeGenerator --> QRCodeStyling : "uses"
QRCodeGenerator --> QRAttendanceStore : "listens for session changes"
QRCodeGenerator --> QRAttendanceSession : "displays session QR code"
```

**Diagram sources**
- [qr-code-generator.tsx](file://components/qr-code-generator.tsx#L1-L66)
- [qr-attendance-store.ts](file://lib/qr-attendance-store.ts#L5-L18)

**Section sources**
- [qr-code-generator.tsx](file://components/qr-code-generator.tsx#L1-L66)

## Zoom Meeting Components

The Zoom meeting components provide a comprehensive interface for managing Zoom meetings within the school system. These components handle meeting display, participant management, joining functionality, and lifecycle operations such as editing and deletion.

### Zoom Meeting Card Component

The `ZoomMeetingCard` component displays detailed information about a Zoom meeting, including title, status, timing, host information, and action buttons. It supports both compact and detailed views and provides appropriate actions based on user role and meeting status.

```mermaid
classDiagram
class ZoomMeetingCard {
+meeting : ZoomMeeting
+currentUserId : string
+userRole : string
+onEdit : (meeting : ZoomMeeting) => void
+onDelete : (meetingId : string) => void
+onJoin : (meeting : ZoomMeeting) => void
+compact : boolean
+showParticipants : boolean
+basePath : string
-deleting : boolean
-showDeleteDialog : boolean
-joining : boolean
-isHost : boolean
-startTime : Date
-endTime : Date
-isUpcoming : boolean
-isLive : boolean
-canJoin : boolean
}
class ZoomMeeting {
+id : string
+title : string
+description : string
+start_time : string
+duration : number
+status : string
+host_id : string
+join_url : string
+class : ClassInfo
+host : HostInfo
}
class ClassInfo {
+name : string
}
class HostInfo {
+name : string
+avatar : string
}
ZoomMeetingCard --> ZoomParticipantsSection : "includes"
ZoomMeetingCard --> API : "calls /api/zoom/meetings/{id}/join"
ZoomMeetingCard --> API : "calls DELETE /api/zoom/meetings/{id}"
ZoomMeetingCard --> toast : "shows notifications"
```

**Diagram sources**
- [zoom-meeting-card.tsx](file://components/zoom-meeting-card.tsx#L1-L274)

**Section sources**
- [zoom-meeting-card.tsx](file://components/zoom-meeting-card.tsx#L1-L274)

## Analytics Components

The analytics components provide data visualization for audit logs and student progress, transforming raw data from Supabase queries into meaningful insights through charts and summary statistics.

### Audit Log Analytics Component

The `AuditLogAnalytics` component displays key metrics from audit log data, including total logins, failed attempts, success rate, and active users. It also shows the top actions performed in the system, providing administrators with a quick overview of system activity.

```mermaid
classDiagram
class AuditLogAnalytics {
+stats : AuditLogStats
}
class AuditLogStats {
+totalLogins : number
+failedLogins : number
+successRate : number
+uniqueUsers : number
+recentActions : { action : string; count : number }[]
}
AuditLogAnalytics --> Card : "uses UI components"
AuditLogAnalytics --> API : "retrieves from /api/audit-logs/stats"
AuditLogAnalytics --> audit-logs.ts : "uses getAuditLogStats()"
```

**Diagram sources**
- [audit-log-analytics.tsx](file://components/audit-log-analytics.tsx#L1-L78)
- [audit-logs.ts](file://lib/supabase/audit-logs.ts#L30-L36)

**Section sources**
- [audit-log-analytics.tsx](file://components/audit-log-analytics.tsx#L1-L78)

### Progress Analytics Component

The `ProgressAnalytics` component visualizes student performance and attendance trends over time. It fetches data from the analytics API and displays it through line charts, bar charts, and pie charts, providing a comprehensive view of student progress.

```mermaid
flowchart TD
Start([Component Mount]) --> FetchData["Fetch analytics from /api/analytics/student/{id}"]
FetchData --> ParseData["Parse grade and attendance trends"]
ParseData --> CalculateStats["Calculate overall average, attendance rate, improvement rate"]
CalculateStats --> DisplayOverview["Display summary cards"]
DisplayOverview --> DisplayCharts["Display detailed charts"]
subgraph Charts
DisplayCharts --> LineChart["Line chart: Grade trends over time"]
DisplayCharts --> BarChart["Bar chart: Performance by subject"]
DisplayCharts --> PieChart["Pie chart: Attendance breakdown"]
end
PieChart --> End([Component Rendered])
```

**Diagram sources**
- [progress-analytics.tsx](file://components/progress-analytics.tsx#L1-L189)
- [analytics/student/[id]/route.ts](file://app/api/analytics/student/[id]/route.ts#L1-L163)

**Section sources**
- [progress-analytics.tsx](file://components/progress-analytics.tsx#L1-L189)

## State Management and Data Flow

The application uses Zustand stores to manage state for analytics and QR-based attendance, providing a centralized and efficient way to handle data across components.

### Analytics Store

The `useAnalyticsStore` provides a centralized store for student analytics data, with methods to retrieve and calculate various metrics from the raw data.

```mermaid
classDiagram
class useAnalyticsStore {
+studentAnalytics : Record<string, StudentAnalytics>
+getStudentAnalytics(studentId : string) : StudentAnalytics | undefined
+getGradeTrendsBySubject(studentId : string, subject : string) : GradeTrend[]
+getAttendanceStats(studentId : string) : AttendanceStats
+getClassAverages(classId : string, studentIds : string[]) : { average : number; highest : number; lowest : number }
}
class StudentAnalytics {
+studentId : string
+gradeTrends : GradeTrend[]
+attendanceTrends : AttendanceTrend[]
+subjectPerformance : SubjectPerformance[]
+overallAverage : number
+attendanceRate : number
+improvementRate : number
}
class GradeTrend {
+date : string
+grade : number
+subject : string
+type : string
}
class AttendanceTrend {
+date : string
+status : AttendanceStatus
}
class SubjectPerformance {
+subject : string
+average : number
+highest : number
+lowest : number
+count : number
}
useAnalyticsStore --> StudentAnalytics : "stores"
useAnalyticsStore --> progress-analytics.tsx : "used by"
useAnalyticsStore --> analytics-store.ts : "defined in"
```

**Diagram sources**
- [analytics-store.ts](file://lib/analytics-store.ts#L1-L83)
- [progress-analytics.tsx](file://components/progress-analytics.tsx#L1-L189)

**Section sources**
- [analytics-store.ts](file://lib/analytics-store.ts#L1-L83)

### QR Attendance Store

The `useQRAttendanceStore` manages the state for QR-based attendance sessions, including session creation, check-in tracking, and session lifecycle management.

```mermaid
classDiagram
class useQRAttendanceStore {
+sessions : QRAttendanceSession[]
+createSession(session : Omit<QRAttendanceSession, "id" | "qrCode" | "status" | "checkedInStudents">) : QRAttendanceSession
+checkIn(sessionId : string, studentId : string, locationVerified? : boolean) : { success : boolean; message : string }
+endSession(sessionId : string) : void
+getActiveSession(classId : string) : QRAttendanceSession | undefined
+getSessionByQRCode(qrCode : string) : QRAttendanceSession | undefined
+getTeacherSessions(teacherId : string) : QRAttendanceSession[]
}
class QRAttendanceSession {
+id : string
+classId : string
+className : string
+teacherId : string
+teacherName : string
+date : string
+startTime : string
+endTime : string
+qrCode : string
+status : "active" | "expired"
+checkedInStudents : string[]
+requireLocation : boolean
}
useQRAttendanceStore --> QRAttendanceSession : "manages"
useQRAttendanceStore --> qr-attendance-store.ts : "defined in"
useQRAttendanceStore --> qr-scanner.tsx : "used by"
useQRAttendanceStore --> qr-code-generator.tsx : "used by"
```

**Diagram sources**
- [qr-attendance-store.ts](file://lib/qr-attendance-store.ts#L1-L100)
- [qr-scanner.tsx](file://components/qr-scanner.tsx#L1-L161)
- [qr-code-generator.tsx](file://components/qr-code-generator.tsx#L1-L66)

**Section sources**
- [qr-attendance-store.ts](file://lib/qr-attendance-store.ts#L1-L100)

## API Integration and Security

The components integrate with various API routes that provide data and handle operations, with proper authentication and authorization checks.

### Audit Logs API Routes

The audit logs API routes provide secure access to audit log data with role-based authorization. Only administrators can access all logs, while regular users can only access their own logs.

```mermaid
sequenceDiagram
participant Client as "Frontend Component"
participant API as "API Route"
participant Supabase as "Supabase"
Client->>API : GET /api/audit-logs
API->>API : Verify authentication
API->>Supabase : Get user role
alt User is admin
API->>Supabase : Query audit_logs_with_users with filters
Supabase-->>API : Return logs
API-->>Client : Return logs with pagination
else User is not admin
API->>Supabase : Query audit_logs_with_users for user's own logs
Supabase-->>API : Return logs
API-->>Client : Return logs with pagination
end
```

**Diagram sources**
- [route.ts](file://app/api/audit-logs/route.ts#L1-L65)
- [audit-logs.ts](file://lib/supabase/audit-logs.ts#L41-L82)

**Section sources**
- [route.ts](file://app/api/audit-logs/route.ts#L1-L65)

### Audit Logs Export API

The audit logs export API allows administrators to download audit log data as CSV files, with security measures to prevent formula injection attacks.

```mermaid
sequenceDiagram
participant Admin as "Admin User"
participant ExportAPI as "Export API"
participant Supabase as "Supabase"
Admin->>ExportAPI : GET /api/audit-logs/export
ExportAPI->>ExportAPI : Verify authentication and admin role
ExportAPI->>Supabase : Query all matching audit logs
Supabase-->>ExportAPI : Return logs
ExportAPI->>ExportAPI : Convert logs to CSV with injection protection
ExportAPI-->>Admin : Return CSV file with attachment header
```

**Diagram sources**
- [export/route.ts](file://app/api/audit-logs/export/route.ts#L1-L59)
- [audit-logs.ts](file://lib/supabase/audit-logs.ts#L244-L261)

**Section sources**
- [export/route.ts](file://app/api/audit-logs/export/route.ts#L1-L59)

### Student Analytics API

The student analytics API provides detailed performance and attendance data for students, with authorization based on user role and relationship to the student.

```mermaid
sequenceDiagram
participant User as "Requesting User"
participant AnalyticsAPI as "Analytics API"
participant Supabase as "Supabase"
User->>AnalyticsAPI : GET /api/analytics/student/{id}
AnalyticsAPI->>AnalyticsAPI : Verify authentication
AnalyticsAPI->>Supabase : Get requesting user's role
AnalyticsAPI->>Supabase : Check authorization (student, teacher, parent, admin)
alt User is authorized
AnalyticsAPI->>Supabase : Query grades for student
Supabase-->>AnalyticsAPI : Return grades
AnalyticsAPI->>Supabase : Query attendance for student
Supabase-->>AnalyticsAPI : Return attendance
AnalyticsAPI->>AnalyticsAPI : Calculate trends and statistics
AnalyticsAPI-->>User : Return analytics data
else User is not authorized
AnalyticsAPI-->>User : Return 403 Forbidden
end
```

**Diagram sources**
- [analytics/student/[id]/route.ts](file://app/api/analytics/student/[id]/route.ts#L1-L163)

**Section sources**
- [analytics/student/[id]/route.ts](file://app/api/analytics/student/[id]/route.ts#L1-L163)

## Real-World Usage Examples

The components are used across various dashboards in the system, providing tailored experiences for different user roles.

### Admin Dashboard Usage

In the admin dashboard, the audit log components are used to monitor system activity, with the ability to filter logs, view statistics, and export data for compliance purposes.

**Section sources**
- [audit-log-table.tsx](file://components/audit-log-table.tsx#L1-L84)
- [audit-log-analytics.tsx](file://components/audit-log-analytics.tsx#L1-L78)
- [app/admin/audit-logs/page.tsx](file://app/admin/audit-logs/page.tsx)

### Teacher Dashboard Usage

Teachers use the QR attendance components to create attendance sessions for their classes and monitor student check-ins. They also use the Zoom meeting components to manage virtual classes.

**Section sources**
- [qr-code-generator.tsx](file://components/qr-code-generator.tsx#L1-L66)
- [qr-attendance-store.ts](file://lib/qr-attendance-store.ts#L1-L100)
- [zoom-meeting-card.tsx](file://components/zoom-meeting-card.tsx#L1-L274)
- [app/teacher/qr-attendance/page.tsx](file://app/teacher/qr-attendance/page.tsx)
- [app/teacher/meetings/page.tsx](file://app/teacher/meetings/page.tsx)

### Student Dashboard Usage

Students use the QR scanner to check in to classes and view their progress analytics to track their academic performance over time.

**Section sources**
- [qr-scanner.tsx](file://components/qr-scanner.tsx#L1-L161)
- [progress-analytics.tsx](file://components/progress-analytics.tsx#L1-L189)
- [app/student/qr-checkin/page.tsx](file://app/student/qr-checkin/page.tsx)
- [app/student/analytics/page.tsx](file://app/student/analytics/page.tsx)

## Error Handling and User Experience

The components implement comprehensive error handling to provide a smooth user experience, with appropriate feedback for various error conditions.

### QR Scanner Error Handling

The QR scanner component handles various camera-related errors and provides clear feedback to users, along with alternative methods for completing the task.

```mermaid
flowchart TD
A[Initialize Scanner] --> B{Success?}
B --> |Yes| C[Display Camera Feed]
B --> |No| D{Error Type}
D --> |Permission Denied| E[Show "Camera permission denied" message]
D --> |No Camera Found| F[Show "No camera found" message]
D --> |Other Error| G[Show "Unable to start camera" message]
E --> H[Offer Manual Input Option]
F --> H
G --> H
H --> I[User Enters Code Manually]
I --> J[Process Manual Input]
```

**Diagram sources**
- [qr-scanner.tsx](file://components/qr-scanner.tsx#L73-L87)

**Section sources**
- [qr-scanner.tsx](file://components/qr-scanner.tsx#L1-L161)

### API Error Handling

API routes implement proper error handling with logging and appropriate HTTP status codes, while frontend components display user-friendly error messages.

**Section sources**
- [route.ts](file://app/api/audit-logs/route.ts#L60-L64)
- [export/route.ts](file://app/api/audit-logs/export/route.ts#L54-L58)
- [analytics/student/[id]/route.ts](file://app/api/analytics/student/[id]/route.ts#L158-L161)

## Conclusion

The business components in the School Management System provide robust, secure, and user-friendly interfaces for key functionality including data presentation, attendance tracking, meeting management, and analytics visualization. These components are well-integrated with state management and backend services, following consistent patterns for data flow, error handling, and user experience. The modular design allows for reuse across different parts of the application while providing specialized functionality for specific use cases. The components support the needs of all user roles in the system, from administrators and teachers to students and parents, ensuring that each user has access to the tools and information they need to effectively participate in the educational process.