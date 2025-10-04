<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Payroll;
use App\Models\School;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payroll>
 */
final class PayrollFactory extends Factory
{
    protected $model = Payroll::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $basicSalary = $this->faker->randomFloat(2, 15000, 50000);
        $allowances = $this->faker->randomFloat(2, 1000, 5000);
        $overtime = $this->faker->randomFloat(2, 0, 3000);
        $bonus = $this->faker->randomFloat(2, 0, 2000);
        $deductions = $this->faker->randomFloat(2, 500, 2000);
        $tax = $this->faker->randomFloat(2, 1000, 5000);
        
        $netSalary = $basicSalary + $allowances + $overtime + $bonus - $deductions - $tax;

        return [
            'staff_id' => Staff::factory(),
            'school_id' => School::factory(),
            'pay_period' => $this->faker->date('Y-m'),
            'pay_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'basic_salary' => $basicSalary,
            'allowances' => $allowances,
            'overtime' => $overtime,
            'bonus' => $bonus,
            'deductions' => $deductions,
            'tax' => $tax,
            'net_salary' => $netSalary,
            'status' => $this->faker->randomElement(['pending', 'approved', 'paid', 'cancelled']),
            'notes' => $this->faker->optional()->sentence(),
            'processed_by' => Staff::factory(),
        ];
    }
}
