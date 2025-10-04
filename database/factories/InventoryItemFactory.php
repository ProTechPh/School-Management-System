<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\InventoryItem;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InventoryItem>
 */
final class InventoryItemFactory extends Factory
{
    protected $model = InventoryItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['stationery', 'furniture', 'equipment', 'books', 'sports', 'cleaning', 'maintenance'];
        $units = ['piece', 'kg', 'liter', 'box', 'set', 'pack', 'dozen'];

        return [
            'school_id' => School::factory(),
            'name' => $this->faker->words(2, true),
            'code' => 'ITM' . $this->faker->unique()->numberBetween(1000, 9999),
            'description' => $this->faker->sentence(),
            'category' => $this->faker->randomElement($categories),
            'unit' => $this->faker->randomElement($units),
            'unit_price' => $this->faker->randomFloat(2, 10, 1000),
            'minimum_stock' => $this->faker->numberBetween(5, 50),
            'maximum_stock' => $this->faker->numberBetween(100, 500),
            'location' => $this->faker->randomElement(['Store Room A', 'Store Room B', 'Office', 'Library', 'Lab']),
            'specifications' => $this->faker->optional()->sentence(),
            'is_active' => $this->faker->boolean(90),
        ];
    }
}
