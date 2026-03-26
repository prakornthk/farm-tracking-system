<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ProblemReportStoreRequest;
use App\Http\Requests\ProblemReportUpdateRequest;
use App\Models\Farm;
use App\Repositories\Interfaces\ProblemReportRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProblemReportController extends ApiController
{
    public function __construct(
        private ProblemReportRepositoryInterface $problemReportRepository
    ) {}

    /**
     * Display a listing of problem reports.
     */
    public function index(Request $request): JsonResponse
    {
        $reports = $this->problemReportRepository->getAll($request);
        return $this->paginated($reports, 'Problem reports retrieved successfully');
    }

    /**
     * Store a newly created problem report.
     * SECURITY: Verifies user has access to the farm.
     */
    public function store(ProblemReportStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // SECURITY: Verify user has access to the farm
        $hasAccess = $user->role === 'super_admin' ||
            \App\Models\Farm::where('id', $validated['farm_id'])
                ->whereHas('users', fn($q) => $q->where('users.id', $user->id))
                ->exists();

        if (!$hasAccess) {
            return $this->error('Forbidden: You do not have access to this farm', 403);
        }

        $validated['reporter_id'] = $user->id;

        $report = $this->problemReportRepository->create($validated);
        return $this->success($report, 'Problem report created successfully', 201);
    }

    /**
     * Display the specified problem report.
     * SECURITY: Verifies user has access to the farm.
     */
    public function show(int $id): JsonResponse
    {
        $report = $this->problemReportRepository->getById($id);
        $user = request()->user();

        // SECURITY: Verify user has access to the farm
        $hasAccess = $user->role === 'super_admin' ||
            $report->farm->users()->where('users.id', $user->id)->exists();

        if (!$hasAccess) {
            return $this->error('Forbidden: You do not have access to this farm', 403);
        }

        return $this->success($report, 'Problem report retrieved successfully');
    }

    /**
     * Update the specified problem report.
     * SECURITY: Verifies user has access to the farm.
     */
    public function update(ProblemReportUpdateRequest $request, int $id): JsonResponse
    {
        $report = $this->problemReportRepository->getById($id);
        $user = $request->user();

        // SECURITY: Verify user has access to the farm
        $hasAccess = $user->role === 'super_admin' ||
            $report->farm->users()->where('users.id', $user->id)->exists();

        if (!$hasAccess) {
            return $this->error('Forbidden: You do not have access to this farm', 403);
        }

        $report = $this->problemReportRepository->update($id, $request->validated());
        return $this->success($report, 'Problem report updated successfully');
    }

    /**
     * Remove the specified problem report.
     * SECURITY: Verifies user has access to the farm.
     */
    public function destroy(int $id): JsonResponse
    {
        $report = $this->problemReportRepository->getById($id);
        $user = request()->user();

        // SECURITY: Verify user has access to the farm
        $hasAccess = $user->role === 'super_admin' ||
            $report->farm->users()->where('users.id', $user->id)->exists();

        if (!$hasAccess) {
            return $this->error('Forbidden: You do not have access to this farm', 403);
        }

        $this->problemReportRepository->delete($id);
        return $this->success(null, 'Problem report deleted successfully');
    }

    /**
     * Get problem reports for a specific farm.
     */
    public function byFarm(Request $request, int $farmId): JsonResponse
    {
        $reports = $this->problemReportRepository->getByFarm($farmId, $request);
        return $this->paginated($reports, 'Farm problem reports retrieved successfully');
    }
}
