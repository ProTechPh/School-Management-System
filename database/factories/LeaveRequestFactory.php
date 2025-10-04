<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\LeaveRequest;
use App\Models\School;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LeaveRequest>
 */
final class LeaveRequestFactory extends Factory
{
    protected $model = LeaveRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('now', '+1 month');
        $endDate = $this->faker->dateTimeBetween($startDate, '+2 weeks');
        $totalDays = $startDate->diff($endDate)->days + 1;

        return [
            'staff_id' => Staff::factory(),
            'school_id' => School::factory(),
            'leave_type' => $this->faker->randomElement(['sick', 'casual', 'annual', 'emergency', 'maternity', 'paternity']),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => $totalDays,
            'reason' => $this->faker->sentence(),
            'notes' => $this->faker->optional()->sentence(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected', 'cancelled']),
            'approved_by' => $this->faker->optional(0.7)->randomElement([Staff::factory()]),
            'approved_at' => $this->faker->optional(0.7)->dateTimeBetween($startDate, 'now'),
            'approval_notes' => $this->faker->optional()->sentence(),
        ];
    }
}
