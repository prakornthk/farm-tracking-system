<?php

namespace App\Repositories;

use App\Models\Activity;
use App\Models\Plant;
use App\Models\Plot;
use App\Repositories\Interfaces\ActivityRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityRepository implements ActivityRepositoryInterface
{
    /**
     * Get all activities with pagination.
     */
    public function getAll(Request $request)
    {
        $query = Activity::with(['user', 'farm', 'activitable']);

        if ($request->has('farm_id')) {
            $query->where('farm_id', $request->input('farm_id'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('start_date')) {
            $query->where('activity_date', '>=', $request->input('start_date'));
        }

        if ($request->has('end_date')) {
            $query->where('activity_date', '<=', $request->input('end_date'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        return $query->orderBy('activity_date', 'desc')
            ->paginate($request->input('per_page', 20));
    }

    /**
     * Get activity by ID.
     */
    public function getById(int $id)
    {
        return Activity::with(['user', 'farm', 'activitable'])->findOrFail($id);
    }

    /**
     * Create a single activity.
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Calculate yield value if harvest
            if (isset($data['type']) && $data['type'] === 'harvesting') {
                if (isset($data['yield_amount']) && isset($data['yield_price_per_unit'])) {
                    $data['yield_total_value'] = $data['yield_amount'] * $data['yield_price_per_unit'];
                }
            }

            return Activity::create($data);
        });
    }

    /**
     * Create multiple activities in batch (multi-target).
     */
    public function createBatch(array $activities)
    {
        return DB::transaction(function () use ($activities) {
            $created = [];

            foreach ($activities as $activityData) {
                // Calculate yield value if harvest
                if (isset($activityData['type']) && $activityData['type'] === 'harvesting') {
                    if (isset($activityData['yield_amount']) && isset($activityData['yield_price_per_unit'])) {
                        $activityData['yield_total_value'] = $activityData['yield_amount'] * $activityData['yield_price_per_unit'];
                    }
                }

                $created[] = Activity::create($activityData);
            }

            return $created;
        });
    }

    /**
     * Get activities for a specific target (plot or plant).
     */
    public function getByTarget(string $type, int $id, Request $request)
    {
        $modelClass = $type === 'plot' ? Plot::class : Plant::class;
        $model = $modelClass::findOrFail($id);

        $query = $model->activities();

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('start_date')) {
            $query->where('activity_date', '>=', $request->input('start_date'));
        }

        if ($request->has('end_date')) {
            $query->where('activity_date', '<=', $request->input('end_date'));
        }

        return $query->with(['user'])
            ->orderBy('activity_date', 'desc')
            ->paginate($request->input('per_page', 20));
    }
}
