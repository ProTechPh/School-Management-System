<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BookLoan;
use App\Models\School;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

final class LibraryManagementTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $librarian;
    private School $school;
    private Book $book;
    private BookCopy $bookCopy;
    private Student $student;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create permissions
        $permissions = [
            'library.view',
            'library.create',
            'library.update',
            'library.delete',
            'library.view-own',
            'library.view-children',
        ];
        
        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }
        
        // Create roles
        Role::create(['name' => 'Librarian']);
        Role::create(['name' => 'Student']);
        
        // Create librarian user
        $this->librarian = User::factory()->create();
        $librarianRole = Role::findByName('Librarian');
        $librarianRole->givePermissionTo($permissions);
        $this->librarian->assignRole($librarianRole);
        
        // Create school
        $this->school = School::factory()->create();
        
        // Create staff record for librarian
        Staff::factory()->create([
            'user_id' => $this->librarian->id,
        ]);
        
        // Create book and copy
        $this->book = Book::factory()->create(['school_id' => $this->school->id]);
        $this->bookCopy = BookCopy::factory()->create([
            'book_id' => $this->book->id,
            'status' => 'available',
        ]);
        
        // Create student
        $this->student = Student::factory()->create();
        
        Sanctum::actingAs($this->librarian);
    }

    public function test_can_create_book(): void
    {
        $bookData = [
            'school_id' => $this->school->id,
            'isbn' => '978-0-123456-78-9',
            'title' => 'Test Book',
            'author' => 'Test Author',
            'publisher' => 'Test Publisher',
            'publication_year' => 2023,
            'edition' => '1st',
            'category' => 'Fiction',
            'subject' => 'Literature',
            'language' => 'English',
            'pages' => 300,
            'description' => 'A test book for testing purposes',
            'is_reference' => false,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/v1/books', $bookData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'author',
                    'isbn',
                ],
                'message',
            ]);

        $this->assertDatabaseHas('books', [
            'title' => 'Test Book',
            'author' => 'Test Author',
            'isbn' => '978-0-123456-78-9',
        ]);
    }

    public function test_can_get_books_list(): void
    {
        Book::factory(5)->create(['school_id' => $this->school->id]);

        $response = $this->getJson('/api/v1/books');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'author',
                        'isbn',
                    ],
                ],
            ]);
    }

    public function test_can_issue_book_loan(): void
    {
        $loanData = [
            'book_id' => $this->book->id,
            'book_copy_id' => $this->bookCopy->id,
            'student_id' => $this->student->id,
            'issued_by' => $this->librarian->id,
            'loan_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(14)->format('Y-m-d'),
            'notes' => 'Test loan',
        ];

        $response = $this->postJson('/api/v1/book-loans', $loanData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'loan_date',
                    'due_date',
                    'status',
                ],
                'message',
            ]);

        $this->assertDatabaseHas('book_loans', [
            'book_id' => $this->book->id,
            'student_id' => $this->student->id,
            'status' => 'active',
        ]);
    }

    public function test_can_return_book(): void
    {
        $loan = BookLoan::factory()->create([
            'book_id' => $this->book->id,
            'book_copy_id' => $this->bookCopy->id,
            'student_id' => $this->student->id,
            'status' => 'active',
        ]);

        $response = $this->postJson("/api/v1/book-loans/{$loan->id}/return", [
            'returned_at' => now()->format('Y-m-d H:i:s'),
            'notes' => 'Book returned in good condition',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'status' => 'returned',
            ]);

        $this->assertDatabaseHas('book_loans', [
            'id' => $loan->id,
            'status' => 'returned',
        ]);
    }

    public function test_can_get_overdue_books(): void
    {
        BookLoan::factory()->create([
            'book_id' => $this->book->id,
            'book_copy_id' => $this->bookCopy->id,
            'student_id' => $this->student->id,
            'due_date' => now()->subDays(5),
            'status' => 'overdue',
        ]);

        $response = $this->getJson('/api/v1/book-loans/overdue');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'due_date',
                        'status',
                        'student',
                        'book',
                    ],
                ],
            ]);
    }

    public function test_requires_authentication(): void
    {
        $this->refreshApplication();
        
        $response = $this->getJson('/api/v1/books');
        $response->assertStatus(401);
    }
}
