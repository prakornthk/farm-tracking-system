<?php

namespace App\Repositories;

use App\Models\Task;
use App\Models\TaskAssignment;
use App\Repositories\Interfaces\TaskRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskRepository implements TaskRepositoryInterface
{
    /**
     * Get all tasks with pagination.
     */
    public function getAll(Request $request)
    {
        $query = Task::with(['creator', 'assignments.user', 'zone', 'plot']);

        if ($request->has('farm_id')) {
            $query->where('farm_id', $request->input('farm_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('assigned_to')) {
            $query->whereHas('assignments', function ($q) use ($request) {
                $q->where('user_id', $request->input('assigned_to'));
            });
        }

        if ($request->has('overdue')) {
            $query->where('due_date', '<', now())
                ->whereNotIn('status', ['completed', 'cancelled']);
        }

        return $query->orderByRaw("FIELD(COALESCE(priority, 'low'), 'urgent', 'high', 'medium', 'low') DESC")
            ->orderBy('due_date')
            ->paginate(min((int) $request->input('per_page', 15), 100));
    }

    /**
     * Get task by ID.
     */
    public function getById(int $id)
    {
        return Task::with(['creator', 'assignments.user', 'zone', 'plot', 'farm'])->findOrFail($id);
    }

    /**
     * Create a new task.
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $task = Task::create($data);

            // Attach assigned users
            if (isset($data['assigned_users']) && is_array($data['assigned_users'])) {
                $this->assignUsers($task->id, $data['assigned_users']);
            }

            return $task->fresh(['assignments.user', 'creator']);
        });
    }

    /**
     * Update task.
     */
    public function update(int $id, array $data)
    {
        $task = Task::findOrFail($id);

        return DB::transaction(function () use ($task, $data) {
            // Handle status change to completed
            if (isset($data['status']) && $data['status'] === 'completed') {
                $data['completed_at'] = now();
            }

            $task->update($data);

            // Update assigned users if provided
            if (isset($data['assigned_users'])) {
                // Remove existing assignments
                $task->assignments()->delete();

                // Add new assignments
                $this->assignUsers($task->id, $data['assigned_users']);
            }

            return $task->fresh(['assignments.user', 'creator']);
        });
    }

    /**
     * Delete task.
     */
    public function delete(int $id)
    {
        $task = Task::findOrFail($id);
        return $task->delete();
    }

    /**
     * Assign users to a task.
     */
    public function assignUsers(int $taskId, array $userIds)
    {
        $assignments = [];
        $now = now();

        foreach ($userIds as $userId) {
            $assignments[] = [
                'task_id' => $taskId,
                'user_id' => $userId,
                'status' => 'assigned',
                'assigned_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        TaskAssignment::insert($assignments);

        return true;
    }

    /**
     * Update assignment status.
     */
    public function updateAssignmentStatus(int $taskId, int $userId, string $status, ?string $notes = null)
    {
        $assignment = TaskAssignment::where('task_id', $taskId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $updateData = ['status' => $status];

        if ($notes) {
            $updateData['notes'] = $notes;
        }

        switch ($status) {
            case 'accepted':
                $updateData['accepted_at'] = now();
                break;
            case 'completed':
                $updateData['completed_at'] = now();
                break;
        }

        $assignment->update($updateData);

        // If all assignments are completed, mark task as completed
        $task = Task::findOrFail($taskId);
        $allCompleted = $task->assignments()->where('status', '!=', 'completed')->count() === 0;

        if ($allCompleted && $task->status !== 'completed') {
            $task->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }

        return $assignment;
    }
}
