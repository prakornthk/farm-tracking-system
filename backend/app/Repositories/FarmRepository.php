<?php

namespace App\Repositories;

use App\Models\Farm;
use App\Repositories\Interfaces\FarmRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FarmRepository implements FarmRepositoryInterface
{
    /**
     * Get all farms with pagination.
     */
    public function getAll(Request $request)
    {
        $query = Farm::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return $query->with(['zones', 'users'])
            ->orderBy('created_at', 'desc')
            ->paginate(min((int) $request->input('per_page', 15), 100));
    }

    /**
     * Get farm by ID.
     */
    public function getById(int $id)
    {
        return Farm::with(['zones.plots.plants', 'users'])->findOrFail($id);
    }

    /**
     * Create a new farm.
     */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $farm = Farm::create($data);

            // Attach creator as owner if provided
            if (isset($data['owner_id'])) {
                $farm->users()->attach($data['owner_id'], ['role' => 'owner']);
            }

            return $farm;
        });
    }

    /**
     * Update farm.
     */
    public function update(int $id, array $data)
    {
        $farm = Farm::findOrFail($id);

        return DB::transaction(function () use ($farm, $data) {
            $farm->update($data);
            return $farm->fresh(['zones.plots.plants', 'users']);
        });
    }

    /**
     * Delete farm.
     */
    public function delete(int $id)
    {
        $farm = Farm::findOrFail($id);
        return $farm->delete();
    }

    /**
     * Get farm with relations.
     */
    public function getWithRelations(int $id)
    {
        return Farm::with([
            'zones.plots.plants',
            'users',
            'activities' => function ($query) {
                $query->latest()->limit(50);
            },
        ])->findOrFail($id);
    }

    /**
     * Get farm metrics for dashboard.
     */
    public function getMetrics(int $farmId, Request $request)
    {
        $farm = Farm::findOrFail($farmId);

        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $zonesCount = $farm->zones()->count();
        $plotsCount = \App\Models\Plot::whereHas('zone', fn($q) => $q->where('farm_id', $farmId))->count();
        $plantsCount = \App\Models\Plant::whereHas('plot.zone', fn($q) => $q->where('farm_id', $farmId))->count();

        // Activities in date range
        $activitiesInRange = $farm->activities()
            ->whereBetween('activity_date', [$startDate, $endDate])
            ->get();

        $activitiesByType = $activitiesInRange->groupBy('type')->map->count();

        // Harvest yield in date range
        $harvests = $activitiesInRange->where('type', 'harvesting');
        $totalYield = $harvests->sum('yield_amount');
        $totalYieldValue = $harvests->sum('yield_total_value');

        // Problem reports stats
        $problemReports = $farm->problemReports()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $openProblems = $problemReports->whereIn('status', ['reported', 'investigating'])->count();
        $resolvedProblems = $problemReports->where('status', 'resolved')->count();

        // Tasks stats
        $tasks = $farm->tasks()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $pendingTasks = $tasks->where('status', 'pending')->count();
        $completedTasks = $tasks->where('status', 'completed')->count();

        return [
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
            ],
            'structures' => [
                'zones' => $zonesCount,
                'plots' => $plotsCount,
                'plants' => $plantsCount,
            ],
            'activities' => [
                'total' => $activitiesInRange->count(),
                'by_type' => $activitiesByType,
            ],
            'harvest' => [
                'total_yield' => $totalYield,
                'total_value' => $totalYieldValue,
                'harvest_count' => $harvests->count(),
            ],
            'problems' => [
                'open' => $openProblems,
                'resolved' => $resolvedProblems,
                'total' => $problemReports->count(),
            ],
            'tasks' => [
                'pending' => $pendingTasks,
                'completed' => $completedTasks,
                'total' => $tasks->count(),
            ],
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ];
    }
}
