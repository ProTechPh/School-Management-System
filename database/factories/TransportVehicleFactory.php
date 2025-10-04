<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\School;
use App\Models\TransportVehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TransportVehicle>
 */
final class TransportVehicleFactory extends Factory
{
    protected $model = TransportVehicle::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $vehicleTypes = ['bus', 'van', 'car'];
        $makes = ['Toyota', 'Ford', 'Chevrolet', 'Honda', 'Nissan', 'Volvo', 'Mercedes'];
        $colors = ['White', 'Blue', 'Red', 'Green', 'Yellow', 'Black', 'Silver'];

        return [
            'school_id' => School::factory(),
            'vehicle_number' => 'VH' . $this->faker->unique()->numberBetween(1000, 9999),
            'vehicle_type' => $this->faker->randomElement($vehicleTypes),
            'make' => $this->faker->randomElement($makes),
            'model' => $this->faker->word(),
            'year' => $this->faker->numberBetween(2010, 2024),
            'color' => $this->faker->randomElement($colors),
            'capacity' => $this->faker->numberBetween(20, 60),
            'driver_name' => $this->faker->name(),
            'driver_phone' => $this->faker->phoneNumber(),
            'driver_license' => 'DL' . $this->faker->unique()->numberBetween(100000, 999999),
            'insurance_expiry' => $this->faker->dateTimeBetween('+1 month', '+1 year'),
            'registration_expiry' => $this->faker->dateTimeBetween('+1 month', '+1 year'),
            'fitness_expiry' => $this->faker->dateTimeBetween('+1 month', '+1 year'),
            'notes' => $this->faker->optional()->sentence(),
            'is_active' => $this->faker->boolean(85),
        ];
    }
}
