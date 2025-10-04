<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\BookCopy;
use Illuminate\Database\Eloquent\Factories\Factory;

final class BookCopyFactory extends Factory
{
    protected $model = BookCopy::class;

    public function definition(): array
    {
        return [
            'book_id' => Book::factory(),
            'copy_number' => $this->faker->unique()->numberBetween(1, 9999),
            'barcode' => $this->faker->unique()->ean13(),
            'purchase_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'purchase_price' => $this->faker->randomFloat(2, 10, 100),
            'condition' => $this->faker->randomElement(['new', 'good', 'fair', 'poor', 'damaged']),
            'location' => $this->faker->randomElement(['Shelf A1', 'Shelf B2', 'Shelf C3', 'Reference Section', 'Children Section']),
            'status' => $this->faker->randomElement(['available', 'loaned', 'lost', 'damaged', 'withdrawn']),
            'notes' => $this->faker->sentence(),
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
        ];
    }
}
