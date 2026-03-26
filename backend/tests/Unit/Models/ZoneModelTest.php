<?php

namespace Tests\Unit\Models;

use App\Models\Zone;
use App\Models\Farm;
use App\Models\Plot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ZoneModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function zone_model_exists(): void
    {
        $this->assertTrue(class_exists(Zone::class));
    }

    /** @test */
    public function zone_has_correct_fillable_attributes(): void
    {
        $zone = new Zone();
        $fillable = $zone->getFillable();

        $this->assertContains('farm_id', $fillable);
        $this->assertContains('name', $fillable);
        $this->assertContains('description', $fillable);
        $this->assertContains('qr_code', $fillable);
        $this->assertContains('sort_order', $fillable);
        $this->assertContains('is_active', $fillable);
    }

    /** @test */
    public function zone_uses_soft_deletes(): void
    {
        $zone = new Zone();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($zone));
    }

    /** @test */
    public function zone_belongs_to_farm_relationship(): void
    {
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);

        $this->assertEquals($farm->id, $zone->farm->id);
        $this->assertInstanceOf(Farm::class, $zone->farm);
    }

    /** @test */
    public function zone_has_many_plots_relationship(): void
    {
        $farm = Farm::factory()->create();
        $zone = Zone::factory()->create(['farm_id' => $farm->id]);
        Plot::factory()->count(3)->create(['zone_id' => $zone->id]);

        $this->assertCount(3, $zone->plots);
        $this->assertInstanceOf(Plot::class, $zone->plots->first());
    }

    /** @test */
    public function zone_has_correct_casts(): void
    {
        $zone = new Zone();
        $casts = $zone->getCasts();

        $this->assertEquals('boolean', $casts['is_active']);
        $this->assertEquals('integer', $casts['sort_order']);
    }
}
