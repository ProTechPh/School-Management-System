<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\School;
use App\Models\TransportRoute;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TransportRoute>
 */
final class TransportRouteFactory extends Factory
{
    protected $model = TransportRoute::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $routeNames = [
            'North Route', 'South Route', 'East Route', 'West Route',
            'Central Route', 'Suburban Route', 'Downtown Route', 'Airport Route'
        ];

        return [
            'school_id' => School::factory(),
            'name' => $this->faker->randomElement($routeNames),
            'code' => 'RT' . $this->faker->unique()->numberBetween(100, 999),
            'description' => $this->faker->sentence(),
            'distance_km' => $this->faker->randomFloat(2, 5, 50),
            'estimated_duration' => $this->faker->time('H:i:s', '02:00:00'),
            'fare_amount' => $this->faker->randomFloat(2, 100, 500),
            'is_active' => $this->faker->boolean(80),
        ];
    }
}
