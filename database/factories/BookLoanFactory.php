<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BookLoan;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

final class BookLoanFactory extends Factory
{
    protected $model = BookLoan::class;

    public function definition(): array
    {
        $loanDate = $this->faker->dateTimeBetween('-3 months', 'now');
        $dueDate = $this->faker->dateTimeBetween($loanDate, '+1 month');
        $isReturned = $this->faker->boolean(70); // 70% chance of being returned
        
        return [
            'book_id' => Book::factory(),
            'book_copy_id' => BookCopy::factory(),
            'student_id' => Student::factory(),
            'staff_id' => null, // Only students borrow books in this factory
            'loan_date' => $loanDate,
            'due_date' => $dueDate,
            'returned_at' => $isReturned ? $this->faker->dateTimeBetween($loanDate, 'now') : null,
            'returned_by' => $isReturned ? Staff::factory() : null,
            'fine_amount' => $this->faker->randomFloat(2, 0, 50),
            'fine_paid' => $this->faker->randomFloat(2, 0, 25),
            'status' => $isReturned ? 'returned' : $this->faker->randomElement(['active', 'overdue']),
            'notes' => $this->faker->sentence(),
            'issued_by' => Staff::factory(),
        ];
    }
}
