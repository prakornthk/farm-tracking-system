<?php

namespace Tests\Unit\Models;

use App\Models\TaskAssignment;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskAssignmentModelTest extends TestCase
{
    use RefreshDatabase;

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
        $task = Task::factory()->create();
        $user = User::factory()->create();

        $assignment = TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $this->assertEquals($task->id, $assignment->task->id);
        $this->assertInstanceOf(Task::class, $assignment->task);
    }

    /** @test */
    public function task_assignment_belongs_to_user_relationship(): void
    {
        $task = Task::factory()->create();
        $user = User::factory()->create();

        $assignment = TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $this->assertEquals($user->id, $assignment->user->id);
        $this->assertInstanceOf(User::class, $assignment->user);
    }

    /** @test */
    public function task_assignment_is_pending_accessor(): void
    {
        $task = Task::factory()->create();
        $user = User::factory()->create();

        $assignment = TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $this->assertTrue($assignment->is_pending);

        $assignment->status = 'accepted';
        $assignment->save();

        $this->assertFalse($assignment->is_pending);
    }
}
