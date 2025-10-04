<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AcademicYear>
 */
class AcademicYearFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startYear = $this->faker->numberBetween(2020, 2025);
        return [
            'school_id' => \App\Models\School::factory(),
            'name' => $startYear . '-' . ($startYear + 1),
            'start_date' => $startYear . '-09-01',
            'end_date' => ($startYear + 1) . '-06-30',
            'is_current' => $startYear === 2024,
        ];
    }
}
