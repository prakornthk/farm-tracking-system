<?php

namespace Tests\Unit\Models;

use App\Models\TaskAssignment;
use PHPUnit\Framework\TestCase;

class TaskAssignmentModelTest extends TestCase
{
    /** @test */
    public function task_assignment_model_exists(): void
    {
        $this->assertTrue(class_exists(TaskAssignment::class));
    }

    /** @test */
    public function task_assignment_has_correct_fillable_attributes(): void
    {
        $assignment = new TaskAssignment();
        $fillable = $assignment->getFillable();

        $this->assertContains('task_id', $fillable);
        $this->assertContains('user_id', $fillable);
        $this->assertContains('status', $fillable);
        $this->assertContains('notes', $fillable);
        $this->assertContains('assigned_at', $fillable);
        $this->assertContains('accepted_at', $fillable);
        $this->assertContains('completed_at', $fillable);
    }

    /** @test */
    public function task_assignment_has_correct_casts(): void
    {
        $assignment = new TaskAssignment();
        $casts = $assignment->getCasts();

        $this->assertEquals('datetime', $casts['assigned_at']);
        $this->assertEquals('datetime', $casts['accepted_at']);
        $this->assertEquals('datetime', $casts['completed_at']);
    }

    /** @test */
    public function task_assignment_belongs_to_task_relationship(): void
    {
        $assignment = new TaskAssignment();
        $this->assertTrue(method_exists($assignment, 'task'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $assignment->task());
    }

    /** @test */
    public function task_assignment_belongs_to_user_relationship(): void
    {
        $assignment = new TaskAssignment();
        $this->assertTrue(method_exists($assignment, 'user'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $assignment->user());
    }

    /** @test */
    public function task_assignment_is_pending_accessor(): void
    {
        $assignment = new TaskAssignment(['status' => 'assigned']);
        $this->assertTrue($assignment->is_pending);

        $assignment2 = new TaskAssignment(['status' => 'accepted']);
        $this->assertFalse($assignment2->is_pending);
    }
}
