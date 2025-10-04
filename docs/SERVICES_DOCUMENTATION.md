# School Management System - Services Documentation

## Overview

The School Management System follows a service-oriented architecture where business logic is encapsulated in dedicated service classes. These services handle complex operations, data processing, and business rules while keeping controllers thin and focused on HTTP concerns.

## Service Architecture

### Design Principles
- **Single Responsibility**: Each service handles one domain or feature area
- **Final Classes**: All services are marked as `final` to prevent inheritance
- **Read-Only**: Services don't maintain state between method calls
- **Dependency Injection**: Services can be injected into controllers and other services
- **Transaction Management**: Complex operations use database transactions
- **Error Handling**: Proper exception handling with meaningful error messages

### Service Organization
Services are organized by domain areas:
- `Attendance/`: Student and staff attendance services
- `Exams/`: Exam result management services
- `Fees/`: Fee and payment processing services
- `Library/`: Library management services
- `Students/`: Student management services
- `Transport/`: Transport management services

## Attendance Services

### StudentAttendanceService
**File:** `app/Services/Attendance/StudentAttendanceService.php`

Handles student attendance operations including marking, bulk operations, and reporting.

```php
final class StudentAttendanceService
{
    public function getAttendanceRecords(array $filters = []): LengthAwarePaginator
    public function markAttendance(array $data): StudentAttendance
    public function bulkMarkAttendance(array $data): Collection
    public function getAttendanceSummary(array $filters = []): array
    public function getAttendanceStatistics(array $filters = []): array
}
```

**Key Methods:**

#### `getAttendanceRecords(array $filters = []): LengthAwarePaginator`
Retrieves paginated attendance records with filtering options.

**Parameters:**
- `filters['student_id']` (int): Filter by specific student
- `filters['class_id']` (int): Filter by class
- `filters['section_id']` (int): Filter by section
- `filters['date_from']` (date): Start date filter
- `filters['date_to']` (date): End date filter
- `filters['status']` (string): Filter by attendance status

**Example Usage:**
```php
$service = new StudentAttendanceService();
$attendance = $service->getAttendanceRecords([
    'class_id' => 1,
    'section_id' => 1,
    'date_from' => '2024-01-01',
    'date_to' => '2024-01-31'
]);
```

#### `markAttendance(array $data): StudentAttendance`
Marks attendance for a single student.

**Parameters:**
- `student_id` (int): Student ID
- `date` (date): Attendance date
- `status` (string): present, absent, late, excused
- `remarks` (string, optional): Additional remarks

**Example Usage:**
```php
$attendance = $service->markAttendance([
    'student_id' => 1,
    'date' => '2024-01-15',
    'status' => 'present',
    'remarks' => 'On time'
]);
```

#### `bulkMarkAttendance(array $data): Collection`
Marks attendance for multiple students at once.

**Parameters:**
- `date` (date): Attendance date
- `class_id` (int): Class ID
- `section_id` (int): Section ID
- `attendance` (array): Array of attendance records

**Example Usage:**
```php
$attendance = $service->bulkMarkAttendance([
    'date' => '2024-01-15',
    'class_id' => 1,
    'section_id' => 1,
    'attendance' => [
        ['student_id' => 1, 'status' => 'present'],
        ['student_id' => 2, 'status' => 'absent', 'remarks' => 'Sick leave']
    ]
]);
```

#### `getAttendanceSummary(array $filters = []): array`
Generates attendance summary statistics.

**Returns:**
```php
[
    'total_days' => 20,
    'present_days' => 18,
    'absent_days' => 2,
    'late_days' => 1,
    'attendance_percentage' => 90.0,
    'summary_by_date' => [...],
    'summary_by_student' => [...]
]
```

### StaffAttendanceService
**File:** `app/Services/Attendance/StaffAttendanceService.php`

Handles staff attendance operations including check-in/check-out and reporting.

```php
final class StaffAttendanceService
{
    public function getStaffAttendance(array $filters = []): LengthAwarePaginator
    public function checkIn(array $data): StaffAttendance
    public function checkOut(array $data): StaffAttendance
    public function getAttendanceSummary(array $filters = []): array
    public function getWorkingHours(array $filters = []): array
}
```

**Key Methods:**

#### `checkIn(array $data): StaffAttendance`
Records staff check-in time.

**Parameters:**
- `staff_id` (int): Staff member ID
- `check_in_time` (datetime): Check-in time
- `remarks` (string, optional): Check-in remarks

#### `checkOut(array $data): StaffAttendance`
Records staff check-out time.

**Parameters:**
- `staff_id` (int): Staff member ID
- `check_out_time` (datetime): Check-out time
- `remarks` (string, optional): Check-out remarks

## Exam Services

### ExamResultService
**File:** `app/Services/Exams/ExamResultService.php`

Handles exam result management including creation, bulk operations, and reporting.

```php
final class ExamResultService
{
    public function getExamResults(array $filters = []): LengthAwarePaginator
    public function createExamResult(array $data): ExamResult
    public function bulkCreateResults(array $data): Collection
    public function generateReportCard(int $studentId, int $examTermId): array
    public function getClassResults(array $filters = []): array
    public function calculateGrades(array $results): array
}
```

**Key Methods:**

#### `createExamResult(array $data): ExamResult`
Creates a single exam result record.

**Parameters:**
- `student_id` (int): Student ID
- `exam_term_id` (int): Exam term ID
- `subject_id` (int): Subject ID
- `marks_obtained` (decimal): Marks obtained
- `total_marks` (decimal): Total marks
- `remarks` (string, optional): Additional remarks

**Business Logic:**
- Automatically calculates grade and grade points
- Validates marks against total marks
- Updates student's academic record

#### `bulkCreateResults(array $data): Collection`
Creates multiple exam results at once.

**Parameters:**
- `exam_term_id` (int): Exam term ID
- `class_id` (int): Class ID
- `section_id` (int): Section ID
- `subject_id` (int): Subject ID
- `total_marks` (decimal): Total marks for all students
- `results` (array): Array of student results

**Example Usage:**
```php
$results = $service->bulkCreateResults([
    'exam_term_id' => 1,
    'class_id' => 1,
    'section_id' => 1,
    'subject_id' => 1,
    'total_marks' => 100,
    'results' => [
        ['student_id' => 1, 'marks_obtained' => 85],
        ['student_id' => 2, 'marks_obtained' => 92],
        ['student_id' => 3, 'marks_obtained' => 78]
    ]
]);
```

#### `generateReportCard(int $studentId, int $examTermId): array`
Generates a comprehensive report card for a student.

**Returns:**
```php
[
    'student' => [...],
    'exam_term' => [...],
    'results' => [...],
    'total_marks' => 500,
    'obtained_marks' => 425,
    'percentage' => 85.0,
    'overall_grade' => 'A',
    'rank' => 5,
    'class_average' => 78.5
]
```

#### `calculateGrades(array $results): array`
Calculates grades and grade points for exam results.

**Business Logic:**
- Uses the school's grading scale
- Calculates grade points based on marks
- Determines overall performance indicators

## Fee Services

### FeeInvoiceService
**File:** `app/Services/Fees/FeeInvoiceService.php`

Handles fee invoice creation, management, and reporting.

```php
final class FeeInvoiceService
{
    public function getFeeInvoices(array $filters = []): LengthAwarePaginator
    public function createFeeInvoice(array $data): FeeInvoice
    public function bulkCreateInvoices(array $data): Collection
    public function getStudentFeeSummary(int $studentId): array
    public function getClassFeeSummary(array $filters = []): array
    public function generateOverdueInvoices(): int
}
```

**Key Methods:**

#### `createFeeInvoice(array $data): FeeInvoice`
Creates a new fee invoice for a student.

**Parameters:**
- `student_id` (int): Student ID
- `fee_structure_id` (int): Fee structure ID
- `amount` (decimal): Invoice amount
- `due_date` (date): Payment due date
- `description` (string, optional): Invoice description

**Business Logic:**
- Generates unique invoice number
- Sets initial status to 'pending'
- Creates corresponding ledger entry

#### `bulkCreateInvoices(array $data): Collection`
Creates fee invoices for multiple students.

**Parameters:**
- `class_id` (int): Class ID
- `section_id` (int): Section ID
- `fee_structure_id` (int): Fee structure ID
- `amount` (decimal): Invoice amount
- `due_date` (date): Payment due date

**Example Usage:**
```php
$invoices = $service->bulkCreateInvoices([
    'class_id' => 1,
    'section_id' => 1,
    'fee_structure_id' => 1,
    'amount' => 5000.00,
    'due_date' => '2024-02-15',
    'description' => 'Monthly tuition fee for January 2024'
]);
```

#### `getStudentFeeSummary(int $studentId): array`
Generates comprehensive fee summary for a student.

**Returns:**
```php
[
    'student' => [...],
    'total_invoices' => 5,
    'total_amount' => 25000.00,
    'paid_amount' => 20000.00,
    'pending_amount' => 5000.00,
    'overdue_amount' => 2000.00,
    'invoices' => [...],
    'payment_history' => [...]
]
```

### FeePaymentService
**File:** `app/Services/Fees/FeePaymentService.php`

Handles fee payment processing and management.

```php
final class FeePaymentService
{
    public function getFeePayments(array $filters = []): LengthAwarePaginator
    public function processPayment(array $data): FeePayment
    public function confirmPayment(int $paymentId): FeePayment
    public function cancelPayment(int $paymentId, string $reason): FeePayment
    public function getPaymentSummary(array $filters = []): array
    public function generateReceipt(int $paymentId): array
}
```

**Key Methods:**

#### `processPayment(array $data): FeePayment`
Processes a fee payment.

**Parameters:**
- `fee_invoice_id` (int): Invoice ID
- `amount` (decimal): Payment amount
- `payment_method` (string): cash, bank_transfer, cheque, online
- `payment_date` (date): Payment date
- `reference_number` (string, optional): Payment reference
- `remarks` (string, optional): Payment remarks

**Business Logic:**
- Validates payment amount against invoice
- Updates invoice status
- Creates ledger entries
- Sends payment confirmation

#### `confirmPayment(int $paymentId): FeePayment`
Confirms a pending payment.

**Business Logic:**
- Updates payment status to 'confirmed'
- Updates invoice status to 'paid'
- Creates ledger entries
- Triggers payment confirmation notifications

## Library Services

### BookService
**File:** `app/Services/Library/BookService.php`

Handles book catalog management and operations.

```php
final class BookService
{
    public function getBooks(array $filters = []): LengthAwarePaginator
    public function createBook(array $data): Book
    public function updateBook(Book $book, array $data): Book
    public function deleteBook(Book $book): void
    public function getBook(Book $book): Book
    public function getAvailableCopies(Book $book): Collection
    public function getBookCategories(): Collection
    public function getBookSubjects(): Collection
}
```

**Key Methods:**

#### `getBooks(array $filters = []): LengthAwarePaginator`
Retrieves books with advanced filtering and search.

**Parameters:**
- `filters['search']` (string): Search by title, author, or ISBN
- `filters['category']` (string): Filter by category
- `filters['subject']` (string): Filter by subject
- `filters['is_reference']` (boolean): Filter reference books
- `filters['is_active']` (boolean): Filter by active status

**Features:**
- Full-text search across multiple fields
- Category and subject filtering
- Availability status checking
- Pagination support

#### `createBook(array $data): Book`
Creates a new book in the catalog.

**Parameters:**
- `title` (string): Book title
- `author` (string): Author name
- `isbn` (string, optional): ISBN number
- `publisher` (string, optional): Publisher name
- `publication_year` (int, optional): Publication year
- `category` (string): Book category
- `subject` (string, optional): Subject area
- `is_reference` (boolean): Reference book flag
- `description` (text, optional): Book description

**Business Logic:**
- Validates ISBN format if provided
- Sets default status to active
- Creates initial book copy if specified

### BookLoanService
**File:** `app/Services/Library/BookLoanService.php`

Handles book lending and return operations.

```php
final class BookLoanService
{
    public function getLoans(array $filters = []): LengthAwarePaginator
    public function createLoan(array $data): BookLoan
    public function returnBook(BookLoan $loan, array $data): BookLoan
    public function renewLoan(BookLoan $loan, int $days): BookLoan
    public function getStudentLoans(int $studentId): Collection
    public function getOverdueLoans(): Collection
    public function getLoanStatistics(): array
}
```

**Key Methods:**

#### `createLoan(array $data): BookLoan`
Issues a book to a student or staff member.

**Parameters:**
- `book_copy_id` (int): Book copy ID
- `student_id` (int, optional): Student ID
- `staff_id` (int, optional): Staff ID
- `due_date` (date): Due date
- `remarks` (string, optional): Loan remarks

**Business Logic:**
- Validates book copy availability
- Checks borrower's loan limits
- Updates book copy status to 'loaned'
- Sets loan status to 'active'
- Uses database transaction for data integrity

**Example Usage:**
```php
$loan = $service->createLoan([
    'book_copy_id' => 1,
    'student_id' => 1,
    'due_date' => '2024-01-29',
    'remarks' => 'Regular loan'
]);
```

#### `returnBook(BookLoan $loan, array $data): BookLoan`
Processes book return.

**Parameters:**
- `return_date` (date): Return date
- `condition` (string): Book condition (excellent, good, fair, poor)
- `remarks` (string, optional): Return remarks

**Business Logic:**
- Updates loan status to 'returned'
- Updates book copy status to 'available'
- Calculates fine if overdue
- Records book condition
- Uses database transaction

#### `getOverdueLoans(): Collection`
Retrieves all overdue book loans.

**Business Logic:**
- Finds loans with status 'active' and due date in the past
- Includes fine calculation
- Orders by overdue days

### BookFineService
**File:** `app/Services/Library/BookFineService.php`

Handles book fine calculation and management.

```php
final class BookFineService
{
    public function getBookFines(array $filters = []): LengthAwarePaginator
    public function createFine(array $data): BookFine
    public function payFine(BookFine $fine, array $data): BookFine
    public function waiveFine(BookFine $fine, array $data): BookFine
    public function getStudentFines(int $studentId): Collection
    public function getOverdueFines(): Collection
    public function generateOverdueFines(): int
    public function getFineStatistics(): array
}
```

**Key Methods:**

#### `generateOverdueFines(): int`
Automatically generates fines for overdue books.

**Business Logic:**
- Finds all overdue loans without fines
- Calculates fine amount based on overdue days
- Creates fine records
- Sends overdue notifications
- Returns count of fines generated

#### `payFine(BookFine $fine, array $data): BookFine`
Records fine payment.

**Parameters:**
- `amount_paid` (decimal): Amount paid
- `payment_method` (string): Payment method
- `payment_date` (date): Payment date

**Business Logic:**
- Updates fine status to 'paid'
- Records payment details
- Updates student's fine balance

## Student Services

### StudentService
**File:** `app/Services/Students/StudentService.php`

Handles student management operations.

```php
final class StudentService
{
    public function getStudents(array $filters = []): LengthAwarePaginator
    public function createStudent(array $data): Student
    public function updateStudent(Student $student, array $data): Student
    public function deleteStudent(Student $student): void
    public function getStudent(Student $student): Student
    public function enrollStudent(array $data): Enrollment
    public function getStudentProfile(int $studentId): array
}
```

**Key Methods:**

#### `createStudent(array $data): Student`
Creates a new student with user account.

**Parameters:**
- `name` (string): Student name
- `email` (string): Email address
- `password` (string): Password
- `phone` (string, optional): Phone number
- `address` (string, optional): Address
- `date_of_birth` (date, optional): Date of birth
- `gender` (string, optional): Gender
- `student_id` (string): Student ID
- `admission_number` (string): Admission number
- `admission_date` (date): Admission date
- `blood_group` (string, optional): Blood group
- `medical_conditions` (array, optional): Medical conditions
- `emergency_contact` (array, optional): Emergency contact info
- `guardian_ids` (array, optional): Guardian IDs

**Business Logic:**
- Creates user account first
- Assigns student role
- Creates student profile
- Links guardians if provided
- Uses database transaction for data integrity

**Example Usage:**
```php
$student = $service->createStudent([
    'name' => 'Jane Smith',
    'email' => 'jane.smith@student.edu',
    'password' => 'password123',
    'student_id' => 'STU002',
    'admission_number' => 'ADM2024002',
    'admission_date' => '2024-01-20',
    'guardian_ids' => [2]
]);
```

#### `enrollStudent(array $data): Enrollment`
Enrolls a student in a class and section.

**Parameters:**
- `student_id` (int): Student ID
- `academic_year_id` (int): Academic year ID
- `classroom_id` (int): Classroom ID
- `section_id` (int): Section ID
- `enrollment_date` (date): Enrollment date
- `roll_number` (string, optional): Roll number

**Business Logic:**
- Validates class capacity
- Generates roll number if not provided
- Creates enrollment record
- Updates student status

## Transport Services

### TransportRouteService
**File:** `app/Services/Transport/TransportRouteService.php`

Handles transport route management.

```php
final class TransportRouteService
{
    public function getTransportRoutes(array $filters = []): LengthAwarePaginator
    public function createTransportRoute(array $data): TransportRoute
    public function updateTransportRoute(TransportRoute $route, array $data): TransportRoute
    public function deleteTransportRoute(TransportRoute $route): void
    public function getRouteStops(TransportRoute $route): Collection
    public function addStopToRoute(TransportRoute $route, int $stopId, int $sequenceOrder, array $timingData = []): void
    public function removeStopFromRoute(TransportRoute $route, int $stopId): void
    public function updateRouteStopSequence(TransportRoute $route, int $stopId, int $newSequenceOrder): void
}
```

**Key Methods:**

#### `addStopToRoute(TransportRoute $route, int $stopId, int $sequenceOrder, array $timingData = []): void`
Adds a stop to a transport route.

**Parameters:**
- `$route`: Transport route instance
- `$stopId`: Stop ID to add
- `$sequenceOrder`: Position in route sequence
- `$timingData`: Pickup and drop times

**Business Logic:**
- Validates stop exists and is active
- Checks sequence order conflicts
- Updates route timing if needed
- Maintains route sequence integrity

### TransportVehicleService
**File:** `app/Services/Transport/TransportVehicleService.php`

Handles transport vehicle management.

```php
final class TransportVehicleService
{
    public function getTransportVehicles(array $filters = []): LengthAwarePaginator
    public function createTransportVehicle(array $data): TransportVehicle
    public function updateTransportVehicle(TransportVehicle $vehicle, array $data): TransportVehicle
    public function deleteTransportVehicle(TransportVehicle $vehicle): void
    public function getAvailableVehicles(): Collection
    public function getVehiclesByType(string $type): Collection
    public function getExpiringDocuments(): Collection
    public function assignVehicleToRoute(TransportVehicle $vehicle, TransportRoute $route): void
}
```

**Key Methods:**

#### `getExpiringDocuments(): Collection`
Finds vehicles with expiring documents.

**Business Logic:**
- Checks insurance, registration, and fitness expiry dates
- Returns vehicles expiring within 30 days
- Includes expiry date information
- Orders by expiry date

### TransportAssignmentService
**File:** `app/Services/Transport/TransportAssignmentService.php`

Handles student transport assignments.

```php
final class TransportAssignmentService
{
    public function getTransportAssignments(array $filters = []): LengthAwarePaginator
    public function createTransportAssignment(array $data): TransportAssignment
    public function updateTransportAssignment(TransportAssignment $assignment, array $data): TransportAssignment
    public function cancelTransportAssignment(TransportAssignment $assignment, string $reason): TransportAssignment
    public function getStudentAssignments(int $studentId): Collection
    public function getRouteAssignments(int $routeId): Collection
    public function calculateMonthlyFare(int $assignmentId): decimal
}
```

**Key Methods:**

#### `createTransportAssignment(array $data): TransportAssignment`
Assigns a student to a transport route.

**Parameters:**
- `student_id` (int): Student ID
- `transport_route_id` (int): Route ID
- `pickup_stop_id` (int): Pickup stop ID
- `drop_stop_id` (int): Drop stop ID
- `start_date` (date): Assignment start date
- `monthly_fare` (decimal): Monthly fare amount

**Business Logic:**
- Validates route and stops exist
- Checks student doesn't have active assignment
- Calculates fare based on route and stops
- Sets assignment status to 'active'

### TransportStopService
**File:** `app/Services/Transport/TransportStopService.php`

Handles transport stop management.

```php
final class TransportStopService
{
    public function getTransportStops(array $filters = []): LengthAwarePaginator
    public function createTransportStop(array $data): TransportStop
    public function updateTransportStop(TransportStop $stop, array $data): TransportStop
    public function deleteTransportStop(TransportStop $stop): void
    public function getStopsByLocation(float $latitude, float $longitude, float $radius = 5.0): Collection
    public function getStopStatistics(int $stopId): array
}
```

## Service Integration Patterns

### Database Transactions
Services use database transactions for complex operations:

```php
public function createStudent(array $data): Student
{
    return DB::transaction(function () use ($data) {
        // Create user account
        $user = User::create([...]);
        
        // Assign role
        $user->assignRole('Student');
        
        // Create student profile
        $student = Student::create([...]);
        
        // Link guardians
        if (isset($data['guardian_ids'])) {
            $student->guardians()->attach($data['guardian_ids']);
        }
        
        return $student;
    });
}
```

### Error Handling
Services implement proper error handling:

```php
public function createLoan(array $data): BookLoan
{
    return DB::transaction(function () use ($data): BookLoan {
        $bookCopy = BookCopy::findOrFail($data['book_copy_id']);
        
        if ($bookCopy->status !== 'available') {
            throw new \Exception('Book copy is not available for loan');
        }
        
        // Check loan limits
        $activeLoans = BookLoan::where('student_id', $data['student_id'])
            ->where('status', 'active')
            ->count();
            
        if ($activeLoans >= 5) {
            throw new \Exception('Student has reached maximum loan limit');
        }
        
        // Create loan
        $loan = BookLoan::create($data);
        
        // Update book copy status
        $bookCopy->update(['status' => 'loaned']);
        
        return $loan->load(['book', 'bookCopy', 'student.user']);
    });
}
```

### Validation
Services validate data before processing:

```php
public function processPayment(array $data): FeePayment
{
    // Validate payment amount
    $invoice = FeeInvoice::findOrFail($data['fee_invoice_id']);
    
    if ($data['amount'] > $invoice->remaining_amount) {
        throw new \Exception('Payment amount exceeds remaining balance');
    }
    
    // Validate payment method
    $validMethods = ['cash', 'bank_transfer', 'cheque', 'online'];
    if (!in_array($data['payment_method'], $validMethods)) {
        throw new \Exception('Invalid payment method');
    }
    
    // Process payment
    return DB::transaction(function () use ($data, $invoice) {
        $payment = FeePayment::create($data);
        
        // Update invoice status
        $invoice->update(['status' => 'paid']);
        
        // Create ledger entry
        FeeLedger::create([
            'student_id' => $invoice->student_id,
            'transaction_type' => 'payment',
            'amount' => $data['amount'],
            'reference_id' => $payment->id,
            'reference_type' => FeePayment::class,
            'description' => 'Fee payment received'
        ]);
        
        return $payment;
    });
}
```

## Service Testing

### Unit Testing Services
Services should be thoroughly tested:

```php
class StudentServiceTest extends TestCase
{
    public function test_create_student_creates_user_and_student(): void
    {
        $service = new StudentService();
        
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'student_id' => 'STU001',
            'admission_number' => 'ADM001',
            'admission_date' => '2024-01-15'
        ];
        
        $student = $service->createStudent($data);
        
        $this->assertInstanceOf(Student::class, $student);
        $this->assertInstanceOf(User::class, $student->user);
        $this->assertEquals('STU001', $student->student_id);
        $this->assertTrue($student->user->hasRole('Student'));
    }
    
    public function test_create_student_with_guardians(): void
    {
        $guardian = Guardian::factory()->create();
        $service = new StudentService();
        
        $data = [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'student_id' => 'STU002',
            'admission_number' => 'ADM002',
            'admission_date' => '2024-01-15',
            'guardian_ids' => [$guardian->id]
        ];
        
        $student = $service->createStudent($data);
        
        $this->assertTrue($student->guardians->contains($guardian));
    }
}
```

## Performance Considerations

### Query Optimization
Services optimize database queries:

```php
public function getStudents(array $filters = []): LengthAwarePaginator
{
    $query = Student::with(['user', 'guardians.user', 'enrollments']);
    
    // Apply filters
    if (isset($filters['search'])) {
        $search = $filters['search'];
        $query->whereHas('user', function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }
    
    return $query->paginate($filters['per_page'] ?? 15);
}
```

### Caching
Services implement caching for frequently accessed data:

```php
public function getBookCategories(): Collection
{
    return Cache::remember('book_categories', 3600, function () {
        return Book::distinct()->pluck('category')->filter()->sort()->values();
    });
}
```

## Service Dependencies

### Dependency Injection
Services can be injected into controllers:

```php
class StudentsController extends Controller
{
    public function __construct(
        private readonly StudentService $studentService
    ) {}
    
    public function store(StoreStudentRequest $request): JsonResponse
    {
        $student = $this->studentService->createStudent($request->validated());
        
        return response()->json([
            'data' => new StudentResource($student),
            'message' => 'Student created successfully',
            'status' => 'success'
        ], 201);
    }
}
```

### Service-to-Service Communication
Services can use other services:

```php
class StudentService
{
    public function __construct(
        private readonly FeeInvoiceService $feeInvoiceService
    ) {}
    
    public function createStudent(array $data): Student
    {
        $student = DB::transaction(function () use ($data) {
            // Create student
            $student = Student::create($data);
            
            // Create initial fee invoices
            $this->feeInvoiceService->createInitialInvoices($student);
            
            return $student;
        });
        
        return $student;
    }
}
```

## Best Practices

### Service Design
1. **Single Responsibility**: Each service handles one domain area
2. **Stateless**: Services don't maintain state between calls
3. **Transaction Management**: Use transactions for complex operations
4. **Error Handling**: Provide meaningful error messages
5. **Validation**: Validate data before processing
6. **Documentation**: Document all public methods

### Performance
1. **Query Optimization**: Use eager loading and proper indexing
2. **Caching**: Cache frequently accessed data
3. **Pagination**: Implement pagination for large datasets
4. **Database Transactions**: Use transactions for data integrity

### Testing
1. **Unit Tests**: Test all service methods
2. **Integration Tests**: Test service interactions
3. **Mocking**: Mock external dependencies
4. **Coverage**: Aim for high test coverage

---

**Last Updated:** January 2024  
**Laravel Version:** 11.0+  
**PHP Version:** 8.3+  
**License:** [MIT License](../LICENSE)
