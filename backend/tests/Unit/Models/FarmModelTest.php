<?php

namespace Tests\Unit\Models;

use App\Models\Farm;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FarmModelTest extends TestCase
{
    use RefreshDatabase;

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
        $farm = Farm::factory()->create();
        Zone::factory()->count(3)->create(['farm_id' => $farm->id]);

        $this->assertCount(3, $farm->zones);
        $this->assertInstanceOf(Zone::class, $farm->zones->first());
    }

    /** @test */
    public function farm_belongs_to_many_users_relationship(): void
    {
        $farm = Farm::factory()->create();
        $users = User::factory()->count(2)->create();

        $farm->users()->attach($users->pluck('id'), ['role' => 'owner']);

        $this->assertCount(2, $farm->users);
    }

    /** @test */
    public function farm_has_many_activities_relationship(): void
    {
        $farm = Farm::factory()->create();
        $user = User::factory()->create();

        \App\Models\Activity::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'user_id' => $user->id,
        ]);

        $this->assertCount(2, $farm->activities);
    }

    /** @test */
    public function farm_has_many_tasks_relationship(): void
    {
        $farm = Farm::factory()->create();
        $user = User::factory()->create();

        \App\Models\Task::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
        ]);

        $this->assertCount(2, $farm->tasks);
    }

    /** @test */
    public function farm_has_many_problem_reports_relationship(): void
    {
        $farm = Farm::factory()->create();
        $user = User::factory()->create();

        \App\Models\ProblemReport::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'reporter_id' => $user->id,
        ]);

        $this->assertCount(2, $farm->problemReports);
    }
}
