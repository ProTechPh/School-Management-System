<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Student;
use App\Models\TransportAssignment;
use App\Models\TransportRoute;
use App\Models\TransportStop;
use App\Models\TransportVehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TransportAssignment>
 */
final class TransportAssignmentFactory extends Factory
{
    protected $model = TransportAssignment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['active', 'inactive', 'suspended', 'cancelled'];

        return [
            'student_id' => Student::factory(),
            'transport_route_id' => TransportRoute::factory(),
            'transport_vehicle_id' => TransportVehicle::factory(),
            'pickup_stop_id' => TransportStop::factory(),
            'drop_stop_id' => TransportStop::factory(),
            'start_date' => $this->faker->dateTimeBetween('-6 months', 'now'),
            'end_date' => $this->faker->optional(0.3)->dateTimeBetween('now', '+1 year'),
            'monthly_fare' => $this->faker->randomFloat(2, 200, 800),
            'status' => $this->faker->randomElement($statuses),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
