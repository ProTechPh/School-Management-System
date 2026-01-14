# Assignments API

<cite>
**Referenced Files in This Document**   
- [assignments/route.ts](file://app/api/assignments/route.ts)
- [assignments/submit/route.ts](file://app/api/assignments/submit/route.ts)
- [student/assignments/page.tsx](file://app/student/assignments/page.tsx)
- [components/assignment-list.tsx](file://components/assignment-list.tsx)
- [lib/supabase/types.ts](file://lib/supabase/types.ts)
- [lib/assignment-store.ts](file://lib/assignment-store.ts)
- [lib/database.types.ts](file://lib/database.types.ts)
- [supabase/migrations/20260105000001_create_assignments_table.sql](file://supabase/migrations/20260105000001_create_assignments_table.sql)
- [lib/rate-limit.ts](file://lib/rate-limit.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Authentication and Authorization](#authentication-and-authorization)
5. [Submission Workflow](#submission-workflow)
6. [Error Handling](#error-handling)
7. [Frontend Implementation](#frontend-implementation)
8. [Database Schema](#database-schema)
9. [Rate Limiting](#rate-limiting)
10. [Code Examples](#code-examples)

## Introduction

The Assignments API provides functionality for students to retrieve their assignments and submit completed work. The system supports assignment retrieval with filtering and sorting capabilities, as well as secure submission of assignments with file attachments. This documentation covers the GET /api/student/assignments endpoint for fetching assignments and the POST /api/student/submit-assignment endpoint for submitting completed assignments.

The API is built on a Next.js backend with Supabase for database operations and authentication. It follows RESTful principles and uses TypeScript for type safety throughout the stack. The system enforces role-based access control, ensuring that students can only access and submit assignments for classes in which they are enrolled.

**Section sources**
- [assignments/route.ts](file://app/api/assignments/route.ts)
- [lib/supabase/types.ts](file://lib/supabase/types.ts)

## API Endpoints

### GET /api/assignments

Retrieves assignments for the authenticated user. Teachers can retrieve assignments they have created, while students can retrieve published assignments for their enrolled classes.

**Parameters**
- `classId` (optional): Filter assignments by class ID

**Response**
```json
{
  "assignments": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "class_id": "string",
      "class": {
        "id": "string",
        "name": "string",
        "subject": "string"
      },
      "teacher_id": "string",
      "teacher": {
        "id": "string",
        "name": "string"
      },
      "due_date": "string",
      "max_score": "number",
      "allow_late_submission": "boolean",
      "status": "string",
      "created_at": "string"
    }
  ]
}
```

The endpoint returns assignments sorted by due date in ascending order. For students, only assignments with status "published" are returned.

### POST /api/assignments/submit

Submits an assignment for grading. The submission can include file attachments and an optional comment.

**Request Body**
```json
{
  "assignmentId": "string",
  "comment": "string",
  "files": [
    {
      "name": "string",
      "type": "string",
      "url": "string",
      "size": "string"
    }
  ]
}
```

**Response**
```json
{
  "submission": {
    "id": "string",
    "assignment_id": "string",
    "student_id": "string",
    "submitted_at": "string",
    "status": "string",
    "comment": "string",
    "score": "number",
    "feedback": "string",
    "graded_at": "string",
    "graded_by": "string"
  }
}
```

The submission status is set to "late" if the current date exceeds the assignment's due date and late submissions are allowed.

**Section sources**
- [assignments/route.ts](file://app/api/assignments/route.ts#L18-L65)
- [assignments/submit/route.ts](file://app/api/assignments/submit/route.ts#L39-L142)

## Request/Response Schemas

The Assignments API uses TypeScript interfaces to define the structure of data exchanged between the client and server. These types are defined in the `lib/supabase/types.ts` file and are used throughout the application for type safety.

### Assignment Types

The following types are relevant to the Assignments API:

```typescript
export interface DbAssignment {
  id: string
  title: string
  description: string | null
  class_id: string | null
  teacher_id: string | null
  due_date: string
  max_score: number | null
  allow_late_submission: boolean | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export interface DbAssignmentSubmission {
  id: string
  assignment_id: string | null
  student_id: string | null
  submitted_at: string | null
  status: string | null
  comment: string | null
  score: number | null
  feedback: string | null
  graded_at: string | null
  graded_by: string | null
}

export interface DbSubmissionFile {
  id: string
  submission_id: string
  name: string
  type: string
  url: string
  size: string
}
```

These types correspond directly to the database schema and are used by Supabase to ensure type safety when querying the database.

The frontend uses simplified versions of these types in the `lib/assignment-store.ts` file:

```typescript
export interface Assignment {
  id: string
  title: string
  description: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  dueDate: string
  maxScore: number
  allowLateSubmission: boolean
  attachments: AssignmentAttachment[]
  status: AssignmentStatus
  createdAt: string
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  submittedAt: string
  status: SubmissionStatus
  files: SubmissionFile[]
  comment?: string
  score?: number
  feedback?: string
  gradedAt?: string
  gradedBy?: string
}
```

The `AssignmentStatus` and `SubmissionStatus` types are defined in `lib/types.ts`:

```typescript
export type AssignmentStatus = "draft" | "published" | "closed"
export type SubmissionStatus = "pending" | "submitted" | "graded" | "late"
```

These types ensure consistency across the application and provide clear documentation of the possible states for assignments and submissions.

**Section sources**
- [lib/supabase/types.ts](file://lib/supabase/types.ts#L157-L184)
- [lib/assignment-store.ts](file://lib/assignment-store.ts#L9-L46)
- [lib/types.ts](file://lib/types.ts#L9-L11)

## Authentication and Authorization

The Assignments API implements robust authentication and authorization mechanisms to ensure that only authorized users can access and modify assignment data.

### Authentication

All endpoints require authentication via Supabase Auth. The API verifies the user's session by calling `supabase.auth.getUser()` at the beginning of each request handler. If no valid session is found, the endpoint returns a 401 Unauthorized response.

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

### Role-Based Authorization

After authentication, the API checks the user's role to determine their access level. This is done by querying the `users` table to retrieve the user's role:

```typescript
const { data: userData } = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single()
```

#### GET /api/assignments Authorization

The authorization logic for retrieving assignments varies by user role:

- **Teachers**: Can retrieve assignments they have created
- **Students**: Can retrieve published assignments for their enrolled classes
- **Admins**: Have full access to all assignments

The implementation applies different query filters based on the user's role:

```typescript
if (userData.role === "teacher") {
  query = query.eq("teacher_id", user.id)
} else if (userData.role === "student") {
  query = query.eq("status", "published")
}
```

#### POST /api/assignments/submit Authorization

The submission endpoint has more complex authorization requirements:

1. The user must be authenticated and have a "student" role
2. The student must be enrolled in the class associated with the assignment
3. The assignment must exist and be in "published" status
4. The student must not have already submitted the assignment

The endpoint verifies enrollment by checking the `class_students` table:

```typescript
const { data: enrollment } = await supabase
  .from("class_students")
  .select("id")
  .eq("class_id", assignment.class_id)
  .eq("student_id", user.id)
  .single()

if (!enrollment) {
  return ApiErrors.forbidden()
}
```

This ensures that students can only submit assignments for classes in which they are officially enrolled.

**Section sources**
- [assignments/route.ts](file://app/api/assignments/route.ts#L20-L56)
- [assignments/submit/route.ts](file://app/api/assignments/submit/route.ts#L43-L57)

## Submission Workflow

The assignment submission process follows a well-defined workflow from the student interface to database persistence. This section details each step of the process.

### Frontend Initiation

The submission process begins in the `StudentAssignmentList` component when a student clicks the "Submit" button on an assignment card. This opens a dialog where the student can upload files and add a comment.

The component uses the `useAssignmentStore` hook to manage the submission state and ultimately calls the `submitAssignment` method when the student confirms the submission.

### API Request Processing

When the frontend submits the assignment, the following steps occur in the API:

1. **Authentication and Authorization**: The API verifies the user's identity and role, ensuring they are a student.
2. **Input Validation**: The request body is validated using Zod schema validation to ensure all required fields are present and correctly formatted.
3. **Assignment Verification**: The API checks that the specified assignment exists, is published, and belongs to a class in which the student is enrolled.
4. **Submission Status Check**: The API verifies that the student has not already submitted the assignment.
5. **Late Submission Check**: The API determines if the submission is late by comparing the current date with the assignment's due date.
6. **Database Insertion**: The API creates a new record in the `assignment_submissions` table with the appropriate status ("submitted" or "late").
7. **File Attachment**: If files are included in the submission, they are added to the `submission_files` table with a reference to the submission.

The entire process is wrapped in a try-catch block to handle any errors that may occur during processing.

### Database Operations

The submission process involves the following database operations:

1. **Query the assignments table** to verify the assignment exists and is published
2. **Query the class_students table** to verify the student is enrolled in the class
3. **Query the assignment_submissions table** to check for existing submissions
4. **Insert into the assignment_submissions table** to create the submission record
5. **Insert into the submission_files table** to store file attachment metadata

All database operations use Supabase's query builder with appropriate error handling. The API uses the `.single()` method when expecting exactly one result and handles the case where no record is found.

The submission process is designed to be atomic - either all operations succeed, or the entire transaction fails. This ensures data consistency and prevents partial submissions.

**Section sources**
- [assignments/submit/route.ts](file://app/api/assignments/submit/route.ts#L69-L136)
- [components/assignment-list.tsx](file://components/assignment-list.tsx#L58-L79)

## Error Handling

The Assignments API implements comprehensive error handling to provide meaningful feedback to users and maintain system stability.

### Client-Side Error Handling

The frontend uses the `useAssignmentStore` hook to manage errors and provide feedback to users. When a submission fails, the component displays an appropriate error message.

The `ApiErrors` utility in `lib/api-errors.ts` provides standardized error responses for common scenarios:

- `ApiErrors.unauthorized()`: When the user is not authenticated
- `ApiErrors.forbidden()`: When the user lacks permission to perform the action
- `ApiErrors.notFound("Assignment")`: When the specified assignment does not exist
- `ApiErrors.badRequest(message)`: When the request data is invalid

### Server-Side Error Handling

The API endpoints use try-catch blocks to catch and handle errors that may occur during processing. The `handleApiError` function in `lib/api-errors.ts` is used to handle unexpected errors:

```typescript
catch (error) {
  return handleApiError(error, "assignment-submit")
}
```

This ensures that internal server errors are properly logged and a consistent error response is returned to the client.

### Specific Error Scenarios

The submission endpoint handles several specific error scenarios:

1. **Unauthorized Access**: Returns 401 if the user is not authenticated
2. **Forbidden Access**: Returns 403 if the user is not a student or is not enrolled in the class
3. **Invalid Assignment**: Returns 404 if the assignment does not exist or is not published
4. **Duplicate Submission**: Returns 400 if the student has already submitted the assignment
5. **Late Submission**: Returns 400 if the assignment does not allow late submissions and the due date has passed
6. **Validation Errors**: Returns 400 with a specific error message if the request data fails validation

The API provides descriptive error messages to help users understand what went wrong and how to correct it.

### Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Descriptive error message"
}
```

This simple format is easy to parse and display in the frontend interface.

**Section sources**
- [assignments/submit/route.ts](file://app/api/assignments/submit/route.ts#L140-L141)
- [lib/api-errors.ts](file://lib/api-errors.ts)

## Frontend Implementation

The frontend implementation of the Assignments API is centered around the `StudentAssignmentList` component, which provides a user-friendly interface for viewing and submitting assignments.

### Component Structure

The `StudentAssignmentList` component is a client-side component that uses React hooks to manage state and interact with the API. It receives the following props:

- `studentId`: The ID of the authenticated student
- `studentName`: The name of the authenticated student
- `classIds`: An array of class IDs in which the student is enrolled

The component uses the `useAssignmentStore` hook to access assignment data and perform submission actions.

### State Management

The component manages several pieces of state:

- `selectedAssignment`: The currently selected assignment for submission
- `submitDialogOpen`: Whether the submission dialog is open
- `submissionComment`: The comment entered by the student
- `uploadedFiles`: The files selected for upload

```typescript
const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
const [submissionComment, setSubmissionComment] = useState("")
const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
```

### User Interface

The component renders a list of cards, each representing an assignment. Each card displays:

- Assignment title and class name
- Status badge (pending, submitted, graded, late, or overdue)
- Due date and maximum score
- Action buttons (Submit or View)

When the student clicks "Submit", a dialog opens with fields for file upload and a comment. The student can select multiple files and add a comment before submitting.

### Submission Process

When the student submits an assignment, the component calls the `submitAssignment` method from the assignment store:

```typescript
submitAssignment({
  assignmentId: selectedAssignment.id,
  studentId,
  studentName,
  files: uploadedFiles.map((f, i) => ({
    id: `file-${i}`,
    name: f.name,
    type: f.type,
    url: URL.createObjectURL(f),
    size: `${(f.size / 1024).toFixed(1)} KB`,
  })),
  comment: submissionComment || undefined,
})
```

Note that in the actual implementation, the file URLs would be generated by uploading the files to Supabase Storage first, then using the returned URLs in the submission request.

The component then resets its state and closes the dialog.

**Section sources**
- [student/assignments/page.tsx](file://app/student/assignments/page.tsx)
- [components/assignment-list.tsx](file://components/assignment-list.tsx)

## Database Schema

The Assignments API relies on a well-designed database schema to store assignment and submission data. The schema consists of three main tables: `assignments`, `assignment_submissions`, and `submission_files`.

### assignments Table

The `assignments` table stores information about each assignment:

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  max_score INTEGER DEFAULT 100,
  allow_late_submission BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Key fields:
- `id`: Unique identifier for the assignment
- `title`: The assignment title
- `description`: Optional description of the assignment
- `class_id`: Foreign key to the classes table
- `teacher_id`: Foreign key to the users table (the teacher who created the assignment)
- `due_date`: The deadline for submission
- `max_score`: Maximum possible score for the assignment
- `allow_late_submission`: Whether late submissions are accepted
- `status`: Current status of the assignment (draft, published, or closed)

### assignment_submissions Table

The `assignment_submissions` table stores student submissions:

```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'graded', 'late')),
  comment TEXT,
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(assignment_id, student_id)
);
```

Key fields:
- `assignment_id`: Foreign key to the assignments table
- `student_id`: Foreign key to the users table (the student who submitted)
- `submitted_at`: Timestamp of submission
- `status`: Current status of the submission
- `comment`: Optional comment from the student
- `score`: Score assigned by the teacher
- `feedback`: Feedback provided by the teacher
- `graded_at`: Timestamp when the submission was graded
- `graded_by`: Foreign key to the users table (the teacher who graded)

The UNIQUE constraint on `(assignment_id, student_id)` ensures that each student can only submit an assignment once.

### submission_files Table

The `submission_files` table stores information about files attached to submissions:

```sql
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  url TEXT NOT NULL,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Key fields:
- `submission_id`: Foreign key to the assignment_submissions table
- `name`: Original filename
- `type`: MIME type of the file
- `url`: URL where the file is stored (in Supabase Storage)
- `size`: File size as a string (e.g., "2.5 MB")

### Indexes and Policies

The schema includes several indexes to optimize query performance:

```sql
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON assignment_submissions(student_id);
```

Row Level Security (RLS) policies ensure that users can only access data they are authorized to see. For example, students can only submit files for their own submissions:

```sql
CREATE POLICY "Students can upload submission files" ON submission_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignment_submissions s 
      WHERE s.id = submission_files.submission_id AND s.student_id = auth.uid()
    )
  );
```

**Section sources**
- [supabase/migrations/20260105000001_create_assignments_table.sql](file://supabase/migrations/20260105000001_create_assignments_table.sql)
- [lib/database.types.ts](file://lib/database.types.ts#L96-L184)

## Rate Limiting

The Assignments API implements rate limiting to prevent abuse and ensure system stability. The rate limiting functionality is provided by the `checkRateLimit` function in `lib/rate-limit.ts`.

### Rate Limiting Implementation

The rate limiting system uses Supabase's RPC (Remote Procedure Call) functionality to implement atomic rate limiting checks. This prevents race conditions that could occur with standard database queries.

The `checkRateLimit` function takes the following parameters:

- `identifier`: A unique key to rate limit against (e.g., User ID)
- `endpoint`: The action being performed (e.g., 'submit-quiz')
- `limit`: Maximum number of requests allowed in the window
- `windowMs`: Time window in milliseconds
- `failOpen`: Whether to allow requests on database errors (default: true)

```typescript
export async function checkRateLimit(
  identifier: string, 
  endpoint: string, 
  limit: number, 
  windowMs: number,
  failOpen: boolean = true
): Promise<boolean>
```

The function uses a service role key to bypass Row Level Security and ensure the rate limiting check can always be performed, even if the user's session is invalid.

### Usage in API Endpoints

While the provided code does not show rate limiting being used in the assignment submission endpoint, the infrastructure is in place to add it. The `submit-quiz` endpoint demonstrates how rate limiting could be implemented:

```typescript
const isAllowed = await checkRateLimit(user.id, "submit-quiz", 3, 60 * 1000)
if (!isAllowed) {
  return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 })
}
```

A similar pattern could be applied to the assignment submission endpoint to limit the number of submissions a student can make within a certain time period.

### Rate Limiting Database Function

The rate limiting system relies on a database function called `check_rate_limit` that is called via RPC. This function is defined in the Supabase database and handles the logic of tracking request counts and enforcing limits.

The use of an RPC ensures that the rate limiting check is atomic and thread-safe, preventing scenarios where multiple concurrent requests could exceed the rate limit.

**Section sources**
- [lib/rate-limit.ts](file://lib/rate-limit.ts)
- [app/api/student/submit-quiz/route.ts](file://app/api/student/submit-quiz/route.ts#L15-L18)

## Code Examples

This section provides code examples demonstrating how to interact with the Assignments API from the frontend.

### Fetching Assignments

To fetch assignments for the authenticated student, make a GET request to the assignments endpoint:

```typescript
async function fetchStudentAssignments(classId?: string) {
  try {
    const url = classId 
      ? `/api/assignments?classId=${classId}`
      : '/api/assignments'
      
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.assignments
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
    throw error
  }
}
```

### Submitting an Assignment

To submit an assignment, make a POST request to the submit endpoint with the submission data:

```typescript
async function submitAssignment(assignmentId: string, formData: FormData) {
  try {
    const response = await fetch('/api/assignments/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignmentId,
        comment: formData.get('comment'),
        files: formData.getAll('files').map((file: File) => ({
          name: file.name,
          type: file.type,
          size: file.size.toString(),
          // In a real implementation, you would first upload the file to Supabase Storage
          // and use the returned URL here
          url: URL.createObjectURL(file)
        }))
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error)
    }
    
    const result = await response.json()
    return result.submission
  } catch (error) {
    console.error('Failed to submit assignment:', error)
    throw error
  }
}
```

### Handling Submission Response

After submitting an assignment, handle the response appropriately:

```typescript
async function handleAssignmentSubmission(assignmentId: string, formData: FormData) {
  const submitButton = document.getElementById('submit-button')
  
  try {
    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true
    
    const submission = await submitAssignment(assignmentId, formData)
    
    // Show success message
    showNotification('Assignment submitted successfully!', 'success')
    
    // Update UI to reflect submission
    updateAssignmentStatus(assignmentId, submission.status)
    
    // Close submission dialog
    closeSubmissionDialog()
    
  } catch (error) {
    // Show error message
    showNotification(`Submission failed: ${error.message}`, 'error')
  } finally {
    // Re-enable submit button
    submitButton.disabled = false
  }
}
```

### Error Handling in Components

When using the API in React components, implement proper error handling:

```typescript
"use client"

import { useState, useEffect } from "react"

export function AssignmentManager() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    async function loadAssignments() {
      try {
        setError(null)
        setLoading(true)
        
        const assignmentsData = await fetchStudentAssignments()
        setAssignments(assignmentsData)
        
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadAssignments()
  }, [])
  
  if (loading) return <div>Loading assignments...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      {assignments.map(assignment => (
        <AssignmentCard key={assignment.id} assignment={assignment} />
      ))}
    </div>
  )
}
```

These examples demonstrate proper error handling, loading states, and user feedback when interacting with the Assignments API.

**Section sources**
- [components/assignment-list.tsx](file://components/assignment-list.tsx)
- [student/assignments/page.tsx](file://app/student/assignments/page.tsx)