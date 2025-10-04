<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Notice;
use App\Models\School;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Notice>
 */
final class NoticeFactory extends Factory
{
    protected $model = Notice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['general', 'academic', 'exam', 'fee', 'holiday', 'emergency', 'sports', 'cultural'];
        $priorities = ['low', 'medium', 'high', 'urgent'];
        $audiences = ['all', 'students', 'staff', 'parents', 'specific_class', 'specific_section'];

        return [
            'school_id' => School::factory(),
            'title' => $this->faker->sentence(6),
            'content' => $this->faker->paragraphs(3, true),
            'type' => $this->faker->randomElement($types),
            'priority' => $this->faker->randomElement($priorities),
            'target_audience' => $this->faker->randomElement($audiences),
            'target_classes' => $this->faker->optional(0.3)->randomElements([1, 2, 3, 4, 5], 2),
            'target_sections' => $this->faker->optional(0.3)->randomElements(['A', 'B', 'C'], 2),
            'publish_date' => $this->faker->dateTimeBetween('-1 month', '+1 month'),
            'expiry_date' => $this->faker->optional(0.7)->dateTimeBetween('+1 week', '+3 months'),
            'is_published' => $this->faker->boolean(80),
            'is_pinned' => $this->faker->boolean(20),
            'created_by' => Staff::factory(),
        ];
    }
}
