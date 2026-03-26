<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\Plant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlantApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Plant - List (Index) - nested under plot
    // ========================================

    /** @test */
    public function owner_can_list_plants_of_own_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant1 = $this->createPlant($plot, ['name' => 'Tomato 1']);
        $plant2 = $this->createPlant($plot, ['name' => 'Tomato 2']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plots/{$plot->id}/plants");

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
    public function plant_list_fails_when_plot_does_not_exist(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/plots/99999/plants');

        $response->assertStatus(404);
    }

    /** @test */
    public function owner_can_filter_plants_by_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $seedling = $this->createPlant($plot, ['status' => 'seedling']);
        $fruiting = $this->createPlant($plot, ['status' => 'fruiting']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plots/{$plot->id}/plants?status=seedling");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(1, count($data));
        $this->assertEquals('seedling', $data[0]['status']);
    }

    /** @test */
    public function owner_can_search_plants_by_name(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $this->createPlant($plot, ['name' => 'Mango Tree']);
        $this->createPlant($plot, ['name' => 'Papaya Tree']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plots/{$plot->id}/plants?search=Mango");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(1, count($data));
        $this->assertStringContainsString('Mango', $data[0]['name']);
    }

    // ========================================
    // Plant - Create (Store)
    // ========================================

    /** @test */
    public function owner_can_create_plant_in_own_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/plots/{$plot->id}/plants", [
                'name' => 'Cherry Tomato',
                'variety' => 'Sweet Cherry',
                'planted_date' => now()->toDateString(),
                'expected_harvest_date' => now()->addDays(60)->toDateString(),
                'status' => 'seedling',
                'quantity' => 10,
                'notes' => 'Planted in greenhouse',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Plant created successfully',
                'data' => [
                    'name' => 'Cherry Tomato',
                    'variety' => 'Sweet Cherry',
                    'plot_id' => $plot->id,
                ],
            ]);

        $this->assertDatabaseHas('plants', [
            'name' => 'Cherry Tomato',
            'plot_id' => $plot->id,
        ]);
    }

    /** @test */
    public function plant_creation_validates_required_name(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/plots/{$plot->id}/plants", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function plant_creation_validates_expected_harvest_after_planted(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/plots/{$plot->id}/plants", [
                'name' => 'Test Plant',
                'planted_date' => now()->toDateString(),
                'expected_harvest_date' => now()->subDays(5)->toDateString(), // Before planted
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['expected_harvest_date']);
    }

    /** @test */
    public function plant_creation_validates_invalid_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/plots/{$plot->id}/plants", [
                'name' => 'Test Plant',
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function plant_creation_validates_quantity_is_positive(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/plots/{$plot->id}/plants", [
                'name' => 'Test Plant',
                'quantity' => 0,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);
    }

    // ========================================
    // Plant - Show
    // ========================================

    /** @test */
    public function owner_can_view_plant_of_own_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/plants/{$plant->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $plant->id,
                    'name' => $plant->name,
                ],
            ]);
    }

    // ========================================
    // Plant - Update
    // ========================================

    /** @test */
    public function owner_can_update_plant(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/plants/{$plant->id}", [
                'name' => 'Updated Plant Name',
                'status' => 'vegetative',
                'variety' => 'New Variety',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Plant updated successfully',
                'data' => [
                    'name' => 'Updated Plant Name',
                ],
            ]);

        $this->assertDatabaseHas('plants', [
            'id' => $plant->id,
            'name' => 'Updated Plant Name',
        ]);
    }

    // ========================================
    // Plant - Delete
    // ========================================

    /** @test */
    public function owner_can_delete_plant(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->deleteJson("/api/plants/{$plant->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Plant deleted successfully',
            ]);

        $this->assertSoftDeleted('plants', ['id' => $plant->id]);
    }

    // ========================================
    // Plant - Find by QR Code
    // ========================================

    /** @test */
    public function owner_can_find_plant_by_qr_code(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot, ['qr_code' => 'qr/plant_123.svg']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/plants/find-by-qr?q=' . urlencode('qr/plant_123.svg'));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $plant->id,
                ],
            ]);
    }

    /** @test */
    public function find_plant_by_qr_fails_when_not_found(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/plants/find-by-qr?q=' . urlencode('nonexistent/qr.svg'));

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Plant not found',
            ]);
    }

    /** @test */
    public function find_plant_by_qr_requires_qr_code_parameter(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/plants/find-by-qr');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['qr_code']);
    }
}
