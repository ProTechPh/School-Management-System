<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\School>
 */
class SchoolFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company . ' School',
            'code' => 'SCH' . $this->faker->unique()->numberBetween(100, 999),
            'address' => $this->faker->address,
            'phone' => $this->faker->phoneNumber,
            'email' => $this->faker->companyEmail,
            'website' => $this->faker->optional()->url,
            'principal_name' => $this->faker->name,
            'established_year' => $this->faker->numberBetween(1990, 2020),
            'is_active' => true,
        ];
    }
}
