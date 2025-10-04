<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Event;
use App\Models\School;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
final class EventFactory extends Factory
{
    protected $model = Event::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['academic', 'sports', 'cultural', 'social', 'meeting', 'exam', 'holiday', 'other'];
        $audiences = ['all', 'students', 'staff', 'parents', 'specific_class', 'specific_section'];
        $recurrenceTypes = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

        $eventDate = $this->faker->dateTimeBetween('now', '+6 months');
        $startTime = $this->faker->time('H:i:s');
        $endTime = $this->faker->optional(0.8)->time('H:i:s');

        return [
            'school_id' => School::factory(),
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->paragraphs(2, true),
            'type' => $this->faker->randomElement($types),
            'event_date' => $eventDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'location' => $this->faker->optional(0.7)->randomElement(['Auditorium', 'Playground', 'Library', 'Lab', 'Classroom 101', 'Conference Room']),
            'target_audience' => $this->faker->randomElement($audiences),
            'target_classes' => $this->faker->optional(0.3)->randomElements([1, 2, 3, 4, 5], 2),
            'target_sections' => $this->faker->optional(0.3)->randomElements(['A', 'B', 'C'], 2),
            'is_all_day' => $this->faker->boolean(30),
            'is_recurring' => $this->faker->boolean(20),
            'recurrence_type' => $this->faker->randomElement($recurrenceTypes),
            'recurrence_pattern' => $this->faker->optional(0.2)->randomElements(['monday', 'wednesday', 'friday'], 2),
            'recurrence_end_date' => $this->faker->optional(0.2)->dateTimeBetween($eventDate, '+1 year'),
            'is_published' => $this->faker->boolean(85),
            'created_by' => Staff::factory(),
        ];
    }
}
