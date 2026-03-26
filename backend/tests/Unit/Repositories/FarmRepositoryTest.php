<?php

namespace Tests\Unit\Repositories;

use App\Models\Farm;
use App\Models\Zone;
use App\Models\Plot;
use App\Models\Plant;
use App\Models\User;
use App\Repositories\FarmRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class FarmRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private FarmRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new FarmRepository();
    }

    /** @test */
    public function get_all_returns_paginated_results(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        Farm::factory()->count(5)->create();

        // Attach owner to farms
        Farm::all()->each(function ($farm) use ($owner) {
            \DB::table('farm_user')->insert([
                'farm_id' => $farm->id,
                'user_id' => $owner->id,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $request = Request::create('/api/farms', 'GET');
        $result = $this->repository->getAll($request);

        $this->assertEquals(5, $result->total());
    }

    /** @test */
    public function get_all_filters_by_is_active(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $activeFarm = Farm::factory()->create(['is_active' => true]);
        Farm::factory()->create(['is_active' => false]);

        \DB::table('farm_user')->insert([
            'farm_id' => $activeFarm->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $request = Request::create('/api/farms', 'GET', ['is_active' => 'true']);
        $result = $this->repository->getAll($request);

        $this->assertEquals(1, $result->total());
    }

    /** @test */
    public function get_all_filters_by_search(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        Farm::factory()->create(['name' => 'Mango Farm']);
        Farm::factory()->create(['name' => 'Papaya Farm']);

        Farm::all()->each(function ($farm) use ($owner) {
            \DB::table('farm_user')->insert([
                'farm_id' => $farm->id,
                'user_id' => $owner->id,
                'role' => 'owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $request = Request::create('/api/farms', 'GET', ['search' => 'Mango']);
        $result = $this->repository->getAll($request);

        $this->assertEquals(1, $result->total());
        $this->assertStringContainsString('Mango', $result->first()->name);
    }

    /** @test */
    public function get_by_id_returns_farm_with_relations(): void
    {
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);
        $plant = Plant::factory()->create(['plot_id' => $plot->id]);

        $result = $this->repository->getById($farm->id);

        $this->assertEquals($farm->id, $result->id);
        $this->assertTrue($result->relationLoaded('zones'));
        $this->assertTrue($result->relationLoaded('users'));
    }

    /** @test */
    public function create_farm_returns_farm_instance(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $result = $this->repository->create([
            'name' => 'New Farm',
            'description' => 'Test description',
            'owner_id' => $owner->id,
        ]);

        $this->assertInstanceOf(Farm::class, $result);
        $this->assertEquals('New Farm', $result->name);
        $this->assertDatabaseHas('farms', ['name' => 'New Farm']);
    }

    /** @test */
    public function update_farm_returns_updated_instance(): void
    {
        $farm = Farm::factory()->create(['name' => 'Old Name']);

        $result = $this->repository->update($farm->id, [
            'name' => 'Updated Name',
        ]);

        $this->assertEquals('Updated Name', $result->name);
        $this->assertDatabaseHas('farms', ['id' => $farm->id, 'name' => 'Updated Name']);
    }

    /** @test */
    public function delete_farm_removes_farm(): void
    {
        $farm = Farm::factory()->create();

        $result = $this->repository->delete($farm->id);

        $this->assertTrue($result);
        $this->assertSoftDeleted('farms', ['id' => $farm->id]);
    }

    /** @test */
    public function get_with_relations_returns_farm_with_all_relations(): void
    {
        $farm = Farm::factory()->create();
        Zone::factory()->count(2)->create(['farm_id' => $farm->id]);

        $result = $this->repository->getWithRelations($farm->id);

        $this->assertTrue($result->relationLoaded('zones'));
        $this->assertTrue($result->relationLoaded('users'));
        $this->assertTrue($result->relationLoaded('activities'));
        $this->assertCount(2, $result->zones);
    }

    /** @test */
    public function get_metrics_returns_correct_structure(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);
        Plant::factory()->count(3)->create(['plot_id' => $plot->id]);

        $request = Request::create('/api/farms/' . $farm->id . '/metrics', 'GET');
        $result = $this->repository->getMetrics($farm->id, $request);

        $this->assertArrayHasKey('farm', $result);
        $this->assertArrayHasKey('structures', $result);
        $this->assertArrayHasKey('activities', $result);
        $this->assertArrayHasKey('harvest', $result);
        $this->assertArrayHasKey('problems', $result);
        $this->assertArrayHasKey('tasks', $result);
        $this->assertArrayHasKey('period', $result);

        $this->assertEquals(1, $result['structures']['zones']);
        $this->assertEquals(1, $result['structures']['plots']);
        $this->assertEquals(3, $result['structures']['plants']);
    }
}
