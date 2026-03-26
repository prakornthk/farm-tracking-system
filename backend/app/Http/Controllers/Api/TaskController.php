<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\TaskStoreRequest;
use App\Http\Requests\TaskUpdateRequest;
use App\Http\Requests\TaskAssignmentStatusRequest;
use App\Repositories\Interfaces\TaskRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends ApiController
{
    public function __construct(
        private TaskRepositoryInterface $taskRepository
    ) {}

    /**
     * Display a listing of tasks.
     */
    public function index(Request $request): JsonResponse
    {
        $tasks = $this->taskRepository->getAll($request);
        return $this->paginated($tasks, 'Tasks retrieved successfully');
    }

    /**
     * Store a newly created task.
     * SECURITY: Verifies user has access to the farm before creating task.
     */
    public function store(TaskStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        // SECURITY: Verify user has access to the farm
        $hasAccess = $user->role === 'super_admin' ||
            \App\Models\Farm::where('id', $data['farm_id'])
                ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
                ->exists();

        if (!$hasAccess) {
            return $this->error('Forbidden: You do not have access to this farm', 403);
        }

        $data['created_by'] = $user->id;

        $task = $this->taskRepository->create($data);
        return $this->success($task, 'Task created successfully', 201);
    }

    /**
     * Display the specified task.
     */
    public function show(int $id): JsonResponse
    {
        $task = $this->taskRepository->getById($id);
        return $this->success($task, 'Task retrieved successfully');
    }

    /**
     * Update the specified task.
     * SECURITY: Verifies user has access to the farm.
     */
    public function update(TaskUpdateRequest $request, int $id): JsonResponse
    {
        $task = $this->taskRepository->getById($id);
        $user = $request->user();

        // SECURITY: Verify user has access to the farm
        $hasAccess = $user->role === 'super_admin' ||
            $task->farm->users()->where('users.id', $user->id)->exists();

        if (!$hasAccess) {
            return $this->error('Forbidden: You do not have access to this farm', 403);
        }

        $task = $this->taskRepository->update($id, $request->validated());
        return $this->success($task, 'Task updated successfully');
    }

    /**
     * Remove the specified task.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->taskRepository->delete($id);
        return $this->success(null, 'Task deleted successfully');
    }

    /**
     * Update task assignment status.
     * SECURITY: Only the assigned user OR a manager/owner of the farm can update assignment status.
     */
    public function updateAssignmentStatus(TaskAssignmentStatusRequest $request, int $taskId): JsonResponse
    {
        $validated = $request->validated();
        $currentUser = $request->user();

        $task = $this->taskRepository->getById($taskId);

        // SECURITY: Verify the current user is either:
        // 1. The assigned user themselves, OR
        // 2. A manager/owner of the farm (has elevated permissions)
        $isAssignedUser = $task->assignments->contains('user_id', $currentUser->id);
        $isFarmManager = $currentUser->role === 'super_admin' ||
            $task->farm->users()->where('users.id', $currentUser->id)
                ->whereIn('farm_user.role', ['owner', 'manager'])
                ->exists();

        if (!$isAssignedUser && !$isFarmManager) {
            return $this->error('Forbidden: You can only update your own task assignments', 403);
        }

        // Only the assigned user themselves can accept/reject/complete, managers can only update status
        $restrictedStatuses = ['accepted', 'rejected', 'completed'];
        if (!$isAssignedUser && in_array($validated['status'], $restrictedStatuses)) {
            return $this->error('Forbidden: Only the assigned user can set this status', 403);
        }

        $assignment = $this->taskRepository->updateAssignmentStatus(
            $taskId,
            $validated['user_id'],
            $validated['status'],
            $validated['notes'] ?? null
        );

        return $this->success($assignment, 'Assignment status updated successfully');
    }

    /**
     * Get my tasks (tasks assigned to the authenticated user).
     */
    public function myTasks(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $request->merge(['assigned_to' => $userId]);

        $tasks = $this->taskRepository->getAll($request);
        return $this->paginated($tasks, 'My tasks retrieved successfully');
    }
}
