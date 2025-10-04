<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

final class BookFactory extends Factory
{
    protected $model = Book::class;

    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'isbn' => $this->faker->unique()->isbn13(),
            'title' => $this->faker->sentence(3),
            'author' => $this->faker->name(),
            'publisher' => $this->faker->company(),
            'publication_year' => $this->faker->year(),
            'edition' => $this->faker->randomElement(['1st', '2nd', '3rd', '4th', '5th']) . ' Edition',
            'category' => $this->faker->randomElement(['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Literature']),
            'subject' => $this->faker->randomElement(['English', 'Mathematics', 'Science', 'History', 'Geography', 'Art']),
            'language' => $this->faker->randomElement(['English', 'Spanish', 'French', 'German']),
            'pages' => $this->faker->numberBetween(50, 500),
            'description' => $this->faker->paragraph(),
            'cover_image' => $this->faker->imageUrl(),
            'is_reference' => $this->faker->boolean(20), // 20% chance of being reference
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
        ];
    }
}
