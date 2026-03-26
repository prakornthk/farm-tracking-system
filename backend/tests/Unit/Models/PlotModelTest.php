<?php

namespace Tests\Unit\Models;

use App\Models\Plot;
use App\Models\Zone;
use App\Models\Plant;
use App\Models\Activity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlotModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function plot_model_exists(): void
    {
        $this->assertTrue(class_exists(Plot::class));
    }

    /** @test */
    public function plot_has_correct_fillable_attributes(): void
    {
        $plot = new Plot();
        $fillable = $plot->getFillable();

        $this->assertContains('zone_id', $fillable);
        $this->assertContains('name', $fillable);
        $this->assertContains('description', $fillable);
        $this->assertContains('size', $fillable);
        $this->assertContains('size_unit', $fillable);
        $this->assertContains('qr_code', $fillable);
        $this->assertContains('qr_code_data', $fillable);
        $this->assertContains('status', $fillable);
        $this->assertContains('sort_order', $fillable);
        $this->assertContains('is_active', $fillable);
        $this->assertContains('code', $fillable);
        $this->assertContains('crop_type', $fillable);
        $this->assertContains('total_plants', $fillable);
        $this->assertContains('area', $fillable);
        $this->assertContains('image_url', $fillable);
        $this->assertContains('note', $fillable);
    }

    /** @test */
    public function plot_has_correct_casts(): void
    {
        $plot = new Plot();
        $casts = $plot->getCasts();

        $this->assertEquals('decimal:2', $casts['size']);
        $this->assertEquals('boolean', $casts['is_active']);
    }

    /** @test */
    public function plot_uses_soft_deletes(): void
    {
        $plot = new Plot();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($plot));
    }

    /** @test */
    public function plot_belongs_to_zone_relationship(): void
    {
        $zone = Zone::factory()->create();
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);

        $this->assertEquals($zone->id, $plot->zone->id);
        $this->assertInstanceOf(Zone::class, $plot->zone);
    }

    /** @test */
    public function plot_has_many_plants_relationship(): void
    {
        $zone = Zone::factory()->create();
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);
        Plant::factory()->count(3)->create(['plot_id' => $plot->id]);

        $this->assertCount(3, $plot->plants);
        $this->assertInstanceOf(Plant::class, $plot->plants->first());
    }

    /** @test */
    public function plot_has_many_activities_relationship(): void
    {
        $zone = Zone::factory()->create();
        $plot = Plot::factory()->create(['zone_id' => $zone->id]);
        $user = \App\Models\User::factory()->create();

        \App\Models\Activity::factory()->count(2)->create([
            'farm_id' => $zone->farm_id,
            'user_id' => $user->id,
            'activitable_type' => Plot::class,
            'activitable_id' => $plot->id,
        ]);

        $this->assertCount(2, $plot->activities);
    }

    /** @test */
    public function plot_has_valid_statuses(): void
    {
        $validStatuses = ['active', 'inactive', 'harvested'];
        $this->assertEquals($validStatuses, Plot::STATUSES);
    }
}
