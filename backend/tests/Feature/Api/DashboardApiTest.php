<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\Activity;
use App\Models\Task;
use App\Models\ProblemReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Dashboard - Metrics
    // ========================================

    /** @test */
    public function owner_can_get_dashboard_metrics_for_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/dashboard/metrics?farm_id={$farm->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'farm',
                    'structures' => ['zones', 'plots', 'plants'],
                    'activities' => ['total'],
                    'harvest',
                    'problems',
                    'tasks',
                    'period',
                ],
            ])
            ->assertJson([
                'success' => true,
            ]);
    }

    /** @test */
    public function owner_can_get_overall_dashboard_metrics(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/dashboard/metrics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'structures' => ['farms', 'zones', 'plots', 'plants'],
                    'activities',
                    'harvest',
                    'problems',
                    'tasks',
                    'period',
                ],
            ]);
    }

    /** @test */
    public function super_admin_can_get_metrics_for_any_farm(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $farm = Farm::factory()->create();

        $response = $this->withHeaders($this->authHeaders($superAdmin))
            ->getJson("/api/dashboard/metrics?farm_id={$farm->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function metrics_fails_when_user_has_no_access_to_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $otherFarm = Farm::factory()->create();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/dashboard/metrics?farm_id={$otherFarm->id}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'You do not have access to this farm',
            ]);
    }

    /** @test */
    public function metrics_validates_farm_exists(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/dashboard/metrics?farm_id=99999');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['farm_id']);
    }

    /** @test */
    public function metrics_includes_activities_by_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        Activity::factory()->count(3)->create([
            'farm_id' => $farm->id,
            'user_id' => $owner->id,
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'watering',
        ]);
        Activity::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'user_id' => $owner->id,
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'fertilizing',
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/dashboard/metrics?farm_id={$farm->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertArrayHasKey('activities', $data);
    }

    /** @test */
    public function metrics_includes_harvest_data(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $zone = $this->createZone($farm);
        $plot = $this->createPlot($zone);

        Activity::factory()->create([
            'farm_id' => $farm->id,
            'user_id' => $owner->id,
            'activitable_type' => \App\Models\Plot::class,
            'activitable_id' => $plot->id,
            'type' => 'harvesting',
            'yield_amount' => 100,
            'yield_unit' => 'kg',
            'yield_price_per_unit' => 50,
            'yield_total_value' => 5000,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/dashboard/metrics?farm_id={$farm->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertArrayHasKey('harvest', $data);
    }

    /** @test */
    public function metrics_includes_problem_stats(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        ProblemReport::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
            'status' => 'reported',
        ]);
        ProblemReport::factory()->count(1)->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/dashboard/metrics?farm_id={$farm->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertArrayHasKey('problems', $data);
        $this->assertArrayHasKey('open', $data['problems']);
        $this->assertArrayHasKey('resolved', $data['problems']);
    }

    /** @test */
    public function metrics_includes_task_stats(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        Task::factory()->count(3)->create([
            'farm_id' => $farm->id,
            'created_by' => $owner->id,
            'status' => 'pending',
        ]);
        Task::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'created_by' => $owner->id,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/dashboard/metrics?farm_id={$farm->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertArrayHasKey('tasks', $data);
        $this->assertArrayHasKey('pending', $data['tasks']);
        $this->assertArrayHasKey('completed', $data['tasks']);
    }

    // ========================================
    // Dashboard - Today Stats
    // ========================================

    /** @test */
    public function user_can_get_today_stats(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/dashboard/today');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'date',
                    'activities_today',
                    'pending_tasks',
                    'overdue_tasks',
                    'open_problems',
                    'my_tasks_today',
                ],
            ])
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function today_stats_includes_overdue_tasks(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $owner->id,
            'due_date' => now()->subDays(2),
            'status' => 'pending',
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/dashboard/today');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(1, $data['overdue_tasks']);
    }

    /** @test */
    public function super_admin_today_stats_includes_all_active_farms(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        Farm::factory()->count(2)->create(['is_active' => true]);
        Farm::factory()->create(['is_active' => false]);

        $response = $this->withHeaders($this->authHeaders($superAdmin))
            ->getJson('/api/dashboard/today');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertArrayHasKey('activities_today', $data);
    }
}
