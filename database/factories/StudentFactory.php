<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'student_id' => 'STU' . $this->faker->unique()->numberBetween(10000, 99999),
            'admission_number' => 'ADM' . date('Y') . $this->faker->unique()->numberBetween(1000, 9999),
            'admission_date' => $this->faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'blood_group' => $this->faker->optional()->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'medical_conditions' => $this->faker->optional()->randomElements(['None', 'Asthma', 'Diabetes', 'Allergies'], 1),
            'emergency_contact' => [
                'name' => $this->faker->name,
                'phone' => $this->faker->phoneNumber,
                'relationship' => $this->faker->randomElement(['Father', 'Mother', 'Guardian']),
            ],
            'is_active' => true,
        ];
    }
}