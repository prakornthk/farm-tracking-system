<?php

namespace Tests\Unit\Repositories;

use App\Models\Farm;
use App\Models\Activity;
use App\Models\Plot;
use App\Models\Plant;
use App\Models\User;
use App\Models\Zone;
use App\Repositories\ActivityRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class ActivityRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private ActivityRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new ActivityRepository();
    }

    /** @test */
    public function get_all_returns_paginated_results(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        Activity::factory()->count(5)->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
        ]);

        $request = Request::create('/api/activities', 'GET');
        $result = $this->repository->getAll($request);

        $this->assertEquals(5, $result->total());
    }

    /** @test */
    public function get_all_filters_by_farm_id(): void
    {
        $user = User::factory()->create();
        $farm1 = Farm::factory()->create();
        $farm2 = Farm::factory()->create();
        $zone1 = Zone::factory()->create(['farm_id' => $farm1->id]);
        $zone2 = Zone::factory()->create(['farm_id' => $farm2->id]);
        $plot1 = Plot::factory()->create(['zone_id' => $zone1->id]);
        $plot2 = Plot::factory()->create(['zone_id' => $zone2->id]);

        Activity::factory()->count(3)->create([
            'farm_id' => $farm1->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot1->id,
        ]);
        Activity::factory()->count(2)->create([
            'farm_id' => $farm2->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot2->id,
        ]);

        $request = Request::create('/api/activities', 'GET', ['farm_id' => $farm1->id]);
        $result = $this->repository->getAll($request);

        $this->assertEquals(3, $result->total());
    }

    /** @test */
    public function get_all_filters_by_type(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        Activity::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'watering',
        ]);
        Activity::factory()->count(3)->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'fertilizing',
        ]);

        $request = Request::create('/api/activities', 'GET', ['type' => 'watering']);
        $result = $this->repository->getAll($request);

        $this->assertEquals(2, $result->total());
    }

    /** @test */
    public function create_activity_sets_user_id_and_auto_farm_id(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        $result = $this->repository->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'watering',
            'description' => 'Test activity',
        ]);

        $this->assertInstanceOf(Activity::class, $result);
        $this->assertEquals('watering', $result->type);
        $this->assertDatabaseHas('activities', ['type' => 'watering']);
    }

    /** @test */
    public function create_harvest_activity_calculates_yield_total_value(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        $result = $this->repository->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'harvesting',
            'yield_amount' => 100,
            'yield_price_per_unit' => 50,
        ]);

        $this->assertEquals(5000, $result->yield_total_value);
    }

    /** @test */
    public function create_batch_creates_multiple_activities(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        $activities = [
            [
                'farm_id' => $farm->id,
                'user_id' => $user->id,
                'activitable_type' => Plot::class,
                'activitable_id' => $plot->id,
                'type' => 'watering',
                'description' => 'Batch activity 1',
            ],
            [
                'farm_id' => $farm->id,
                'user_id' => $user->id,
                'activitable_type' => Plot::class,
                'activitable_id' => $plot->id,
                'type' => 'fertilizing',
                'description' => 'Batch activity 2',
            ],
        ];

        $result = $this->repository->createBatch($activities);

        $this->assertCount(2, $result);
        $this->assertDatabaseHas('activities', ['type' => 'watering', 'description' => 'Batch activity 1']);
        $this->assertDatabaseHas('activities', ['type' => 'fertilizing', 'description' => 'Batch activity 2']);
    }

    /** @test */
    public function create_batch_calculates_yield_for_harvest_activities(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        $activities = [
            [
                'farm_id' => $farm->id,
                'user_id' => $user->id,
                'activitable_type' => Plot::class,
                'activitable_id' => $plot->id,
                'type' => 'harvesting',
                'yield_amount' => 200,
                'yield_price_per_unit' => 30,
            ],
        ];

        $result = $this->repository->createBatch($activities);

        $this->assertEquals(6000, $result[0]->yield_total_value);
    }

    /** @test */
    public function get_by_target_returns_plot_activities(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        Activity::factory()->count(3)->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
        ]);

        $request = Request::create('/api/plots/' . $plot->id . '/activities', 'GET');
        $result = $this->repository->getByTarget('plot', $plot->id, $request);

        $this->assertEquals(3, $result->total());
    }

    /** @test */
    public function get_by_target_returns_plant_activities(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);
        $plant = Plant::factory()->create(['plot_id' => $plot->id]);

        Activity::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
            'activitable_type' => Plant::class,
            'activitable_id' => $plant->id,
        ]);

        $request = Request::create('/api/plants/' . $plant->id . '/activities', 'GET');
        $result = $this->repository->getByTarget('plant', $plant->id, $request);

        $this->assertEquals(2, $result->total());
    }
}
