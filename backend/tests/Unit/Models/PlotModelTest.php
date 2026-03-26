<?php

namespace Tests\Unit\Models;

use App\Models\Plot;
use PHPUnit\Framework\TestCase;

class PlotModelTest extends TestCase
{
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
        $plot = new Plot();
        $this->assertTrue(method_exists($plot, 'zone'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $plot->zone());
    }

    /** @test */
    public function plot_has_many_plants_relationship(): void
    {
        $plot = new Plot();
        $this->assertTrue(method_exists($plot, 'plants'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $plot->plants());
    }

    /** @test */
    public function plot_has_many_activities_relationship(): void
    {
        $plot = new Plot();
        $this->assertTrue(method_exists($plot, 'activities'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\MorphMany::class, $plot->activities());
    }

    /** @test */
    public function plot_has_valid_statuses(): void
    {
        $validStatuses = ['empty', 'planted', 'growing', 'harvesting', 'fallow'];
        $plot = new Plot();

        $this->assertEquals($validStatuses, Plot::STATUSES);
    }
}
