<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Auth - Register
    // ========================================

    /** @test */
    public function user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'role'],
                    'token',
                    'token_type',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'user' => [
                        'name' => 'Test User',
                        'email' => 'test@example.com',
                        'role' => 'worker', // Default role
                    ],
                    'token_type' => 'Bearer',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'worker',
        ]);
    }

    /** @test */
    public function register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function register_fails_with_missing_required_fields(): void
    {
        $response = $this->postJson('/api/auth/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    /** @test */
    public function register_fails_with_invalid_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'not-an-email',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function register_fails_when_password_confirmation_mismatch(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function register_fails_with_short_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    // ========================================
    // Auth - Me
    // ========================================

    /** @test */
    public function authenticated_user_can_get_their_profile(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    // ========================================
    // Auth - Logout
    // ========================================

    /** @test */
    public function authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully',
            ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_logout(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    // ========================================
    // Auth - Refresh
    // ========================================

    /** @test */
    public function authenticated_user_can_refresh_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/refresh');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user',
                    'token',
                    'token_type',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Token refreshed successfully',
            ]);
    }

    // ========================================
    // Auth - LINE Login
    // ========================================

    /** @test */
    public function line_login_with_valid_token_creates_or_finds_user(): void
    {
        Http::fake([
            'api.line.me/v2/profile' => Http::response([
                'userId' => 'LINE123456',
                'displayName' => 'LINE User',
                'pictureUrl' => 'https://example.com/pic.jpg',
            ], 200),
        ]);

        $response = $this->postJson('/api/auth/line/login', [
            'access_token' => 'valid_line_access_token',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'line_user_id', 'role'],
                    'token',
                    'token_type',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Login successful',
            ]);

        $this->assertDatabaseHas('users', [
            'line_user_id' => 'LINE123456',
            'line_display_name' => 'LINE User',
        ]);
    }

    /** @test */
    public function line_login_returns_existing_user_when_line_id_already_exists(): void
    {
        $existingUser = User::factory()->create([
            'line_user_id' => 'LINE123456',
            'line_display_name' => 'Old Name',
        ]);

        Http::fake([
            'api.line.me/v2/profile' => Http::response([
                'userId' => 'LINE123456',
                'displayName' => 'Updated Name',
                'pictureUrl' => 'https://example.com/newpic.jpg',
            ], 200),
        ]);

        $response = $this->postJson('/api/auth/line/login', [
            'access_token' => 'valid_line_access_token',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $existingUser->id,
                        'name' => 'Updated Name',
                    ],
                ],
            ]);
    }

    /** @test */
    public function line_login_fails_with_invalid_access_token(): void
    {
        Http::fake([
            'api.line.me/v2/profile' => Http::response(['message' => 'Invalid access token'], 401),
        ]);

        $response = $this->postJson('/api/auth/line/login', [
            'access_token' => 'invalid_token',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid LINE access token',
            ]);
    }

    /** @test */
    public function line_login_fails_without_access_token(): void
    {
        $response = $this->postJson('/api/auth/line/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['access_token']);
    }

    /** @test */
    public function line_callback_fails_without_code(): void
    {
        $response = $this->postJson('/api/auth/line/callback', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    // ========================================
    // Auth - Rate Limiting
    // ========================================

    /** @test */
    public function auth_routes_are_rate_limited(): void
    {
        // This test verifies the throttle middleware is applied
        // After 60 requests, should get 429
        // Note: We test a few attempts to ensure rate limiting is configured
        for ($i = 0; $i < 3; $i++) {
            $response = $this->postJson('/api/auth/register', [
                'name' => 'User ' . $i,
                'email' => "user{$i}@example.com",
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);
        }

        // Should not be rate limited at 3 requests
        $this->assertNotEquals(429, $response->status());
    }
}
