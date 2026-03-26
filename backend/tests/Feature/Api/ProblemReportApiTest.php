<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\ProblemReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProblemReportApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Problem Report - List (Index)
    // ========================================

    /** @test */
    public function owner_can_list_problem_reports_of_own_farms(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $report = ProblemReport::factory()->create(['farm_id' => $farm->id]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/problem-reports');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta',
                'links',
            ])
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function owner_can_filter_problem_reports_by_severity(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        ProblemReport::factory()->create(['farm_id' => $farm->id, 'severity' => 'low']);
        ProblemReport::factory()->create(['farm_id' => $farm->id, 'severity' => 'critical']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/problem-reports?severity=critical');

        $response->assertStatus(200);
        $data = $response->json('data');
        foreach ($data as $report) {
            $this->assertEquals('critical', $report['severity']);
        }
    }

    /** @test */
    public function owner_can_filter_problem_reports_by_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        ProblemReport::factory()->create(['farm_id' => $farm->id, 'status' => 'reported']);
        ProblemReport::factory()->create(['farm_id' => $farm->id, 'status' => 'resolved', 'resolved_at' => now()]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/problem-reports?status=resolved');

        $response->assertStatus(200);
        $data = $response->json('data');
        foreach ($data as $report) {
            $this->assertEquals('resolved', $report['status']);
        }
    }

    // ========================================
    // Problem Report - Create (Store)
    // ========================================

    /** @test */
    public function owner_can_create_problem_report(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/problem-reports', [
                'farm_id' => $farm->id,
                'title' => 'Yellow leaves detected',
                'description' => 'Multiple tomato plants showing yellow leaves',
                'severity' => 'medium',
                'symptoms' => 'Yellow leaves starting from bottom',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Problem report created successfully',
                'data' => [
                    'title' => 'Yellow leaves detected',
                    'severity' => 'medium',
                    'status' => 'reported',
                ],
            ]);

        $this->assertDatabaseHas('problem_reports', [
            'title' => 'Yellow leaves detected',
            'reporter_id' => $owner->id,
        ]);
    }

    /** @test */
    public function problem_report_creation_validates_required_fields(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/problem-reports', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['farm_id', 'title', 'description']);
    }

    /** @test */
    public function problem_report_creation_validates_invalid_severity(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/problem-reports', [
                'farm_id' => $farm->id,
                'title' => 'Test',
                'description' => 'Test description',
                'severity' => 'invalid',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['severity']);
    }

    /** @test */
    public function worker_can_create_problem_report_in_own_farm(): void
    {
        [$worker, $farm] = $this->actingAsFarmWorker();

        $response = $this->withHeaders($this->authHeaders($worker))
            ->postJson('/api/problem-reports', [
                'farm_id' => $farm->id,
                'title' => 'Bug infestation',
                'description' => 'Aphids found on pepper plants',
                'severity' => 'high',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'reporter_id' => $worker->id,
                ],
            ]);
    }

    // ========================================
    // Problem Report - Show
    // ========================================

    /** @test */
    public function owner_can_view_problem_report_of_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $report = ProblemReport::factory()->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/problem-reports/{$report->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $report->id,
                    'title' => $report->title,
                ],
            ]);
    }

    // ========================================
    // Problem Report - Update
    // ========================================

    /** @test */
    public function owner_can_update_problem_report(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $report = ProblemReport::factory()->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/problem-reports/{$report->id}", [
                'title' => 'Updated title',
                'status' => 'investigating',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Problem report updated successfully',
                'data' => [
                    'title' => 'Updated title',
                ],
            ]);
    }

    /** @test */
    public function updating_problem_report_to_resolved_sets_resolved_at(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $report = ProblemReport::factory()->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/problem-reports/{$report->id}", [
                'status' => 'resolved',
                'resolution' => 'Applied appropriate pesticide treatment',
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('resolved', $data['status']);
        $this->assertNotNull($data['resolved_at']);
    }

    // ========================================
    // Problem Report - Delete
    // ========================================

    /** @test */
    public function owner_can_delete_problem_report(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $report = ProblemReport::factory()->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->deleteJson("/api/problem-reports/{$report->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Problem report deleted successfully',
            ]);

        $this->assertSoftDeleted('problem_reports', ['id' => $report->id]);
    }

    // ========================================
    // Problem Report - By Farm
    // ========================================

    /** @test */
    public function owner_can_get_problem_reports_by_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        ProblemReport::factory()->count(3)->create([
            'farm_id' => $farm->id,
            'reporter_id' => $owner->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/farms/{$farm->id}/problem-reports");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
