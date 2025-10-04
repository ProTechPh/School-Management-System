# School Management System - Development Guide

## Overview

This guide provides comprehensive instructions for setting up the development environment, understanding the codebase structure, and contributing to the School Management System project.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Database Management](#database-management)
- [Testing Guidelines](#testing-guidelines)
- [API Development](#api-development)
- [Frontend Integration](#frontend-integration)
- [Debugging and Troubleshooting](#debugging-and-troubleshooting)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Review Process](#code-review-process)

## Development Environment Setup

### Prerequisites

Before setting up the development environment, ensure you have the following installed:

- **PHP**: 8.3 or higher
- **Composer**: Latest version
- **Node.js**: 18.x or higher
- **MySQL**: 8.0 or higher
- **Git**: Latest version
- **Docker** (optional): For containerized development

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/ProTechPh/School-Management-System.git
cd school-management-system
```

#### 2. Install PHP Dependencies

```bash
composer install
```

#### 3. Install Node.js Dependencies

```bash
npm install
```

#### 4. Environment Configuration

```bash
cp .env.example .env
php artisan key:generate
```

#### 5. Database Setup

Create a MySQL database and update the `.env` file:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_management_dev
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### 6. Run Database Migrations

```bash
php artisan migrate
```

#### 7. Seed the Database

```bash
php artisan db:seed
```

#### 8. Create Storage Link

```bash
php artisan storage:link
```

#### 9. Start Development Servers

```bash
# Start Laravel development server
php artisan serve

# Start Vite for asset compilation (in another terminal)
npm run dev
```

The application will be available at `http://localhost:8000`

### Docker Development Setup

#### 1. Using Docker Compose

```bash
# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# Install dependencies
docker-compose exec app composer install
docker-compose exec app npm install

# Run migrations and seeders
docker-compose exec app php artisan migrate --seed

# Create storage link
docker-compose exec app php artisan storage:link
```

#### 2. Access Services

- **Application**: http://localhost:8000
- **Database**: localhost:3306
- **Redis**: localhost:6379

### IDE Configuration

#### VS Code Setup

Install recommended extensions:

```json
{
    "recommendations": [
        "bmewburn.vscode-intelephense-client",
        "bradlc.vscode-tailwindcss",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-json",
        "onecentlin.laravel-blade",
        "ryannaddy.laravel-artisan"
    ]
}
```

#### PhpStorm Setup

1. Install Laravel plugin
2. Configure PHP interpreter
3. Set up database connection
4. Enable Laravel support in project settings

## Project Structure

### Directory Organization

```
school-management-system/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── API/
│   │   │       └── V1/          # API Controllers
│   │   ├── Requests/            # Form Request Validation
│   │   ├── Resources/           # API Resources
│   │   └── Middleware/          # Custom Middleware
│   ├── Models/                  # Eloquent Models
│   ├── Services/                # Business Logic Services
│   │   ├── Attendance/
│   │   ├── Exams/
│   │   ├── Fees/
│   │   ├── Library/
│   │   ├── Students/
│   │   └── Transport/
│   ├── Policies/                # Authorization Policies
│   └── Providers/               # Service Providers
├── database/
│   ├── migrations/              # Database Migrations
│   ├── seeders/                 # Database Seeders
│   └── factories/               # Model Factories
├── routes/
│   ├── api.php                  # API Routes
│   └── web.php                  # Web Routes
├── tests/
│   ├── Feature/                 # Feature Tests
│   └── Unit/                    # Unit Tests
├── docs/                        # Documentation
└── resources/
    ├── views/                   # Blade Templates
    ├── css/                     # Stylesheets
    └── js/                      # JavaScript
```

### Key Files and Their Purposes

#### Controllers
- **API Controllers**: Handle API requests and responses
- **Form Requests**: Validate incoming request data
- **Resources**: Transform model data for API responses

#### Models
- **Eloquent Models**: Represent database entities
- **Relationships**: Define model relationships
- **Scopes**: Reusable query constraints

#### Services
- **Business Logic**: Encapsulate complex business operations
- **Data Processing**: Handle data transformation and validation
- **External Integrations**: Manage third-party service interactions

## Coding Standards

### PHP Standards

#### PSR-12 Compliance
The project follows PSR-12 coding standards:

```php
<?php

declare(strict_types=1);

namespace App\Services\Students;

use App\Models\Student;
use Illuminate\Database\Eloquent\Collection;

final class StudentService
{
    public function getStudents(array $filters = []): Collection
    {
        // Implementation
    }
}
```

#### Naming Conventions

**Classes:**
- Use PascalCase: `StudentService`, `FeeInvoiceController`
- Use descriptive names: `BookLoanService` not `BookService`

**Methods:**
- Use camelCase: `getStudents()`, `createStudent()`
- Use descriptive names: `getOverdueBooks()` not `getOverdue()`

**Variables:**
- Use camelCase: `$studentId`, `$feeAmount`
- Use descriptive names: `$attendanceRecords` not `$records`

**Constants:**
- Use UPPER_SNAKE_CASE: `MAX_LOAN_DAYS`, `DEFAULT_FINE_RATE`

#### Type Declarations

Always use strict typing and explicit type declarations:

```php
<?php

declare(strict_types=1);

final class BookService
{
    public function createBook(array $data): Book
    {
        return Book::create($data);
    }
    
    public function getAvailableCopies(Book $book): Collection
    {
        return $book->copies()
            ->where('status', 'available')
            ->get();
    }
}
```

#### Documentation

Use PHPDoc for all public methods:

```php
/**
 * Create a new student with user account and guardian links.
 *
 * @param array $data Student data including user information
 * @return Student Created student instance
 * @throws \Exception When user creation fails
 */
public function createStudent(array $data): Student
{
    // Implementation
}
```

### Laravel Best Practices

#### Model Design

```php
final class Student extends Model
{
    use HasFactory, LogsActivity;
    
    protected $fillable = [
        'user_id',
        'student_id',
        'admission_number',
        'admission_date',
        'is_active',
    ];
    
    protected function casts(): array
    {
        return [
            'admission_date' => 'date',
            'is_active' => 'boolean',
        ];
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

#### Controller Design

```php
final class StudentsController extends Controller
{
    public function __construct(
        private readonly StudentService $studentService
    ) {}
    
    public function index(Request $request): JsonResponse
    {
        $students = $this->studentService->getStudents($request->all());
        
        return response()->json([
            'data' => StudentResource::collection($students),
            'status' => 'success'
        ]);
    }
}
```

#### Service Design

```php
final class StudentService
{
    public function getStudents(array $filters = []): LengthAwarePaginator
    {
        $query = Student::with(['user', 'guardians.user']);
        
        if (isset($filters['search'])) {
            $this->applySearchFilter($query, $filters['search']);
        }
        
        return $query->paginate($filters['per_page'] ?? 15);
    }
    
    private function applySearchFilter(Builder $query, string $search): void
    {
        $query->whereHas('user', function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        });
    }
}
```

## Database Management

### Migrations

#### Creating Migrations

```bash
# Create a new migration
php artisan make:migration create_students_table

# Create a migration with model
php artisan make:model Student -m
```

#### Migration Structure

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('student_id')->unique();
            $table->string('admission_number')->unique();
            $table->date('admission_date');
            $table->string('blood_group')->nullable();
            $table->json('medical_conditions')->nullable();
            $table->json('emergency_contact')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['student_id', 'is_active']);
            $table->index('admission_date');
        });
    }
    
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
```

#### Running Migrations

```bash
# Run all pending migrations
php artisan migrate

# Run migrations in production
php artisan migrate --force

# Rollback last migration
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset
```

### Seeders

#### Creating Seeders

```bash
php artisan make:seeder StudentSeeder
```

#### Seeder Structure

```php
<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

final class StudentSeeder extends Seeder
{
    public function run(): void
    {
        User::factory(50)->create()->each(function (User $user) {
            $user->assignRole('Student');
            
            Student::factory()->create([
                'user_id' => $user->id,
                'student_id' => 'STU' . str_pad($user->id, 4, '0', STR_PAD_LEFT),
                'admission_number' => 'ADM' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
            ]);
        });
    }
}
```

#### Running Seeders

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=StudentSeeder

# Run seeders in production
php artisan db:seed --force
```

### Factories

#### Creating Factories

```bash
php artisan make:factory StudentFactory
```

#### Factory Structure

```php
<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentFactory extends Factory
{
    protected $model = Student::class;
    
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'student_id' => 'STU' . $this->faker->unique()->numberBetween(1000, 9999),
            'admission_number' => 'ADM' . $this->faker->unique()->numberBetween(100000, 999999),
            'admission_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'blood_group' => $this->faker->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'medical_conditions' => $this->faker->optional()->randomElements([
                'Asthma', 'Diabetes', 'Epilepsy', 'Allergies'
            ], $this->faker->numberBetween(0, 2)),
            'emergency_contact' => [
                'name' => $this->faker->name(),
                'phone' => $this->faker->phoneNumber(),
                'relationship' => $this->faker->randomElement(['Father', 'Mother', 'Guardian']),
            ],
            'is_active' => $this->faker->boolean(90),
        ];
    }
}
```

## Testing Guidelines

### Test Structure

#### Feature Tests
Test complete user workflows and API endpoints:

```php
<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class StudentManagementTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_can_create_student(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');
        
        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/students', [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'student_id' => 'STU001',
                'admission_number' => 'ADM001',
                'admission_date' => '2024-01-15',
            ]);
        
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'student_id',
                    'admission_number',
                    'user' => ['name', 'email']
                ],
                'message',
                'status'
            ]);
        
        $this->assertDatabaseHas('students', [
            'student_id' => 'STU001',
            'admission_number' => 'ADM001',
        ]);
    }
    
    public function test_can_list_students(): void
    {
        Student::factory(10)->create();
        
        $user = User::factory()->create();
        $user->assignRole('Admin');
        
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/students');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'student_id',
                        'user' => ['name', 'email']
                    ]
                ],
                'links',
                'meta'
            ]);
    }
}
```

#### Unit Tests
Test individual methods and classes:

```php
<?php

namespace Tests\Unit;

use App\Models\Book;
use App\Models\BookCopy;
use App\Services\Library\BookService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class BookServiceTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_can_get_available_copies(): void
    {
        $book = Book::factory()->create();
        BookCopy::factory(3)->create([
            'book_id' => $book->id,
            'status' => 'available'
        ]);
        BookCopy::factory(2)->create([
            'book_id' => $book->id,
            'status' => 'loaned'
        ]);
        
        $service = new BookService();
        $availableCopies = $service->getAvailableCopies($book);
        
        $this->assertCount(3, $availableCopies);
        $this->assertTrue($availableCopies->every(fn($copy) => $copy->status === 'available'));
    }
    
    public function test_can_search_books(): void
    {
        Book::factory()->create(['title' => 'Advanced Mathematics']);
        Book::factory()->create(['title' => 'Basic Science']);
        Book::factory()->create(['author' => 'John Mathematics']);
        
        $service = new BookService();
        $results = $service->getBooks(['search' => 'Mathematics']);
        
        $this->assertCount(2, $results->items());
    }
}
```

### Running Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/StudentManagementTest.php

# Run tests with coverage
php artisan test --coverage

# Run tests in parallel
php artisan test --parallel

# Run specific test method
php artisan test --filter test_can_create_student
```

### Test Data Management

#### Using Factories

```php
// Create single instance
$student = Student::factory()->create();

// Create multiple instances
$students = Student::factory(10)->create();

// Create with specific attributes
$student = Student::factory()->create([
    'student_id' => 'STU001',
    'is_active' => true
]);

// Create with relationships
$student = Student::factory()
    ->has(User::factory())
    ->create();
```

#### Database Transactions

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

final class ExampleTest extends TestCase
{
    use RefreshDatabase; // Automatically rolls back database changes
    
    public function test_example(): void
    {
        // Test implementation
    }
}
```

## API Development

### API Design Principles

#### RESTful Endpoints

```php
// Resource routes
Route::apiResource('students', StudentsController::class);

// Custom routes
Route::post('students/{student}/enroll', [StudentsController::class, 'enroll']);
Route::get('students/{student}/attendance', [StudentsController::class, 'attendance']);
```

#### Request Validation

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Student::class);
    }
    
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'student_id' => ['required', 'string', 'unique:students,student_id'],
            'admission_number' => ['required', 'string', 'unique:students,admission_number'],
            'admission_date' => ['required', 'date'],
            'blood_group' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'medical_conditions' => ['nullable', 'array'],
            'emergency_contact' => ['nullable', 'array'],
            'emergency_contact.name' => ['required_with:emergency_contact', 'string'],
            'emergency_contact.phone' => ['required_with:emergency_contact', 'string'],
            'emergency_contact.relationship' => ['required_with:emergency_contact', 'string'],
        ];
    }
    
    public function messages(): array
    {
        return [
            'email.unique' => 'This email address is already registered.',
            'student_id.unique' => 'This student ID is already in use.',
            'admission_number.unique' => 'This admission number is already in use.',
        ];
    }
}
```

#### API Resources

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'admission_number' => $this->admission_number,
            'admission_date' => $this->admission_date->format('Y-m-d'),
            'blood_group' => $this->blood_group,
            'medical_conditions' => $this->medical_conditions,
            'emergency_contact' => $this->emergency_contact,
            'is_active' => $this->is_active,
            'user' => new UserResource($this->whenLoaded('user')),
            'guardians' => GuardianResource::collection($this->whenLoaded('guardians')),
            'enrollments' => EnrollmentResource::collection($this->whenLoaded('enrollments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
```

### Error Handling

#### Custom Exceptions

```php
<?php

namespace App\Exceptions;

use Exception;

final class BookNotAvailableException extends Exception
{
    public function __construct(string $bookTitle)
    {
        parent::__construct("Book '{$bookTitle}' is not available for loan.");
    }
}
```

#### Exception Handler

```php
<?php

namespace App\Exceptions;

use App\Exceptions\BookNotAvailableException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

final class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }
    
    public function render($request, Throwable $e): JsonResponse
    {
        if ($request->expectsJson()) {
            if ($e instanceof BookNotAvailableException) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'status' => 'error'
                ], 422);
            }
            
            if ($e instanceof NotFoundHttpException) {
                return response()->json([
                    'message' => 'Resource not found',
                    'status' => 'error'
                ], 404);
            }
        }
        
        return parent::render($request, $e);
    }
}
```

## Frontend Integration

### API Client Setup

#### JavaScript/TypeScript

```typescript
// api/client.ts
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

#### React Hooks

```typescript
// hooks/useStudents.ts
import { useState, useEffect } from 'react';
import api from '../api/client';

interface Student {
    id: number;
    student_id: string;
    name: string;
    email: string;
    is_active: boolean;
}

interface UseStudentsReturn {
    students: Student[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useStudents = (filters?: Record<string, any>): UseStudentsReturn => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/students', { params: filters });
            setStudents(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchStudents();
    }, [JSON.stringify(filters)]);
    
    return { students, loading, error, refetch: fetchStudents };
};
```

### State Management

#### Redux Toolkit

```typescript
// store/slices/studentsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

interface Student {
    id: number;
    student_id: string;
    name: string;
    email: string;
    is_active: boolean;
}

interface StudentsState {
    students: Student[];
    loading: boolean;
    error: string | null;
}

const initialState: StudentsState = {
    students: [],
    loading: false,
    error: null,
};

export const fetchStudents = createAsyncThunk(
    'students/fetchStudents',
    async (filters?: Record<string, any>) => {
        const response = await api.get('/students', { params: filters });
        return response.data.data;
    }
);

export const createStudent = createAsyncThunk(
    'students/createStudent',
    async (studentData: Partial<Student>) => {
        const response = await api.post('/students', studentData);
        return response.data.data;
    }
);

const studentsSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStudents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStudents.fulfilled, (state, action) => {
                state.loading = false;
                state.students = action.payload;
            })
            .addCase(fetchStudents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch students';
            })
            .addCase(createStudent.fulfilled, (state, action) => {
                state.students.push(action.payload);
            });
    },
});

export const { clearError } = studentsSlice.actions;
export default studentsSlice.reducer;
```

## Debugging and Troubleshooting

### Laravel Debugging Tools

#### Laravel Telescope
Install and configure Laravel Telescope for debugging:

```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

#### Laravel Debugbar
Install Laravel Debugbar for development:

```bash
composer require barryvdh/laravel-debugbar --dev
```

#### Logging

```php
// Use Laravel's Log facade
use Illuminate\Support\Facades\Log;

Log::info('Student created', ['student_id' => $student->id]);
Log::error('Failed to create student', ['error' => $e->getMessage()]);
Log::debug('Debug information', ['data' => $data]);
```

### Common Issues and Solutions

#### Database Connection Issues

```bash
# Check database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Clear configuration cache
php artisan config:clear
php artisan cache:clear
```

#### Permission Issues

```bash
# Fix storage permissions
sudo chmod -R 775 storage
sudo chmod -R 775 bootstrap/cache

# Fix ownership
sudo chown -R www-data:www-data storage
sudo chown -R www-data:www-data bootstrap/cache
```

#### Memory Issues

```bash
# Increase PHP memory limit
php -d memory_limit=512M artisan migrate

# For Composer
composer install --no-dev --optimize-autoloader
```

### Performance Debugging

#### Query Debugging

```php
// Enable query logging
DB::enableQueryLog();

// Your code here
$students = Student::with('user')->get();

// Check queries
dd(DB::getQueryLog());
```

#### Slow Query Identification

```php
// Add to AppServiceProvider
DB::listen(function ($query) {
    if ($query->time > 1000) { // Log queries taking more than 1 second
        Log::warning('Slow query detected', [
            'sql' => $query->sql,
            'bindings' => $query->bindings,
            'time' => $query->time
        ]);
    }
});
```

## Contributing Guidelines

### Git Workflow

#### Branch Naming
- `feature/student-management`: New features
- `bugfix/attendance-calculation`: Bug fixes
- `hotfix/security-patch`: Critical fixes
- `refactor/fee-service`: Code refactoring
- `docs/api-documentation`: Documentation updates

#### Commit Messages
Follow conventional commit format:

```
feat: add student enrollment functionality
fix: resolve attendance calculation bug
docs: update API documentation
refactor: improve fee service performance
test: add unit tests for book service
```

#### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes and Commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/new-feature
   ```

4. **Code Review**
   - Address review comments
   - Update tests if needed
   - Ensure all checks pass

5. **Merge**
   - Squash and merge
   - Delete feature branch

### Code Quality Standards

#### Pre-commit Checks

```bash
# Run PHP CS Fixer
./vendor/bin/php-cs-fixer fix

# Run PHPStan
./vendor/bin/phpstan analyse

# Run tests
php artisan test

# Check code coverage
php artisan test --coverage
```

#### Continuous Integration

The project uses GitHub Actions for CI/CD:

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: 8.3
        
    - name: Install dependencies
      run: composer install --no-dev --optimize-autoloader
      
    - name: Run tests
      run: php artisan test
      
    - name: Run PHPStan
      run: ./vendor/bin/phpstan analyse
```

### Documentation Requirements

#### Code Documentation
- Document all public methods with PHPDoc
- Include parameter types and return types
- Document exceptions that may be thrown
- Provide usage examples for complex methods

#### API Documentation
- Update API documentation for new endpoints
- Include request/response examples
- Document error codes and messages
- Update Postman collection

#### README Updates
- Update installation instructions
- Document new features
- Update configuration options
- Include troubleshooting information

## Code Review Process

### Review Checklist

#### Functionality
- [ ] Code works as expected
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance is acceptable

#### Code Quality
- [ ] Follows coding standards
- [ ] Uses appropriate design patterns
- [ ] Code is readable and maintainable
- [ ] No code duplication

#### Testing
- [ ] Unit tests are included
- [ ] Feature tests cover new functionality
- [ ] Tests pass and have good coverage
- [ ] Edge cases are tested

#### Security
- [ ] Input validation is implemented
- [ ] Authorization is properly checked
- [ ] No sensitive data is exposed
- [ ] SQL injection prevention

#### Documentation
- [ ] Code is properly documented
- [ ] API documentation is updated
- [ ] README is updated if needed
- [ ] Changelog is updated

### Review Guidelines

#### For Reviewers
- Be constructive and respectful
- Focus on code quality and functionality
- Provide specific feedback with examples
- Approve when all concerns are addressed

#### For Authors
- Respond to all review comments
- Make requested changes or explain why not
- Test changes thoroughly
- Keep commits focused and atomic

---

**Last Updated:** January 2024  
**Laravel Version:** 11.0+  
**PHP Version:** 8.3+  
**License:** [MIT License](../LICENSE)
