<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\School;
use App\Models\TransportStop;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TransportStop>
 */
final class TransportStopFactory extends Factory
{
    protected $model = TransportStop::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $stopNames = [
            'Central Market', 'City Center', 'Railway Station', 'Bus Terminal',
            'Shopping Mall', 'Hospital', 'Library', 'Park', 'School Gate',
            'Residential Area', 'Office Complex', 'University', 'Airport'
        ];

        return [
            'school_id' => School::factory(),
            'name' => $this->faker->randomElement($stopNames),
            'address' => $this->faker->address(),
            'latitude' => $this->faker->latitude(20, 30),
            'longitude' => $this->faker->longitude(70, 80),
            'pickup_time' => $this->faker->time('H:i:s', '08:00:00'),
            'drop_time' => $this->faker->time('H:i:s', '15:00:00'),
            'landmarks' => $this->faker->optional()->sentence(),
            'is_active' => $this->faker->boolean(90),
        ];
    }
}
