<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\Zone;
use App\Models\Plot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlotApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Plot - List (Index) - nested under zone
    // ========================================

    /** @test */
    public function owner_can_list_plots_of_own_zone(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot1 = $this->createPlot($zone);
        $plot2 = $this->createPlot($zone, ['name' => 'Plot Two']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/zones/{$zone->id}/plots");

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
    public function plot_list_fails_when_zone_does_not_exist(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/zones/99999/plots');

        $response->assertStatus(404);
    }

    /** @test */
    public function owner_can_filter_plots_by_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plantedPlot = $this->createPlot($zone, ['status' => 'planted']);
        $emptyPlot = $this->createPlot($zone, ['status' => 'empty']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/zones/{$zone->id}/plots?status=planted");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(1, count($data));
        $this->assertEquals('planted', $data[0]['status']);
    }

    /** @test */
    public function owner_can_filter_plots_by_active_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $activePlot = $this->createPlot($zone, ['is_active' => true]);
        $inactivePlot = $this->createPlot($zone, ['is_active' => false]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/zones/{$zone->id}/plots?is_active=true");

        $response->assertStatus(200);
        $data = $response->json('data');
        $activeIds = array_column(array_filter($data, fn($p) => $p['is_active'] === true), 'id');
        $this->assertContains($activePlot->id, $activeIds);
    }

    // ========================================
    // Plot - Create (Store)
    // ========================================

    /** @test */
    public function owner_can_create_plot_in_own_zone(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/zones/{$zone->id}/plots", [
                'name' => 'Plot A1',
                'description' => 'Tomato area',
                'size' => 100,
                'size_unit' => 'sqm',
                'status' => 'planted',
                'sort_order' => 1,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Plot created successfully',
                'data' => [
                    'name' => 'Plot A1',
                    'zone_id' => $zone->id,
                ],
            ]);

        $this->assertDatabaseHas('plots', [
            'name' => 'Plot A1',
            'zone_id' => $zone->id,
        ]);
    }

    /** @test */
    public function plot_creation_validates_required_name(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/zones/{$zone->id}/plots", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function plot_creation_validates_invalid_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/zones/{$zone->id}/plots", [
                'name' => 'Test Plot',
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function plot_creation_validates_invalid_size_unit(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/zones/{$zone->id}/plots", [
                'name' => 'Test Plot',
                'size_unit' => 'invalid_unit',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['size_unit']);
    }

    /** @test */
    public function plot_creation_validates_negative_size(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/zones/{$zone->id}/plots", [
                'name' => 'Test Plot',
                'size' => -10,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['size']);
    }

    // ========================================
    // Plot - Show
    // ========================================

    /** @test */
    public function owner_can_view_plot_of_own_zone(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plots/{$plot->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $plot->id,
                    'name' => $plot->name,
                ],
            ]);
    }

    // ========================================
    // Plot - Update
    // ========================================

    /** @test */
    public function owner_can_update_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/plots/{$plot->id}", [
                'name' => 'Updated Plot Name',
                'status' => 'growing',
                'size' => 200,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Plot updated successfully',
                'data' => [
                    'name' => 'Updated Plot Name',
                ],
            ]);

        $this->assertDatabaseHas('plots', [
            'id' => $plot->id,
            'name' => 'Updated Plot Name',
            'status' => 'growing',
        ]);
    }

    // ========================================
    // Plot - Delete
    // ========================================

    /** @test */
    public function owner_can_delete_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->deleteJson("/api/plots/{$plot->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Plot deleted successfully',
            ]);

        $this->assertSoftDeleted('plots', ['id' => $plot->id]);
    }
}
