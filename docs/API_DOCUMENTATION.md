# School Management System - API Documentation

## Overview

The School Management System provides a comprehensive RESTful API built with Laravel 11 and Laravel Sanctum for authentication. This API enables management of all aspects of school operations including students, staff, attendance, exams, fees, library, transport, and more.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All API endpoints (except login) require authentication using Laravel Sanctum tokens. Include the token in the Authorization header:

```
Authorization: Bearer {your-token}
```

## Response Format

All API responses follow a consistent JSON format:

### Success Response
```json
{
    "data": {
        // Response data
    },
    "message": "Success message",
    "status": "success"
}
```

### Error Response
```json
{
    "message": "Error message",
    "errors": {
        "field": ["Validation error message"]
    }
}
```

## Authentication Endpoints

### Login
Authenticate a user and receive an access token.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
    "email": "admin@demoschool.edu",
    "password": "password"
}
```

**Response:**
```json
{
    "data": {
        "user": {
            "id": 1,
            "name": "Admin User",
            "email": "admin@demoschool.edu",
            "roles": ["Admin"]
        },
        "token": "1|abc123def456..."
    },
    "message": "Login successful",
    "status": "success"
}
```

### Logout
Revoke the current access token.

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
    "message": "Logged out successfully",
    "status": "success"
}
```

### Get Current User
Get information about the currently authenticated user.

**Endpoint:** `GET /api/v1/auth/me`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
    "data": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@demoschool.edu",
        "roles": ["Admin"],
        "permissions": ["*"]
    },
    "status": "success"
}
```

## Student Management

### List Students
Retrieve a paginated list of students with optional filtering.

**Endpoint:** `GET /api/v1/students`

**Query Parameters:**
- `search` (string): Search by name or email
- `is_active` (boolean): Filter by active status
- `per_page` (integer): Number of items per page (default: 15)
- `page` (integer): Page number

**Example Request:**
```
GET /api/v1/students?search=john&is_active=true&per_page=10
```

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "student_id": "STU001",
            "admission_number": "ADM2024001",
            "admission_date": "2024-01-15",
            "blood_group": "O+",
            "medical_conditions": [],
            "emergency_contact": {
                "name": "John Doe Sr.",
                "phone": "+1234567890",
                "relationship": "Father"
            },
            "is_active": true,
            "user": {
                "id": 1,
                "name": "John Doe",
                "email": "john.doe@student.edu",
                "phone": "+1234567890",
                "date_of_birth": "2010-05-15",
                "gender": "male"
            },
            "guardians": [
                {
                    "id": 1,
                    "relationship": "Father",
                    "is_primary": true,
                    "user": {
                        "name": "John Doe Sr.",
                        "email": "john.sr@email.com",
                        "phone": "+1234567890"
                    }
                }
            ],
            "enrollments": [
                {
                    "id": 1,
                    "academic_year": "2024-2025",
                    "class": "Grade 10",
                    "section": "A",
                    "enrollment_date": "2024-01-15"
                }
            ]
        }
    ],
    "links": {
        "first": "http://localhost:8000/api/v1/students?page=1",
        "last": "http://localhost:8000/api/v1/students?page=10",
        "prev": null,
        "next": "http://localhost:8000/api/v1/students?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 10,
        "per_page": 15,
        "to": 15,
        "total": 150
    },
    "status": "success"
}
```

### Create Student
Create a new student record.

**Endpoint:** `POST /api/v1/students`

**Request Body:**
```json
{
    "name": "Jane Smith",
    "email": "jane.smith@student.edu",
    "password": "password123",
    "phone": "+1234567890",
    "address": "123 Main St, City, State",
    "date_of_birth": "2010-08-20",
    "gender": "female",
    "student_id": "STU002",
    "admission_number": "ADM2024002",
    "admission_date": "2024-01-20",
    "blood_group": "A+",
    "medical_conditions": ["Asthma"],
    "emergency_contact": {
        "name": "Jane Smith Sr.",
        "phone": "+1234567891",
        "relationship": "Mother"
    },
    "guardian_ids": [2]
}
```

**Response:**
```json
{
    "data": {
        "id": 2,
        "student_id": "STU002",
        "admission_number": "ADM2024002",
        "admission_date": "2024-01-20",
        "blood_group": "A+",
        "medical_conditions": ["Asthma"],
        "emergency_contact": {
            "name": "Jane Smith Sr.",
            "phone": "+1234567891",
            "relationship": "Mother"
        },
        "is_active": true,
        "user": {
            "id": 2,
            "name": "Jane Smith",
            "email": "jane.smith@student.edu",
            "phone": "+1234567890",
            "date_of_birth": "2010-08-20",
            "gender": "female"
        }
    },
    "message": "Student created successfully",
    "status": "success"
}
```

### Get Student
Retrieve a specific student by ID.

**Endpoint:** `GET /api/v1/students/{id}`

**Response:**
```json
{
    "data": {
        "id": 1,
        "student_id": "STU001",
        "admission_number": "ADM2024001",
        "admission_date": "2024-01-15",
        "blood_group": "O+",
        "medical_conditions": [],
        "emergency_contact": {
            "name": "John Doe Sr.",
            "phone": "+1234567890",
            "relationship": "Father"
        },
        "is_active": true,
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@student.edu",
            "phone": "+1234567890",
            "date_of_birth": "2010-05-15",
            "gender": "male"
        },
        "guardians": [...],
        "enrollments": [...],
        "attendances": [...],
        "exam_results": [...],
        "fee_invoices": [...]
    },
    "status": "success"
}
```

### Update Student
Update an existing student record.

**Endpoint:** `PUT /api/v1/students/{id}`

**Request Body:**
```json
{
    "name": "John Doe Updated",
    "phone": "+1234567899",
    "address": "456 New St, City, State",
    "blood_group": "O-",
    "medical_conditions": ["Diabetes"]
}
```

### Delete Student
Delete a student record (soft delete).

**Endpoint:** `DELETE /api/v1/students/{id}`

**Response:**
```json
{
    "message": "Student deleted successfully",
    "status": "success"
}
```

## Staff Management

### List Staff
Retrieve a paginated list of staff members.

**Endpoint:** `GET /api/v1/teachers`

**Query Parameters:**
- `search` (string): Search by name or email
- `department` (string): Filter by department
- `designation` (string): Filter by designation
- `is_active` (boolean): Filter by active status
- `per_page` (integer): Number of items per page

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "employee_id": "EMP001",
            "joining_date": "2020-01-15",
            "salary": 50000.00,
            "department": "Mathematics",
            "designation": "Senior Teacher",
            "qualification": "M.Sc Mathematics",
            "experience_years": 5,
            "is_active": true,
            "user": {
                "id": 3,
                "name": "Dr. Sarah Johnson",
                "email": "sarah.johnson@teacher.edu",
                "phone": "+1234567892",
                "date_of_birth": "1985-03-10",
                "gender": "female"
            }
        }
    ],
    "status": "success"
}
```

### Create Staff
Create a new staff member.

**Endpoint:** `POST /api/v1/teachers`

**Request Body:**
```json
{
    "name": "Michael Brown",
    "email": "michael.brown@teacher.edu",
    "password": "password123",
    "phone": "+1234567893",
    "address": "789 Teacher St, City, State",
    "date_of_birth": "1988-07-25",
    "gender": "male",
    "employee_id": "EMP002",
    "joining_date": "2024-01-20",
    "salary": 45000.00,
    "department": "Science",
    "designation": "Teacher",
    "qualification": "B.Sc Physics",
    "experience_years": 3
}
```

## Attendance Management

### Student Attendance

#### List Student Attendance
Retrieve attendance records for students.

**Endpoint:** `GET /api/v1/student-attendance`

**Query Parameters:**
- `student_id` (integer): Filter by student
- `date_from` (date): Start date filter
- `date_to` (date): End date filter
- `status` (string): Filter by status (present, absent, late)
- `class_id` (integer): Filter by class
- `section_id` (integer): Filter by section

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "student_id": 1,
            "date": "2024-01-15",
            "status": "present",
            "remarks": null,
            "marked_by": 3,
            "student": {
                "id": 1,
                "name": "John Doe",
                "student_id": "STU001"
            },
            "marked_by_user": {
                "id": 3,
                "name": "Dr. Sarah Johnson"
            }
        }
    ],
    "status": "success"
}
```

#### Mark Student Attendance
Mark attendance for a single student.

**Endpoint:** `POST /api/v1/student-attendance`

**Request Body:**
```json
{
    "student_id": 1,
    "date": "2024-01-15",
    "status": "present",
    "remarks": "On time"
}
```

#### Bulk Mark Student Attendance
Mark attendance for multiple students at once.

**Endpoint:** `POST /api/v1/student-attendance/bulk`

**Request Body:**
```json
{
    "date": "2024-01-15",
    "class_id": 1,
    "section_id": 1,
    "attendance": [
        {
            "student_id": 1,
            "status": "present"
        },
        {
            "student_id": 2,
            "status": "absent",
            "remarks": "Sick leave"
        },
        {
            "student_id": 3,
            "status": "late",
            "remarks": "Traffic delay"
        }
    ]
}
```

#### Get Attendance Summary
Get attendance summary statistics.

**Endpoint:** `GET /api/v1/student-attendance/summary`

**Query Parameters:**
- `student_id` (integer): Student ID for individual summary
- `class_id` (integer): Class ID for class summary
- `date_from` (date): Start date
- `date_to` (date): End date

**Response:**
```json
{
    "data": {
        "total_days": 20,
        "present_days": 18,
        "absent_days": 2,
        "late_days": 1,
        "attendance_percentage": 90.0,
        "summary_by_date": [
            {
                "date": "2024-01-15",
                "present": 25,
                "absent": 2,
                "late": 1,
                "total": 28
            }
        ]
    },
    "status": "success"
}
```

### Staff Attendance

#### List Staff Attendance
Retrieve attendance records for staff.

**Endpoint:** `GET /api/v1/staff-attendance`

#### Check In
Record staff check-in time.

**Endpoint:** `POST /api/v1/staff-attendance/check-in`

**Request Body:**
```json
{
    "staff_id": 1,
    "check_in_time": "2024-01-15 08:30:00",
    "remarks": "On time"
}
```

#### Check Out
Record staff check-out time.

**Endpoint:** `POST /api/v1/staff-attendance/check-out`

**Request Body:**
```json
{
    "staff_id": 1,
    "check_out_time": "2024-01-15 17:00:00",
    "remarks": "Regular hours"
}
```

## Exam Management

### Exam Results

#### List Exam Results
Retrieve exam results with filtering options.

**Endpoint:** `GET /api/v1/exam-results`

**Query Parameters:**
- `student_id` (integer): Filter by student
- `exam_term_id` (integer): Filter by exam term
- `subject_id` (integer): Filter by subject
- `class_id` (integer): Filter by class
- `section_id` (integer): Filter by section

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "student_id": 1,
            "exam_term_id": 1,
            "subject_id": 1,
            "marks_obtained": 85,
            "total_marks": 100,
            "grade": "A",
            "grade_points": 4.0,
            "remarks": "Excellent performance",
            "student": {
                "id": 1,
                "name": "John Doe",
                "student_id": "STU001"
            },
            "exam_term": {
                "id": 1,
                "name": "Mid Term Exam",
                "academic_year": "2024-2025"
            },
            "subject": {
                "id": 1,
                "name": "Mathematics",
                "code": "MATH101"
            }
        }
    ],
    "status": "success"
}
```

#### Create Exam Result
Create a new exam result record.

**Endpoint:** `POST /api/v1/exam-results`

**Request Body:**
```json
{
    "student_id": 1,
    "exam_term_id": 1,
    "subject_id": 1,
    "marks_obtained": 85,
    "total_marks": 100,
    "remarks": "Good performance"
}
```

#### Bulk Create Exam Results
Create multiple exam results at once.

**Endpoint:** `POST /api/v1/exam-results/bulk`

**Request Body:**
```json
{
    "exam_term_id": 1,
    "class_id": 1,
    "section_id": 1,
    "subject_id": 1,
    "total_marks": 100,
    "results": [
        {
            "student_id": 1,
            "marks_obtained": 85
        },
        {
            "student_id": 2,
            "marks_obtained": 92
        },
        {
            "student_id": 3,
            "marks_obtained": 78
        }
    ]
}
```

#### Get Report Card
Generate a student's report card.

**Endpoint:** `GET /api/v1/exam-results/report-card`

**Query Parameters:**
- `student_id` (integer): Student ID (required)
- `exam_term_id` (integer): Exam term ID (required)

**Response:**
```json
{
    "data": {
        "student": {
            "id": 1,
            "name": "John Doe",
            "student_id": "STU001",
            "class": "Grade 10",
            "section": "A"
        },
        "exam_term": {
            "id": 1,
            "name": "Mid Term Exam",
            "academic_year": "2024-2025"
        },
        "results": [
            {
                "subject": "Mathematics",
                "marks_obtained": 85,
                "total_marks": 100,
                "grade": "A",
                "grade_points": 4.0
            },
            {
                "subject": "Science",
                "marks_obtained": 88,
                "total_marks": 100,
                "grade": "A",
                "grade_points": 4.0
            }
        ],
        "total_marks": 200,
        "obtained_marks": 173,
        "percentage": 86.5,
        "overall_grade": "A",
        "rank": 5
    },
    "status": "success"
}
```

#### Get Class Results
Get exam results for an entire class.

**Endpoint:** `GET /api/v1/exam-results/class-results`

**Query Parameters:**
- `class_id` (integer): Class ID (required)
- `section_id` (integer): Section ID (required)
- `exam_term_id` (integer): Exam term ID (required)
- `subject_id` (integer): Subject ID (optional)

## Fee Management

### Fee Invoices

#### List Fee Invoices
Retrieve fee invoices with filtering options.

**Endpoint:** `GET /api/v1/fee-invoices`

**Query Parameters:**
- `student_id` (integer): Filter by student
- `class_id` (integer): Filter by class
- `status` (string): Filter by status (pending, paid, overdue)
- `date_from` (date): Start date filter
- `date_to` (date): End date filter

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "student_id": 1,
            "fee_structure_id": 1,
            "invoice_number": "INV2024001",
            "amount": 5000.00,
            "due_date": "2024-02-15",
            "status": "pending",
            "created_at": "2024-01-15T10:00:00Z",
            "student": {
                "id": 1,
                "name": "John Doe",
                "student_id": "STU001"
            },
            "fee_structure": {
                "id": 1,
                "name": "Monthly Tuition Fee",
                "description": "Monthly tuition fee for Grade 10"
            }
        }
    ],
    "status": "success"
}
```

#### Create Fee Invoice
Create a new fee invoice.

**Endpoint:** `POST /api/v1/fee-invoices`

**Request Body:**
```json
{
    "student_id": 1,
    "fee_structure_id": 1,
    "amount": 5000.00,
    "due_date": "2024-02-15",
    "description": "Monthly tuition fee for January 2024"
}
```

#### Bulk Create Fee Invoices
Create multiple fee invoices at once.

**Endpoint:** `POST /api/v1/fee-invoices/bulk`

**Request Body:**
```json
{
    "class_id": 1,
    "section_id": 1,
    "fee_structure_id": 1,
    "amount": 5000.00,
    "due_date": "2024-02-15",
    "description": "Monthly tuition fee for January 2024"
}
```

#### Get Student Fee Summary
Get fee summary for a specific student.

**Endpoint:** `GET /api/v1/fee-invoices/student-summary`

**Query Parameters:**
- `student_id` (integer): Student ID (required)

**Response:**
```json
{
    "data": {
        "student": {
            "id": 1,
            "name": "John Doe",
            "student_id": "STU001"
        },
        "total_invoices": 5,
        "total_amount": 25000.00,
        "paid_amount": 20000.00,
        "pending_amount": 5000.00,
        "overdue_amount": 2000.00,
        "invoices": [
            {
                "id": 1,
                "invoice_number": "INV2024001",
                "amount": 5000.00,
                "due_date": "2024-02-15",
                "status": "pending",
                "paid_amount": 0.00
            }
        ]
    },
    "status": "success"
}
```

### Fee Payments

#### List Fee Payments
Retrieve fee payment records.

**Endpoint:** `GET /api/v1/fee-payments`

**Query Parameters:**
- `student_id` (integer): Filter by student
- `invoice_id` (integer): Filter by invoice
- `payment_method` (string): Filter by payment method
- `date_from` (date): Start date filter
- `date_to` (date): End date filter

#### Create Fee Payment
Record a fee payment.

**Endpoint:** `POST /api/v1/fee-payments`

**Request Body:**
```json
{
    "fee_invoice_id": 1,
    "amount": 5000.00,
    "payment_method": "cash",
    "payment_date": "2024-01-20",
    "reference_number": "PAY2024001",
    "remarks": "Payment received in full"
}
```

#### Confirm Payment
Confirm a pending payment.

**Endpoint:** `POST /api/v1/fee-payments/{id}/confirm`

#### Cancel Payment
Cancel a payment.

**Endpoint:** `POST /api/v1/fee-payments/{id}/cancel`

#### Get Payment Summary
Get payment summary statistics.

**Endpoint:** `GET /api/v1/fee-payments/summary`

**Response:**
```json
{
    "data": {
        "total_payments": 150,
        "total_amount": 750000.00,
        "payments_by_method": {
            "cash": 75000.00,
            "bank_transfer": 500000.00,
            "cheque": 175000.00
        },
        "payments_by_month": [
            {
                "month": "2024-01",
                "count": 25,
                "amount": 125000.00
            }
        ]
    },
    "status": "success"
}
```

## Library Management

### Books

#### List Books
Retrieve books with filtering options.

**Endpoint:** `GET /api/v1/books`

**Query Parameters:**
- `search` (string): Search by title, author, or ISBN
- `category` (string): Filter by category
- `subject` (string): Filter by subject
- `is_reference` (boolean): Filter reference books
- `is_active` (boolean): Filter by active status

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "title": "Advanced Mathematics",
            "author": "Dr. John Smith",
            "isbn": "978-1234567890",
            "publisher": "Academic Press",
            "publication_year": 2023,
            "category": "Textbook",
            "subject": "Mathematics",
            "is_reference": false,
            "total_copies": 5,
            "available_copies": 3,
            "is_active": true,
            "copies": [
                {
                    "id": 1,
                    "copy_number": "MATH001",
                    "status": "available",
                    "condition": "good"
                }
            ]
        }
    ],
    "status": "success"
}
```

#### Create Book
Add a new book to the library.

**Endpoint:** `POST /api/v1/books`

**Request Body:**
```json
{
    "title": "Introduction to Physics",
    "author": "Dr. Jane Wilson",
    "isbn": "978-0987654321",
    "publisher": "Science Publishers",
    "publication_year": 2023,
    "category": "Textbook",
    "subject": "Physics",
    "is_reference": false,
    "description": "Comprehensive introduction to physics concepts"
}
```

#### Get Book Categories
Get list of available book categories.

**Endpoint:** `GET /api/v1/books/categories`

**Response:**
```json
{
    "data": [
        "Textbook",
        "Reference",
        "Fiction",
        "Non-Fiction",
        "Magazine",
        "Journal"
    ],
    "status": "success"
}
```

#### Get Book Subjects
Get list of available book subjects.

**Endpoint:** `GET /api/v1/books/subjects`

#### Get Available Copies
Get available copies of a specific book.

**Endpoint:** `GET /api/v1/books/{id}/available-copies`

### Book Loans

#### List Book Loans
Retrieve book loan records.

**Endpoint:** `GET /api/v1/book-loans`

**Query Parameters:**
- `student_id` (integer): Filter by student
- `status` (string): Filter by status (active, returned, overdue)
- `overdue` (boolean): Filter overdue loans
- `date_from` (date): Start date filter
- `date_to` (date): End date filter

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "book_id": 1,
            "book_copy_id": 1,
            "student_id": 1,
            "loan_date": "2024-01-15",
            "due_date": "2024-01-29",
            "return_date": null,
            "status": "active",
            "fine_amount": 0.00,
            "book": {
                "id": 1,
                "title": "Advanced Mathematics",
                "author": "Dr. John Smith"
            },
            "book_copy": {
                "id": 1,
                "copy_number": "MATH001"
            },
            "student": {
                "id": 1,
                "name": "John Doe",
                "student_id": "STU001"
            }
        }
    ],
    "status": "success"
}
```

#### Create Book Loan
Issue a book to a student.

**Endpoint:** `POST /api/v1/book-loans`

**Request Body:**
```json
{
    "book_copy_id": 1,
    "student_id": 1,
    "due_date": "2024-01-29",
    "remarks": "Regular loan"
}
```

#### Return Book
Return a borrowed book.

**Endpoint:** `POST /api/v1/book-loans/{id}/return`

**Request Body:**
```json
{
    "return_date": "2024-01-25",
    "condition": "good",
    "remarks": "Book returned in good condition"
}
```

#### Get Student Loans
Get all loans for a specific student.

**Endpoint:** `GET /api/v1/book-loans/student-loans`

**Query Parameters:**
- `student_id` (integer): Student ID (required)

#### Get Overdue Loans
Get all overdue book loans.

**Endpoint:** `GET /api/v1/book-loans/overdue`

#### Get Loan Statistics
Get library loan statistics.

**Endpoint:** `GET /api/v1/book-loans/statistics`

**Response:**
```json
{
    "data": {
        "total_loans": 150,
        "active_loans": 45,
        "overdue_loans": 5,
        "returned_loans": 100,
        "loans_by_month": [
            {
                "month": "2024-01",
                "count": 25
            }
        ],
        "popular_books": [
            {
                "book_id": 1,
                "title": "Advanced Mathematics",
                "loan_count": 15
            }
        ]
    },
    "status": "success"
}
```

### Book Fines

#### List Book Fines
Retrieve book fine records.

**Endpoint:** `GET /api/v1/book-fines`

#### Pay Fine
Record payment of a book fine.

**Endpoint:** `POST /api/v1/book-fines/{id}/pay`

**Request Body:**
```json
{
    "amount_paid": 50.00,
    "payment_method": "cash",
    "payment_date": "2024-01-25"
}
```

#### Waive Fine
Waive a book fine.

**Endpoint:** `POST /api/v1/book-fines/{id}/waive`

**Request Body:**
```json
{
    "reason": "Book damaged during loan period",
    "waived_by": 3
}
```

#### Generate Overdue Fines
Generate fines for overdue books.

**Endpoint:** `POST /api/v1/book-fines/generate-overdue`

## Transport Management

### Transport Routes

#### List Transport Routes
Retrieve transport routes.

**Endpoint:** `GET /api/v1/transport-routes`

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "name": "Route A - Downtown",
            "code": "RT001",
            "description": "Main downtown route",
            "fare": 100.00,
            "is_active": true,
            "stops": [
                {
                    "id": 1,
                    "name": "Central Station",
                    "address": "123 Main St",
                    "sequence_order": 1,
                    "pickup_time": "07:30:00",
                    "drop_time": "15:30:00"
                }
            ]
        }
    ],
    "status": "success"
}
```

#### Create Transport Route
Create a new transport route.

**Endpoint:** `POST /api/v1/transport-routes`

**Request Body:**
```json
{
    "name": "Route B - Suburbs",
    "code": "RT002",
    "description": "Suburban route",
    "fare": 120.00,
    "stops": [
        {
            "stop_id": 2,
            "sequence_order": 1,
            "pickup_time": "07:45:00",
            "drop_time": "15:45:00"
        }
    ]
}
```

#### Get Route Assignments
Get all assignments for a specific route.

**Endpoint:** `GET /api/v1/transport-routes/{id}/assignments`

### Transport Vehicles

#### List Transport Vehicles
Retrieve transport vehicles.

**Endpoint:** `GET /api/v1/transport-vehicles`

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "vehicle_number": "SCH001",
            "vehicle_type": "bus",
            "capacity": 50,
            "driver_name": "John Driver",
            "driver_license": "DL123456",
            "driver_phone": "+1234567890",
            "insurance_expiry": "2024-12-31",
            "registration_expiry": "2024-06-30",
            "fitness_expiry": "2024-03-31",
            "is_active": true
        }
    ],
    "status": "success"
}
```

### Transport Stops

#### List Transport Stops
Retrieve transport stops.

**Endpoint:** `GET /api/v1/transport-stops`

### Transport Assignments

#### List Transport Assignments
Retrieve student transport assignments.

**Endpoint:** `GET /api/v1/transport-assignments`

**Response:**
```json
{
    "data": [
        {
            "id": 1,
            "student_id": 1,
            "transport_route_id": 1,
            "pickup_stop_id": 1,
            "drop_stop_id": 2,
            "start_date": "2024-01-15",
            "end_date": null,
            "status": "active",
            "monthly_fare": 100.00,
            "student": {
                "id": 1,
                "name": "John Doe",
                "student_id": "STU001"
            },
            "route": {
                "id": 1,
                "name": "Route A - Downtown",
                "code": "RT001"
            }
        }
    ],
    "status": "success"
}
```

#### Create Transport Assignment
Assign a student to a transport route.

**Endpoint:** `POST /api/v1/transport-assignments`

**Request Body:**
```json
{
    "student_id": 1,
    "transport_route_id": 1,
    "pickup_stop_id": 1,
    "drop_stop_id": 2,
    "start_date": "2024-01-15",
    "monthly_fare": 100.00
}
```

## Reports

### Dashboard
Get dashboard statistics and overview.

**Endpoint:** `GET /api/v1/reports/dashboard`

**Response:**
```json
{
    "data": {
        "total_students": 500,
        "total_staff": 50,
        "total_classes": 20,
        "attendance_today": {
            "students": 480,
            "staff": 48
        },
        "recent_activities": [
            {
                "id": 1,
                "description": "New student enrolled",
                "user": "John Doe",
                "created_at": "2024-01-15T10:00:00Z"
            }
        ],
        "upcoming_events": [
            {
                "id": 1,
                "title": "Parent-Teacher Meeting",
                "date": "2024-01-20",
                "time": "10:00:00"
            }
        ]
    },
    "status": "success"
}
```

### Attendance Report
Generate attendance reports.

**Endpoint:** `GET /api/v1/reports/attendance`

**Query Parameters:**
- `type` (string): Report type (daily, monthly, yearly)
- `date_from` (date): Start date
- `date_to` (date): End date
- `class_id` (integer): Filter by class
- `section_id` (integer): Filter by section

### Exam Results Report
Generate exam results reports.

**Endpoint:** `GET /api/v1/reports/exam-results`

**Query Parameters:**
- `exam_term_id` (integer): Exam term ID
- `class_id` (integer): Class ID
- `section_id` (integer): Section ID
- `subject_id` (integer): Subject ID

### Fee Report
Generate fee-related reports.

**Endpoint:** `GET /api/v1/reports/fees`

**Query Parameters:**
- `type` (string): Report type (collection, outstanding, summary)
- `date_from` (date): Start date
- `date_to` (date): End date
- `class_id` (integer): Filter by class

### Library Report
Generate library reports.

**Endpoint:** `GET /api/v1/reports/library`

**Query Parameters:**
- `type` (string): Report type (loans, overdue, popular)
- `date_from` (date): Start date
- `date_to` (date): End date

### Transport Report
Generate transport reports.

**Endpoint:** `GET /api/v1/reports/transport`

**Query Parameters:**
- `type` (string): Report type (routes, vehicles, assignments)
- `route_id` (integer): Filter by route

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages:

### Common Error Codes

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

### Error Response Examples

**Validation Error:**
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    }
}
```

**Authentication Error:**
```json
{
    "message": "Unauthenticated."
}
```

**Authorization Error:**
```json
{
    "message": "This action is unauthorized."
}
```

**Not Found Error:**
```json
{
    "message": "No query results for model [App\\Models\\Student] 999"
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General API endpoints**: 60 requests per minute
- **Bulk operations**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 15, max: 100)

Pagination metadata is included in responses:
```json
{
    "data": [...],
    "links": {
        "first": "http://localhost:8000/api/v1/students?page=1",
        "last": "http://localhost:8000/api/v1/students?page=10",
        "prev": null,
        "next": "http://localhost:8000/api/v1/students?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 10,
        "per_page": 15,
        "to": 15,
        "total": 150
    }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting:

### Filtering
Use query parameters to filter results:
```
GET /api/v1/students?search=john&is_active=true&per_page=10
```

### Sorting
Use the `sort` parameter for sorting:
```
GET /api/v1/students?sort=name,asc
GET /api/v1/students?sort=created_at,desc
```

## File Uploads

Some endpoints support file uploads (e.g., student photos, documents):

**Request Format:**
```
Content-Type: multipart/form-data
```

**Example:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "photo": [file upload]
}
```

## Webhooks

The system supports webhooks for real-time notifications:

### Available Webhooks
- `student.enrolled`: When a new student is enrolled
- `payment.received`: When a fee payment is received
- `attendance.marked`: When attendance is marked
- `book.overdue`: When a book becomes overdue

### Webhook Configuration
Configure webhooks in the admin panel or via API:
```json
{
    "url": "https://your-app.com/webhook",
    "events": ["student.enrolled", "payment.received"],
    "secret": "your-webhook-secret"
}
```

## SDKs and Libraries

### PHP
```php
use GuzzleHttp\Client;

$client = new Client([
    'base_uri' => 'http://localhost:8000/api/v1/',
    'headers' => [
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ]
]);

$response = $client->get('students');
$students = json_decode($response->getBody(), true);
```

### JavaScript
```javascript
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1/',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    }
});

const students = await api.get('students');
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'
}

response = requests.get('http://localhost:8000/api/v1/students', headers=headers)
students = response.json()
```

## Testing

### Postman Collection
A Postman collection is available for testing all API endpoints. Import the collection and configure the environment variables:

- `base_url`: `http://localhost:8000/api/v1`
- `token`: Your authentication token

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demoschool.edu","password":"password"}'

# Test protected endpoint
curl -X GET http://localhost:8000/api/v1/students \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

## Changelog

### Version 1.0.0
- Initial API release
- Student management
- Staff management
- Attendance tracking
- Exam results
- Fee management
- Library management
- Transport management
- Reports and analytics

## Support

For API support and questions:
- Check the documentation
- Review error messages and status codes
- Contact the development team
- Create an issue in the repository

---

**API Version:** 1.0.0  
**Last Updated:** January 2024  
**Laravel Version:** 11.0+
