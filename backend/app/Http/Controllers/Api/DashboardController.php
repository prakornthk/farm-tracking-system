<?php

namespace App\Http\Controllers\Api;

use App\Models\Activity;
use App\Models\Farm;
use App\Models\ProblemReport;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    /**
     * Get dashboard metrics.
     */
    public function metrics(Request $request): JsonResponse
    {
        $request->validate([
            'farm_id' => 'nullable|exists:farms,id',
        ]);

        $user = $request->user();
        $farmId = $request->input('farm_id');

        // If farm_id specified, verify user has access to this farm
        if ($farmId) {
            $isMember = $user->farms()->where('farms.id', $farmId)->exists();
            if (!$isMember && $user->role !== 'super_admin') {
                return $this->error('You do not have access to this farm', 403);
            }
            $farm = Farm::with(['zones.plots.plants'])->findOrFail($farmId);
            $metrics = $this->getFarmMetrics($farm, [
                'start_date' => $request->input('start_date', now()->startOfMonth()),
                'end_date' => $request->input('end_date', now()->endOfMonth()),
            ]);
        } else {
            $metrics = $this->getOverallMetrics([
                'start_date' => $request->input('start_date', now()->startOfMonth()),
                'end_date' => $request->input('end_date', now()->endOfMonth()),
            ], $user);
        }

        return $this->success($metrics, 'Dashboard metrics retrieved successfully');
    }

    /**
     * Get quick stats for today.
     */
    public function todayStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();

        // Get user's farms (or all for super_admin)
        if ($user->role === 'super_admin') {
            $farmIds = Farm::where('is_active', true)->pluck('id')->toArray();
        } else {
            $farmIds = $user->farms()->pluck('farms.id')->toArray();
        }

        // Today's activities count
        $todayActivities = Activity::whereIn('farm_id', $farmIds)
            ->whereDate('activity_date', $today)
            ->count();

        // Pending tasks
        $pendingTasks = Task::whereIn('farm_id', $farmIds)
            ->where('status', 'pending')
            ->count();

        // Overdue tasks
        $overdueTasks = Task::whereIn('farm_id', $farmIds)
            ->where('due_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();

        // Open problem reports
        $openProblems = ProblemReport::whereIn('farm_id', $farmIds)
            ->whereIn('status', ['reported', 'investigating'])
            ->count();

        // My tasks for today
        $myTasksToday = Task::whereIn('farm_id', $farmIds)
            ->whereHas('assignments', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereDate('due_date', $today)
            ->count();

        return $this->success([
            'date' => $today,
            'activities_today' => $todayActivities,
            'pending_tasks' => $pendingTasks,
            'overdue_tasks' => $overdueTasks,
            'open_problems' => $openProblems,
            'my_tasks_today' => $myTasksToday,
        ], 'Today stats retrieved successfully');
    }

    /**
     * Get farm-specific metrics.
     */
    private function getFarmMetrics(Farm $farm, array $dateRange): array
    {
        $zonesCount = $farm->zones()->count();
        
        // Use count queries instead of loading all relations into memory
        $plotsCount = \App\Models\Plot::whereHas('zone', fn($q) => $q->where('farm_id', $farm->id))->count();
        $plantsCount = \App\Models\Plant::whereHas('plot.zone', fn($q) => $q->where('farm_id', $farm->id))->count();

        // Activities in date range
        $activitiesQuery = $farm->activities()
            ->whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']]);

        $activitiesCount = $activitiesQuery->count();
        $activitiesByType = $activitiesQuery->get()->groupBy('type')->map->count();

        // Harvest stats
        $harvestsQuery = $farm->activities()
            ->where('type', 'harvesting')
            ->whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']]);

        $harvestCount = $harvestsQuery->count();
        $totalYield = $harvestsQuery->sum('yield_amount');
        $totalYieldValue = $harvestsQuery->sum('yield_total_value');

        // Problem reports
        $problemsQuery = $farm->problemReports()
            ->whereBetween('created_at', [$dateRange['start_date'], $dateRange['end_date']]);

        $openProblems = $problemsQuery->whereIn('status', ['reported', 'investigating'])->count();
        $resolvedProblems = $problemsQuery->where('status', 'resolved')->count();

        // Tasks
        $tasksQuery = $farm->tasks()
            ->whereBetween('created_at', [$dateRange['start_date'], $dateRange['end_date']]);

        $pendingTasks = $tasksQuery->where('status', 'pending')->count();
        $completedTasks = $tasksQuery->where('status', 'completed')->count();

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
                'total' => $activitiesCount,
                'by_type' => $activitiesByType,
            ],
            'harvest' => [
                'count' => $harvestCount,
                'total_yield' => $totalYield,
                'total_value' => $totalYieldValue,
            ],
            'problems' => [
                'open' => $openProblems,
                'resolved' => $resolvedProblems,
            ],
            'tasks' => [
                'pending' => $pendingTasks,
                'completed' => $completedTasks,
            ],
            'period' => $dateRange,
        ];
    }

    /**
     * Get overall metrics across all user's farms.
     */
    private function getOverallMetrics(array $dateRange, $user = null): array
    {
        // Get farms user has access to (or all farms for super_admin)
        $farmQuery = Farm::where('is_active', true)->with('zones.plots.plants');
        if ($user && $user->role !== 'super_admin') {
            $farmQuery->whereHas('users', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }
        $farms = $farmQuery->get();

        $farmIds = $farms->pluck('id')->toArray();

        // Use aggregate queries instead of iterating over loaded relations
        $totalZones = \App\Models\Zone::whereIn('farm_id', $farmIds)->count();
        $totalPlots = \App\Models\Plot::whereIn('zone_id', fn($q) =>
            $q->select('id')->from('zones')->whereIn('farm_id', $farmIds)
        )->count();
        $totalPlants = \App\Models\Plant::whereIn('plot_id', fn($q) =>
            $q->select('id')->from('plots')->whereIn('zone_id', fn($pq) =>
                $pq->select('id')->from('zones')->whereIn('farm_id', $farmIds)
            )
        )->count();

        $activitiesCount = Activity::whereIn('farm_id', $farmIds)
            ->whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']])
            ->count();

        $harvestQuery = Activity::whereIn('farm_id', $farmIds)
            ->where('type', 'harvesting')
            ->whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']]);
        $harvestCount = $harvestQuery->count();
        $totalYield = $harvestQuery->sum('yield_amount');
        $totalYieldValue = $harvestQuery->sum('yield_total_value');

        $problemsQuery = ProblemReport::whereIn('farm_id', $farmIds);
        $openProblems = $problemsQuery->whereIn('status', ['reported', 'investigating'])->count();
        $resolvedProblems = $problemsQuery->where('status', 'resolved')
            ->whereBetween('resolved_at', [$dateRange['start_date'], $dateRange['end_date']])->count();

        $tasksQuery = Task::whereIn('farm_id', $farmIds);
        $pendingTasks = $tasksQuery->where('status', 'pending')->count();
        $completedTasks = $tasksQuery->where('status', 'completed')
            ->whereBetween('completed_at', [$dateRange['start_date'], $dateRange['end_date']])->count();

        return [
            'structures' => [
                'farms' => $farms->count(),
                'zones' => $totalZones,
                'plots' => $totalPlots,
                'plants' => $totalPlants,
            ],
            'activities' => [
                'total' => $activitiesCount,
            ],
            'harvest' => [
                'count' => $harvestCount,
                'total_yield' => $totalYield,
                'total_value' => $totalYieldValue,
            ],
            'problems' => [
                'open' => $openProblems,
                'resolved' => $resolvedProblems,
            ],
            'tasks' => [
                'pending' => $pendingTasks,
                'completed' => $completedTasks,
            ],
            'period' => $dateRange,
        ];
    }
}
