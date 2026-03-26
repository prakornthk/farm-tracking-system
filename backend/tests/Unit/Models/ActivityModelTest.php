<?php

namespace Tests\Unit\Models;

use App\Models\Activity;
use App\Models\Plot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function activity_model_exists(): void
    {
        $this->assertTrue(class_exists(Activity::class));
    }

    /** @test */
    public function activity_has_correct_fillable_attributes(): void
    {
        $activity = new Activity();
        $fillable = $activity->getFillable();

        $this->assertContains('farm_id', $fillable);
        $this->assertContains('user_id', $fillable);
        $this->assertContains('activitable_type', $fillable);
        $this->assertContains('activitable_id', $fillable);
        $this->assertContains('type', $fillable);
        $this->assertContains('description', $fillable);
        $this->assertContains('quantity', $fillable);
        $this->assertContains('quantity_unit', $fillable);
        $this->assertContains('yield_amount', $fillable);
        $this->assertContains('yield_unit', $fillable);
        $this->assertContains('yield_price_per_unit', $fillable);
        $this->assertContains('yield_total_value', $fillable);
        $this->assertContains('metadata', $fillable);
        $this->assertContains('activity_date', $fillable);
    }

    /** @test */
    public function activity_has_correct_casts(): void
    {
        $activity = new Activity();
        $casts = $activity->getCasts();

        $this->assertEquals('decimal:2', $casts['quantity']);
        $this->assertEquals('decimal:2', $casts['yield_amount']);
        $this->assertEquals('decimal:12,2', $casts['yield_price_per_unit']);
        $this->assertEquals('decimal:14,2', $casts['yield_total_value']);
        $this->assertEquals('datetime', $casts['activity_date']);
    }

    /** @test */
    public function activity_uses_soft_deletes(): void
    {
        $activity = new Activity();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($activity));
    }

    /** @test */
    public function activity_belongs_to_farm_relationship(): void
    {
        $activity = Activity::factory()->create();

        $this->assertInstanceOf(\App\Models\Farm::class, $activity->farm);
    }

    /** @test */
    public function activity_belongs_to_user_relationship(): void
    {
        $activity = Activity::factory()->create();

        $this->assertInstanceOf(\App\Models\User::class, $activity->user);
    }

    /** @test */
    public function activity_has_morphed_relationship(): void
    {
        $activity = Activity::factory()->create([
            'activitable_type' => Plot::class,
        ]);

        $this->assertInstanceOf(Plot::class, $activity->activitable);
    }

    /** @test */
    public function activity_has_valid_types(): void
    {
        $expectedTypes = [
            'watering', 'fertilizing', 'pesticide', 'spraying', 'weeding',
            'pruning', 'harvesting', 'inspection', 'planting',
            'soil_preparation', 'other'
        ];

        $this->assertEquals($expectedTypes, Activity::ACTIVITY_TYPES);
    }
}
