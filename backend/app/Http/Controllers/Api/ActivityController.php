<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ActivityStoreRequest;
use App\Http\Requests\ActivityBatchStoreRequest;
use App\Models\Activity;
use App\Models\Plant;
use App\Models\Plot;
use App\Repositories\Interfaces\ActivityRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends ApiController
{
    public function __construct(
        private ActivityRepositoryInterface $activityRepository
    ) {}

    /**
     * Display a listing of activities.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // If super_admin, show all. Otherwise filter by user's accessible farms.
        if ($user->role !== 'super_admin') {
            $farmIds = $user->farms()->pluck('farms.id')->toArray();
            if (empty($farmIds)) {
                return $this->paginated(collect([]), 'Activities retrieved successfully');
            }
            $request->merge(['accessible_farm_ids' => $farmIds]);
        }

        $activities = $this->activityRepository->getAll($request);
        return $this->paginated($activities, 'Activities retrieved successfully');
    }

    /**
     * Store a newly created activity (single target).
     */
    public function store(ActivityStoreRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Set user_id from authenticated user
        $data['user_id'] = $request->user()->id;

        // Auto-determine farm_id from target if not provided
        if (!isset($data['farm_id'])) {
            $data['farm_id'] = $this->getFarmIdFromTarget(
                $data['activitable_type'],
                $data['activitable_id'],
                $request->user()
            );
        } else {
            // SECURITY: If farm_id is provided, verify user has access
            $hasAccess = $request->user()->role === 'super_admin' ||
                \App\Models\Farm::where('id', $data['farm_id'])
                    ->whereHas('users', fn($q) => $q->where('users.id', $request->user()->id))
                    ->exists();
            if (!$hasAccess) {
                return $this->error('Forbidden: You do not have access to this farm', 403);
            }
        }

        $activity = $this->activityRepository->create($data);
        return $this->success($activity, 'Activity created successfully', 201);
    }

    /**
     * Store multiple activities (batch/multi-target).
     */
    public function storeBatch(ActivityBatchStoreRequest $request): JsonResponse
    {
        $activitiesData = $request->validated()['activities'];
        $userId = $request->user()->id;

        // Enrich each activity with user_id and farm_id
        foreach ($activitiesData as &$activityData) {
            $activityData['user_id'] = $userId;

            if (!isset($activityData['farm_id'])) {
                $activityData['farm_id'] = $this->getFarmIdFromTarget(
                    $activityData['activitable_type'],
                    $activityData['activitable_id'],
                    $request->user()
                );
            } else {
                // SECURITY: If farm_id is provided, verify user has access
                $hasAccess = $request->user()->role === 'super_admin' ||
                    \App\Models\Farm::where('id', $activityData['farm_id'])
                        ->whereHas('users', fn($q) => $q->where('users.id', $request->user()->id))
                        ->exists();
                if (!$hasAccess) {
                    return $this->error('Forbidden: You do not have access to this farm', 403);
                }
            }
        }

        $activities = $this->activityRepository->createBatch($activitiesData);
        return $this->success($activities, 'Activities created successfully', 201);
    }

    /**
     * Display the specified activity.
     */
    public function show(int $id): JsonResponse
    {
        $activity = $this->activityRepository->getById($id);
        return $this->success($activity, 'Activity retrieved successfully');
    }

    /**
     * Get activities for a specific target (plot or plant).
     * Route: GET /plots/{id}/activities/plot or /plants/{id}/activities/plant
     */
    public function byTarget(Request $request, int $id, string $type): JsonResponse
    {
        if (!in_array($type, ['plot', 'plant'])) {
            return $this->error('Invalid target type', 400);
        }

        $user = $request->user();

        // Verify target exists and get farm_id
        if ($type === 'plot') {
            $plot = Plot::findOrFail($id);
            $farmId = $plot->zone->farm_id;
        } else {
            $plant = Plant::findOrFail($id);
            $farmId = $plant->plot->zone->farm_id;
        }

        // SECURITY: Verify user has access to this farm
        $hasAccess = $user->role === 'super_admin' ||
            \App\Models\Farm::where('id', $farmId)
                ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
                ->exists();

        if (!$hasAccess) {
            return $this->error('Forbidden: You do not have access to this farm', 403);
        }

        $activities = $this->activityRepository->getByTarget($type, $id, $request);
        return $this->paginated($activities, 'Activities retrieved successfully');
    }

    /**
     * Get farm ID from target and verify user has access.
     */
    private function getFarmIdFromTarget(string $type, int $id, $user): int
    {
        if ($type === 'plot') {
            $plot = Plot::findOrFail($id);
            $farmId = $plot->zone->farm_id;
        } else {
            $plant = Plant::findOrFail($id);
            $farmId = $plant->plot->zone->farm_id;
        }

        // SECURITY: Verify user has access to this farm
        $hasAccess = $user->role === 'super_admin' ||
            \App\Models\Farm::where('id', $farmId)
                ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
                ->exists();

        if (!$hasAccess) {
            abort(403, 'Forbidden: You do not have access to this farm');
        }

        return $farmId;
    }
}
