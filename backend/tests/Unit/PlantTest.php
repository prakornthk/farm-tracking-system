<?php

namespace Tests\Unit;

use App\Models\Plant;
use App\Models\Plot;
use App\Models\Activity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlantTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_plant_model_exists(): void
    {
        $this->assertTrue(class_exists(Plant::class));
    }

    /** @test */
    public function test_days_since_planted_calculation(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'planted_date' => now()->subDays(10),
        ]);

        $this->assertEquals(10, $plant->days_since_planted);
    }

    /** @test */
    public function test_days_until_harvest_calculation(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'expected_harvest_date' => now()->addDays(5),
        ]);

        $this->assertEquals(5, $plant->days_until_harvest);
    }

    /** @test */
    public function test_qr_data_attribute(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'qr_code_data' => json_encode(['type' => 'plant', 'plant_id' => 1]),
        ]);

        $this->assertIsArray($plant->qr_data);
        $this->assertEquals('plant', $plant->qr_data['type']);
    }

    /** @test */
    public function test_activity_types_constant(): void
    {
        $types = [
            'watering', 'fertilizing', 'pesticide', 'weeding',
            'pruning', 'harvesting', 'inspection', 'planting',
            'soil_preparation', 'other'
        ];

        $this->assertEquals($types, Activity::ACTIVITY_TYPES);
    }

    /** @test */
    public function test_days_since_planted_returns_null_when_no_date(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'planted_date' => null,
        ]);

        $this->assertNull($plant->days_since_planted);
    }

    /** @test */
    public function test_days_until_harvest_returns_null_when_no_date(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'expected_harvest_date' => null,
        ]);

        $this->assertNull($plant->days_until_harvest);
    }
}
