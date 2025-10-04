<?php

namespace Database\Factories;

use App\Models\Guardian;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

final class GuardianFactory extends Factory
{
    protected $model = Guardian::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'occupation' => $this->faker->jobTitle(),
            'workplace' => $this->faker->company(),
            'monthly_income' => $this->faker->randomFloat(2, 20000, 150000),
            'is_emergency_contact' => $this->faker->boolean(70), // 70% chance of being emergency contact
        ];
    }
}
