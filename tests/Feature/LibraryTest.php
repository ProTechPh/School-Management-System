<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BookLoan;
use App\Models\BookFine;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class LibraryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Run seeders to create roles
        $this->seed([
            \Database\Seeders\RoleSeeder::class,
            \Database\Seeders\SchoolSeeder::class,
        ]);
    }

    public function test_librarian_can_view_books(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/books');

        $response->assertStatus(200);
    }

    public function test_librarian_can_create_book(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $bookData = [
            'school_id' => 1,
            'title' => 'Test Book',
            'author' => 'Test Author',
            'isbn' => '978-0-123456-78-9',
            'category' => 'Fiction',
            'subject' => 'English',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/books', $bookData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('books', ['title' => 'Test Book']);
    }

    public function test_librarian_can_create_book_loan(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $book = Book::factory()->create();
        $bookCopy = BookCopy::factory()->create(['book_id' => $book->id, 'status' => 'available']);
        $student = Student::factory()->create();
        $staff = \App\Models\Staff::factory()->create();

        $loanData = [
            'book_id' => $book->id,
            'book_copy_id' => $bookCopy->id,
            'student_id' => $student->id,
            'loan_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'issued_by' => $staff->id,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/book-loans', $loanData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('book_loans', ['book_id' => $book->id]);
    }

    public function test_librarian_can_return_book(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $bookLoan = BookLoan::factory()->create(['status' => 'active']);
        $staff = \App\Models\Staff::factory()->create();

        $returnData = [
            'returned_by' => $staff->id,
            'notes' => 'Book returned in good condition',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/v1/book-loans/{$bookLoan->id}/return", $returnData);

        $response->assertStatus(200);
        $this->assertDatabaseHas('book_loans', [
            'id' => $bookLoan->id,
            'status' => 'returned',
        ]);
    }

    public function test_librarian_can_create_fine(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $bookLoan = BookLoan::factory()->create();
        $student = Student::factory()->create();

        $fineData = [
            'book_loan_id' => $bookLoan->id,
            'student_id' => $student->id,
            'amount' => 25.00,
            'fine_type' => 'overdue',
            'description' => 'Overdue fine for 5 days',
            'due_date' => now()->addDays(30)->toDateString(),
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/book-fines', $fineData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('book_fines', ['amount' => 25.00]);
    }

    public function test_librarian_can_pay_fine(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $bookFine = BookFine::factory()->create(['status' => 'pending', 'paid_amount' => 0]);
        $staff = \App\Models\Staff::factory()->create();

        $paymentData = [
            'paid_amount' => 15.00,
            'collected_by' => $staff->id,
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson("/api/v1/book-fines/{$bookFine->id}/pay", $paymentData);

        $response->assertStatus(200);
        $this->assertDatabaseHas('book_fines', [
            'id' => $bookFine->id,
            'paid_amount' => 15.00,
        ]);
    }

    public function test_student_can_view_own_loans(): void
    {
        $student = Student::factory()->create();
        $user = $student->user;
        $user->assignRole('Student');

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/v1/book-loans/student-loans?student_id={$student->id}");

        $response->assertStatus(200);
    }

    public function test_guardian_can_view_children_loans(): void
    {
        $guardian = \App\Models\Guardian::factory()->create();
        $user = $guardian->user;
        $user->assignRole('Guardian');

        // Create a student and associate with guardian
        $student = Student::factory()->create();
        $guardian->students()->attach($student->id, ['relationship' => 'father']);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/v1/book-loans/student-loans?student_id={$student->id}");

        $response->assertStatus(200);
    }

    public function test_unauthorized_user_cannot_view_books(): void
    {
        $user = User::factory()->create();
        // Don't assign any role - user has no permissions

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/books');

        $response->assertStatus(403);
    }

    public function test_books_categories_endpoint(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/books/categories');

        $response->assertStatus(200);
    }

    public function test_books_subjects_endpoint(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/books/subjects');

        $response->assertStatus(200);
    }

    public function test_overdue_loans_endpoint(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/book-loans/overdue');

        $response->assertStatus(200);
    }

    public function test_loan_statistics_endpoint(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/book-loans/statistics');

        $response->assertStatus(200);
    }

    public function test_fine_statistics_endpoint(): void
    {
        $librarian = User::factory()->create();
        $librarian->assignRole('Librarian');

        $token = $librarian->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/book-fines/statistics');

        $response->assertStatus(200);
    }
}
