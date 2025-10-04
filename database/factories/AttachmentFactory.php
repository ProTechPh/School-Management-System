<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Attachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attachment>
 */
final class AttachmentFactory extends Factory
{
    protected $model = Attachment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fileTypes = ['pdf', 'doc', 'docx', 'jpg', 'png', 'xlsx', 'ppt', 'txt'];
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'txt' => 'text/plain',
        ];

        $fileType = $this->faker->randomElement($fileTypes);
        $originalName = $this->faker->words(2, true) . '.' . $fileType;
        $fileName = $this->faker->uuid() . '.' . $fileType;

        return [
            'attachable_type' => $this->faker->randomElement(['App\\Models\\Notice', 'App\\Models\\Event', 'App\\Models\\Message']),
            'attachable_id' => $this->faker->numberBetween(1, 100),
            'original_name' => $originalName,
            'file_name' => $fileName,
            'file_path' => 'attachments/' . $fileName,
            'file_type' => $fileType,
            'mime_type' => $mimeTypes[$fileType],
            'file_size' => $this->faker->numberBetween(1024, 10485760), // 1KB to 10MB
            'disk' => 'local',
            'description' => $this->faker->optional()->sentence(),
            'uploaded_by' => User::factory(),
        ];
    }
}
