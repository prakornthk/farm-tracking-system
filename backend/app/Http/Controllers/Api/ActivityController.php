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
            $data['farm_id'] = $this->getFarmIdFromTarget($data['activitable_type'], $data['activitable_id']);
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
                    $activityData['activitable_id']
                );
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
     */
    public function byTarget(Request $request, string $type, int $id): JsonResponse
    {
        if (!in_array($type, ['plot', 'plant'])) {
            return $this->error('Invalid target type', 400);
        }

        // Verify target exists
        if ($type === 'plot') {
            Plot::findOrFail($id);
        } else {
            Plant::findOrFail($id);
        }

        $activities = $this->activityRepository->getByTarget($type, $id, $request);
        return $this->paginated($activities, 'Activities retrieved successfully');
    }

    /**
     * Get farm ID from target.
     */
    private function getFarmIdFromTarget(string $type, int $id): int
    {
        if ($type === 'plot') {
            return Plot::findOrFail($id)->zone->farm_id;
        }

        return Plant::findOrFail($id)->plot->zone->farm_id;
    }
}
