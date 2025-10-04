<?php

namespace Database\Factories;

use App\Models\BookFine;
use App\Models\BookLoan;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

final class BookFineFactory extends Factory
{
    protected $model = BookFine::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 5, 100);
        $isPaid = $this->faker->boolean(60); // 60% chance of being paid
        $isWaived = $this->faker->boolean(10); // 10% chance of being waived
        
        return [
            'book_loan_id' => BookLoan::factory(),
            'student_id' => Student::factory(),
            'amount' => $amount,
            'fine_type' => $this->faker->randomElement(['overdue', 'damage', 'loss']),
            'description' => $this->faker->sentence(),
            'due_date' => $this->faker->dateTimeBetween('now', '+30 days'),
            'paid_date' => $isPaid ? $this->faker->dateTimeBetween('-1 month', 'now') : null,
            'paid_amount' => $isPaid ? $this->faker->randomFloat(2, 0, $amount) : 0,
            'status' => $isWaived ? 'waived' : ($isPaid ? 'paid' : 'pending'),
            'waived_by' => $isWaived ? Staff::factory() : null,
            'waived_reason' => $isWaived ? $this->faker->sentence() : null,
            'collected_by' => $isPaid ? Staff::factory() : null,
        ];
    }
}
