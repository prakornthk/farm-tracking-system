<?php

namespace Tests\Unit;

use App\Models\Plant;
use App\Models\Activity;
use PHPUnit\Framework\TestCase;

class PlantTest extends TestCase
{
    /**
     * Test plant model exists.
     */
    public function test_plant_model_exists(): void
    {
        $this->assertTrue(class_exists(Plant::class));
    }

    /**
     * Test days since planted calculation.
     */
    public function test_days_since_planted_calculation(): void
    {
        $plant = new Plant();
        $plant->planted_date = now()->subDays(10);

        $this->assertEquals(10, $plant->days_since_planted);
    }

    /**
     * Test days until harvest calculation.
     */
    public function test_days_until_harvest_calculation(): void
    {
        $plant = new Plant();
        $plant->expected_harvest_date = now()->addDays(5);

        $this->assertEquals(5, $plant->days_until_harvest);
    }

    /**
     * Test QR data generation.
     */
    public function test_qr_data_attribute(): void
    {
        $plant = new Plant();
        $plant->qr_code_data = json_encode(['type' => 'plant', 'plant_id' => 1]);

        $this->assertIsArray($plant->qr_data);
        $this->assertEquals('plant', $plant->qr_data['type']);
    }

    /**
     * Test activity types constant exists.
     */
    public function test_activity_types_constant(): void
    {
        $types = [
            'watering',
            'fertilizing',
            'pesticide',
            'weeding',
            'pruning',
            'harvesting',
            'inspection',
            'planting',
            'soil_preparation',
            'other'
        ];

        $this->assertEquals($types, Activity::ACTIVITY_TYPES);
    }

    /**
     * Test days since planted returns null when no date.
     */
    public function test_days_since_planted_returns_null_when_no_date(): void
    {
        $plant = new Plant();
        $plant->planted_date = null;

        $this->assertNull($plant->days_since_planted);
    }

    /**
     * Test days until harvest returns null when no date.
     */
    public function test_days_until_harvest_returns_null_when_no_date(): void
    {
        $plant = new Plant();
        $plant->expected_harvest_date = null;

        $this->assertNull($plant->days_until_harvest);
    }
}
