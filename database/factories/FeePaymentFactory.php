<?php

namespace Database\Factories;

use App\Models\FeeInvoice;
use App\Models\Student;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FeePayment>
 */
class FeePaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'fee_invoice_id' => FeeInvoice::factory(),
            'student_id' => Student::factory(),
            'payment_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'amount' => $this->faker->randomFloat(2, 100, 2000),
            'payment_method' => $this->faker->randomElement(['cash', 'cheque', 'bank_transfer', 'card', 'other']),
            'payment_reference' => $this->faker->optional()->numerify('REF-####'),
            'bank_name' => $this->faker->optional()->company(),
            'cheque_number' => $this->faker->optional()->numerify('CHQ-######'),
            'transaction_id' => $this->faker->optional()->numerify('TXN-########'),
            'notes' => $this->faker->optional()->sentence(),
            'received_by' => Staff::factory(),
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'cancelled']),
        ];
    }
}
