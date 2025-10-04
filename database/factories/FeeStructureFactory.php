<?php

namespace Database\Factories;

use App\Models\AcademicYear;
use App\Models\Classroom;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FeeStructure>
 */
class FeeStructureFactory extends Factory
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
            'classroom_id' => Classroom::factory(),
            'name' => $this->faker->randomElement(['Tuition Fee', 'Transport Fee', 'Library Fee', 'Exam Fee', 'Sports Fee', 'Computer Fee']),
            'description' => $this->faker->sentence(),
            'fee_type' => $this->faker->randomElement(['tuition', 'transport', 'library', 'exam', 'other']),
            'amount' => $this->faker->randomFloat(2, 100, 5000),
            'due_date' => $this->faker->dateTimeBetween('+1 month', '+6 months'),
            'is_mandatory' => $this->faker->boolean(80),
            'is_active' => $this->faker->boolean(90),
        ];
    }
}
