<?php

namespace Tests\Unit\Models;

use App\Models\Farm;
use App\Models\User;
use App\Models\Zone;
use PHPUnit\Framework\TestCase;

class FarmModelTest extends TestCase
{
    /** @test */
    public function farm_model_exists(): void
    {
        $this->assertTrue(class_exists(Farm::class));
    }

    /** @test */
    public function farm_has_correct_fillable_attributes(): void
    {
        $farm = new Farm();
        $fillable = $farm->getFillable();

        $this->assertContains('name', $fillable);
        $this->assertContains('description', $fillable);
        $this->assertContains('location', $fillable);
        $this->assertContains('latitude', $fillable);
        $this->assertContains('longitude', $fillable);
        $this->assertContains('is_active', $fillable);
    }

    /** @test */
    public function farm_has_correct_casts(): void
    {
        $farm = new Farm();
        $casts = $farm->getCasts();

        $this->assertEquals('boolean', $casts['is_active']);
    }

    /** @test */
    public function farm_uses_soft_deletes(): void
    {
        $farm = new Farm();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($farm));
    }

    /** @test */
    public function farm_has_many_zones_relationship(): void
    {
        $farm = new Farm();
        $this->assertTrue(method_exists($farm, 'zones'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $farm->zones());
    }

    /** @test */
    public function farm_belongs_to_many_users_relationship(): void
    {
        $farm = new Farm();
        $this->assertTrue(method_exists($farm, 'users'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsToMany::class, $farm->users());
    }

    /** @test */
    public function farm_has_many_activities_relationship(): void
    {
        $farm = new Farm();
        $this->assertTrue(method_exists($farm, 'activities'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $farm->activities());
    }

    /** @test */
    public function farm_has_many_tasks_relationship(): void
    {
        $farm = new Farm();
        $this->assertTrue(method_exists($farm, 'tasks'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $farm->tasks());
    }

    /** @test */
    public function farm_has_many_problem_reports_relationship(): void
    {
        $farm = new Farm();
        $this->assertTrue(method_exists($farm, 'problemReports'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $farm->problemReports());
    }
}
