# Zoom Integration Components

<cite>
**Referenced Files in This Document**   
- [components/zoom-meeting-card.tsx](file://components/zoom-meeting-card.tsx)
- [components/zoom-meetings-list.tsx](file://components/zoom-meetings-list.tsx)
- [components/zoom-participants-section.tsx](file://components/zoom-participants-section.tsx)
- [components/zoom-meeting-dialog.tsx](file://components/zoom-meeting-dialog.tsx)
- [components/zoom-meeting-room.tsx](file://components/zoom-meeting-room.tsx)
- [lib/zoom/client.ts](file://lib/zoom/client.ts)
- [lib/zoom/types.ts](file://lib/zoom/types.ts)
- [lib/zoom/constants.ts](file://lib/zoom/constants.ts)
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts)
- [app/api/zoom/meetings/[id]/route.ts](file://app/api/zoom/meetings/[id]/route.ts)
- [app/api/zoom/meetings/[id]/join/route.ts](file://app/api/zoom/meetings/[id]/join/route.ts)
- [app/api/zoom/meetings/[id]/participants/route.ts](file://app/api/zoom/meetings/[id]/participants/route.ts)
- [app/api/zoom/meetings/register-student/route.ts](file://app/api/zoom/meetings/register-student/route.ts)
- [app/api/zoom/webhook/route.ts](file://app/api/zoom/webhook/route.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [ZoomMeetingCard](#zoommeetingcard)
3. [ZoomMeetingsList](#zoommeetingslist)
4. [ZoomParticipantsSection](#zoomparticipantssection)
5. [ZoomMeetingDialog](#zoommeetingdialog)
6. [ZoomMeetingRoom](#zoommeetingroom)
7. [Zoom API Integration](#zoom-api-integration)
8. [Webhook Handling](#webhook-handling)
9. [Registration Workflows](#registration-workflows)
10. [Usage Examples](#usage-examples)

## Introduction
The Zoom integration components provide a comprehensive solution for managing virtual meetings within the school management system. These components enable teachers and administrators to schedule, manage, and track educational sessions while providing students and parents with seamless access to class meetings. The system integrates with Zoom's API to handle meeting lifecycle management, participant tracking, and attendance recording.

The integration supports various meeting types including class-specific sessions, staff meetings, and school-wide events. It implements domain restrictions to ensure only authorized users can join class meetings, and automatically records attendance for enrolled students. The components are designed to work together to provide a cohesive experience across different user roles and device types.

## ZoomMeetingCard
The ZoomMeetingCard component displays meeting metadata, status indicators, and action buttons in a compact, information-rich card format. It serves as the primary interface for users to view meeting details and interact with scheduled sessions.

The card displays essential meeting information including the title, description, start time, duration, and host details. Status indicators use color-coded badges to show whether a meeting is scheduled, live, ended, or cancelled. The component adapts its display based on the meeting status, showing "Start" for hosts of upcoming meetings and "Join" for participants.

Action buttons provide key functionality:
- Join/Start meeting (with loading state)
- Copy join link to clipboard
- Edit meeting (for hosts and administrators)
- Delete meeting (for hosts and administrators)

The component supports both compact and expanded views, with the compact version used in dashboard widgets and the expanded version providing full details in meeting lists. When a meeting is linked to a class, the card displays the class name as a badge.

For live meetings, the card shows real-time participant counts and attendance rates when available. Hosts and teachers can expand the participants section directly from the card to view detailed attendance information.

```mermaid
flowchart TD
A[ZoomMeetingCard] --> B[Display Meeting Metadata]
A --> C[Show Status Indicators]
A --> D[Render Action Buttons]
B --> E[Title, Description, Time, Duration]
B --> F[Host Information with Avatar]
B --> G[Class Association if applicable]
C --> H[Color-coded Status Badge]
C --> I[Live Indicator for active meetings]
D --> J[Join/Start Button]
D --> K[Copy Link Button]
D --> L[Edit Button for hosts]
D --> M[Delete Button for hosts]
N[Compact Mode] --> O[Minimalist display for dashboards]
P[Expanded Mode] --> Q[Full details with participants section]
**Diagram sources**
- [components/zoom-meeting-card.tsx](file://components/zoom-meeting-card.tsx#L1-L274)
**Section sources**
- [components/zoom-meeting-card.tsx](file://components/zoom-meeting-card.tsx#L1-L274)
## ZoomMeetingsList
The ZoomMeetingsList component aggregates scheduled sessions and provides filtering capabilities through tabbed navigation. It serves as the central hub for viewing and managing multiple meetings, with support for both upcoming and past sessions.
The component displays meetings in a grid layout with filtering options to switch between "Upcoming" and "Past" meetings. For upcoming meetings, it shows sessions that are scheduled or currently live. For past meetings, it displays sessions that have ended, allowing users to review meeting history and access recordings.
Key features include:
- Tabbed interface for filtering meetings by status
- Support for class-specific meeting lists
- Integration with ZoomMeetingDialog for creating and editing meetings
- Real-time updates when meetings are created, updated, or deleted
- Responsive design that adapts to different screen sizes
The component supports a compact mode for use in dashboard widgets, displaying only the most critical information in a space-efficient format. In compact mode, it shows a limited number of upcoming meetings with basic join functionality.
Users with appropriate permissions (teachers and administrators) can create new meetings directly from the list through a floating action button. The component handles the meeting creation workflow by opening the ZoomMeetingDialog and updating the list when a new meeting is successfully created.
```mermaid
flowchart TD
    A[ZoomMeetingsList] --> B[Fetch Meetings from API]
    A --> C[Display Tabbed Interface]
    A --> D[Support Compact Mode]
    A --> E[Integrate with ZoomMeetingDialog]
    B --> F[Filter by classId if provided]
    B --> G[Filter by status (upcoming/past)]
    C --> H[Upcoming Meetings Tab]
    C --> I[Past Meetings Tab]
    D --> J[Dashboard widget format]
    D --> K[Limited meeting display]
    E --> L[Create new meetings]
    E --> M[Edit existing meetings]
    N[User Permissions] --> O[Show create button for teachers/admins]
    P[Data Updates] --> Q[Real-time list refresh]

**Diagram sources**
- [components/zoom-meetings-list.tsx](file://components/zoom-meetings-list.tsx#L1-L246)

**Section sources**
- [components/zoom-meetings-list.tsx](file://components/zoom-meetings-list.tsx#L1-L246)

## ZoomParticipantsSection
The ZoomParticipantsSection component provides real-time attendance tracking and participant management for Zoom meetings. It displays participant information in a collapsible section that can be expanded to view detailed attendance data.

The component shows different views based on the meeting context:
- For class-linked meetings: Displays expected attendees with attendance status
- For other meetings: Shows participants who have joined
- Compact mode: Displays summary statistics only

Key features include:
- Real-time participant count and attendance rate
- Detailed participant list with join times and duration
- Visual indicators for attendance status (present/absent)
- Average attendance duration statistics
- Link to full participant report page

For class meetings, the component compares actual participants against expected attendees (enrolled students), providing a clear view of attendance. Each student is marked with a checkmark if they attended or an X if they were absent. The component also shows the duration each participant was present.

The section is collapsible to save space when not needed, with a trigger that shows basic statistics in the collapsed state. When expanded, it fetches participant data from the API and displays it in a scrollable list with avatars, names, and attendance details.

```mermaid
flowchart TD
A[ZoomParticipantsSection] --> B[Display Attendance Summary]
A --> C[Show Detailed Participant List]
A --> D[Support Compact Mode]
A --> E[Handle Class-specific Logic]
B --> F[Participant Count]
B --> G[Attendance Rate]
B --> H[Average Duration]
C --> I[Avatar and Name]
C --> J[Join Time]
C --> K[Duration]
C --> L[Role Badge]
D --> M[Minimalist display with stats only]
E --> N[Compare against enrolled students]
E --> O[Show present/absent status]
P[Data Fetching] --> Q[On-demand when expanded]
R[User Roles] --> S[Hosts, teachers, admins can view]
**Diagram sources**
- [components/zoom-participants-section.tsx](file://components/zoom-participants-section.tsx#L1-L265)
**Section sources**
- [components/zoom-participants-section.tsx](file://components/zoom-participants-section.tsx#L1-L265)
## ZoomMeetingDialog
The ZoomMeetingDialog component provides a form interface for creating and editing Zoom meetings. It is implemented as a modal dialog that can be opened from the ZoomMeetingsList or other components.
The dialog includes fields for:
- Meeting title and description
- Date and time selection
- Duration selection (30, 45, 60, 90, 120 minutes)
- Class association (optional)
- Target audience selection
- Meeting settings configuration
Target audience options include:
- Class members only
- All students
- All teachers
- Everyone
- Only invited (personal)
Meeting settings allow hosts to configure:
- Waiting room (enabled by default)
- Mute participants on entry
- Host and participant video preferences
- Other Zoom meeting options
When editing an existing meeting, the dialog pre-fills all fields with the current meeting data. For new meetings, it provides sensible defaults including the next available time slot and standard meeting settings.
The component handles form submission by calling the appropriate API endpoint (POST for new meetings, PATCH for updates) and processes the response to provide user feedback through toast notifications.
```mermaid
flowchart TD
    A[ZoomMeetingDialog] --> B[Form Fields]
    A --> C[Validation and Submission]
    A --> D[API Integration]
    B --> E[Title and Description]
    B --> F[Date and Time Pickers]
    B --> G[Duration Selector]
    B --> H[Class Dropdown]
    B --> I[Target Audience Selector]
    B --> J[Meeting Settings Switches]
    C --> K[Required field validation]
    C --> L[Loading state during submission]
    C --> M[Success/error notifications]
    D --> N[POST to create meeting]
    D --> O[PATCH to update meeting]
    P[State Management] --> Q[Populate form when editing]
    P --> R[Reset form when creating]

**Diagram sources**
- [components/zoom-meeting-dialog.tsx](file://components/zoom-meeting-dialog.tsx#L1-L326)

**Section sources**
- [components/zoom-meeting-dialog.tsx](file://components/zoom-meeting-dialog.tsx#L1-L326)

## ZoomMeetingRoom
The ZoomMeetingRoom component provides the in-session experience for Zoom meetings, embedding the Zoom meeting interface directly within the application. It handles the connection to Zoom meetings and provides controls for managing the meeting session.

Key features include:
- Embedded Zoom meeting view using Zoom Web SDK
- Fallback to external Zoom app if embedding is not available
- Meeting controls (join, leave, open in Zoom)
- Connection status indicators
- Error handling and recovery

The component follows a lifecycle:
1. Fetch join information from the API
2. Load Zoom Web SDK scripts
3. Initialize and join the meeting
4. Display the meeting interface
5. Handle meeting events and cleanup

When the Zoom SDK is not configured or fails to load, the component provides a fallback interface with a button to open the meeting in the Zoom app or web client. This ensures users can always join meetings even if the embedded experience is not available.

The component records join and leave events through API calls, which are used for attendance tracking. It also handles cleanup when the component is unmounted, ensuring proper disconnection from the meeting.

```mermaid
flowchart TD
A[ZoomMeetingRoom] --> B[Fetch Join Information]
A --> C[Load Zoom SDK]
A --> D[Initialize Meeting]
A --> E[Display Meeting Interface]
A --> F[Handle Meeting Events]
B --> G[Validate user permissions]
B --> H[Check meeting status]
C --> I[Load SDK scripts]
C --> J[Wait for SDK initialization]
D --> K[Create meeting client]
D --> L[Join meeting with signature]
E --> M[Embedded meeting view]
E --> N[Fallback to external app]
F --> O[Record join/leave events]
F --> P[Cleanup on unmount]
**Diagram sources**
- [components/zoom-meeting-room.tsx](file://components/zoom-meeting-room.tsx#L1-L254)
**Section sources**
- [components/zoom-meeting-room.tsx](file://components/zoom-meeting-room.tsx#L1-L254)
## Zoom API Integration
The Zoom API integration is implemented through a server-side client that handles communication with Zoom's API using Server-to-Server OAuth authentication. The integration provides a comprehensive set of functions for managing meetings, participants, and registrations.
The lib/zoom/client.ts module exports functions for:
- Creating, retrieving, updating, and deleting meetings
- Managing meeting participants and reports
- Handling meeting registrations
- Generating SDK signatures for embedded meetings
- Checking configuration status
Key API endpoints include:
- GET /api/zoom/meetings - List meetings with filtering
- POST /api/zoom/meetings - Create a new meeting
- GET /api/zoom/meetings/[id] - Get meeting details
- PATCH /api/zoom/meetings/[id] - Update a meeting
- DELETE /api/zoom/meetings/[id] - Delete a meeting
- GET /api/zoom/meetings/[id]/join - Get join information
- GET /api/zoom/meetings/[id]/participants - Get participant details
The integration uses caching for OAuth access tokens to minimize authentication requests. It also handles large integer precision issues by converting meeting IDs to strings in API responses.
When creating meetings, the system automatically enables registration for class-linked meetings, allowing registered users to bypass the waiting room. It also creates corresponding calendar events and sends notifications to participants.
```mermaid
flowchart TD
    A[Zoom API Client] --> B[Authentication]
    A --> C[Meeting Management]
    A --> D[Participant Management]
    A --> E[Registration Management]
    B --> F[Server-to-Server OAuth]
    B --> G[Token caching]
    C --> H[Create meetings]
    C --> I[Retrieve meetings]
    C --> J[Update meetings]
    C --> K[Delete meetings]
    D --> L[Get participants]
    D --> M[Get meeting reports]
    E --> N[Add registrants]
    E --> O[Get registrants]
    P[API Endpoints] --> Q[REST interface]
    P --> R[Authentication checks]
    P --> S[Permission validation]

**Diagram sources**
- [lib/zoom/client.ts](file://lib/zoom/client.ts#L1-L334)
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts#L1-L345)
- [app/api/zoom/meetings/[id]/route.ts](file://app/api/zoom/meetings/[id]/route.ts#L1-L187)

**Section sources**
- [lib/zoom/client.ts](file://lib/zoom/client.ts#L1-L334)
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts#L1-L345)
- [app/api/zoom/meetings/[id]/route.ts](file://app/api/zoom/meetings/[id]/route.ts#L1-L187)

## Webhook Handling
The webhook handler at app/api/zoom/webhook/route.ts receives events from Zoom and updates the application state accordingly. It processes events for meeting start, end, and participant join/leave actions.

The handler performs several critical functions:
- Validates webhook signatures for security
- Processes meeting lifecycle events
- Updates participant records in real-time
- Calculates final attendance when meetings end
- Updates student attendance records

Key events handled:
- meeting.started - Updates meeting status to "started"
- meeting.ended - Updates meeting status to "ended" and processes final attendance
- meeting.participant_joined - Creates or updates participant record
- meeting.participant_left - Updates participant record with leave time and duration

When a meeting ends, the handler processes final attendance by:
1. Marking any participants still marked as "joined" as "left"
2. Calculating total duration for each participant
3. Updating attendance records for enrolled students
4. Marking absent students who did not join

The handler includes special logic for matching participants to system users, first by email and then by Zoom participant ID. This ensures accurate tracking even when participants join without logging in.

```mermaid
flowchart TD
A[Zoom Webhook Handler] --> B[Validate Signature]
A --> C[Process Meeting Events]
A --> D[Update Participant Records]
A --> E[Calculate Attendance]
B --> F[Verify x-zm-signature header]
B --> G[Handle URL validation challenge]
C --> H[meeting.started event]
C --> I[meeting.ended event]
C --> J[meeting.participant_joined event]
C --> K[meeting.participant_left event]
D --> L[Create participant record]
D --> M[Update join/leave times]
D --> N[Accumulate duration]
E --> O[Process final attendance]
E --> P[Update student records]
E --> Q[Mark absent students]
**Diagram sources**
- [app/api/zoom/webhook/route.ts](file://app/api/zoom/webhook/route.ts#L1-L342)
**Section sources**
- [app/api/zoom/webhook/route.ts](file://app/api/zoom/webhook/route.ts#L1-L342)
## Registration Workflows
The registration system manages participant access to Zoom meetings, particularly for class-linked sessions. It implements a workflow that ensures only authorized users can join meetings while providing seamless access for enrolled students and staff.
Key components of the registration system:
- Domain restrictions for student emails
- Automatic registration for class members
- Staff registration for all class meetings
- Individual student registration
- API endpoints for registration management
The system enforces domain restrictions through the ALLOWED_EMAIL_DOMAIN constant, which limits class meeting access to users with @r1.deped.gov.ph email addresses. This ensures only verified students can join class sessions.
When a meeting is created for a class, the system automatically registers:
- All enrolled students with valid DepEd emails
- All teachers and administrators (allowing them to join any class meeting)
This registration allows these users to bypass the waiting room when joining meetings. The registration records are stored in the meeting_registrants table with personalized join URLs.
The register-student endpoint allows administrators to register a student for all upcoming meetings in a class, typically called when a student is enrolled in a class. This ensures new students have access to future class sessions.
```mermaid
flowchart TD
    A[Registration System] --> B[Domain Restrictions]
    A --> C[Automatic Registration]
    A --> D[Manual Registration]
    A --> E[Registration Storage]
    B --> F[ALLOWED_EMAIL_DOMAIN]
    B --> G[isAllowedEmail function]
    B --> H[getDomainRestrictionError]
    C --> I[Register class students]
    C --> J[Register staff members]
    C --> K[On meeting creation]
    D --> L[Admin registration]
    D --> M[register-student endpoint]
    D --> N[On student enrollment]
    E --> O[meeting_registrants table]
    E --> P[Personalized join URLs]
    Q[Access Control] --> R[Registered users bypass waiting room]
    Q --> S[Unregistered users enter waiting room]

**Diagram sources**
- [lib/zoom/constants.ts](file://lib/zoom/constants.ts#L1-L22)
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts#L1-L345)
- [app/api/zoom/meetings/register-student/route.ts](file://app/api/zoom/meetings/register-student/route.ts#L1-L116)

**Section sources**
- [lib/zoom/constants.ts](file://lib/zoom/constants.ts#L1-L22)
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts#L1-L345)
- [app/api/zoom/meetings/register-student/route.ts](file://app/api/zoom/meetings/register-student/route.ts#L1-L116)

## Usage Examples
### Meeting Scheduling by Teachers
Teachers can schedule class meetings through the ZoomMeetingsList component. When creating a meeting, they select "Class members only" as the target audience and choose their class from the dropdown. The system automatically enables registration and configures the meeting with appropriate settings (waiting room enabled, mute on entry).

When the meeting is created, the system:
1. Creates the meeting in Zoom
2. Stores meeting details in the database
3. Registers all enrolled students with valid DepEd emails
4. Registers all teachers and administrators
5. Creates a calendar event
6. Sends notifications to participants

Students receive a notification and can join the meeting directly without waiting in the waiting room due to their pre-registration.

### Student Registration
When a student is enrolled in a class, the system automatically registers them for all upcoming meetings in that class through the register-student endpoint. This process:
1. Verifies the student has a valid @r1.deped.gov.ph email
2. Finds all upcoming meetings for the class with registration enabled
3. Registers the student with Zoom for each meeting
4. Stores the registration in the database with a personalized join URL

This ensures new students have immediate access to all future class sessions without requiring manual registration.

### Post-Meeting Analytics
After a meeting ends, the system processes attendance data and updates student records. The analytics include:
- Total participants and attendance rate
- Average attendance duration
- Individual student attendance status (present, partial, absent)
- Detailed participant join/leave times

Teachers can access these analytics through the participants report page, which shows a comprehensive view of meeting attendance. The system also updates the main attendance_records table, making the data available in other parts of the application such as gradebooks and progress reports.

The analytics are particularly valuable for tracking student engagement and identifying those who may need additional support. Administrators can use this data to monitor overall participation rates across different classes and teachers.

**Section sources**
- [app/api/zoom/meetings/route.ts](file://app/api/zoom/meetings/route.ts#L1-L345)
- [app/api/zoom/webhook/route.ts](file://app/api/zoom/webhook/route.ts#L1-L342)
- [app/api/zoom/meetings/[id]/participants/route.ts](file://app/api/zoom/meetings/[id]/participants/route.ts#L1-L133)