<?php

namespace Tests\Unit;

use App\Models\Plant;
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
        $plant->id = 1;

        // Since plant requires plot relationship, we'll test the structure
        $this->assertIsString($plant->getQrDataAttribute());
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

        $this->assertEquals($types, \App\Models\Activity::ACTIVITY_TYPES);
    }
}
