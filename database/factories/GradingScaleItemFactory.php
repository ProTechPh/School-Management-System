<?php

namespace Database\Factories;

use App\Models\GradingScale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\GradingScaleItem>
 */
class GradingScaleItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $minMarks = $this->faker->numberBetween(0, 100);
        
        return [
            'grading_scale_id' => GradingScale::factory(),
            'grade' => $this->faker->randomElement(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
            'min_marks' => $minMarks,
            'max_marks' => $minMarks + $this->faker->numberBetween(5, 20),
            'grade_points' => $this->faker->randomFloat(2, 0, 4),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}
