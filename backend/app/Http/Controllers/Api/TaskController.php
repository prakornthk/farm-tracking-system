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
     */
    public function store(TaskStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

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
     */
    public function update(TaskUpdateRequest $request, int $id): JsonResponse
    {
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
     */
    public function updateAssignmentStatus(TaskAssignmentStatusRequest $request, int $taskId): JsonResponse
    {
        $validated = $request->validated();

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
