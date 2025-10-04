<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class StudentsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Run seeders to create roles and basic data
        $this->seed([
            \Database\Seeders\RoleSeeder::class,
            \Database\Seeders\SchoolSeeder::class,
        ]);
    }

    public function test_admin_can_view_students(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/students');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'message',
            ]);
    }

    public function test_teacher_can_view_students(): void
    {
        $teacher = User::factory()->create();
        $teacher->assignRole('Teacher');

        $token = $teacher->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/students');

        $response->assertStatus(200);
    }

    public function test_unauthorized_user_cannot_view_students(): void
    {
        $user = User::factory()->create();
        // Don't assign any role - user has no permissions

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/students');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_student(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $studentData = [
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'password' => 'password123',
            'phone' => '+1234567890',
            'date_of_birth' => '2010-01-01',
            'gender' => 'male',
            'admission_date' => '2024-09-01',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/students', $studentData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'student_id',
                    'admission_number',
                    'user' => [
                        'id',
                        'name',
                        'email',
                    ],
                ],
                'message',
            ]);
    }
}