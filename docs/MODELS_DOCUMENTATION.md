# School Management System - Models Documentation

## Overview

The School Management System uses Laravel's Eloquent ORM with a comprehensive set of models that represent the core entities and their relationships. All models follow Laravel best practices with proper relationships, validation, and activity logging.

## Core Architecture

### Base Model Features
- **Strict Typing**: All models use `declare(strict_types=1)`
- **Final Classes**: Models are marked as `final` to prevent inheritance
- **Activity Logging**: All models use Spatie Activity Log for audit trails
- **Factory Support**: All models have corresponding factories for testing
- **Soft Deletes**: Where applicable, models use soft deletes for data integrity

## User Management Models

### User Model
**File:** `app/Models/User.php`

The central user model that handles authentication and basic user information.

```php
final class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, LogsActivity;
}
```

**Fillable Fields:**
- `name` (string): User's full name
- `email` (string): Unique email address
- `password` (string): Hashed password
- `phone` (string, nullable): Phone number
- `address` (text, nullable): Address
- `date_of_birth` (date, nullable): Date of birth
- `gender` (enum): male, female, other
- `is_active` (boolean): Account status

**Relationships:**
- `student()`: HasOne relationship with Student model
- `staff()`: HasOne relationship with Staff model
- `guardian()`: HasOne relationship with Guardian model

**Key Methods:**
- `getActivitylogOptions()`: Configure activity logging
- `getFullNameAttribute()`: Get formatted full name

### Student Model
**File:** `app/Models/Student.php`

Represents student-specific information and academic records.

```php
final class Student extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `user_id` (integer): Foreign key to User
- `student_id` (string): Unique student identifier
- `admission_number` (string): Admission number
- `admission_date` (date): Date of admission
- `blood_group` (string, nullable): Blood group
- `medical_conditions` (json, nullable): Medical conditions array
- `emergency_contact` (json, nullable): Emergency contact information
- `is_active` (boolean): Student status

**Relationships:**
- `user()`: BelongsTo User
- `guardians()`: BelongsToMany Guardian (pivot: guardian_student)
- `enrollments()`: HasMany Enrollment
- `attendances()`: HasMany StudentAttendance
- `examResults()`: HasMany ExamResult
- `feeInvoices()`: HasMany FeeInvoice
- `bookLoans()`: HasMany BookLoan
- `transportAssignments()`: HasMany TransportAssignment

**Key Features:**
- JSON casting for medical_conditions and emergency_contact
- Activity logging for admission changes
- Soft delete support

### Staff Model
**File:** `app/Models/Staff.php`

Represents staff members including teachers and administrative personnel.

```php
final class Staff extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `user_id` (integer): Foreign key to User
- `employee_id` (string): Unique employee identifier
- `joining_date` (date): Date of joining
- `salary` (decimal): Monthly salary
- `department` (string): Department name
- `designation` (string): Job designation
- `qualification` (text, nullable): Educational qualifications
- `experience_years` (integer): Years of experience
- `is_active` (boolean): Employment status

**Relationships:**
- `user()`: BelongsTo User
- `attendances()`: HasMany StaffAttendance
- `payrolls()`: HasMany Payroll
- `leaveRequests()`: HasMany LeaveRequest
- `timetables()`: HasMany Timetable

### Guardian Model
**File:** `app/Models/Guardian.php`

Represents parents or guardians of students.

```php
final class Guardian extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `user_id` (integer): Foreign key to User
- `occupation` (string, nullable): Occupation
- `workplace` (string, nullable): Workplace
- `relationship` (string): Relationship to student
- `is_primary` (boolean): Primary guardian status

**Relationships:**
- `user()`: BelongsTo User
- `students()`: BelongsToMany Student (pivot: guardian_student)

## Academic Structure Models

### School Model
**File:** `app/Models/School.php`

Represents the educational institution.

```php
final class School extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `name` (string): School name
- `code` (string): School code
- `address` (text): School address
- `phone` (string): Contact phone
- `email` (string): Contact email
- `website` (string, nullable): School website
- `logo` (string, nullable): Logo file path
- `principal_name` (string): Principal's name
- `established_year` (integer): Year established
- `is_active` (boolean): School status

**Relationships:**
- `academicYears()`: HasMany AcademicYear
- `classes()`: HasMany Classroom

### AcademicYear Model
**File:** `app/Models/AcademicYear.php`

Represents academic years for organizing school terms.

```php
final class AcademicYear extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `name` (string): Academic year name (e.g., "2024-2025")
- `start_date` (date): Academic year start date
- `end_date` (date): Academic year end date
- `is_current` (boolean): Current academic year flag

**Relationships:**
- `school()`: BelongsTo School
- `enrollments()`: HasMany Enrollment
- `examTerms()`: HasMany ExamTerm

### Classroom Model
**File:** `app/Models/Classroom.php`

Represents classes or grades in the school.

```php
final class Classroom extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `name` (string): Class name (e.g., "Grade 10")
- `code` (string): Class code
- `description` (text, nullable): Class description
- `is_active` (boolean): Class status

**Relationships:**
- `school()`: BelongsTo School
- `sections()`: HasMany Section
- `enrollments()`: HasMany Enrollment

### Section Model
**File:** `app/Models/Section.php`

Represents sections within a class.

```php
final class Section extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `classroom_id` (integer): Foreign key to Classroom
- `name` (string): Section name (e.g., "A", "B")
- `code` (string): Section code
- `capacity` (integer): Maximum students
- `is_active` (boolean): Section status

**Relationships:**
- `classroom()`: BelongsTo Classroom
- `enrollments()`: HasMany Enrollment
- `subjects()`: BelongsToMany Subject (pivot: class_section_subject)
- `timetables()`: HasMany Timetable

### Subject Model
**File:** `app/Models/Subject.php`

Represents subjects taught in the school.

```php
final class Subject extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `name` (string): Subject name
- `code` (string): Subject code
- `description` (text, nullable): Subject description
- `is_active` (boolean): Subject status

**Relationships:**
- `sections()`: BelongsToMany Section (pivot: class_section_subject)
- `examResults()`: HasMany ExamResult
- `timetables()`: HasMany Timetable

### Enrollment Model
**File:** `app/Models/Enrollment.php`

Represents student enrollment in classes and sections.

```php
final class Enrollment extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `student_id` (integer): Foreign key to Student
- `academic_year_id` (integer): Foreign key to AcademicYear
- `classroom_id` (integer): Foreign key to Classroom
- `section_id` (integer): Foreign key to Section
- `enrollment_date` (date): Date of enrollment
- `status` (enum): active, completed, withdrawn
- `roll_number` (string): Student roll number in class

**Relationships:**
- `student()`: BelongsTo Student
- `academicYear()`: BelongsTo AcademicYear
- `classroom()`: BelongsTo Classroom
- `section()`: BelongsTo Section

## Attendance Models

### StudentAttendance Model
**File:** `app/Models/StudentAttendance.php`

Tracks daily attendance for students.

```php
final class StudentAttendance extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `student_id` (integer): Foreign key to Student
- `date` (date): Attendance date
- `status` (enum): present, absent, late, excused
- `remarks` (text, nullable): Additional remarks
- `marked_by` (integer): Foreign key to User (staff who marked)

**Relationships:**
- `student()`: BelongsTo Student
- `markedBy()`: BelongsTo User

### StaffAttendance Model
**File:** `app/Models/StaffAttendance.php`

Tracks daily attendance for staff members.

```php
final class StaffAttendance extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `staff_id` (integer): Foreign key to Staff
- `date` (date): Attendance date
- `check_in_time` (datetime, nullable): Check-in time
- `check_out_time` (datetime, nullable): Check-out time
- `status` (enum): present, absent, late, half_day
- `remarks` (text, nullable): Additional remarks

**Relationships:**
- `staff()`: BelongsTo Staff

## Exam Management Models

### ExamTerm Model
**File:** `app/Models/ExamTerm.php`

Represents exam terms or periods.

```php
final class ExamTerm extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `academic_year_id` (integer): Foreign key to AcademicYear
- `name` (string): Exam term name
- `start_date` (date): Exam start date
- `end_date` (date): Exam end date
- `is_active` (boolean): Term status

**Relationships:**
- `academicYear()`: BelongsTo AcademicYear
- `examAssessments()`: HasMany ExamAssessment
- `examResults()`: HasMany ExamResult

### ExamAssessment Model
**File:** `app/Models/ExamAssessment.php`

Represents individual assessments within an exam term.

```php
final class ExamAssessment extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `exam_term_id` (integer): Foreign key to ExamTerm
- `subject_id` (integer): Foreign key to Subject
- `name` (string): Assessment name
- `total_marks` (decimal): Total marks
- `passing_marks` (decimal): Passing marks
- `exam_date` (date): Exam date
- `start_time` (time): Exam start time
- `end_time` (time): Exam end time

**Relationships:**
- `examTerm()`: BelongsTo ExamTerm
- `subject()`: BelongsTo Subject
- `examResults()`: HasMany ExamResult

### ExamResult Model
**File:** `app/Models/ExamResult.php`

Represents individual exam results for students.

```php
final class ExamResult extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `student_id` (integer): Foreign key to Student
- `exam_term_id` (integer): Foreign key to ExamTerm
- `exam_assessment_id` (integer): Foreign key to ExamAssessment
- `subject_id` (integer): Foreign key to Subject
- `marks_obtained` (decimal): Marks obtained
- `total_marks` (decimal): Total marks
- `grade` (string): Grade assigned
- `grade_points` (decimal): Grade points
- `remarks` (text, nullable): Additional remarks

**Relationships:**
- `student()`: BelongsTo Student
- `examTerm()`: BelongsTo ExamTerm
- `examAssessment()`: BelongsTo ExamAssessment
- `subject()`: BelongsTo Subject

### GradingScale Model
**File:** `app/Models/GradingScale.php`

Defines grading scales for the school.

```php
final class GradingScale extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `name` (string): Grading scale name
- `description` (text, nullable): Description
- `is_active` (boolean): Scale status

**Relationships:**
- `gradingScaleItems()`: HasMany GradingScaleItem

### GradingScaleItem Model
**File:** `app/Models/GradingScaleItem.php`

Individual grade definitions within a grading scale.

```php
final class GradingScaleItem extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `grading_scale_id` (integer): Foreign key to GradingScale
- `grade` (string): Grade letter
- `min_marks` (decimal): Minimum marks for grade
- `max_marks` (decimal): Maximum marks for grade
- `grade_points` (decimal): Grade points
- `description` (string, nullable): Grade description

**Relationships:**
- `gradingScale()`: BelongsTo GradingScale

## Financial Models

### FeeStructure Model
**File:** `app/Models/FeeStructure.php`

Defines fee structures for different classes and categories.

```php
final class FeeStructure extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `name` (string): Fee structure name
- `description` (text, nullable): Description
- `amount` (decimal): Fee amount
- `frequency` (enum): monthly, quarterly, yearly, one_time
- `class_id` (integer, nullable): Foreign key to Classroom
- `category` (string): Fee category
- `is_active` (boolean): Structure status

**Relationships:**
- `classroom()`: BelongsTo Classroom
- `feeInvoices()`: HasMany FeeInvoice

### FeeInvoice Model
**File:** `app/Models/FeeInvoice.php`

Represents individual fee invoices for students.

```php
final class FeeInvoice extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `student_id` (integer): Foreign key to Student
- `fee_structure_id` (integer): Foreign key to FeeStructure
- `invoice_number` (string): Unique invoice number
- `amount` (decimal): Invoice amount
- `due_date` (date): Payment due date
- `status` (enum): pending, paid, overdue, cancelled
- `description` (text, nullable): Invoice description

**Relationships:**
- `student()`: BelongsTo Student
- `feeStructure()`: BelongsTo FeeStructure
- `feePayments()`: HasMany FeePayment

### FeePayment Model
**File:** `app/Models/FeePayment.php`

Records fee payments made by students.

```php
final class FeePayment extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `fee_invoice_id` (integer): Foreign key to FeeInvoice
- `amount` (decimal): Payment amount
- `payment_method` (enum): cash, bank_transfer, cheque, online
- `payment_date` (date): Payment date
- `reference_number` (string, nullable): Payment reference
- `status` (enum): pending, confirmed, cancelled
- `remarks` (text, nullable): Payment remarks

**Relationships:**
- `feeInvoice()`: BelongsTo FeeInvoice

### FeeLedger Model
**File:** `app/Models/FeeLedger.php`

Maintains a complete ledger of all fee transactions.

```php
final class FeeLedger extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `student_id` (integer): Foreign key to Student
- `transaction_type` (enum): invoice, payment, refund, adjustment
- `amount` (decimal): Transaction amount
- `balance` (decimal): Running balance
- `reference_id` (integer): Reference to related model
- `reference_type` (string): Model class name
- `description` (text): Transaction description
- `transaction_date` (date): Transaction date

**Relationships:**
- `student()`: BelongsTo Student

## Library Management Models

### Book Model
**File:** `app/Models/Book.php`

Represents books in the library catalog.

```php
final class Book extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `title` (string): Book title
- `author` (string): Author name
- `isbn` (string, nullable): ISBN number
- `publisher` (string, nullable): Publisher name
- `publication_year` (integer, nullable): Publication year
- `category` (string): Book category
- `subject` (string, nullable): Subject area
- `is_reference` (boolean): Reference book flag
- `description` (text, nullable): Book description
- `is_active` (boolean): Book status

**Relationships:**
- `school()`: BelongsTo School
- `copies()`: HasMany BookCopy
- `loans()`: HasMany BookLoan

### BookCopy Model
**File:** `app/Models/BookCopy.php`

Represents individual copies of books.

```php
final class BookCopy extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `book_id` (integer): Foreign key to Book
- `copy_number` (string): Unique copy identifier
- `barcode` (string, nullable): Barcode number
- `status` (enum): available, loaned, damaged, lost
- `condition` (enum): excellent, good, fair, poor
- `purchase_date` (date, nullable): Purchase date
- `purchase_price` (decimal, nullable): Purchase price
- `is_active` (boolean): Copy status

**Relationships:**
- `book()`: BelongsTo Book
- `loans()`: HasMany BookLoan

### BookLoan Model
**File:** `app/Models/BookLoan.php`

Tracks book lending and returns.

```php
final class BookLoan extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `book_id` (integer): Foreign key to Book
- `book_copy_id` (integer): Foreign key to BookCopy
- `student_id` (integer, nullable): Foreign key to Student
- `staff_id` (integer, nullable): Foreign key to Staff
- `loan_date` (date): Loan date
- `due_date` (date): Due date
- `return_date` (date, nullable): Return date
- `status` (enum): active, returned, overdue
- `fine_amount` (decimal): Fine amount
- `issued_by` (integer): Foreign key to User (librarian)
- `remarks` (text, nullable): Loan remarks

**Relationships:**
- `book()`: BelongsTo Book
- `bookCopy()`: BelongsTo BookCopy
- `student()`: BelongsTo Student
- `staff()`: BelongsTo Staff
- `issuedBy()`: BelongsTo User

### BookFine Model
**File:** `app/Models/BookFine.php`

Tracks fines for overdue or damaged books.

```php
final class BookFine extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `book_loan_id` (integer): Foreign key to BookLoan
- `student_id` (integer): Foreign key to Student
- `fine_amount` (decimal): Fine amount
- `fine_type` (enum): overdue, damage, loss
- `status` (enum): pending, paid, waived
- `due_date` (date): Fine due date
- `paid_date` (date, nullable): Payment date
- `remarks` (text, nullable): Fine remarks

**Relationships:**
- `bookLoan()`: BelongsTo BookLoan
- `student()`: BelongsTo Student

## Transport Management Models

### TransportRoute Model
**File:** `app/Models/TransportRoute.php`

Represents school bus routes.

```php
final class TransportRoute extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `name` (string): Route name
- `code` (string): Route code
- `description` (text, nullable): Route description
- `fare` (decimal): Monthly fare
- `is_active` (boolean): Route status

**Relationships:**
- `school()`: BelongsTo School
- `stops()`: BelongsToMany TransportStop (pivot: transport_route_stops)
- `vehicles()`: BelongsToMany TransportVehicle (pivot: transport_assignments)
- `assignments()`: HasMany TransportAssignment

### TransportStop Model
**File:** `app/Models/TransportStop.php`

Represents bus stops on routes.

```php
final class TransportStop extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `name` (string): Stop name
- `address` (text): Stop address
- `latitude` (decimal, nullable): GPS latitude
- `longitude` (decimal, nullable): GPS longitude
- `is_active` (boolean): Stop status

**Relationships:**
- `routes()`: BelongsToMany TransportRoute (pivot: transport_route_stops)

### TransportVehicle Model
**File:** `app/Models/TransportVehicle.php`

Represents school vehicles.

```php
final class TransportVehicle extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `vehicle_number` (string): Vehicle registration number
- `vehicle_type` (enum): bus, van, car
- `capacity` (integer): Passenger capacity
- `driver_name` (string): Driver name
- `driver_license` (string): Driver license number
- `driver_phone` (string): Driver phone number
- `insurance_expiry` (date): Insurance expiry date
- `registration_expiry` (date): Registration expiry date
- `fitness_expiry` (date): Fitness certificate expiry
- `is_active` (boolean): Vehicle status

**Relationships:**
- `school()`: BelongsTo School
- `assignments()`: HasMany TransportAssignment

### TransportAssignment Model
**File:** `app/Models/TransportAssignment.php`

Represents student assignments to transport routes.

```php
final class TransportAssignment extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `student_id` (integer): Foreign key to Student
- `transport_route_id` (integer): Foreign key to TransportRoute
- `pickup_stop_id` (integer): Foreign key to TransportStop
- `drop_stop_id` (integer): Foreign key to TransportStop
- `start_date` (date): Assignment start date
- `end_date` (date, nullable): Assignment end date
- `status` (enum): active, inactive, completed
- `monthly_fare` (decimal): Monthly fare amount

**Relationships:**
- `student()`: BelongsTo Student
- `transportRoute()`: BelongsTo TransportRoute
- `pickupStop()`: BelongsTo TransportStop
- `dropStop()`: BelongsTo TransportStop

## Human Resources Models

### Payroll Model
**File:** `app/Models/Payroll.php`

Tracks staff payroll information.

```php
final class Payroll extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `staff_id` (integer): Foreign key to Staff
- `pay_period_start` (date): Pay period start
- `pay_period_end` (date): Pay period end
- `basic_salary` (decimal): Basic salary
- `allowances` (json): Allowances array
- `deductions` (json): Deductions array
- `net_salary` (decimal): Net salary
- `status` (enum): pending, processed, paid
- `payment_date` (date, nullable): Payment date

**Relationships:**
- `staff()`: BelongsTo Staff

### LeaveRequest Model
**File:** `app/Models/LeaveRequest.php`

Tracks staff leave requests.

```php
final class LeaveRequest extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `staff_id` (integer): Foreign key to Staff
- `leave_type` (enum): sick, casual, annual, emergency
- `start_date` (date): Leave start date
- `end_date` (date): Leave end date
- `days` (integer): Number of leave days
- `reason` (text): Leave reason
- `status` (enum): pending, approved, rejected
- `approved_by` (integer, nullable): Foreign key to User
- `remarks` (text, nullable): Approval remarks

**Relationships:**
- `staff()`: BelongsTo Staff
- `approvedBy()`: BelongsTo User

## Inventory Management Models

### InventoryItem Model
**File:** `app/Models/InventoryItem.php`

Represents items in school inventory.

```php
final class InventoryItem extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `name` (string): Item name
- `category` (string): Item category
- `description` (text, nullable): Item description
- `unit` (string): Measurement unit
- `minimum_stock` (integer): Minimum stock level
- `is_active` (boolean): Item status

**Relationships:**
- `school()`: BelongsTo School
- `stocks()`: HasMany InventoryStock
- `transactions()`: HasMany InventoryTransaction

### InventoryStock Model
**File:** `app/Models/InventoryStock.php`

Tracks current stock levels.

```php
final class InventoryStock extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `inventory_item_id` (integer): Foreign key to InventoryItem
- `current_stock` (integer): Current stock quantity
- `last_updated` (datetime): Last update timestamp

**Relationships:**
- `inventoryItem()`: BelongsTo InventoryItem

### InventoryTransaction Model
**File:** `app/Models/InventoryTransaction.php`

Records all inventory movements.

```php
final class InventoryTransaction extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `inventory_item_id` (integer): Foreign key to InventoryItem
- `transaction_type` (enum): in, out, adjustment
- `quantity` (integer): Transaction quantity
- `unit_price` (decimal, nullable): Unit price
- `total_amount` (decimal, nullable): Total amount
- `supplier_id` (integer, nullable): Foreign key to Supplier
- `reference_number` (string, nullable): Reference number
- `remarks` (text, nullable): Transaction remarks
- `transaction_date` (date): Transaction date

**Relationships:**
- `inventoryItem()`: BelongsTo InventoryItem
- `supplier()`: BelongsTo Supplier

### Supplier Model
**File:** `app/Models/Supplier.php`

Represents suppliers for inventory items.

```php
final class Supplier extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `name` (string): Supplier name
- `contact_person` (string): Contact person name
- `email` (string, nullable): Email address
- `phone` (string): Phone number
- `address` (text): Address
- `is_active` (boolean): Supplier status

**Relationships:**
- `transactions()`: HasMany InventoryTransaction

## Communication Models

### Notice Model
**File:** `app/Models/Notice.php`

Represents school notices and announcements.

```php
final class Notice extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `title` (string): Notice title
- `content` (text): Notice content
- `target_audience` (enum): all, students, staff, parents
- `priority` (enum): low, medium, high
- `start_date` (date): Notice start date
- `end_date` (date): Notice end date
- `is_active` (boolean): Notice status

**Relationships:**
- `school()`: BelongsTo School

### Event Model
**File:** `app/Models/Event.php`

Represents school events and activities.

```php
final class Event extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `school_id` (integer): Foreign key to School
- `title` (string): Event title
- `description` (text): Event description
- `event_date` (date): Event date
- `start_time` (time): Event start time
- `end_time` (time): Event end time
- `location` (string): Event location
- `event_type` (enum): academic, sports, cultural, other
- `is_recurring` (boolean): Recurring event flag
- `recurrence_pattern` (string, nullable): Recurrence pattern
- `is_active` (boolean): Event status

**Relationships:**
- `school()`: BelongsTo School

### Message Model
**File:** `app/Models/Message.php`

Represents internal messaging system.

```php
final class Message extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `sender_id` (integer): Foreign key to User (sender)
- `subject` (string): Message subject
- `content` (text): Message content
- `message_type` (enum): general, urgent, announcement
- `is_active` (boolean): Message status

**Relationships:**
- `sender()`: BelongsTo User
- `recipients()`: HasMany MessageRecipient

### MessageRecipient Model
**File:** `app/Models/MessageRecipient.php`

Tracks message recipients and read status.

```php
final class MessageRecipient extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `message_id` (integer): Foreign key to Message
- `recipient_id` (integer): Foreign key to User
- `is_read` (boolean): Read status
- `read_at` (datetime, nullable): Read timestamp

**Relationships:**
- `message()`: BelongsTo Message
- `recipient()`: BelongsTo User

### Attachment Model
**File:** `app/Models/Attachment.php`

Represents file attachments for messages and notices.

```php
final class Attachment extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `attachable_id` (integer): Polymorphic ID
- `attachable_type` (string): Polymorphic type
- `filename` (string): Original filename
- `file_path` (string): File storage path
- `file_size` (integer): File size in bytes
- `mime_type` (string): File MIME type

**Relationships:**
- `attachable()`: MorphTo

## Timetable Model

### Timetable Model
**File:** `app/Models/Timetable.php`

Represents class schedules and teacher assignments.

```php
final class Timetable extends Model
{
    use HasFactory, LogsActivity;
}
```

**Fillable Fields:**
- `section_id` (integer): Foreign key to Section
- `subject_id` (integer): Foreign key to Subject
- `staff_id` (integer): Foreign key to Staff
- `day_of_week` (enum): monday, tuesday, wednesday, thursday, friday, saturday, sunday
- `start_time` (time): Period start time
- `end_time` (time): Period end time
- `room` (string, nullable): Classroom/room
- `is_active` (boolean): Timetable status

**Relationships:**
- `section()`: BelongsTo Section
- `subject()`: BelongsTo Subject
- `staff()`: BelongsTo Staff

## Model Relationships Summary

### Key Relationship Patterns

1. **User-Centric Design**: All people (students, staff, guardians) extend the User model
2. **School Hierarchy**: School → AcademicYear → Classroom → Section → Enrollment
3. **Academic Tracking**: Student → Enrollment → Attendance/ExamResults
4. **Financial Flow**: FeeStructure → FeeInvoice → FeePayment → FeeLedger
5. **Library Operations**: Book → BookCopy → BookLoan → BookFine
6. **Transport Management**: TransportRoute → TransportStop → TransportAssignment
7. **Communication**: Notice/Event/Message with polymorphic attachments

### Polymorphic Relationships

- **Attachment**: Can be attached to any model (messages, notices, etc.)
- **Activity Log**: Spatie Activity Log tracks changes across all models

### Many-to-Many Relationships

- **Guardian-Student**: Students can have multiple guardians
- **Section-Subject**: Sections can have multiple subjects with assigned teachers
- **TransportRoute-TransportStop**: Routes can have multiple stops
- **TransportRoute-TransportVehicle**: Routes can be served by multiple vehicles

## Model Conventions

### Naming Conventions
- **Models**: PascalCase, singular (e.g., `Student`, `BookLoan`)
- **Tables**: snake_case, plural (e.g., `students`, `book_loans`)
- **Foreign Keys**: `{model}_id` (e.g., `student_id`, `book_id`)
- **Pivot Tables**: `{model1}_{model2}` (e.g., `guardian_student`)

### Common Fields
- **Timestamps**: `created_at`, `updated_at` (automatic)
- **Soft Deletes**: `deleted_at` (where applicable)
- **Status Fields**: `is_active` (boolean)
- **Activity Logging**: Automatic via Spatie Activity Log

### Data Types
- **IDs**: `bigint` (unsigned)
- **Strings**: `varchar(255)` or `text`
- **Decimals**: `decimal(10,2)` for currency
- **Dates**: `date` or `datetime`
- **JSON**: `json` for complex data structures
- **Enums**: `enum` for predefined values

## Best Practices

### Model Design
1. **Single Responsibility**: Each model represents one entity
2. **Clear Relationships**: Well-defined relationships with proper foreign keys
3. **Data Integrity**: Use constraints and validation
4. **Activity Logging**: Track all changes for audit purposes
5. **Soft Deletes**: Preserve data integrity with soft deletes where appropriate

### Performance Considerations
1. **Eager Loading**: Use `with()` to prevent N+1 queries
2. **Database Indexes**: Index foreign keys and frequently queried fields
3. **Query Optimization**: Use specific selects and proper joins
4. **Caching**: Cache frequently accessed data

### Security
1. **Mass Assignment Protection**: Use `$fillable` arrays
2. **Data Validation**: Validate all input data
3. **Access Control**: Use policies for authorization
4. **Audit Trail**: Log all data changes

---

**Last Updated:** January 2024  
**Laravel Version:** 11.0+  
**PHP Version:** 8.3+  
**License:** [MIT License](../LICENSE)
