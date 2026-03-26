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

        $farmId = $request->input('farm_id');
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $queryBase = [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        if ($farmId) {
            $farm = Farm::with(['zones.plots.plants'])->findOrFail($farmId);
            $metrics = $this->getFarmMetrics($farm, $queryBase);
        } else {
            $metrics = $this->getOverallMetrics($queryBase);
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

        // Get user's farms
        $farmIds = $user->farms()->pluck('farms.id')->toArray();

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
        $plotsCount = $farm->zones->flatMap->plots->count();
        $plantsCount = $farm->zones->flatMap->flatMap->plots->flatMap->plants->count();

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
    private function getOverallMetrics(array $dateRange): array
    {
        $farms = Farm::where('is_active', true)->get();
        $totalZones = 0;
        $totalPlots = 0;
        $totalPlants = 0;

        foreach ($farms as $farm) {
            $totalZones += $farm->zones()->count();
            $totalPlots += $farm->zones->flatMap->plots->count();
            $totalPlants += $farm->zones->flatMap->flatMap->plots->flatMap->plants->count();
        }

        $activitiesCount = Activity::whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']])->count();
        $harvestCount = Activity::where('type', 'harvesting')
            ->whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']])->count();
        $totalYield = Activity::where('type', 'harvesting')
            ->whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']])->sum('yield_amount');
        $totalYieldValue = Activity::where('type', 'harvesting')
            ->whereBetween('activity_date', [$dateRange['start_date'], $dateRange['end_date']])->sum('yield_total_value');

        $openProblems = ProblemReport::whereIn('status', ['reported', 'investigating'])->count();
        $resolvedProblems = ProblemReport::where('status', 'resolved')
            ->whereBetween('resolved_at', [$dateRange['start_date'], $dateRange['end_date']])->count();

        $pendingTasks = Task::where('status', 'pending')->count();
        $completedTasks = Task::where('status', 'completed')
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
