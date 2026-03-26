<?php

namespace Tests\Unit\Models;

use App\Models\Zone;
use App\Models\Farm;
use App\Models\Plot;
use PHPUnit\Framework\TestCase;

class ZoneModelTest extends TestCase
{
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
        $zone = new Zone();
        $this->assertTrue(method_exists($zone, 'farm'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $zone->farm());
    }

    /** @test */
    public function zone_has_many_plots_relationship(): void
    {
        $zone = new Zone();
        $this->assertTrue(method_exists($zone, 'plots'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $zone->plots());
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
