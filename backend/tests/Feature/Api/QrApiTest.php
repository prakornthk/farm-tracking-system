<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // QR - Generate Plot QR
    // ========================================

    /** @test */
    public function owner_can_generate_qr_for_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/qr/plot/{$plot->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'qr_code',
                    'qr_code_url',
                    'qr_data',
                    'plot' => ['id', 'name', 'zone', 'farm'],
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'QR code generated successfully',
            ]);
    }

    /** @test */
    public function qr_plot_returns_404_when_plot_not_found(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/qr/plot/99999');

        $response->assertStatus(404);
    }

    // ========================================
    // QR - Generate Plant QR
    // ========================================

    /** @test */
    public function owner_can_generate_qr_for_plant(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/qr/plant/{$plant->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'qr_code',
                    'qr_code_url',
                    'qr_data',
                    'plant' => ['id', 'name', 'variety', 'plot', 'zone', 'farm'],
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'QR code generated successfully',
            ]);
    }

    /** @test */
    public function qr_plant_returns_404_when_plant_not_found(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/qr/plant/99999');

        $response->assertStatus(404);
    }

    // ========================================
    // QR - Generate as Image
    // ========================================

    /** @test */
    public function owner_can_get_qr_code_as_base64_image(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/as-image', [
                'type' => 'plot',
                'id' => $plot->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'qr_code',
                    'qr_data',
                ],
            ]);

        $data = $response->json('data');
        $this->assertStringStartsWith('data:image/svg+xml;base64,', $data['qr_code']);
    }

    /** @test */
    public function qr_as_image_supports_plant_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/as-image', [
                'type' => 'plant',
                'id' => $plant->id,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'QR code generated successfully',
            ]);
    }

    /** @test */
    public function qr_as_image_validates_required_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/as-image', [
                'id' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    /** @test */
    public function qr_as_image_validates_invalid_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/as-image', [
                'type' => 'invalid_type',
                'id' => 1,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    /** @test */
    public function qr_as_image_validates_required_id(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/as-image', [
                'type' => 'plot',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id']);
    }

    /** @test */
    public function qr_as_image_returns_404_for_nonexistent_plot(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/as-image', [
                'type' => 'plot',
                'id' => 99999,
            ]);

        $response->assertStatus(404);
    }

    // ========================================
    // QR - Scan
    // ========================================

    /** @test */
    public function owner_can_scan_valid_plot_qr_code(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $qrData = json_encode([
            'type' => 'plot',
            'farm_id' => $farm->id,
            'zone_id' => $zone->id,
            'plot_id' => $plot->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/scan', [
                'qr_data' => $qrData,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'plot',
                ],
                'message' => 'Plot found',
            ]);
    }

    /** @test */
    public function owner_can_scan_valid_plant_qr_code(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);
        $plant = $this->createPlant($plot);

        $qrData = json_encode([
            'type' => 'plant',
            'farm_id' => $farm->id,
            'zone_id' => $zone->id,
            'plot_id' => $plot->id,
            'plant_id' => $plant->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/scan', [
                'qr_data' => $qrData,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'plant',
                ],
                'message' => 'Plant found',
            ]);
    }

    /** @test */
    public function scan_fails_with_invalid_qr_data_structure(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/scan', [
                'qr_data' => json_encode(['invalid' => 'data']),
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid QR code data',
            ]);
    }

    /** @test */
    public function scan_fails_when_plot_not_found(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $qrData = json_encode([
            'type' => 'plot',
            'farm_id' => $farm->id,
            'zone_id' => 1,
            'plot_id' => 99999,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/scan', [
                'qr_data' => $qrData,
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Plot not found',
            ]);
    }

    /** @test */
    public function scan_fails_when_plant_not_found(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $qrData = json_encode([
            'type' => 'plant',
            'farm_id' => $farm->id,
            'zone_id' => 1,
            'plot_id' => 1,
            'plant_id' => 99999,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/scan', [
                'qr_data' => $qrData,
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Plant not found',
            ]);
    }

    /** @test */
    public function scan_fails_when_unknown_qr_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $qrData = json_encode([
            'type' => 'unknown_type',
            'id' => 1,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/scan', [
                'qr_data' => $qrData,
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Unknown QR code type',
            ]);
    }

    /** @test */
    public function scan_fails_without_qr_data(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/qr/scan', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['qr_data']);
    }
}
