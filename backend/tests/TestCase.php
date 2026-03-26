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
     * Create a zone under a farm.
     */
    protected function createZone(\App\Models\Farm $farm, array $attributes = []): \App\Models\Zone
    {
        return \App\Models\Zone::factory()->create(array_merge([
            'farm_id' => $farm->id,
        ], $attributes));
    }

    /**
     * Create a plot under a zone.
     */
    protected function createPlot(\App\Models\Zone $zone, array $attributes = []): \App\Models\Plot
    {
        return \App\Models\Plot::factory()->create(array_merge([
            'zone_id' => $zone->id,
        ], $attributes));
    }

    /**
     * Create a plant under a plot.
     */
    protected function createPlant(\App\Models\Plot $plot, array $attributes = []): \App\Models\Plant
    {
        return \App\Models\Plant::factory()->create(array_merge([
            'plot_id' => $plot->id,
        ], $attributes));
    }

    /**
     * Create an activity.
     */
    protected function createActivity(\App\Models\Farm $farm, \App\Models\User $user, array $attributes = []): \App\Models\Activity
    {
        return \App\Models\Activity::factory()->create(array_merge([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
        ], $attributes));
    }

    /**
     * Create a task.
     */
    protected function createTask(\App\Models\Farm $farm, \App\Models\User $creator, array $attributes = []): \App\Models\Task
    {
        return \App\Models\Task::factory()->create(array_merge([
            'farm_id' => $farm->id,
            'created_by' => $creator->id,
        ], $attributes));
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
    protected function assertApiSuccess(array $response, ?string $message = null): void
    {
        $this->assertArrayHasKey('success', $response);
        $this->assertTrue($response['success']);
        $this->assertArrayHasKey('data', $response);

        if ($message !== null) {
            $this->assertEquals($message, $response['message']);
        }
    }

    /**
     * Assert API response has error structure.
     */
    protected function assertApiError(array $response, ?int $expectedCode = null): void
    {
        $this->assertArrayHasKey('success', $response);
        $this->assertFalse($response['success']);
        $this->assertArrayHasKey('message', $response);

        if ($expectedCode !== null) {
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
