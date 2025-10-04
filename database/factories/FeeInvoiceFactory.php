<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\FeeStructure;
use App\Models\AcademicYear;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FeeInvoice>
 */
class FeeInvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $totalAmount = $this->faker->randomFloat(2, 500, 3000);
        $paidAmount = $this->faker->randomFloat(2, 0, $totalAmount);
        
        return [
            'student_id' => Student::factory(),
            'fee_structure_id' => FeeStructure::factory(),
            'academic_year_id' => AcademicYear::factory(),
            'invoice_number' => 'INV-' . $this->faker->unique()->numberBetween(1000, 9999),
            'invoice_date' => $this->faker->dateTimeBetween('-2 months', 'now'),
            'due_date' => $this->faker->dateTimeBetween('now', '+3 months'),
            'total_amount' => $totalAmount,
            'paid_amount' => $paidAmount,
            'balance_amount' => $totalAmount - $paidAmount,
            'status' => $this->faker->randomElement(['pending', 'partial', 'paid', 'overdue']),
            'notes' => $this->faker->optional()->sentence(),
            'created_by' => Staff::factory(),
        ];
    }
}
