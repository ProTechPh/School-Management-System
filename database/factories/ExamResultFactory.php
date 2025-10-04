<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\ExamTerm;
use App\Models\ExamAssessment;
use App\Models\Subject;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ExamResult>
 */
class ExamResultFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $marksObtained = $this->faker->numberBetween(0, 100);
        
        return [
            'student_id' => Student::factory(),
            'exam_term_id' => ExamTerm::factory(),
            'exam_assessment_id' => ExamAssessment::factory(),
            'subject_id' => Subject::factory(),
            'marks_obtained' => $marksObtained,
            'grade' => $this->faker->randomElement(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
            'grade_points' => $this->faker->randomFloat(2, 0, 4),
            'remarks' => $this->faker->optional()->sentence(),
            'is_passed' => $marksObtained >= 40,
            'entered_by' => Staff::factory(),
        ];
    }
}
