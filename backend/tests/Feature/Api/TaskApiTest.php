<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Farm;
use App\Models\Task;
use App\Models\TaskAssignment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    // ========================================
    // Task - List (Index)
    // ========================================

    /** @test */
    public function owner_can_list_tasks_of_own_farms(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $task = $this->createTask($farm, $owner);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/tasks');

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
    public function owner_can_filter_tasks_by_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $pendingTask = $this->createTask($farm, $owner, ['status' => 'pending']);
        $completedTask = $this->createTask($farm, $owner, ['status' => 'completed', 'completed_at' => now()]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/tasks?status=pending');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(1, count($data));
        foreach ($data as $task) {
            $this->assertEquals('pending', $task['status']);
        }
    }

    /** @test */
    public function owner_can_filter_tasks_by_priority(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $this->createTask($farm, $owner, ['priority' => 'high']);
        $this->createTask($farm, $owner, ['priority' => 'low']);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/tasks?priority=high');

        $response->assertStatus(200);
        $data = $response->json('data');
        foreach ($data as $task) {
            $this->assertEquals('high', $task['priority']);
        }
    }

    /** @test */
    public function owner_can_filter_tasks_overdue(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $overdueTask = $this->createTask($farm, $owner, [
            'due_date' => now()->subDays(5),
            'status' => 'pending',
        ]);
        $futureTask = $this->createTask($farm, $owner, [
            'due_date' => now()->addDays(5),
            'status' => 'pending',
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson('/api/tasks?overdue=1');

        $response->assertStatus(200);
        $data = $response->json('data');
        $overdueIds = array_column($data, 'id');
        $this->assertContains($overdueTask->id, $overdueIds);
    }

    // ========================================
    // Task - Create (Store)
    // ========================================

    /** @test */
    public function owner_can_create_task_in_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/tasks', [
                'farm_id' => $farm->id,
                'title' => 'Water the tomatoes',
                'description' => 'Use 10L per plant',
                'type' => 'activity',
                'priority' => 'high',
                'due_date' => now()->addDays(3)->toDateString(),
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Task created successfully',
                'data' => [
                    'title' => 'Water the tomatoes',
                    'priority' => 'high',
                    'status' => 'pending',
                ],
            ]);

        $this->assertDatabaseHas('tasks', [
            'title' => 'Water the tomatoes',
            'farm_id' => $farm->id,
            'created_by' => $owner->id,
        ]);
    }

    /** @test */
    public function task_creation_with_assigned_users(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $worker = User::factory()->create(['role' => 'worker']);
        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/tasks', [
                'farm_id' => $farm->id,
                'title' => 'Task with assignment',
                'assigned_users' => [$worker->id],
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertArrayHasKey('assignments', $data);
    }

    /** @test */
    public function task_creation_validates_required_fields(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/tasks', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['farm_id', 'title']);
    }

    /** @test */
    public function task_creation_validates_invalid_priority(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/tasks', [
                'farm_id' => $farm->id,
                'title' => 'Test Task',
                'priority' => 'invalid_priority',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['priority']);
    }

    /** @test */
    public function task_creation_validates_invalid_type(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();

        $response = $this->withHeaders($this->authHeaders($owner))
            ->postJson('/api/tasks', [
                'farm_id' => $farm->id,
                'title' => 'Test Task',
                'type' => 'invalid_type',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type']);
    }

    /** @test */
    public function worker_cannot_create_task_in_farm_they_dont_belong_to(): void
    {
        $worker = User::factory()->create(['role' => 'worker']);
        $farm = Farm::factory()->create();

        $response = $this->withHeaders($this->authHeaders($worker))
            ->postJson('/api/tasks', [
                'farm_id' => $farm->id,
                'title' => 'Unauthorized Task',
            ]);

        $response->assertStatus(403);
    }

    // ========================================
    // Task - Show
    // ========================================

    /** @test */
    public function owner_can_view_task_of_own_farm(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $task = $this->createTask($farm, $owner);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->getJson("/api/tasks/{$task->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $task->id,
                    'title' => $task->title,
                ],
            ]);
    }

    /** @test */
    public function worker_cannot_view_task_of_farm_they_dont_belong_to(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $task = $this->createTask($farm, $owner);

        $otherWorker = User::factory()->create(['role' => 'worker']);

        $response = $this->withHeaders($this->authHeaders($otherWorker))
            ->getJson("/api/tasks/{$task->id}");

        $response->assertStatus(403);
    }

    // ========================================
    // Task - Update
    // ========================================

    /** @test */
    public function owner_can_update_task(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $task = $this->createTask($farm, $owner);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/tasks/{$task->id}", [
                'title' => 'Updated Task Title',
                'status' => 'in_progress',
                'priority' => 'urgent',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Task updated successfully',
                'data' => [
                    'title' => 'Updated Task Title',
                ],
            ]);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated Task Title',
            'priority' => 'urgent',
        ]);
    }

    /** @test */
    public function updating_task_to_completed_sets_completed_at(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $task = $this->createTask($farm, $owner);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->putJson("/api/tasks/{$task->id}", [
                'status' => 'completed',
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotNull($data['completed_at']);
    }

    // ========================================
    // Task - Delete
    // ========================================

    /** @test */
    public function owner_can_delete_task(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $task = $this->createTask($farm, $owner);

        $response = $this->withHeaders($this->authHeaders($owner))
            ->deleteJson("/api/tasks/{$task->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Task deleted successfully',
            ]);

        $this->assertSoftDeleted('tasks', ['id' => $task->id]);
    }

    /** @test */
    public function worker_cannot_delete_task(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $worker = User::factory()->create(['role' => 'worker']);
        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $task = $this->createTask($farm, $owner);

        $response = $this->withHeaders($this->authHeaders($worker))
            ->deleteJson("/api/tasks/{$task->id}");

        // Only owner/manager can delete
        $response->assertStatus(403);
    }

    // ========================================
    // Task - Update Assignment Status
    // ========================================

    /** @test */
    public function assigned_user_can_accept_task(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $worker = User::factory()->create(['role' => 'worker']);
        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $task = $this->createTask($farm, $owner);
        TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $worker->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders($worker))
            ->patchJson("/api/tasks/{$task->id}/assignment-status", [
                'user_id' => $worker->id,
                'status' => 'accepted',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['status' => 'accepted'],
            ]);
    }

    /** @test */
    public function assigned_user_can_complete_task(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $worker = User::factory()->create(['role' => 'worker']);
        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $task = $this->createTask($farm, $owner);
        TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $worker->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders($worker))
            ->patchJson("/api/tasks/{$task->id}/assignment-status", [
                'user_id' => $worker->id,
                'status' => 'completed',
                'notes' => 'Done!',
            ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('completed', $data['status']);
    }

    /** @test */
    public function non_assigned_user_cannot_update_assignment_status(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $worker = User::factory()->create(['role' => 'worker']);
        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $task = $this->createTask($farm, $owner);

        $response = $this->withHeaders($this->authHeaders($worker))
            ->patchJson("/api/tasks/{$task->id}/assignment-status", [
                'user_id' => $worker->id,
                'status' => 'accepted',
            ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function manager_can_update_assignment_status_for_any_assigned_user(): void
    {
        [$manager, $farm] = $this->actingAsFarmManager();
        $worker = User::factory()->create(['role' => 'worker']);
        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $task = $this->createTask($farm, $manager);
        TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $worker->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders($manager))
            ->patchJson("/api/tasks/{$task->id}/assignment-status", [
                'user_id' => $worker->id,
                'status' => 'completed',
            ]);

        $response->assertStatus(200);
    }

    // ========================================
    // Task - My Tasks
    // ========================================

    /** @test */
    public function user_can_get_their_assigned_tasks(): void
    {
        [$owner, $farm] = $this->actingAsFarmOwner();
        $worker = User::factory()->create(['role' => 'worker']);
        \DB::table('farm_user')->insert([
            'farm_id' => $farm->id,
            'user_id' => $worker->id,
            'role' => 'worker',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $task = $this->createTask($farm, $owner);
        TaskAssignment::create([
            'task_id' => $task->id,
            'user_id' => $worker->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders($worker))
            ->getJson('/api/tasks/my');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
