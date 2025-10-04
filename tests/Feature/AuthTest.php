<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Run seeders to create roles
        $this->seed([
            \Database\Seeders\RoleSeeder::class,
            \Database\Seeders\SchoolSeeder::class,
        ]);
    }

    public function test_admin_can_login(): void
    {
        // Create admin user
        $admin = User::factory()->create([
            'email' => 'admin@demoschool.edu',
            'password' => bcrypt('password'),
        ]);
        $admin->assignRole('Admin');

        // Test login
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@demoschool.edu',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                ],
                'token',
            ]);

        $this->assertTrue($response->json('user.roles') === ['Admin']);
    }

    public function test_invalid_credentials_fail(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@demoschool.edu',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                ],
            ]);
    }

    public function test_user_can_logout(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $token = $admin->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logout successful']);
    }
}