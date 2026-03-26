<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\Activity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Activity - List (Index)
    // ========================================

    /** @test */
    public function owner_can_list_activities_of_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $activity = $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/activities');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta',
                'links',
            ])
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function owner_can_filter_activities_by_farm_id(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $activity = $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/activities?farm_id={$farm->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(1, count($data));
    }

    /** @test */
    public function owner_can_filter_activities_by_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'watering',
        ]);
        $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'fertilizing',
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/activities?type=watering');

        $response->assertStatus(200);
        $data = $response->json('data');
        foreach ($data as $activity) {
            $this->assertEquals('watering', $activity['type']);
        }
    }

    /** @test */
    public function owner_can_filter_activities_by_date_range(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'activity_date' => now()->subDays(5),
        ]);
        $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'activity_date' => now()->subDays(20),
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/activities?start_date=' . now()->subDays(10)->toDateString() . '&end_date=' . now()->toDateString());

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(1, count($data));
    }

    // ========================================
    // Activity - Create (Store) - Single
    // ========================================

    /** @test */
    public function owner_can_create_single_activity(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities', [
                'activitable_type' => 'App\Models\Plot',
                'activitable_id' => $plot->id,
                'type' => 'watering',
                'description' => 'Watered the tomatoes',
                'quantity' => 10,
                'quantity_unit' => 'liter',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Activity created successfully',
                'data' => [
                    'type' => 'watering',
                    'description' => 'Watered the tomatoes',
                ],
            ]);

        $this->assertDatabaseHas('activities', [
            'type' => 'watering',
            'user_id' => $owner->id,
            'farm_id' => $farm->id,
        ]);
    }

    /** @test */
    public function owner_can_create_harvest_activity_with_yield(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities', [
                'activitable_type' => 'App\Models\Plot',
                'activitable_id' => $plot->id,
                'type' => 'harvesting',
                'description' => 'First harvest of the season',
                'yield_amount' => 50,
                'yield_unit' => 'kg',
                'yield_price_per_unit' => 25,
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        // yield_total_value should be calculated as 50 * 25 = 1250
        $this->assertEquals(1250, $data['yield_total_value']);
    }

    /** @test */
    public function activity_creation_validates_required_fields(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['activitable_type', 'activitable_id', 'type']);
    }

    /** @test */
    public function activity_creation_validates_invalid_activity_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities', [
                'activitable_type' => 'App\Models\Plot',
                'activitable_id' => $plot->id,
                'type' => 'invalid_type',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    /** @test */
    public function activity_creation_validates_invalid_activitable_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities', [
                'activitable_type' => 'App\Models\User',
                'activitable_id' => $owner->id,
                'type' => 'watering',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['activitable_type']);
    }

    /** @test */
    public function activity_creation_auto_determines_farm_id(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities', [
                'activitable_type' => 'App\Models\Plot',
                'activitable_id' => $plot->id,
                'type' => 'watering',
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertEquals($farm->id, $data['farm_id']);
    }

    // ========================================
    // Activity - Create Batch
    // ========================================

    /** @test */
    public function owner_can_create_batch_activities(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities/batch', [
                'activities' => [
                    [
                        'activitable_type' => 'App\Models\Plot',
                        'activitable_id' => $plot->id,
                        'type' => 'watering',
                        'description' => 'Morning watering',
                        'quantity' => 5,
                        'quantity_unit' => 'liter',
                    ],
                    [
                        'activitable_type' => 'App\Models\Plot',
                        'activitable_id' => $plot->id,
                        'type' => 'fertilizing',
                        'description' => 'Added NPK fertilizer',
                        'quantity' => 2,
                        'quantity_unit' => 'kg',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Activities created successfully',
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertDatabaseHas('activities', ['type' => 'watering', 'user_id' => $owner->id]);
        $this->assertDatabaseHas('activities', ['type' => 'fertilizing', 'user_id' => $owner->id]);
    }

    /** @test */
    public function batch_activity_requires_at_least_one_activity(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities/batch', [
                'activities' => [],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['activities']);
    }

    /** @test */
    public function batch_activity_max_limit_is_50(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $activities = array_fill(0, 51, [
            'activitable_type' => 'App\Models\Plot',
            'activitable_id' => $plot->id,
            'type' => 'watering',
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities/batch', [
                'activities' => $activities,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['activities']);
    }

    /** @test */
    public function batch_activity_calculates_yield_for_harvests(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/activities/batch', [
                'activities' => [
                    [
                        'activitable_type' => 'App\Models\Plot',
                        'activitable_id' => $plot->id,
                        'type' => 'harvesting',
                        'description' => 'Harvest batch 1',
                        'yield_amount' => 100,
                        'yield_unit' => 'kg',
                        'yield_price_per_unit' => 20,
                    ],
                ],
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertEquals(2000, $data[0]['yield_total_value']);
    }

    // ========================================
    // Activity - Show
    // ========================================

    /** @test */
    public function owner_can_view_activity_of_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $activity = $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/activities/{$activity->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $activity->id,
                    'type' => 'watering',
                ],
            ]);
    }

    // ========================================
    // Activity - By Target
    // ========================================

    /** @test */
    public function owner_can_get_activities_by_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'watering',
        ]);
        $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'fertilizing',
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plots/{$plot->id}/activities/plot");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function owner_can_get_activities_by_plant(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $activity = $this->createActivity($farm, $owner, [
            'activitable_type' => \App\Models\Plant::class,
            'activitable_id' => $plant->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plants/{$plant->id}/activities/plant");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function activity_by_target_fails_with_invalid_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plots/{$plot->id}/activities/invalid");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid target type',
            ]);
    }

    /** @test */
    public function activity_by_target_validates_farm_access(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        // Create a super_admin (not member of farm) trying to access
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->withHeaders($this->authHeaders($superAdmin))
            ->getJson("/api/plots/{$plot->id}/activities/plot");

        // Super admin bypass is handled by CheckFarmAccess middleware
        // But the check in byTarget also checks farm access
        $response->assertStatus(403);
    }
}
