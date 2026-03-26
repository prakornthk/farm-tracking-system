<?php

namespace Tests\Unit\Models;

use App\Models\ProblemReport;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProblemReportModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function problem_report_model_exists(): void
    {
        $this->assertTrue(class_exists(ProblemReport::class));
    }

    /** @test */
    public function problem_report_has_correct_fillable_attributes(): void
    {
        $report = new ProblemReport();
        $fillable = $report->getFillable();

        $this->assertContains('farm_id', $fillable);
        $this->assertContains('reporter_id', $fillable);
        $this->assertContains('plot_id', $fillable);
        $this->assertContains('plant_id', $fillable);
        $this->assertContains('type', $fillable);
        $this->assertContains('severity', $fillable);
        $this->assertContains('status', $fillable);
        $this->assertContains('title', $fillable);
        $this->assertContains('description', $fillable);
        $this->assertContains('symptoms', $fillable);
        $this->assertContains('suspected_cause', $fillable);
        $this->assertContains('resolution', $fillable);
        $this->assertContains('image_url', $fillable);
        $this->assertContains('metadata', $fillable);
        $this->assertContains('resolved_at', $fillable);
    }

    /** @test */
    public function problem_report_has_correct_casts(): void
    {
        $report = new ProblemReport();
        $casts = $report->getCasts();

        $this->assertEquals('datetime', $casts['resolved_at']);
    }

    /** @test */
    public function problem_report_uses_soft_deletes(): void
    {
        $report = new ProblemReport();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($report));
    }

    /** @test */
    public function problem_report_belongs_to_farm_relationship(): void
    {
        $report = ProblemReport::factory()->create();

        $this->assertInstanceOf(Farm::class, $report->farm);
    }

    /** @test */
    public function problem_report_belongs_to_reporter_relationship(): void
    {
        $report = ProblemReport::factory()->create();

        $this->assertInstanceOf(User::class, $report->reporter);
    }

    /** @test */
    public function problem_report_has_valid_severities(): void
    {
        $expected = ['low', 'medium', 'high', 'critical'];
        $this->assertEquals($expected, ProblemReport::SEVERITIES);
    }

    /** @test */
    public function problem_report_has_valid_statuses(): void
    {
        $expected = ['reported', 'investigating', 'resolved', 'dismissed'];
        $this->assertEquals($expected, ProblemReport::STATUSES);
    }

    /** @test */
    public function problem_report_has_valid_problem_types(): void
    {
        $expected = ['disease', 'pest', 'dead'];
        $this->assertEquals($expected, ProblemReport::PROBLEM_TYPES);
    }
}
