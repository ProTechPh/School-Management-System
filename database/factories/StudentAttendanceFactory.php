<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudentAttendance>
 */
class StudentAttendanceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => \App\Models\Student::factory(),
            'academic_year_id' => \App\Models\AcademicYear::factory(),
            'classroom_id' => \App\Models\Classroom::factory(),
            'section_id' => \App\Models\Section::factory(),
            'attendance_date' => $this->faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'status' => $this->faker->randomElement(['present', 'absent', 'late', 'excused']),
            'period' => $this->faker->optional()->randomElement(['1st Period', '2nd Period', '3rd Period', '4th Period']),
            'subject_id' => \App\Models\Subject::factory(),
            'remarks' => $this->faker->optional()->sentence(),
            'marked_by' => \App\Models\Staff::factory(),
        ];
    }
}
