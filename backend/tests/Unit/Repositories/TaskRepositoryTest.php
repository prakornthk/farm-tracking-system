<?php

namespace Tests\Unit\Repositories;

use App\Models\Farm;
use App\Models\Task;
use App\Models\TaskAssignment;
use App\Models\User;
use App\Repositories\TaskRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class TaskRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private TaskRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new TaskRepository();
    }

    /** @test */
    public function get_all_returns_paginated_results(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();

        Task::factory()->count(5)->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
        ]);

        $request = Request::create('/api/tasks', 'GET');
        $result = $this->repository->getAll($request);

        $this->assertEquals(5, $result->total());
    }

    /** @test */
    public function get_all_filters_by_status(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();

        Task::factory()->count(3)->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
            'status' => 'pending',
        ]);
        Task::factory()->count(2)->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $request = Request::create('/api/tasks', 'GET', ['status' => 'pending']);
        $result = $this->repository->getAll($request);

        $this->assertEquals(3, $result->total());
    }

    /** @test */
    public function get_all_filters_overdue_tasks(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();

        Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
            'due_date' => now()->subDays(3),
            'status' => 'pending',
        ]);
        Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
            'due_date' => now()->addDays(5),
            'status' => 'pending',
        ]);

        $request = Request::create('/api/tasks', 'GET', ['overdue' => '1']);
        $result = $this->repository->getAll($request);

        $this->assertEquals(1, $result->total());
    }

    /** @test */
    public function create_task_with_assignments(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $worker = User::factory()->create();

        $result = $this->repository->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
            'title' => 'New Task',
            'assigned_users' => [$worker->id],
        ]);

        $this->assertInstanceOf(Task::class, $result);
        $this->assertEquals('New Task', $result->title);
        $this->assertDatabaseHas('tasks', ['title' => 'New Task']);
        $this->assertDatabaseHas('task_assignments', [
            'task_id' => $result->id,
            'user_id' => $worker->id,
            'status' => 'assigned',
        ]);
    }

    /** @test */
    public function update_task_to_completed_sets_completed_at(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();

        $task = Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
            'status' => 'pending',
        ]);

        $result = $this->repository->update($task->id, [
            'status' => 'completed',
        ]);

        $this->assertEquals('completed', $result->status);
        $this->assertNotNull($result->completed_at);
    }

    /** @test */
    public function update_task_updates_assignments_when_provided(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();
        $worker1 = User::factory()->create();
        $worker2 = User::factory()->create();

        $task = Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
        ]);

        TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $worker1->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $result = $this->repository->update($task->id, [
            'assigned_users' => [$worker2->id],
        ]);

        $this->assertEquals(1, $result->assignments()->count());
        $this->assertEquals($worker2->id, $result->assignments()->first()->user_id);
    }

    /** @test */
    public function assign_users_creates_assignments(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();

        $task = Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
        ]);

        $worker1 = User::factory()->create();
        $worker2 = User::factory()->create();

        $result = $this->repository->assignUsers($task->id, [$worker1->id, $worker2->id]);

        $this->assertTrue($result);
        $this->assertEquals(2, $task->assignments()->count());
    }

    /** @test */
    public function update_assignment_status_accepts(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();

        $task = Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
        ]);

        $worker = User::factory()->create();

        TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $worker->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $result = $this->repository->updateAssignmentStatus($task->id, $worker->id, 'accepted');

        $this->assertEquals('accepted', $result->status);
        $this->assertNotNull($result->accepted_at);
    }

    /** @test */
    public function update_assignment_status_completes_all_auto_completes_task(): void
    {
        $user = User::factory()->create();
        $farm = Farm::factory()->create();

        $task = Task::factory()->create([
            'farm_id' => $farm->id,
            'created_by' => $user->id,
            'status' => 'pending',
        ]);

        $worker = User::factory()->create();

        TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $worker->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $this->repository->updateAssignmentStatus($task->id, $worker->id, 'completed');

        $task->refresh();
        $this->assertEquals('completed', $task->status);
        $this->assertNotNull($task->completed_at);
    }
}
