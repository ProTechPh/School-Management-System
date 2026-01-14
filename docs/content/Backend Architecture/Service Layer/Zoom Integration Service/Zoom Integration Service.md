# Zoom Integration Service

<cite>
**Referenced Files in This Document**   
- [client.ts](file://lib/zoom/client.ts)
- [index.ts](file://lib/zoom/index.ts)
- [types.ts](file://lib/zoom/types.ts)
- [constants.ts](file://lib/zoom/constants.ts)
- [route.ts](file://app/api/zoom/meetings/route.ts)
- [route.ts](file://app/api/zoom/meetings/[id]/route.ts)
- [route.ts](file://app/api/zoom/webhook/route.ts)
- [route.ts](file://app/api/zoom/reports/route.ts)
- [create_zoom_meetings_table.sql](file://supabase/migrations/20260110000001_create_zoom_meetings_table.sql)
- [create_meeting_registrants_table.sql](file://supabase/migrations/20260110000002_create_meeting_registrants_table.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Components](#core-components)
3. [Architecture Overview](#architecture-overview)
4. [Detailed Component Analysis](#detailed-component-analysis)
5. [Usage Examples](#usage-examples)
6. [Real-time Event Handling](#real-time-event-handling)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)
9. [Performance Aspects](#performance-aspects)
10. [Database Schema](#database-schema)

## Introduction
The Zoom Integration Service provides a comprehensive interface between the school management system and Zoom's REST APIs. This service enables teachers and administrators to create, manage, and track virtual meetings while ensuring secure access and proper authentication. The integration handles OAuth2 authentication, JWT token management, request signing, and real-time event processing through webhooks. It also manages meeting registration, participant tracking, and attendance recording with appropriate security measures for protecting personally identifiable information (PII).

## Core Components
The Zoom integration consists of several core components that work together to provide a seamless experience for managing virtual meetings within the school system. These components include the client implementation for interacting with Zoom APIs, type definitions for request/response structures, constants for configuration values, and utility functions for common operations.

**Section sources**
- [client.ts](file://lib/zoom/client.ts)
- [types.ts](file://lib/zoom/types.ts)
- [constants.ts](file://lib/zoom/constants.ts)
- [index.ts](file://lib/zoom/index.ts)

## Architecture Overview
The Zoom integration follows a modular architecture with clear separation of concerns. The service is organized into four main modules: client, types, constants, and index. The client module handles all interactions with the Zoom API, including authentication and request execution. The types module defines interfaces for all Zoom API request and response structures. The constants module stores configuration values and domain restrictions. The index module serves as the entry point, re-exporting all functionality from the other modules.

```mermaid
graph TB
subgraph "Zoom Integration"
Index[index.ts]
Client[client.ts]
Types[types.ts]
Constants[constants.ts]
end
subgraph "API Routes"
MeetingsRoute[meetings/route.ts]
WebhookRoute[webhook/route.ts]
ReportsRoute[reports/route.ts]
end
Index --> Client
Index --> Types
Index --> Constants
MeetingsRoute --> Index
WebhookRoute --> Index
ReportsRoute --> Index
```

**Diagram sources**
- [index.ts](file://lib/zoom/index.ts#L1-L10)
- [client.ts](file://lib/zoom/client.ts#L1-L334)
- [types.ts](file://lib/zoom/types.ts#L1-L168)
- [constants.ts](file://lib/zoom/constants.ts#L1-L22)

## Detailed Component Analysis

### Client Implementation
The client.ts module implements the core functionality for interacting with Zoom's REST APIs using Server-to-Server OAuth authentication. It manages token caching and automatic refresh, ensuring efficient API usage while maintaining security.

#### Authentication and Token Management
The client uses Zoom's Server-to-Server OAuth flow to obtain access tokens. It caches the token and its expiration time to avoid unnecessary requests. When a token is about to expire (within 5 minutes), it automatically requests a new one.

```mermaid
sequenceDiagram
participant Client as "Zoom Client"
participant OAuth as "Zoom OAuth"
Client->>Client : Check cached token validity
alt Token valid
Client-->>Client : Return cached token
else Token expired
Client->>OAuth : Request new token with credentials
OAuth-->>Client : Return access token and expiry
Client->>Client : Cache token and expiry
end
Client->>ZoomAPI : Make authenticated request
```

**Diagram sources**
- [client.ts](file://lib/zoom/client.ts#L17-L54)

#### Request Execution
The zoomFetch function handles all authenticated requests to the Zoom API. It automatically adds the Bearer token to requests and processes responses, handling errors and special cases like 204 No Content responses.

```mermaid
flowchart TD
Start([Request Initiated]) --> GetToken["Get Access Token"]
GetToken --> MakeRequest["Make API Request"]
MakeRequest --> CheckResponse{"Response OK?"}
CheckResponse --> |Yes| ProcessResponse["Process Response"]
CheckResponse --> |No| HandleError["Handle API Error"]
ProcessResponse --> FixPrecision["Fix Large Integer Precision"]
FixPrecision --> ReturnData["Return Parsed Data"]
HandleError --> ThrowError["Throw Error"]
ReturnData --> End([Success])
ThrowError --> End
```

**Diagram sources**
- [client.ts](file://lib/zoom/client.ts#L56-L86)

### Type Definitions
The types.ts module defines TypeScript interfaces for all Zoom API request and response structures. These types ensure type safety throughout the application and provide clear documentation of the data structures used.

```mermaid
classDiagram
class ZoomMeeting {
+id : string
+zoom_meeting_id : string
+host_id : string
+title : string
+description? : string
+meeting_type : ZoomMeetingType
+start_time : string
+duration : number
+timezone : string
+join_url : string
+start_url? : string
+password? : string
+status : ZoomMeetingStatus
+class_id? : string
+target_audience : 'all' | 'students' | 'teachers' | 'class' | 'personal'
+settings : ZoomMeetingSettings
+created_at : string
+updated_at : string
}
class ZoomParticipant {
+id : string
+meeting_id : string
+user_id? : string
+zoom_participant_id? : string
+name? : string
+email? : string
+join_time? : string
+leave_time? : string
+duration? : number
+status : ZoomParticipantStatus
+created_at : string
}
class ZoomMeetingSettings {
+host_video? : boolean
+participant_video? : boolean
+join_before_host? : boolean
+mute_upon_entry? : boolean
+waiting_room? : boolean
+auto_recording? : 'none' | 'local' | 'cloud'
+meeting_authentication? : boolean
+registration_type? : 1 | 2 | 3
+approval_type? : 0 | 1 | 2
}
ZoomMeeting --> ZoomMeetingSettings
ZoomParticipant --> ZoomMeeting
```

**Diagram sources**
- [types.ts](file://lib/zoom/types.ts#L9-L60)

### Constants and Configuration
The constants.ts module defines configuration values used throughout the Zoom integration, including domain restrictions for meeting participants.

```mermaid
erDiagram
CONFIG ||--o{ CONSTANTS : contains
CONFIG {
string name
}
CONSTANTS {
string key
string value
}
CONSTANTS {
"ALLOWED_EMAIL_DOMAIN" "r1.deped.gov.ph"
}
```

**Diagram sources**
- [constants.ts](file://lib/zoom/constants.ts#L5-L22)

**Section sources**
- [client.ts](file://lib/zoom/client.ts#L1-L334)
- [types.ts](file://lib/zoom/types.ts#L1-L168)
- [constants.ts](file://lib/zoom/constants.ts#L1-L22)

## Usage Examples
The Zoom integration is used throughout the application's API routes to handle various meeting-related operations.

### Meeting Creation
The meetings/route.ts file demonstrates how to create a Zoom meeting through the API. Teachers and administrators can create meetings that are automatically registered in the database and linked to classes.

```mermaid
sequenceDiagram
participant Client as "Frontend"
participant API as "API Route"
participant Zoom as "Zoom Client"
participant DB as "Database"
Client->>API : POST /api/zoom/meetings
API->>API : Validate user permissions
API->>Zoom : createZoomMeeting()
Zoom-->>API : Return meeting details
API->>DB : Store meeting in database
DB-->>API : Return stored meeting
API->>API : Register class students and staff
API->>API : Create calendar event
API->>API : Send notifications
API-->>Client : Return meeting details
```

**Diagram sources**
- [route.ts](file://app/api/zoom/meetings/route.ts#L54-L168)

### Meeting Management
The meetings/[id]/route.ts file handles updating and deleting existing meetings. It includes proper permission checks to ensure only meeting hosts or administrators can modify meetings.

```mermaid
flowchart TD
Start([Update Request]) --> AuthCheck["Authenticate User"]
AuthCheck --> PermissionCheck["Check Permissions"]
PermissionCheck --> |Allowed| UpdateZoom["Update in Zoom"]
PermissionCheck --> |Denied| ReturnError["Return 403"]
UpdateZoom --> UpdateDB["Update in Database"]
UpdateDB --> |Success| ReturnSuccess["Return Updated Meeting"]
UpdateDB --> |Error| HandleDBError["Handle Database Error"]
ReturnSuccess --> End([Success])
ReturnError --> End
HandleDBError --> End
```

**Diagram sources**
- [route.ts](file://app/api/zoom/meetings/[id]/route.ts#L40-L125)

**Section sources**
- [route.ts](file://app/api/zoom/meetings/route.ts#L1-L345)
- [route.ts](file://app/api/zoom/meetings/[id]/route.ts#L1-L187)

## Real-time Event Handling
The webhook/route.ts file implements real-time event handling for Zoom meetings. It processes events such as meeting start, end, participant join, and participant leave, updating the database accordingly.

### Webhook Verification
The service verifies the authenticity of webhook requests using Zoom's signature validation mechanism.

```mermaid
sequenceDiagram
participant Zoom as "Zoom"
participant Webhook as "Webhook Handler"
Zoom->>Webhook : POST with event data
Webhook->>Webhook : Extract signature and timestamp
Webhook->>Webhook : Compute expected signature
Webhook->>Webhook : Compare signatures
alt Signatures match
Webhook-->>Webhook : Process event
else Signatures don't match
Webhook-->>Zoom : Return 401 Unauthorized
end
```

**Diagram sources**
- [route.ts](file://app/api/zoom/webhook/route.ts#L47-L62)

### Attendance Tracking
When meetings end, the system processes final attendance, marking students as present, partially present, or absent based on their participation duration.

```mermaid
flowchart TD
Start([Meeting Ended]) --> GetParticipants["Get Participants"]
GetParticipants --> CalculateDuration["Calculate Duration"]
CalculateDuration --> CheckThreshold{"Duration >= 15 min?"}
CheckThreshold --> |Yes| MarkPresent["Mark as Present"]
CheckThreshold --> |No| CheckJoined{"Joined at all?"}
CheckJoined --> |Yes| MarkPartial["Mark as Partial"]
CheckJoined --> |No| MarkAbsent["Mark as Absent"]
MarkPresent --> UpdateDB["Update Attendance Records"]
MarkPartial --> UpdateDB
MarkAbsent --> UpdateDB
UpdateDB --> End([Attendance Processed])
```

**Diagram sources**
- [route.ts](file://app/api/zoom/webhook/route.ts#L285-L341)

**Section sources**
- [route.ts](file://app/api/zoom/webhook/route.ts#L1-L342)

## Error Handling
The Zoom integration includes comprehensive error handling for various scenarios including API rate limits, expired tokens, and network failures.

### API Error Handling
The client module handles Zoom API errors by parsing the response and throwing descriptive error messages.

```mermaid
flowchart TD
Start([API Request]) --> ExecuteRequest["Execute Request"]
ExecuteRequest --> CheckResponse{"Response OK?"}
CheckResponse --> |No| ParseError["Parse Error Response"]
ParseError --> ThrowError["Throw Descriptive Error"]
CheckResponse --> |Yes| ProcessSuccess["Process Success Response"]
ProcessSuccess --> End([Success])
ThrowError --> End
```

**Diagram sources**
- [client.ts](file://lib/zoom/client.ts#L71-L75)

### Token Expiration Handling
The token management system automatically handles token expiration by requesting new tokens when needed.

```mermaid
flowchart TD
Start([Request Initiated]) --> CheckToken["Check Token Validity"]
CheckToken --> |Valid| UseToken["Use Cached Token"]
CheckToken --> |Expired| RequestNew["Request New Token"]
RequestNew --> |Success| CacheToken["Cache New Token"]
RequestNew --> |Failure| ThrowError["Throw Authentication Error"]
CacheToken --> UseToken
UseToken --> MakeRequest["Make API Request"]
MakeRequest --> End([Request Complete])
ThrowError --> End
```

**Diagram sources**
- [client.ts](file://lib/zoom/client.ts#L20-L54)

**Section sources**
- [client.ts](file://lib/zoom/client.ts#L56-L86)

## Security Considerations
The Zoom integration implements several security measures to protect sensitive data and ensure authorized access.

### Webhook Signature Validation
All webhook requests are validated using Zoom's signature verification to prevent unauthorized access.

```mermaid
flowchart TD
Start([Webhook Received]) --> ExtractHeaders["Extract x-zm-signature and x-zm-request-timestamp"]
ExtractHeaders --> ComputeSignature["Compute Expected Signature"]
ComputeSignature --> CompareSignatures["Compare Signatures"]
CompareSignatures --> |Match| ProcessEvent["Process Event"]
CompareSignatures --> |No Match| RejectRequest["Reject with 401"]
ProcessEvent --> End([Event Processed])
RejectRequest --> End
```

**Diagram sources**
- [route.ts](file://app/api/zoom/webhook/route.ts#L47-L62)

### PII Handling
The system handles personally identifiable information (PII) securely, including hashing IP addresses in the database.

```mermaid
erDiagram
USER ||--o{ MEETING : participates
MEETING ||--o{ PARTICIPANT : has
PARTICIPANT {
id string
meeting_id string
user_id string
name string
email string
join_time string
leave_time string
duration int
status string
created_at string
}
MEETING {
id string
zoom_meeting_id string
host_id string
title string
description string
meeting_type string
start_time string
duration int
timezone string
join_url string
start_url string
password string
status string
class_id string
target_audience string
settings jsonb
created_at string
updated_at string
}
```

**Diagram sources**
- [create_zoom_meetings_table.sql](file://supabase/migrations/20260110000001_create_zoom_meetings_table.sql#L2-L21)
- [create_meeting_registrants_table.sql](file://supabase/migrations/20260110000002_create_meeting_registrants_table.sql#L2-L13)

**Section sources**
- [route.ts](file://app/api/zoom/webhook/route.ts#L47-L62)

## Performance Aspects
The Zoom integration includes several performance optimizations to ensure efficient operation.

### Request Batching
When registering multiple participants for a meeting, the system processes them in batches to respect rate limits.

```mermaid
flowchart TD
Start([Register Multiple Participants]) --> SplitBatch["Split into Batches of 10"]
SplitBatch --> ProcessBatch["Process Batch in Parallel"]
ProcessBatch --> Delay["Wait 100ms"]
Delay --> NextBatch{"More Batches?"}
NextBatch --> |Yes| ProcessBatch
NextBatch --> |No| CombineResults["Combine Results"]
CombineResults --> ReturnResults["Return Registration Results"]
ReturnResults --> End([Complete])
```

**Diagram sources**
- [client.ts](file://lib/zoom/client.ts#L280-L308)

### Caching
The client implements token caching to minimize authentication requests to the Zoom API.

```mermaid
flowchart TD
Start([Request Initiated]) --> CheckCache["Check Token Cache"]
CheckCache --> |Valid| UseCache["Use Cached Token"]
CheckCache --> |Expired| RefreshToken["Refresh Token"]
RefreshToken --> UpdateCache["Update Cache"]
UpdateCache --> UseCache
UseCache --> ExecuteRequest["Execute API Request"]
ExecuteRequest --> End([Request Complete])
```

**Diagram sources**
- [client.ts](file://lib/zoom/client.ts#L21-L24)

**Section sources**
- [client.ts](file://lib/zoom/client.ts#L280-L308)

## Database Schema
The Zoom integration uses several database tables to store meeting and participant information.

### Zoom Meetings Table
The zoom_meetings table stores information about created Zoom meetings, including metadata, settings, and status.

```mermaid
erDiagram
ZOOM_MEETINGS ||--o{ ZOOM_PARTICIPANTS : contains
ZOOM_MEETINGS ||--o{ MEETING_REGISTRANTS : has
ZOOM_MEETINGS {
id UUID PK
zoom_meeting_id TEXT UK
host_id UUID FK
title TEXT
description TEXT
meeting_type TEXT
start_time TIMESTAMPTZ
duration INTEGER
timezone TEXT
join_url TEXT
start_url TEXT
password TEXT
status TEXT
class_id UUID FK
target_audience TEXT
settings JSONB
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
}
ZOOM_PARTICIPANTS {
id UUID PK
meeting_id UUID FK
user_id UUID FK
zoom_participant_id TEXT
name TEXT
email TEXT
join_time TIMESTAMPTZ
leave_time TIMESTAMPTZ
duration INTEGER
status TEXT
created_at TIMESTAMPTZ
}
MEETING_REGISTRANTS {
id UUID PK
meeting_id UUID FK
user_id UUID FK
zoom_registrant_id TEXT
join_url TEXT
status TEXT
registered_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
}
```

**Diagram sources**
- [create_zoom_meetings_table.sql](file://supabase/migrations/20260110000001_create_zoom_meetings_table.sql#L2-L21)
- [create_meeting_registrants_table.sql](file://supabase/migrations/20260110000002_create_meeting_registrants_table.sql#L2-L13)

**Section sources**
- [create_zoom_meetings_table.sql](file://supabase/migrations/20260110000001_create_zoom_meetings_table.sql#L1-L113)
- [create_meeting_registrants_table.sql](file://supabase/migrations/20260110000002_create_meeting_registrants_table.sql#L1-L53)