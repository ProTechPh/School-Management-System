<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Message;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
final class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['direct', 'broadcast', 'announcement', 'reminder'];
        $priorities = ['low', 'medium', 'high', 'urgent'];

        return [
            'school_id' => School::factory(),
            'sender_id' => User::factory(),
            'subject' => $this->faker->sentence(4),
            'content' => $this->faker->paragraphs(2, true),
            'type' => $this->faker->randomElement($types),
            'priority' => $this->faker->randomElement($priorities),
            'is_read' => $this->faker->boolean(60),
            'read_at' => $this->faker->optional(0.6)->dateTimeBetween('-1 week', 'now'),
            'is_important' => $this->faker->boolean(15),
            'is_scheduled' => $this->faker->boolean(10),
            'scheduled_at' => $this->faker->optional(0.1)->dateTimeBetween('now', '+1 week'),
        ];
    }
}
