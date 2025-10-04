<?php

namespace Database\Factories;

use App\Models\ExamTerm;
use App\Models\Subject;
use App\Models\Classroom;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamAssessment>
 */
class ExamAssessmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'exam_term_id' => ExamTerm::factory(),
            'subject_id' => Subject::factory(),
            'classroom_id' => Classroom::factory(),
            'section_id' => Section::factory(),
            'name' => $this->faker->randomElement(['Mathematics Exam', 'English Test', 'Science Quiz', 'History Assignment', 'Physics Practical']),
            'assessment_type' => $this->faker->randomElement(['exam', 'quiz', 'assignment', 'project', 'practical', 'oral']),
            'max_marks' => $this->faker->randomElement([50, 75, 100, 25, 30]),
            'passing_marks' => $this->faker->numberBetween(15, 40),
            'exam_date' => $this->faker->dateTimeBetween('-1 month', '+1 month'),
            'start_time' => $this->faker->time('H:i'),
            'end_time' => $this->faker->time('H:i'),
            'duration_minutes' => $this->faker->randomElement([60, 90, 120, 45, 30]),
            'instructions' => $this->faker->paragraph(),
            'is_active' => $this->faker->boolean(90),
        ];
    }
}
