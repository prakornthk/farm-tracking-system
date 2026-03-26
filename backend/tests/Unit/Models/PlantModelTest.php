<?php

namespace Tests\Unit\Models;

use App\Models\Plant;
use App\Models\Plot;
use App\Models\Activity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlantModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function plant_model_exists(): void
    {
        $this->assertTrue(class_exists(Plant::class));
    }

    /** @test */
    public function plant_has_correct_fillable_attributes(): void
    {
        $plant = new Plant();
        $fillable = $plant->getFillable();

        $this->assertContains('plot_id', $fillable);
        $this->assertContains('name', $fillable);
        $this->assertContains('variety', $fillable);
        $this->assertContains('planted_date', $fillable);
        $this->assertContains('expected_harvest_date', $fillable);
        $this->assertContains('status', $fillable);
        $this->assertContains('quantity', $fillable);
        $this->assertContains('notes', $fillable);
        $this->assertContains('qr_code', $fillable);
        $this->assertContains('qr_code_data', $fillable);
    }

    /** @test */
    public function plant_has_correct_casts(): void
    {
        $plant = new Plant();
        $casts = $plant->getCasts();

        $this->assertEquals('date', $casts['planted_date']);
        $this->assertEquals('date', $casts['expected_harvest_date']);
        $this->assertEquals('integer', $casts['quantity']);
    }

    /** @test */
    public function plant_uses_soft_deletes(): void
    {
        $plant = new Plant();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($plant));
    }

    /** @test */
    public function plant_belongs_to_plot_relationship(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create(['plot_id' => $plot->id]);

        $this->assertEquals($plot->id, $plant->plot->id);
        $this->assertInstanceOf(Plot::class, $plant->plot);
    }

    /** @test */
    public function plant_has_many_activities_relationship(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create(['plot_id' => $plot->id]);
        $user = \App\Models\User::factory()->create();

        Activity::factory()->count(2)->create([
            'farm_id' => $plot->zone->farm_id,
            'user_id' => $user->id,
            'activitable_type' => Plant::class,
            'activitable_id' => $plant->id,
        ]);

        $this->assertCount(2, $plant->activities);
    }

    /** @test */
    public function plant_has_valid_statuses(): void
    {
        $validStatuses = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvested', 'dead', 'removed'];
        $this->assertEquals($validStatuses, Plant::STATUSES);
    }

    /** @test */
    public function plant_days_since_planted_calculation(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'planted_date' => now()->subDays(10),
        ]);

        $this->assertEquals(10, $plant->days_since_planted);
    }

    /** @test */
    public function plant_days_until_harvest_calculation(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'expected_harvest_date' => now()->addDays(5),
        ]);

        $this->assertEquals(5, $plant->days_until_harvest);
    }

    /** @test */
    public function plant_days_since_planted_returns_null_when_no_date(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'planted_date' => null,
        ]);

        $this->assertNull($plant->days_since_planted);
    }

    /** @test */
    public function plant_days_until_harvest_returns_null_when_no_date(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'expected_harvest_date' => null,
        ]);

        $this->assertNull($plant->days_until_harvest);
    }

    /** @test */
    public function plant_qr_data_returns_json(): void
    {
        $plot = Plot::factory()->create();
        $plant = Plant::factory()->create([
            'plot_id' => $plot->id,
            'qr_code_data' => json_encode(['type' => 'plant', 'plant_id' => 123]),
        ]);

        $this->assertIsArray($plant->qr_data);
        $this->assertEquals('plant', $plant->qr_data['type']);
    }
}
