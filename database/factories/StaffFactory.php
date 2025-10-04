<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Staff>
 */
class StaffFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'employee_id' => 'EMP' . $this->faker->unique()->numberBetween(1000, 9999),
            'department_id' => \App\Models\Department::factory(),
            'designation_id' => \App\Models\Designation::factory(),
            'joining_date' => $this->faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d'),
            'salary' => $this->faker->numberBetween(30000, 80000),
            'qualification' => $this->faker->randomElement(['B.Ed', 'M.Ed', 'B.Sc', 'M.Sc', 'PhD']),
            'experience_years' => $this->faker->numberBetween(0, 20),
            'is_active' => true,
        ];
    }
}
