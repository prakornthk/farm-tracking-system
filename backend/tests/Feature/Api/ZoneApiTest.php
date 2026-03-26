<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\Zone;
use App\Models\Plot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZoneApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Zone - List (Index) - nested under farm
    // ========================================

    /** @test */
    public function owner_can_list_zones_of_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone1 = $this->createZone($farm);
        $zone2 = $this->createZone($farm, ['name' => 'Zone Two']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/farms/{$farm->id}/zones");

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
    public function owner_cannot_list_zones_of_farm_they_dont_belong_to(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $otherFarm = Farm::factory()->create();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/farms/{$otherFarm->id}/zones");

        $response->assertStatus(403);
    }

    /** @test */
    public function super_admin_can_list_zones_of_any_farm(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $farm = Farm::factory()->create();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($superAdmin))
            ->getJson("/api/farms/{$farm->id}/zones");

        $response->assertStatus(200);
    }

    /** @test */
    public function zones_list_fails_when_farm_does_not_exist(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/farms/99999/zones');

        $response->assertStatus(404);
    }

    /** @test */
    public function owner_can_filter_zones_by_active_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $activeZone = $this->createZone($farm, ['is_active' => true]);
        $inactiveZone = $this->createZone($farm, ['is_active' => false]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/farms/{$farm->id}/zones?is_active=true");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(1, count($data));
    }

    // ========================================
    // Zone - Create (Store)
    // ========================================

    /** @test */
    public function owner_can_create_zone_in_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/farms/{$farm->id}/zones", [
                'name' => 'Greenhouse A',
                'description' => 'For tomatoes',
                'sort_order' => 1,
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Zone created successfully',
                'data' => [
                    'name' => 'Greenhouse A',
                    'description' => 'For tomatoes',
                    'farm_id' => $farm->id,
                ],
            ]);

        $this->assertDatabaseHas('zones', [
            'name' => 'Greenhouse A',
            'farm_id' => $farm->id,
        ]);
    }

    /** @test */
    public function zone_creation_validates_required_name(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/farms/{$farm->id}/zones", [
                'name' => '',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function worker_cannot_create_zone_in_farm_without_membership(): void
    {
        $worker = User::factory()->create(['role' => 'worker']);
        $farm = Farm::factory()->create();

        $response = $this->withHeaders($this->authHeaders($worker))
            ->postJson("/api/farms/{$farm->id}/zones", [
                'name' => 'Unauthorized Zone',
            ]);

        $response->assertStatus(403);
    }

    // ========================================
    // Zone - Show
    // ========================================

    /** @test */
    public function owner_can_view_zone_of_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/zones/{$zone->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $zone->id,
                    'name' => $zone->name,
                ],
            ]);
    }

    /** @test */
    public function owner_cannot_view_zone_of_other_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $otherFarm = Farm::factory()->create();
        $zone = $this->createZone($otherFarm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/zones/{$zone->id}");

        $response->assertStatus(403);
    }

    // ========================================
    // Zone - Update
    // ========================================

    /** @test */
    public function owner_can_update_zone(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/zones/{$zone->id}", [
                'name' => 'Updated Zone Name',
                'description' => 'Updated description',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Zone updated successfully',
                'data' => [
                    'name' => 'Updated Zone Name',
                ],
            ]);

        $this->assertDatabaseHas('zones', [
            'id' => $zone->id,
            'name' => 'Updated Zone Name',
        ]);
    }

    /** @test */
    public function update_zone_validates_sort_order_is_integer(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/zones/{$zone->id}", [
                'sort_order' => 'not-an-integer',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sort_order']);
    }

    // ========================================
    // Zone - Delete
    // ========================================

    /** @test */
    public function owner_can_delete_zone(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->deleteJson("/api/zones/{$zone->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Zone deleted successfully',
            ]);

        $this->assertSoftDeleted('zones', ['id' => $zone->id]);
    }

    /** @test */
    public function zone_deletion_cascades_to_plots(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->deleteJson("/api/zones/{$zone->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('zones', ['id' => $zone->id]);
        $this->assertSoftDeleted('plots', ['id' => $plot->id]);
    }
}
