<?php

namespace Tests\Unit\Models;

use App\Models\Task;
use App\Models\Farm;
use PHPUnit\Framework\TestCase;

class TaskModelTest extends TestCase
{
    /** @test */
    public function task_model_exists(): void
    {
        $this->assertTrue(class_exists(Task::class));
    }

    /** @test */
    public function task_has_correct_fillable_attributes(): void
    {
        $task = new Task();
        $fillable = $task->getFillable();

        $this->assertContains('farm_id', $fillable);
        $this->assertContains('created_by', $fillable);
        $this->assertContains('title', $fillable);
        $this->assertContains('description', $fillable);
        $this->assertContains('type', $fillable);
        $this->assertContains('priority', $fillable);
        $this->assertContains('status', $fillable);
        $this->assertContains('due_date', $fillable);
        $this->assertContains('completed_at', $fillable);
        $this->assertContains('plot_id', $fillable);
        $this->assertContains('zone_id', $fillable);
        $this->assertContains('metadata', $fillable);
    }

    /** @test */
    public function task_has_correct_casts(): void
    {
        $task = new Task();
        $casts = $task->getCasts();

        $this->assertEquals('date', $casts['due_date']);
        $this->assertEquals('datetime', $casts['completed_at']);
    }

    /** @test */
    public function task_uses_soft_deletes(): void
    {
        $task = new Task();
        $this->assertContains('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive($task));
    }

    /** @test */
    public function task_belongs_to_farm_relationship(): void
    {
        $task = new Task();
        $this->assertTrue(method_exists($task, 'farm'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $task->farm());
    }

    /** @test */
    public function task_belongs_to_creator_relationship(): void
    {
        $task = new Task();
        $this->assertTrue(method_exists($task, 'creator'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $task->creator());
    }

    /** @test */
    public function task_has_many_assignments_relationship(): void
    {
        $task = new Task();
        $this->assertTrue(method_exists($task, 'assignments'));
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\HasMany::class, $task->assignments());
    }

    /** @test */
    public function task_has_valid_priorities(): void
    {
        $expected = ['low', 'medium', 'high', 'urgent'];
        $this->assertEquals($expected, Task::PRIORITIES);
    }

    /** @test */
    public function task_has_valid_statuses(): void
    {
        $expected = ['pending', 'in_progress', 'completed', 'cancelled'];
        $this->assertEquals($expected, Task::STATUSES);
    }

    /** @test */
    public function task_has_valid_types(): void
    {
        $expected = ['activity', 'harvest', 'maintenance', 'inspection', 'other'];
        $this->assertEquals($expected, Task::TYPES);
    }
}
