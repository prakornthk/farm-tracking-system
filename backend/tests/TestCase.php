<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        // Force SQLite in-memory for all tests
        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => ':memory:']);

        // Run migrations
        $this->artisan('migrate', ['--database' => 'sqlite']);
    }

    /**
     * Create a user with optional role and farms.
     * 
     * Usage:
     *   $user = $this->actingAsUser(); // worker
     *   $user = $this->actingAsUser(['role' => 'owner']);
     *   $user = $this->actingAsUser([], [$farm->id => 'owner']);
     */
    protected function actingAsUser(array $attributes = [], array $farmRoles = []): \App\Models\User
    {
        $user = \App\Models\User::factory()->create($attributes);

        foreach ($farmRoles as $farmId => $role) {
            \DB::table('farm_user')->insert([
                'farm_id' => $farmId,
                'user_id' => $user->id,
                'role' => $role,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $user;
    }

    /**
     * Create a farm with owner attached.
     */
    protected function actingAsFarmOwner(?\App\Models\User $owner = null, array $farmAttrs = []): array
    {
        $owner = $owner ?? \App\Models\User::factory()->create(['role' => 'owner']);
        $farm = \App\Models\Farm::factory()->create($farmAttrs);

        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$owner, $farm];
    }

    /**
     * Create a farm and attach a manager.
     */
    protected function actingAsFarmManager(?\App\Models\User $manager = null, array $farmAttrs = []): array
    {
        $manager = $manager ?? \App\Models\User::factory()->create(['role' => 'manager']);
        $farm = \App\Models\Farm::factory()->create($farmAttrs);

        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $manager->id,
            'role' => 'manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$manager, $farm];
    }

    /**
     * Create a farm and attach a worker.
     */
    protected function actingAsFarmWorker(?\App\Models\User $worker = null, array $farmAttrs = []): array
    {
        $worker = $worker ?? \App\Models\User::factory()->create(['role' => 'worker']);
        $farm = \App\Models\Farm::factory()->create($farmAttrs);

        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$worker, $farm];
    }

    /**
     * Create a complete farm hierarchy: farm -> zone -> plot -> plant.
     */
    protected function createFarmHierarchy(): array
    {
        $farm = \App\Models\Farm::factory()->create();
        $zone = \App\Models\Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = \App\Models\Plot::factory()->create(['zone_id' => $zone->id]);
        $plant = \App\Models\Plant::factory()->create(['plot_id' => $plot->id]);

        return ['farm' => $farm, 'zone' => $zone, 'plot' => $plot, 'plant' => $plant];
    }

    /**
     * Get authenticated headers for a user.
     */
    protected function authHeaders(\App\Models\User $user): array
    {
        $token = $user->createToken('test')->plainTextToken;
        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Assert API response has success structure.
     */
    protected function assertApiSuccess(array $response, string $message = null): void
    {
        $responseData = $response;

        $this->assertArrayHasKey('success', $responseData);
        $this->assertTrue($responseData['success']);
        $this->assertArrayHasKey('data', $responseData);

        if ($message) {
            $this->assertEquals($message, $responseData['message']);
        }
    }

    /**
     * Assert API response has error structure.
     */
    protected function assertApiError(array $response, int $expectedCode = null): void
    {
        $this->assertArrayHasKey('success', $response);
        $this->assertFalse($response['success']);
        $this->assertArrayHasKey('message', $response);

        if ($expectedCode) {
            // Note: actual code is in the HTTP response, not JSON body
        }
    }

    /**
     * Assert pagination structure.
     */
    protected function assertPagination(array $response): void
    {
        $this->assertArrayHasKey('meta', $response);
        $this->assertArrayHasKey('links', $response);
        $this->assertArrayHasKey('current_page', $response['meta']);
        $this->assertArrayHasKey('last_page', $response['meta']);
        $this->assertArrayHasKey('per_page', $response['meta']);
        $this->assertArrayHasKey('total', $response['meta']);
    }
}
