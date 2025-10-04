<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GradingScale>
 */
class GradingScaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'academic_year_id' => AcademicYear::factory(),
            'name' => $this->faker->randomElement(['Standard Grading', 'Percentage Grading', 'Letter Grading']),
            'description' => $this->faker->sentence(),
            'is_active' => $this->faker->boolean(80),
        ];
    }
}
